/**
 * Smart Contract Transaction Service (Web App)
 * Unified service for executing smart contract transactions with Account Abstraction support
 * and automatic fallback to EOA when AA conditions are not met.
 */

import { ethers } from "ethers";
import { AlchemyAccountService } from "./alchemyAccountService";
import { isAlchemyNetworkSupported, isConfiguredInAlchemyDashboard, getAlchemyGasPolicyId } from "../config/alchemyAccount";
import { gaslessLimitService } from "./gaslessLimitService";
import { Hex, encodeFunctionData, parseAbi, parseEther, formatEther } from "viem";

// Minimal network definition to avoid circular dependencies
export interface WalletNetwork {
    id: string;
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl: string;
    symbol: string;
}

export interface TransactionOptions {
    contractAddress: string;
    abi: any[];
    functionName: string;
    args: any[];
    value?: string;
    network: WalletNetwork;
    privateKey: string;
    preferSmartAccount?: boolean;
    forceEOA?: boolean;
    expectGasSponsorship?: boolean;
    transactionMetadata?: {
        category?: string;
        type?: string;
        description?: string;
        amount?: string;
        tokenSymbol?: string;
        tokenAddress?: string;
        metadata?: Record<string, any>;
    };
}

export interface BatchTransactionOptions {
    transactions: Array<{
        contractAddress: string;
        abi: any[];
        functionName: string;
        args: any[];
        value?: string;
    }>;
    network: WalletNetwork;
    privateKey: string;
    preferSmartAccount?: boolean;
    forceEOA?: boolean;
    expectGasSponsorship?: boolean;
}

export interface TransactionResult {
    success: boolean;
    txHash: string;
    usedSmartAccount: boolean;
    explorerUrl: string;
    error?: string;
}

import { transactionHistoryService } from "./transactionHistoryService";

// Minimal temporary history keeping
function logTemporaryHistory(entry: any) {
    try {
        transactionHistoryService.recordTransaction(entry);
    } catch (e) {
        console.warn('Failed to log temporary tx history', e);
    }
}

class SmartContractTransactionService {
    private static instance: SmartContractTransactionService;
    private alchemyServices: Map<string, AlchemyAccountService> = new Map();

    private constructor() { }

    public static getInstance(): SmartContractTransactionService {
        if (!SmartContractTransactionService.instance) {
            SmartContractTransactionService.instance = new SmartContractTransactionService();
        }
        return SmartContractTransactionService.instance;
    }

    private async getAlchemyService(network: WalletNetwork, privateKey: string): Promise<AlchemyAccountService | null> {
        const networkKey = `${network.id}-${network.chainId}`;

        if (this.alchemyServices.has(networkKey)) {
            const service = this.alchemyServices.get(networkKey)!;
            if (service.isInitialized()) return service;
        }

        if (!isAlchemyNetworkSupported(network.id) || !isConfiguredInAlchemyDashboard(network.id)) {
            return null;
        }

        try {
            const service = new AlchemyAccountService(network.id);
            await service.initializeSmartAccount(privateKey);
            this.alchemyServices.set(networkKey, service);
            return service;
        } catch (error) {
            console.error(`[SmartContractTxService] Failed to initialize AA:`, error);
            return null;
        }
    }

    async executeTransaction(options: TransactionOptions): Promise<TransactionResult> {
        const {
            contractAddress, abi, functionName, args, value, network, privateKey,
            preferSmartAccount = true, forceEOA = false, expectGasSponsorship = true, transactionMetadata
        } = options;

        const wallet = new ethers.Wallet(privateKey);
        const fromAddress = wallet.address;

        const gaslessCheck = await gaslessLimitService.canUseGasless(0.01);
        const gasPolicyId = getAlchemyGasPolicyId();
        const shouldTryAA = !forceEOA && preferSmartAccount && isAlchemyNetworkSupported(network.id) &&
            isConfiguredInAlchemyDashboard(network.id) && gaslessCheck.allowed && (!expectGasSponsorship || !!gasPolicyId);

        if (!shouldTryAA) return this.executeWithEOA(options, fromAddress);

        try {
            const alchemyService = await this.getAlchemyService(network, privateKey);
            if (!alchemyService) return this.executeWithEOA(options, fromAddress);

            const result = await alchemyService.executeContractFunction(
                contractAddress as Hex, abi, functionName, args, {
                value: value ? BigInt(ethers.parseEther(value).toString()) : 0n,
                gasSponsored: expectGasSponsorship,
            }
            );

            if (expectGasSponsorship) {
                await gaslessLimitService.recordTransaction(0.01, 'smart-account');
            }

            const txResult = { success: true, txHash: result.hash, usedSmartAccount: true, explorerUrl: `${network.explorerUrl}/tx/${result.hash}` };
            logTemporaryHistory({ txHash: result.hash, functionName, fromAddress, toAddress: contractAddress, usedSmartAccount: true, ...transactionMetadata });
            return txResult;

        } catch (error: any) {
            console.error("[SmartContractTxService] AA transaction failed:", error);
            return this.executeWithEOA(options, fromAddress);
        }
    }

    private async executeWithEOA(options: TransactionOptions, fromAddress: string): Promise<TransactionResult> {
        const { contractAddress, abi, functionName, args, value, network, privateKey, transactionMetadata } = options;
        console.log(`[SmartContractTxService] 🚀 USING EOA FALLBACK: Executing ${functionName}...`);

        try {
            const provider = new ethers.JsonRpcProvider(network.rpcUrl, { name: network.name, chainId: network.chainId });
            const wallet = new ethers.Wallet(privateKey, provider);

            const normalizedAbi = Array.isArray(abi) && typeof abi[0] === "string" ? parseAbi(abi as string[]) : abi;
            const contract = new ethers.Contract(contractAddress, normalizedAbi as any, wallet);

            const txValue = value ? ethers.parseEther(value) : 0n;
            const tx = await contract[functionName](...args, { value: txValue });
            const receipt = await tx.wait();

            const txResult = { success: true, txHash: receipt.transactionHash, usedSmartAccount: false, explorerUrl: `${network.explorerUrl}/tx/${receipt.transactionHash}` };
            logTemporaryHistory({ txHash: receipt.transactionHash, functionName, fromAddress, toAddress: contractAddress, usedSmartAccount: false, ...transactionMetadata });
            return txResult;

        } catch (error: any) {
            console.error("[SmartContractTxService] EOA transaction failed:", error);
            return { success: false, txHash: "", usedSmartAccount: false, explorerUrl: "", error: error.message || "Unknown error" };
        }
    }

    async executeBatchTransaction(options: BatchTransactionOptions): Promise<TransactionResult> {
        const { transactions, network, privateKey, preferSmartAccount = true, forceEOA = false, expectGasSponsorship = true } = options;
        if (transactions.length === 0) throw new Error("Empty batch transaction list");

        const gaslessCheck = await gaslessLimitService.canUseGasless(0.02);
        const gasPolicyId = getAlchemyGasPolicyId();
        const shouldTryAA = !forceEOA && preferSmartAccount && isAlchemyNetworkSupported(network.id) &&
            isConfiguredInAlchemyDashboard(network.id) && gaslessCheck.allowed && (!expectGasSponsorship || !!gasPolicyId);

        if (shouldTryAA) {
            try {
                const alchemyService = await this.getAlchemyService(network, privateKey);
                if (alchemyService) {
                    const calls = transactions.map(t => ({
                        target: t.contractAddress as Hex,
                        data: encodeFunctionData({
                            abi: Array.isArray(t.abi) && typeof t.abi[0] === "string" ? parseAbi(t.abi as string[]) : t.abi,
                            functionName: t.functionName,
                            args: t.args
                        }),
                        value: t.value ? BigInt(ethers.parseEther(t.value).toString()) : 0n
                    }));

                    const result = await alchemyService.sendBatchUserOperation(calls, { gasSponsored: expectGasSponsorship });

                    if (expectGasSponsorship) await gaslessLimitService.recordTransaction(0.02, 'smart-account');

                    return { success: true, txHash: result.hash, usedSmartAccount: true, explorerUrl: `${network.explorerUrl}/tx/${result.hash}` };
                }
            } catch (error) {
                console.error("[SmartContractTxService] Batch transaction failed:", error);
            }
        }

        // Sequential fallback for EOA
        let lastHash = "";
        for (const tx of transactions) {
            const res = await this.executeWithEOA({ ...tx, network, privateKey, expectGasSponsorship: false, forceEOA: true }, "");
            if (!res.success) throw new Error(res.error || `EOA Transaction ${tx.functionName} failed`);
            lastHash = res.txHash;
        }

        return { success: true, txHash: lastHash, usedSmartAccount: false, explorerUrl: `${network.explorerUrl}/tx/${lastHash}` };
    }
}

export const smartContractTransactionService = SmartContractTransactionService.getInstance();
