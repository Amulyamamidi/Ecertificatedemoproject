const fs = require("fs");
const path = require("path");

// Mock IPFS storage directory
const MOCK_IPFS_DIR = path.join(__dirname, "../../storage/ipfs");

/**
 * Pins a file buffer (PDF) to IPFS using Pinata API, or mock local storage.
 * @param {Buffer} buffer - File buffer to pin
 * @param {string} fileName - Name of the file
 * @returns {Promise<string>} IPFS CID
 */
async function pinFileToIPFS(buffer, fileName) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    console.log("[IPFS Service] Operating in mock mode. Saving certificate to local disk.");
    if (!fs.existsSync(MOCK_IPFS_DIR)) {
      fs.mkdirSync(MOCK_IPFS_DIR, { recursive: true });
    }

    // Generate a simulated CID
    const mockHash = require("crypto").createHash("md5").update(buffer).digest("hex");
    const mockCid = `QmMockIPFS${mockHash.substring(0, 32)}`;
    
    // Save to local storage
    const filePath = path.join(MOCK_IPFS_DIR, `${mockCid}.pdf`);
    fs.writeFileSync(filePath, buffer);
    
    console.log(`[IPFS Service] Mock file saved: ${filePath}`);
    return mockCid;
  }

  // Real Pinata API pinning
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error("Pinata credentials missing. Check PINATA_API_KEY and PINATA_SECRET_KEY.");
  }

  console.log("[IPFS Service] Pinning file to real IPFS via Pinata...");

  try {
    const formData = new FormData();
    const fileBlob = new Blob([buffer], { type: "application/pdf" });
    
    // Append the file buffer as a blob
    formData.append("file", fileBlob, fileName);
    
    // Optional Pinata metadata
    formData.append("pinataMetadata", JSON.stringify({
      name: fileName,
      keyvalues: {
        system: "certificate-verification-system",
        issuedAt: new Date().toISOString()
      }
    }));

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: secretKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API returned HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("[IPFS Service] Successfully pinned to IPFS. CID:", result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error("[IPFS Service] Error pinning to Pinata:", error);
    throw error;
  }
}

/**
 * Returns a gateway URL to retrieve a file from IPFS.
 * Handles mock local files as well.
 * @param {string} cid 
 * @returns {string} HTTP Gateway URL or local endpoint
 */
function getIPFSGatewayUrl(cid) {
  if (cid.startsWith("QmMockIPFS")) {
    return `/v1/verify/ipfs/${cid}`;
  }
  // Public Pinata/IPFS gateway
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

module.exports = {
  pinFileToIPFS,
  getIPFSGatewayUrl
};
