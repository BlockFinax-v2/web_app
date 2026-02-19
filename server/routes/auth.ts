import { Router } from "express";
import { storage } from "../storage";

const router = Router();

router.get("/role/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const userRole = await storage.getUserRole(walletAddress);
        if (!userRole) return res.status(404).json({ message: "User role not found" });
        res.json(userRole);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user role" });
    }
});

router.post("/role", async (req, res) => {
    try {
        const { walletAddress, role } = req.body;
        const validRoles = ['exporter', 'importer', 'financier'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role" });

        const existingRole = await storage.getUserRole(walletAddress);
        if (existingRole) {
            const updated = await storage.updateUserRole(walletAddress, { role, lastActivity: new Date(), isActive: true });
            res.json({ message: "Role updated", role: updated });
        } else {
            const created = await storage.createUserRole({ walletAddress, role, kycStatus: 'pending', isActive: true });
            res.json({ message: "Role assigned", role: created });
        }
    } catch (error) {
        res.status(500).json({ message: "Failed to assign role" });
    }
});

export default router;
