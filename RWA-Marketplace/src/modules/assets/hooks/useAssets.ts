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
        try {
          // Log the price of 1 ETH in USD
          const oneEthInWei = ethers.parseEther("1.0");
          const oneEthInUSD = await marketplaceContract.ethToUSD(oneEthInWei);
          // The price feed returns a value with 8 decimals, so we need to adjust
          const formattedUSDPrice = parseFloat(ethers.formatUnits(oneEthInUSD, 18)) * 100;
          console.log(`Price feed: 1 ETH = $${formattedUSDPrice.toFixed(2)} USD`);
        } catch (error) {
          console.error("Error getting ETH/USD price from data feed:", error);
        }
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
            const price = isListed && listing.price ? ethers.formatEther(listing.price) : undefined;
            let priceInUSD;

            if (isListed && listing.price) {
              try {
                // Call the ethToUSD function to get the USD price
                console.log(`Attempting to convert ${listing.price} wei to USD for asset #${i}`);
                const usdPriceWei = await marketplaceContract.ethToUSD(listing.price);
                // Adjust the decimal places
                const rawUsdPrice = parseFloat(ethers.formatUnits(usdPriceWei, 18));
                const adjustedUsdPrice = rawUsdPrice * 100; // Multiply by 100 to get the correct value
                priceInUSD = adjustedUsdPrice.toString();
                console.log(`Asset #${i} ETH price: ${price}, USD price: ${priceInUSD}`);
              } catch (error) {
                console.error(`Error getting USD price for asset #${i}:`, error);
                console.error(`Error details:`, error instanceof Error ? error.stack : String(error));
                priceInUSD = undefined;
              }
            } else {
              priceInUSD = undefined;
            }

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
                priceInUSD,
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



