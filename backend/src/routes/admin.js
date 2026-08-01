const express = require("express");
const path = require("path");
const db = require("../config/db");
const blockchain = require("../services/blockchain");
const ipfs = require("../services/ipfs");
const hash = require("../services/hash");
const pdfGen = require("../services/pdfGenerator");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * Get pending institutions
 */
router.get("/institutions/pending", async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, wallet_address, email, status, created_at FROM institutions WHERE status = 'pending'");
    res.json(result.rows);
  } catch (error) {
    console.error("[Admin Route] Get pending error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Get all institutions (both approved and pending)
 */
router.get("/institutions", async (req, res) => {
  try {
    const result = await db.query("SELECT id, name, wallet_address, email, status, created_at FROM institutions ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("[Admin Route] Get all error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Approve a pending institution
 * Triggers `authorizeIssuer` smart contract call
 */
router.post("/institutions/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch institution details
    const result = await db.query("SELECT * FROM institutions WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const institution = result.rows[0];
    if (institution.status !== "pending") {
      return res.status(400).json({ error: "Institution is already approved or rejected." });
    }

    console.log(`[Admin] Authorizing institution wallet on-chain: ${institution.wallet_address}`);

    // 2. Authorize wallet address on blockchain
    let txHash;
    try {
      txHash = await blockchain.authorizeIssuer(institution.wallet_address);
    } catch (blockchainError) {
      console.error("[Admin] Blockchain authorization failed:", blockchainError);
      return res.status(500).json({
        error: "Blockchain transaction failed. Institution not approved.",
        details: blockchainError.message
      });
    }

    // 3. Update database status to approved
    await db.query(
      "UPDATE institutions SET status = 'approved' WHERE id = $1",
      [id]
    );

    res.json({
      message: "Institution successfully approved and whitelisted on-chain.",
      txHash
    });
  } catch (error) {
    console.error("[Admin Route] Approve error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Reject a pending institution
 */
router.post("/institutions/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM institutions WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const institution = result.rows[0];
    if (institution.status !== "pending") {
      return res.status(400).json({ error: "Institution is already approved or rejected." });
    }

    // Update database status to rejected
    await db.query(
      "UPDATE institutions SET status = 'rejected' WHERE id = $1",
      [id]
    );

    res.json({
      message: "Institution registration rejected."
    });
  } catch (error) {
    console.error("[Admin Route] Reject error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Remove/Deauthorize an institution
 */
router.delete("/institutions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM institutions WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const institution = result.rows[0];

    // Deauthorize on blockchain if approved
    let txHash = null;
    if (institution.status === "approved" && institution.wallet_address) {
      try {
        console.log(`[Admin] Deauthorizing institution wallet on-chain: ${institution.wallet_address}`);
        txHash = await blockchain.deauthorizeIssuer(institution.wallet_address);
      } catch (bcError) {
        console.warn("[Admin] Blockchain deauthorization warning:", bcError.message);
      }
    }

    // Delete institution from database
    await db.query("DELETE FROM institutions WHERE id = $1", [id]);

    res.json({
      message: "Institution successfully removed and deauthorized on-chain.",
      txHash
    });
  } catch (error) {
    console.error("[Admin Route] Remove institution error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/institutions/:id/remove", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM institutions WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institution not found." });
    }

    const institution = result.rows[0];

    let txHash = null;
    if (institution.status === "approved" && institution.wallet_address) {
      try {
        txHash = await blockchain.deauthorizeIssuer(institution.wallet_address);
      } catch (bcError) {
        console.warn("[Admin] Blockchain deauthorization warning:", bcError.message);
      }
    }

    await db.query("DELETE FROM institutions WHERE id = $1", [id]);

    res.json({
      message: "Institution successfully removed and deauthorized on-chain.",
      txHash
    });
  } catch (error) {
    console.error("[Admin Route] Remove institution error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Get student certificate applications approved by colleges and pending admin (JNTUGV) approval
 */
router.get("/applications/pending", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cr.id, cr.roll_number, cr.course_name, cr.grade, cr.status, cr.created_at, inst.name as institution_name, s.name as student_name, s.registration_number 
       FROM certificate_requests cr 
       LEFT JOIN institutions inst ON cr.institution_id = inst.id 
       LEFT JOIN students s ON cr.student_id = s.id 
       WHERE cr.status = 'approved_by_college' 
       ORDER BY cr.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[Admin Route] Get pending applications error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Admin (JNTUGV) approves certificate application, generates PDF, uploads to IPFS, and issues on-chain
 */
router.post("/applications/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch application details with student and institution info
    const appQuery = await db.query(
      `SELECT cr.id, cr.roll_number, cr.course_name, cr.grade, cr.status, cr.student_id, cr.institution_id, cr.student_photo,
              inst.wallet_address as institution_wallet, inst.name as institution_name, 
              s.name as student_name, s.email as student_email, s.registration_number
       FROM certificate_requests cr
       LEFT JOIN institutions inst ON cr.institution_id = inst.id
       LEFT JOIN students s ON cr.student_id = s.id
       WHERE cr.id = $1`,
      [id]
    );

    if (appQuery.rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const app = appQuery.rows[0];
    if (app.status !== "approved_by_college") {
      return res.status(400).json({ error: "Application must be approved by the college first." });
    }

    // 2. Generate unique Certificate ID
    const certId = hash.generateCertId(app.registration_number, app.course_name, app.student_name);

    // Check if certificate already exists in DB
    const certCheck = await db.query("SELECT * FROM certificates WHERE cert_id = $1", [certId]);
    if (certCheck.rows.length > 0) {
      return res.status(400).json({ error: "A certificate for this student and course has already been issued." });
    }

    // 3. Generate PDF Buffer
    const formattedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const studentPhotoPath = app.student_photo
      ? path.join(__dirname, "../../storage/student_photos", app.student_photo)
      : null;

    let pdfBuffer;
    try {
      pdfBuffer = await pdfGen.generateCertificatePDF({
        studentName: app.student_name,
        registrationNumber: app.registration_number,
        courseName: app.course_name,
        grade: app.grade,
        issueDate: formattedDate,
        institutionName: app.institution_name,
        certId,
        issuerWallet: app.institution_wallet,
        studentPhoto: studentPhotoPath
      });
    } catch (pdfError) {
      console.error("[Admin Route] PDF Generation failed:", pdfError);
      return res.status(500).json({ error: "Failed to generate certificate PDF." });
    }

    // 4. Hash PDF Buffer
    const certHash = hash.hashBuffer(pdfBuffer);

    // 5. Pin to IPFS (Pinata)
    let ipfsCID;
    try {
      const fileName = `certificate_${app.registration_number}_${app.course_name.replace(/\s+/g, "_")}.pdf`;
      ipfsCID = await ipfs.pinFileToIPFS(pdfBuffer, fileName);
    } catch (ipfsError) {
      console.error("[Admin Route] IPFS upload failed:", ipfsError);
      return res.status(500).json({ error: "Failed to upload certificate PDF to IPFS." });
    }

    // 6. Submit to Polygon Blockchain
    let txHash;
    try {
      txHash = await blockchain.issueCertificate(certId, certHash, ipfsCID, app.institution_wallet);
    } catch (chainError) {
      console.error("[Admin Route] Blockchain registration failed:", chainError);
      return res.status(500).json({
        error: "Failed to register certificate on the blockchain registry.",
        details: chainError.message
      });
    }

    // 7. Save to Certificates Table
    await db.query(
      `INSERT INTO certificates 
       (cert_id, institution_id, student_id, student_name, course_name, grade, cert_hash, ipfs_cid, tx_hash, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'issued')`,
      [
        certId,
        app.institution_id,
        app.student_id,
        app.student_name,
        app.course_name,
        app.grade,
        certHash,
        ipfsCID,
        txHash
      ]
    );

    // Record on-chain transaction & audit log
    await blockchain.recordTxToDB({
      txHash,
      walletAddress: app.institution_wallet || "0xAdmin",
      actionType: "ISSUE",
      certId
    }).catch(() => {});

    await logAudit({
      userRole: "admin",
      action: "CERTIFICATE_ISSUANCE",
      details: `Admin issued certificate ${certId} for ${app.student_name}`,
      ipAddress: req.ip
    }).catch(() => {});

    // 8. Update Application Status to approved_by_admin
    await db.query(
      "UPDATE certificate_requests SET status = 'approved_by_admin', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({
      message: "Application approved by JNTUGV Admin. E-certificate successfully generated and secured on the blockchain.",
      certId,
      txHash,
      ipfsCID
    });
  } catch (error) {
    console.error("[Admin Route] Approve application error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Admin (JNTUGV) rejects certificate application
 */
router.post("/applications/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    const appQuery = await db.query("SELECT * FROM certificate_requests WHERE id = $1", [id]);
    if (appQuery.rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const app = appQuery.rows[0];
    if (app.status !== "approved_by_college") {
      return res.status(400).json({ error: "Application is not in a pending admin state." });
    }

    await db.query(
      "UPDATE certificate_requests SET status = 'rejected_by_admin', updated_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ message: "Application rejected by JNTUGV Admin." });
  } catch (error) {
    console.error("[Admin Route] Reject application error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Get all issued certificates from database sorted by date (default DESC)
 */
router.get("/certificates/issued", async (req, res) => {
  try {
    const { sort = "desc", search = "" } = req.query;
    const sortOrder = sort.toLowerCase() === "asc" ? "ASC" : "DESC";

    let searchClause = "";
    const params = [];
    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      searchClause = `WHERE LOWER(c.student_name) LIKE $1 OR LOWER(c.cert_id) LIKE $1 OR LOWER(c.course_name) LIKE $1 OR LOWER(s.registration_number) LIKE $1`;
    }

    // Safely check if revoked_certificates table exists
    const tableCheck = await db.query("SELECT to_regclass('public.revoked_certificates') as exists");
    const hasRevokedTable = Boolean(tableCheck.rows[0]?.exists);

    const revocationJoin = hasRevokedTable ? "LEFT JOIN revoked_certificates r ON c.cert_id = r.cert_id" : "";
    const revocationSelect = hasRevokedTable ? "r.reason as revocation_reason" : "NULL as revocation_reason";

    const queryStr = `
      SELECT 
        c.cert_id, 
        c.student_name, 
        c.course_name, 
        c.grade, 
        c.cert_hash, 
        c.ipfs_cid, 
        c.tx_hash, 
        c.status, 
        c.issued_at, 
        COALESCE(inst.name, 'JNTUGV Constituent College') as institution_name, 
        COALESCE(s.registration_number, 'N/A') as registration_number, 
        ${revocationSelect}
      FROM certificates c 
      LEFT JOIN institutions inst ON c.institution_id = inst.id 
      LEFT JOIN students s ON c.student_id = s.id 
      ${revocationJoin}
      ${searchClause}

      UNION ALL

      SELECT 
        cr.id::text as cert_id,
        s.name as student_name,
        cr.course_name,
        cr.grade,
        '0xPendingHash' as cert_hash,
        'PendingIPFS' as ipfs_cid,
        NULL as tx_hash,
        'issued' as status,
        cr.updated_at as issued_at,
        COALESCE(inst.name, 'JNTUGV Constituent College') as institution_name,
        cr.roll_number as registration_number,
        NULL as revocation_reason
      FROM certificate_requests cr
      LEFT JOIN institutions inst ON cr.institution_id = inst.id
      LEFT JOIN students s ON cr.student_id = s.id
      WHERE cr.status IN ('approved_by_admin', 'issued')
        AND NOT EXISTS (SELECT 1 FROM certificates c2 WHERE c2.student_id = cr.student_id AND c2.course_name = cr.course_name)

      ORDER BY issued_at ${sortOrder}
    `;

    const result = await db.query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error("[Admin Route] Get issued certificates error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

module.exports = router;
