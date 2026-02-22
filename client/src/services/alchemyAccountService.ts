/**
 * Alchemy Account Service (Web App)
 * Handles Alchemy Account Abstraction (ERC-4337) operations.
 * Adapted from mobile implementation.
 */

import { createModularAccountAlchemyClient } from '@account-kit/smart-contracts';
import { type AlchemySmartAccountClient, alchemy } from '@account-kit/infra';
import { LocalAccountSigner } from '@aa-sdk/core';
import { type Hex, encodeFunctionData, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
    getAlchemyChain,
    isAlchemyNetworkSupported,
    isOfficiallySupported,
    getAlchemyApiKey,
    getAlchemyGasPolicyId,
    type SupportedAlchemyNetwork,
} from '../config/alchemyAccount';

export interface TransactionCall {
    target: Hex;
    data: Hex;
    value?: bigint;
}

export interface UserOperationResult {
    hash: Hex;
    request?: any;
}

export class AlchemyAccountService {
    private client: AlchemySmartAccountClient | null = null;
    private network: SupportedAlchemyNetwork;
    private accountAddress: Hex | null = null;

    constructor(network: string) {
        if (!isAlchemyNetworkSupported(network)) {
            throw new Error(`Network ${network} is not supported by Alchemy Account Kit`);
        }
        if (!isOfficiallySupported(network)) {
            console.warn(`[AlchemyService] Network ${network} is not officially supported by Alchemy AA`);
        }
        this.network = network;
    }

    async initializeSmartAccount(
        privateKey: string,
        options?: { salt?: bigint; gasPolicyId?: string; }
    ): Promise<Hex> {
        try {
            const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
            const account = privateKeyToAccount(cleanPrivateKey as Hex);
            const signer = new LocalAccountSigner(account);

            const apiKey = getAlchemyApiKey();
            const gasPolicyId = options?.gasPolicyId ?? getAlchemyGasPolicyId();
            const chain = getAlchemyChain(this.network);

            const transport = alchemy({ apiKey });

            const clientConfig: any = {
                apiKey,
                chain,
                signer,
                transport,
            };

            if (options?.salt !== undefined) clientConfig.salt = options.salt;
            if (gasPolicyId) clientConfig.gasManagerConfig = { policyId: gasPolicyId };

            this.client = await createModularAccountAlchemyClient(clientConfig);
            this.accountAddress = this.client.account?.address ?? null;

            if (!this.accountAddress) throw new Error('Failed to get smart account address');

            return this.accountAddress;
        } catch (error) {
            console.error('[AlchemyService] Failed to initialize smart account:', error);
            throw error;
        }
    }

    getAccountAddress(): Hex | null {
        return this.accountAddress;
    }

    getClient(): AlchemySmartAccountClient | null {
        return this.client;
    }

    isInitialized(): boolean {
        return this.client !== null && this.accountAddress !== null;
    }

    async sendUserOperation(
        call: TransactionCall,
        options?: { gasSponsored?: boolean; waitForTx?: boolean; }
    ): Promise<UserOperationResult> {
        if (!this.client) throw new Error('Smart account not initialized');

        try {
            const userOp = {
                uo: { target: call.target, data: call.data, value: call.value || 0n },
                account: this.client.account!,
            };

            const result = await this.client.sendUserOperation(userOp);

            if (options?.waitForTx === false) {
                return { hash: result.hash as Hex, request: result.request };
            }

            const txHash = await this.client.waitForUserOperationTransaction({ hash: result.hash });
            return { hash: txHash, request: result.request };
        } catch (error: any) {
            console.error('[AlchemyService] Failed to send user operation:', error);
            throw error;
        }
    }

    async waitForUserOperation(hash: Hex): Promise<Hex> {
        if (!this.client) throw new Error('Smart account not initialized');
        return await this.client.waitForUserOperationTransaction({ hash });
    }

    async sendBatchUserOperation(
        calls: TransactionCall[],
        options?: { gasSponsored?: boolean; }
    ): Promise<UserOperationResult> {
        if (!this.client) throw new Error('Smart account not initialized');

        try {
            const result = await this.client.sendUserOperation({
                uo: calls.map(call => ({ target: call.target, data: call.data, value: call.value || 0n })),
                account: this.client.account!,
            });

            const txHash = await this.client.waitForUserOperationTransaction({ hash: result.hash });

            return { hash: txHash, request: result.request };
        } catch (error) {
            console.error('[AlchemyService] Failed to send batch:', error);
            throw error;
        }
    }

    async sendNativeToken(
        to: Hex, amount: bigint, options?: { gasSponsored?: boolean; waitForTx?: boolean; }
    ): Promise<UserOperationResult> {
        return this.sendUserOperation({ target: to, data: '0x', value: amount }, options);
    }

    async sendERC20Token(
        tokenAddress: Hex, to: Hex, amount: bigint, options?: { gasSponsored?: boolean; waitForTx?: boolean; }
    ): Promise<UserOperationResult> {
        const data = encodeFunctionData({
            abi: [{ name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
            functionName: 'transfer',
            args: [to, amount],
        });

        return this.sendUserOperation({ target: tokenAddress, data, value: 0n }, options);
    }

    async executeContractFunction(
        contractAddress: Hex, abi: any[], functionName: string, args: any[], options?: { value?: bigint; gasSponsored?: boolean; }
    ): Promise<UserOperationResult> {
        const normalizedAbi = Array.isArray(abi) && typeof abi[0] === "string" ? parseAbi(abi as string[]) : abi;
        const data = encodeFunctionData({ abi: normalizedAbi as any, functionName, args });
        return this.sendUserOperation({ target: contractAddress, data, value: options?.value || 0n }, options);
    }

    async isAccountDeployed(): Promise<boolean> {
        if (!this.accountAddress || !this.client) return false;
        try {
            const code = await this.client.getBytecode({ address: this.accountAddress });
            return code !== undefined && code !== '0x' && code !== null;
        } catch {
            return false;
        }
    }

    disconnect(): void {
        this.client = null;
        this.accountAddress = null;
    }
}

export function createAlchemyAccountService(network: string): AlchemyAccountService {
    return new AlchemyAccountService(network);
}
