import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Contacts
router.get("/contacts", async (req, res) => {
    try {
        const { ownerAddress } = req.query;
        const contacts = await storage.getContacts?.(ownerAddress as string) || [];
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch contacts" });
    }
});

// Referrals
router.get("/referrals/stats", async (req, res) => {
    try {
        const referrals = await storage.getAllReferrals?.() || [];
        res.json({ total: referrals.length });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch referral stats" });
    }
});

// Points
router.get("/points/:walletAddress", async (req, res) => {
    try {
        const points = await storage.getUserPoints?.(req.params.walletAddress);
        res.json(points || { totalPoints: 0 });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch points" });
    }
});

export default router;
