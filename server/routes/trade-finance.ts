import { Router } from "express";
import { storage } from "../storage";
import { financialMutationLimiter } from "../middleware/rate-limiter";
import { generateURDG758Certificate } from "../lib/trade-finance-utils";

const router = Router();

// Pool stakes
router.get("/stakes", async (req, res) => {
    try {
        const stakes = await storage.getLiquidityStakes?.({}) || [];
        res.json(stakes);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch stakes" });
    }
});

// Requests
router.get("/requests", async (req, res) => {
    try {
        const requests = await storage.getAllTradeFinanceRequests?.() || [];
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch requests" });
    }
});

router.post("/requests", financialMutationLimiter, async (req, res) => {
    try {
        const request = await storage.createTradeFinanceRequest?.(req.body);
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: "Failed to create request" });
    }
});

// Certificates
router.get("/certificate/:requestId/:type", async (req, res) => {
    try {
        const { requestId, type } = req.params;
        const request = await storage.getTradeFinanceRequest?.(requestId);
        if (!request) return res.status(404).json({ message: "Request not found" });

        // In a real scenario, we'd fetch actual certificate details
        const cert = generateURDG758Certificate({
            request,
            certificateType: type as 'draft' | 'final'
        });
        res.send(cert);
    } catch (error) {
        res.status(500).json({ message: "Failed to generate certificate" });
    }
});

export default router;
