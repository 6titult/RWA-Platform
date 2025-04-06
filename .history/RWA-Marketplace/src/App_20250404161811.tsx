/**
 * RWA (Real World Asset) Test Interface Component
 * This component provides a user interface for testing RWA token and marketplace contracts.
 * It allows users to connect their wallet, mint test assets, and view transaction results.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { Container, Nav, Navbar, Card, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@tanstack/react-query';
import './styles/App.css';
import AssetCard from './components/AssetCard';
import ActivityItem from './components/ActivityItem';
import { Asset, TestResult } from './types/index';

// Contract addresses from environment variables
let TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || "0x3B7F90F356d77C6c61B2397dFeB6362bba55d302";
let MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x1adF05648159f4bd7A6B0913A5F3cF4be40d0732";

// Log environment variables for debugging
console.log('Environment Variables:', {
  TOKEN_ADDRESS,
  MARKETPLACE_ADDRESS,
  allEnv: import.meta.env
});

// Add validation
if (!TOKEN_ADDRESS || !MARKETPLACE_ADDRESS) {
  console.error('Contract addresses not found in environment variables. Please check your .env file.');
  // Use fallback addresses for development (replace with your actual deployed contract addresses)
  TOKEN_ADDRESS = "0x3B7F90F356d77C6c61B2397dFeB6362bba55d302";
  MARKETPLACE_ADDRESS = "0x1adF05648159f4bd7A6B0913A5F3cF4be40d0732";

  console.warn(`Using fallback addresses:\nToken: ${TOKEN_ADDRESS}\nMarketplace: ${MARKETPLACE_ADDRESS}`);
}

// Window type declaration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      on: (event: string, callback: (params: unknown) => void) => void;
      removeListener: (event: string, callback: (params: unknown) => void) => void;
    };
  }
}

const MAX_ACTIVITIES = 10;

function App() {
  // State management using modern React patterns
  const [results, setResults] = useState<TestResult[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setSortBy] = useState<'id' | 'price'>('id');
  const [, setFilterListed] = useState<boolean | null>(null);
  const hasLoadedAssetsRef = useRef(false);

  // Use React Query for async state management
  const { data: signer } = useQuery({
    queryKey: ['signer'],
    queryFn: async () => {
      if (!window.ethereum) return null;
      const provider = new BrowserProvider(window.ethereum);
      return await provider.getSigner();
    },
    enabled: !!window.ethereum
  });

  // Use React Query for assets
  const { data: assets = [], refetch: refetchAssets } = useQuery({
    queryKey: ['assets', account],
    queryFn: async () => {
      console.log('🔍 Asset Query Function Called', { account, signerAvailable: !!signer });
      if (!signer) {
        console.log('❌ No signer available for asset query');
        return [];
      }
      try {
        const { tokenContract, marketplaceContract } = await initializeContracts();
        const totalTokens = await tokenContract.getTokenIdCounter();
        console.log('📊 Total tokens found:', totalTokens.toString());
        
        const currentAddress = await signer.getAddress();
        console.log('👤 Current address:', currentAddress);

        const assetsList: Asset[] = [];
        
        for (let i = 0; i < totalTokens; i++) {
          try {
            console.log(`🔄 Checking token ${i}...`);
            const owner = await tokenContract.ownerOf(i);
            const [legalDocHash, auditor, valuation, auditDate] = await tokenContract.getAssetData(i);
            const uri = await tokenContract.tokenURI(i);
            
            // Check if asset is listed
            const listing = await marketplaceContract.listings(i);
            const isListed = listing.isActive;
            const price = isListed ? ethers.formatEther(listing.price) : undefined;

            assetsList.push({
              id: i,
              owner,
              uri,
              legalDocHash,
              valuation: ethers.formatUnits(valuation, 18),
              auditor,
              auditDate: new Date(Number(auditDate) * 1000).toLocaleString(),
              listed: isListed,
              price
            });
            console.log(`✅ Added token ${i}:`, { owner, isListed, price });
          } catch (error) {
            console.log(`⚠️ Token ${i} error:`, error instanceof Error ? error.message : 'Unknown error');
            continue;
          }
        }

        console.log('📝 Final assets list:', assetsList);
        return assetsList;
      } catch (error) {
        console.error('❌ Error in asset query:', error);
        throw error;
      }
    },
    enabled: !!signer && !!account
  });

  // Add logging to track asset updates
  useEffect(() => {
    console.log('🔄 Assets updated:', { 
      count: assets.length, 
      assets,
      account,
      signerAvailable: !!signer
    });
  }, [assets, account, signer]);

  const addUniqueResult = useCallback((prevResults: TestResult[], newResult: TestResult) => {
    const filteredResults = prevResults.filter(r => r.timestamp !== newResult.timestamp);
    const allResults = [...filteredResults, newResult];
    return allResults.slice(-MAX_ACTIVITIES);
  }, []);

  const addActivityResult = useCallback((result: {
    action: 'mint' | 'list' | 'buy' | 'approve';
    status: 'pending' | 'success' | 'error';
    assetId?: number;
    amount?: string;
    txHash?: string;
    error?: string;
    details?: string;
  }) => {
    setResults(prev => addUniqueResult(prev, {
      ...result,
      timestamp: Date.now()
    }));
  }, [addUniqueResult]);

  // Contract initialization using React Query
  const initializeContracts = useCallback(async () => {
    if (!signer) throw new Error('Signer not available');

    return {
      tokenContract: new Contract(
        TOKEN_ADDRESS,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function getTokenIdCounter() view returns (uint256)',
          'function getAssetData(uint256) view returns (uint256,address,uint256,uint256)',
          'function mintAsset(address,string,string,uint256)',
          'function balanceOf(address) view returns (uint256)',
          'function ownerOf(uint256) view returns (address)',
          'function tokenURI(uint256) view returns (string)',
          'function totalSupply() view returns (uint256)',
          'function approve(address to, uint256 tokenId)',
          'function getApproved(uint256 tokenId) view returns (address)',
          'function isApprovedForAll(address owner, address operator) view returns (bool)',
          'function setApprovalForAll(address operator, bool approved)',
          'function safeTransferFrom(address from, address to, uint256 tokenId)'
        ],
        signer
      ),
      marketplaceContract: new Contract(
        MARKETPLACE_ADDRESS,
        [
          'function listAsset(uint256,uint256)',
          'function buyAsset(uint256) payable',
          'function listings(uint256) view returns (address seller, uint256 price, bool isActive)',
          'function feePercentage() view returns (uint256)',
          'function rwaToken() view returns (address)'
        ],
        signer
      )
    };
  }, [signer]);

  // Wallet connection mutation
  const { mutate: connectWallet } = useMutation({
    mutationFn: async () => {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask!');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== 11155111n) {
        await switchToSepolia();
      }

      const balance = await provider.getBalance(accounts[0]);

      return { account: accounts[0], balance: formatEther(balance) };
    },
    onSuccess: ({ account, balance }) => {
      setAccount(account);
      setBalance(balance);
      hasLoadedAssetsRef.current = false;
      refetchAssets();
    },
    onError: (error) => {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  });

  // Network switching helper
  const switchToSepolia = async () => {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
    } catch (switchError: unknown) {
      if ((switchError as { code: number }).code === 4902) {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } else {
        throw switchError;
      }
    }
  };

  // Event handlers
  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    hasLoadedAssetsRef.current = false;
    if (accounts.length === 0) {
      setAccount(null);
      setBalance(null);
    } else {
      setAccount(accounts[0]);
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(accounts[0]);
        setBalance(formatEther(balance));
        refetchAssets();
      }
    }
  }, [refetchAssets]);

  // Handle network changes
  const handleChainChanged = () => {
    // Reload the page when network changes
    window.location.reload();
  };

  // Cleanup event listeners when component unmounts
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        if ('removeListener' in window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', (params: unknown) => handleAccountsChanged(params as string[]));
        }
        if ('removeListener' in window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      }
    };
  }, []);

  // Auto-connect to wallet if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, [connectWallet]);

  /**
   * Fetches all assets owned by the connected account
   * Displays them in a table format
   *
   * Flow:
   * 1. Check if wallet is connected
   * 2. Get total number of tokens
   * 3. Iterate through tokens to find owned assets
   * 4. Fetch asset details for owned tokens
   * 5. Update state with fetched assets
   */
  const fetchAssets = useCallback(async (forceRefresh = false) => {
    console.log('🔄 fetchAssets called:', { 
      forceRefresh, 
      hasLoadedBefore: hasLoadedAssetsRef.current,
      account,
      signerAvailable: !!signer
    });

    if (hasLoadedAssetsRef.current && !forceRefresh) {
      console.log('⏭️ Skipping fetch - assets already loaded');
      return;
    }

    if (!signer) {
      console.log('❌ No signer available for fetchAssets');
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      hasLoadedAssetsRef.current = false;
      console.log('🔄 Initializing contracts...');
      const { tokenContract } = await initializeContracts();

      let retries = 3;
      let totalTokens;
      while (retries > 0) {
        try {
          totalTokens = await tokenContract.getTokenIdCounter();
          console.log('📊 Total tokens:', totalTokens.toString());
          break;
        } catch (error) {
          console.error(`❌ Retry ${4 - retries}/3 failed:`, error);
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const address = await signer.getAddress();
      console.log('👤 Fetching assets for address:', address);

      await refetchAssets();
      console.log('✅ Assets refetched successfully');

      hasLoadedAssetsRef.current = true;
    } catch (error) {
      console.error('❌ Error in fetchAssets:', error);
      hasLoadedAssetsRef.current = false;
      setResults(prevResults => addUniqueResult(prevResults, {
        action: 'list',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to fetch assets. Check console for details.'
      }));
    }
    setLoading(false);
  }, [signer, initializeContracts, refetchAssets]);

  // Verify contract deployment and basic functionality
  useEffect(() => {
    const verifyContracts = async () => {
      if (!signer) {
        console.log("Waiting for signer...");
        return;
      }

      try {
        const { tokenContract } = await initializeContracts();
        console.log("Token name:", await tokenContract.name());
        console.log("Total supply:", await tokenContract.getTokenIdCounter());
      } catch (error) {
        console.error("Error verifying contracts:", error);
      }
    }

    verifyContracts();
  }, [signer, initializeContracts]); // Add signer to dependencies

  // Fetch assets when account changes
  useEffect(() => {
    if (account && signer) {
      // Only fetch if we haven't already loaded assets for this account
      if (!hasLoadedAssetsRef.current) {
        console.log('Account changed, fetching assets...');
        fetchAssets(true).catch(error => {
          console.error('Error fetching assets after account change:', error);
        });
      }
    }
  }, [account, signer, fetchAssets]);


  // Update handleListAsset to check and request approval first
  const handleListAsset = async (tokenId: number) => {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);

    addActivityResult({
      action: 'list',
      status: 'pending',
      assetId: tokenId,
      details: `Listing asset ${tokenId}...`
    });

    try {
      const { tokenContract, marketplaceContract } = await initializeContracts();
      const isApprovedForAll = await tokenContract.isApprovedForAll(
        await signer.getAddress(),
        MARKETPLACE_ADDRESS
      );

      if (!isApprovedForAll) {
        addActivityResult({
          action: 'list',
          status: 'pending',
          assetId: tokenId,
          details: 'Requesting approval...'
        });

        const approveTx = await tokenContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
        await approveTx.wait();
      }

      const price = ethers.parseEther("100");
      const tx = await marketplaceContract.listAsset(tokenId, price);
      await tx.wait();

      await fetchAssets();

      addActivityResult({
        action: 'list',
        status: 'success',
        assetId: tokenId,
        amount: formatEther(price),
        txHash: tx.hash,
        details: `Asset ${tokenId} listed successfully`
      });
    } catch (error) {
      addActivityResult({
        action: 'list',
        status: 'error',
        assetId: tokenId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      console.error('Error listing asset:', error);
    }
    setLoading(false);
  };

  /**
   * Executes blockchain operations based on the test name
   * @param testName - Name of the test to execute ('mint', 'list', or 'verify')
   */
  const runTest = async (testName: string) => {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    const startTime = Date.now();

    if (testName === 'mint') {
      try {
        // Initial pending state (MetaMask popup)
        setResults(prev => addUniqueResult(prev, {
          action: 'mint',
          status: 'pending',
          timestamp: startTime,
          details: 'Waiting for wallet confirmation...'
        }));

        const { tokenContract } = await initializeContracts();
        const address = await signer.getAddress();

        const tx = await tokenContract.mintAsset(
          address,
          "ipfs://test-metadata",
          "docHash123",
          ethers.parseUnits("100000", 18)
        );

        // Update to waiting for confirmation
        setResults(prev => addUniqueResult(prev, {
          action: 'mint',
          status: 'waiting_confirmation',
          timestamp: startTime,
          txHash: tx.hash,
          details: 'Transaction submitted, waiting for confirmation...'
        }));

        await tx.wait();

        // Final success state
        setResults(prev => addUniqueResult(prev, {
          action: 'mint',
          status: 'success',
          timestamp: startTime,
          txHash: tx.hash,
          details: 'Asset minted successfully!'
        }));

        await new Promise(resolve => setTimeout(resolve, 2000));
        await fetchAssets(true);
      } catch (error) {
        console.error('Minting Failed:', error);

        // Error state
        setResults(prev => addUniqueResult(prev, {
          action: 'mint',
          status: 'error',
          timestamp: startTime,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          details: 'Failed to mint asset'
        }));
      }
    }
  };

  async function handleBuyAsset(tokenId: number): Promise<void> {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      const { marketplaceContract } = await initializeContracts();
      const listing = await marketplaceContract.listings(tokenId);

      if (!listing.isActive) {
        throw new Error('Asset is not listed for sale');
      }

      const tx = await marketplaceContract.buyAsset(tokenId, { value: listing.price });
      await tx.wait();

      await fetchAssets();

      setResults(prev => addUniqueResult(prev, {
        action: 'buy',
        status: 'success',
        timestamp: Date.now(),
        details: `Successfully purchased asset ${tokenId}`
      }));
    } catch (error) {
      console.error('Error buying asset:', error);
      setResults(prev => addUniqueResult(prev, {
        action: 'buy',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
    setLoading(false);
  }

  // Add new function to handle asset purchase

  // Function to sort assets


  // Render the user interface
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
                  onClick={() => connectWallet()}
                  disabled={loading}
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
                      <i className="bi bi-plus-circle me-2"></i>
                      Mint New Asset
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
                  <select
                    className="form-select me-2"
                    onChange={(e) => setSortBy(e.target.value as 'id' | 'price')}
                  >
                    <option value="id">Sort by ID</option>
                    <option value="price">Sort by Price</option>
                  </select>
                  <select
                    className="form-select"
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
                    {assets.map(asset => {
                      console.log('🖼️ Rendering asset:', asset.id);
                      return (
                        <AssetCard
                          key={asset.id}
                          asset={asset}
                          onBuy={() => handleBuyAsset(asset.id)}
                          onList={() => handleListAsset(asset.id)}
                          isOwner={account?.toLowerCase() === asset.owner.toLowerCase()}
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
                      <i className="bi bi-plus-circle me-2"></i>
                      Mint Test Asset
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
















