/**
 * Payment Verification Module
 * 
 * Verifies on-chain USDC token transactions across supported networks.
 * Supports Base Sepolia (testnet) and Base Mainnet.
 * Network determined by NETWORK_MODE env var (default: "testnet").
 * Exports: verifyUSDCPayment, getPaymentNetworkConfig
 */

import { ethers } from "ethers";

interface NetworkPaymentConfig {
  usdcAddress: string;
  rpcUrl: string;
  chainId: number;
  name: string;
}

const TESTNET_CONFIG: NetworkPaymentConfig = {
  usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  rpcUrl: "https://sepolia.base.org",
  chainId: 84532,
  name: "Base Sepolia"
};

const MAINNET_CONFIG: NetworkPaymentConfig = {
  usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  rpcUrl: "https://mainnet.base.org",
  chainId: 8453,
  name: "Base"
};

const MAINNET_RPC_FALLBACKS = [
  "https://mainnet.base.org",
  "https://base.drpc.org",
  "https://base-rpc.publicnode.com"
];

const TESTNET_RPC_FALLBACKS = [
  "https://sepolia.base.org",
  "https://base-sepolia.blockpi.network/v1/rpc/public"
];

export function getNetworkMode(): "testnet" | "mainnet" {
  const mode = process.env.NETWORK_MODE || "testnet";
  return mode === "mainnet" ? "mainnet" : "testnet";
}

export function getPaymentNetworkConfig(): NetworkPaymentConfig {
  return getNetworkMode() === "mainnet" ? MAINNET_CONFIG : TESTNET_CONFIG;
}

async function getWorkingProvider(): Promise<ethers.JsonRpcProvider> {
  const fallbacks = getNetworkMode() === "mainnet" ? MAINNET_RPC_FALLBACKS : TESTNET_RPC_FALLBACKS;
  
  for (const rpcUrl of fallbacks) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
      return provider;
    } catch {
      continue;
    }
  }
  
  throw new Error(`No working RPC provider found for ${getNetworkMode()} network`);
}

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

interface PaymentVerification {
  valid: boolean;
  error?: string;
  actualAmount?: string;
  from?: string;
  to?: string;
  chainId?: number;
  networkName?: string;
}

export async function verifyUSDCPayment(
  txHash: string,
  expectedTo: string,
  expectedAmount: string,
  tolerance: number = 0.01
): Promise<PaymentVerification> {
  try {
    const config = getPaymentNetworkConfig();
    const provider = await getWorkingProvider();
    
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return {
        valid: false,
        error: "Transaction not found or not yet confirmed"
      };
    }

    if (receipt.status !== 1) {
      return {
        valid: false,
        error: "Transaction failed on-chain"
      };
    }

    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      return {
        valid: false,
        error: "Transaction details not found"
      };
    }

    if (tx.to?.toLowerCase() !== config.usdcAddress.toLowerCase()) {
      return {
        valid: false,
        error: "Transaction is not a USDC transfer"
      };
    }

    const usdcInterface = new ethers.Interface(USDC_ABI);
    let transferEvent = null;

    for (const log of receipt.logs) {
      try {
        const parsed = usdcInterface.parseLog({
          topics: [...log.topics],
          data: log.data
        });
        
        if (parsed?.name === "Transfer") {
          transferEvent = parsed;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!transferEvent) {
      return {
        valid: false,
        error: "No USDC transfer event found in transaction"
      };
    }

    const from = transferEvent.args[0];
    const to = transferEvent.args[1];
    const value = transferEvent.args[2];

    const actualAmount = ethers.formatUnits(value, 6);

    if (to.toLowerCase() !== expectedTo.toLowerCase()) {
      return {
        valid: false,
        error: `Payment sent to wrong address. Expected: ${expectedTo}, Got: ${to}`,
        actualAmount,
        from,
        to
      };
    }

    const expectedAmountNum = parseFloat(expectedAmount);
    const actualAmountNum = parseFloat(actualAmount);
    const difference = Math.abs(actualAmountNum - expectedAmountNum);
    const percentDiff = difference / expectedAmountNum;

    if (percentDiff > tolerance) {
      return {
        valid: false,
        error: `Payment amount incorrect. Expected: ${expectedAmount} USDC, Got: ${actualAmount} USDC`,
        actualAmount,
        from,
        to
      };
    }

    return {
      valid: true,
      actualAmount,
      from,
      to,
      chainId: config.chainId,
      networkName: config.name
    };

  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error"
    };
  }
}
