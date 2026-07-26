const crypto = require("crypto");

/**
 * Generates SHA-256 hash of a buffer (like a file stream).
 * Returns the hash prefixed with '0x' to fit bytes32 on-chain.
 * @param {Buffer} buffer 
 * @returns {string} 0x-prefixed hex string
 */
function hashBuffer(buffer) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return "0x" + hash;
}

/**
 * Generates a unique Certificate ID based on registration details.
 * Returns a 0x-prefixed hex string (bytes32).
 * @param {string} registrationNumber 
 * @param {string} courseName 
 * @param {string} studentName 
 * @returns {string} 0x-prefixed hex string (bytes32)
 */
function generateCertId(registrationNumber, courseName, studentName) {
  const payload = `${registrationNumber.trim().toUpperCase()}-${courseName.trim().toUpperCase()}-${studentName.trim().toUpperCase()}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  return "0x" + hash;
}

module.exports = {
  hashBuffer,
  generateCertId
};
