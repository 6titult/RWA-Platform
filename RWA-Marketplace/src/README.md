# RWA Marketplace Frontend Documentation

## Project Structure

```
RWA-Marketplace/
├── src/
│   ├── components/     # Reusable UI components
│   ├── styles/        # CSS and styling files
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
```

## Core Components

### App.tsx
Main application component that handles:
- Wallet connection and management
- Contract interactions (RWAToken and Marketplace)
- Asset management (fetching, minting, listing)
- Global state management
- UI layout and routing

Key Features:
- MetaMask integration
- Real-time transaction tracking
- Asset refresh mechanism
- Error handling

### Components

#### AssetCard.tsx
Displays individual asset information including:
- Asset ID and ownership details
- Valuation and audit information
- Listing status and price
- Action buttons (Buy/List) based on ownership

Usage:
```tsx
<AssetCard
  asset={assetData}
  onBuy={handleBuy}
  onList={handleList}
  isOwner={isCurrentOwner}
/>
```

#### ActivityItem.tsx
Tracks and displays transaction activities:
- Transaction status (pending/success/error)
- Action types (mint/list/buy/approve)
- Transaction details and links
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
  listed: boolean;
  price?: string;
}

// Transaction result type
interface TestResult {
  action: 'mint' | 'list' | 'buy' | 'approve';
  status: 'pending' | 'waiting_confirmation' | 'success' | 'error';
  timestamp: number;
  txHash?: string;
  details?: string;
  error?: string;
}
```

## Key Functions

### Contract Initialization
```typescript
const initializeContracts = async () => {
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const tokenContract = new Contract(TOKEN_ADDRESS, tokenABI, signer);
  const marketplaceContract = new Contract(MARKETPLACE_ADDRESS, marketplaceABI, signer);
  
  return { tokenContract, marketplaceContract };
};
```

### Asset Management
```typescript
const fetchAssets = async (forceRefresh = false) => {
  // Fetches all assets from the blockchain
  // Updates local state with asset information
};

const handleMintAsset = async () => {
  // Handles the asset minting process
  // Updates activity tracking
  // Refreshes asset list
};

const handleListAsset = async (assetId: number) => {
  // Handles asset listing on marketplace
  // Updates activity tracking
};
```

## Styling

### styles/App.css
Main styling file containing:
- Layout and grid systems
- Component-specific styles
- Responsive design rules
- Theme variables

Example:
```css
.app-container {
  min-height: 100vh;
  background-color: var(--neutral-light);
}

.activity-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}
```

## State Management

The application uses React's built-in state management with:
- `useState` for component-level state
- `useEffect` for side effects and data fetching
- `useCallback` for memoized functions
- `useRef` for persistent values

Example:
```typescript
const [assets, setAssets] = useState<Asset[]>([]);
const [loading, setLoading] = useState(false);
const [results, setResults] = useState<TestResult[]>([]);
```

## Error Handling

The application implements comprehensive error handling:
- MetaMask connection errors
- Transaction failures
- Contract interaction errors
- Network issues

Example:
```typescript
try {
  // Contract interaction
} catch (error) {
  setResults(prev => addUniqueResult(prev, {
    action: 'mint',
    status: 'error',
    timestamp: Date.now(),
    error: error instanceof Error ? error.message : 'Unknown error'
  }));
}
```

## Usage Guidelines

1. **Wallet Connection**:
   - Ensure MetaMask is installed
   - Connect to the correct network
   - Handle account changes

2. **Asset Operations**:
   - Minting requires connected wallet
   - Listing requires asset ownership
   - Buying requires sufficient funds

3. **Transaction Monitoring**:
   - Check activity section for status
   - Wait for confirmations
   - Verify transaction on block explorer

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

Key test files:
- Component tests
- Contract interaction tests
- Integration tests

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent styling
3. Document new features
4. Add appropriate tests
5. Update this documentation
