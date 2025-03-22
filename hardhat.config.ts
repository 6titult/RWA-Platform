import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Ajoutez cette section
task("faucet", "Send ETH to an address")
  .addParam("address", "The address to fund")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const amount = hre.ethers.parseEther("1000"); // 1000 ETH par défaut
    
    const tx = await deployer.sendTransaction({
      to: taskArgs.address,
      value: amount,
    });

    console.log(`✅ ${hre.ethers.formatEther(amount)} ETH envoyés à ${taskArgs.address}`);
    console.log(`Transaction hash: ${tx.hash}`);
  });

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};

export default config;
