# RWA Platform

A comprehensive decentralized platform for tokenizing and trading Real World Assets (RWA) on the blockchain. This platform combines smart contracts for asset tokenization with a modern React frontend for seamless user interaction.

## Architecture

### Frontend (RWA-Marketplace)
- React 19.0.0 with TypeScript
- Vite 6.2.0 build system
- Web3 integration (Ethers.js 6.13.5 & Web3.js 4.16.0)
- TanStack Query 5.69.0 for data management
- Bootstrap 5.3.3 & React Bootstrap 2.10.9 for UI

### Smart Contracts
- Solidity ^0.8.20
- Hardhat Development Environment
- OpenZeppelin Contracts
- ERC721 implementation for NFTs

## Project Structure

```
/
├── RWA-Marketplace/           # Frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AssetCard.tsx  # Individual asset display
│   │   │   └── ActivityItem.tsx # Transaction activity display
│   │   ├── modules/           # Core functionality modules
│   │   │   ├── activity/      # Activity tracking
│   │   │   ├── assets/        # Asset management
│   │   │   ├── constants/     # Global constants
│   │   │   ├── contracts/     # Contract interactions
│   │   │   └── wallet/        # Wallet connection
│   │   ├── styles/            # CSS/styling
│   │   ├── types/             # TypeScript definitions
│   │   ├── App.tsx            # Main component
│   │   └── main.tsx           # Entry point
│   ├── vite.config.ts         # Vite configuration
│   └── package.json           # Frontend dependencies
│
└── contracts/                 # Smart Contracts
    ├── RWAToken.sol           # NFT implementation
    └── RWAMarketplace.sol     # Trading logic
```

## Features

### Smart Contract Capabilities
- **Asset Tokenization**
  - ERC721-compliant NFT minting
  - Legal documentation storage
  - Asset valuation tracking
  - Ownership verification
  - IPFS metadata integration

- **Marketplace Operations**
  - Secure asset listing
  - Trading functionality
  - Configurable platform fees
  - Ownership transfer management

### Frontend Features
- **Wallet Integration**
  - MetaMask connection
  - Account management
  - Network detection
  - Transaction signing
  - Balance display

- **Asset Management**
  - NFT minting interface
  - Asset listing controls
  - Trading functionality
  - Portfolio view
  - Sorting and filtering options

- **Transaction Handling**
  - Real-time status tracking
  - Comprehensive error management
  - Loading state indicators
  - Transaction history
  - Activity timeline

## Core Components

### App.tsx
The main application component that orchestrates all functionality:
- Wallet connection management
- Asset fetching and display
- Transaction handling for buying, listing, and minting
- Activity tracking
- UI state management

### AssetCard.tsx
Displays individual asset information with interactive controls:
- Asset ID and ownership details
- Valuation and audit information
- Listing status and price
- Action buttons (Buy/List) based on ownership
- Loading state indicators

### ActivityItem.tsx
Tracks and displays transaction activities:
- Transaction status (pending/waiting/success/error)
- Action types (mint/list/buy/approve)
- Transaction details and timestamps
- Real-time updates

### Wallet Connection
Handles all wallet-related functionality:
- MetaMask integration
- Account detection and changes
- Balance retrieval
- Chain ID validation
- Error handling

### Contract Interactions
Manages all blockchain interactions:
- Contract initialization
- Transaction submission
- Event listening
- Error handling
- Gas optimization

## Implementation Details

### Asset Listing Process
The asset listing process involves a two-step transaction flow:
1. **Approval Transaction**
   - Approve the marketplace contract to transfer the token
   - Wait for transaction confirmation
   - Track approval status in the UI

2. **Listing Transaction**
   - List the asset on the marketplace with a specified price
   - Wait for transaction confirmation
   - Update the UI with the new listing status

### Asset Buying Process
The buying process involves a single transaction:
1. **Purchase Transaction**
   - Send ETH to the marketplace contract
   - Execute the purchase transaction
   - Wait for confirmation
   - Update ownership in the UI

### Activity Tracking
All transactions are tracked in real-time with multiple status updates:
- **Pending**: Initial transaction preparation
- **Waiting Confirmation**: Transaction submitted to blockchain
- **Success**: Transaction confirmed
- **Error**: Transaction failed

## Getting Started

### Prerequisites
- Node.js LTS (20.11.x recommended)
- npm or yarn
- MetaMask extension
- Hardhat (for contract development)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd RWA-Marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
VITE_API_KEY=your_api_key
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_MARKETPLACE_ADDRESS=your_marketplace_address
```

5. Start development server:
```bash
npm run dev
```

### Smart Contract Development

1. Install Hardhat and dependencies:
```bash
npm install --save-dev hardhat @openzeppelin/contracts
```

2. Configure network settings in `hardhat.config.ts`

3. Deploy contracts:
```bash
npx hardhat run scripts/deploy.ts --network <network>
```

## Available Scripts

### Frontend
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run clean` - Clean build cache
- `npm run lint` - Code linting
- `npm run preview` - Preview build
- `npm run reset` - Reset dependencies

### Smart Contracts
- `npx hardhat compile` - Compile contracts
- `npx hardhat test` - Run tests
- `npx hardhat node` - Local blockchain
- `npx hardhat run scripts/deploy.ts` - Deploy contracts

## Development Configuration

### Vite Setup
- Source map generation
- React vendor chunking
- TypeScript integration
- Path aliasing
- Development server with hot reload
- NGROK support

### Security Measures
- OpenZeppelin contract inheritance
- Access control implementation
- Safe transfer protocols
- Frontend error boundaries
- Environment variable protection
- Secure wallet connections
- Comprehensive error handling
- Input validation

## Code Examples

### Connecting to MetaMask
```typescript
const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error('Please install MetaMask!');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    await handleAccountsChanged(accounts as string[]);

    // Invalidate queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['signer'] });
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};
```

### Listing an Asset for Sale
```typescript
// Initialize contracts
const { tokenContract, marketplaceContract } = await initializeContracts();

// Get the marketplace address
const marketplaceAddress = await marketplaceContract.getAddress();

// Approve the marketplace to transfer the token
const approveTx = await tokenContract.approve(marketplaceAddress, id);
const approveReceipt = await approveTx.wait();

// Convert the price to wei
const priceInWei = parseEther(price.toString());

// List the asset on the marketplace
const listTx = await marketplaceContract.listAsset(id, priceInWei);
const listReceipt = await listTx.wait();
```

### Buying an Asset
```typescript
// Initialize contracts
const { marketplaceContract } = await initializeContracts();

// Convert the price to wei
const priceInWei = parseEther(price.toString());

// Call the buyAsset function with the ETH value
const buyTx = await marketplaceContract.buyAsset(id, { value: priceInWei });
const buyReceipt = await buyTx.wait();
```

## Contributing

1. Fork repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## Testing

### Smart Contracts
```bash
npx hardhat test
```

### Frontend
```bash
npm run test
```

## Deployment

### Smart Contracts
1. Configure network in `hardhat.config.ts`
2. Set deployment parameters
3. Run deployment script
4. Verify contracts on explorer

### Frontend
1. Build production version
```bash
npm run build
```
2. Deploy to hosting service
3. Configure environment variables

## Recent Updates

### v1.1.0 (Latest)
- Implemented full contract interactions for buying and listing assets
- Added comprehensive activity tracking for all transactions
- Enhanced UI with loading indicators and error handling
- Improved wallet connection with automatic account detection
- Added sorting and filtering functionality for assets
- Fixed various bugs and improved code structure

### v1.0.0
- Initial release with basic functionality
- MetaMask integration
- Asset display
- Simple transaction handling

## License

MIT

## Support

- GitHub Issues
- Documentation Wiki
- Development Team Contact
