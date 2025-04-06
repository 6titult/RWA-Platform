import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useContracts } from '../../contracts/hooks/useContracts';
import type { Asset } from '../../../types/index';
import { MARKETPLACE_ADDRESS } from '../../constants';

export const useAssets = (signer: unknown, account: string | null) => {
  const { initializeContracts } = useContracts(signer);

  return useQuery({
    queryKey: ['assets', account],
    queryFn: async () => {
      if (!signer || !account) return [];

      try {
        const { tokenContract, marketplaceContract } = await initializeContracts();
        const totalTokens = await tokenContract.getTokenIdCounter();
        const currentAddress = await (signer as ethers.Signer).getAddress();

        const assetsList: Asset[] = [];

        for (let i = 0; i < totalTokens; i++) {
          try {
            const listing = await marketplaceContract.listings(i);
            const owner = await tokenContract.ownerOf(i);
            const [legalDocHash, auditor, valuation, auditDate] = await tokenContract.getAssetData(i);
            const uri = await tokenContract.tokenURI(i);

            const isListed = listing.isActive;
            const price = isListed ? ethers.formatEther(listing.price) : undefined;

            if (isListed || owner.toLowerCase() === currentAddress.toLowerCase()) {
              assetsList.push({
                id: i,
                owner,
                uri,
                legalDocHash,
                valuation: ethers.formatUnits(valuation, 18),
                auditor,
                auditDate: new Date(Number(auditDate) * 1000).toLocaleString(),
                listed: isListed,
                price,
                marketplace: MARKETPLACE_ADDRESS
              });
            }
          } catch (error) {
            console.error(`Error processing token ${i}:`, error);
            continue;
          }
        }

        return assetsList;
      } catch (error) {
        console.error('Error fetching assets:', error);
        throw error;
      }
    },
    enabled: !!signer && !!account
  });
};



