# RWA Marketplace Frontend Documentation

## Project Overview

The RWA (Real World Asset) Marketplace is a decentralized application that allows users to mint, list, and trade tokenized real-world assets on the blockchain. The application provides a user-friendly interface for interacting with smart contracts that manage these assets.

## Project Structure

```
RWA-Marketplace/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ActivityItem.tsx  # Transaction activity display component
│   │   └── AssetCard.tsx     # Asset display and interaction component
│   ├── modules/            # Core functionality modules
│   │   ├── activity/         # Activity tracking functionality
│   │   ├── assets/           # Asset management functionality
│   │   ├── contracts/        # Smart contract interactions
│   │   └── wallet/           # Wallet connection functionality
│   ├── styles/             # CSS and styling files
│   ├── types/              # TypeScript type definitions
│   ├── abis/               # Smart contract ABIs
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
```

## Core Components

### App.tsx
Main application component that handles:
- Wallet connection and management (MetaMask)
- Smart contract interactions (RWAToken and RWAMarketplace)
- Asset management (viewing, minting, listing, buying)
- Transaction tracking and activity logging
- UI layout and filtering

Key Features:
- MetaMask integration with automatic account detection
- Real-time transaction tracking with status updates
- Asset filtering and sorting
- Comprehensive error handling
- Loading state management

### Components

#### AssetCard.tsx
Displays individual asset information including:
- Asset ID and ownership details
- Valuation and audit information
- Listing status and price
- Action buttons (Buy/List) based on ownership and listing status
- Loading state indicators for transactions

Usage:
```tsx
<AssetCard
  asset={assetData}
  onBuy={() => handleBuyAsset(assetData.id)}
  onList={() => handleListAsset(assetData.id)}
  isOwner={account?.toLowerCase() === assetData.owner.toLowerCase()}
  loading={loading}
/>
```

#### ActivityItem.tsx
Tracks and displays transaction activities:
- Transaction status (pending/waiting_confirmation/success/error)
- Action types (mint/list/buy/approve)
- Transaction details and timestamps
- Real-time updates

Usage:
```tsx
<ActivityItem result={transactionResult} />
```

## Type Definitions

### types/index.ts
```typescript
// Asset type definition
interface Asset {
  id: number;
  owner: string;
  uri: string;
  legalDocHash: string;
  valuation: string;
  auditor: string;
  auditDate: string;
  marketplace: string;
  listed: boolean;
  price?: string;
}

// Activity result type
interface ActivityResult {
  action: 'mint' | 'list' | 'buy' | 'approve';
  status: 'pending' | 'waiting_confirmation' | 'success' | 'error';
  timestamp: number;
  txHash?: string;
  details?: string;
  error?: string;
  assetId?: number;
  amount?: string;
}
```

## Key Modules

### Wallet Connection
The `useWalletConnection` hook provides:
- Wallet connection functionality
- Account and balance tracking
- Chain ID detection
- Event listeners for account and chain changes

### Contract Interactions
The `useContracts` hook initializes and provides access to:
- RWAToken contract for minting and approving assets
- RWAMarketplace contract for listing and buying assets

### Asset Management
The `useAssets` hook handles:
- Fetching assets from the blockchain
- Updating asset information
- Filtering and sorting assets

### Activity Tracking
The `useActivityTracking` hook manages:
- Transaction activity recording
- Status updates
- Activity history

## Key Functions

### Asset Minting
```typescript
async function runTest(action: string): Promise<void> {
  if (action === 'mint') {
    // Initialize contracts
    const { tokenContract } = await initializeContracts();

    // Mint a new asset
    const tx = await tokenContract.mintAsset(
      account,
      metadataURI,
      legalDocHash,
      parseEther(valuation.toString())
    );

    // Wait for confirmation
    await tx.wait();

    // Refresh assets
    fetchAssets(true);
  }
}
```

### Asset Listing
```typescript
async function handleListAsset(id: number): Promise<void> {
  // Initialize contracts
  const { tokenContract, marketplaceContract } = await initializeContracts();

  // Approve the marketplace to transfer the token
  const approveTx = await tokenContract.approve(marketplaceAddress, id);
  await approveTx.wait();

  // List the asset on the marketplace
  const priceInWei = parseEther(price.toString());
  const listTx = await marketplaceContract.listAsset(id, priceInWei);
  await listTx.wait();

  // Refresh assets
  fetchAssets(true);
}
```

### Asset Buying
```typescript
async function handleBuyAsset(id: number): Promise<void> {
  // Initialize contracts
  const { marketplaceContract } = await initializeContracts();

  // Buy the asset
  const priceInWei = parseEther(price.toString());
  const buyTx = await marketplaceContract.buyAsset(id, { value: priceInWei });
  await buyTx.wait();

  // Refresh assets
  fetchAssets(true);
}
```

## Styling

### styles/App.css
Main styling file containing:
- Layout and grid systems
- Component-specific styles
- Responsive design rules
- Theme variables
- Loading state animations

## State Management

The application uses React's built-in state management with:
- `useState` for component-level state
- `useEffect` for side effects and data fetching
- `useCallback` for memoized functions
- `TanStack Query` for data fetching and caching

Key state variables:
```typescript
// Loading state
const [loading, setLoading] = useState(false);

// Sorting and filtering
const [sortBy, setSortByState] = useState<'id' | 'price'>('id');
const [filterListed, setFilterListedState] = useState<boolean | null>(null);

// Wallet connection
const { account, balance, connectWallet } = useWalletConnection();

// Activity tracking
const { results, addActivityResult } = useActivityTracking();

// Blockchain data
const { data: signer } = useQuery({ queryKey: ['signer', account], ... });
const { data: assets = [] } = useAssets(signer, account);
```

## Error Handling

The application implements comprehensive error handling:
- MetaMask connection errors
- Transaction failures
- Contract interaction errors
- Network issues
- User input validation

Example:
```typescript
try {
  // Contract interaction
} catch (error) {
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
  // Reset loading state
  setLoading(false);
}
```

## User Experience Enhancements

### Loading States
- Loading indicators for all blockchain interactions
- Disabled buttons during transactions
- Clear feedback on transaction progress

### Activity Tracking
- Real-time updates on transaction status
- Comprehensive activity history
- Detailed transaction information

### Filtering and Sorting
- Sort assets by ID or price
- Filter assets by listing status
- Clear visual indicators of current filters

## Usage Guidelines

1. **Wallet Connection**:
   - Ensure MetaMask is installed
   - Connect to the correct network
   - The application automatically detects account changes

2. **Asset Operations**:
   - **Minting**: Create new assets with metadata and valuation
   - **Listing**: Approve the marketplace and set a price for your assets
   - **Buying**: Purchase listed assets with ETH

3. **Transaction Monitoring**:
   - Check the activity section for transaction status
   - Wait for confirmations before performing additional actions
   - Clear error messages for troubleshooting

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Testing

Run tests using:
```bash
npm test
```

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent styling
3. Document new features
4. Add appropriate tests
5. Update this documentation
