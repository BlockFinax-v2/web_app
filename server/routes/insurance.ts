import { Router } from "express";
import { storage } from "../storage";
import { financialMutationLimiter } from "../middleware/rate-limiter";

const router = Router();

// Hedge routes
router.get("/hedge/events", async (req, res) => {
    try {
        const events = await storage.getOpenHedgeEvents?.() || [];
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch hedge events" });
    }
});

router.post("/hedge/positions", financialMutationLimiter, async (req, res) => {
    try {
        const position = await storage.createHedgePosition?.(req.body);
        res.json(position);
    } catch (error) {
        res.status(500).json({ message: "Failed to create position" });
    }
});

// Financing rates/offers
router.get("/financing/offers/:requestId", async (req, res) => {
    try {
        const offers = await storage.getFinancingOffersByRequest?.(req.params.requestId) || [];
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch offers" });
    }
});

export default router;
