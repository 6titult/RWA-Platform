// scripts/fundMarketplaceAccounts.ts

/**
 * Script to set up and fund accounts for RWA Marketplace testing
 * This script:
 * 1. Deploys the necessary contracts
 * 2. Mints test assets to the seller
 * 3. Sets up marketplace listings
 * 4. Funds the buyer account with test ETH
 */

import { ethers } from "hardhat";

async function main() {
  // Get test accounts for different roles
  const [deployer, seller, buyer] = await ethers.getSigners();
  
  // Log account addresses for verification
  console.log("Funding accounts for RWA Marketplace testing:");
  console.log("- Deployer:", deployer.address);
  console.log("- Seller:", seller.address);
  console.log("- Buyer:", buyer.address);

  // Step 1: Deploy RWAToken contract
  console.log("\n📄 Deploying RWAToken contract...");
  const RWAToken = await ethers.getContractFactory("RWAToken");
  const token = await RWAToken.deploy("RealWorldAsset", "RWA");
  
  // Step 2: Deploy Marketplace contract with token address and 2% fee
  console.log("\n🏪 Deploying Marketplace contract...");
  const RWAMarketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await RWAMarketplace.deploy(
    await token.getAddress(), 
    2 // 2% platform fee
  );

  // Log deployed contract addresses
  console.log("\nContracts Deployed:");
  console.log("- RWAToken:", token.target);
  console.log("- Marketplace:", marketplace.target);

  // Step 3: Mint test asset to seller
  console.log("\n📦 Minting RWA Assets to Seller:");
  const assetId = 0;
  await token.mintAsset(
    seller.address,
    "ipfs://QmTestAssetMetadata", // IPFS URI for asset metadata
    "legalDocHash123",            // Hash of legal documentation
    ethers.parseUnits("100000", 18) // $100k valuation
  );
  console.log(`Minted Asset #${assetId} to ${seller.address}`);

  // Step 4: Approve marketplace to handle seller's asset
  console.log("\n🔒 Approving Marketplace for Asset Transfers:");
  await token.connect(seller).approve(marketplace.target, assetId);
  console.log("Approval complete");

  // Step 5: Create marketplace listing
  console.log("\n🏷 Listing Asset on Marketplace:");
  const listPrice = ethers.parseEther("1.5"); // 1.5 ETH listing price
  await marketplace.connect(seller).listAsset(assetId, listPrice);
  console.log(`Asset #${assetId} listed for ${ethers.formatEther(listPrice)} ETH`);

  // Step 6: Fund buyer account with test ETH
  console.log("\n💸 Funding Buyer Account:");
  const fundAmount = ethers.parseEther("10"); // 10 ETH for testing
  await deployer.sendTransaction({
    to: buyer.address,
    value: fundAmount
  });
  console.log(`Sent ${ethers.formatEther(fundAmount)} ETH to ${buyer.address}`);

  console.log("\n✅ Marketplace Test Setup Complete!");
}

// Execute the setup script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("🚨 Setup Failed:", error);
    process.exit(1);
  });