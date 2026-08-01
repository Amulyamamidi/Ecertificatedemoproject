const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const blockchain = require("../services/blockchain");
const hash = require("../services/hash");
const { getIPFSGatewayUrl } = require("../services/ipfs");
const { logAudit } = require("../services/auditService");

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
      `SELECT c.*, inst.name as institution_name, s.registration_number, r.reason as revocation_reason, r.revoked_at
       FROM certificates c 
       LEFT JOIN institutions inst ON c.institution_id = inst.id 
       LEFT JOIN students s ON c.student_id = s.id
       LEFT JOIN revoked_certificates r ON c.cert_id = r.cert_id
       WHERE c.cert_id = $1`,
      [certId]
    );

    const metadata = dbQuery.rows.length > 0 ? dbQuery.rows[0] : null;

    // Record verification log
    db.query(
      `INSERT INTO verification_logs (cert_id, verification_result, ip_address, browser, device)
       VALUES ($1, $2, $3, $4, $5)`,
      [certId, certDetails.revoked ? "REVOKED" : "VALID", req.ip || "127.0.0.1", req.headers["user-agent"] || "Browser", "Direct Lookup"]
    ).catch((e) => console.warn("Failed to insert verification log:", e.message));

    logAudit({
      userRole: "public",
      action: "CERTIFICATE_VERIFICATION",
      details: `Public user verified certificate ${certId} by ID`,
      ipAddress: req.ip
    }).catch(() => {});

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
        status: certDetails.revoked ? "revoked" : metadata.status,
        revocationReason: metadata.revocation_reason || null,
        revokedAt: metadata.revoked_at || null,
        txHash: metadata.tx_hash || null,
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
    const uploadedHash = hash.hashBuffer(buffer);

    // Extract Certificate ID (bytes32 64-hex char string starting with 0x)
    let certId = null;
    const matches = pdfText.match(/0x[a-fA-F0-9]{64}/);
    if (matches) {
      certId = matches[0];
    } else {
      // Fallback: Check if SHA-256 hash matches any certificate in database
      const hashQuery = await db.query("SELECT cert_id FROM certificates WHERE LOWER(cert_hash) = LOWER($1)", [uploadedHash]);
      if (hashQuery.rows.length > 0) {
        certId = hashQuery.rows[0].cert_id;
      }
    }

    if (!certId) {
      return res.status(400).json({ 
        error: "Invalid certificate format. Could not find Certificate Verification ID." 
      });
    }
    console.log(`[Verify Route] Verified Certificate ID: ${certId}`);

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

    // Query on-chain registry
    const certDetails = await blockchain.getCertificate(certId);
    if (!certDetails || certDetails.issuedAt === 0) {
      if (metadata) {
        const isValid = (metadata.cert_hash.toLowerCase() === uploadedHash.toLowerCase());
        const isRevoked = (metadata.status === "revoked");

        db.query(
          `INSERT INTO verification_logs (cert_id, verification_result, ip_address, browser, device)
           VALUES ($1, $2, $3, $4, $5)`,
          [certId, isRevoked ? "REVOKED" : isValid ? "VALID" : "INVALID", req.ip || "127.0.0.1", req.headers["user-agent"] || "Browser", "PDF Upload"]
        ).catch(() => {});

        return res.json({
          certId,
          isValid,
          isRevoked,
          uploadedHash,
          onChainHash: metadata.cert_hash,
          onChainDetails: {
            ipfsCID: metadata.ipfs_cid || "N/A",
            issuer: metadata.institution_name || "JNTUGV",
            issuedAt: metadata.issued_at ? Math.floor(new Date(metadata.issued_at).getTime() / 1000) : 0,
            ipfsUrl: getIPFSGatewayUrl(metadata.ipfs_cid)
          },
          metadata: {
            studentName: metadata.student_name,
            registrationNumber: metadata.registration_number || "N/A",
            courseName: metadata.course_name,
            grade: metadata.grade,
            institutionName: metadata.institution_name,
            status: metadata.status,
            issuedAt: metadata.issued_at
          }
        });
      }

      return res.status(404).json({ 
        error: "Certificate ID found in file, but it is not registered on the blockchain." 
      });
    }

    // Perform validation check
    const isValid = (certDetails.certHash.toLowerCase() === uploadedHash.toLowerCase());
    const isRevoked = certDetails.revoked;

    // Record verification log
    db.query(
      `INSERT INTO verification_logs (cert_id, verification_result, ip_address, browser, device)
       VALUES ($1, $2, $3, $4, $5)`,
      [certId, isRevoked ? "REVOKED" : isValid ? "VALID" : "INVALID", req.ip || "127.0.0.1", req.headers["user-agent"] || "Browser", "PDF Upload"]
    ).catch((e) => console.warn("Failed to insert verification log:", e.message));

    logAudit({
      userRole: "public",
      action: "CERTIFICATE_VERIFICATION",
      details: `Public user verified certificate ${certId} by PDF Upload`,
      ipAddress: req.ip
    }).catch(() => {});

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
