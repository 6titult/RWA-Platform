// test/RWAPlatform.test.ts

// Import required testing and Ethereum development libraries
import { expect } from "chai";
import { ethers } from "hardhat";

// Test suite for the RWA (Real World Asset) Platform
describe("RWA Platform", function () {
  // Declare variables to store contract instances and test accounts
  let token: any, marketplace: any;
  let owner: any, user1: any;

  // Setup function runs before all tests
  before(async () => {
    console.log("\n🚀 Starting RWA Platform test setup...");
    
    // Get test accounts (signers) from Hardhat
    [owner, user1] = await ethers.getSigners();
    console.log(`📝 Test accounts initialized:`);
    console.log(`   Owner: ${owner.address}`);
    console.log(`   User1: ${user1.address}`);

    // Deploy the RWAToken contract
    console.log("\n📄 Deploying RWAToken contract...");
    const Token = await ethers.getContractFactory("RWAToken");
    token = await Token.deploy("RealWorldAsset", "RWA");
    console.log(`   RWAToken deployed to: ${await token.getAddress()}`);

    // Deploy the Marketplace contract with token address and fee percentage (2%)
    console.log("\n🏪 Deploying Marketplace contract...");
    const Marketplace = await ethers.getContractFactory("RWAMarketplace");
    marketplace = await Marketplace.deploy(token.target, 2);
    console.log(`   Marketplace deployed to: ${await marketplace.getAddress()}`);
    console.log(`   Platform fee set to: 2%`);
    
    console.log("\n✅ Setup completed successfully\n");
  });

  // Test case: Minting and listing an asset on the marketplace
  it("Should mint and list an asset", async function () {
    console.log("\n🔍 Testing asset minting and listing...");
    
    // Mint a new RWA token with:
    // - owner's address as the recipient
    // - IPFS hash for the asset metadata
    // - Legal document hash for compliance
    // - Valuation of $100,000
    console.log("\n💎 Minting new RWA token...");
    await token.mintAsset(
      owner.address,
      "ipfs://Qm...",
      "QmaLegalDocHash",
      100000 // $100,000 valuation
    );
    console.log(`   Token minted to: ${owner.address}`);
    console.log(`   Valuation: $100,000`);

    // Approve the marketplace contract to transfer the token (ID: 0)
    console.log("\n✋ Approving marketplace for token transfer...");
    await token.approve(marketplace.target, 0);
    console.log(`   Marketplace approved for Token ID: 0`);

    // List the asset on the marketplace for 1 ETH
    console.log("\n📝 Listing asset on marketplace...");
    await marketplace.listAsset(0, ethers.parseEther("1"));
    console.log(`   Listed Token ID: 0`);
    console.log(`   Price: 1 ETH`);

    // Retrieve the listing information
    const listing = await marketplace.listings(0);
    console.log("\n📊 Listing details:");
    console.log(`   Seller: ${listing.seller}`);
    console.log(`   Price: ${ethers.formatEther(listing.price)} ETH`);
    console.log(`   Active: ${listing.isActive}`);

    // Verify the listing price is set correctly to 1 ETH
    expect(listing.price).to.equal(ethers.parseEther("1"));
    console.log("\n✅ Test completed successfully\n");
  });
});
