/**
 * use-wallet — Demo/dummy hook (no real blockchain integration)
 * Returns a hardcoded demo wallet state for UI preview purposes.
 */
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface WalletState {
  isUnlocked: boolean;
  address: string | null;
  walletName: string;
  isLoading: boolean;
  error: string | null;
}

const DEMO_ADDRESS = '0xD3mO1234567890aBcDeF1234567890AbCdEf1234';
const DEMO_NAME = 'Demo Wallet';

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isUnlocked: false,
    address: null,
    walletName: DEMO_NAME,
    isLoading: false,
    error: null,
  });
  const { toast } = useToast();

  const createWallet = useCallback(async (_password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    await new Promise(r => setTimeout(r, 1200));
    setState({
      isUnlocked: true,
      address: DEMO_ADDRESS,
      walletName: name || DEMO_NAME,
      isLoading: false,
      error: null,
    });
    toast({ title: 'Wallet Created', description: 'Your demo wallet is ready.' });
    return { address: DEMO_ADDRESS, name: name || DEMO_NAME };
  }, [toast]);

  const importWallet = useCallback(async (_password: string, _input: string, _type: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    await new Promise(r => setTimeout(r, 1200));
    setState({
      isUnlocked: true,
      address: DEMO_ADDRESS,
      walletName: name || DEMO_NAME,
      isLoading: false,
      error: null,
    });
    toast({ title: 'Wallet Imported', description: 'Your demo wallet has been imported.' });
    return { address: DEMO_ADDRESS, name: name || DEMO_NAME };
  }, [toast]);

  const unlockWallet = useCallback(async (_password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    await new Promise(r => setTimeout(r, 800));
    setState({
      isUnlocked: true,
      address: DEMO_ADDRESS,
      walletName: DEMO_NAME,
      isLoading: false,
      error: null,
    });
    toast({ title: 'Wallet Unlocked', description: 'Welcome back!' });
    return { address: DEMO_ADDRESS, name: DEMO_NAME };
  }, [toast]);

  const lockWallet = useCallback(() => {
    setState({ isUnlocked: false, address: null, walletName: DEMO_NAME, isLoading: false, error: null });
  }, []);

  const deleteWallet = useCallback(() => {
    setState({ isUnlocked: false, address: null, walletName: DEMO_NAME, isLoading: false, error: null });
    toast({ title: 'Wallet Deleted', description: 'Your demo wallet has been removed.' });
  }, [toast]);

  const walletExists = useCallback(() => true, []);
  const exportPrivateKey = useCallback(() => '0xDEMO_PRIVATE_KEY_NOT_REAL', []);
  const exportMnemonic = useCallback(() => 'demo word one two three four five six seven eight nine ten eleven twelve', []);

  return {
    ...state,
    wallet: state.isUnlocked ? { address: state.address, name: state.walletName } : null,
    settings: { selectedNetworkId: 1, autoLock: false, autoLockTimeout: 30 },
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    deleteWallet,
    walletExists,
    exportPrivateKey,
    exportMnemonic,
    checkWalletStatus: async () => { },
    updateSettings: () => { },
  };
}
