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

## Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Hardhat

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
3. Mint new assets using the RWAToken contract
4. List assets for sale on the marketplace
5. Users can purchase listed assets

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
```

## Security

- All contracts inherit from OpenZeppelin's battle-tested contracts
- Access control mechanisms in place
- Safe transfer implementations
- Platform fees handled securely

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
