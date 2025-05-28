/**
 * Asset Service
 *
 * This service provides a unified interface for all asset-related operations.
 * It acts as a facade for the various asset operation services.
 */

import { Signer } from 'ethers';
import { Asset } from '../../../types/index';
import { ActivityTrackingService } from '../../activity/services/activityTrackingService';
import { buyAsset, listAsset } from './assetOperations';
import { mintAsset } from './mintingService';

/**
 * Create an asset service that provides all asset-related operations
 *
 * @param signer The ethers.js Signer instance
 * @param account The current user's account address
 * @param assets Array of assets
 * @param initializeContracts Function to initialize contract instances
 * @param activityService Service for tracking activities
 * @param refreshAssets Function to refresh the assets list
 * @returns An object with all asset-related operations
 */
export function createAssetService(
  signer: Signer | null,
  account: string | null,
  assets: Asset[],
  initializeContracts: () => Promise<{ tokenContract: unknown, marketplaceContract: unknown }>,
  activityService: ActivityTrackingService,
  refreshAssets: (forceRefresh: boolean) => void
) {
  /**
   * Validate that the wallet is connected before performing operations
   */
  const validateWalletConnection = () => {
    if (!signer || !account) {
      throw new Error('Please connect your wallet first');
    }
  };

  return {
    /**
     * Buy an asset from the marketplace
     * @param id The ID of the asset to buy
     */
    handleBuyAsset: async (id: number): Promise<void> => {
      try {
        validateWalletConnection();
        await buyAsset(
          id,
          assets,
          signer as Signer, // This becomes _signer in the implementation
          account as string,
          initializeContracts,
          activityService,
          () => refreshAssets(true)
        );
      } catch (error) {
        console.error(`Error buying asset #${id}:`, error);

        // Track the error
        activityService.addActivityResult({
          action: 'buy',
          status: 'error',
          assetId: id,
          error: error instanceof Error ? error.message : String(error),
          details: 'Failed to buy asset',
          timestamp: Date.now()
        });

        // Show error message to the user
        alert(`Error buying asset: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    /**
     * List an asset for sale on the marketplace
     * @param id The ID of the asset to list
     */
    handleListAsset: async (id: number): Promise<void> => {
      try {
        validateWalletConnection();
        await listAsset(
          id,
          assets,
          signer as Signer, // This becomes _signer in the implementation
          account as string,
          initializeContracts,
          activityService,
          () => refreshAssets(true)
        );
      } catch (error) {
        console.error(`Error listing asset #${id}:`, error);

        // Track the error
        activityService.addActivityResult({
          action: 'list',
          status: 'error',
          assetId: id,
          error: error instanceof Error ? error.message : String(error),
          details: 'Failed to list asset',
          timestamp: Date.now()
        });

        // Show error message to the user
        alert(`Error listing asset: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    /**
     * Mint a new asset
     */
    handleMintAsset: async (): Promise<void> => {
      try {
        validateWalletConnection();
        await mintAsset(
          signer as Signer, // This becomes _signer in the implementation
          account as string,
          initializeContracts,
          activityService,
          () => refreshAssets(true)
        );
      } catch (error) {
        console.error('Error minting asset:', error);

        // Track the error
        activityService.addActivityResult({
          action: 'mint',
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          details: 'Failed to mint asset',
          timestamp: Date.now()
        });

        // Show error message to the user
        alert(`Error minting asset: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };
}
