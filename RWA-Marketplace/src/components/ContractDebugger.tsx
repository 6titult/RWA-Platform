/**
 * Contract Debugger Component
 * Temporary component to help diagnose contract issues
 * Add this to your app temporarily to debug the MetaMask execution reverted error
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { debugContractSetup, debugContractCalls } from '../utils/contractDebug';

export const ContractDebugger: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDebug = async () => {
    setIsDebugging(true);
    setDebugResults([]);
    
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      addLog(args.join(' '));
      originalLog(...args);
    };

    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog(`WARN: ${args.join(' ')}`);
      originalWarn(...args);
    };

    try {
      addLog('Starting contract debug...');
      
      // Run basic setup debug
      const setupOk = await debugContractSetup();
      
      if (setupOk) {
        addLog('Basic setup checks passed, testing contract calls...');
        
        // Get signer and test contract calls
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          await debugContractCalls(signer);
        }
      }
      
      addLog('Debug completed!');
    } catch (error) {
      addLog(`Debug failed: ${error}`);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsDebugging(false);
    }
  };

  const clearLogs = () => {
    setDebugResults([]);
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      maxHeight: '500px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#495057' }}>Contract Debugger</h4>
      
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={runDebug} 
          disabled={isDebugging}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            marginRight: '8px',
            cursor: isDebugging ? 'not-allowed' : 'pointer'
          }}
        >
          {isDebugging ? 'Running...' : 'Run Debug'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Logs
        </button>
      </div>

      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        padding: '8px'
      }}>
        {debugResults.length === 0 ? (
          <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
            Click "Run Debug" to start diagnosing contract issues...
          </div>
        ) : (
          debugResults.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '4px',
                color: result.includes('ERROR') ? '#dc3545' : 
                       result.includes('WARN') ? '#fd7e14' :
                       result.includes('✅') ? '#28a745' :
                       result.includes('❌') ? '#dc3545' : '#495057'
              }}
            >
              {result}
            </div>
          ))
        )}
      </div>
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#6c757d' }}>
        This debugger helps identify contract deployment and network issues.
        Remove this component once issues are resolved.
      </div>
    </div>
  );
};
