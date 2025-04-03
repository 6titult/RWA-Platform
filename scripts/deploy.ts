// scripts/deploy.ts

// Import the ethers library from Hardhat for blockchain interaction
import { ethers } from "hardhat";

// Main deployment function
async function main() {
  // Get the first signer (deployer) from the available accounts
  const [deployer] = await ethers.getSigners();
  
  // Display deployer information
  console.log("\n🔑 Deployment Info:");
  console.log("--------------------");
  console.log("Deploying from address:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  console.log("--------------------\n");

  // Step 1: Deploy the RWA (Real World Asset) Token contract
  console.log("\nDeploying RWAToken...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy("RealWorldAsset", "RWA");
  await token.waitForDeployment();
  console.log("RWAToken deployed to:", await token.getAddress());

  // Step 2: Deploy the Marketplace contract
  console.log("\nDeploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await Marketplace.deploy(
    await token.getAddress(), 
    2 // 2% fee
  );
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());

  // Display final deployment summary
  console.log("\n📝 Contract addresses to update in frontend:");
  console.log("--------------------");
  console.log("TOKEN_ADDRESS =", await token.getAddress());
  console.log("MARKETPLACE_ADDRESS =", await marketplace.getAddress());
  console.log("--------------------");

  console.log("\n✅ Deployment Summary:");
  console.log("--------------------");
  console.log("Network: Sepolia");
  console.log("Deployer Address:", deployer.address);
  console.log("RWAToken Address:", await token.getAddress());
  console.log("Marketplace Address:", await marketplace.getAddress());
  console.log("--------------------\n");
}

// Execute the deployment script and handle any errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
