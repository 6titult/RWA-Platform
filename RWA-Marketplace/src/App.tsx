/**
 * RWA (Real World Asset) Marketplace Application
 *
 * This is the main application component that provides functionality for:
 * - Wallet connection and management (MetaMask)
 * - Smart contract interactions (RWAToken and RWAMarketplace)
 * - Asset management (viewing, minting, listing, buying)
 * - Transaction tracking and activity logging
 *
 * @module App
 */


import { BrowserProvider, parseEther } from 'ethers';
import { Container, Nav, Navbar, Card, Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import './styles/App.css';
import AssetCard from './components/AssetCard';
import ActivityItem from './components/ActivityItem';
import { useState } from 'react';

import { useWalletConnection } from './modules/wallet/hooks/useWalletConnection';
import { useAssets } from './modules/assets/hooks/useAssets';
import { useActivityTracking } from './modules/activity/hooks/useActivityTracking';
import { useContracts } from './modules/contracts/hooks/useContracts';
import { validateEnv } from './modules/constants';

// Run environment validation immediately
validateEnv();

function App() {
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortByState] = useState<'id' | 'price'>('id');
  const [filterListed, setFilterListedState] = useState<boolean | null>(null);
  const { account, balance, connectWallet } = useWalletConnection();
  const { results, addActivityResult } = useActivityTracking();

  const { data: signer } = useQuery({
    queryKey: ['signer', account], // Include account in the query key to refresh when account changes
    queryFn: async () => {
      if (!window.ethereum || !account) return null;
      const provider = new BrowserProvider(window.ethereum);
      return await provider.getSigner();
    },
    enabled: !!window.ethereum && !!account, // Only run query when both ethereum and account are available
    staleTime: 0, // Consider the data stale immediately
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  const { data: assets = [] } = useAssets(signer, account);
  const { initializeContracts } = useContracts(signer);

  async function runTest(action: string): Promise<void> {
    if (!signer || !account) {
      alert('Please connect your wallet first');
      return;
    }

    if (action === 'mint') {
      try {
        setLoading(true);
        console.log('Minting new asset...');

        // Add a pending activity
        addActivityResult({
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
        const tx = await tokenContract.mintAsset(
          account,
          metadataURI,
          legalDocHash,
          parseEther(valuation.toString())
        );

        // Update activity with waiting status
        addActivityResult({
          action: 'mint',
          status: 'waiting_confirmation',
          txHash: tx.hash,
          details: `Minting asset with valuation ${valuation} ETH...`,
          timestamp: Date.now()
        });

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        // Update activity with success status
        addActivityResult({
          action: 'mint',
          status: 'success',
          txHash: tx.hash,
          details: `Successfully minted new asset with valuation ${valuation} ETH`,
          timestamp: Date.now()
        });

        // Refresh assets
        fetchAssets(true);

        console.log('Minting successful:', receipt);
      } catch (error) {
        console.error('Error minting asset:', error);

        // Update activity with error status
        addActivityResult({
          action: 'mint',
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          details: 'Failed to mint asset',
          timestamp: Date.now()
        });

        alert(`Error minting asset: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    }
  }

  // Refresh assets from the blockchain
  function fetchAssets(forceRefresh: boolean): void {
    // The forceRefresh parameter is used to indicate whether to bypass cache
    console.log(`Refreshing assets (force: ${forceRefresh})`);

    // The useAssets hook automatically fetches assets when account or signer changes
    // To force a refresh, we can invalidate the query cache
    if (forceRefresh) {
      // This would typically use a queryClient to invalidate and refetch
      // For now, we'll just log the action
      console.log('Force refreshing assets from blockchain');
    }
  }

  // Set sorting criteria for assets
  function setSortBy(sortCriteria: 'id' | 'price'): void {
    // Update the sort criteria state
    setSortByState(sortCriteria);
    console.log(`Sorting assets by: ${sortCriteria}`);
  }

  // Filter assets by listing status
  function setFilterListed(isListed: boolean | null): void {
    // Update the filter state
    setFilterListedState(isListed);
    console.log(`Filtering assets by listing status: ${isListed === null ? 'All' : isListed ? 'Listed' : 'Unlisted'}`);
  }

  /**
   * Handles the process of buying an asset from the marketplace
   * This involves sending ETH to the marketplace contract to purchase the asset
   *
   * @param id - The ID of the asset to buy
   */
  async function handleBuyAsset(id: number): Promise<void> {
    // Check if wallet is connected
    if (!signer || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Set loading state to true to show UI feedback
      setLoading(true);
      console.log(`Preparing to buy asset with ID: ${id}`);

      // Find the asset in our list to get its details
      const asset = assets.find(a => a.id === id);
      if (!asset) {
        alert('Asset not found');
        setLoading(false);
        return;
      }

      // Check if the asset is listed for sale
      if (!asset.listed) {
        alert('This asset is not listed for sale');
        setLoading(false);
        return;
      }

      // Check if the user is trying to buy their own asset
      if (account.toLowerCase() === asset.owner.toLowerCase()) {
        alert('You cannot buy your own asset');
        setLoading(false);
        return;
      }

      // Get the price of the asset
      const price = asset.price ? parseFloat(asset.price) : 0;
      if (price <= 0) {
        alert('Invalid price for this asset');
        setLoading(false);
        return;
      }

      // Track the initial pending activity
      addActivityResult({
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
        addActivityResult({
          action: 'buy',
          status: 'error',
          assetId: id,
          amount: price.toString(),
          details: 'Purchase cancelled by user',
          timestamp: Date.now()
        });
        setLoading(false);
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
      addActivityResult({
        action: 'buy',
        status: 'pending',
        assetId: id,
        amount: price.toString(),
        details: `Sending ${price} ETH to purchase asset...`,
        timestamp: Date.now()
      });

      // Call the buyAsset function on the marketplace contract with the ETH value
      const buyTx = await marketplaceContract.buyAsset(id, { value: priceInWei });
      console.log(`Purchase transaction hash: ${buyTx.hash}`);

      // Track the waiting confirmation activity
      addActivityResult({
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
      addActivityResult({
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

      // Refresh the assets list to show the updated ownership
      fetchAssets(true);
    } catch (error) {
      console.error(`Error buying asset #${id}:`, error);

      // Track the error
      addActivityResult({
        action: 'buy',
        status: 'error',
        assetId: id,
        error: error instanceof Error ? error.message : String(error),
        details: 'Failed to buy asset',
        timestamp: Date.now()
      });

      // Show error message to the user
      alert(`Error buying asset: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false);
    }
  }

  /**
   * Handles the process of listing an asset for sale on the marketplace
   * This involves a two-step process:
   * 1. Approve the marketplace contract to transfer the token
   * 2. List the asset on the marketplace with a specified price
   *
   * @param id - The ID of the asset to list
   */
  async function handleListAsset(id: number): Promise<void> {
    // Check if wallet is connected
    if (!signer || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Set loading state to true to show UI feedback
      setLoading(true);
      console.log(`Preparing to list asset with ID: ${id}`);

      // Find the asset in our list to get its details
      const asset = assets.find(a => a.id === id);
      if (!asset) {
        alert('Asset not found');
        setLoading(false);
        return;
      }

      // Check if the user is the owner of the asset
      if (account.toLowerCase() !== asset.owner.toLowerCase()) {
        alert('You can only list assets that you own');
        setLoading(false);
        return;
      }

      // Check if the asset is already listed
      if (asset.listed) {
        alert('This asset is already listed for sale');
        setLoading(false);
        return;
      }

      // Track the initial pending activity
      addActivityResult({
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
        addActivityResult({
          action: 'list',
          status: 'error',
          assetId: id,
          details: 'Listing cancelled by user',
          timestamp: Date.now()
        });
        setLoading(false);
        return;
      }

      // Validate the price input
      const price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price greater than 0');
        addActivityResult({
          action: 'list',
          status: 'error',
          assetId: id,
          details: 'Invalid price entered',
          timestamp: Date.now()
        });
        setLoading(false);
        return;
      }

      // Step 1: Initialize contracts
      console.log('Initializing contracts...');
      const { tokenContract, marketplaceContract } = await initializeContracts();
      console.log('Contracts initialized successfully');

      // Step 2: Call the approve function on the token contract
      // First, track the approval activity
      addActivityResult({
        action: 'approve',
        status: 'pending',
        assetId: id,
        details: 'Approving marketplace to transfer asset...',
        timestamp: Date.now()
      });

      // Get the marketplace address
      const marketplaceAddress = await marketplaceContract.getAddress();
      console.log(`Marketplace address: ${marketplaceAddress}`);

      // Check if the marketplace is already approved
      const approvedAddress = await tokenContract.getApproved(id);
      console.log(`Currently approved address for token ${id}: ${approvedAddress}`);

      // Only approve if not already approved
      if (approvedAddress.toLowerCase() !== marketplaceAddress.toLowerCase()) {
        console.log(`Approving marketplace to transfer token ID: ${id}`);

        // Approve the marketplace to transfer the token
        const approveTx = await tokenContract.approve(marketplaceAddress, id);
        console.log(`Approval transaction hash: ${approveTx.hash}`);

        // Track the waiting confirmation activity
        addActivityResult({
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
        addActivityResult({
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
        addActivityResult({
          action: 'approve',
          status: 'success',
          assetId: id,
          details: 'Marketplace already approved',
          timestamp: Date.now()
        });
      }

      // Step 3: Call the listAsset function on the marketplace contract
      // Track the listing activity
      addActivityResult({
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
      const listTx = await marketplaceContract.listAsset(id, priceInWei);
      console.log(`Listing transaction hash: ${listTx.hash}`);

      // Track the waiting confirmation activity
      addActivityResult({
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
      addActivityResult({
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

      // Refresh the assets list to show the updated status
      fetchAssets(true);
    } catch (error) {
      console.error(`Error listing asset #${id}:`, error);

      // Track the error
      addActivityResult({
        action: 'list',
        status: 'error',
        assetId: id,
        error: error instanceof Error ? error.message : String(error),
        details: 'Failed to list asset',
        timestamp: Date.now()
      });

      // Show error message to the user
      alert(`Error listing asset: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <Navbar expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#home">
            <i className="bi bi-building me-2"></i>
            RWA Marketplace
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#marketplace">
                <i className="bi bi-shop me-1"></i>
                Marketplace
              </Nav.Link>
              <Nav.Link href="#portfolio">
                <i className="bi bi-briefcase me-1"></i>
                My Portfolio
              </Nav.Link>
              <Nav.Link href="#dao">
                <i className="bi bi-people me-1"></i>
                DAO
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center">
              {account ? (
                <div className="wallet-info">
                  <span className="balance-badge">
                    <i className="bi bi-wallet2 me-1"></i>
                    {balance ? `${Number(balance).toFixed(4)} ETH` : '0 ETH'}
                  </span>
                  <button className="btn btn-outline-light ms-2">
                    <i className="bi bi-person-circle me-1"></i>
                    {`${account.slice(0, 6)}...${account.slice(-4)}`}
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await connectWallet();
                    } catch (error) {
                      console.error('Failed to connect wallet:', error);
                      alert('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-wallet2 me-2"></i>
                      Connect Wallet
                    </>
                  )}
                </button>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col md={8}>
            <Card className="marketplace-card">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3>
                    <i className="bi bi-grid-3x3-gap me-2"></i>
                    Available Assets
                  </h3>
                  <div>
                    <button
                      className="btn btn-primary me-2"
                      onClick={() => runTest('mint')}
                      disabled={loading || !account}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Minting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-2"></i>
                          Mint New Asset
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-primary refresh-btn"
                      onClick={() => fetchAssets(true)}
                      disabled={loading || !account}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-repeat me-2"></i>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="filters">
                  <div className="filter-labels mb-2">
                    <span className="me-2"><i className="bi bi-sort-alpha-down me-1"></i>Sort:</span>
                    <span className="me-4 fw-bold">{sortBy === 'id' ? 'By ID' : 'By Price'}</span>

                    <span className="me-2"><i className="bi bi-funnel me-1"></i>Filter:</span>
                    <span className="fw-bold">
                      {filterListed === null ? 'All Assets' :
                       filterListed ? 'Listed Only' : 'Unlisted Only'}
                    </span>
                  </div>
                  <select
                    className="form-select me-2"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'id' | 'price')}
                  >
                    <option value="id">Sort by ID</option>
                    <option value="price">Sort by Price</option>
                  </select>
                  <select
                    className="form-select"
                    value={filterListed === null ? '' : filterListed ? 'true' : 'false'}
                    onChange={(e) => setFilterListed(e.target.value === '' ? null : e.target.value === 'true')}
                  >
                    <option value="">All Assets</option>
                    <option value="true">Listed Only</option>
                    <option value="false">Unlisted Only</option>
                  </select>
                </div>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                    <h4 className="mt-3">Loading Assets...</h4>
                    <p>Please wait while we fetch the latest data from the blockchain.</p>
                  </div>
                ) : assets.length > 0 ? (
                  <div className="assets-grid">
                    {assets
                      // First apply filtering
                      .filter(asset => {
                        // If no filter is set, show all assets
                        if (filterListed === null) return true;
                        // Otherwise, filter by listing status
                        return asset.listed === filterListed;
                      })
                      // Then apply sorting
                      .sort((a, b) => {
                        if (sortBy === 'id') {
                          return a.id - b.id;
                        } else if (sortBy === 'price') {
                          // For price sorting, listed assets come first
                          if (a.listed && !b.listed) return -1;
                          if (!a.listed && b.listed) return 1;

                          // If both are listed, sort by price
                          if (a.listed && b.listed) {
                            const priceA = a.price ? parseFloat(a.price) : 0;
                            const priceB = b.price ? parseFloat(b.price) : 0;
                            return priceA - priceB;
                          }

                          // If neither is listed, sort by ID
                          return a.id - b.id;
                        }
                        return 0;
                      })
                      .map(asset => {
                        console.log('🖼️ Rendering asset:', asset.id);
                        return (
                          <AssetCard
                            key={asset.id}
                            asset={asset}
                            onBuy={() => handleBuyAsset(asset.id)}
                            onList={() => handleListAsset(asset.id)}
                            isOwner={account?.toLowerCase() === asset.owner.toLowerCase()}
                            loading={loading}
                          />
                        );
                      })}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="bi bi-building-x"></i>
                    </div>
                    <h4>No Assets Found</h4>
                    <p>Connect your wallet and mint new assets to get started.</p>
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => runTest('mint')}
                      disabled={!account || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Minting...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-2"></i>
                          Mint Test Asset
                        </>
                      )}
                    </button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="activity-card">
              <Card.Header>
                <h3>
                  <i className="bi bi-activity me-2"></i>
                  Recent Activity
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="activity-list">
                  {results.length === 0 ? (
                    <div className="text-center text-muted p-3">
                      <i className="bi bi-clock-history fs-4 mb-2"></i>
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    [...results]
                      .reverse()
                      .map((result, index) => (
                        <ActivityItem key={index} result={result} />
                      ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default App;
