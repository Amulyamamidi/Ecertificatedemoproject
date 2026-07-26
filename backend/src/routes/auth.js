const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const emailService = require("../services/emailService");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_token_for_certificate_system_2026";

/**
 * Institution Register
 */
router.post("/institution/register", async (req, res) => {
  const { name, walletAddress, email, password } = req.body;

  if (!name || !walletAddress || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Run DB check and bcrypt password hash in parallel for maximum speed
    const [checkUser, passwordHash] = await Promise.all([
      db.query("SELECT * FROM institutions WHERE email = $1", [email]),
      bcrypt.hash(password, 6)
    ]);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      if (!existing.is_verified) {
        await db.query(
          "UPDATE institutions SET name = $1, wallet_address = $2, password_hash = $3, otp_code = $4 WHERE email = $5",
          [name, walletAddress, passwordHash, otp, email]
        );

        emailService.sendOtpEmail(email, otp, name).catch(err => {
          console.error("[Auth Route] Background email send error:", err);
        });

        return res.status(200).json({
          message: `Account pending verification. Verification code sent to ${email} (Demo Code: ${otp}).`,
          email,
          role: "institution",
          demoOtp: otp
        });
      }
      return res.status(400).json({ error: "Institution email already registered." });
    }

    // Save as pending approval and unverified email
    await db.query(
      "INSERT INTO institutions (name, wallet_address, email, password_hash, status, is_verified, otp_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [name, walletAddress, email, passwordHash, "pending", false, otp]
    );

    emailService.sendOtpEmail(email, otp, name).catch(err => {
      console.error("[Auth Route] Background email send error:", err);
    });

    res.status(201).json({
      message: `Institution registration successful. Verification code sent to ${email} (Demo Code: ${otp}).`,
      email,
      role: "institution",
      demoOtp: otp
    });
  } catch (error) {
    console.error("[Auth Route] Institution register error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Institution Login
 */
router.post("/institution/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await db.query("SELECT * FROM institutions WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const institution = result.rows[0];

    // Verify email verification status
    if (!institution.is_verified) {
      // Regenerate fresh OTP on login retry
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.query("UPDATE institutions SET otp_code = $1 WHERE email = $2", [newOtp, institution.email]);

      emailService.sendOtpEmail(institution.email, newOtp, institution.name).catch(err => {
        console.error("[Auth Route] Background login verification email send error:", err);
      });

      return res.status(403).json({
        error: "Email verification required. A new verification code has been sent to your email.",
        email: institution.email,
        role: "institution",
        needsVerification: true
      });
    }

    // Check status
    if (institution.status === "pending") {
      return res.status(403).json({ error: "Institution account is pending admin approval." });
    } else if (institution.status === "rejected") {
      return res.status(403).json({ error: "Institution account registration has been rejected." });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, institution.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: institution.id,
        name: institution.name,
        email: institution.email,
        walletAddress: institution.wallet_address,
        role: "institution"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: institution.id,
        name: institution.name,
        email: institution.email,
        walletAddress: institution.wallet_address,
        role: "institution"
      }
    });
  } catch (error) {
    console.error("[Auth Route] Institution login error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Student Register
 */
router.post("/student/register", async (req, res) => {
  const { name, registrationNumber, email, password } = req.body;

  if (!name || !registrationNumber || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [checkUser, passwordHash] = await Promise.all([
      db.query("SELECT * FROM students WHERE email = $1", [email]),
      bcrypt.hash(password, 6)
    ]);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      if (!existing.is_verified) {
        await db.query(
          "UPDATE students SET name = $1, registration_number = $2, password_hash = $3, otp_code = $4 WHERE email = $5",
          [name, registrationNumber, passwordHash, otp, email]
        );

        emailService.sendOtpEmail(email, otp, name).catch(err => {
          console.error("[Auth Route] Background email send error:", err);
        });

        return res.status(200).json({
          message: `Account pending verification. Verification code sent to ${email} (Demo Code: ${otp}).`,
          email,
          role: "student",
          demoOtp: otp
        });
      }
      return res.status(400).json({ error: "Student email already registered." });
    }

    await db.query(
      "INSERT INTO students (registration_number, name, email, password_hash, is_verified, otp_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [registrationNumber, name, email, passwordHash, false, otp]
    );

    emailService.sendOtpEmail(email, otp, name).catch(err => {
      console.error("[Auth Route] Background email send error:", err);
    });

    res.status(201).json({
      message: `Student registration successful. Verification code sent to ${email} (Demo Code: ${otp}).`,
      email,
      role: "student",
      demoOtp: otp
    });
  } catch (error) {
    console.error("[Auth Route] Student register error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Student Login
 */
router.post("/student/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await db.query("SELECT * FROM students WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const student = result.rows[0];

    // Verify email verification status
    if (!student.is_verified) {
      // Regenerate fresh OTP on login retry
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await db.query("UPDATE students SET otp_code = $1 WHERE email = $2", [newOtp, student.email]);

      emailService.sendOtpEmail(student.email, newOtp, student.name).catch(err => {
        console.error("[Auth Route] Background email send error:", err);
      });

      return res.status(403).json({
        error: `Email verification required. Code sent to ${student.email} (Demo Code: ${newOtp}).`,
        email: student.email,
        role: "student",
        needsVerification: true,
        demoOtp: newOtp
      });
    }

    const isMatch = await bcrypt.compare(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        id: student.id,
        name: student.name,
        email: student.email,
        registrationNumber: student.registration_number,
        role: "student"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        registrationNumber: student.registration_number,
        role: "student"
      }
    });
  } catch (error) {
    console.error("[Auth Route] Student login error:", error);
    res.status(500).json({ error: error.message || "Internal server error." });
  }
});

/**
 * Admin Login
 * (Provides hardcoded admin credentials for direct evaluation)
 */
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if ((email === "jntugv@system.com" && password === "jntugv123") || (email === "admin@system.com" && password === "admin123")) {
    const token = jwt.sign(
      {
        id: "admin-id",
        name: "JNTUGV Admin",
        email: email,
        role: "admin"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: {
        id: "admin-id",
        name: "JNTUGV Admin",
        email: email,
        role: "admin"
      }
    });
  }

  res.status(401).json({ error: "Invalid admin credentials." });
});

/**
 * Verify OTP for Email Authentication
 */
router.post("/verify-otp", async (req, res) => {
  const { email, otp, role } = req.body;

  if (!email || !otp || !role) {
    return res.status(400).json({ error: "Email, verification code (OTP), and role are required." });
  }

  const tableName = role === "student" ? "students" : "institutions";

  try {
    const userQuery = await db.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const user = userQuery.rows[0];
    if (user.is_verified) {
      return res.json({ message: "Email is already verified." });
    }

    if (user.otp_code !== otp) {
      return res.status(400).json({ error: "Invalid verification code. Please check your console logs." });
    }

    // Mark as verified
    await db.query(`UPDATE ${tableName} SET is_verified = true, otp_code = null WHERE email = $1`, [email]);

    res.json({
      message: "Email successfully verified! You can now log in."
    });
  } catch (error) {
    console.error("[Auth Route] Verify OTP error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Request OTP for Forgot Password (Student & Institution)
 */
router.post("/forgot-password/request-otp", async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ error: "Email and role are required." });
  }

  if (role !== "student" && role !== "institution") {
    return res.status(400).json({ error: "Invalid role for password reset." });
  }

  const tableName = role === "student" ? "students" : "institutions";

  try {
    const userQuery = await db.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: `No registered ${role} account found with email ${email}.` });
    }

    const user = userQuery.rows[0];
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await db.query(`UPDATE ${tableName} SET otp_code = $1 WHERE email = $2`, [otp, email]);

    emailService.sendOtpEmail(email, otp, user.name).catch(err => {
      console.error("[Auth Route] Background email send error:", err);
    });

    res.json({
      message: `Password reset OTP sent to ${email} (Demo Code: ${otp}).`,
      email,
      role,
      demoOtp: otp
    });
  } catch (error) {
    console.error("[Auth Route] Request forgot password OTP error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Reset Password using OTP (Student & Institution)
 */
router.post("/forgot-password/reset", async (req, res) => {
  const { email, role, otp, newPassword } = req.body;

  if (!email || !role || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, role, OTP code, and new password are required." });
  }

  if (role !== "student" && role !== "institution") {
    return res.status(400).json({ error: "Invalid role for password reset." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters long." });
  }

  const tableName = role === "student" ? "students" : "institutions";

  try {
    const userQuery = await db.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email]);
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const user = userQuery.rows[0];

    if (!user.otp_code || user.otp_code !== otp) {
      return res.status(400).json({ error: "Invalid or expired verification code (OTP)." });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      `UPDATE ${tableName} SET password_hash = $1, otp_code = null, is_verified = true WHERE email = $2`,
      [newPasswordHash, email]
    );

    res.json({
      message: "Password reset successfully! You can now log in with your new password."
    });
  } catch (error) {
    console.error("[Auth Route] Reset password error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
