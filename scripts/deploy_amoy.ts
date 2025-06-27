// scripts/deploy_amoy.ts

import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n🔑 Deployment Info:");
  console.log("--------------------");
  console.log("Deploying from address:", deployer.address);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "MATIC");
  console.log("--------------------\n");

  // Step 1: Deploy the RWA Token contract
  console.log("\nDeploying RWAToken...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy("RealWorldAsset", "RWA");
  await token.waitForDeployment();
  console.log("RWAToken deployed to:", await token.getAddress());

  // Step 2: Deploy the Marketplace contract
  
  // Get Chainlink Price Feed Address from environment or use default Amoy ETH/USD feed
  const priceFeedAddress = process.env.AMOY_ETH_USD_PRICE_FEED || 
                          "0xF0d50568e3A7e8259E16663972b11910F89BD8e7"; // Amoy ETH/USD
  
  console.log("\nDeploying Marketplace with price feed:", priceFeedAddress);
  const Marketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await Marketplace.deploy(
    await token.getAddress(), 
    2, // 2% fee
    priceFeedAddress
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
  console.log("Network: Polygon Amoy");
  console.log("Deployer Address:", deployer.address);
  console.log("RWAToken Address:", await token.getAddress());
  console.log("Marketplace Address:", await marketplace.getAddress());
  console.log("Price Feed Address:", priceFeedAddress);
  console.log("--------------------\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
