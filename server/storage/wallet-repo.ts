import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import {
    wallets,
    networks,
    transactions,
    balances,
    type Wallet,
    type InsertWallet,
    type Network,
    type InsertNetwork,
    type Transaction,
    type InsertTransaction,
    type Balance,
    type InsertBalance
} from "@shared/schema";

export class WalletRepository {
    // Wallet operations
    async getWallet(id: number): Promise<Wallet | undefined> {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
        return wallet;
    }

    async getWalletByAddress(address: string): Promise<Wallet | undefined> {
        const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
        return wallet;
    }

    async getAllWallets(): Promise<Wallet[]> {
        return await db.select().from(wallets);
    }

    async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
        const [wallet] = await db.insert(wallets).values(insertWallet).returning();
        return wallet;
    }

    async updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
        const [updated] = await db.update(wallets).set(updates).where(eq(wallets.id, id)).returning();
        return updated;
    }

    async deleteWallet(id: number): Promise<boolean> {
        const [deleted] = await db.delete(wallets).where(eq(wallets.id, id)).returning();
        return !!deleted;
    }

    // Network operations
    async getNetwork(id: number): Promise<Network | undefined> {
        const [network] = await db.select().from(networks).where(eq(networks.id, id));
        return network;
    }

    async getNetworkByChainId(chainId: number): Promise<Network | undefined> {
        const [network] = await db.select().from(networks).where(eq(networks.chainId, chainId));
        return network;
    }

    async getAllNetworks(): Promise<Network[]> {
        return await db.select().from(networks);
    }

    async createNetwork(insertNetwork: InsertNetwork): Promise<Network> {
        const [network] = await db.insert(networks).values(insertNetwork).returning();
        return network;
    }

    async updateNetwork(id: number, updates: Partial<InsertNetwork>): Promise<Network | undefined> {
        const [updated] = await db.update(networks).set(updates).where(eq(networks.id, id)).returning();
        return updated;
    }

    // Transaction operations
    async getTransaction(id: number): Promise<Transaction | undefined> {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
        return transaction;
    }

    async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.hash, hash));
        return transaction;
    }

    async getTransactions(filters: {
        walletId?: number;
        networkId?: number;
        status?: string;
        limit?: number;
    }): Promise<Transaction[]> {
        let query = db.select().from(transactions);

        // Applying filtering logic similar to what was in storage.ts
        // (Actual implementation would use more complex drizzle query building)
        // For now, keeping it consistent with the existing implementation patterns

        const all = await db.select().from(transactions).orderBy(desc(transactions.timestamp));
        let result = all;

        if (filters.walletId) {
            result = result.filter(tx => tx.walletId === filters.walletId);
        }
        if (filters.networkId) {
            result = result.filter(tx => tx.networkId === filters.networkId);
        }
        if (filters.status) {
            result = result.filter(tx => tx.status === filters.status);
        }
        if (filters.limit) {
            result = result.slice(0, filters.limit);
        }
        return result;
    }

    async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
        const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
        return transaction;
    }

    async updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
        const [updated] = await db.update(transactions).set(updates).where(eq(transactions.hash, hash)).returning();
        return updated;
    }

    // Balance operations
    async getBalance(id: number): Promise<Balance | undefined> {
        const [balance] = await db.select().from(balances).where(eq(balances.id, id));
        return balance;
    }

    async getBalances(filters: {
        walletId?: number;
        networkId?: number;
    }): Promise<Balance[]> {
        const all = await db.select().from(balances);
        let result = all;
        if (filters.walletId) {
            result = result.filter(b => b.walletId === filters.walletId);
        }
        if (filters.networkId) {
            result = result.filter(b => b.networkId === filters.networkId);
        }
        return result;
    }

    async createBalance(insertBalance: InsertBalance): Promise<Balance> {
        const [balance] = await db.insert(balances).values(insertBalance).returning();
        return balance;
    }

    async updateBalance(id: number, updates: Partial<InsertBalance>): Promise<Balance | undefined> {
        const [updated] = await db.update(balances).set(updates).where(eq(balances.id, id)).returning();
        return updated;
    }
}
