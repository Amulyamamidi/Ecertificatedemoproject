const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

// Paths
const LEDGER_PATH = path.join(__dirname, "../../storage/blockchain_ledger.json");
const CONTRACT_DETAILS_PATH = path.join(__dirname, "../config/contract_details.json");

// Helper to load ledger for Mock Mode
function readLedger() {
  if (!fs.existsSync(path.dirname(LEDGER_PATH))) {
    fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  }
  if (!fs.existsSync(LEDGER_PATH)) {
    // Initial state: admin is 0xAdminAddress, authorized issuers map, certificates map
    fs.writeFileSync(
      LEDGER_PATH,
      JSON.stringify({
        admin: "0xAdmin00000000000000000000000000000000001",
        authorizedIssuers: {},
        certificates: {},
        transactions: []
      }, null, 2)
    );
  }
  return JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8"));
}

function writeLedger(data) {
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(data, null, 2), "utf8");
}

// Global variables for ethers
let provider = null;
let adminWallet = null;
let contract = null;
let contractDetails = null;

// Safe loading of contract details
try {
  if (fs.existsSync(CONTRACT_DETAILS_PATH)) {
    contractDetails = JSON.parse(fs.readFileSync(CONTRACT_DETAILS_PATH, "utf8"));
  }
} catch (error) {
  console.warn("[Blockchain Service] Error loading contract_details.json:", error.message);
}

// Initialise Ethers if not in mock mode
function initEthers() {
  const isMock = process.env.USE_MOCK_SERVICES === "true";
  if (isMock) return;

  if (provider && contract) return; // already initialized

  try {
    const rpcUrl = process.env.ALCHEMY_AMOY_RPC_URL;
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    
    if (!contractDetails || !contractDetails.address || !contractDetails.abi) {
      console.warn("[Blockchain Service] Contract details missing. Please deploy contract first.");
      return;
    }

    provider = new ethers.JsonRpcProvider(rpcUrl);
    adminWallet = new ethers.Wallet(privateKey, provider);
    contract = new ethers.Contract(contractDetails.address, contractDetails.abi, adminWallet);
    console.log(`[Blockchain Service] Connected to contract at ${contractDetails.address}`);
  } catch (error) {
    console.error("[Blockchain Service] Failed to initialize Ethers.js:", error);
  }
}

/**
 * Authorizes an institution's wallet address on-chain.
 */
async function authorizeIssuer(institutionWallet) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    console.log(`[Blockchain Service] [MOCK] Authorizing issuer: ${institutionWallet}`);
    const ledger = readLedger();
    ledger.authorizedIssuers[institutionWallet.toLowerCase()] = true;
    ledger.transactions.push({
      event: "IssuerAuthorized",
      issuer: institutionWallet,
      txHash: "0xmocktx" + require("crypto").randomBytes(28).toString("hex"),
      timestamp: Math.floor(Date.now() / 1000)
    });
    writeLedger(ledger);
    return ledger.transactions[ledger.transactions.length - 1].txHash;
  }

  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain");

  console.log(`[Blockchain Service] Authorizing issuer on Polygon Amoy: ${institutionWallet}`);
  const tx = await contract.authorizeIssuer(institutionWallet);
  const receipt = await tx.wait();
  console.log(`[Blockchain Service] Issuer authorized in tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Deauthorizes an institution's wallet address on-chain.
 */
async function deauthorizeIssuer(institutionWallet) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    console.log(`[Blockchain Service] [MOCK] Deauthorizing issuer: ${institutionWallet}`);
    const ledger = readLedger();
    ledger.authorizedIssuers[institutionWallet.toLowerCase()] = false;
    writeLedger(ledger);
    return "0xmocktx" + require("crypto").randomBytes(28).toString("hex");
  }

  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain");

  const tx = await contract.deauthorizeIssuer(institutionWallet);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Verifies if an institution wallet address is authorized.
 */
async function isAuthorizedIssuer(institutionWallet) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    const ledger = readLedger();
    return !!ledger.authorizedIssuers[institutionWallet.toLowerCase()];
  }

  initEthers();
  if (!contract) {
    // If not initialized, return false
    return false;
  }

  try {
    return await contract.isAuthorizedIssuer(institutionWallet);
  } catch (error) {
    console.error("[Blockchain Service] Error calling isAuthorizedIssuer:", error.message);
    return false;
  }
}

/**
 * Issues a certificate on-chain.
 * Registers the certId, PDF SHA-256 hash, and IPFS CID.
 */
async function issueCertificate(certId, certHash, ipfsCID, institutionWallet) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    console.log(`[Blockchain Service] [MOCK] Issuing certificate. ID: ${certId}`);
    const ledger = readLedger();
    
    if (ledger.certificates[certId]) {
      throw new Error("Certificate already exists");
    }

    ledger.certificates[certId] = {
      certHash: certHash.toLowerCase(),
      ipfsCID,
      issuer: institutionWallet,
      issuedAt: Math.floor(Date.now() / 1000),
      revoked: false
    };

    const txHash = "0xmocktx" + require("crypto").randomBytes(28).toString("hex");
    ledger.transactions.push({
      event: "CertificateIssued",
      certId,
      issuer: institutionWallet,
      certHash,
      ipfsCID,
      txHash,
      timestamp: ledger.certificates[certId].issuedAt
    });

    writeLedger(ledger);
    return txHash;
  }

  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain");

  // Check if admin relayer wallet is authorized as an issuer on-chain
  const isAuth = await contract.isAuthorizedIssuer(adminWallet.address);
  if (!isAuth) {
    console.log(`[Blockchain Service] Admin wallet (${adminWallet.address}) is not authorized. Authorizing on-chain...`);
    const authTx = await contract.authorizeIssuer(adminWallet.address);
    await authTx.wait();
    console.log(`[Blockchain Service] Admin wallet authorized successfully.`);
  }

  console.log(`[Blockchain Service] Issuing certificate on-chain: ${certId}`);
  const tx = await contract.issueCertificate(certId, certHash, ipfsCID);
  const receipt = await tx.wait();
  console.log(`[Blockchain Service] Issued on-chain in tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Revokes a certificate on-chain.
 */
async function revokeCertificate(certId) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    console.log(`[Blockchain Service] [MOCK] Revoking certificate: ${certId}`);
    const ledger = readLedger();
    
    if (!ledger.certificates[certId]) {
      throw new Error("Certificate does not exist");
    }

    ledger.certificates[certId].revoked = true;
    const txHash = "0xmocktx" + require("crypto").randomBytes(28).toString("hex");
    ledger.transactions.push({
      event: "CertificateRevoked",
      certId,
      txHash,
      timestamp: Math.floor(Date.now() / 1000)
    });

    writeLedger(ledger);
    return txHash;
  }

  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain");

  console.log(`[Blockchain Service] Revoking certificate on Polygon Amoy: ${certId}`);
  const tx = await contract.revokeCertificate(certId);
  const receipt = await tx.wait();
  console.log(`[Blockchain Service] Revoked in tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Verifies certificate by ID and Hash.
 */
async function verifyCertificate(certId, providedHash) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    const ledger = readLedger();
    const c = ledger.certificates[certId];
    if (!c) {
      return { isValid: false, isRevoked: false, issuer: null, issuedAt: 0, ipfsCID: "" };
    }
    const isValid = (c.certHash.toLowerCase() === providedHash.toLowerCase());
    return {
      isValid,
      isRevoked: c.revoked,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      ipfsCID: c.ipfsCID
    };
  }

  initEthers();
  if (!contract) {
    // Return empty mock verification if contract isn't ready but not in mock mode (prevents crashes)
    return { isValid: false, isRevoked: false, issuer: null, issuedAt: 0, ipfsCID: "" };
  }

  try {
    const result = await contract.verifyCertificate(certId, providedHash);
    return {
      isValid: result.isValid,
      isRevoked: result.isRevoked,
      issuer: result.issuer,
      issuedAt: Number(result.issuedAt),
      ipfsCID: result.ipfsCID
    };
  } catch (error) {
    console.error("[Blockchain Service] Error calling verifyCertificate:", error.message);
    return { isValid: false, isRevoked: false, issuer: null, issuedAt: 0, ipfsCID: "" };
  }
}

/**
 * Gets details of a certificate directly by ID.
 */
async function getCertificate(certId) {
  const isMock = process.env.USE_MOCK_SERVICES === "true";

  if (isMock) {
    const ledger = readLedger();
    const c = ledger.certificates[certId];
    if (!c) return null;
    return {
      certHash: c.certHash,
      ipfsCID: c.ipfsCID,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      revoked: c.revoked
    };
  }

  initEthers();
  if (!contract) return null;

  try {
    const result = await contract.getCertificate(certId);
    if (Number(result.issuedAt) === 0) return null;
    return {
      certHash: result.certHash,
      ipfsCID: result.ipfsCID,
      issuer: result.issuer,
      issuedAt: Number(result.issuedAt),
      revoked: result.revoked
    };
  } catch (error) {
    console.error("[Blockchain Service] Error calling getCertificate:", error.message);
    return null;
  }
}

module.exports = {
  authorizeIssuer,
  deauthorizeIssuer,
  isAuthorizedIssuer,
  issueCertificate,
  revokeCertificate,
  verifyCertificate,
  getCertificate
};
