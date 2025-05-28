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


import { BrowserProvider } from 'ethers';
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
import { useAssetOperations } from './modules/assets/hooks/useAssetOperations';
import { validateEnv } from './modules/constants';

// Run environment validation immediately
validateEnv();

function App() {
  const [sortBy, setSortByState] = useState<'id' | 'price'>('id');
  const [filterListed, setFilterListedState] = useState<boolean | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
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

  // Use the asset operations hook for asset-related operations
  const {
    handleBuyAsset,
    handleListAsset,
    handleMintAsset,
    fetchAssets,
    loading
  } = useAssetOperations({
    signer: signer || null,
    account,
    assets,
    initializeContracts,
    addActivityResult,
    results
  });

  async function runTest(action: string): Promise<void> {
    if (action === 'mint') {
      await handleMintAsset();
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
                      setConnectLoading(true);
                      await connectWallet();
                    } catch (error) {
                      console.error('Failed to connect wallet:', error);
                      alert('Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
                    } finally {
                      setConnectLoading(false);
                    }
                  }}
                >
                  {connectLoading ? (
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
