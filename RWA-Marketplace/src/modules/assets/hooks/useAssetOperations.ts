/**
 * Hook for asset operations
 *
 * This hook provides access to asset operations like buying, listing, and minting.
 */

import { useState } from 'react';
import { Signer } from 'ethers';
import { Asset } from '../../../types/index';
import { createAssetService } from '../services/assetService';
import { createActivityTrackingService } from '../../activity/services/activityTrackingService';
import { TestResult, ActionType, ActionStatus } from '../../../types/index';

interface UseAssetOperationsProps {
  signer: Signer | null;
  account: string | null;
  assets: Asset[];
  initializeContracts: () => Promise<{ tokenContract: unknown, marketplaceContract: unknown }>;
  addActivityResult: (result: {
    action: ActionType;
    status: ActionStatus;
    assetId?: number;
    amount?: string;
    txHash?: string;
    error?: string;
    details?: string;
    timestamp?: number;
  }) => void;
  results: TestResult[];
}

export function useAssetOperations({
  signer,
  account,
  assets,
  initializeContracts,
  addActivityResult,
  results
}: UseAssetOperationsProps) {
  const [loading, setLoading] = useState(false);

  // Create an activity tracking service
  const activityService = createActivityTrackingService(
    addActivityResult,
    () => results
  );

  // Function to refresh assets
  const fetchAssets = (forceRefresh: boolean): void => {
    // The forceRefresh parameter is used to indicate whether to bypass cache
    console.log(`Refreshing assets (force: ${forceRefresh})`);

    // The useAssets hook automatically fetches assets when account or signer changes
    // To force a refresh, we can invalidate the query cache
    if (forceRefresh) {
      // This would typically use a queryClient to invalidate and refetch
      // For now, we'll just log the action
      console.log('Force refreshing assets from blockchain');
    }
  };

  // Create the asset service with wrapped operations that handle loading state
  const assetService = createAssetService(
    signer,
    account,
    assets,
    initializeContracts,
    activityService,
    fetchAssets
  );

  // Wrap the service methods to handle loading state
  const wrappedService = {
    handleBuyAsset: async (id: number): Promise<void> => {
      try {
        setLoading(true);
        await assetService.handleBuyAsset(id);
      } finally {
        setLoading(false);
      }
    },

    handleListAsset: async (id: number): Promise<void> => {
      try {
        setLoading(true);
        await assetService.handleListAsset(id);
      } finally {
        setLoading(false);
      }
    },

    handleMintAsset: async (): Promise<void> => {
      try {
        setLoading(true);
        await assetService.handleMintAsset();
      } finally {
        setLoading(false);
      }
    },

    fetchAssets
  };

  return {
    ...wrappedService,
    loading
  };
}
