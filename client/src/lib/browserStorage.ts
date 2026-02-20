/**
 * browserStorage.ts
 *
 * Web-compatible equivalent of the mobile app's secureStorage.ts.
 * Uses localStorage for persistence and AES-GCM (via walletCrypto) for
 * sensitive data encryption.
 *
 * Key map (mirrors mobile app):
 *   blockfinax.privateKey.encrypted  → JSON-stringified EncryptedData
 *   blockfinax.mnemonic              → encrypted mnemonic (same format)
 *   blockfinax.address               → plain EOA address (non-sensitive)
 *   blockfinax.smartAccount         → plain smart account address
 *   blockfinax.settings              → JSON settings object
 *   blockfinax.network               → selected network ID
 */

import {
    encryptPrivateKey,
    decryptPrivateKey,
    type EncryptedData,
} from "./walletCrypto";

const KEYS = {
    ENCRYPTED_PRIVATE_KEY: "blockfinax.privateKey.encrypted",
    ENCRYPTED_MNEMONIC: "blockfinax.mnemonic.encrypted",
    ADDRESS: "blockfinax.address",
    SMART_ACCOUNT: "blockfinax.smartAccount",
    HAS_WALLET: "blockfinax.hasWallet",
    SETTINGS: "blockfinax.settings",
    NETWORK: "blockfinax.network",
} as const;

// ─── Wallet Existence ─────────────────────────────────────────────────────

export function hasWalletStored(): boolean {
    return localStorage.getItem(KEYS.HAS_WALLET) === "true";
}

// ─── Address ──────────────────────────────────────────────────────────────

export function getStoredAddress(): string | null {
    return localStorage.getItem(KEYS.ADDRESS);
}

export function setStoredAddress(address: string): void {
    localStorage.setItem(KEYS.ADDRESS, address);
}

export function getStoredSmartAccountAddress(): string | null {
    return localStorage.getItem(KEYS.SMART_ACCOUNT);
}

export function setStoredSmartAccountAddress(address: string): void {
    localStorage.setItem(KEYS.SMART_ACCOUNT, address);
}

// ─── Encrypted Private Key ────────────────────────────────────────────────

/**
 * Encrypt and store the private key with a user password.
 */
export async function storeEncryptedPrivateKey(
    privateKey: string,
    password: string
): Promise<void> {
    const encrypted = await encryptPrivateKey(privateKey, password);
    localStorage.setItem(KEYS.ENCRYPTED_PRIVATE_KEY, JSON.stringify(encrypted));
    localStorage.setItem(KEYS.HAS_WALLET, "true");
}

/**
 * Decrypt and return the private key. Throws on wrong password.
 */
export async function retrieveDecryptedPrivateKey(
    password: string
): Promise<string> {
    const stored = localStorage.getItem(KEYS.ENCRYPTED_PRIVATE_KEY);
    if (!stored) {
        throw new Error("No encrypted private key found. Please create or import a wallet.");
    }
    const encrypted: EncryptedData = JSON.parse(stored);
    return decryptPrivateKey(encrypted, password);
}

/**
 * Return true if the private key can be decrypted with this password.
 */
export async function verifyPassword(password: string): Promise<boolean> {
    try {
        await retrieveDecryptedPrivateKey(password);
        return true;
    } catch {
        return false;
    }
}

// ─── Mnemonic ─────────────────────────────────────────────────────────────

/**
 * Optionally store the mnemonic encrypted with the same password.
 */
export async function storeEncryptedMnemonic(
    mnemonic: string,
    password: string
): Promise<void> {
    const encrypted = await encryptPrivateKey(mnemonic, password);
    localStorage.setItem(KEYS.ENCRYPTED_MNEMONIC, JSON.stringify(encrypted));
}

/**
 * Decrypt and return the mnemonic.
 */
export async function retrieveDecryptedMnemonic(
    password: string
): Promise<string | null> {
    const stored = localStorage.getItem(KEYS.ENCRYPTED_MNEMONIC);
    if (!stored) return null;
    const encrypted: EncryptedData = JSON.parse(stored);
    return decryptPrivateKey(encrypted, password);
}

// ─── Settings ─────────────────────────────────────────────────────────────

export function getSettings<T = Record<string, unknown>>(): T | null {
    const s = localStorage.getItem(KEYS.SETTINGS);
    return s ? (JSON.parse(s) as T) : null;
}

export function saveSettings(settings: Record<string, unknown>): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── Network ──────────────────────────────────────────────────────────────

export function getStoredNetwork(): string | null {
    return localStorage.getItem(KEYS.NETWORK);
}

export function saveNetwork(networkId: string): void {
    localStorage.setItem(KEYS.NETWORK, networkId);
}

// ─── Clear All ────────────────────────────────────────────────────────────

/**
 * Wipe all wallet-related localStorage keys.
 */
export function clearAllWalletData(): void {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
