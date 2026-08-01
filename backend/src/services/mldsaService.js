const { ml_dsa65 } = require("@noble/post-quantum/ml-dsa");
const db = require("../config/db");
const crypto = require("crypto");

/**
 * Service for NIST FIPS 204 ML-DSA (CRYSTALS-Dilithium) Post-Quantum Cryptography Operations.
 */

/**
 * Get or generate ML-DSA-65 keypair for an issuing institution.
 * @param {string} institutionId - UUID of the institution
 * @returns {Promise<{ publicKey: string, secretKey: string, algorithm: string }>}
 */
async function getOrGenerateInstitutionKeyPair(institutionId) {
  try {
    // 1. Check if keypair already exists in DB
    const result = await db.query(
      "SELECT public_key, secret_key, algorithm FROM institution_pqc_keys WHERE institution_id = $1",
      [institutionId]
    );

    if (result.rows.length > 0) {
      return {
        publicKey: result.rows[0].public_key,
        secretKey: result.rows[0].secret_key,
        algorithm: result.rows[0].algorithm
      };
    }

    // 2. Generate new ML-DSA-65 keypair
    const seed = crypto.randomBytes(32);
    const keys = ml_dsa65.keygen(new Uint8Array(seed));

    const publicKeyHex = Buffer.from(keys.publicKey).toString("hex");
    const secretKeyHex = Buffer.from(keys.secretKey).toString("hex");
    const algorithm = "ML-DSA-65";

    // 3. Save keypair to database
    await db.query(
      `INSERT INTO institution_pqc_keys (institution_id, public_key, secret_key, algorithm)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (institution_id) DO UPDATE SET public_key = EXCLUDED.public_key, secret_key = EXCLUDED.secret_key`,
      [institutionId, publicKeyHex, secretKeyHex, algorithm]
    );

    return {
      publicKey: publicKeyHex,
      secretKey: secretKeyHex,
      algorithm
    };
  } catch (error) {
    console.error("[ML-DSA Service] Keypair generation error:", error);
    throw new Error(`Failed to generate ML-DSA keypair: ${error.message}`);
  }
}

/**
 * Sign a SHA-256 certificate hash using institution's ML-DSA secret key.
 * @param {string} certHash - SHA-256 hash string (0x...)
 * @param {string} secretKeyHex - Hex string of secret key
 * @returns {string} Signature in hex format
 */
function signCertificateHash(certHash, secretKeyHex) {
  try {
    const secretKeyBytes = Uint8Array.from(Buffer.from(secretKeyHex, "hex"));
    const msgBytes = Buffer.from(certHash.replace(/^0x/, ""), "hex");
    const signatureBytes = ml_dsa65.sign(secretKeyBytes, msgBytes);
    return Buffer.from(signatureBytes).toString("hex");
  } catch (error) {
    console.error("[ML-DSA Service] Signing error:", error);
    throw new Error(`ML-DSA Signature generation failed: ${error.message}`);
  }
}

/**
 * Verify an ML-DSA signature against a SHA-256 certificate hash.
 * @param {string} certHash - SHA-256 hash string
 * @param {string} signatureHex - Hex string of ML-DSA signature
 * @param {string} publicKeyHex - Hex string of ML-DSA public key
 * @returns {boolean}
 */
function verifyCertificateSignature(certHash, signatureHex, publicKeyHex) {
  try {
    const publicKeyBytes = Uint8Array.from(Buffer.from(publicKeyHex, "hex"));
    const msgBytes = Buffer.from(certHash.replace(/^0x/, ""), "hex");
    const signatureBytes = Uint8Array.from(Buffer.from(signatureHex, "hex"));
    return ml_dsa65.verify(publicKeyBytes, msgBytes, signatureBytes);
  } catch (error) {
    console.error("[ML-DSA Service] Signature verification error:", error);
    return false;
  }
}

/**
 * Record ML-DSA signature metadata for an issued certificate in PostgreSQL.
 * @param {object} param0 
 */
async function recordPqcSignature({ certId, institutionId, signature, publicKey, algorithm = "ML-DSA-65", signedHash }) {
  try {
    await db.query(
      `INSERT INTO pqc_signatures (cert_id, institution_id, signature, public_key, algorithm, signed_hash, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (cert_id) DO UPDATE 
       SET signature = EXCLUDED.signature, public_key = EXCLUDED.public_key, timestamp = NOW()`,
      [certId, institutionId, signature, publicKey, algorithm, signedHash]
    );
  } catch (error) {
    console.error("[ML-DSA Service] Failed to record PQC signature in DB:", error);
  }
}

/**
 * Retrieve PQC signature metadata for a certificate.
 * @param {string} certId 
 */
async function getPqcSignatureByCertId(certId) {
  try {
    const result = await db.query(
      `SELECT cert_id, institution_id, signature, public_key, algorithm, signed_hash, timestamp
       FROM pqc_signatures WHERE cert_id = $1`,
      [certId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("[ML-DSA Service] Failed to fetch PQC signature:", error);
    return null;
  }
}

module.exports = {
  getOrGenerateInstitutionKeyPair,
  signCertificateHash,
  verifyCertificateSignature,
  recordPqcSignature,
  getPqcSignatureByCertId
};
