/**
 * Test script to demonstrate the simplified marketplace functionality
 * This script shows how the "Insufficient funds" issue is resolved
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Testing Simplified RWA Marketplace");
  console.log("=====================================\n");

  // Get test accounts
  const [owner, seller, buyer] = await ethers.getSigners();
  
  console.log("📋 Test Setup:");
  console.log(`   Seller: ${seller.address}`);
  console.log(`   Buyer: ${buyer.address}`);
  
  // Get buyer's initial balance
  const buyerInitialBalance = await ethers.provider.getBalance(buyer.address);
  console.log(`   Buyer's initial balance: ${ethers.formatEther(buyerInitialBalance)} ETH\n`);

  // Deploy contracts
  console.log("🚀 Deploying contracts...");
  
  // Deploy RWAToken
  const Token = await ethers.getContractFactory("RWAToken");
  const token = await Token.deploy("RealWorldAsset", "RWA");
  await token.waitForDeployment();
  
  // Deploy Marketplace (using zero address for price feed since we're not using USD conversion)
  const Marketplace = await ethers.getContractFactory("RWAMarketplace");
  const marketplace = await Marketplace.deploy(
    await token.getAddress(), 
    2, // 2% fee
    ethers.ZeroAddress // No price feed needed for ETH-only transactions
  );
  await marketplace.waitForDeployment();
  
  console.log(`   Token deployed to: ${await token.getAddress()}`);
  console.log(`   Marketplace deployed to: ${await marketplace.getAddress()}\n`);

  // Mint an asset to the seller (note: only owner can mint)
  console.log("🎨 Minting asset to seller...");
  const tx = await token.connect(owner).mintAsset(
    seller.address,
    "https://example.com/metadata.json",
    "legal-doc-hash-123",
    ethers.parseEther("100") // 100 ETH value
  );
  const receipt = await tx.wait();
  const tokenId = 0; // First minted token will have ID 0
  console.log(`   Asset #${tokenId} minted to seller\n`);

  // Approve marketplace to transfer the token
  console.log("✅ Approving marketplace...");
  await token.connect(seller).approve(await marketplace.getAddress(), tokenId);
  console.log("   Marketplace approved for token transfer\n");

  // List the asset for 0.01 ETH
  const listingPrice = ethers.parseEther("0.01"); // 0.01 ETH
  console.log("📝 Listing asset...");
  console.log(`   Listing price: ${ethers.formatEther(listingPrice)} ETH`);
  
  await marketplace.connect(seller).listAsset(tokenId, listingPrice);
  console.log("   Asset listed successfully\n");

  // Check the listing
  const listing = await marketplace.listings(tokenId);
  console.log("📊 Listing details:");
  console.log(`   Seller: ${listing.seller}`);
  console.log(`   Price: ${ethers.formatEther(listing.price)} ETH`);
  console.log(`   Active: ${listing.isActive}\n`);

  // Attempt to buy with 0.03 ETH (more than enough)
  const buyAmount = ethers.parseEther("0.03"); // 0.03 ETH
  console.log("🛒 Attempting to buy asset...");
  console.log(`   Buyer has: ${ethers.formatEther(buyerInitialBalance)} ETH`);
  console.log(`   Sending: ${ethers.formatEther(buyAmount)} ETH`);
  console.log(`   Required: ${ethers.formatEther(listingPrice)} ETH`);

  try {
    const tx = await marketplace.connect(buyer).buyAsset(tokenId, { value: buyAmount });
    await tx.wait();
    
    console.log("✅ Purchase successful!\n");
    
    // Check final balances and ownership
    const newOwner = await token.ownerOf(tokenId);
    const buyerFinalBalance = await ethers.provider.getBalance(buyer.address);
    const sellerBalance = await ethers.provider.getBalance(seller.address);
    
    console.log("📊 Final Results:");
    console.log(`   New owner of asset #${tokenId}: ${newOwner}`);
    console.log(`   Buyer's final balance: ${ethers.formatEther(buyerFinalBalance)} ETH`);
    console.log(`   Seller's balance: ${ethers.formatEther(sellerBalance)} ETH`);
    
    // Calculate the actual cost (including gas)
    const totalCost = buyerInitialBalance - buyerFinalBalance;
    console.log(`   Total cost to buyer (including gas): ${ethers.formatEther(totalCost)} ETH`);
    
    // Check if listing is deactivated
    const updatedListing = await marketplace.listings(tokenId);
    console.log(`   Listing active: ${updatedListing.isActive}`);
    
    console.log("\n🎉 Test completed successfully!");
    console.log("The 'Insufficient funds' issue has been resolved!");
    
  } catch (error) {
    console.error("❌ Purchase failed:", error);
  }
}

// Run the test
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
