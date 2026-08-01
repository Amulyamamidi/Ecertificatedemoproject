const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/audit-logs
 * Retrieves system audit logs with optional filtering by action or user search.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { action, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (action) {
      params.push(action);
      sql += ` AND action = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (details ILIKE $${params.length} OR user_role ILIKE $${params.length} OR user_id ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM audit_logs`);

    res.json({
      success: true,
      logs: result.rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

module.exports = router;
