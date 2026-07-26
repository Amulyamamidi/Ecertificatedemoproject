const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const blockchain = require("../services/blockchain");
const hash = require("../services/hash");
const { getIPFSGatewayUrl } = require("../services/ipfs");

const router = express.Router();

// Setup Multer memory storage for uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * Verify by Certificate ID (Direct Lookup)
 */
router.get("/:certId", async (req, res) => {
  const { certId } = req.params;

  try {
    const certDetails = await blockchain.getCertificate(certId);
    if (!certDetails || certDetails.issuedAt === 0) {
      return res.status(404).json({ error: "Certificate not found on-chain." });
    }

    // Lookup metadata in off-chain database if available
    const dbQuery = await db.query(
      `SELECT c.*, inst.name as institution_name, s.registration_number 
       FROM certificates c 
       LEFT JOIN institutions inst ON c.institution_id = inst.id 
       LEFT JOIN students s ON c.student_id = s.id
       WHERE c.cert_id = $1`,
      [certId]
    );

    const metadata = dbQuery.rows.length > 0 ? dbQuery.rows[0] : null;

    res.json({
      certId,
      onChainDetails: {
        certHash: certDetails.certHash,
        ipfsCID: certDetails.ipfsCID,
        issuer: certDetails.issuer,
        issuedAt: certDetails.issuedAt,
        revoked: certDetails.revoked,
        ipfsUrl: getIPFSGatewayUrl(certDetails.ipfsCID)
      },
      metadata: metadata ? {
        studentName: metadata.student_name,
        registrationNumber: metadata.registration_number || "N/A",
        courseName: metadata.course_name,
        grade: metadata.grade,
        institutionName: metadata.institution_name,
        status: metadata.status,
        issuedAt: metadata.issued_at
      } : null
    });
  } catch (error) {
    console.error("[Verify Route] Get cert error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * Verify by PDF Upload
 * Computes uploaded file hash, extracts certId from the PDF binary string, 
 * and performs an on-chain integrity check.
 */
router.post("/upload", upload.single("certificate"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a certificate PDF file." });
  }

  try {
    const buffer = req.file.buffer;
    const pdfText = buffer.toString("binary");

    // Extract Certificate ID (bytes32 64-hex char string starting with 0x)
    const matches = pdfText.match(/0x[a-fA-F0-9]{64}/);
    if (!matches) {
      return res.status(400).json({ 
        error: "Invalid certificate format. Could not find Certificate Verification ID." 
      });
    }

    const certId = matches[0];
    console.log(`[Verify Route] Extracted Certificate ID: ${certId}`);

    // Compute SHA-256 hash of the uploaded file
    const uploadedHash = hash.hashBuffer(buffer);
    console.log(`[Verify Route] Uploaded PDF Hash: ${uploadedHash}`);

    // Query on-chain registry
    const certDetails = await blockchain.getCertificate(certId);
    if (!certDetails || certDetails.issuedAt === 0) {
      return res.status(404).json({ 
        error: "Certificate ID found in file, but it is not registered on the blockchain." 
      });
    }

    // Perform validation check
    const isValid = (certDetails.certHash.toLowerCase() === uploadedHash.toLowerCase());
    const isRevoked = certDetails.revoked;

    // Fetch off-chain database metadata
    const dbQuery = await db.query(
      `SELECT c.*, inst.name as institution_name, s.registration_number 
       FROM certificates c 
       LEFT JOIN institutions inst ON c.institution_id = inst.id 
       LEFT JOIN students s ON c.student_id = s.id
       WHERE c.cert_id = $1`,
      [certId]
    );
    const metadata = dbQuery.rows.length > 0 ? dbQuery.rows[0] : null;

    res.json({
      certId,
      isValid,
      isRevoked,
      uploadedHash,
      onChainHash: certDetails.certHash,
      onChainDetails: {
        ipfsCID: certDetails.ipfsCID,
        issuer: certDetails.issuer,
        issuedAt: certDetails.issuedAt,
        ipfsUrl: getIPFSGatewayUrl(certDetails.ipfsCID)
      },
      metadata: metadata ? {
        studentName: metadata.student_name,
        registrationNumber: metadata.registration_number || "N/A",
        courseName: metadata.course_name,
        grade: metadata.grade,
        institutionName: metadata.institution_name,
        status: metadata.status,
        issuedAt: metadata.issued_at
      } : null
    });
  } catch (error) {
    console.error("[Verify Route] PDF upload verification error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
