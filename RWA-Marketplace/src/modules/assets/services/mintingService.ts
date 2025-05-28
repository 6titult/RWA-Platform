/**
 * Minting Service
 *
 * This service provides functionality for minting new assets on the blockchain.
 */

import { Contract, parseEther, Signer } from 'ethers';
import { ActivityTrackingService } from '../../activity/services/activityTrackingService';

/**
 * Mint a new asset on the blockchain
 *
 * @param signer The ethers.js Signer instance
 * @param account The current user's account address
 * @param initializeContracts Function to initialize contract instances
 * @param activityService Service for tracking activities
 * @param onSuccess Callback function to execute on successful minting
 */
export async function mintAsset(
  _signer: Signer, // Required for type consistency, not used directly
  account: string,
  initializeContracts: () => Promise<{ tokenContract: unknown, marketplaceContract: unknown }>,
  activityService: ActivityTrackingService,
  onSuccess: () => void
): Promise<void> {
  console.log('Minting new asset...');

  // Add a pending activity
  activityService.addActivityResult({
    action: 'mint',
    status: 'pending',
    details: 'Preparing to mint a new asset...',
    timestamp: Date.now()
  });

  // Initialize contracts
  const { tokenContract } = await initializeContracts();

  // Generate random test data for the asset
  const metadataURI = `ipfs://QmTest${Math.floor(Math.random() * 1000000)}`;
  const legalDocHash = `LEGAL${Math.floor(Math.random() * 1000000)}`;
  const valuation = Math.floor(Math.random() * 10) + 1; // Random valuation between 1-10 ETH

  // Call the mintAsset function on the token contract
  const tx = await (tokenContract as Contract).mintAsset(
    account,
    metadataURI,
    legalDocHash,
    parseEther(valuation.toString())
  );

  // Update activity with waiting status
  activityService.addActivityResult({
    action: 'mint',
    status: 'waiting_confirmation',
    txHash: tx.hash,
    details: `Minting asset with valuation ${valuation} ETH...`,
    timestamp: Date.now()
  });

  // Wait for transaction confirmation
  const receipt = await tx.wait();

  // Update activity with success status
  activityService.addActivityResult({
    action: 'mint',
    status: 'success',
    txHash: tx.hash,
    details: `Successfully minted new asset with valuation ${valuation} ETH`,
    timestamp: Date.now()
  });

  console.log('Minting successful:', receipt);

  // Call the success callback
  onSuccess();
}
