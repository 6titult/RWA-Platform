import { SUPPORTED_NETWORKS } from '../modules/constants';

export const getNetworkInfo = async () => {
  if (!window.ethereum) return null;
  
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex as string, 16);
    
    // Get network info from supported networks
    const networkInfo = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
    
    if (!networkInfo) {
      console.warn(`Unsupported network detected: Chain ID ${chainId}`);
      return null;
    }
    
    return {
      chainId,
      name: networkInfo.name,
      currency: networkInfo.currency,
      explorerUrl: networkInfo.explorerUrl,
      priceFeed: networkInfo.priceFeed
    };
  } catch (error) {
    console.error('Error detecting network:', error);
    return null;
  }
};

export const formatTransactionLink = (txHash: string) => {
  if (!window.ethereum) return '';
  
  const chainIdHex = window.ethereum.chainId;
  const chainId = parseInt(chainIdHex as string, 16);
  
  const networkInfo = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
  if (!networkInfo) return '';
  
  return `${networkInfo.explorerUrl}/tx/${txHash}`;
};