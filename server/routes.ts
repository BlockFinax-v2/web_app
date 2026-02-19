import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { requireSignature, type AuthenticatedRequest } from "./middleware/signature-auth";
import { generalApiLimiter, financialMutationLimiter, walletLimiter } from "./middleware/rate-limiter";

// Import modular routes
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import escrowRouter from "./routes/escrow";
import walletRouter from "./routes/wallet";
import tradeFinanceRouter from "./routes/trade-finance";
import marketplaceRouter from "./routes/marketplace";
import socialRouter from "./routes/social";
import insuranceRouter from "./routes/insurance";
import fxRouter from "./routes/fx";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting tiers
  app.use("/api/", generalApiLimiter);
  app.use("/api/trade-finance/", financialMutationLimiter);
  app.use("/api/hedge/", financialMutationLimiter);
  app.use("/api/financing/", financialMutationLimiter);
  app.use("/api/wallets/", walletLimiter);

  // Signature verification middleware logic...
  const signedRoutePrefixes = [
    "/api/trade-finance/",
    "/api/hedge/",
    "/api/financing/",
    "/api/escrow/"
  ];

  app.use((req, res, next) => {
    const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
    const isSensitiveRoute = signedRoutePrefixes.some(prefix => req.path.startsWith(prefix));

    if (isWriteMethod && isSensitiveRoute) {
      return requireSignature(req as AuthenticatedRequest, res, next);
    }
    next();
  });

  // Health and config
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Mount modular routes
  app.use("/api/user", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/escrow", escrowRouter);
  app.use("/api/wallets", walletRouter);
  app.use("/api/trade-finance", tradeFinanceRouter);
  app.use("/api/marketplace", marketplaceRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/insurance", insuranceRouter); // Generic container for insurance/hedge
  app.use("/api/fx", fxRouter);

  // Setup WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (message) => {
      // Basic broadcast logic for now
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });

  return httpServer;
}
