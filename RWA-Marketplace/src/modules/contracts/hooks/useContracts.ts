/**
 * Hook for initializing and interacting with smart contracts
 * Provides functions to initialize token and marketplace contracts
 */
import { Contract, Signer } from 'ethers';
import { TOKEN_ADDRESS, MARKETPLACE_ADDRESS } from '../../constants';
import tokenABI from '../../../abis/RWAToken.sol/RWAToken.json';
import marketplaceABI from '../../../abis/RWAMarketplace.sol/RWAMarketplace.json';

export const useContracts = (signer: unknown) => {
  /**
   * Initializes token and marketplace contracts with the provided signer
   * @returns Object containing initialized contract instances
   */
  const initializeContracts = async () => {
    if (!signer) {
      throw new Error('Signer is required to initialize contracts');
    }

    try {
      // Create contract instances with the provided signer
      const tokenContract = new Contract(
        TOKEN_ADDRESS,
        tokenABI.abi,
        signer as Signer
      );

      const marketplaceContract = new Contract(
        MARKETPLACE_ADDRESS,
        marketplaceABI.abi,
        signer as Signer
      );

      // Verify contracts are accessible
      try {
        // Simple read-only calls to verify contracts are working
        await tokenContract.name();
        await marketplaceContract.feePercentage();
        console.log("Contracts initialized and verified successfully");
      } catch (error) {
        console.warn("Contract verification failed, but continuing:", error);
        // Continue anyway - some functions might still work
      }

      return { tokenContract, marketplaceContract };
    } catch (error) {
      console.error('Error initializing contracts:', error);
      throw new Error(`Failed to initialize contracts: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return { initializeContracts };
};

