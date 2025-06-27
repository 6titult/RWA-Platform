import { ethers } from "hardhat";
import type { RWAToken } from "../typechain-types";

async function main() {
  try {
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    // Get the token contract
    const tokenAddress = "0x02E81A7296eDd70E4008a998Df554dcFcFc0f8ab"; // Your token address
    const RWAToken = await ethers.getContractFactory("RWAToken");
    const token = RWAToken.attach(tokenAddress) as RWAToken;
    
    // Check owner
    const owner = await token.owner();
    console.log("Contract owner:", owner);
    console.log("Is signer the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("WARNING: You are not the contract owner. Minting may fail.");
    }
    
    // Try to mint
    console.log("Attempting to mint a new asset...");
    const metadataURI = `ipfs://QmTest${Math.floor(Math.random() * 1000000)}`;
    const legalDocHash = `LEGAL${Math.floor(Math.random() * 1000000)}`;
    const valuation = ethers.parseEther("1.0"); // 1 ETH valuation
    
    const tx = await token.mintAsset(
      signer.address,
      metadataURI,
      legalDocHash,
      valuation,
      { gasLimit: 500000 }
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Minting successful!");
    console.log("Transaction receipt:", receipt);

    // Get the token ID from the event
    if (receipt) {
      const mintEvent = receipt.logs.find(
        (log: any) => log.fragment && log.fragment.name === "Transfer"
      );

      if (mintEvent && 'args' in mintEvent) {
        const tokenId = mintEvent.args[2]; // TokenID is the third parameter in Transfer event
        console.log("Minted token ID:", tokenId.toString());
      }
    }
    
  } catch (error) {
    console.error("Error testing mint function:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});