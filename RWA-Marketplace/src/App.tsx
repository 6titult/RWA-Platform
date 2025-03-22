/**
 * RWA (Real World Asset) Test Interface Component
 * This component provides a user interface for testing RWA token and marketplace contracts.
 * It allows users to connect their wallet, mint test assets, and view transaction results.
 */

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { BrowserProvider, Contract, parseUnits } from 'ethers';

// Declare ethereum property on window object
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
    };
  }
}

// Contract addresses for the deployed RWA Token and Marketplace contracts
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MARKETPLACE_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

/**
 * Interface defining the structure of test results
 * @property test - Name of the test that was executed
 * @property status - Current status of the test ('pending', 'success', or 'error')
 * @property txHash - Optional transaction hash for successful operations
 * @property error - Optional error message for failed operations
 * @property timestamp - Optional timestamp when the test was initiated
 */
interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
  timestamp?: number;
  details?: string;
}

/**
 * Interface defining the structure of an asset
 * @property id - Unique identifier of the asset
 * @property owner - Address of the asset owner
 * @property uri - IPFS URI of the asset metadata
 * @property legalDocHash - Hash of legal documents
 * @property valuation - Valuation of the asset
 * @property auditor - Address of the auditor
 * @property auditDate - Timestamp of the last audit
 * @property listed - Optional flag indicating if the asset is listed for sale
 * @property price - Optional listing price of the asset
 */
interface Asset {
  id: number;
  owner: string;
  uri: string;
  legalDocHash: string;
  valuation: string;
  auditor: string;
  auditDate: string;
  listed?: boolean;
  price?: string;
}

/**
 * Interface defining the structure of JSON-RPC errors
 * Used for proper error handling of blockchain transaction errors
 */
interface JsonRpcError {
  info?: {
    error?: {
      data?: {
        message?: string;
      };
    };
  };
}

export default function TestInterface() {
  // State management for test results, loading state, signer, and connected account
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer|null>(null);
  const [account, setAccount] = useState<string|null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  /**
   * Initializes Web3 provider and contract instances
   * @returns Object containing initialized token and marketplace contracts
   * @throws Error if ethereum provider is not available or wrong network
   */
  const initializeContracts = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('Wallet non détectée');
      
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 31337n) {
        throw new Error('Connectez-vous au réseau Hardhat (chainId: 31337)');
      }

      const signer = await provider.getSigner();
      setSigner(signer);
      
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
    } catch (error) {
      console.error('Erreur d\'initialisation:', error);
      throw error;
    }
  }, []);

  /**
   * Connects the user's wallet and initializes contracts
   * @throws Error if MetaMask is not installed
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
    await initializeContracts();
  }, [initializeContracts]);

  // Auto-connect to wallet if previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await connectWallet();
      }
    };
    checkConnection();
  }, [connectWallet]);

  // Verify contract deployment and basic functionality
  useEffect(() => {
    const verifyContracts = async () => {
      const { tokenContract } = await initializeContracts();
      console.log("Token name:", await tokenContract.name());
      console.log("Total supply:", await tokenContract.getTokenIdCounter());
    }
    verifyContracts();
  }, []);

  /**
   * Executes blockchain operations based on the test name
   * @param testName - Name of the test to execute ('mint', 'list', or 'verify')
   * 
   * Test Flow:
   * 1. Check if wallet is connected
   * 2. Initialize contracts
   * 3. Execute specific test operation
   * 4. Update results and refresh assets
   * 5. Handle any errors that occur
   */
  const runTest = async (testName: string) => {
    console.log(`Starting test: ${testName}`);
    if (!signer) {
      console.log('No signer available, test cancelled');
      return;
    }
  
    setLoading(true);
    const startTime = Date.now();
    
    // Add pending status
    setResults(prev => [...prev, {
      test: testName,
      status: 'pending',
      timestamp: startTime
    }]);

    try {
      console.log('Initializing contracts...');
      const { tokenContract, marketplaceContract } = await initializeContracts();
      const address = await signer.getAddress();
      console.log(`Connected address: ${address}`);
      
      if (testName === 'mint') {
        console.log('Minting new asset...');
        // Mint Asset
        const tx = await tokenContract.mintAsset(
          address,
          "ipfs://test-metadata",
          "docHash123",
          parseUnits("100000", 18)
        );
        console.log('Mint transaction sent:', tx.hash);
        await tx.wait();
        console.log('Mint transaction confirmed');
      } else if (testName === 'list') {
        console.log('Listing last asset...');
        // Get total tokens as BigInt
        const totalTokens = await tokenContract.getTokenIdCounter();
        console.log(`Total tokens: ${totalTokens}`);
        
        // Convert to BigInt for arithmetic operations
        const tokenId = totalTokens - 1n;
        console.log(`Listing token ID: ${tokenId}`);
        
        // Ensure price is handled as BigInt
        const price = parseUnits("100", 18);
        console.log(`Listing price: ${price}`);
        
        // Execute listing
        const tx = await marketplaceContract.listAsset(
          tokenId,
          price,
          { gasLimit: 1_000_000n }
        );
        console.log('List transaction sent:', tx.hash);
        
        const receipt = await tx.wait();
        console.log('List transaction confirmed');
      
        // Update result with success
        setResults(prev => prev.map(r => 
          r.timestamp === startTime ? {
            ...r,
            status: 'success',
            txHash: receipt.hash
          } : r
        ));
      }
      
      console.log('Fetching updated assets...');
      await fetchAssets();
      console.log('Test completed successfully');
    } catch (error) {
      console.error('Transaction Failed:', error);
  
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        // For Hardhat revert messages
        const revertReasonMatch = error.message.match(/reason="(.*?)"/);
        errorMessage = revertReasonMatch ? revertReasonMatch[1] : error.message;
        console.log('Error details:', errorMessage);

        // For JSON-RPC errors
        const jsonError = error as JsonRpcError;
        const message = jsonError.info?.error?.data?.message;
        if (message) {
          errorMessage = message;
          console.log('JSON-RPC error:', message);
        }
      }

      setResults(prev => prev.map(r => 
        r.timestamp === startTime ? {
          ...r,
          status: 'error',
          error: errorMessage
        } : r
      ));
    }
    setLoading(false);
  };

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
  const fetchAssets = async () => {
    console.log('Starting asset fetch...');
    if (!signer) {
      console.log('No signer available, fetch cancelled');
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      console.log('Initializing contracts...');
      const { tokenContract, marketplaceContract } = await initializeContracts();
      const totalTokens = await tokenContract.getTokenIdCounter();
      console.log(`Total tokens to check: ${totalTokens}`);
      
      const address = await signer.getAddress();
      console.log(`Fetching assets for address: ${address}`);
      
      const assetsList: Asset[] = [];
      
      // Iterate through all tokens to find owned assets
      for (let i = 0; i < totalTokens; i++) {
        try {
          console.log(`Checking token ${i}...`);
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
          console.log(`Added token ${i} to assets list`);
        } catch (error) {
          console.log(`Token ${i} not accessible or doesn't exist:`, error instanceof Error ? error.message : 'Unknown error');
          continue;
        }
      }

      console.log(`Found ${assetsList.length} assets`);
      setAssets(assetsList);
      setResults([...results, {
        test: 'fetchAssets',
        status: 'success',
        timestamp: Date.now(),
        txHash: undefined,
        details: `Found ${assetsList.length} assets. Last updated: ${new Date().toLocaleString()}`
      }]);
      
    } catch (error) {
      console.error('Error fetching assets:', error);
      setResults([...results, {
        test: 'fetchAssets',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to fetch assets. Check console for details.'
      }]);
    }
    setLoading(false);
  };

  // Add new function to handle token approval
  const handleApproveToken = async (tokenId: number) => {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      const { tokenContract } = await initializeContracts();
      
      // Approve marketplace to transfer the token
      const tx = await tokenContract.approve(MARKETPLACE_ADDRESS, tokenId);
      await tx.wait();
      
      setResults(prev => [...prev, {
        test: 'approveToken',
        status: 'success',
        timestamp: Date.now(),
        details: `Token ${tokenId} approved for marketplace`
      }]);
    } catch (error) {
      console.error('Error approving token:', error);
      setResults(prev => [...prev, {
        test: 'approveToken',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }]);
    }
    setLoading(false);
  };

  // Update handleListAsset to check and request approval first
  const handleListAsset = async (tokenId: number) => {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      const { tokenContract, marketplaceContract } = await initializeContracts();
      
      // Check if marketplace is approved
      const approvedAddress = await tokenContract.getApproved(tokenId);
      if (approvedAddress !== MARKETPLACE_ADDRESS) {
        // Request approval first
        await handleApproveToken(tokenId);
      }
      
      const price = ethers.parseEther("100"); // Default price of 100 ETH
      const tx = await marketplaceContract.listAsset(tokenId, price);
      await tx.wait();
      
      // Refresh assets after listing
      await fetchAssets();
      
      setResults(prev => [...prev, {
        test: 'listAsset',
        status: 'success',
        timestamp: Date.now(),
        details: `Asset ${tokenId} listed successfully`
      }]);
    } catch (error) {
      console.error('Error listing asset:', error);
      setResults(prev => [...prev, {
        test: 'listAsset',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }]);
    }
    setLoading(false);
  };

  // Add new function to handle asset purchase
  const handlePurchaseAsset = async (tokenId: number) => {
    if (!signer) {
      alert('Please connect wallet first!');
      return;
    }

    setLoading(true);
    try {
      const { marketplaceContract } = await initializeContracts();
      const listing = await marketplaceContract.listings(tokenId);
      
      const tx = await marketplaceContract.buyAsset(tokenId, {
        value: listing.price
      });
      await tx.wait();
      
      // Refresh assets after purchase
      await fetchAssets();
      
      setResults(prev => [...prev, {
        test: 'purchaseAsset',
        status: 'success',
        timestamp: Date.now(),
        details: `Asset ${tokenId} purchased successfully`
      }]);
    } catch (error) {
      console.error('Error purchasing asset:', error);
      setResults(prev => [...prev, {
        test: 'purchaseAsset',
        status: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }]);
    }
    setLoading(false);
  };

  /**
   * Renders the test results in a formatted table
   * @returns JSX element containing the results table
   */
  const renderResults = () => (
    <div className="mt-4">
      <h3>Test Results</h3>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>Test</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} className={result.status === 'error' ? 'table-danger' : ''}>
                <td>{result.test}</td>
                <td>
                  {result.status === 'success' && '✅ Success'}
                  {result.status === 'error' && '❌ Error'}
                  {result.status === 'pending' && '⏳ Pending'}
                </td>
                <td>
                  {result.timestamp && new Date(result.timestamp).toLocaleString()}
                </td>
                <td>
                  {result.error && (
                    <div className="text-danger">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  {result.details && (
                    <div className="text-info">
                      <strong>Details:</strong> {result.details}
                    </div>
                  )}
                  {result.test === 'mint' && result.status === 'success' && (
                    <div className="text-success">
                      <strong>Asset Minted Successfully</strong>
                    </div>
                  )}
                  {result.test === 'list' && result.status === 'success' && (
                    <div className="text-success">
                      <strong>Asset Listed Successfully</strong>
                    </div>
                  )}
                  {result.test === 'fetchAssets' && result.status === 'success' && (
                    <div className="text-success">
                      <strong>Assets Refreshed Successfully</strong>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render the user interface
  return (
    <div className="container mt-4">
      {/* Header with loading indicator */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>RWA Test Interface</h2>
        {loading && <div className="spinner-border text-primary" role="status" />}
      </div>

      {/* Wallet connection button */}
      <div className="mb-4">
        <button 
          className="btn btn-primary" 
          onClick={connectWallet}
          disabled={loading}
        >
          {account ? `Connected: ${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet'}
        </button>
      </div>

      {/* Test action buttons */}
      <div className="mb-4">
        <button 
          className="btn btn-success me-2" 
          onClick={() => runTest('mint')}
          disabled={loading}
        >
          Mint Asset
        </button>
        <button 
          className="btn btn-info me-2" 
          onClick={fetchAssets}
          disabled={loading}
        >
          Refresh Assets
        </button>
      </div>

      {/* Assets display table */}
      {assets.length > 0 && (
        <div className="mb-4">
          <h3>Assets</h3>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Owner</th>
                  <th>URI</th>
                  <th>Auditor</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const isOwner = account && asset.owner.toLowerCase() === account.toLowerCase();
                  return (
                    <tr key={asset.id.toString()}>
                      <td>{asset.id}</td>
                      <td>{asset.owner.slice(0,6)}...{asset.owner.slice(-4)}</td>
                      <td>{asset.uri}</td>
                      <td>{asset.auditor.slice(0,6)}...{asset.auditor.slice(-4)}</td>
                      <td>
                        {asset.listed ? (
                          <span className="badge bg-warning">Listed</span>
                        ) : (
                          <span className="badge bg-success">Not Listed</span>
                        )}
                      </td>
                      <td>
                        {asset.listed ? (
                          <span className="text-primary fw-bold">{asset.price} ETH</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {isOwner ? (
                          asset.listed ? (
                            <span className="text-muted">Owner</span>
                          ) : (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleListAsset(asset.id)}
                              disabled={loading}
                            >
                              List Asset
                            </button>
                          )
                        ) : (
                          asset.listed && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePurchaseAsset(asset.id)}
                              disabled={loading}
                            >
                              Purchase
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test results display */}
      {renderResults()}
    </div>
  );
}