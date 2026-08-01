const express = require("express");
const db = require("../config/db");
const blockchain = require("../services/blockchain");
const ipfs = require("../services/ipfs");
const hash = require("../services/hash");
const pdfGen = require("../services/pdfGenerator");
const { authenticateToken, requireInstitution } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

// Apply middleware
router.use(authenticateToken);
router.use(requireInstitution);

/**
 * Issue a Certificate
 */
router.post("/certificates/issue", async (req, res) => {
  const { studentEmail, courseName, grade, issueDate } = req.body;
  const institutionId = req.user.id;
  const institutionName = req.user.name;
  const institutionWallet = req.user.walletAddress;

  if (!studentEmail || !courseName || !grade) {
    return res.status(400).json({ error: "Student email, course name, and grade are required." });
  }

  const formattedDate = issueDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  try {
    // 1. Fetch student from DB
    const studentQuery = await db.query("SELECT * FROM students WHERE email = $1", [studentEmail]);
    if (studentQuery.rows.length === 0) {
      return res.status(404).json({ error: `Student with email ${studentEmail} not found in database.` });
    }

    const student = studentQuery.rows[0];

    // 2. Generate unique Certificate ID
    const certId = hash.generateCertId(student.registration_number, courseName, student.name);

    // Check if certificate already exists in DB
    const certCheck = await db.query("SELECT * FROM certificates WHERE cert_id = $1", [certId]);
    if (certCheck.rows.length > 0) {
      return res.status(400).json({ error: "A certificate for this student and course has already been issued." });
    }

    // 3. Generate PDF Buffer
    let pdfBuffer;
    try {
      pdfBuffer = await pdfGen.generateCertificatePDF({
        studentName: student.name,
        registrationNumber: student.registration_number,
        courseName,
        grade,
        issueDate: formattedDate,
        institutionName,
        certId,
        issuerWallet: institutionWallet,
        baseUrl: req.headers.origin || process.env.APP_BASE_URL || process.env.FRONTEND_URL
      });
    } catch (pdfError) {
      console.error("[Institution Route] PDF Generation failed:", pdfError);
      return res.status(500).json({ error: "Failed to generate certificate PDF." });
    }

    // 4. Hash PDF Buffer
    const certHash = hash.hashBuffer(pdfBuffer);

    // 5. Pin to IPFS (Pinata)
    let ipfsCID;
    try {
      const fileName = `certificate_${student.registration_number}_${courseName.replace(/\s+/g, "_")}.pdf`;
      ipfsCID = await ipfs.pinFileToIPFS(pdfBuffer, fileName);
    } catch (ipfsError) {
      console.error("[Institution Route] IPFS upload failed:", ipfsError);
      return res.status(500).json({ error: "Failed to upload certificate PDF to IPFS decentralized storage." });
    }

    // 6. Submit to Polygon Blockchain
    let txHash;
    try {
      txHash = await blockchain.issueCertificate(certId, certHash, ipfsCID, institutionWallet);
    } catch (chainError) {
      console.error("[Institution Route] Blockchain registration failed:", chainError);
      return res.status(500).json({
        error: "Failed to register certificate on the blockchain registry.",
        details: chainError.message
      });
    }

    // 7. Save to Database
    await db.query(
      `INSERT INTO certificates 
       (cert_id, institution_id, student_id, student_name, course_name, grade, cert_hash, ipfs_cid, tx_hash, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'issued')`,
      [
        certId,
        institutionId,
        student.id,
        student.name,
        courseName,
        grade,
        certHash,
        ipfsCID,
        txHash
      ]
    );

    // Record transaction & audit log
    await blockchain.recordTxToDB({
      txHash,
      walletAddress: institutionWallet || "0xInstitution",
      actionType: "ISSUE",
      certId
    }).catch(() => {});

    await logAudit({
      userRole: "institution",
      action: "CERTIFICATE_ISSUANCE",
      details: `Institution issued certificate ${certId} for ${student.name}`,
      ipAddress: req.ip
    }).catch(() => {});

    res.status(201).json({
      message: "Certificate generated, stored on IPFS, and secured on the blockchain.",
      certId,
      certHash,
      ipfsCID,
      txHash
    });
  } catch (error) {
    console.error("[Institution Route] General issuance error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * List Certificates issued by this institution
 */
router.get("/certificates", async (req, res) => {
  const institutionId = req.user.id;

  try {
    const result = await db.query(
      `SELECT c.cert_id, c.student_name, c.course_name, c.grade, c.cert_hash, c.ipfs_cid, c.tx_hash, c.status, c.issued_at, s.registration_number
       FROM certificates c 
       LEFT JOIN students s ON c.student_id = s.id 
       WHERE c.institution_id = $1 
       ORDER BY c.issued_at DESC`,
      [institutionId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[Institution Route] Get certificates error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Revoke Certificate
 */
router.post("/certificates/:certId/revoke", async (req, res) => {
  const { certId } = req.params;
  const institutionWallet = req.user.walletAddress;

  try {
    // 1. Verify certificate belongs to this institution
    const certQuery = await db.query("SELECT * FROM certificates WHERE cert_id = $1", [certId]);
    if (certQuery.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    const cert = certQuery.rows[0];
    if (cert.institution_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized. You did not issue this certificate." });
    }

    if (cert.status === "revoked") {
      return res.status(400).json({ error: "Certificate is already revoked." });
    }

    // 2. Submit Revocation to Blockchain
    let txHash;
    try {
      txHash = await blockchain.revokeCertificate(certId);
    } catch (chainError) {
      console.error("[Institution Route] Blockchain revocation failed:", chainError);
      return res.status(500).json({
        error: "Failed to register revocation on the blockchain.",
        details: chainError.message
      });
    }

    // 3. Update Database status
    await db.query(
      "UPDATE certificates SET status = 'revoked' WHERE cert_id = $1",
      [certId]
    );

    res.json({
      message: "Certificate status updated to REVOKED both on-chain and off-chain.",
      txHash
    });
  } catch (error) {
    console.error("[Institution Route] Revocation error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Get pending student certificate applications for this college
 */
router.get("/applications", async (req, res) => {
  const institutionId = req.user.id;

  try {
    const result = await db.query(
      `SELECT cr.id, cr.roll_number, cr.course_name, cr.grade, cr.status, cr.created_at, s.name as student_name 
       FROM certificate_requests cr 
       LEFT JOIN students s ON cr.student_id = s.id 
       WHERE cr.institution_id = $1 AND cr.status = 'pending_college' 
       ORDER BY cr.created_at DESC`,
      [institutionId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("[Institution Route] Get applications error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * College approves certificate application
 */
router.post("/applications/:id/approve", async (req, res) => {
  const { id } = req.params;
  const institutionId = req.user.id;

  try {
    // Verify application belongs to this institution and is pending_college
    const appQuery = await db.query("SELECT * FROM certificate_requests WHERE id = $1", [id]);
    if (appQuery.rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const application = appQuery.rows[0];
    if (application.institution_id !== institutionId) {
      return res.status(403).json({ error: "Unauthorized. This application belongs to another college." });
    }

    if (application.status !== "pending_college") {
      return res.status(400).json({ error: "Application is not in a pending college state." });
    }

    const { grade } = req.body;
    if (grade) {
      await db.query(
        "UPDATE certificate_requests SET status = 'approved_by_college', grade = $1, updated_at = NOW() WHERE id = $2",
        [grade, id]
      );
    } else {
      await db.query(
        "UPDATE certificate_requests SET status = 'approved_by_college', updated_at = NOW() WHERE id = $1",
        [id]
      );
    }

    res.json({ message: "Application approved by college and forwarded to JNTUGV Admin." });
  } catch (error) {
    console.error("[Institution Route] Approve application error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * College rejects certificate application
 */
router.post("/applications/:id/reject", async (req, res) => {
  const { id } = req.params;
  const institutionId = req.user.id;

  try {
    // Verify application
    const appQuery = await db.query("SELECT * FROM certificate_requests WHERE id = $1", [id]);
    if (appQuery.rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const application = appQuery.rows[0];
    if (application.institution_id !== institutionId) {
      return res.status(403).json({ error: "Unauthorized. This application belongs to another college." });
    }

    if (application.status !== "pending_college") {
      return res.status(400).json({ error: "Application is not in a pending college state." });
    }

    await db.query(
      "UPDATE certificate_requests SET status = 'rejected_by_college', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ message: "Application rejected by college." });
  } catch (error) {
    console.error("[Institution Route] Reject application error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
