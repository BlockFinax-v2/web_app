import { Router } from "express";
import { storage } from "../storage";
import { walletLimiter } from "../middleware/rate-limiter";

const router = Router();

// Wallet management
router.get("/", walletLimiter, async (req, res) => {
    try {
        const wallets = await storage.getAllWallets();
        res.json(wallets);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch wallets" });
    }
});

router.post("/", walletLimiter, async (req, res) => {
    try {
        const wallet = await storage.createWallet(req.body);
        res.json(wallet);
    } catch (error) {
        res.status(500).json({ message: "Failed to create wallet" });
    }
});

// Networks
router.get("/networks", async (req, res) => {
    try {
        const networks = await storage.getAllNetworks();
        res.json(networks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch networks" });
    }
});

// Transactions
router.get("/transactions", async (req, res) => {
    try {
        const { walletId, networkId, status, limit } = req.query;
        const transactions = await storage.getTransactions({
            walletId: walletId ? parseInt(walletId as string) : undefined,
            networkId: networkId ? parseInt(networkId as string) : undefined,
            status: status as string,
            limit: limit ? parseInt(limit as string) : undefined,
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
});

// Balances
router.get("/balances", async (req, res) => {
    try {
        const { walletId, networkId } = req.query;
        const balances = await storage.getBalances({
            walletId: walletId ? parseInt(walletId as string) : undefined,
            networkId: networkId ? parseInt(networkId as string) : undefined,
        });
        res.json(balances);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch balances" });
    }
});

export default router;
