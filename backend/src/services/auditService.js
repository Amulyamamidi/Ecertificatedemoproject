const { query } = require("../config/db");

/**
 * Audit Logging Helper Service
 * Inserts an entry into audit_logs asynchronously without throwing runtime errors to caller.
 */
async function logAudit({ userId = null, userRole = "public", action, details = "", ipAddress = "" }) {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, details, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId ? String(userId) : null, userRole, action, details, ipAddress || "127.0.0.1"]
    );
  } catch (err) {
    console.error("❌ [AuditService Error] Failed to log audit event:", err.message);
  }
}

module.exports = {
  logAudit
};
