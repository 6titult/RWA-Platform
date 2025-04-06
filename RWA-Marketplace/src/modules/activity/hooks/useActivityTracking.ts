import { useState, useCallback } from 'react';
import { MAX_ACTIVITIES } from '../../constants';
import { TestResult } from '../../../types/index';

export const useActivityTracking = () => {
  const [results, setResults] = useState<TestResult[]>([]);

  const addUniqueResult = useCallback((prevResults: TestResult[], newResult: TestResult) => {
    const filteredResults = prevResults.filter(r => r.timestamp !== newResult.timestamp);
    const allResults = [...filteredResults, newResult];
    return allResults.slice(-MAX_ACTIVITIES);
  }, []);

  const addActivityResult = useCallback((result: {
    action: 'mint' | 'list' | 'buy' | 'approve';
    status: 'pending' | 'waiting_confirmation' | 'success' | 'error';
    assetId?: number;
    amount?: string;
    txHash?: string;
    error?: string;
    details?: string;
    timestamp?: number;
  }) => {
    setResults(prev => addUniqueResult(prev, {
      ...result,
      timestamp: result.timestamp || Date.now(),
      status: result.status === 'waiting_confirmation' ? 'pending' : result.status,
      action: result.action
    }));
  }, [addUniqueResult]);

  return {
    results,
    addActivityResult
  };
};
