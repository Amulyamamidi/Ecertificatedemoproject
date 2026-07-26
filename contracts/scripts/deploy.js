const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of CertificateRegistry...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  // Deploy
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("CertificateRegistry deployed to:", contractAddress);

  // Read ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );
  
  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  } else {
    console.warn("Artifact file not found. Make sure compilation succeeded.");
  }

  // Create output config directory in backend if not exists
  const backendConfigDir = path.join(__dirname, "../../backend/src/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }

  // Save details to backend
  const detailsFile = path.join(backendConfigDir, "contract_details.json");
  const details = {
    address: contractAddress,
    abi: abi
  };
  fs.writeFileSync(detailsFile, JSON.stringify(details, null, 2), "utf8");
  console.log(`Saved contract details to ${detailsFile}`);

  // Also save locally in contracts folder
  fs.writeFileSync(
    path.join(__dirname, "../deployed_address.json"),
    JSON.stringify({ address: contractAddress }, null, 2),
    "utf8"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
