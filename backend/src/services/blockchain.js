const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const CONTRACT_DETAILS_PATH = path.join(__dirname, "../config/contract_details.json");

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

// Initialise Ethers connection
function initEthers() {
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
  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain. Check RPC URL and CONTRACT_ADDRESS.");

  console.log(`[Blockchain Service] Authorizing issuer on blockchain: ${institutionWallet}`);
  const tx = await contract.authorizeIssuer(institutionWallet);
  const receipt = await tx.wait();
  console.log(`[Blockchain Service] Issuer authorized in tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Deauthorizes an institution's wallet address on-chain.
 */
async function deauthorizeIssuer(institutionWallet) {
  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain. Check RPC URL and CONTRACT_ADDRESS.");

  const tx = await contract.deauthorizeIssuer(institutionWallet);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Verifies if an institution wallet address is authorized.
 */
async function isAuthorizedIssuer(institutionWallet) {
  initEthers();
  if (!contract) {
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
  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain. Check RPC URL and CONTRACT_ADDRESS.");

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
  initEthers();
  if (!contract) throw new Error("Contract not initialized on-chain. Check RPC URL and CONTRACT_ADDRESS.");

  console.log(`[Blockchain Service] Revoking certificate on blockchain: ${certId}`);
  const tx = await contract.revokeCertificate(certId);
  const receipt = await tx.wait();
  console.log(`[Blockchain Service] Revoked in tx: ${receipt.hash}`);
  return receipt.hash;
}

/**
 * Verifies certificate by ID and Hash.
 */
async function verifyCertificate(certId, providedHash) {
  initEthers();
  if (!contract) {
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

const { query } = require("../config/db");

async function recordTxToDB({ txHash, blockNumber, walletAddress, actionType, gasUsed, certId }) {
  try {
    await query(
      `INSERT INTO blockchain_transactions (tx_hash, block_number, wallet_address, action_type, gas_used, status, cert_id)
       VALUES ($1, $2, $3, $4, $5, 'SUCCESS', $6)
       ON CONFLICT (tx_hash) DO NOTHING`,
      [txHash, blockNumber || 0, walletAddress || "0x0", actionType, String(gasUsed || "21000"), certId || null]
    );
  } catch (err) {
    console.warn("⚠️ Failed to record blockchain transaction to DB:", err.message);
  }
}

module.exports = {
  authorizeIssuer,
  deauthorizeIssuer,
  isAuthorizedIssuer,
  issueCertificate,
  issueCertificateOnChain: async (certId, certHash, ipfsCID, wallet) => {
    const hash = await issueCertificate(certId, certHash, ipfsCID, wallet);
    await recordTxToDB({ txHash: hash, walletAddress: wallet || "0xRelayer", actionType: "ISSUE", certId });
    return { hash };
  },
  revokeCertificate,
  revokeCertificateOnChain: async (certId) => {
    const hash = await revokeCertificate(certId);
    await recordTxToDB({ txHash: hash, walletAddress: "0xRelayer", actionType: "REVOKE", certId });
    return { hash };
  },
  verifyCertificate,
  getCertificate,
  recordTxToDB
};

