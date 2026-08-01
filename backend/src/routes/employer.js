const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { generateCertificatePDF } = require("../services/pdfGenerator");
const { logAudit } = require("../services/auditService");

/**
 * POST /api/employer/verify-candidate
 * Employers verify candidate credential using Certificate ID or Hash.
 */
router.post("/verify-candidate", async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    if (!searchQuery) {
      return res.status(400).json({ error: "Certificate ID or Hash is required." });
    }

    const cleanQuery = searchQuery.trim();

    const certRes = await query(
      `SELECT c.*, i.name as institution_name, s.email as student_email, r.reason as revocation_reason, r.revoked_at 
       FROM certificates c 
       LEFT JOIN institutions i ON c.institution_id = i.id 
       LEFT JOIN students s ON c.student_id = s.id 
       LEFT JOIN revoked_certificates r ON c.cert_id = r.cert_id 
       WHERE c.cert_id = $1 OR c.cert_hash = $2`,
      [cleanQuery, cleanQuery]
    );

    if (certRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No credential record matches the provided Certificate ID / Hash."
      });
    }

    const cert = certRes.rows[0];

    // Log Verification Log
    await query(
      `INSERT INTO verification_logs (cert_id, verification_result, ip_address, browser, device)
       VALUES ($1, $2, $3, $4, $5)`,
      [cert.cert_id, cert.status === "revoked" ? "REVOKED" : "VALID", req.ip, req.headers["user-agent"] || "Browser", "Employer Portal"]
    );

    // Audit log
    await logAudit({
      userRole: "employer",
      action: "EMPLOYER_VERIFICATION",
      details: `Employer verified cert ${cert.cert_id}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      certificate: cert
    });
  } catch (error) {
    console.error("❌ Employer verification error:", error);
    res.status(500).json({ error: "Failed to complete employer verification." });
  }
});

/**
 * GET /api/employer/download-report/:certId
 * Generates an official PDF Verification Audit Report for employers.
 */
router.get("/download-report/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const certRes = await query(
      `SELECT c.*, i.name as institution_name 
       FROM certificates c 
       LEFT JOIN institutions i ON c.institution_id = i.id 
       WHERE c.cert_id = $1`,
      [certId]
    );

    if (certRes.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    const cert = certRes.rows[0];

    // Create Report PDF using PDFKit generator
    const pdfBuffer = await generateCertificatePDF({
      certId: cert.cert_id,
      studentName: cert.student_name,
      courseName: cert.course_name,
      grade: cert.grade,
      institutionName: cert.institution_name || "JNTUGV Constituent / Affiliated College",
      issueDate: cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : new Date().toLocaleDateString()
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Verification_Report_${cert.cert_id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Download report error:", error);
    res.status(500).json({ error: "Failed to generate report PDF." });
  }
});

module.exports = router;
