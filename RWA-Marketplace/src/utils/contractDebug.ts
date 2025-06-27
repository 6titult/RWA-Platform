/**
 * Contract debugging utilities
 * Helps diagnose common contract interaction issues
 */

import { ethers } from 'ethers';
import { TOKEN_ADDRESS, MARKETPLACE_ADDRESS, getCurrentNetwork } from '../modules/constants';

export const debugContractSetup = async () => {
  console.log('=== Contract Debug Information ===');
  
  // Check if MetaMask is available
  if (!window.ethereum) {
    console.error('❌ MetaMask not detected');
    return false;
  }
  console.log('✅ MetaMask detected');

  try {
    // Check network
    const network = await getCurrentNetwork();
    if (network) {
      console.log(`✅ Connected to supported network: ${network.name}`);
    } else {
      console.warn('⚠️ Connected to unsupported network');
    }

    // Check addresses
    console.log('📍 Contract Addresses:');
    console.log(`   Token: ${TOKEN_ADDRESS}`);
    console.log(`   Marketplace: ${MARKETPLACE_ADDRESS}`);

    // Check if addresses look valid
    if (!ethers.isAddress(TOKEN_ADDRESS)) {
      console.error('❌ Invalid token address format');
      return false;
    }
    if (!ethers.isAddress(MARKETPLACE_ADDRESS)) {
      console.error('❌ Invalid marketplace address format');
      return false;
    }
    console.log('✅ Contract addresses are valid format');

    // Try to get provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network_info = await provider.getNetwork();
    console.log(`🌐 Network Chain ID: ${network_info.chainId}`);

    // Check if contracts have code deployed
    const tokenCode = await provider.getCode(TOKEN_ADDRESS);
    const marketplaceCode = await provider.getCode(MARKETPLACE_ADDRESS);

    if (tokenCode === '0x') {
      console.error('❌ No contract code found at token address - contract may not be deployed');
      return false;
    } else {
      console.log('✅ Token contract has code deployed');
    }

    if (marketplaceCode === '0x') {
      console.error('❌ No contract code found at marketplace address - contract may not be deployed');
      return false;
    } else {
      console.log('✅ Marketplace contract has code deployed');
    }

    console.log('✅ All basic checks passed');
    return true;

  } catch (error) {
    console.error('❌ Error during contract debug:', error);
    return false;
  }
};

export const debugContractCalls = async (signer: ethers.Signer) => {
  console.log('=== Testing Contract Calls ===');
  
  try {
    // Import ABIs
    const tokenABI = await import('../abis/RWAToken.sol/RWAToken.json');
    const marketplaceABI = await import('../abis/RWAMarketplace.sol/RWAMarketplace.json');

    // Create contract instances
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI.abi, signer);
    const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceABI.abi, signer);

    // Test basic read calls
    try {
      const tokenName = await tokenContract.name();
      console.log(`✅ Token name: ${tokenName}`);
    } catch (error) {
      console.error('❌ Failed to get token name:', error);
    }

    try {
      const tokenSymbol = await tokenContract.symbol();
      console.log(`✅ Token symbol: ${tokenSymbol}`);
    } catch (error) {
      console.error('❌ Failed to get token symbol:', error);
    }

    try {
      const feePercentage = await marketplaceContract.feePercentage();
      console.log(`✅ Marketplace fee: ${feePercentage.toString()}%`);
    } catch (error) {
      console.error('❌ Failed to get marketplace fee:', error);
    }

    // Test token existence check
    try {
      await tokenContract.ownerOf(0);
      console.log('✅ Token 0 exists');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('ℹ️ Token 0 does not exist (this is normal if no tokens are minted)');
    }

    console.log('✅ Contract call tests completed');

  } catch (error) {
    console.error('❌ Error during contract call tests:', error);
  }
};
