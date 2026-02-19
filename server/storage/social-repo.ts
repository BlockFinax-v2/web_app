import { db } from "../db";
import { eq, desc, and, or } from "drizzle-orm";
import {
    messages,
    contacts,
    notifications,
    referralCodes,
    referrals,
    userPoints,
    pointTransactions,
    type Message,
    type InsertMessage,
    type Contact,
    type InsertContact,
    type Notification,
    type InsertNotification,
    type ReferralCode,
    type InsertReferralCode,
    type Referral,
    type InsertReferral,
    type UserPoints,
    type InsertUserPoints,
    type PointTransaction,
    type InsertPointTransaction
} from "@shared/schema";

export class SocialRepository {
    // Contact operations
    async getContacts(ownerWalletAddress: string): Promise<Contact[]> {
        return await db.select().from(contacts).where(eq(contacts.ownerWalletAddress, ownerWalletAddress));
    }

    async createContact(contact: InsertContact): Promise<Contact> {
        const [created] = await db.insert(contacts).values(contact).returning();
        return created;
    }

    // Notification operations
    async createNotification(notification: InsertNotification): Promise<Notification> {
        const [created] = await db.insert(notifications).values(notification).returning();
        return created;
    }

    async getNotifications(recipientAddress: string): Promise<Notification[]> {
        return await db.select().from(notifications)
            .where(eq(notifications.recipientAddress, recipientAddress))
            .orderBy(desc(notifications.createdAt));
    }

    async markNotificationAsRead(id: number): Promise<Notification | undefined> {
        const [updated] = await db.update(notifications)
            .set({ read: true })
            .where(eq(notifications.id, id))
            .returning();
        return updated;
    }

    // Referral operations
    async createReferralCode(code: InsertReferralCode): Promise<ReferralCode> {
        const [created] = await db.insert(referralCodes).values(code).returning();
        return created;
    }

    async getReferralCode(code: string): Promise<ReferralCode | undefined> {
        const [referralCode] = await db.select().from(referralCodes).where(eq(referralCodes.code, code));
        return referralCode;
    }

    // User Points operations
    async getUserPoints(walletAddress: string): Promise<UserPoints | undefined> {
        const [points] = await db.select().from(userPoints).where(eq(userPoints.walletAddress, walletAddress));
        return points;
    }

    async updateUserPoints(walletAddress: string, points: number): Promise<UserPoints | undefined> {
        const existing = await this.getUserPoints(walletAddress);
        if (!existing) return undefined;
        const [updated] = await db.update(userPoints)
            .set({ totalPoints: (existing.totalPoints || 0) + points, lastUpdated: new Date() })
            .where(eq(userPoints.walletAddress, walletAddress))
            .returning();
        return updated;
    }
}
