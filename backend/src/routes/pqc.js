const express = require("express");
const router = express.Router();
const mldsaService = require("../services/mldsaService");

/**
 * GET /v1/pqc/keys/:institutionId
 * Returns institution's public ML-DSA-65 key.
 */
router.get("/keys/:institutionId", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const keyPair = await mldsaService.getOrGenerateInstitutionKeyPair(institutionId);
    res.json({
      institutionId,
      publicKey: keyPair.publicKey,
      algorithm: keyPair.algorithm,
      standard: "NIST FIPS 204 (ML-DSA)"
    });
  } catch (error) {
    console.error("[PQC Route] Get public key error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch ML-DSA key." });
  }
});

/**
 * GET /v1/pqc/signatures/:certId
 * Returns PQC signature record for a certificate.
 */
router.get("/signatures/:certId", async (req, res) => {
  try {
    const { certId } = req.params;
    const record = await mldsaService.getPqcSignatureByCertId(certId);
    if (!record) {
      return res.status(404).json({ error: "PQC signature record not found." });
    }

    res.json({
      success: true,
      signature: record
    });
  } catch (error) {
    console.error("[PQC Route] Get signature error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * POST /v1/pqc/verify
 * Public verification endpoint for ML-DSA signatures.
 * Body: { certHash, signature, publicKey }
 */
router.post("/verify", (req, res) => {
  try {
    const { certHash, signature, publicKey } = req.body;
    if (!certHash || !signature || !publicKey) {
      return res.status(400).json({ error: "Missing required parameters: certHash, signature, publicKey." });
    }

    const isValid = mldsaService.verifyCertificateSignature(certHash, signature, publicKey);
    res.json({
      algorithm: "ML-DSA-65",
      standard: "NIST FIPS 204",
      certHash,
      isPqcValid: isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[PQC Route] Manual verification error:", error);
    res.status(500).json({ error: "Verification failed." });
  }
});

module.exports = router;
