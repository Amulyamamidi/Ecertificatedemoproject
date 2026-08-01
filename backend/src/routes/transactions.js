const express = require("express");
const router = express.Router();
const { query } = require("../config/db");

/**
 * GET /api/transactions
 * Returns recorded blockchain transactions.
 */
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `SELECT * FROM blockchain_transactions WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (tx_hash ILIKE $${params.length} OR cert_id ILIKE $${params.length} OR wallet_address ILIKE $${params.length})`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM blockchain_transactions`);

    res.json({
      success: true,
      transactions: result.rows,
      total: parseInt(countRes.rows[0].count)
    });
  } catch (error) {
    console.error("❌ Transaction fetch error:", error);
    res.status(500).json({ error: "Failed to fetch transactions." });
  }
});

module.exports = router;
