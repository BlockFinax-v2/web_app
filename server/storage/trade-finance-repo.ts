import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import {
    liquidityPoolStakes,
    tradeFinanceRequests,
    tradeFinanceVotes,
    performanceBonds,
    tradeCollateral,
    tradeFinanceDocuments,
    tradeFinanceCertificates,
    deliveryProofs,
    goodsCollateral,
    guaranteeClaims,
    claimVotes,
    guaranteeIssuanceFees,
    type LiquidityPoolStake,
    type InsertLiquidityPoolStake,
    type TradeFinanceRequest,
    type InsertTradeFinanceRequest,
    type TradeFinanceVote,
    type InsertTradeFinanceVote,
    type PerformanceBond,
    type InsertPerformanceBond,
    type TradeCollateral,
    type InsertTradeCollateral,
    type TradeFinanceDocument,
    type InsertTradeFinanceDocument,
    type TradeFinanceCertificate,
    type InsertTradeFinanceCertificate,
    type DeliveryProof,
    type InsertDeliveryProof,
    type GoodsCollateral,
    type InsertGoodsCollateral,
    type GuaranteeClaim,
    type InsertGuaranteeClaim,
    type ClaimVote,
    type InsertClaimVote,
    type GuaranteeIssuanceFee,
    type InsertGuaranteeIssuanceFee
} from "@shared/schema";

export class TradeFinanceRepository {
    // Liquidity stakes
    async createLiquidityStake(stake: InsertLiquidityPoolStake): Promise<LiquidityPoolStake> {
        const [created] = await db.insert(liquidityPoolStakes).values(stake).returning();
        return created;
    }

    async getLiquidityStakes(filters: {
        id?: number;
        stakerAddress?: string;
        status?: string;
    }): Promise<LiquidityPoolStake[]> {
        const all = await db.select().from(liquidityPoolStakes);
        let result = all;
        if (filters.id) result = result.filter(s => s.id === filters.id);
        if (filters.stakerAddress) result = result.filter(s => s.stakerAddress === filters.stakerAddress);
        if (filters.status) result = result.filter(s => s.status === filters.status);
        return result;
    }

    async updateLiquidityStake(id: number, updates: Partial<InsertLiquidityPoolStake>): Promise<LiquidityPoolStake | undefined> {
        const [updated] = await db.update(liquidityPoolStakes).set(updates).where(eq(liquidityPoolStakes.id, id)).returning();
        return updated;
    }

    // Trade finance requests
    async createTradeFinanceRequest(request: InsertTradeFinanceRequest): Promise<TradeFinanceRequest> {
        const [created] = await db.insert(tradeFinanceRequests).values(request).returning();
        return created;
    }

    async getTradeFinanceRequests(filters: {
        buyerAddress?: string;
        sellerAddress?: string;
        status?: string;
    }): Promise<TradeFinanceRequest[]> {
        const all = await db.select().from(tradeFinanceRequests).orderBy(desc(tradeFinanceRequests.createdAt));
        let result = all;
        if (filters.buyerAddress) result = result.filter(r => r.buyerAddress === filters.buyerAddress);
        if (filters.sellerAddress) result = result.filter(r => r.sellerAddress === filters.sellerAddress);
        if (filters.status) result = result.filter(r => r.status === filters.status);
        return result;
    }

    async getAllTradeFinanceRequests(): Promise<TradeFinanceRequest[]> {
        return await db.select().from(tradeFinanceRequests).orderBy(desc(tradeFinanceRequests.createdAt));
    }

    async getTradeFinanceRequest(requestId: string): Promise<TradeFinanceRequest | undefined> {
        const [request] = await db.select().from(tradeFinanceRequests).where(eq(tradeFinanceRequests.requestId, requestId));
        return request;
    }

    async updateTradeFinanceRequest(requestId: string, updates: Partial<InsertTradeFinanceRequest>): Promise<TradeFinanceRequest | undefined> {
        const [updated] = await db.update(tradeFinanceRequests).set(updates).where(eq(tradeFinanceRequests.requestId, requestId)).returning();
        return updated;
    }

    // Pool statistics
    async getPoolStatistics(): Promise<{
        totalStaked: string;
        totalLPs: number;
        activeRequests: number;
        totalFinanced: string;
    }> {
        const stakes = await db.select().from(liquidityPoolStakes).where(eq(liquidityPoolStakes.status, "active"));
        const requests = await db.select().from(tradeFinanceRequests).where(eq(tradeFinanceRequests.status, "approved"));

        const totalStaked = stakes.reduce((sum, s) => sum + parseFloat(s.amount), 0).toString();
        const totalLPs = new Set(stakes.map(s => s.stakerAddress)).size;
        const activeRequests = requests.length;
        const totalFinanced = requests.reduce((sum, r) => sum + parseFloat(r.requestedAmount), 0).toString();

        return { totalStaked, totalLPs, activeRequests, totalFinanced };
    }

    // Certificates
    async createCertificate(certificate: InsertTradeFinanceCertificate): Promise<TradeFinanceCertificate> {
        const [created] = await db.insert(tradeFinanceCertificates).values(certificate).returning();
        return created;
    }

    async getCertificatesByRequestId(requestId: string): Promise<TradeFinanceCertificate[]> {
        return await db.select().from(tradeFinanceCertificates).where(eq(tradeFinanceCertificates.requestId, requestId));
    }

    async getActiveCertificate(requestId: string, type: string): Promise<TradeFinanceCertificate | undefined> {
        const [cert] = await db.select()
            .from(tradeFinanceCertificates)
            .where(and(
                eq(tradeFinanceCertificates.requestId, requestId),
                eq(tradeFinanceCertificates.certificateType, type)
            ));
        return cert;
    }
}
