import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/businesses", async (req, res) => {
    try {
        const businesses = await storage.searchMarketplaceBusinesses?.({}) || [];
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch businesses" });
    }
});

router.get("/products", async (req, res) => {
    try {
        const products = await storage.searchMarketplaceProducts?.({}) || [];
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

router.post("/rfqs", async (req, res) => {
    try {
        const rfq = await storage.createMarketplaceRfq?.(req.body);
        res.json(rfq);
    } catch (error) {
        res.status(500).json({ message: "Failed to create RFQ" });
    }
});

export default router;
