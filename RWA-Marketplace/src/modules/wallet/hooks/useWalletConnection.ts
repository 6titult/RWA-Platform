import { useState, useCallback, useEffect } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { useQueryClient } from '@tanstack/react-query';

export const useWalletConnection = () => {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  const handleAccountsChanged = useCallback(async (accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance(null);
    } else {
      const newAccount = accounts[0];
      setAccount(newAccount);
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(newAccount);
        setBalance(formatEther(balance));

        // Invalidate and refetch queries that depend on the account
        queryClient.invalidateQueries({ queryKey: ['signer'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
      }
    }
  }, [queryClient]);

  const handleChainChanged = useCallback((chainId: string) => {
    setChainId(chainId);
    // Invalidate all queries when chain changes
    queryClient.invalidateQueries();
    // No need to reload the page, React Query will handle refetching
  }, [queryClient]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask!');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      await handleAccountsChanged(accounts as string[]);

      // Explicitly invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['signer'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: unknown) => {
          if (Array.isArray(accounts) && accounts.length > 0) {
            handleAccountsChanged(accounts as string[]);
          }
        })
        .catch(error => console.error('Error checking accounts:', error));

      // Define event handlers that we can reference for both adding and removing
      const accountsChangedHandler = (accounts: unknown) => handleAccountsChanged(accounts as string[]);
      const chainChangedHandler = (chainId: unknown) => handleChainChanged(chainId as string);

      // Set up event listeners
      window.ethereum.on('accountsChanged', accountsChangedHandler);
      window.ethereum.on('chainChanged', chainChangedHandler);

      return () => {
        // Clean up event listeners
        window.ethereum?.removeListener('accountsChanged', accountsChangedHandler);
        window.ethereum?.removeListener('chainChanged', chainChangedHandler);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  return {
    account,
    balance,
    chainId,
    connectWallet,
    handleAccountsChanged
  };
};




