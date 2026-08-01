const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { generateCSV } = require("../services/reportExportService");

/**
 * GET /api/reports/export
 * Downloads CSV or data reports for Issued, Revoked, Verification, or Audit logs.
 */
router.get("/export", authenticateToken, async (req, res) => {
  try {
    const { type = "issued", format = "csv" } = req.query;

    let data = [];
    let fields = [];
    let filename = `report_${type}_${Date.now()}.csv`;

    if (type === "issued") {
      const result = await query(`SELECT cert_id, student_name, course_name, grade, cert_hash, ipfs_cid, tx_hash, status, issued_at FROM certificates ORDER BY issued_at DESC`);
      data = result.rows;
      fields = ["cert_id", "student_name", "course_name", "grade", "cert_hash", "ipfs_cid", "tx_hash", "status", "issued_at"];
      filename = `Issued_Certificates_Report.csv`;
    } else if (type === "revoked") {
      const result = await query(`SELECT r.cert_id, c.student_name, c.course_name, r.reason, r.revoked_at, r.tx_hash FROM revoked_certificates r JOIN certificates c ON r.cert_id = c.cert_id ORDER BY r.revoked_at DESC`);
      data = result.rows;
      fields = ["cert_id", "student_name", "course_name", "reason", "revoked_at", "tx_hash"];
      filename = `Revoked_Certificates_Report.csv`;
    } else if (type === "verification") {
      const result = await query(`SELECT cert_id, verification_result, ip_address, browser, device, created_at FROM verification_logs ORDER BY created_at DESC LIMIT 1000`);
      data = result.rows;
      fields = ["cert_id", "verification_result", "ip_address", "browser", "device", "created_at"];
      filename = `Verification_Logs_Report.csv`;
    } else if (type === "audit") {
      const result = await query(`SELECT user_id, user_role, action, details, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1000`);
      data = result.rows;
      fields = ["user_id", "user_role", "action", "details", "ip_address", "created_at"];
      filename = `Audit_Logs_Report.csv`;
    }

    const csvStr = generateCSV(data, fields);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvStr);
  } catch (error) {
    console.error("❌ Export error:", error);
    res.status(500).json({ error: "Failed to export report." });
  }
});

module.exports = router;
