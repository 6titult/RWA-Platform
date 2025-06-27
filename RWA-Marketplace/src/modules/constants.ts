export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || "0xc490c84Df329Ed2fce87e8688b61f4506B1EF685";
export const MARKETPLACE_ADDRESS = import.meta.env.VITE_MARKETPLACE_ADDRESS || "0x34De2FC59c60da41Ff896DE074923e2616f1bCAf";
export const MAX_ACTIVITIES = 10;

export const validateEnv = () => {
  const requiredVars = {
    TOKEN_ADDRESS: import.meta.env.VITE_TOKEN_ADDRESS,
    MARKETPLACE_ADDRESS: import.meta.env.VITE_MARKETPLACE_ADDRESS
  };

  console.log('Environment Variables:', {
    ...requiredVars,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV
  });

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
};

// Network configuration
export const SUPPORTED_NETWORKS = {
  // Sepolia testnet
  11155111: {
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://eth-sepolia.public.blastapi.io',
    priceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306' // Sepolia ETH/USD
  },
  // Polygon Amoy testnet
  80002: {
    name: 'Polygon Amoy',
    currency: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    priceFeed: '0xF0d50568e3A7e8259E16663972b11910F89BD8e7' // Amoy ETH/USD
  }
};

// Get current network info
export const getCurrentNetwork = async () => {
  if (!window.ethereum) return null;
  
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex as string, 16);
    return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] || null;
  } catch (error) {
    console.error('Error getting network:', error);
    return null;
  }
};
