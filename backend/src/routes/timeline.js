const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

/**
 * GET /api/timeline/:certId
 * Constructs comprehensive chronological lifecycle event timeline for a certificate.
 */
router.get("/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const certRes = await query(`SELECT * FROM certificates WHERE cert_id = $1`, [certId]);
    if (certRes.rows.length === 0) {
      return res.status(404).json({ error: "Certificate not found." });
    }

    const cert = certRes.rows[0];
    const events = [];

    // Event 1: Certificate Issued
    events.push({
      title: "Certificate Issued",
      description: `E-Certificate generated for ${cert.student_name} (${cert.course_name})`,
      timestamp: cert.issued_at,
      type: "CREATED",
      icon: "Award"
    });

    // Event 2: Blockchain Transaction Recorded
    if (cert.tx_hash) {
      events.push({
        title: "Blockchain Hash Stored",
        description: `SHA-256 Hash stored on Ethereum ledger. Tx Hash: ${cert.tx_hash}`,
        timestamp: cert.issued_at,
        type: "BLOCKCHAIN",
        icon: "Shield"
      });
    }

    // Event 3: IPFS Pinning
    if (cert.ipfs_cid) {
      events.push({
        title: "IPFS File Pinned",
        description: `Document CID pinned to IPFS: ${cert.ipfs_cid}`,
        timestamp: cert.issued_at,
        type: "IPFS",
        icon: "FileText"
      });
    }

    // Event 4: Verification Logs
    const verifLogs = await query(
      `SELECT * FROM verification_logs WHERE cert_id = $1 ORDER BY created_at ASC`,
      [certId]
    );

    verifLogs.rows.forEach((log) => {
      events.push({
        title: `Public Verification (${log.verification_result})`,
        description: `Verified from IP: ${log.ip_address} on ${log.device || "Browser"}`,
        timestamp: log.created_at,
        type: "VERIFIED",
        icon: "CheckCircle"
      });
    });

    // Event 5: Revocation if present
    const revokeRes = await query(`SELECT * FROM revoked_certificates WHERE cert_id = $1`, [certId]);
    if (revokeRes.rows.length > 0) {
      const rev = revokeRes.rows[0];
      events.push({
        title: "Certificate Revoked",
        description: `Credential revoked. Reason: ${rev.reason}`,
        timestamp: rev.revoked_at,
        type: "REVOKED",
        icon: "AlertTriangle"
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      certId,
      certificate: cert,
      timeline: events
    });
  } catch (error) {
    console.error("❌ Timeline error:", error);
    res.status(500).json({ error: "Failed to construct activity timeline." });
  }
});

module.exports = router;
