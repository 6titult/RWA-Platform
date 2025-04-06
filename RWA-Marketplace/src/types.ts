export interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  details?: string;
  txHash?: string;
  timestamp?: number;
}


