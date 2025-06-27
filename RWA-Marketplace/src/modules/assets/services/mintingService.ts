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
  _signer: Signer,
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

  try {
    // Initialize contracts
    const { tokenContract } = await initializeContracts();
    
    // Log contract address for debugging
    console.log('Token contract address:', (tokenContract as Contract).target);
    
    // Check if the connected account is the contract owner
    try {
      const owner = await (tokenContract as Contract).owner();
      console.log('Contract owner:', owner);
      console.log('Connected account:', account);
      
      if (owner.toLowerCase() !== account.toLowerCase()) {
        throw new Error('Only the contract owner can mint new assets');
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
      throw new Error('Failed to verify ownership: ' + (error instanceof Error ? error.message : String(error)));
    }

    // Generate random test data for the asset
    const metadataURI = `ipfs://QmTest${Math.floor(Math.random() * 1000000)}`;
    const legalDocHash = `LEGAL${Math.floor(Math.random() * 1000000)}`;
    const valuation = Math.floor(Math.random() * 10) + 1; // Random valuation between 1-10 ETH

    console.log('Minting with parameters:', {
      to: account,
      metadataURI,
      legalDocHash,
      valuation: valuation.toString() + ' ETH'
    });

    // Call the mintAsset function on the token contract with gas limit
    const tx = await (tokenContract as Contract).mintAsset(
      account,
      metadataURI,
      legalDocHash,
      parseEther(valuation.toString()),
      { gasLimit: 500000 } // Add explicit gas limit
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
  } catch (error) {
    console.error('Detailed minting error:', error);
    
    // More descriptive error message
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check for common contract errors
      if (errorMessage.includes('execution reverted')) {
        errorMessage = 'Contract execution reverted. You may not have permission to mint assets.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas * price + value. Please add more MATIC to your wallet.';
      }
    }
    
    // Update activity with error status
    activityService.addActivityResult({
      action: 'mint',
      status: 'error',
      error: errorMessage,
      details: 'Failed to mint asset. See console for details.',
      timestamp: Date.now()
    });
    
    throw new Error('Minting failed: ' + errorMessage);
  }
}

