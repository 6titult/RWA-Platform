// test/RWAMarketplace.test.ts

/**
 * Test suite for the RWA Marketplace contract
 * Tests the functionality of listing and trading Real World Assets
 */

import { expect } from "chai";
import { ethers } from "hardhat";

describe("RWAMarketplace", function () {
  // Contract instances
  let token: any, marketplace: any;
  // Test accounts for different roles
  let owner: any, seller: any, buyer: any;
  // Platform fee configuration
  const FEE_PERCENTAGE = 2; // 2% platform fee

  /**
   * Setup function runs before all tests
   * Deploys contracts and sets up test accounts
   */
  before(async () => {
    console.log("\n🚀 Starting RWAMarketplace test setup...");
    
    // Get test accounts for different roles
    [owner, seller, buyer] = await ethers.getSigners();
    console.log(`📝 Test accounts initialized:`);
    console.log(`   Owner: ${owner.address}`);
    console.log(`   Seller: ${seller.address}`);
    console.log(`   Buyer: ${buyer.address}`);

    // Step 1: Deploy RWAToken contract first as marketplace depends on it
    console.log("\n📄 Deploying RWAToken contract...");
    const Token = await ethers.getContractFactory("RWAToken");
    token = await Token.deploy("RealWorldAsset", "RWA");
    console.log(`   RWAToken deployed to: ${await token.getAddress()}`);

    // Step 2: Deploy Marketplace with token address and fee configuration
    console.log("\n🏪 Deploying Marketplace contract...");
    const Marketplace = await ethers.getContractFactory("RWAMarketplace");
    marketplace = await Marketplace.deploy(token.target, FEE_PERCENTAGE);
    console.log(`   Marketplace deployed to: ${await marketplace.getAddress()}`);
    console.log(`   Platform fee set to: ${FEE_PERCENTAGE}%`);
    
    console.log("\n✅ Setup completed successfully\n");
  });

  /**
   * Test suite for contract deployment
   * Verifies correct initialization of contract parameters
   */
  describe("Deployment", function () {
    it("Should set the correct token address and fee", async function () {
      console.log("\n🔍 Testing marketplace initialization...");
      // Verify RWAToken address is correctly set
      expect(await marketplace.rwaToken()).to.equal(await token.getAddress());
      // Verify platform fee percentage is correctly set
      expect(await marketplace.feePercentage()).to.equal(FEE_PERCENTAGE);
      console.log("   Initialization parameters verified");
    });
  });

  /**
   * Test suite for asset listing functionality
   * Tests creation and validation of marketplace listings
   */
  describe("Listing Assets", function () {
    // Setup: Mint a token to the seller before testing listings
    before(async function () {
      console.log("\n📦 Preparing asset for listing tests...");
      // Mint token to seller with test metadata and valuation
      await token.mintAsset(
        seller.address,
        "ipfs://QmTest...",
        "QmTestLegalDoc",
        100000 // $100,000 valuation
      );
      console.log("   Asset minted to seller");
    });

    it("Should list an asset successfully", async function () {
      console.log("\n📝 Testing asset listing...");
      
      // Step 1: Approve marketplace to transfer the token
      await token.connect(seller).approve(marketplace.target, 0);
      console.log("   Marketplace approved for token transfer");

      // Step 2: Create listing with 1 ETH price
      const listingPrice = ethers.parseEther("1");
      await marketplace.connect(seller).listAsset(0, listingPrice);
      
      // Step 3: Verify listing details
      const listing = await marketplace.listings(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(listingPrice);
      expect(listing.isActive).to.be.true;
      
      console.log("   Asset listed successfully");
    });

    it("Should fail to list if not owner", async function () {
      console.log("\n❌ Testing unauthorized listing...");
      
      // Attempt to list token owned by seller using buyer's account
      await expect(
        marketplace.connect(buyer).listAsset(0, ethers.parseEther("1"))
      ).to.be.revertedWith("Not owner");
      
      console.log("   Unauthorized listing properly rejected");
    });
  });

  /**
   * Test suite for asset purchasing functionality
   * Tests buying process, payment handling, and ownership transfers
   */
  describe("Buying Assets", function () {
    it("Should complete purchase successfully", async function () {
      console.log("\n🛍️ Testing asset purchase...");
      
      // Calculate expected payment amounts
      const listingPrice = ethers.parseEther("1");
      const fee = (listingPrice * BigInt(FEE_PERCENTAGE)) / 100n;
      const sellerProceeds = listingPrice - fee;
      
      // Record seller's balance before sale
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      
      // Execute purchase
      await marketplace.connect(buyer).buyAsset(0, { value: listingPrice });
      
      // Verify ownership transfer
      expect(await token.ownerOf(0)).to.equal(buyer.address);
      
      // Verify seller received correct payment (minus platform fee)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerProceeds);
      
      // Verify listing is deactivated after sale
      const listing = await marketplace.listings(0);
      expect(listing.isActive).to.be.false;
      
      console.log("   Purchase completed successfully");
    });

    it("Should fail to buy unlisted asset", async function () {
      console.log("\n❌ Testing purchase of unlisted asset...");
      
      // Attempt to purchase previously sold (inactive) listing
      await expect(
        marketplace.connect(buyer).buyAsset(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Not for sale");
      
      console.log("   Purchase of unlisted asset properly rejected");
    });

    it("Should fail with insufficient funds", async function () {
      console.log("\n❌ Testing purchase with insufficient funds...");
      
      // Setup: Create new listing
      await token.mintAsset(
        seller.address,
        "ipfs://QmTest2...",
        "QmTestLegalDoc2",
        200000 // $200,000 valuation
      );
      await token.connect(seller).approve(marketplace.target, 1);
      await marketplace.connect(seller).listAsset(1, ethers.parseEther("2"));
      
      // Attempt to buy with half the required price
      await expect(
        marketplace.connect(buyer).buyAsset(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Insufficient funds");
      
      console.log("   Insufficient funds properly rejected");
    });
  });
}); 