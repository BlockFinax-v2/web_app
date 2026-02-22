/**
 * Transaction History Service (Web App)
 * Unified service for recording and managing transaction history across all smart contract interactions.
 * Adapted from mobile implementation to use browser localStorage instead of AsyncStorage.
 */

export type TransactionCategory = 'wallet' | 'trade' | 'treasury' | 'contract';

export type TransactionType =
    | 'send' | 'receive'
    | 'pga_create' | 'pga_vote' | 'pga_collateral' | 'pga_issuance_fee' | 'pga_balance_payment'
    | 'pga_goods_shipped' | 'pga_goods_delivered' | 'pga_claim_payment'
    | 'stake' | 'unstake' | 'claim_rewards' | 'vote_proposal'
    | 'approve' | 'contract_call';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface UnifiedTransaction {
    id: string;
    hash: string;
    timestamp: number;
    status: TransactionStatus;

    network: string;
    networkId: string;
    chainId: number;
    from: string;
    to: string;

    category: TransactionCategory;
    type: TransactionType;

    amount?: string;
    tokenSymbol?: string;
    tokenAddress?: string;

    gasUsed?: string;
    gasPrice?: string;
    gasCost?: string;
    gasTokenSymbol?: string;
    usedSmartAccount?: boolean;

    description: string;
    metadata?: Record<string, any>;

    blockNumber?: number;
    explorerUrl?: string;
}

class TransactionHistoryService {
    private static instance: TransactionHistoryService;
    private readonly STORAGE_PREFIX = 'blockfinax.tx_history_';
    private readonly MAX_TRANSACTIONS = 500;
    private readonly CACHE_TTL_MS = 30000;

    private cache: Map<string, { data: UnifiedTransaction[]; timestamp: number }> = new Map();

    // Event emitter for real-time UI updates
    public events: EventTarget = new EventTarget();

    private constructor() { }

    public static getInstance(): TransactionHistoryService {
        if (!TransactionHistoryService.instance) {
            TransactionHistoryService.instance = new TransactionHistoryService();
        }
        return TransactionHistoryService.instance;
    }

    private getStorageKey(address: string): string {
        return `${this.STORAGE_PREFIX}${address.toLowerCase()}`;
    }

    private generateTxId(txHash: string, type: TransactionType): string {
        return `${txHash}-${type}-${Date.now()}`;
    }

    async recordTransaction(tx: Omit<UnifiedTransaction, 'id'> & { id?: string }): Promise<void> {
        try {
            const transaction: UnifiedTransaction = {
                ...tx,
                id: tx.id || this.generateTxId(tx.hash, tx.type),
                timestamp: tx.timestamp || Date.now(),
            };

            const history = await this.getTransactionHistory(transaction.from);
            history.unshift(transaction);

            const limitedHistory = history.slice(0, this.MAX_TRANSACTIONS);

            localStorage.setItem(this.getStorageKey(transaction.from), JSON.stringify(limitedHistory));

            this.cache.set(transaction.from.toLowerCase(), {
                data: limitedHistory,
                timestamp: Date.now(),
            });

            // Notify listeners of the update
            this.events.dispatchEvent(new CustomEvent('transaction_updated', { detail: transaction }));
        } catch (error) {
            console.error('[TransactionHistoryWeb] Error recording transaction:', error);
        }
    }

    async updateTransactionStatus(from: string, txId: string, status: TransactionStatus, additionalUpdates?: Partial<UnifiedTransaction>): Promise<void> {
        try {
            const history = await this.getTransactionHistory(from, { skipCache: true });
            const txIndex = history.findIndex(t => t.id === txId || t.hash === txId);

            if (txIndex !== -1) {
                history[txIndex] = { ...history[txIndex], status, ...additionalUpdates };

                localStorage.setItem(this.getStorageKey(from), JSON.stringify(history));

                this.cache.set(from.toLowerCase(), {
                    data: history,
                    timestamp: Date.now(),
                });

                // Notify listeners that this specific transaction changed status
                this.events.dispatchEvent(new CustomEvent('transaction_updated', { detail: history[txIndex] }));
            }
        } catch (error) {
            console.error('[TransactionHistoryWeb] Error updating transaction status:', error);
        }
    }

    async getTransactionHistory(
        address: string,
        options?: {
            limit?: number;
            category?: TransactionCategory;
            type?: TransactionType;
            network?: string;
            skipCache?: boolean;
        }
    ): Promise<UnifiedTransaction[]> {
        try {
            const cacheKey = address.toLowerCase();

            if (!options?.skipCache) {
                const cached = this.cache.get(cacheKey);
                if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                    return this.applyFilters(cached.data, options);
                }
            }

            const rawData = localStorage.getItem(this.getStorageKey(address));
            const history: UnifiedTransaction[] = rawData ? JSON.parse(rawData) : [];

            this.cache.set(cacheKey, {
                data: history,
                timestamp: Date.now(),
            });

            return this.applyFilters(history, options);
        } catch (error) {
            console.error('[TransactionHistoryWeb] Error loading history:', error);
            return [];
        }
    }

    private applyFilters(
        transactions: UnifiedTransaction[],
        options?: { limit?: number; category?: TransactionCategory; type?: TransactionType; network?: string; }
    ): UnifiedTransaction[] {
        let filtered = [...transactions];
        if (options?.category) filtered = filtered.filter(tx => tx.category === options.category);
        if (options?.type) filtered = filtered.filter(tx => tx.type === options.type);
        if (options?.network) filtered = filtered.filter(tx => tx.networkId === options.network);
        if (options?.limit) filtered = filtered.slice(0, options.limit);
        return filtered;
    }

    async clearHistory(address: string): Promise<void> {
        try {
            localStorage.removeItem(this.getStorageKey(address));
            this.cache.delete(address.toLowerCase());
        } catch (error) {
            console.error('[TransactionHistoryWeb] Error clearing history:', error);
        }
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export const transactionHistoryService = TransactionHistoryService.getInstance();
