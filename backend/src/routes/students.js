const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authenticateToken, requireStudent } = require("../middleware/auth");

const router = express.Router();

// Setup Multer memory storage for student photo uploads
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authenticateToken);
router.use(requireStudent);

/**
 * Get certificates issued to the authenticated student
 */
router.get("/certificates", async (req, res) => {
  const studentId = req.user.id;

  try {
    const result = await db.query(
      `SELECT c.cert_id, c.student_name, c.course_name, c.grade, c.cert_hash, c.ipfs_cid, c.tx_hash, c.status, c.issued_at, inst.name as institution_name 
       FROM certificates c 
       LEFT JOIN institutions inst ON c.institution_id = inst.id 
       WHERE c.student_id = $1 
       ORDER BY c.issued_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("[Student Route] Get certificates error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Get approved institutions (for student application dropdown)
 */
router.get("/institutions", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name FROM institutions WHERE status = 'approved'"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[Student Route] Get approved institutions error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Apply for a certificate
 */
router.post("/certificates/apply", upload.single("studentPhoto"), async (req, res) => {
  const { institutionId, rollNumber, courseName, grade } = req.body;
  const studentId = req.user.id;

  if (!institutionId || !rollNumber || !courseName) {
    return res.status(400).json({ error: "College, Roll Number, and Course Name are required." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "Student photo image is required." });
  }

  try {
    // Verify institution is approved
    const instCheck = await db.query("SELECT * FROM institutions WHERE id = $1 AND status = 'approved'", [institutionId]);
    if (instCheck.rows.length === 0) {
      return res.status(400).json({ error: "Selected institution is invalid or not approved." });
    }

    // Save the student photo file to backend/storage/student_photos/
    const fileExt = path.extname(req.file.originalname) || ".jpg";
    const filename = `${uuidv4()}${fileExt}`;
    const photosDir = path.join(__dirname, "../../storage/student_photos");
    
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(photosDir, filename), req.file.buffer);

    // Insert new application with student_photo and uppercase roll number
    const result = await db.query(
      `INSERT INTO certificate_requests 
       (student_id, institution_id, roll_number, course_name, grade, student_photo, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending_college') RETURNING *`,
      [studentId, institutionId, rollNumber.trim().toUpperCase(), courseName.trim(), grade || "A", filename]
    );

    res.status(201).json({
      message: "Certificate application submitted successfully to college.",
      application: result.rows[0]
    });
  } catch (error) {
    console.error("[Student Route] Apply certificate error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Get certificate applications for the student
 */
router.get("/certificates/applications", async (req, res) => {
  const studentId = req.user.id;

  try {
    const result = await db.query(
      `SELECT cr.id, cr.roll_number, cr.course_name, cr.grade, cr.status, cr.created_at, inst.name as institution_name 
       FROM certificate_requests cr 
       LEFT JOIN institutions inst ON cr.institution_id = inst.id 
       WHERE cr.student_id = $1 
       ORDER BY cr.created_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("[Student Route] Get applications error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
