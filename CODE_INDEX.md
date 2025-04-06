# RWA Platform Code Index

This document provides a comprehensive index of the codebase to help developers navigate and understand the structure and functionality of the RWA Platform.

## Core Components

### Main Application

- **[App.tsx](RWA-Marketplace/src/App.tsx)**: Main application component that orchestrates all functionality
  - Wallet connection management
  - Asset fetching and display
  - Transaction handling (buy, list, mint)
  - Activity tracking
  - UI state management

- **[main.tsx](RWA-Marketplace/src/main.tsx)**: Application entry point
  - React rendering
  - Query client setup
  - Global providers

### UI Components

- **[AssetCard.tsx](RWA-Marketplace/src/components/AssetCard.tsx)**: Individual asset display component
  - Asset details rendering
  - Action buttons (Buy/List)
  - Loading state handling
  - Owner-specific UI

- **[ActivityItem.tsx](RWA-Marketplace/src/components/ActivityItem.tsx)**: Transaction activity display
  - Status indicators
  - Transaction details
  - Timestamp formatting
  - Action-specific UI

### Core Modules

#### Wallet Connection

- **[useWalletConnection.ts](RWA-Marketplace/src/modules/wallet/hooks/useWalletConnection.ts)**: Hook for wallet interactions
  - MetaMask connection
  - Account detection and changes
  - Balance retrieval
  - Chain ID validation

#### Asset Management

- **[useAssets.ts](RWA-Marketplace/src/modules/assets/hooks/useAssets.ts)**: Hook for asset data management
  - Asset fetching
  - Data transformation
  - Caching
  - Refresh logic

#### Contract Interactions

- **[useContracts.ts](RWA-Marketplace/src/modules/contracts/hooks/useContracts.ts)**: Hook for contract initialization
  - Contract instance creation
  - ABI management
  - Address configuration

- **[abis.ts](RWA-Marketplace/src/modules/contracts/abis.ts)**: Contract ABIs
  - RWAToken ABI
  - RWAMarketplace ABI

#### Activity Tracking

- **[useActivityTracking.ts](RWA-Marketplace/src/modules/activity/hooks/useActivityTracking.ts)**: Hook for transaction activity
  - Activity state management
  - Status updates
  - Persistence
  - Sorting and filtering

## Key Functionality

### Asset Listing Process

The asset listing process is implemented in the `handleListAsset` function in `App.tsx` and involves:

1. **Validation**
   - Wallet connection check
   - Asset ownership verification
   - Price validation

2. **Approval Transaction**
   - Contract initialization
   - Marketplace address retrieval
   - Token approval
   - Transaction confirmation waiting

3. **Listing Transaction**
   - Price conversion to wei
   - Marketplace contract interaction
   - Transaction confirmation waiting
   - UI updates

### Asset Buying Process

The asset buying process is implemented in the `handleBuyAsset` function in `App.tsx` and involves:

1. **Validation**
   - Wallet connection check
   - Asset availability verification
   - Ownership check (can't buy own assets)
   - Price validation

2. **Purchase Transaction**
   - Contract initialization
   - Price conversion to wei
   - ETH value sending
   - Transaction confirmation waiting
   - UI updates

### Minting Process

The minting process is implemented in the `runTest` function in `App.tsx` and involves:

1. **Data Preparation**
   - Random metadata generation
   - Legal document hash creation
   - Valuation setting

2. **Minting Transaction**
   - Contract initialization
   - Token minting
   - Transaction confirmation waiting
   - UI updates

## Styling

- **[App.css](RWA-Marketplace/src/styles/App.css)**: Main application styles
  - Layout
  - Component styling
  - Responsive design
  - Theme variables

## Type Definitions

- **[index.ts](RWA-Marketplace/src/types/index.ts)**: TypeScript type definitions
  - Asset interface
  - Activity result interface
  - Contract interfaces
  - UI state types

## Constants

- **[constants.ts](RWA-Marketplace/src/modules/constants.ts)**: Global constants
  - Contract addresses
  - Network configuration
  - Environment validation

## Development Guidelines

### Adding New Features

1. Identify the appropriate module for your feature
2. Create necessary components, hooks, or utilities
3. Update types if needed
4. Implement the feature with proper error handling
5. Add loading states and activity tracking
6. Update the UI to reflect the new functionality

### Contract Interactions

When implementing new contract interactions:

1. Ensure proper error handling
2. Add comprehensive activity tracking
3. Implement loading states
4. Validate inputs before sending transactions
5. Wait for transaction confirmations
6. Update the UI after successful transactions

### UI Components

When creating new UI components:

1. Follow the existing styling patterns
2. Implement responsive design
3. Add loading states
4. Handle error cases
5. Ensure accessibility
6. Document props and functionality

## Testing

- Unit tests for hooks and utilities
- Integration tests for contract interactions
- UI component tests
- End-to-end tests for key user flows

## Deployment

- Build process
- Environment configuration
- Contract deployment
- Frontend hosting
