require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Default dummy key to allow compilation/local testing without .env configured
const DUMMY_KEY = "0000000000000000000000000000000000000000000000000000000000000001";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || DUMMY_KEY;
const ALCHEMY_AMOY_RPC_URL = process.env.ALCHEMY_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    amoy: {
      url: ALCHEMY_AMOY_RPC_URL,
      accounts: [DEPLOYER_PRIVATE_KEY]
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
      accounts: [DEPLOYER_PRIVATE_KEY]
    }
  }
};
