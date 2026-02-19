import { db } from "../db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
    marketplaceBusinesses,
    marketplaceProducts,
    marketplaceRfqs,
    marketplaceQuotes,
    marketplaceReviews,
    marketplaceConnections,
    type MarketplaceBusiness,
    type InsertMarketplaceBusiness,
    type MarketplaceProduct,
    type InsertMarketplaceProduct,
    type MarketplaceRfq,
    type InsertMarketplaceRfq,
    type MarketplaceQuote,
    type InsertMarketplaceQuote,
    type MarketplaceReview,
    type InsertMarketplaceReview,
    type MarketplaceConnection,
    type InsertMarketplaceConnection
} from "@shared/schema";

export class MarketplaceRepository {
    // Business operations
    async createMarketplaceBusiness(business: InsertMarketplaceBusiness): Promise<MarketplaceBusiness> {
        const [created] = await db.insert(marketplaceBusinesses).values(business).returning();
        return created;
    }

    async getMarketplaceBusiness(walletAddress: string): Promise<MarketplaceBusiness | undefined> {
        const [business] = await db.select().from(marketplaceBusinesses).where(eq(marketplaceBusinesses.walletAddress, walletAddress));
        return business;
    }

    // Product operations
    async createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
        const [created] = await db.insert(marketplaceProducts).values(product).returning();
        return created;
    }

    async getMarketplaceProductsByBusiness(businessId: number): Promise<MarketplaceProduct[]> {
        return await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.businessId, businessId));
    }

    // RFQ operations
    async createMarketplaceRfq(rfq: InsertMarketplaceRfq): Promise<MarketplaceRfq> {
        const [created] = await db.insert(marketplaceRfqs).values(rfq).returning();
        return created;
    }

    async getMarketplaceRfqsByBuyer(buyerWallet: string): Promise<MarketplaceRfq[]> {
        return await db.select().from(marketplaceRfqs).where(eq(marketplaceRfqs.buyerWalletAddress, buyerWallet)).orderBy(desc(marketplaceRfqs.createdAt));
    }
}
