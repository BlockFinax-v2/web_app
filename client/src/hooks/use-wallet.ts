/**
 * use-wallet.ts
 *
 * Real EOA + Account Abstraction wallet hook for BlockFinaX web app.
 * Mirrors the mobile app's WalletContext logic, adapted for browser.
 *
 * Auth flow (same as mobile SocialAuthScreen + WalletContext):
 *   1. User creates/imports wallet → private key encrypted in localStorage
 *   2. On unlock: password decrypts private key → EOA address restored
 *   3. Smart Account address is derived deterministically from EOA
 */
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  generatePrivateKey,
  deriveAddressFromPrivateKey,
  deriveSmartAccountAddress,
  mnemonicToPrivateKey,
  isValidMnemonic,
  isValidPrivateKey,
  normalizePrivateKey,
} from '@/lib/walletCrypto';
import {
  hasWalletStored,
  storeEncryptedPrivateKey,
  storeEncryptedMnemonic,
  retrieveDecryptedPrivateKey,
  retrieveDecryptedMnemonic,
  verifyPassword,
  getStoredAddress,
  setStoredAddress,
  getStoredSmartAccountAddress,
  setStoredSmartAccountAddress,
  clearAllWalletData,
  getSettings,
  saveSettings,
} from '@/lib/browserStorage';

// ─── Types ────────────────────────────────────────────────────────────────

export interface WalletState {
  // Wallet status
  hasWallet: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;

  // EOA
  address: string | null;
  walletName: string;

  // Smart Account (Account Abstraction)
  smartAccountAddress: string | null;
  isSmartAccountEnabled: boolean;
  isSmartAccountInitialized: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────

const AUTO_LOCK_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_STATE: WalletState = {
  hasWallet: false,
  isUnlocked: false,
  isLoading: false,
  error: null,
  address: null,
  walletName: 'My Wallet',
  smartAccountAddress: null,
  isSmartAccountEnabled: true,
  isSmartAccountInitialized: false,
};

// ─── Module-Level State ──────────────────────────────────────

// REMOVED IN SECURE ON-DEMAND SIGNING: We no longer store the unencrypted
// private key or mnemonic in memory. They MUST be retrieved from browserStorage
// via password prompt at the exact moment a transaction requires them.

// Global state so session persists across different hook instances/pages
let globalState: WalletState = { ...DEFAULT_STATE };
const listeners = new Set<(state: WalletState) => void>();

function setGlobalState(updater: WalletState | ((prev: WalletState) => WalletState)) {
  globalState = typeof updater === 'function' ? updater(globalState) : updater;
  listeners.forEach((l) => l(globalState));
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useWallet() {
  const [state, setLocalState] = useState<WalletState>(globalState);

  useEffect(() => {
    listeners.add(setLocalState);
    return () => {
      listeners.delete(setLocalState);
    };
  }, []);

  const setState = setGlobalState;
  const { toast } = useToast();

  // Auto-lock timer ref
  let autoLockTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Helpers ──────────────────────────────────────────────────────────

  const setLoading = (isLoading: boolean) =>
    setState((prev) => ({ ...prev, isLoading, error: null }));

  const setError = (error: string) =>
    setState((prev) => ({ ...prev, isLoading: false, error }));

  /**
   * After successfully unlocking/creating, set up the full in-memory wallet state.
   * Derives both EOA and Smart Account addresses; stores EOA in localStorage.
   */
  const setupUnlockedState = useCallback(
    async (privateKey: string, walletName?: string) => {
      const eoaAddress = await deriveAddressFromPrivateKey(privateKey);
      const saAddress = await deriveSmartAccountAddress(eoaAddress);

      setStoredAddress(eoaAddress);
      setStoredSmartAccountAddress(saAddress);

      const savedSettings = getSettings<{ walletName?: string }>();
      const name = walletName || savedSettings?.walletName || 'My Wallet';

      setState((prev) => ({
        ...prev,
        hasWallet: true,
        isUnlocked: true,
        isLoading: false,
        error: null,
        address: eoaAddress,
        walletName: name,
        smartAccountAddress: saAddress,
        isSmartAccountEnabled: true,
        isSmartAccountInitialized: true,
      }));

      saveSettings({ walletName: name });

      // Schedule auto-lock (Disabled for testing)
      // if (autoLockTimer) clearTimeout(autoLockTimer);
      // autoLockTimer = setTimeout(() => {
      //   lockWallet();
      //   toast({ title: 'Wallet Locked', description: 'Auto-locked after 15 minutes of inactivity.' });
      // }, AUTO_LOCK_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast]
  );

  // ── Initialization ───────────────────────────────────────────────────

  /**
   * Check wallet existence on mount (mirrors mobile's initializeWalletData).
   */
  const checkWalletStatus = useCallback(async () => {
    const exists = hasWalletStored();
    const storedAddr = getStoredAddress();
    const storedSA = getStoredSmartAccountAddress();
    const savedSettings = getSettings<{ walletName?: string }>();

    setState((prev) => ({
      ...prev,
      hasWallet: exists,
      address: exists && storedAddr ? storedAddr : null,
      smartAccountAddress: exists && storedSA ? storedSA : null,
      walletName: savedSettings?.walletName || 'My Wallet',
    }));
  }, []);

  useEffect(() => {
    checkWalletStatus();
  }, [checkWalletStatus]);

  // ── Create Wallet ────────────────────────────────────────────────────

  /**
   * Create a brand-new wallet from a random private key.
   * Mirrors mobile's SocialAuthScreen "Quick Create" flow.
   */
  const createWallet = useCallback(
    async (password: string, name?: string) => {
      setLoading(true);
      try {
        const privateKey = generatePrivateKey();
        await storeEncryptedPrivateKey(privateKey, password);
        await setupUnlockedState(privateKey, name || 'My Wallet');
        toast({ title: '🎉 Wallet Created', description: 'Your BlockFinaX wallet is ready with Smart Account support.' });
        return { address: getStoredAddress()! };
      } catch (err: any) {
        setError(err.message || 'Failed to create wallet');
        throw err;
      }
    },
    [setupUnlockedState, toast]
  );

  // ── Import Wallet ────────────────────────────────────────────────────

  /**
   * Import an existing wallet via private key or seed phrase.
   * Mirrors mobile's SocialAuthScreen "Import Existing Wallet" flow.
   */
  const importWallet = useCallback(
    async (password: string, input: string, type: 'private_key' | 'mnemonic', name?: string) => {
      setLoading(true);
      try {
        let privateKey: string;

        if (type === 'private_key') {
          if (!isValidPrivateKey(input)) {
            throw new Error('Invalid private key. Must be 64 hex characters (optionally prefixed with 0x).');
          }
          privateKey = normalizePrivateKey(input);
        } else {
          if (!isValidMnemonic(input)) {
            throw new Error('Invalid seed phrase. Must be 12, 15, 18, 21, or 24 words.');
          }
          privateKey = await mnemonicToPrivateKey(input);
          // Also encrypt the mnemonic for recovery
          await storeEncryptedMnemonic(input, password);
        }

        await storeEncryptedPrivateKey(privateKey, password);
        await setupUnlockedState(privateKey, name || 'Imported Wallet');
        toast({ title: '✅ Wallet Imported', description: 'Your wallet is now secured with Smart Account Abstraction.' });
        return { address: getStoredAddress()! };
      } catch (err: any) {
        setError(err.message || 'Failed to import wallet');
        throw err;
      }
    },
    [setupUnlockedState, toast]
  );

  // ── Unlock Wallet ────────────────────────────────────────────────────

  /**
   * Unlock an existing wallet with the user's password.
   * Mirrors mobile's WalletContext unlockWallet → hydrateWallet flow.
   */
  const unlockWallet = useCallback(
    async (password: string) => {
      setLoading(true);
      try {
        // Verify password by attempting decryption
        const isCorrect = await verifyPassword(password);
        if (!isCorrect) {
          throw new Error('Invalid password. Please try again.');
        }

        const privateKey = await retrieveDecryptedPrivateKey(password);
        await setupUnlockedState(privateKey);
        toast({ title: 'Welcome back! 👋', description: 'Wallet unlocked. Smart Account is active.' });
        return { address: getStoredAddress()! };
      } catch (err: any) {
        setError(err.message || 'Failed to unlock wallet');
        throw err;
      }
    },
    [setupUnlockedState, toast]
  );

  // ── Lock Wallet ──────────────────────────────────────────────────────

  /**
   * Lock the wallet — clears in-memory state but keeps localStorage.
   * Mirrors mobile's WalletContext lockWallet.
   */
  const lockWallet = useCallback(() => {
    if (autoLockTimer) clearTimeout(autoLockTimer);
    setState((prev) => ({
      ...prev,
      isUnlocked: false,
      address: null,
      smartAccountAddress: null,
      isSmartAccountInitialized: false,
    }));
  }, []);

  // ── Delete Wallet ────────────────────────────────────────────────────

  /**
   * Permanently delete all wallet data from localStorage.
   */
  const deleteWallet = useCallback(() => {
    clearAllWalletData();
    setState({ ...DEFAULT_STATE });
    toast({ title: 'Wallet Deleted', description: 'All wallet data has been removed from this device.' });
  }, [toast]);

  // ── Update Settings ──────────────────────────────────────────────────

  const updateSettings = useCallback(
    (updates: Partial<{ walletName: string }>) => {
      const current = getSettings<Record<string, unknown>>() ?? {};
      saveSettings({ ...current, ...updates });
      if (updates.walletName) {
        setState((prev) => ({ ...prev, walletName: updates.walletName! }));
      }
    },
    []
  );

  // ── Export ───────────────────────────────────────────────────────────

  const exportPrivateKey = useCallback(async (password: string): Promise<string> => {
    return retrieveDecryptedPrivateKey(password);
  }, []);

  const exportMnemonic = useCallback(async (password: string): Promise<string | null> => {
    try {
      return await retrieveDecryptedMnemonic(password);
    } catch {
      return null;
    }
  }, []);

  // ── Return ───────────────────────────────────────────────────────────

  return {
    // State
    ...state,
    wallet: state.isUnlocked ? { address: state.address, name: state.walletName } : null,
    settings: { selectedNetworkId: 84532, autoLock: true, autoLockTimeout: 15 },

    // Methods
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    deleteWallet,
    checkWalletStatus,
    updateSettings,
    exportPrivateKey,
    exportMnemonic,
    walletExists: hasWalletStored,
  };
}
