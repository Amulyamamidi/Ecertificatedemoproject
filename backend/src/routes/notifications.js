const express = require("express");
const router = express.Router();
const { query } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

/**
 * GET /api/notifications
 * Returns user's in-app notifications and unread count.
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const tableCheck = await query("SELECT to_regclass('public.notifications') as exists");
    if (!tableCheck.rows[0]?.exists) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const userId = String(req.user.id);
    const result = await query(
      `SELECT * FROM notifications WHERE user_id::text = $1 ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );

    const unreadRes = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id::text = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows,
      unreadCount: parseInt(unreadRes.rows[0]?.count || 0)
    });
  } catch (error) {
    console.error("❌ Notifications error:", error);
    res.json({ success: true, notifications: [], unreadCount: 0 });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marks single notification as read.
 */
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [id, req.user.id]);
    res.json({ success: true, message: "Marked as read." });
  } catch (error) {
    console.error("❌ Mark read error:", error);
    res.status(500).json({ error: "Failed to update notification." });
  }
});

/**
 * PUT /api/notifications/read-all
 * Marks all user notifications as read.
 */
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1`, [req.user.id]);
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("❌ Mark all read error:", error);
    res.status(500).json({ error: "Failed to update notifications." });
  }
});

module.exports = router;
