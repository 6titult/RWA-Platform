export interface Asset {
  id: number;
  owner: string;
  uri: string;
  legalDocHash: string;
  valuation: string;
  auditor: string;
  auditDate: string;
  listed?: boolean;
  price?: string;
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
}

