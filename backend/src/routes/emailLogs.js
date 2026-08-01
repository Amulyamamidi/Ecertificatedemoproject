const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/email-logs
 * Retrieves email dispatch log history.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await query(
      `SELECT * FROM email_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countRes = await query(`SELECT COUNT(*) FROM email_logs`);

    res.json({
      success: true,
      emailLogs: result.rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (error) {
    console.error("❌ Email log error:", error);
    res.status(500).json({ error: "Failed to fetch email logs." });
  }
});

module.exports = router;
