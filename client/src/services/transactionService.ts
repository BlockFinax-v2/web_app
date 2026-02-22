/**
 * Transaction Service (Web App)
 * 
 * Handles all blockchain transaction operations:
 * - Native token transfers (ETH, BNB)
 * - ERC-20 token transfers (USDT, USDC, etc.)
 * - Gas estimation and management
 * - Account Abstraction (AA) integration with automatic routing
 */

import { ethers } from "ethers";
import {
    isAlchemyNetworkSupported,
    isConfiguredInAlchemyDashboard,
    NETWORK_CONFIGS
} from "@/config/alchemyAccount";
import { AlchemyAccountService } from "./alchemyAccountService";
import type { Hex } from "viem";
import { retrieveDecryptedPrivateKey, retrieveDecryptedMnemonic } from "@/lib/browserStorage";

const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const isValidAddress = (address: string) => {
    return ethers.isAddress(address);
};

export interface TransactionParams {
    recipientAddress: string;
    amount: string;
    tokenAddress?: string; // undefined for native token
    tokenDecimals?: number;
    networkId: string | number; // String 'ethereum_mainnet' or number 84532
    gasLimit?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    password?: string; // Password for decrypting private key
    useAccountAbstraction?: boolean; // Force AA or EOA
    gasless?: boolean; // Use paymaster
    smartAccountAddress?: string;
}

export interface GasEstimate {
    gasLimit: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasPrice?: bigint;
    estimatedCost: string;
}

export interface TransactionResult {
    hash: string;
    from: string;
    to: string;
    value: string;
    status: "pending" | "success" | "failed";
    timestamp: number;
    explorerUrl?: string;
}

export class TransactionService {
    private static instance: TransactionService;

    public static getInstance(): TransactionService {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }

    private getNetworkConfig(networkId: string | number) {
        const configs = Object.values(NETWORK_CONFIGS);
        let network = configs.find(n => n.chainId === Number(networkId)) || configs[0];

        // Fallback logic if we get string IDs instead of chainId
        if (typeof networkId === 'string' && networkId.includes('_')) {
            const idMap: Record<string, number> = {
                'base_sepolia': 84532,
                'lisk_sepolia': 4202,
            };
            const mappedId = idMap[networkId];
            if (mappedId) {
                network = configs.find(n => n.chainId === mappedId) || configs[0];
            }
        }

        // Alchemy service needs string ID like 'base_sepolia'
        let alchemyNetworkId = 'base_sepolia';
        if (network.chainId === 4202) alchemyNetworkId = 'lisk_sepolia';

        return { network, alchemyNetworkId };
    }

    private getProvider(rpcUrl: string) {
        return new ethers.JsonRpcProvider(rpcUrl);
    }

    private async getSigner(networkId: string | number, password?: string): Promise<ethers.Signer> {
        if (!password) {
            throw new Error("Password required to decrypt private key");
        }

        try {
            // Try resolving via mnemonic first
            const mnemonic = await retrieveDecryptedMnemonic(password);
            if (mnemonic) {
                const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
                const { network } = this.getNetworkConfig(networkId);
                const provider = this.getProvider(network.rpcUrl);
                return hdNode.connect(provider);
            }

            // Try private key
            const privateKey = await retrieveDecryptedPrivateKey(password);
            if (!privateKey) {
                throw new Error("No wallet found. Please create or import a wallet first.");
            }

            const { network } = this.getNetworkConfig(networkId);
            const provider = this.getProvider(network.rpcUrl);
            const wallet = new ethers.Wallet(privateKey, provider);
            return wallet;
        } catch (error) {
            console.error("Error getting signer:", error);
            throw new Error("Failed to access wallet credentials. Incorrect password?");
        }
    }

    private shouldUseAA(params: TransactionParams, alchemyNetworkId: string): boolean {
        if (params.useAccountAbstraction !== undefined) {
            return params.useAccountAbstraction;
        }

        if (!isConfiguredInAlchemyDashboard(alchemyNetworkId)) {
            console.log(`[TransactionService] Network ${alchemyNetworkId} is NOT configured for Alchemy AA. Falling back to EOA.`);
            return false;
        }

        if (!isAlchemyNetworkSupported(alchemyNetworkId)) {
            console.log(`[TransactionService] AA not supported on ${alchemyNetworkId}`);
            return false;
        }

        return true; // We default to AA if available on the web
    }

    private async sendViaAA(params: TransactionParams, alchemyNetworkId: string, networkConfig: any): Promise<TransactionResult> {
        console.log('[TransactionService Web] ═══════════════════════════════════════');
        console.log('[TransactionService Web] 🚀 STARTING AA TRANSACTION (GASLESS)');
        console.log(`[TransactionService Web] Network: ${networkConfig.name}`);
        console.log(`[TransactionService Web] Amount: ${params.amount} ${params.tokenAddress ? 'ERC-20' : 'NATIVE'}`);
        console.log('[TransactionService Web] ═══════════════════════════════════════');
        try {
            if (!params.password) throw new Error("Password required for AA transaction");

            const privateKey = await retrieveDecryptedPrivateKey(params.password);
            if (!privateKey) throw new Error("No private key found for AA initialization");

            const alchemyService = new AlchemyAccountService(alchemyNetworkId);
            await alchemyService.initializeSmartAccount(privateKey);

            const accountAddress = alchemyService.getAccountAddress();
            if (!accountAddress) throw new Error("Failed to get smart account address");

            let txHash: Hex;

            if (!params.tokenAddress) {
                const amountInWei = ethers.parseEther(params.amount);
                const result = await alchemyService.sendNativeToken(
                    params.recipientAddress as Hex,
                    amountInWei
                );
                txHash = result.hash;
            } else {
                const decimals = params.tokenDecimals || 18;
                const amountInUnits = ethers.parseUnits(params.amount, decimals);
                const result = await alchemyService.sendERC20Token(
                    params.tokenAddress as Hex,
                    params.recipientAddress as Hex,
                    amountInUnits
                );
                txHash = result.hash;
            }

            const explorerUrl = networkConfig.explorerUrl
                ? `${networkConfig.explorerUrl}/tx/${txHash}`
                : undefined;

            return {
                hash: txHash,
                from: accountAddress,
                to: params.recipientAddress,
                value: params.amount,
                status: "pending",
                timestamp: Date.now(),
                explorerUrl,
            };

        } catch (error: any) {
            console.error("[TransactionService Web] ═══════════════════════════════════════");
            console.error("[TransactionService Web] ❌ AA TRANSACTION FAILED!");
            console.error(`[TransactionService Web] Error Type: ${error?.constructor?.name || 'Unknown'}`);
            console.error(`[TransactionService Web] Message: ${error?.message || 'No message provided'}`);
            console.error("[TransactionService Web] ═══════════════════════════════════════");
            console.log("[TransactionService Web] 🔄 Initiating seamless fallback to EOA...");
            return this.sendViaEOA(params, alchemyNetworkId, networkConfig, error?.message || 'Unknown AA Error');
        }
    }

    private async sendViaEOA(params: TransactionParams, _alchemyNetworkId: string, networkConfig: any, fallbackReason?: string): Promise<TransactionResult> {
        console.log('[TransactionService Web] ═══════════════════════════════════════');
        if (fallbackReason) {
            console.log(`[TransactionService Web] 🔄 FALLBACK TO EOA TRANSACTION`);
            console.log(`[TransactionService Web] Reason: ${fallbackReason}`);
        } else {
            console.log('[TransactionService Web] 🚀 STARTING DIRECT EOA TRANSACTION');
        }
        console.log('[TransactionService Web] ═══════════════════════════════════════');

        // Quick validation
        if (!isValidAddress(params.recipientAddress)) throw new Error("Invalid recipient address");
        if (parseFloat(params.amount) <= 0) throw new Error("Invalid amount");

        try {
            const signer = await this.getSigner(params.networkId, params.password);
            const gasEstimate = await this.estimateGas(params);

            // We do not check balance explicitly here; relying on ethers to throw INSUFFICIENT_FUNDS during estimate/send
            let txResponse;

            if (!params.tokenAddress) {
                // Native Token
                const value = ethers.parseEther(params.amount);
                const txRequest: ethers.TransactionRequest = {
                    to: params.recipientAddress,
                    value,
                    gasLimit: params.gasLimit ? BigInt(params.gasLimit) : gasEstimate.gasLimit,
                };

                if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
                    txRequest.maxFeePerGas = gasEstimate.maxFeePerGas;
                    txRequest.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
                } else if (gasEstimate.gasPrice) {
                    txRequest.gasPrice = gasEstimate.gasPrice;
                }

                txResponse = await signer.sendTransaction(txRequest);
            } else {
                // ERC-20
                const contract = new ethers.Contract(params.tokenAddress, ERC20_ABI, signer);
                const decimals = params.tokenDecimals || 18;
                const parsedAmount = ethers.parseUnits(params.amount, decimals);

                const txOptions: any = {
                    gasLimit: params.gasLimit ? BigInt(params.gasLimit) : gasEstimate.gasLimit,
                };

                if (gasEstimate.maxFeePerGas && gasEstimate.maxPriorityFeePerGas) {
                    txOptions.maxFeePerGas = gasEstimate.maxFeePerGas;
                    txOptions.maxPriorityFeePerGas = gasEstimate.maxPriorityFeePerGas;
                } else if (gasEstimate.gasPrice) {
                    txOptions.gasPrice = gasEstimate.gasPrice;
                }

                txResponse = await contract.transfer(params.recipientAddress, parsedAmount, txOptions);
            }

            const explorerUrl = networkConfig.explorerUrl
                ? `${networkConfig.explorerUrl}/tx/${txResponse.hash}`
                : undefined;

            return {
                hash: txResponse.hash,
                from: txResponse.from,
                to: txResponse.to || params.recipientAddress,
                value: params.amount,
                status: "pending",
                timestamp: Date.now(),
                explorerUrl,
            };

        } catch (error: any) {
            console.error("Error sending EOA transaction:", error);
            if (error.code === "INSUFFICIENT_FUNDS") {
                throw new Error("Insufficient funds to complete this transaction (including gas).");
            }
            throw new Error(error.message || "Failed to send transaction");
        }
    }

    public async estimateGas(params: TransactionParams): Promise<GasEstimate> {
        if (!isValidAddress(params.recipientAddress)) throw new Error("Invalid recipient address");

        const signer = await this.getSigner(params.networkId, params.password);
        const provider = signer.provider;
        if (!provider) throw new Error("Provider is null");

        let gasLimit: bigint;
        let estimatedCostStr: string;

        if (!params.tokenAddress) {
            const value = ethers.parseEther(params.amount);
            gasLimit = await signer.estimateGas({ to: params.recipientAddress, value });
        } else {
            const contract = new ethers.Contract(params.tokenAddress, ERC20_ABI, signer);
            const decimals = params.tokenDecimals || 18;
            const parsedAmount = ethers.parseUnits(params.amount, decimals);
            gasLimit = await contract.transfer.estimateGas(params.recipientAddress, parsedAmount);
        }

        // +20% buffer
        gasLimit = (gasLimit * 120n) / 100n;

        const feeData = await provider.getFeeData();

        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
            const totalCost = gasLimit * feeData.maxFeePerGas;
            estimatedCostStr = ethers.formatEther(totalCost);
            return {
                gasLimit,
                maxFeePerGas: feeData.maxFeePerGas,
                maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                estimatedCost: estimatedCostStr
            };
        } else {
            const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
            const totalCost = gasLimit * gasPrice;
            estimatedCostStr = ethers.formatEther(totalCost);
            return {
                gasLimit,
                gasPrice,
                estimatedCost: estimatedCostStr
            };
        }
    }

    public async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
        const { network, alchemyNetworkId } = this.getNetworkConfig(params.networkId);
        const useAA = this.shouldUseAA(params, alchemyNetworkId);

        console.log(`[TransactionService Web] Sending via ${useAA ? 'AA' : 'EOA'} on ${network.name}`);

        if (useAA) {
            return this.sendViaAA(params, alchemyNetworkId, network);
        } else {
            return this.sendViaEOA(params, alchemyNetworkId, network);
        }
    }
}

export const transactionService = TransactionService.getInstance();
