const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/analytics/summary
 * Aggregates analytical statistics for Admin Dashboard charts.
 */
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const totalIssuedRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM certificates) + 
        (SELECT COUNT(*) FROM certificate_requests WHERE status IN ('approved_by_admin', 'issued')) as count
    `);

    const totalRevokedRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM revoked_certificates) + 
        (SELECT COUNT(*) FROM certificates WHERE status = 'revoked') as count
    `);

    const totalVerificationsRes = await query(`SELECT COUNT(*) FROM verification_logs`);

    const totalTxRes = await query(`
      SELECT GREATEST(
        (SELECT COUNT(*) FROM blockchain_transactions),
        (SELECT COUNT(*) FROM certificates WHERE tx_hash IS NOT NULL)
      ) as count
    `);

    // Monthly Issuance trend (last 6 months)
    const monthlyIssuanceRes = await query(`
      SELECT TO_CHAR(issued_at, 'Mon YYYY') as month, COUNT(*) as count 
      FROM (
        SELECT issued_at FROM certificates WHERE issued_at IS NOT NULL
        UNION ALL
        SELECT updated_at as issued_at FROM certificate_requests WHERE status IN ('approved_by_admin', 'issued') AND updated_at IS NOT NULL
      ) combined
      GROUP BY TO_CHAR(issued_at, 'Mon YYYY'), DATE_TRUNC('month', issued_at)
      ORDER BY DATE_TRUNC('month', issued_at) DESC LIMIT 6
    `);

    // Recent system activities
    const recentActivitiesRes = await query(`
      SELECT action, user_role, details, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC LIMIT 10
    `);

    // Verification outcomes distribution
    const verifOutcomesRes = await query(`
      SELECT verification_result as result, COUNT(*) as count 
      FROM verification_logs 
      GROUP BY verification_result
    `);

    res.json({
      success: true,
      summary: {
        totalIssued: parseInt(totalIssuedRes.rows[0]?.count || 0),
        totalRevoked: parseInt(totalRevokedRes.rows[0]?.count || 0),
        totalVerifications: parseInt(totalVerificationsRes.rows[0]?.count || 0),
        totalTransactions: parseInt(totalTxRes.rows[0]?.count || 0),
        monthlyIssuance: (monthlyIssuanceRes.rows || []).reverse(),
        recentActivities: recentActivitiesRes.rows || [],
        verificationOutcomes: verifOutcomesRes.rows || []
      }
    });
  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics summary." });
  }
});

module.exports = router;
