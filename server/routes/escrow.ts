import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/stats", async (req, res) => {
    try {
        const stats = await storage.getEscrowStats?.() || {};
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch escrow stats" });
    }
});

router.get("/escrows", async (req, res) => {
    try {
        const escrows = await storage.getAllEscrows?.() || [];
        res.json(escrows);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch escrows" });
    }
});

export default router;
