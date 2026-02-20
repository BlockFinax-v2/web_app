/**
 * walletCrypto.ts
 * 
 * Browser-compatible cryptography utilities for BlockFinaX wallet.
 * Uses Web Crypto API (SubtleCrypto) for secure key operations.
 * Mirrors the mobile app's secureStorage.ts encryption logic but adapted for browsers.
 */

// ─── Private Key Generation ────────────────────────────────────────────────

/**
 * Generate a cryptographically secure random private key (32 bytes → hex).
 */
export function generatePrivateKey(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return (
        "0x" +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
    );
}

// ─── Address Derivation (simplified, no ethers dependency) ────────────────

/**
 * Derive an Ethereum-like address from a private key using Web Crypto.
 * For demo purposes: SHA-256 hash of the key → last 20 bytes → checksummed hex.
 * In production: use ethers.js `new ethers.Wallet(privateKey).address`.
 */
export async function deriveAddressFromPrivateKey(privateKey: string): Promise<string> {
    const keyBytes = hexToBytes(privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey);
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyBytes as BufferSource);
    const hashBytes = new Uint8Array(hashBuffer);
    // Take last 20 bytes as the address (Ethereum-style)
    const addrBytes = hashBytes.slice(12);
    const addrHex = Array.from(addrBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return "0x" + toChecksumAddress(addrHex);
}

/**
 * Derive a Smart Account address from an EOA address.
 * Deterministic derivation for demo: SHA-256 of (EOA + "smartaccount") → last 20 bytes.
 */
export async function deriveSmartAccountAddress(eoaAddress: string): Promise<string> {
    const input = new TextEncoder().encode(eoaAddress.toLowerCase() + "smartaccount");
    const hashBuffer = await crypto.subtle.digest("SHA-256", input);
    const hashBytes = new Uint8Array(hashBuffer);
    const addrBytes = hashBytes.slice(12);
    const addrHex = Array.from(addrBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return "0x" + toChecksumAddress(addrHex);
}

/**
 * Derive a private key from a mnemonic phrase (BIP-39 simplified).
 * For demo: derives deterministically from the phrase via PBKDF2.
 * In production: use ethers.js `Wallet.fromMnemonic(phrase).privateKey`.
 */
export async function mnemonicToPrivateKey(mnemonic: string): Promise<string> {
    const normalized = mnemonic.trim().toLowerCase();
    const salt = new TextEncoder().encode("mnemonic");
    const password = new TextEncoder().encode(normalized);

    const baseKey = await crypto.subtle.importKey("raw", password, "PBKDF2", false, [
        "deriveBits",
    ]);

    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 2048, hash: "SHA-256" },
        baseKey,
        256
    );

    const bytes = new Uint8Array(bits);
    return (
        "0x" +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
    );
}

/**
 * Validate mnemonic word count (12, 15, 18, 21, or 24 words).
 */
export function isValidMnemonic(phrase: string): boolean {
    const words = phrase.trim().split(/\s+/);
    return [12, 15, 18, 21, 24].includes(words.length);
}

/**
 * Validate a private key (64 hex chars, optionally prefixed with 0x).
 */
export function isValidPrivateKey(key: string): boolean {
    const clean = key.trim().startsWith("0x") ? key.trim() : "0x" + key.trim();
    return /^0x[0-9a-fA-F]{64}$/.test(clean);
}

/**
 * Normalize a private key to have the 0x prefix.
 */
export function normalizePrivateKey(key: string): string {
    const clean = key.trim();
    return clean.startsWith("0x") ? clean : "0x" + clean;
}

// ─── Password-based Encryption (AES-GCM + PBKDF2) ────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const KEY_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;

/**
 * Derive an AES-GCM key from a password and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as BufferSource,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256",
        },
        passwordKey,
        { name: KEY_ALGORITHM, length: KEY_LENGTH },
        false,
        ["encrypt", "decrypt"]
    );
}

export interface EncryptedData {
    ciphertext: string; // base64-encoded
    iv: string;        // base64-encoded
    salt: string;      // base64-encoded
}

/**
 * Encrypt a private key with a user password.
 * Returns base64-encoded ciphertext + IV + salt.
 */
export async function encryptPrivateKey(
    privateKey: string,
    password: string
): Promise<EncryptedData> {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key = await deriveKey(password, salt);
    const encodedData = new TextEncoder().encode(privateKey);

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: KEY_ALGORITHM, iv },
        key,
        encodedData
    );

    return {
        ciphertext: uint8ToBase64(new Uint8Array(ciphertextBuffer)),
        iv: uint8ToBase64(iv),
        salt: uint8ToBase64(salt),
    };
}

/**
 * Decrypt an encrypted private key with a user password.
 * Throws if the password is wrong.
 */
export async function decryptPrivateKey(
    encrypted: EncryptedData,
    password: string
): Promise<string> {
    const salt = base64ToUint8(encrypted.salt);
    const iv = base64ToUint8(encrypted.iv);
    const ciphertext = base64ToUint8(encrypted.ciphertext);

    const key = await deriveKey(password, salt);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: KEY_ALGORITHM, iv },
            key,
            ciphertext as BufferSource
        );
        return new TextDecoder().decode(decryptedBuffer);
    } catch {
        throw new Error("Invalid password. Please try again.");
    }
}

// ─── Helper Utilities ─────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...Array.from(bytes)));
}

function base64ToUint8(base64: string): Uint8Array {
    return new Uint8Array(
        atob(base64)
            .split("")
            .map((c) => c.charCodeAt(0))
    );
}

function toChecksumAddress(hex: string): string {
    // Simple EIP-55 checksum (no keccak, for demo purposes keep lowercase)
    return hex;
}
