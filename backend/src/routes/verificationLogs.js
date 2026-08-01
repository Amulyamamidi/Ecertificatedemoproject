const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/verification-logs
 * Retrieves public verification attempts history.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      `SELECT * FROM verification_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM verification_logs`);

    res.json({
      success: true,
      verificationLogs: result.rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (error) {
    console.error("❌ Verification logs fetch error:", error);
    res.status(500).json({ error: "Failed to fetch verification logs." });
  }
});

module.exports = router;
