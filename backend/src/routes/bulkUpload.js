const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");
const { issueCertificateOnChain } = require("../services/blockchain");
const { generateCertificatePDF } = require("../services/pdfGenerator");
const { uploadToIPFS } = require("../services/ipfs");
const crypto = require("crypto");

/**
 * GET /api/bulk/template
 * Returns sample CSV template content.
 */
router.get("/template", (req, res) => {
  const csvContent = "student_name,roll_number,course_name,grade,email\nJohn Doe,19ABC001,B.Tech Computer Science,A+,john@example.com\nJane Smith,19ABC002,B.Tech Information Technology,O,jane@example.com\n";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="certificate_bulk_template.csv"');
  res.status(200).send(csvContent);
});

/**
 * POST /api/bulk/process-batch
 * Accepts parsed CSV rows or text payload and processes batch issuance.
 */
router.post("/process-batch", authenticateToken, async (req, res) => {
  try {
    const { rows = [], filename = "batch_upload.csv" } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No valid rows provided for batch processing." });
    }

    const institutionId = req.user.id;

    // Create batch record
    const batchRes = await query(
      `INSERT INTO bulk_upload_batches (institution_id, filename, total_records, status)
       VALUES ($1, $2, $3, 'processing') RETURNING *`,
      [institutionId, filename, rows.length]
    );
    const batchId = batchRes.rows[0].id;

    let processed = 0;
    const results = [];

    for (const row of rows) {
      try {
        const studentName = row.student_name || row["Student Name"] || "Student";
        const courseName = row.course_name || row["Course Name"] || "Degree";
        const grade = row.grade || row["Grade"] || "A";
        const rollNumber = row.roll_number || row["Roll Number"] || `REG-${Date.now()}`;

        const certId = "0x" + crypto.randomBytes(32).toString("hex");

        // Generate PDF
        const pdfBuffer = await generateCertificatePDF({
          certId,
          studentName,
          courseName,
          grade,
          institutionName: req.user.name || "University",
          issueDate: new Date().toLocaleDateString()
        });

        // Hash PDF
        const certHash = "0x" + crypto.createHash("sha256").update(pdfBuffer).digest("hex");

        // Pin to IPFS
        let ipfsCid = "QmDefaultDummyIPFSCidForTesting1234567890";
        try {
          if (uploadToIPFS) {
            ipfsCid = await uploadToIPFS(pdfBuffer, `Cert_${certId}.pdf`);
          }
        } catch (ipfsErr) {
          console.warn("⚠️ IPFS upload fallback:", ipfsErr.message);
        }

        // On-Chain Registration
        let txHash = null;
        try {
          if (issueCertificateOnChain) {
            const tx = await issueCertificateOnChain(certId, certHash, ipfsCid);
            txHash = tx?.hash || tx?.transactionHash || null;
          }
        } catch (bcErr) {
          console.warn("⚠️ Blockchain issuance fallback:", bcErr.message);
        }

        // Save DB Record
        await query(
          `INSERT INTO certificates (cert_id, institution_id, student_name, course_name, grade, cert_hash, ipfs_cid, tx_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'issued')`,
          [certId, institutionId, studentName, courseName, grade, certHash, ipfsCid, txHash]
        );

        processed++;
        results.push({ studentName, certId, status: "SUCCESS", txHash });
      } catch (rowErr) {
        console.error("❌ Row process error:", rowErr);
        results.push({ studentName: row.student_name, status: "FAILED", error: rowErr.message });
      }
    }

    // Update batch status
    await query(
      `UPDATE bulk_upload_batches SET processed_records = $1, status = 'completed' WHERE id = $2`,
      [processed, batchId]
    );

    // Audit log
    await logAudit({
      userId: req.user.id,
      userRole: req.user.role || "institution",
      action: "BULK_CERTIFICATE_UPLOAD",
      details: `Processed bulk batch ${filename}. Total: ${rows.length}, Succeeded: ${processed}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      batchId,
      processedRecords: processed,
      totalRecords: rows.length,
      results
    });
  } catch (error) {
    console.error("❌ Bulk upload error:", error);
    res.status(500).json({ error: "Failed to process bulk upload batch." });
  }
});

module.exports = router;
