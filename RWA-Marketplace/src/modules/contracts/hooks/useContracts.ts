/**
 * Hook for initializing and interacting with smart contracts
 * Provides functions to initialize token and marketplace contracts
 */
import { Contract, Signer } from 'ethers';
import { TOKEN_ADDRESS, MARKETPLACE_ADDRESS } from '../../constants';
import { tokenABI, marketplaceABI } from '../abis';

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
        tokenABI,
        signer as Signer
      );

      const marketplaceContract = new Contract(
        MARKETPLACE_ADDRESS,
        marketplaceABI,
        signer as Signer
      );

      return { tokenContract, marketplaceContract };
    } catch (error) {
      console.error('Error initializing contracts:', error);
      throw error;
    }
  };

  return { initializeContracts };
};
