/**
 * Treasury Pool Wallet Management
 * 
 * Manages the treasury wallet for USDC pool operations including token transfers and balance queries.
 * Supports testnet and mainnet modes via NETWORK_MODE env var.
 * Mainnet requires TREASURY_POOL_PRIVATE_KEY and validates network before operations.
 * Exports: getTreasuryWallet, getTreasuryAddress, getTreasuryProvider, isMainnetTreasury
 */

import { ethers } from "ethers";

let treasuryWallet: ethers.Wallet | null = null;
let treasuryProvider: ethers.JsonRpcProvider | null = null;

function getNetworkMode(): "testnet" | "mainnet" {
  const mode = process.env.NETWORK_MODE || "testnet";
  return mode === "mainnet" ? "mainnet" : "testnet";
}

export function isMainnetTreasury(): boolean {
  return getNetworkMode() === "mainnet";
}

const NETWORK_CONFIGS = {
  testnet: {
    rpcUrl: "https://sepolia.base.org",
    chainId: 84532,
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    name: "Base Sepolia"
  },
  mainnet: {
    rpcUrl: "https://mainnet.base.org",
    chainId: 8453,
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    name: "Base"
  }
};

export function getTreasuryNetworkConfig() {
  return NETWORK_CONFIGS[getNetworkMode()];
}

export function getTreasuryProvider(): ethers.JsonRpcProvider {
  if (treasuryProvider) {
    return treasuryProvider;
  }

  const config = getTreasuryNetworkConfig();
  treasuryProvider = new ethers.JsonRpcProvider(config.rpcUrl);
  return treasuryProvider;
}

export function getTreasuryWallet(): ethers.Wallet {
  if (treasuryWallet) {
    return treasuryWallet;
  }

  const privateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error("TREASURY_POOL_PRIVATE_KEY environment variable not set");
  }

  const provider = getTreasuryProvider();
  treasuryWallet = new ethers.Wallet(privateKey, provider);
  
  const config = getTreasuryNetworkConfig();
  console.log(`Treasury wallet initialized on ${config.name} (chainId: ${config.chainId})`);
  
  return treasuryWallet;
}

export function getTreasuryAddress(): string {
  return getTreasuryWallet().address;
}

export function getTreasuryUSDCAddress(): string {
  return getTreasuryNetworkConfig().usdcAddress;
}
