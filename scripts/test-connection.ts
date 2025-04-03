import { ethers } from "hardhat";

async function main() {
  try {
    // Get the provider
    const provider = ethers.provider;
    
    // Test basic connection
    console.log("Testing network connection...");
    const network = await provider.getNetwork();
    console.log("Connected to network:", {
      name: network.name,
      chainId: network.chainId.toString()
    });

    // Test block access
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block number:", blockNumber);

    // Test account access
    const [signer] = await ethers.getSigners();
    const balance = await provider.getBalance(signer.address);
    console.log("Account address:", signer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

  } catch (error) {
    console.error("Connection test failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });