import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/stats", async (req, res) => {
    try {
        const stats = await storage.getEscrowStats?.() || {}; // Using escrow stats as a base
        res.json({
            ...stats,
            totalUsers: 45, // Mocked for now to match routes.ts
            platformRevenue: "2,150.00"
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admin stats" });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await storage.getAllUserRoles?.() || [];
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

router.get("/health", async (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default router;
