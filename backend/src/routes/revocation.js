const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const { logAudit } = require("../services/auditService");
const { sendNotificationEmail } = require("../services/notificationEmailService");
const { revokeCertificateOnChain } = require("../services/blockchain");

/**
 * POST /api/revocation/revoke
 * Revokes a certificate by cert_id with reason.
 */
router.post("/revoke", authenticateToken, async (req, res) => {
  try {
    const { cert_id, reason } = req.body;
    if (!cert_id || !reason) {
      return res.status(400).json({ error: "Certificate ID and revocation reason are required." });
    }

    // Check certificate existence
    const certRes = await query(`SELECT c.*, s.email as student_email FROM certificates c LEFT JOIN students s ON c.student_id = s.id WHERE c.cert_id = $1`, [cert_id]);
    if (certRes.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    const cert = certRes.rows[0];

    // Revoke on Blockchain if available
    let txHash = null;
    try {
      if (revokeCertificateOnChain) {
        const tx = await revokeCertificateOnChain(cert_id);
        txHash = tx?.hash || tx?.transactionHash || null;
      }
    } catch (bcErr) {
      console.warn("⚠️ [Blockchain Revoke Warning] Could not complete on-chain revocation, updating DB status:", bcErr.message);
    }

    // Update status in certificates table
    await query(`UPDATE certificates SET status = 'revoked' WHERE cert_id = $1`, [cert_id]);

    // Insert into revoked_certificates table
    await query(
      `INSERT INTO revoked_certificates (cert_id, revoked_by, reason, tx_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cert_id) DO UPDATE SET reason = EXCLUDED.reason, revoked_at = timezone('utc'::text, now())`,
      [cert_id, req.user.id, reason, txHash]
    );

    // Audit log
    await logAudit({
      userId: req.user.id,
      userRole: req.user.role || "admin",
      action: "CERTIFICATE_REVOKE",
      details: `Revoked Certificate ID ${cert_id}. Reason: ${reason}`,
      ipAddress: req.ip
    });

    // Notify student via email if email exists
    if (cert.student_email) {
      await sendNotificationEmail({
        recipientEmail: cert.student_email,
        subject: "Certificate Revocation Notice - JNTUGV CertiShield",
        eventType: "CERT_REVOKED",
        messageBody: `Your certificate (ID: ${cert_id}) has been revoked by the issuing institution/admin. Reason: ${reason}`
      });
    }

    res.json({
      success: true,
      message: "Certificate revoked successfully.",
      cert_id,
      tx_hash: txHash
    });
  } catch (error) {
    console.error("❌ Revocation error:", error);
    res.status(500).json({ error: "Failed to revoke certificate." });
  }
});

module.exports = router;
