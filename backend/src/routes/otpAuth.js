const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { sendOtpEmail } = require("../services/emailService");
const { logAudit } = require("../services/auditService");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_token_for_certificate_system_2026";

/**
 * POST /api/otp-auth/request-otp
 * Generates and emails a 6-digit login OTP code.
 */
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    // Check if user exists in institutions, students, or admin
    let user = null;
    let role = "student";

    const instRes = await query(`SELECT * FROM institutions WHERE email = $1`, [email]);
    if (instRes.rows.length > 0) {
      user = instRes.rows[0];
      role = "institution";
    } else {
      const studRes = await query(`SELECT * FROM students WHERE email = $1`, [email]);
      if (studRes.rows.length > 0) {
        user = studRes.rows[0];
        role = "student";
      } else if (email === "admin@system.com" || email === "jntugv@system.com") {
        user = { id: "admin-id", name: "JNTUGV Admin", email };
        role = "admin";
      }
    }

    if (!user) {
      return res.status(404).json({ error: "No user account registered with this email." });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // Save to otp_requests
    await query(
      `INSERT INTO otp_requests (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
      [email, otpCode, expiresAt]
    );

    // Send email
    await sendOtpEmail(email, otpCode, user.name || "User");

    res.json({
      success: true,
      message: `A 6-digit OTP has been sent to ${email}.`,
      role
    });
  } catch (error) {
    console.error("❌ OTP request error:", error);
    res.status(500).json({ error: "Failed to process OTP request." });
  }
});

/**
 * POST /api/otp-auth/verify-otp
 * Verifies OTP code and returns JWT session token.
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp_code } = req.body;
    if (!email || !otp_code) {
      return res.status(400).json({ error: "Email and OTP code are required." });
    }

    const otpRes = await query(
      `SELECT * FROM otp_requests 
       WHERE email = $1 AND otp_code = $2 AND used = FALSE AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp_code]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP code." });
    }

    // Mark OTP as used
    await query(`UPDATE otp_requests SET used = TRUE WHERE id = $1`, [otpRes.rows[0].id]);

    // Find User Details
    let user = null;
    let role = "student";

    const instRes = await query(`SELECT * FROM institutions WHERE email = $1`, [email]);
    if (instRes.rows.length > 0) {
      user = instRes.rows[0];
      role = "institution";
    } else {
      const studRes = await query(`SELECT * FROM students WHERE email = $1`, [email]);
      if (studRes.rows.length > 0) {
        user = studRes.rows[0];
        role = "student";
      } else if (email === "admin@system.com" || email === "jntugv@system.com") {
        user = { id: "admin-id", name: "JNTUGV System Admin", email };
        role = "admin";
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Log Audit
    await logAudit({
      userId: user.id,
      userRole: role,
      action: "OTP_LOGIN_SUCCESS",
      details: `Successful OTP authentication for ${email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role
      }
    });
  } catch (error) {
    console.error("❌ OTP verification error:", error);
    res.status(500).json({ error: "Failed to verify OTP code." });
  }
});

module.exports = router;
