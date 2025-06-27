/**
 * Asset Operations Service
 *
 * This service provides functions for performing operations on assets such as:
 * - Buying assets from the marketplace
 * - Listing assets for sale on the marketplace
 * - Minting new assets
 *
 * Each function handles the complete workflow including:
 * - Input validation
 * - Contract interactions
 * - Activity tracking
 * - Error handling
 */

import { parseEther, Signer, Contract } from 'ethers';
import { Asset } from '../../../types/index';
import { ActivityTrackingService } from '../../activity/services/activityTrackingService';

/**
 * Handles the process of buying an asset from the marketplace
 * This involves sending ETH to the marketplace contract to purchase the asset
 *
 * @param id - The ID of the asset to buy
 * @param asset - The asset object containing details about the asset
 * @param signer - The ethers.js Signer instance
 * @param account - The current user's account address
 * @param initializeContracts - Function to initialize contract instances
 * @param activityService - Service for tracking activities
 * @param onSuccess - Callback function to execute on successful purchase
 * @returns A promise that resolves when the operation is complete
 */
export async function buyAsset(
  id: number,
  assets: Asset[],
  _signer: Signer, // Required for type consistency, not used directly
  account: string,
  initializeContracts: () => Promise<{ tokenContract: unknown, marketplaceContract: unknown }>,
  activityService: ActivityTrackingService,
  onSuccess: () => void
): Promise<void> {
  // Find the asset in our list to get its details
  const asset = assets.find(a => a.id === id);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Check if the asset is listed for sale
  if (!asset.listed) {
    throw new Error('This asset is not listed for sale');
  }

  // Check if the user is trying to buy their own asset
  if (account.toLowerCase() === asset.owner.toLowerCase()) {
    throw new Error('You cannot buy your own asset');
  }

  // Get the price of the asset
  const price = asset.price ? parseFloat(asset.price) : 0;
  if (price <= 0) {
    throw new Error('Invalid price for this asset');
  }

  // Track the initial pending activity
  activityService.addActivityResult({
    action: 'buy',
    status: 'pending',
    assetId: id,
    amount: price.toString(),
    details: `Preparing to buy asset for ${price} ETH...`,
    timestamp: Date.now()
  });

  // Confirm the purchase with the user
  const confirmed = window.confirm(`Are you sure you want to buy Asset #${id} for ${price} ETH?`);
  if (!confirmed) {
    // User cancelled
    activityService.addActivityResult({
      action: 'buy',
      status: 'error',
      assetId: id,
      amount: price.toString(),
      details: 'Purchase cancelled by user',
      timestamp: Date.now()
    });
    return;
  }

  // Step 1: Initialize contracts
  console.log('Initializing contracts...');
  const { marketplaceContract } = await initializeContracts();
  console.log('Contracts initialized successfully');

  // Step 2: Call the buyAsset function on the marketplace contract with the correct value
  // Convert the price to wei (the smallest unit of ether)
  const priceInWei = parseEther(price.toString());
  console.log(`Buying asset ID: ${id} for price: ${price} ETH (${priceInWei} wei)`);

  // Track the purchase activity
  activityService.addActivityResult({
    action: 'buy',
    status: 'pending',
    assetId: id,
    amount: price.toString(),
    details: `Sending ${price} ETH to purchase asset...`,
    timestamp: Date.now()
  });

  // Call the buyAsset function on the marketplace contract with the ETH value
  const buyTx = await (marketplaceContract as Contract).buyAsset(id, { value: priceInWei });
  console.log(`Purchase transaction hash: ${buyTx.hash}`);

  // Track the waiting confirmation activity
  activityService.addActivityResult({
    action: 'buy',
    status: 'waiting_confirmation',
    assetId: id,
    amount: price.toString(),
    txHash: buyTx.hash,
    details: 'Waiting for purchase confirmation...',
    timestamp: Date.now()
  });

  // Wait for the purchase transaction to be confirmed
  console.log('Waiting for purchase transaction confirmation...');
  const buyReceipt = await buyTx.wait();
  console.log('Purchase transaction confirmed:', buyReceipt);

  // Step 3: Track the transaction and update the UI
  // Track the successful purchase
  activityService.addActivityResult({
    action: 'buy',
    status: 'success',
    assetId: id,
    amount: price.toString(),
    txHash: buyTx.hash,
    details: `Successfully purchased asset for ${price} ETH`,
    timestamp: Date.now()
  });

  console.log(`Asset #${id} successfully purchased for ${price} ETH`);

  // Show success message to the user
  alert(`Asset #${id} has been successfully purchased for ${price} ETH`);

  // Call the success callback
  onSuccess();
}

/**
 * Handles the process of listing an asset for sale on the marketplace
 * This involves a two-step process:
 * 1. Approve the marketplace contract to transfer the token
 * 2. List the asset on the marketplace with a specified price
 *
 * @param id - The ID of the asset to list
 * @param assets - Array of assets to find the asset to list
 * @param signer - The ethers.js Signer instance
 * @param account - The current user's account address
 * @param initializeContracts - Function to initialize contract instances
 * @param activityService - Service for tracking activities
 * @param onSuccess - Callback function to execute on successful listing
 * @returns A promise that resolves when the operation is complete
 */
export async function listAsset(
  id: number,
  assets: Asset[],
  _signer: Signer, // Required for type consistency, not used directly
  account: string,
  initializeContracts: () => Promise<{ tokenContract: unknown, marketplaceContract: unknown }>,
  activityService: ActivityTrackingService,
  onSuccess: () => void
): Promise<void> {
  // Find the asset in our list to get its details
  const asset = assets.find(a => a.id === id);
  if (!asset) {
    throw new Error('Asset not found');
  }

  // Check if the user is the owner of the asset
  if (account.toLowerCase() !== asset.owner.toLowerCase()) {
    throw new Error('You can only list assets that you own');
  }

  // Check if the asset is already listed
  if (asset.listed) {
    throw new Error('This asset is already listed for sale');
  }

  // Track the initial pending activity
  activityService.addActivityResult({
    action: 'list',
    status: 'pending',
    assetId: id,
    details: 'Preparing to list asset for sale...',
    timestamp: Date.now()
  });

  // Get a price from the user
  const priceInput = prompt('Enter the listing price in ETH:');
  if (!priceInput) {
    // User cancelled
    activityService.addActivityResult({
      action: 'list',
      status: 'error',
      assetId: id,
      details: 'Listing cancelled by user',
      timestamp: Date.now()
    });
    return;
  }

  // Validate the price input
  const price = parseFloat(priceInput);
  if (isNaN(price) || price <= 0) {
    activityService.addActivityResult({
      action: 'list',
      status: 'error',
      assetId: id,
      details: 'Invalid price entered',
      timestamp: Date.now()
    });
    throw new Error('Please enter a valid price greater than 0');
  }

  // Step 1: Initialize contracts
  console.log('Initializing contracts...');
  const { tokenContract, marketplaceContract } = await initializeContracts();
  console.log('Contracts initialized successfully');

  // Step 2: Call the approve function on the token contract
  // First, track the approval activity
  activityService.addActivityResult({
    action: 'approve',
    status: 'pending',
    assetId: id,
    details: 'Approving marketplace to transfer asset...',
    timestamp: Date.now()
  });

  // Get the marketplace address
  const marketplaceAddress = await (marketplaceContract as Contract).getAddress();
  console.log(`Marketplace address: ${marketplaceAddress}`);

  // Check if the marketplace is already approved
  const approvedAddress = await (tokenContract as Contract).getApproved(id);
  console.log(`Currently approved address for token ${id}: ${approvedAddress}`);

  // Only approve if not already approved
  if (approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase()) {
    console.log(`Approving marketplace to transfer token ID: ${id}`);

    // Approve the marketplace to transfer the token
    const approveTx = await (tokenContract as Contract).approve(marketplaceAddress, id);
    console.log(`Approval transaction hash: ${approveTx.hash}`);

    // Track the waiting confirmation activity
    activityService.addActivityResult({
      action: 'approve',
      status: 'waiting_confirmation',
      assetId: id,
      txHash: approveTx.hash,
      details: 'Waiting for approval confirmation...',
      timestamp: Date.now()
    });

    // Wait for the approval transaction to be confirmed
    console.log('Waiting for approval transaction confirmation...');
    const approveReceipt = await approveTx.wait();
    console.log('Approval transaction confirmed:', approveReceipt);

    // Track the successful approval
    activityService.addActivityResult({
      action: 'approve',
      status: 'success',
      assetId: id,
      txHash: approveTx.hash,
      details: 'Approval confirmed',
      timestamp: Date.now()
    });
  } else {
    console.log(`Marketplace already approved for token ${id}`);

    // Track the skipped approval
    activityService.addActivityResult({
      action: 'approve',
      status: 'success',
      assetId: id,
      details: 'Marketplace already approved',
      timestamp: Date.now()
    });
  }

  // Step 3: Call the listAsset function on the marketplace contract
  // Track the listing activity
  activityService.addActivityResult({
    action: 'list',
    status: 'pending',
    assetId: id,
    amount: price.toString(),
    details: `Listing asset for ${price} ETH...`,
    timestamp: Date.now()
  });

  // Convert the price to wei (the smallest unit of ether)
  const priceInWei = parseEther(price.toString());
  console.log(`Listing asset ID: ${id} for price: ${price} ETH (${priceInWei} wei)`);

  // Call the listAsset function on the marketplace contract
  const listTx = await (marketplaceContract as Contract).listAsset(id, priceInWei);
  console.log(`Listing transaction hash: ${listTx.hash}`);

  // Track the waiting confirmation activity
  activityService.addActivityResult({
    action: 'list',
    status: 'waiting_confirmation',
    assetId: id,
    amount: price.toString(),
    txHash: listTx.hash,
    details: 'Waiting for listing confirmation...',
    timestamp: Date.now()
  });

  // Wait for the listing transaction to be confirmed
  console.log('Waiting for listing transaction confirmation...');
  const listReceipt = await listTx.wait();
  console.log('Listing transaction confirmed:', listReceipt);

  // Step 4: Track the transaction and update the UI
  // Track the successful listing
  activityService.addActivityResult({
    action: 'list',
    status: 'success',
    assetId: id,
    amount: price.toString(),
    txHash: listTx.hash,
    details: `Asset successfully listed for ${price} ETH`,
    timestamp: Date.now()
  });

  console.log(`Asset #${id} successfully listed for ${price} ETH`);

  // Show success message to the user
  alert(`Asset #${id} has been successfully listed for ${price} ETH`);

  // Call the success callback
  onSuccess();
}

