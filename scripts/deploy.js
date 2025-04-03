// scripts/deploy.js

/**
 * Script to deploy contracts to the Sepolia testnet
 * This script:
 * 1. Deploys the RWAToken contract
 * 2. Deploys the RWAMarketplace contract
 * 3. Saves the contract addresses for frontend use
 */

const { ethers } = require("hardhat");

async function main() {
  // Get test accounts
  const [deployer] = await ethers.getSigners();
  
  // Display deployer information
  console.log("\n🔑 Deployment Info:");
  console.log("--------------------");
  console.log("Deploying from address:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  console.log("--------------------\n");
  
  console.log("Deploying to Sepolia with account:", deployer.address);

  // Deploy RWAToken
  console.log("\nDeploying RWAToken...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy("RealWorldAsset", "RWA");
  await token.waitForDeployment();
  
  console.log("RWAToken deployed to:", await token.getAddress());

  // Deploy Marketplace
  console.log("\nDeploying Marketplace...");
  const RWAMarketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await RWAMarketplace.deploy(
    await token.getAddress(),
    2 // 2% fee
  );
  await marketplace.waitForDeployment();
  
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  // Save the addresses for frontend
  console.log("\n📝 Contract addresses to update in frontend:");
  console.log("--------------------");
  console.log("TOKEN_ADDRESS =", await token.getAddress());
  console.log("MARKETPLACE_ADDRESS =", await marketplace.getAddress());
  console.log("--------------------");

  // Display final deployment summary
  console.log("\n✅ Deployment Summary:");
  console.log("--------------------");
  console.log("Network: Sepolia");
  console.log("Deployer Address:", deployer.address);
  console.log("RWAToken Address:", await token.getAddress());
  console.log("Marketplace Address:", await marketplace.getAddress());
  console.log("--------------------\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
