// Extend the Window interface to include ethereum property
declare global {
  interface Window {
    ethereum?: {
      chainId: unknown;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export interface Asset {
  id: number;
  owner: string;
  uri: string;
  legalDocHash: string;
  valuation: string;
  auditor: string;
  auditDate: string;
  listed: boolean;
  price?: string;
  priceInUSD?: string; // Add USD price field
  marketplace: string;
}

export type ActionType = 'mint' | 'list' | 'buy' | 'approve';
export type ActionStatus = 'pending' | 'waiting_confirmation' | 'success' | 'error';

export interface TestResult {
  action: ActionType;
  status: ActionStatus;
  timestamp: number;
  txHash?: string;
  details?: string;
  error?: string;
  assetId?: number;
  amount?: string;
}



