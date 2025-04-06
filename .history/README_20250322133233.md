# RWA Platform

A decentralized platform for tokenizing and trading Real World Assets (RWA) on the blockchain. This platform enables the creation, management, and trading of NFTs that represent real-world assets with their associated legal documentation and valuations.

## Features

- **Asset Tokenization**: Convert real-world assets into NFTs with:
  - Legal documentation links
  - Asset valuation
  - Audit trail
  - IPFS metadata storage

- **Marketplace**:
  - List assets for sale
  - Purchase assets
  - Platform fee mechanism (configurable)
  - Secure transfer of ownership

- **User Interface**:
  - Real-time wallet connection with MetaMask
  - Interactive asset management dashboard
  - Detailed transaction history and status tracking
  - Asset listing and minting controls
  - Responsive tables for asset display
  - Comprehensive error handling and feedback
  - Loading states and progress indicators
  - Transaction hash links for blockchain verification

## Smart Contracts

### RWAToken.sol
- ERC721-compliant NFT contract
- Stores asset information including legal documentation and valuations
- Maintains audit trail of asset verification
- Inherits from OpenZeppelin's ERC721URIStorage and Ownable

### RWAMarketplace.sol
- Handles asset listings and sales
- Manages platform fees
- Secure transfer mechanism
- Integration with RWAToken contract

## Technology Stack

- Solidity ^0.8.20
- Hardhat Development Environment
- OpenZeppelin Contracts
- TypeScript for Testing
- Ethers.js
- React for Frontend
- Bootstrap for UI Components

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Hardhat
- MetaMask browser extension

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd rwa-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with required environment variables:
```env
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_api_key
```

### Testing

Run the test suite:
```bash
npx hardhat test
```

### Deployment

Deploy to network:
```bash
npx hardhat run scripts/deploy.ts --network [network-name]
```

## Usage

1. Deploy the RWAToken contract with desired name and symbol
2. Deploy the Marketplace contract with the RWAToken address and fee percentage
3. Start the frontend application:
```bash
cd RWA-Marketplace
npm start
```
4. Connect your MetaMask wallet to the local network (chainId: 31337)
5. Use the interface to:
   - Mint new assets
   - List assets for sale
   - View your owned assets
   - Monitor transaction status
   - Track operation history

## Development

The project uses Hardhat's development environment. Common commands:

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost

# Start frontend development server
cd RWA-Marketplace
npm start
```

## Security

- All contracts inherit from OpenZeppelin's battle-tested contracts
- Access control mechanisms in place
- Safe transfer implementations
- Platform fees handled securely
- Frontend implements proper error handling and user feedback
- Secure wallet connection handling

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
