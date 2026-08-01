const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/versions/:certId
 * Returns version history for a given certificate.
 */
router.get("/:certId", async (req, res) => {
  try {
    const { certId } = req.params;
    const result = await query(
      `SELECT * FROM certificate_versions WHERE cert_id = $1 ORDER BY version_number ASC`,
      [certId]
    );

    res.json({
      success: true,
      certId,
      versions: result.rows
    });
  } catch (error) {
    console.error("❌ Version fetch error:", error);
    res.status(500).json({ error: "Failed to fetch version history." });
  }
});

/**
 * POST /api/versions/create
 * Records a new certificate version entry.
 */
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { cert_id, reason, prev_hash, new_hash, ipfs_cid } = req.body;
    if (!cert_id || !new_hash || !ipfs_cid) {
      return res.status(400).json({ error: "Missing required version fields." });
    }

    // Determine current max version number
    const countRes = await query(
      `SELECT COUNT(*) FROM certificate_versions WHERE cert_id = $1`,
      [cert_id]
    );
    const nextVersion = parseInt(countRes.rows[0].count) + 1;

    const result = await query(
      `INSERT INTO certificate_versions (cert_id, version_number, modified_by, reason, prev_hash, new_hash, ipfs_cid)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [cert_id, nextVersion, req.user.id, reason || "Update", prev_hash || null, new_hash, ipfs_cid]
    );

    res.json({
      success: true,
      version: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Version record error:", error);
    res.status(500).json({ error: "Failed to create certificate version." });
  }
});

module.exports = router;
