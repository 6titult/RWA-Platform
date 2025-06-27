# RWA Marketplace

A decentralized marketplace for Real World Assets (RWA) built with React, TypeScript, and Vite. This platform enables tokenization and trading of real-world assets using blockchain technology.

## Tech Stack

- React 19.0.0
- TypeScript
- Vite 6.2.0
- Ethers.js 6.13.5
- Web3.js 4.16.0
- Bootstrap 5.3.3
- React Bootstrap 2.10.9
- TanStack Query 5.69.0

## Project Structure

```
RWA-Marketplace/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/     # Shared components (buttons, inputs, etc.)
│   │   ├── layout/     # Layout components (header, footer, etc.)
│   │   └── features/   # Feature-specific components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API and blockchain service integrations
│   │   ├── api/        # REST API services
│   │   └── blockchain/ # Web3 and contract interactions
│   ├── utils/          # Utility functions and helpers
│   ├── contexts/       # React context providers
│   ├── pages/          # Page components
│   ├── styles/         # CSS and styling files
│   ├── types/          # TypeScript type definitions
│   ├── abis/           # Contract ABIs
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- MetaMask browser extension

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd RWA-Marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run clean` - Clean build cache and dist
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run reset` - Reset node_modules and package-lock.json

## Development

### Environment Configuration

The project uses Vite's environment configuration. Create a `.env` file in the root directory:

```env
VITE_API_KEY=your_api_key
VITE_CONTRACT_ADDRESS=your_contract_address
```

### Build Configuration

The project includes:
- Source map generation
- React vendor chunk splitting
- TypeScript support
- Path aliasing (@/ points to src/)
- Development server with polling
- NGROK support for external access

### ESLint Configuration

The project uses a comprehensive ESLint setup with:
- TypeScript-aware lint rules
- React-specific plugins (react-x, react-dom)
- Strict type checking
- Style enforcement

## Features

- Wallet Integration (MetaMask)
- Real-time Transaction Tracking
- Asset Management
  - Minting
  - Listing
  - Trading
- Interactive UI Components
- Comprehensive Error Handling
- Transaction Status Monitoring

## Security

- Secure Contract Interactions
- Type-safe Development
- Environment Variable Protection
- Proper Error Boundaries

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the repository or contact the development team.


