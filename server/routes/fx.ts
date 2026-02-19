import { Router } from "express";
import { fetchAllRates } from "../fx-oracle";

const router = Router();

router.get("/rates", async (req, res) => {
    try {
        const rates = await fetchAllRates();
        res.json(rates);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch rates" });
    }
});

export default router;
