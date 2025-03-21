// scripts/deploy.ts

// Import the ethers library from Hardhat for blockchain interaction
import { ethers } from "hardhat";

// Main deployment function
async function main() {
  // Get the first signer (deployer) from the available accounts
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Step 1: Deploy the RWA (Real World Asset) Token contract
  // Deploy RWA Token with custom name and symbol
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy("RealWorldAsset", "RWA");
  // Wait for the deployment transaction to be mined
  await token.waitForDeployment();
  console.log("RWAToken deployed to:", await token.getAddress());

  // Step 2: Deploy the Marketplace contract
  // Deploy Marketplace 
  const Marketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await Marketplace.deploy(
    await token.getAddress(), 
    2 // 2% fee
  );
  // Wait for the deployment transaction to be mined
  await marketplace.waitForDeployment();
  console.log("Marketplace deployed to:", await marketplace.getAddress());
}

// Execute the deployment script and handle any errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
