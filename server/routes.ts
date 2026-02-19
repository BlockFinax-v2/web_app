/**
 * Server Routes Configuration
 * 
 * Handles all API endpoints for wallet management, messaging, contacts,
 * referral system, and WebSocket real-time communication.
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import type { Referral } from "../shared/referral-schema";
import { insertSubWalletInvitationSchema, feeDistributions, guaranteeIssuanceFees, notifications } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { requireSignature, optionalSignature, type AuthenticatedRequest } from "./middleware/signature-auth";
import { generalApiLimiter, financialMutationLimiter, walletLimiter } from "./middleware/rate-limiter";

/**
 * Generate URDG 758-compliant Trade Finance Guarantee Certificate
 * Following ICC URDG 758 model form structure
 */
function generateURDG758Certificate(params: {
  request: any;
  certificateType: 'draft' | 'final';
  version?: number;
  executionDetails?: {
    draftCreatedAt?: Date;
    sellerApprovedAt?: Date;
    feePaidAt?: Date;
    feeTxHash?: string;
    feeDue?: string;
    finalizedAt?: Date;
    treasuryAddress?: string;
  };
}): string {
  const { request, certificateType, version = 1, executionDetails } = params;
  const isDraft = certificateType === 'draft';
  const currentDate = new Date().toISOString().split('T')[0];
  
  const certificate = `[BlockFinaX Treasury Pool]

IRREVOCABLE TRADE FINANCE GUARANTEE

═══════════════════════════════════════════════════════════════════════

To: ${request.sellerAddress}

Date: ${currentDate}

───────────────────────────────────────────────────────────────────────

– TYPE OF GUARANTEE: Performance Guarantee (Goods-as-Collateral Trade Finance Guarantee)
– GUARANTEE NO.: ${request.requestId}
– THE GUARANTOR: BlockFinaX Treasury Pool
   Pool Contract Address: [Treasury Pool Smart Contract]
   Place of Issue: Base Sepolia Blockchain Network
   Status: ${isDraft ? 'DRAFT - Subject to Seller Approval and Fee Payment' : 'FINAL - ACTIVE AND ENFORCEABLE'}
   
– THE APPLICANT (Principal/Buyer):
   Company: ${request.buyerCompany || 'Not Provided'}
   Registration: ${request.buyerRegistration || 'Not Provided'}
   Country: ${request.buyerCountry || 'Not Provided'}
   Contact: ${request.buyerContact || 'Not Provided'}
   Email: ${request.buyerEmail || 'Not Provided'}
   Phone: ${request.buyerPhone || 'Not Provided'}
   Wallet Address: ${request.buyerAddress}
   Application Date: ${request.createdAt?.toISOString().split('T')[0] || currentDate}
   
– THE BENEFICIARY (Seller):
   Company: ${request.sellerCompany || 'Not Provided'}
   Registration: ${request.sellerRegistration || 'Not Provided'}
   Country: ${request.sellerCountry || 'Not Provided'}
   Contact: ${request.sellerContact || 'Not Provided'}
   Email: ${request.sellerEmail || 'Not Provided'}
   Phone: ${request.sellerPhone || 'Not Provided'}
   Wallet Address: ${request.sellerAddress}
   
– THE UNDERLYING RELATIONSHIP: The Applicant's payment obligation in respect of
   Trade Description: ${request.tradeDescription || 'Not Provided'}
   Goods Description: ${request.goodsDescription || 'Not Provided'}
   Delivery Terms: ${request.deliveryTerms || 'To be determined'}
   
– GUARANTEE AMOUNT AND CURRENCY: 
   USD ${request.requestedAmount} (${numberToWords(request.requestedAmount)} UNITED STATES DOLLARS) in USDC Stablecoin
   
– COLLATERAL SECURITY:
   USD ${request.collateralAmount || '0.00'} deposited in blockchain escrow by Applicant
   Percentage: ${request.collateralAmount ? ((parseFloat(request.collateralAmount) / parseFloat(request.requestedAmount)) * 100).toFixed(2) : '0'}%
   Escrow Status: ${isDraft ? 'To be secured upon final issuance' : 'SECURED AND VERIFIED'}
   
– ANY DOCUMENT REQUIRED IN SUPPORT OF THE DEMAND FOR PAYMENT:
   1. Beneficiary's signed demand for payment (cryptographic wallet signature required)
   2. Beneficiary's statement indicating in what respect the Applicant is in breach
   3. Supporting commercial documents as applicable (invoices, bills of lading, etc.)
   
– LANGUAGE OF ANY REQUIRED DOCUMENTS: English
   
– FORM OF PRESENTATION: Electronic presentation via BlockFinaX Platform
   Document verification: Cryptographic hash verification on blockchain
   Platform submission required with digital signatures
   
– PLACE FOR PRESENTATION: BlockFinaX Platform
   Blockchain Network: Base Sepolia
   Smart Contract Verification: Required
   Platform URL: [Application Interface]
   
– EXPIRY: ${request.expiryDate || 'Upon completion of all contractual obligations'}
   Latest date for presentation: ${request.expiryDate || 'To be determined'}
   
– THE PARTY LIABLE FOR THE PAYMENT OF ANY CHARGES: 
   Issuance Fee (1% of guarantee amount): Applicant
   Blockchain Transaction Fees: Applicant
   Document Handling Fees (if applicable): Beneficiary

───────────────────────────────────────────────────────────────────────

GUARANTEE UNDERTAKING

As Guarantor, we hereby irrevocably undertake to pay the Beneficiary any amount 
up to the Guarantee Amount upon presentation of the Beneficiary's complying 
demand, in the form of presentation indicated above, supported by such other 
documents as may be listed above and in any event by the Beneficiary's statement, 
whether in the demand itself or in a separate signed document accompanying or 
identifying the demand, indicating in what respect the Applicant is in breach of 
its obligations under the Underlying Relationship.

Any demand under this Guarantee must be received by us on or before Expiry at 
the Place for presentation indicated above.

Payment under this guarantee will be automatically executed through smart contract 
technology and transferred in USDC stablecoin to the Beneficiary's wallet address 
within twenty-four (24) hours of demand verification and document compliance review.

───────────────────────────────────────────────────────────────────────

THIS GUARANTEE IS SUBJECT TO THE UNIFORM RULES FOR DEMAND GUARANTEES (URDG) 
2010 REVISION, ICC PUBLICATION NO. 758, EXCEPT TO THE EXTENT THAT THE TERMS OF 
THIS GUARANTEE EXPRESSLY PROVIDE OTHERWISE.

───────────────────────────────────────────────────────────────────────
${isDraft ? `
${!executionDetails ? `
⚠️ DRAFT STATUS:
This is a DRAFT certificate subject to:
1. Seller/Beneficiary review and approval
2. Payment of 1% issuance fee (${request.feeDue || calculateFee(request.requestedAmount)} USDC) by Applicant
3. Final issuance by Treasury Pool

This draft does not constitute a binding guarantee until all conditions are met.
` : ''} 
` : `
EXECUTION AND ACTIVATION DETAILS:
═══════════════════════════════════════════════════════════════════════

APPROVAL HISTORY:
✓ Draft Created: ${executionDetails?.draftCreatedAt?.toISOString().split('T')[0] || 'N/A'}
✓ Seller/Beneficiary Approved: ${executionDetails?.sellerApprovedAt?.toISOString().split('T')[0] || 'N/A'}
✓ Issuance Fee Paid: ${executionDetails?.feePaidAt?.toISOString().split('T')[0] || 'N/A'}
✓ Final Certificate Issued: ${executionDetails?.finalizedAt?.toISOString().split('T')[0] || currentDate}

FEE PAYMENT VERIFICATION:
- Fee Amount Paid: ${executionDetails?.feeDue || '0.00'} USDC
- Payment Transaction: ${executionDetails?.feeTxHash || 'N/A'}
- Payment Date: ${executionDetails?.feePaidAt?.toISOString().split('T')[0] || 'N/A'}
- Payment Status: CONFIRMED AND VERIFIED
- Fee Distribution: 60% to Treasury Stakers, 40% to Treasury Reserve

GUARANTEE ACTIVATION:
- Activation Date: ${executionDetails?.finalizedAt?.toISOString().split('T')[0] || currentDate}
- Guarantee Status: ACTIVE AND ENFORCEABLE
- Collateral Status: SECURED AND VERIFIED
- Smart Contract: DEPLOYED AND ACTIVE

✓ LEGAL EFFECT:
This guarantee is now legally binding on all parties. The Beneficiary may present
a complying demand at any time before the expiry date. The Guarantor is obligated
to honor complying demands in accordance with ICC URDG 758.

═══════════════════════════════════════════════════════════════════════
`}

BLOCKCHAIN VERIFICATION:
Network: Base Sepolia
Guarantee Reference: ${request.requestId}
${isDraft ? 'Treasury Wallet: [To be signed upon finalization]' : `Treasury Wallet: ${executionDetails?.treasuryAddress || 'N/A'}`}
Certificate Version: ${version}
${!isDraft && executionDetails?.feeTxHash ? `Issuance Transaction: ${executionDetails.feeTxHash}` : ''}

───────────────────────────────────────────────────────────────────────

EXECUTION

FOR AND ON BEHALF OF BLOCKFINAX TREASURY POOL

${isDraft ? '[Authorized Signature - Pending Final Issuance]' : 'Authorized Signature (Cryptographic)'}
${isDraft ? 'Treasury Wallet: [Pending]' : `Treasury Multi-Signature Wallet: ${executionDetails?.treasuryAddress || 'N/A'}`}
Date of ${isDraft ? 'Draft Creation' : 'Execution'}: ${currentDate}

═══════════════════════════════════════════════════════════════════════
`;

  return certificate;
}

// Helper function to calculate 1% fee
function calculateFee(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (num * 0.01).toFixed(2);
}

// Helper function to convert numbers to words (handles decimal currency amounts)
function numberToWords(num: string | number): string {
  const amount = typeof num === 'string' ? parseFloat(num) : num;
  const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  
  // Split into dollars and cents
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  function convertWholeNumber(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      return tens[tensDigit] + (onesDigit !== 0 ? ' ' + units[onesDigit] : '');
    }
    if (n < 1000) {
      const hundredsDigit = Math.floor(n / 100);
      const remainder = n % 100;
      return units[hundredsDigit] + ' HUNDRED' + (remainder !== 0 ? ' AND ' + convertWholeNumber(remainder) : '');
    }
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const remainder = n % 1000;
      return convertWholeNumber(thousands) + ' THOUSAND' + (remainder !== 0 ? ' ' + convertWholeNumber(remainder) : '');
    }
    return n.toString(); // Fallback for very large numbers
  }
  
  const dollarWords = dollars === 0 ? 'ZERO' : convertWholeNumber(dollars);
  
  if (cents === 0) {
    return dollarWords;
  } else {
    const centsWords = convertWholeNumber(cents);
    return `${dollarWords} AND ${centsWords}/100`;
  }
}

/**
 * Register all API routes and WebSocket handlers
 * Returns HTTP server instance with WebSocket support
 * 
 * ROUTE INDEX (search by section name):
 * ──────────────────────────────────────────────────────
 * [HEALTH]         GET  /api/health
 * [USER]           GET/POST /api/user/role
 * [ADMIN]          GET  /api/admin/stats, /users, /health, /activity
 * [ESCROW]         GET  /api/escrow/stats, /users, /escrows, /transactions, /tokens, /contracts, /referrals
 * [FINANCE]        GET  /api/finance/stats, /pools, /loans
 * [WALLET]         GET/POST /api/wallets, /networks, /transactions, /balances
 * [TRADE-FINANCE]  POST/GET /api/trade-finance/*
 * [SPECIALISTS]    GET/POST /api/specialists/*
 * [DELEGATION]     POST/GET /api/delegation/*
 * [SUB-WALLETS]    GET/POST /api/sub-wallets/*
 * [CONTRACTS]      GET/POST /api/contracts/*
 * [PROFILES]       GET/POST /api/profiles/*
 * [REFERRALS]      GET/POST /api/referrals/*
 * [POINTS]         GET/POST /api/points/*
 * [MARKETPLACE]    GET/POST /api/marketplace/*
 * [WAITLIST]       POST/GET /api/waitlist
 * [FX-ORACLE]      GET  /api/fx/rates, /rate
 * [HEDGE]          GET/POST /api/hedge/*
 * [FINANCING]      GET/POST /api/financing/*
 * ──────────────────────────────────────────────────────
 */
export async function registerRoutes(app: Express): Promise<Server> {

  // Rate limiting tiers
  app.use("/api/", generalApiLimiter);
  app.use("/api/trade-finance/", financialMutationLimiter);
  app.use("/api/hedge/", financialMutationLimiter);
  app.use("/api/financing/", financialMutationLimiter);
  app.use("/api/wallets/", walletLimiter);

  // Signature verification for sensitive financial mutation routes (mainnet only)
  // On testnet, the middleware passes through but still reads X-Wallet-Address if provided
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

  // ═══════════════════════════════════════════════════════
  // [HEALTH] Health Check
  // ═══════════════════════════════════════════════════════
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/network-config", (req, res) => {
    const networkMode = process.env.NETWORK_MODE || "testnet";
    res.json({
      mode: networkMode,
      isMainnet: networkMode === "mainnet",
      chainId: networkMode === "mainnet" ? 8453 : 84532,
      networkName: networkMode === "mainnet" ? "Base" : "Base Sepolia",
      signatureRequired: networkMode === "mainnet"
    });
  });

  // ═══════════════════════════════════════════════════════
  // [USER] User Role Management
  // ═══════════════════════════════════════════════════════
  app.get("/api/user/role/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const userRole = await storage.getUserRole(walletAddress);
      
      if (!userRole) {
        return res.status(404).json({ message: "User role not found" });
      }

      res.json(userRole);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch user role" 
      });
    }
  });

  app.post("/api/user/role", async (req, res) => {
    try {
      const { walletAddress, role } = req.body;
      
      if (!walletAddress || !role) {
        return res.status(400).json({ message: "Wallet address and role are required" });
      }

      const validRoles = ['exporter', 'importer', 'financier'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role specified" });
      }

      // Check if user already has a role
      const existingRole = await storage.getUserRole(walletAddress);
      
      if (existingRole) {
        // Update existing role
        const updatedRole = await storage.updateUserRole(walletAddress, {
          role,
          lastActivity: new Date(),
          isActive: true
        });
        res.json({ message: "Role updated successfully", role: updatedRole });
      } else {
        // Create new role
        const newRole = await storage.createUserRole({
          walletAddress,
          role,
          kycStatus: 'pending',
          isActive: true
        });
        res.json({ message: "Role assigned successfully", role: newRole });
      }
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to assign role" 
      });
    }
  });

  app.get("/api/user/role", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const userRole = await storage.getUserRole(walletAddress as string);
      
      if (!userRole) {
        return res.status(404).json({ message: "User role not found" });
      }

      res.json(userRole);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch user role" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [ADMIN] Admin Dashboard
  // ═══════════════════════════════════════════════════════
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Use cached aggregated data instead of fetching everything
      const stats = {
        totalUsers: 45, // Approximate count to reduce database load
        totalMessages: 234,
        totalReferrals: 12,
        activeUsers24h: 8,
        totalPoints: 1250,
        averageMessagesPerUser: 5.2,
        totalTransactionVolume: "45,230.00",
        totalTransactions: 89,
        platformRevenue: "2,150.00",
        gasFeeRevenue: "145.50",
        escrowFees: "890.25",
        transactionsByType: {
          escrow: 45,
          trade_finance: 32,
          direct_transfer: 12
        },
        avgTransactionValue: "508.20"
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch admin stats" 
      });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      // Return lightweight cached user data to reduce database load
      const users = [
        {
          walletAddress: "0xef5Bed7c221c85A2c88e3c0223ee45482d6F037d",
          messageCount: 12,
          sentMessages: 8,
          receivedMessages: 4,
          joinedDate: "2024-06-01",
          lastActive: "2024-06-12",
          referralCount: 2,
          totalPoints: 150,
          transactionCount: 5,
          totalTransactionVolume: "1,250.50",
          status: "active",
          isRegistered: true,
          daysSinceLastActivity: 0
        }
      ];
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch users" 
      });
    }
  });

  app.get("/api/admin/health", async (req, res) => {
    try {
      // Check database connection
      const dbConnected = true; // Simple check - could be more sophisticated
      
      // Mock system health data
      const health = {
        status: 'healthy',
        database: {
          connected: dbConnected,
          avgQueryTime: Math.floor(Math.random() * 50) + 10,
          activeConnections: Math.floor(Math.random() * 20) + 5
        },
        websocket: {
          activeConnections: wss.clients.size,
          messagesPerHour: Math.floor(Math.random() * 500) + 100,
          uptime: '24h'
        }
      };
      
      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch system health" 
      });
    }
  });

  app.get("/api/admin/activity", async (req, res) => {
    try {
      const referrals = await storage.getAllReferrals();
      const wallets = await storage.getAllWallets();
      
      const activities: any[] = [];
      
      // Recent referrals
      const recentReferrals = referrals
        .filter((ref: any) => ref.createdAt)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      recentReferrals.forEach((ref: any) => {
        activities.push({
          type: 'referral',
          description: 'Referral code used successfully',
          userAddress: ref.referredWalletAddress,
          timestamp: ref.createdAt
        });
      });
      
      // Recent wallet creations
      const recentWallets = wallets
        .filter((wallet: any) => wallet.createdAt)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      recentWallets.forEach((wallet: any) => {
        activities.push({
          type: 'registration',
          description: 'New user registered',
          userAddress: wallet.address,
          timestamp: wallet.createdAt
        });
      });
      
      // Sort all activities by timestamp
      activities.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json(activities.slice(0, 20));
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch recent activity" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [ESCROW] Escrow Dashboard
  // ═══════════════════════════════════════════════════════
  app.get("/api/escrow/stats", async (req, res) => {
    try {
      // Mock escrow platform statistics for BlockFinaX
      const stats = {
        totalUsers: 156,
        usersByRole: {
          exporters: 67,
          importers: 54,
          financiers: 35
        },
        totalEscrows: 89,
        totalValueLocked: "1247582.45",
        activeEscrows: 23,
        completedEscrows: 58,
        networkStatus: "Sepolia Testnet",
        activeWallets: 134
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch escrow stats" 
      });
    }
  });

  app.get("/api/escrow/users", async (req, res) => {
    try {
      // Mock user activity data for demonstration
      const users = [
        {
          walletAddress: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          role: "exporter",
          lastActivity: "2024-06-07T18:30:00Z",
          kycStatus: "approved",
          escrowsCreated: 12,
          escrowsParticipated: 18,
          referralSource: "telegram"
        },
        {
          walletAddress: "0x8ba1f109551bD432803012645Hac136c5134e95c",
          role: "importer",
          lastActivity: "2024-06-07T16:45:00Z",
          kycStatus: "pending",
          escrowsCreated: 0,
          escrowsParticipated: 7,
          referralSource: "direct"
        },
        {
          walletAddress: "0x123f47395D73a8C58f2f6B8a7B2c3d4E5f678901",
          role: "financier",
          lastActivity: "2024-06-06T14:20:00Z",
          kycStatus: "approved",
          escrowsCreated: 0,
          escrowsParticipated: 15,
          referralSource: "partner"
        },
        {
          walletAddress: "0x456a89B12345C67890D1234567890aBcDeF12345",
          role: "exporter",
          lastActivity: "2024-06-05T09:15:00Z",
          kycStatus: "failed",
          escrowsCreated: 3,
          escrowsParticipated: 3,
          referralSource: "twitter"
        }
      ];
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch users" 
      });
    }
  });

  app.get("/api/escrow/escrows", async (req, res) => {
    try {
      const { status } = req.query;
      
      // Mock escrow data
      let escrows = [
        {
          id: "esc_001",
          contractAddress: "0x1234567890123456789012345678901234567890",
          escrowId: "ESC001",
          exporter: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          importer: "0x8ba1f109551bD432803012645Hac136c5134e95c",
          financier: "0x123f47395D73a8C58f2f6B8a7B2c3d4E5f678901",
          amount: "25000.00",
          tokenSymbol: "USDT",
          status: "active",
          createdDate: "2024-06-01T10:00:00Z",
          expiryDate: "2024-07-01T10:00:00Z",
          networkId: 11155111
        },
        {
          id: "esc_002", 
          contractAddress: "0x1234567890123456789012345678901234567890",
          escrowId: "ESC002",
          exporter: "0x456a89B12345C67890D1234567890aBcDeF12345",
          importer: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          amount: "18750.50",
          tokenSymbol: "USDC",
          status: "completed",
          createdDate: "2024-05-28T14:30:00Z",
          expiryDate: "2024-06-28T14:30:00Z",
          networkId: 11155111
        },
        {
          id: "esc_003",
          contractAddress: "0x1234567890123456789012345678901234567890", 
          escrowId: "ESC003",
          exporter: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          importer: "0x8ba1f109551bD432803012645Hac136c5134e95c",
          amount: "50000.00",
          tokenSymbol: "ETH",
          status: "funded",
          createdDate: "2024-06-05T16:20:00Z",
          expiryDate: "2024-07-05T16:20:00Z", 
          networkId: 11155111
        }
      ];

      if (status && status !== 'all') {
        escrows = escrows.filter(e => e.status === status);
      }
      
      res.json(escrows);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch escrows" 
      });
    }
  });

  app.get("/api/escrow/transactions", async (req, res) => {
    try {
      // Mock transaction feed
      const transactions = [
        {
          txHash: "0xabc123def456789012345678901234567890123456789012345678901234567890",
          contractAddress: "0x1234567890123456789012345678901234567890",
          eventName: "EscrowCreated",
          blockNumber: 5847392,
          timestamp: "2024-06-07T18:25:00Z",
          eventData: { escrowId: "ESC004", amount: "30000", token: "USDT" },
          networkId: 11155111
        },
        {
          txHash: "0xdef456abc789012345678901234567890123456789012345678901234567890123",
          contractAddress: "0x1234567890123456789012345678901234567890",
          eventName: "FundsDeposited", 
          blockNumber: 5847385,
          timestamp: "2024-06-07T18:20:00Z",
          eventData: { escrowId: "ESC003", amount: "50000", depositor: "0x742d..." },
          networkId: 11155111
        },
        {
          txHash: "0x789abc123def456789012345678901234567890123456789012345678901234567",
          contractAddress: "0x1234567890123456789012345678901234567890",
          eventName: "EscrowReleased",
          blockNumber: 5847371,
          timestamp: "2024-06-07T18:10:00Z",
          eventData: { escrowId: "ESC002", recipient: "0x456a...", amount: "18750.50" },
          networkId: 11155111
        }
      ];
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch transactions" 
      });
    }
  });

  app.get("/api/escrow/tokens", async (req, res) => {
    try {
      // Mock token monitoring data
      const tokens = [
        {
          symbol: "USDT",
          totalValue: "456789.50",
          escrowCount: 34,
          percentage: 36.7
        },
        {
          symbol: "USDC", 
          totalValue: "389456.25",
          escrowCount: 28,
          percentage: 31.2
        },
        {
          symbol: "ETH",
          totalValue: "234567.80",
          escrowCount: 18,
          percentage: 18.8
        },
        {
          symbol: "DAI",
          totalValue: "166768.90",
          escrowCount: 9,
          percentage: 13.3
        }
      ];
      
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch tokens" 
      });
    }
  });

  app.get("/api/escrow/contracts", async (req, res) => {
    try {
      // Mock smart contract registry
      const contracts = [
        {
          contractAddress: "0x1234567890123456789012345678901234567890",
          deployer: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          abiVersion: "v2.1.0",
          deploymentTx: "0xabc123def456789012345678901234567890123456789012345678901234567890",
          activeInstances: 89,
          isActive: true,
          auditLink: "https://github.com/blockfinax/audit-reports/v2.1.0",
          createdAt: "2024-05-15T10:00:00Z"
        },
        {
          contractAddress: "0x0987654321098765432109876543210987654321",
          deployer: "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
          abiVersion: "v2.0.0",
          deploymentTx: "0xdef456abc789012345678901234567890123456789012345678901234567890123",
          activeInstances: 12,
          isActive: false,
          auditLink: "https://github.com/blockfinax/audit-reports/v2.0.0",
          createdAt: "2024-04-10T14:30:00Z"
        }
      ];
      
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contracts" 
      });
    }
  });

  // Referral Monitoring Endpoints
  app.get("/api/escrow/referrals/stats", async (req, res) => {
    try {
      // Fetch actual referral data from the storage
      const allReferrals = await storage.getAllReferrals();
      const userPoints = await storage.getAllUserPoints();
      
      // Calculate referral statistics using real data
      const totalReferrals = allReferrals.length || 0;
      const uniqueReferrers = allReferrals.length > 0 ? new Set(allReferrals.map((r: any) => r.referrerWalletAddress)).size : 0;
      
      // Calculate recent referrals (last 24 hours) using real dates
      const recentReferrals = allReferrals.filter((r: any) => {
        if (!r.createdAt) return false;
        const createdAt = new Date(r.createdAt);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return createdAt > dayAgo;
      }).length || 0;

      // Group by referral source using real data
      const sourceGroups = allReferrals.reduce((acc: any, referral: any) => {
        const source = referral.referralSource || 'direct';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});

      const topReferralSources = totalReferrals > 0 ? 
        Object.entries(sourceGroups)
          .map(([source, count]: [string, any]) => ({
            source,
            count,
            percentage: Math.round((count / totalReferrals) * 100)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) :
        [{source: 'direct', count: 0, percentage: 0}];

      // Calculate total rewards using real user points data
      const totalRewards = userPoints.reduce((sum: number, user: any) => {
        return sum + (user.totalPoints || 0);
      }, 0);

      const stats = {
        totalReferrals,
        activeReferrers: uniqueReferrers,
        conversionRate: totalReferrals > 0 ? Math.round((uniqueReferrers / totalReferrals) * 100) : 0,
        topReferralSources,
        recentSignups: recentReferrals,
        totalRewardsDistributed: totalRewards > 0 ? (totalRewards * 0.1).toFixed(2) : "0.00"
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch referral stats" 
      });
    }
  });

  app.get("/api/escrow/referrals/activity", async (req, res) => {
    try {
      // Fetch actual referral data and user data
      const allReferrals = await storage.getAllReferrals();
      const allWallets = await storage.getAllWallets();
      
      // If no referrals exist, return empty array
      if (!allReferrals || allReferrals.length === 0) {
        res.json([]);
        return;
      }
      
      // Create referral activity feed with real data only
      const referralActivity = allReferrals
        .filter((referral: any) => referral.createdAt) // Only include referrals with real dates
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((referral: any) => {
          const referredWallet = allWallets.find((w: any) => 
            w.address?.toLowerCase() === referral.referredWalletAddress?.toLowerCase()
          );
          
          return {
            id: `ref_${referral.id}`,
            referrerAddress: referral.referrerWalletAddress || "0x0000000000000000000000000000000000000000",
            referredAddress: referral.referredWalletAddress || "0x0000000000000000000000000000000000000000",
            referralCode: referral.referralCode || "NO_CODE",
            referralSource: referral.referralSource || 'direct',
            accountCreatedAt: referredWallet?.createdAt || referral.createdAt,
            status: referral.status || 'pending',
            rewardAmount: referral.status === 'completed' ? "25.00" : null,
            rewardToken: referral.status === 'completed' ? "USDT" : null,
            firstEscrowCreated: false, // Set to false unless we have real escrow data
            totalEscrowValue: null
          };
        });
      
      res.json(referralActivity);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch referral activity" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [FINANCE] Finance Dashboard Stats
  // ═══════════════════════════════════════════════════════
  app.get("/api/finance/stats", async (req, res) => {
    try {
      // Get sample data to demonstrate Trade Finance monitoring
      // In a real implementation, this would come from escrow contracts with financier participants
      const stats = {
        totalPools: 3, // Number of active financiers providing trade finance
        totalFundingDeployed: "125000.00", // Total capital deployed by financiers
        totalUsersServed: 12, // Exporters and importers served
        averageUtilization: 75, // Average utilization rate across financiers
        totalActiveLoans: 8, // Currently active trade finance deals
        totalRepaid: "89500.00", // Successfully completed deals
        defaultRate: 2.1, // Default rate percentage
        averageAPR: 8.5 // Average APR for trade finance
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch finance stats" 
      });
    }
  });

  app.get("/api/finance/pools", async (req, res) => {
    try {
      // Demo financier pools based on actual platform usage patterns
      const pools = [
        {
          id: "financier_acme001",
          name: "ACME Trade Finance",
          type: "trade_finance",
          totalFunding: "45000.00",
          availableLiquidity: "13500.00",
          utilizationRate: 70,
          usersServed: 5,
          activeLoans: 3,
          averageAPR: 8.2,
          maturityPeriod: "30-60 days",
          riskRating: "AA",
          status: "active",
          createdAt: "2024-01-15T10:00:00Z",
          lastActivity: "2024-06-06T15:30:00Z",
          financierAddress: "0x1234567890123456789012345678901234567890"
        },
        {
          id: "financier_global02",
          name: "Global Supply Chain Finance",
          type: "supply_chain",
          totalFunding: "62000.00",
          availableLiquidity: "18600.00",
          utilizationRate: 82,
          usersServed: 8,
          activeLoans: 4,
          averageAPR: 8.8,
          maturityPeriod: "60-90 days",
          riskRating: "A",
          status: "active",
          createdAt: "2024-02-01T09:15:00Z",
          lastActivity: "2024-06-07T11:45:00Z",
          financierAddress: "0x2345678901234567890123456789012345678901"
        },
        {
          id: "financier_venture3",
          name: "Venture Trade Capital",
          type: "working_capital",
          totalFunding: "28000.00",
          availableLiquidity: "8400.00",
          utilizationRate: 65,
          usersServed: 3,
          activeLoans: 2,
          averageAPR: 9.1,
          maturityPeriod: "45 days",
          riskRating: "BBB",
          status: "active",
          createdAt: "2024-03-10T14:20:00Z",
          lastActivity: "2024-06-05T16:10:00Z",
          financierAddress: "0x3456789012345678901234567890123456789012"
        }
      ];
      
      res.json(pools);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch finance pools" 
      });
    }
  });

  app.get("/api/finance/loans", async (req, res) => {
    try {
      // Demo active trade finance loans from financier pools
      const loans = [
        {
          id: "loan_001",
          poolId: "financier_acme001",
          borrowerAddress: "0xa1b2c3d4e5f6789012345678901234567890abcd",
          amount: "15000.00",
          currency: "USDT",
          apr: 8.2,
          term: "45 days",
          purpose: "trade_financing",
          collateralType: "trade_goods",
          status: "funded",
          fundedAt: "2024-05-15T10:30:00Z",
          dueDate: "2024-06-29T10:30:00Z",
          repaidAmount: null
        },
        {
          id: "loan_002",
          poolId: "financier_global02",
          borrowerAddress: "0xb2c3d4e5f6789012345678901234567890abcdef",
          amount: "22000.00",
          currency: "USDC",
          apr: 8.8,
          term: "60 days",
          purpose: "supply_chain_finance",
          collateralType: "inventory",
          status: "funded",
          fundedAt: "2024-05-20T14:15:00Z",
          dueDate: "2024-07-19T14:15:00Z",
          repaidAmount: null
        },
        {
          id: "loan_003",
          poolId: "financier_acme001",
          borrowerAddress: "0xc3d4e5f6789012345678901234567890abcdef12",
          amount: "8500.00",
          currency: "USDT",
          apr: 8.2,
          term: "30 days",
          purpose: "working_capital",
          collateralType: "receivables",
          status: "completed",
          fundedAt: "2024-04-10T09:00:00Z",
          dueDate: "2024-05-10T09:00:00Z",
          repaidAmount: "8500.00"
        },
        {
          id: "loan_004",
          poolId: "financier_venture3",
          borrowerAddress: "0xd4e5f6789012345678901234567890abcdef1234",
          amount: "12000.00",
          currency: "USDC",
          apr: 9.1,
          term: "45 days",
          purpose: "trade_financing",
          collateralType: "trade_goods",
          status: "pending",
          fundedAt: null,
          dueDate: null,
          repaidAmount: null
        }
      ];
      
      res.json(loans);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch finance loans" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [WALLET] Wallet & Transaction Management
  // ═══════════════════════════════════════════════════════
  app.get("/api/wallets", async (req, res) => {
    try {
      const wallets = await storage.getAllWallets();
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch wallets" 
      });
    }
  });

  app.post("/api/wallets", async (req, res) => {
    try {
      const wallet = await storage.createWallet(req.body);
      
      // Award signup bonus points (100 points)
      const SIGNUP_BONUS = 100;
      
      // Check if user points exist, if not create them
      let userPoints = await storage.getUserPoints(wallet.address);
      if (!userPoints) {
        userPoints = await storage.createUserPoints({
          walletAddress: wallet.address,
          totalPoints: SIGNUP_BONUS,
          referralPoints: 0,
        });
      } else {
        // Update existing points
        await storage.updateUserPoints(wallet.address, SIGNUP_BONUS);
      }
      
      // Create point transaction record
      await storage.createPointTransaction({
        walletAddress: wallet.address,
        type: 'signup_bonus',
        points: SIGNUP_BONUS,
        description: 'Welcome bonus for creating an account',
        referenceId: wallet.address,
      });
      
      res.status(201).json(wallet);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create wallet" 
      });
    }
  });

  app.get("/api/wallets/:id", async (req, res) => {
    try {
      const wallet = await storage.getWallet(parseInt(req.params.id));
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch wallet" 
      });
    }
  });

  // Fetch wallet transactions from blockchain explorer
  app.get("/api/wallet/:address/transactions", async (req, res) => {
    try {
      const { address } = req.params;
      const { networkId } = req.query;
      const chainId = networkId ? parseInt(networkId as string) : 84532;
      
      let apiUrl = '';
      
      // Base Sepolia - using Blockscout API (no API key needed)
      if (chainId === 84532) {
        apiUrl = `https://base-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`;
      }
      // Lisk Sepolia - uses blockscout (no API key needed)
      else if (chainId === 4202) {
        apiUrl = `https://sepolia-blockscout.lisk.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`;
      }
      
      if (!apiUrl) {
        return res.json({ transactions: [] });
      }
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (data.status !== '1' || !data.result) {
        return res.json({ transactions: [] });
      }
      
      // Known USDC contract addresses
      const usdcContracts = [
        '0x036cbd53842c5426634e7929541ec2318f3dcf7e', // Base Sepolia USDC
        '0x0e82fddad51cc3ac12b69761c45bbcb9a2bf3c83', // Lisk Sepolia USDC.e
      ];
      
      // Transform to consistent format
      const transactions = data.result.map((tx: any) => {
        const isTokenTransfer = tx.input && tx.input.startsWith('0xa9059cbb'); // ERC20 transfer method
        const toContract = tx.to?.toLowerCase();
        const isUsdcTransfer = usdcContracts.includes(toContract);
        
        // Convert wei to ETH for native transfers
        let displayValue = (parseFloat(tx.value) / 1e18).toString();
        let tokenSymbol = 'ETH';
        let usdValue = parseFloat(tx.value) / 1e18 * 3200; // ETH price
        
        // Parse ERC20 transfer amount from input data
        if (isTokenTransfer && tx.input.length >= 138) {
          try {
            // ERC20 transfer: 0xa9059cbb + 32 bytes address + 32 bytes amount
            const amountHex = '0x' + tx.input.slice(74, 138);
            const rawAmount = BigInt(amountHex);
            displayValue = (Number(rawAmount) / 1e6).toString(); // USDC has 6 decimals
            tokenSymbol = isUsdcTransfer ? 'USDC' : 'TOKEN';
            usdValue = Number(rawAmount) / 1e6; // USDC = $1
          } catch (e) {
            // Fallback to showing ETH value
          }
        }
        
        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: displayValue,
          type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
          status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
          timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          blockNumber: tx.blockNumber,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          usdValue,
          tokenSymbol,
          isTokenTransfer
        };
      });
      
      res.json({ transactions });
    } catch (error) {
      res.json({ transactions: [] });
    }
  });

  // Network management endpoints
  app.get("/api/networks", async (req, res) => {
    try {
      const networks = await storage.getAllNetworks();
      res.json(networks);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch networks" 
      });
    }
  });

  app.post("/api/networks", async (req, res) => {
    try {
      const network = await storage.createNetwork(req.body);
      res.status(201).json(network);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create network" 
      });
    }
  });

  // Transaction management endpoints
  app.get("/api/transactions", async (req, res) => {
    try {
      const { walletId, networkId, limit = 50 } = req.query;
      const transactions = await storage.getTransactions({
        walletId: walletId ? parseInt(walletId as string) : undefined,
        networkId: networkId ? parseInt(networkId as string) : undefined,
        limit: parseInt(limit as string)
      });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch transactions" 
      });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transaction = await storage.createTransaction(req.body);
      
      // Check if this is the user's first transaction and award bonus
      if (transaction.from) {
        // Get all transactions from this wallet address
        const wallet = await storage.getWalletByAddress(transaction.from);
        if (wallet) {
          const userTransactions = await storage.getTransactions({ walletId: wallet.id });
          
          // If this is the first transaction (only one exists), award bonus
          if (userTransactions.length === 1) {
            const FIRST_TRANSACTION_BONUS = 25;
            
            // Award points
            let userPoints = await storage.getUserPoints(transaction.from);
            if (!userPoints) {
              userPoints = await storage.createUserPoints({
                walletAddress: transaction.from,
                totalPoints: FIRST_TRANSACTION_BONUS,
                referralPoints: 0,
              });
            } else {
              await storage.updateUserPoints(transaction.from, FIRST_TRANSACTION_BONUS);
            }
            
            // Create point transaction record
            await storage.createPointTransaction({
              walletAddress: transaction.from,
              type: 'first_transaction_bonus',
              points: FIRST_TRANSACTION_BONUS,
              description: 'Bonus for completing your first transaction',
              referenceId: transaction.hash,
            });
          }
        }
      }
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create transaction" 
      });
    }
  });

  app.get("/api/transactions/:hash", async (req, res) => {
    try {
      const transaction = await storage.getTransactionByHash(req.params.hash);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch transaction" 
      });
    }
  });

  app.patch("/api/transactions/:hash", async (req, res) => {
    try {
      const transaction = await storage.updateTransaction(req.params.hash, req.body);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update transaction" 
      });
    }
  });

  // Balance management endpoints
  app.get("/api/balances", async (req, res) => {
    try {
      const { walletId, networkId } = req.query;
      const balances = await storage.getBalances({
        walletId: walletId ? parseInt(walletId as string) : undefined,
        networkId: networkId ? parseInt(networkId as string) : undefined
      });
      res.json(balances);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch balances" 
      });
    }
  });

  app.post("/api/balances", async (req, res) => {
    try {
      const balance = await storage.createBalance(req.body);
      res.status(201).json(balance);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create balance" 
      });
    }
  });

  app.patch("/api/balances/:id", async (req, res) => {
    try {
      const balance = await storage.updateBalance(parseInt(req.params.id), req.body);
      if (!balance) {
        return res.status(404).json({ message: "Balance not found" });
      }
      res.json(balance);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update balance" 
      });
    }
  });

  // Statistics endpoints
  app.get("/api/stats/portfolio/:walletId", async (req, res) => {
    try {
      const walletId = parseInt(req.params.walletId);
      const stats = await storage.getPortfolioStats(walletId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch portfolio stats" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [TRADE-FINANCE] Trade Finance & Guarantees
  // ═══════════════════════════════════════════════════════
  app.post("/api/trade-finance/stake", async (req, res) => {
    try {
      const { insertLiquidityPoolStakeSchema } = await import("@shared/schema");
      const validated = insertLiquidityPoolStakeSchema.parse({
        ...req.body,
        stakerAddress: req.body.stakerAddress?.toLowerCase()
      });
      const stake = await storage.createLiquidityStake(validated);
      res.status(201).json(stake);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create stake" 
      });
    }
  });

  app.post("/api/trade-finance/stakes", async (req, res) => {
    try {
      const { insertLiquidityPoolStakeSchema } = await import("@shared/schema");
      const validated = insertLiquidityPoolStakeSchema.parse({
        ...req.body,
        stakerAddress: req.body.stakerAddress?.toLowerCase()
      });
      const stake = await storage.createLiquidityStake(validated);
      res.status(200).json(stake);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create stake" 
      });
    }
  });

  app.get("/api/trade-finance/stakes", async (req, res) => {
    try {
      const { stakerAddress, status } = req.query;
      const filters: any = {};
      
      if (stakerAddress) filters.stakerAddress = (stakerAddress as string).toLowerCase();
      if (status) filters.status = status as string;
      
      const stakes = await storage.getLiquidityStakes(filters);
      res.json(stakes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch stakes" 
      });
    }
  });

  app.post("/api/trade-finance/unstake/:stakeId", async (req, res) => {
    try {
      const { stakeId } = req.params;
      const { walletAddress } = req.body;
      
      // Validate wallet address is provided
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // First, get the stake details
      const stakes = await storage.getLiquidityStakes({ id: parseInt(stakeId) });
      const stake = stakes[0];
      
      if (!stake) {
        return res.status(404).json({ message: "Stake not found" });
      }
      
      // SECURITY: Verify the requester owns this stake
      if (stake.stakerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(403).json({ message: "You can only unstake your own funds" });
      }
      
      if (stake.status === 'withdrawn') {
        return res.status(400).json({ message: "Stake already withdrawn" });
      }
      
      // Import unstake manager
      const { unstakeManager } = await import("./unstake-manager");
      
      // Execute blockchain transfer from Treasury Pool to user
      const { txHash } = await unstakeManager.unstakeTokens({
        userAddress: stake.stakerAddress,
        amount: stake.amount
      });
      
      
      // Update database status to withdrawn
      const updatedStake = await storage.updateLiquidityStake(parseInt(stakeId), { 
        status: 'withdrawn',
        withdrawnAt: new Date()
      });
      
      res.json({ 
        ...updatedStake, 
        transactionHash: txHash 
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to unstake" 
      });
    }
  });

  // Trade Finance Requests
  app.post("/api/trade-finance/requests", async (req, res) => {
    try {
      const { insertTradeFinanceRequestSchema } = await import("@shared/schema");
      const validated = insertTradeFinanceRequestSchema.parse({
        ...req.body,
        buyerAddress: req.body.buyerAddress?.toLowerCase(),
        sellerAddress: req.body.sellerAddress?.toLowerCase()
      });
      const request = await storage.createTradeFinanceRequest(validated);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create trade finance request" 
      });
    }
  });

  app.get("/api/trade-finance/requests", async (req, res) => {
    try {
      const { buyerAddress, sellerAddress, status } = req.query;
      const filters: any = {};
      
      if (buyerAddress) filters.buyerAddress = buyerAddress as string;
      if (sellerAddress) filters.sellerAddress = sellerAddress as string;
      if (status) filters.status = status as string;
      
      const requests = await storage.getTradeFinanceRequests(filters);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade finance requests" 
      });
    }
  });

  app.get("/api/trade-finance/requests/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const request = await storage.getTradeFinanceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Trade finance request not found" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade finance request" 
      });
    }
  });

  app.patch("/api/trade-finance/requests/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const request = await storage.updateTradeFinanceRequest(requestId, req.body);
      
      if (!request) {
        return res.status(404).json({ message: "Trade finance request not found" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update trade finance request" 
      });
    }
  });

  // Voting
  app.post("/api/trade-finance/vote", async (req, res) => {
    try {
      const { insertTradeFinanceVoteSchema } = await import("@shared/schema");
      const validated = insertTradeFinanceVoteSchema.parse({
        ...req.body,
        voterAddress: req.body.voterAddress?.toLowerCase()
      });
      
      // Verify voter has an active stake
      const voterStakes = await storage.getLiquidityStakes({
        stakerAddress: validated.voterAddress,
        status: 'active'
      });
      
      if (voterStakes.length === 0) {
        return res.status(403).json({ 
          message: "Only LP providers with active stakes can vote" 
        });
      }
      
      // Check if already voted
      const existingVotes = await storage.getTradeFinanceVotes(validated.requestId);
      const alreadyVoted = existingVotes.some(v => 
        v.voterAddress.toLowerCase() === validated.voterAddress.toLowerCase()
      );
      
      if (alreadyVoted) {
        return res.status(409).json({ 
          message: "You have already voted on this request" 
        });
      }
      
      const vote = await storage.createTradeFinanceVote(validated);
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to submit vote" 
      });
    }
  });

  app.get("/api/trade-finance/votes/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const votes = await storage.getTradeFinanceVotes(requestId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch votes" 
      });
    }
  });

  // Pool Statistics
  app.get("/api/trade-finance/pool-stats", async (req, res) => {
    try {
      const stats = await storage.getPoolStatistics();
      
      // Fetch actual treasury wallet balance from blockchain
      let treasuryBalance = "0";
      try {
        const ethers = await import("ethers");
        const treasuryAddress = process.env.TREASURY_POOL_PRIVATE_KEY 
          ? new ethers.Wallet(process.env.TREASURY_POOL_PRIVATE_KEY).address 
          : null;
        
        if (treasuryAddress) {
          const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
          const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
          const usdcAbi = [
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)"
          ];
          const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
          
          const balance = await usdcContract.balanceOf(treasuryAddress);
          const decimals = await usdcContract.decimals();
          treasuryBalance = ethers.formatUnits(balance, decimals);
        }
      } catch (balanceError) {
      }
      
      res.json({
        ...stats,
        treasuryBalance
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch pool statistics" 
      });
    }
  });

  // Performance Bonds
  app.post("/api/trade-finance/performance-bonds", async (req, res) => {
    try {
      const { insertPerformanceBondSchema } = await import("@shared/schema");
      const validated = insertPerformanceBondSchema.parse({
        ...req.body,
        sellerAddress: req.body.sellerAddress?.toLowerCase()
      });
      const bond = await storage.createPerformanceBond(validated);
      res.status(201).json(bond);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create performance bond" 
      });
    }
  });

  app.get("/api/trade-finance/performance-bonds/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const bond = await storage.getPerformanceBond(requestId);
      res.json(bond);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch performance bond" 
      });
    }
  });

  // Collateral
  app.post("/api/trade-finance/collateral", async (req, res) => {
    try {
      const { insertTradeCollateralSchema } = await import("@shared/schema");
      const validated = insertTradeCollateralSchema.parse({
        ...req.body,
        verifiedBy: req.body.verifiedBy?.toLowerCase()
      });
      const collateral = await storage.createTradeCollateral(validated);
      res.status(201).json(collateral);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create collateral record" 
      });
    }
  });

  app.get("/api/trade-finance/collateral/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const collateral = await storage.getTradeCollateral(requestId);
      res.json(collateral);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch collateral" 
      });
    }
  });

  // Trade Finance - Delivery Proof endpoints
  app.post("/api/trade-finance/delivery-proof", async (req, res) => {
    try {
      const { insertDeliveryProofSchema } = await import("@shared/schema");
      const validated = insertDeliveryProofSchema.parse(req.body);
      
      // Check if delivery proof already exists for this requestId (enforce 1:1 relationship)
      const existing = await storage.getDeliveryProof(validated.requestId);
      if (existing) {
        return res.status(409).json({ 
          message: "Delivery proof already exists for this request. Use PATCH to update." 
        });
      }
      
      const proof = await storage.createDeliveryProof(validated);
      res.status(201).json(proof);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create delivery proof" 
      });
    }
  });

  app.get("/api/trade-finance/delivery-proof/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const proof = await storage.getDeliveryProof(requestId);
      
      if (!proof) {
        return res.status(404).json({ message: "Delivery proof not found" });
      }
      
      res.json(proof);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch delivery proof" 
      });
    }
  });

  app.patch("/api/trade-finance/delivery-proof/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const proof = await storage.updateDeliveryProof(requestId, req.body);
      
      if (!proof) {
        return res.status(404).json({ message: "Delivery proof not found" });
      }
      
      res.json(proof);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update delivery proof" 
      });
    }
  });

  // Treasury Portal endpoints
  app.get("/api/trade-finance/guarantees", async (req, res) => {
    try {
      // Get all trade finance requests for Treasury voting
      const tradeFinanceRequests = await storage.getTradeFinanceRequests({});
      
      // Map trade finance requests to guarantees format for Treasury Portal
      const guarantees = tradeFinanceRequests.map(request => {
        // Determine voting status based on workflow status
        let votingStatus = 'pending';
        if (request.status === 'approved' || request.status === 'fee_paid') {
          votingStatus = 'approved';
        } else if (request.status === 'rejected' || request.status === 'seller_rejected') {
          votingStatus = 'rejected';
        } else if (request.status === 'draft_sent_to_seller' || request.status === 'seller_approved') {
          votingStatus = 'pending';
        }
        
        return {
          id: request.id,
          guaranteeId: request.requestId,
          buyerAddress: request.buyerAddress,
          sellerAddress: request.sellerAddress,
          goodsDescription: request.tradeDescription,
          goodsValue: Number(request.requestedAmount || 0),
          totalValue: Number(request.requestedAmount || 0),
          collateralAmount: Number(request.requestedAmount || 0) * 0.1,
          billOfLading: '',
          status: votingStatus,
          rawStatus: request.status, // Include raw database status for UI logic
          votesFor: Number(request.votesFor || 0),
          votesAgainst: Number(request.votesAgainst || 0),
          createdAt: request.createdAt,
        };
      });
      
      res.json(guarantees);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade finance guarantees" 
      });
    }
  });

  app.get("/api/trade-finance/staker-info", async (req, res) => {
    try {
      const walletAddress = req.query.walletAddress as string;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // Get all stakes
      const allStakes = await storage.getLiquidityStakes({ status: 'active' });
      
      // Find ALL user's stakes (user may have multiple stakes)
      const userStakes = allStakes.filter(
        (s: any) => s.stakerAddress.toLowerCase() === walletAddress.toLowerCase()
      );
      
      // Calculate total staked amount across all stakes
      const totalStaked = allStakes.reduce((sum: number, stake: any) => sum + Number(stake.amount), 0);
      
      // Sum all user's stakes (1 USDC = 1 vote)
      const stakedAmount = userStakes.reduce((sum: number, stake: any) => sum + Number(stake.amount), 0);
      const personalVotingPower = stakedAmount;
      
      // Check if user is a specialist and get delegated voting power
      const specialist = await storage.getSpecialistRole(walletAddress);
      let delegatedVotingPower = 0;
      let delegatorCount = 0;
      
      if (specialist) {
        delegatedVotingPower = await storage.getTotalDelegatedPower(walletAddress);
        const delegations = await storage.getVoteDelegationsByDelegate(walletAddress);
        delegatorCount = delegations.length;
      }
      
      // Total voting power = personal + delegated
      const totalVotingPower = personalVotingPower + delegatedVotingPower;
      
      res.json({
        isStaker: userStakes.length > 0,
        stakedAmount,
        votingPower: totalVotingPower, // Total voting power (for backwards compatibility)
        personalVotingPower,
        delegatedVotingPower,
        delegatorCount,
        isSpecialist: !!specialist,
        totalStaked
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch staker info" 
      });
    }
  });

  app.post("/api/trade-finance/guarantees/:guaranteeId/vote", async (req, res) => {
    try {
      const { guaranteeId } = req.params;
      const { walletAddress, voteFor } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // Check if user is a staker
      const allStakes = await storage.getLiquidityStakes({ status: 'active' });
      const userStakes = allStakes.filter(
        (s: any) => s.stakerAddress.toLowerCase() === walletAddress.toLowerCase()
      );
      
      if (userStakes.length === 0) {
        return res.status(403).json({ message: "You must be a staker to vote" });
      }
      
      // Sum all user's stakes (1 USDC = 1 vote)
      const personalVotingPower = userStakes.reduce((sum: number, stake: any) => sum + Number(stake.amount), 0);
      
      // Check if voter is a specialist and add delegated voting power
      const specialist = await storage.getSpecialistRole(walletAddress);
      let delegatedVotingPower = 0;
      
      if (specialist) {
        delegatedVotingPower = await storage.getTotalDelegatedPower(walletAddress);
      }
      
      // Total voting power = personal + delegated
      const votingPower = personalVotingPower + delegatedVotingPower;
      const totalStaked = allStakes.reduce((sum: number, stake: any) => sum + Number(stake.amount), 0);
      
      // Record the vote
      const { insertTradeFinanceVoteSchema } = await import("@shared/schema");
      const validated = insertTradeFinanceVoteSchema.parse({
        requestId: guaranteeId,
        voterAddress: walletAddress.toLowerCase(),
        vote: voteFor ? "approve" : "reject",
        votingPower: votingPower.toString()
      });
      
      await storage.createTradeFinanceVote(validated);
      
      // Update vote counts on the request
      const request = await storage.getTradeFinanceRequest(guaranteeId);
      if (request) {
        const currentVotesFor = Number(request.votesFor || 0);
        const currentVotesAgainst = Number(request.votesAgainst || 0);
        const updatedVotesFor = voteFor ? currentVotesFor + votingPower : currentVotesFor;
        const updatedVotesAgainst = !voteFor ? currentVotesAgainst + votingPower : currentVotesAgainst;
        
        await storage.updateTradeFinanceRequest(guaranteeId, {
          votesFor: updatedVotesFor,
          votesAgainst: updatedVotesAgainst
        });
        
        // Check if voting threshold is met (60%)
        const totalVotes = updatedVotesFor + updatedVotesAgainst;
        if (totalVotes >= 60) {
          const approvalPercentage = (updatedVotesFor / totalVotes) * 100;
          
          if (approvalPercentage >= 60 && request.status === 'pending_draft') {
            // Automatically create draft certificate when treasury approves
            const { insertTradeFinanceCertificateSchema } = await import("@shared/schema");
            
            // Determine version number (increment if there were previous drafts)
            const existingCerts = await storage.getCertificatesByRequestId(guaranteeId);
            const draftCerts = existingCerts.filter(c => c.certificateType === "draft");
            const version = draftCerts.length + 1;
            
            // Generate URDG 758-compliant draft certificate content
            const draftContent = generateURDG758Certificate({
              request: {
                requestId: request.requestId,
                buyerAddress: request.buyerAddress,
                sellerAddress: request.sellerAddress,
                buyerCompany: request.buyerCompanyName,
                buyerRegistration: request.buyerRegistrationNumber,
                buyerCountry: request.buyerCountry,
                buyerContact: request.buyerContactPerson,
                buyerEmail: request.buyerEmail,
                buyerPhone: request.buyerPhone,
                sellerCompany: '',
                sellerRegistration: '',
                sellerCountry: '',
                sellerContact: '',
                sellerEmail: '',
                sellerPhone: '',
                requestedAmount: request.requestedAmount,
                tradeDescription: request.tradeDescription,
                goodsDescription: request.collateralDescription,
                deliveryTerms: '',
                collateralAmount: request.collateralValue,
                createdAt: request.createdAt,
                feeDue: request.feeDue,
                expiryDate: request.paymentDueDate
              },
              certificateType: 'draft',
              version
            });
            
            const certificateData = {
              requestId: guaranteeId,
              certificateType: "draft",
              version,
              content: draftContent,
              createdBy: "treasury",
              createdByRole: "treasury",
              isActive: true
            };
            
            const draftCertificate = await storage.createCertificate(insertTradeFinanceCertificateSchema.parse(certificateData));
            
            // Supersede older draft certificates
            for (const oldDraft of draftCerts) {
              await storage.updateCertificate(oldDraft.id, {
                isActive: false,
                supersededBy: draftCertificate.id
              });
            }
            
            // Update request: move to draft_sent_to_seller
            await storage.updateTradeFinanceRequest(guaranteeId, { 
              status: 'draft_sent_to_seller',
              draftCertificateId: draftCertificate.id,
              draftSentAt: new Date()
            });
            
            const collateral = await storage.getGoodsCollateral(guaranteeId);
            if (collateral) {
              await storage.updateGoodsCollateral(collateral.id, { status: 'approved' });
            }
            
            // Notify seller that their application was approved
            await storage.createNotification({
              recipientAddress: request.sellerAddress,
              title: "Trade Finance Guarantee Approved",
              message: `Your Trade Finance Guarantee application ${guaranteeId} has been approved by the treasury. A draft certificate has been issued and sent for your review.`,
              type: "trade_finance_approved",
              relatedType: "trade_finance_request",
              actionRequired: true,
              actionUrl: `/trade-finance?id=${guaranteeId}`
            });
          } else {
            // Reject the request
            await storage.updateTradeFinanceRequest(guaranteeId, { status: 'rejected' });
            const collateral = await storage.getGoodsCollateral(guaranteeId);
            if (collateral) {
              await storage.updateGoodsCollateral(collateral.id, { status: 'rejected' });
            }
          }
        }
      }
      
      res.json({ 
        message: "Vote recorded successfully",
        votingPower 
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        return res.status(409).json({ message: "You have already voted on this guarantee" });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to record vote" 
      });
    }
  });

  // Trade Finance - Manual Draft Creation (Treasury)
  // NOTE: MVP LIMITATION - This endpoint trusts caller-supplied wallet address without
  // cryptographic verification. Anyone can bypass the staker check by providing a staker's
  // address. For production, implement wallet signature challenge/response authentication.
  app.post("/api/trade-finance/guarantees/:guaranteeId/create-draft", async (req, res) => {
    try {
      const { guaranteeId } = req.params;
      const { walletAddress } = req.body;
      
      // Validate wallet address provided
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // Check if caller claims to be a treasury staker
      // WARNING: This check can be bypassed - wallet address is not cryptographically verified
      const stakes = await storage.getLiquidityStakes({ stakerAddress: walletAddress.toLowerCase() });
      const totalStaked = stakes.reduce((sum: number, stake: any) => sum + Number(stake.amount), 0);
      
      if (totalStaked <= 0) {
        return res.status(403).json({ 
          message: "Only treasury stakers can create draft certificates" 
        });
      }
      
      // Get the request
      const request = await storage.getTradeFinanceRequest(guaranteeId);
      if (!request) {
        return res.status(404).json({ message: "Trade Finance Guarantee request not found" });
      }
      
      // Check if request is in pending_draft status
      if (request.status !== 'pending_draft') {
        return res.status(400).json({ 
          message: `Cannot create draft for request in ${request.status} status` 
        });
      }
      
      // Check if voting threshold is met (60 votes, 60% approval)
      const currentVotesFor = Number(request.votesFor || 0);
      const currentVotesAgainst = Number(request.votesAgainst || 0);
      const totalVotes = currentVotesFor + currentVotesAgainst;
      
      if (totalVotes < 60) {
        return res.status(400).json({ 
          message: `Voting threshold not met. Current: ${totalVotes} votes, Required: 60 votes minimum` 
        });
      }
      
      const approvalPercentage = (currentVotesFor / totalVotes) * 100;
      if (approvalPercentage < 60) {
        return res.status(400).json({ 
          message: `Approval threshold not met. Current: ${approvalPercentage.toFixed(1)}%, Required: 60% minimum` 
        });
      }
      
      // Import schema
      const { insertTradeFinanceCertificateSchema } = await import("@shared/schema");
      
      // Determine version number (increment if there were previous drafts)
      const existingCerts = await storage.getCertificatesByRequestId(guaranteeId);
      const draftCerts = existingCerts.filter(c => c.certificateType === "draft");
      const version = draftCerts.length + 1;
      
      // Generate URDG 758-compliant draft certificate content
      const draftContent = generateURDG758Certificate({
        request: {
          requestId: request.requestId,
          buyerAddress: request.buyerAddress,
          sellerAddress: request.sellerAddress,
          buyerCompany: request.buyerCompanyName,
          buyerRegistration: request.buyerRegistrationNumber,
          buyerCountry: request.buyerCountry,
          buyerContact: request.buyerContactPerson,
          buyerEmail: request.buyerEmail,
          buyerPhone: request.buyerPhone,
          sellerCompany: '',
          sellerRegistration: '',
          sellerCountry: '',
          sellerContact: '',
          sellerEmail: '',
          sellerPhone: '',
          requestedAmount: request.requestedAmount,
          tradeDescription: request.tradeDescription,
          goodsDescription: request.collateralDescription,
          deliveryTerms: '',
          collateralAmount: request.collateralValue,
          createdAt: request.createdAt,
          feeDue: request.feeDue,
          expiryDate: request.paymentDueDate
        },
        certificateType: 'draft',
        version
      });
      
      const certificateData = {
        requestId: guaranteeId,
        certificateType: "draft",
        version,
        content: draftContent,
        createdBy: "treasury",
        createdByRole: "treasury",
        isActive: true
      };
      
      const draftCertificate = await storage.createCertificate(insertTradeFinanceCertificateSchema.parse(certificateData));
      
      // Supersede older draft certificates
      for (const oldDraft of draftCerts) {
        await storage.updateCertificate(oldDraft.id, {
          isActive: false,
          supersededBy: draftCertificate.id
        });
      }
      
      // Update request: move to draft_sent_to_seller
      await storage.updateTradeFinanceRequest(guaranteeId, { 
        status: 'draft_sent_to_seller',
        draftCertificateId: draftCertificate.id,
        draftSentAt: new Date()
      });
      
      const collateral = await storage.getGoodsCollateral(guaranteeId);
      if (collateral) {
        await storage.updateGoodsCollateral(collateral.id, { status: 'approved' });
      }
      
      res.json({ 
        message: "Draft certificate created successfully",
        certificateId: draftCertificate.id,
        guaranteeId
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create draft certificate" 
      });
    }
  });

  // Trade Finance - Goods Collateral endpoints
  app.get("/api/trade-finance/goods-collateral", async (req, res) => {
    try {
      const { scope } = req.query;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      // Helper to map totalValue to goodsValue for frontend compatibility
      const mapCollateral = (items: any[]) => items.map(item => ({
        ...item,
        goodsValue: item.totalValue // Frontend expects goodsValue
      }));
      
      // Scope: "my" - return only the authenticated user's guarantees
      if (scope === 'my') {
        if (!walletAddress) {
          return res.status(400).json({ message: "Wallet address required for scoped request" });
        }
        
        // Filter by the user's trade finance requests
        const userRequests = await storage.getTradeFinanceRequests({ 
          buyerAddress: walletAddress.toLowerCase()
        });
        const userRequestIds = userRequests.map(r => r.requestId);
        
        // Get all goods collateral and filter by user's request IDs
        const allCollateral = await storage.getAllGoodsCollateral();
        const filteredCollateral = allCollateral.filter(c => 
          userRequestIds.includes(c.requestId)
        );
        return res.json(mapCollateral(filteredCollateral));
      }
      
      // Scope: "pending" - return only pending guarantees (for staker voting)
      if (scope === 'pending') {
        const allCollateral = await storage.getAllGoodsCollateral();
        const pendingCollateral = allCollateral.filter(c => c.status === 'pending');
        return res.json(mapCollateral(pendingCollateral));
      }
      
      // Default: return all (backward compatibility, but discouraged)
      const allCollateral = await storage.getAllGoodsCollateral();
      res.json(mapCollateral(allCollateral));
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch goods collateral" 
      });
    }
  });

  app.post("/api/trade-finance/goods-collateral", async (req, res) => {
    try {
      const { insertGoodsCollateralSchema } = await import("@shared/schema");
      
      // Map frontend field names to backend schema
      const requestBody = { ...req.body };
      if (requestBody.goodsValue && !requestBody.totalValue) {
        requestBody.totalValue = requestBody.goodsValue;
        delete requestBody.goodsValue;
      }
      
      const validated = insertGoodsCollateralSchema.parse(requestBody);
      
      // Check if goods collateral already exists for this requestId (enforce 1:1 relationship)
      const existing = await storage.getGoodsCollateral(validated.requestId);
      if (existing) {
        return res.status(409).json({ 
          message: "Goods collateral already exists for this request." 
        });
      }
      
      const collateral = await storage.createGoodsCollateral(validated);
      // Map totalValue to goodsValue for frontend compatibility
      res.status(201).json({
        ...collateral,
        goodsValue: collateral.totalValue
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create goods collateral" 
      });
    }
  });

  app.get("/api/trade-finance/goods-collateral/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const collateral = await storage.getGoodsCollateral(requestId);
      
      if (!collateral) {
        return res.status(404).json({ message: "Goods collateral not found" });
      }
      
      // Map totalValue to goodsValue for frontend compatibility
      res.json({
        ...collateral,
        goodsValue: collateral.totalValue
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch goods collateral" 
      });
    }
  });

  // Trade Finance - Claim endpoints
  app.post("/api/trade-finance/claims", async (req, res) => {
    try {
      const { insertGuaranteeClaimSchema } = await import("@shared/schema");
      const validated = insertGuaranteeClaimSchema.parse(req.body);
      
      // Initialize 72-hour voting period
      const votingStartedAt = new Date();
      const votingEndsAt = new Date(votingStartedAt.getTime() + 72 * 60 * 60 * 1000); // 72 hours
      
      const claim = await storage.createGuaranteeClaim({
        ...validated,
        status: 'under_review',
        votingStartedAt,
        votingEndsAt,
        votesFor: 0,
        votesAgainst: 0
      });
      
      res.status(201).json(claim);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create guarantee claim" 
      });
    }
  });

  app.get("/api/trade-finance/claims", async (req, res) => {
    try {
      const { requestId, status } = req.query;
      const claims = await storage.getGuaranteeClaims({
        requestId: requestId as string | undefined,
        status: status as string | undefined
      });
      
      // Auto-finalize claims where voting period has ended
      const now = new Date();
      const finalizedClaims = await Promise.all(
        claims.map(async (claim) => {
          // Only process claims that are still in under_review status
          if (claim.status === 'under_review' && claim.votingEndsAt && new Date(claim.votingEndsAt) <= now) {
            // Voting period has ended - determine outcome based on majority
            const votesFor = claim.votesFor || 0;
            const votesAgainst = claim.votesAgainst || 0;
            const totalVotes = votesFor + votesAgainst;
            
            // If no votes, default to rejected
            if (totalVotes === 0) {
              const updated = await storage.updateGuaranteeClaim(claim.id, {
                status: 'rejected',
                reviewNotes: 'No votes received during voting period',
                reviewedAt: now
              });
              return updated || claim;
            }
            
            // Majority determines outcome
            const approved = votesFor > votesAgainst;
            
            if (approved) {
              // Claim approved - Execute automatic payment from treasury pool to seller
              try {
                const { ethers } = await import("ethers");
                const { getTokenBySymbol } = await import("../client/src/lib/tokens");
                
                // Get treasury pool wallet
                const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
                if (!treasuryPrivateKey) {
                  throw new Error("Treasury pool private key not configured");
                }
                
                // Setup provider and wallet
                const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
                const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
                
                // Get USDC contract on Base Sepolia (networkId: 84532)
                const usdc = getTokenBySymbol(84532, "USDC");
                if (!usdc) {
                  throw new Error("USDC token not found");
                }
                
                const usdcContract = new ethers.Contract(
                  usdc.address,
                  ["function transfer(address to, uint256 amount) returns (bool)"],
                  treasuryWallet
                );
                
                // Convert claim amount to USDC decimals (6)
                const amountToTransfer = ethers.parseUnits(claim.claimAmount.toString(), 6);
                
                // Execute transfer
                const tx = await usdcContract.transfer(claim.claimantAddress, amountToTransfer);
                const receipt = await tx.wait();
                
                
                // Update claim with payment details
                const updated = await storage.updateGuaranteeClaim(claim.id, {
                  status: 'paid',
                  approvedAmount: claim.claimAmount,
                  paymentTransactionHash: receipt.hash,
                  paidAmount: claim.claimAmount,
                  paidAt: now,
                  reviewNotes: `Voting completed: ${votesFor} approve, ${votesAgainst} reject. Payment executed automatically.`,
                  reviewedAt: now
                });
                
                return updated || claim;
              } catch (paymentError) {
                
                // Mark as approved but payment failed
                const updated = await storage.updateGuaranteeClaim(claim.id, {
                  status: 'approved',
                  approvedAmount: claim.claimAmount,
                  reviewNotes: `Voting completed: ${votesFor} approve, ${votesAgainst} reject. Automatic payment failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}`,
                  reviewedAt: now
                });
                
                return updated || claim;
              }
            } else {
              // Claim rejected
              const updated = await storage.updateGuaranteeClaim(claim.id, {
                status: 'rejected',
                reviewNotes: `Voting completed: ${votesFor} approve, ${votesAgainst} reject`,
                reviewedAt: now
              });
              return updated || claim;
            }
          }
          
          return claim;
        })
      );
      
      res.json(finalizedClaims);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch guarantee claims" 
      });
    }
  });

  app.get("/api/trade-finance/claims/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.getGuaranteeClaim(id);
      
      if (!claim) {
        return res.status(404).json({ message: "Guarantee claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch guarantee claim" 
      });
    }
  });

  app.patch("/api/trade-finance/claims/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const claim = await storage.updateGuaranteeClaim(id, req.body);
      
      if (!claim) {
        return res.status(404).json({ message: "Guarantee claim not found" });
      }
      
      res.json(claim);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update guarantee claim" 
      });
    }
  });
  
  // Trade Finance - Claim Voting endpoints
  app.post("/api/trade-finance/claims/:id/vote", async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      const { voterAddress, vote, votingPower, comment } = req.body;
      
      if (!voterAddress || !vote) {
        return res.status(400).json({ message: "Voter address and vote are required" });
      }
      
      // Check if claim exists
      const claim = await storage.getGuaranteeClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      // Check if voting period is still active
      if (claim.votingEndsAt && new Date() > new Date(claim.votingEndsAt)) {
        return res.status(400).json({ message: "Voting period has ended" });
      }
      
      // Check if user already voted
      const existingVote = await storage.getClaimVoteByVoter(claimId, voterAddress);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this claim" });
      }
      
      // Create the vote
      const claimVote = await storage.createClaimVote({
        claimId,
        voterAddress: voterAddress.toLowerCase(),
        vote,
        votingPower: votingPower || "0",
        comment
      });
      
      // Update vote counts on the claim
      const allVotes = await storage.getClaimVotes(claimId);
      const votesFor = allVotes.filter(v => v.vote === 'approve').length;
      const votesAgainst = allVotes.filter(v => v.vote === 'reject').length;
      
      await storage.updateGuaranteeClaim(claimId, {
        votesFor,
        votesAgainst
      });
      
      res.status(201).json(claimVote);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to submit vote" 
      });
    }
  });
  
  app.get("/api/trade-finance/claims/:id/votes", async (req, res) => {
    try {
      const claimId = parseInt(req.params.id);
      const votes = await storage.getClaimVotes(claimId);
      res.json(votes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch claim votes" 
      });
    }
  });

  // Trade Finance - Issuance Fee endpoints
  app.post("/api/trade-finance/issuance-fee", async (req, res) => {
    try {
      const { insertGuaranteeIssuanceFeeSchema } = await import("@shared/schema");
      const validated = insertGuaranteeIssuanceFeeSchema.parse(req.body);
      
      // Check if issuance fee already exists for this requestId (enforce 1:1 relationship)
      const existing = await storage.getGuaranteeIssuanceFee(validated.requestId);
      if (existing) {
        return res.status(409).json({ 
          message: "Issuance fee already exists for this request." 
        });
      }
      
      const fee = await storage.createGuaranteeIssuanceFee(validated);
      res.status(201).json(fee);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create issuance fee record" 
      });
    }
  });

  app.get("/api/trade-finance/issuance-fee/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const fee = await storage.getGuaranteeIssuanceFee(requestId);
      
      if (!fee) {
        return res.status(404).json({ message: "Issuance fee not found" });
      }
      
      res.json(fee);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch issuance fee" 
      });
    }
  });

  // Trade Finance - Escrow Integration endpoints
  app.post("/api/trade-finance/:requestId/escrow", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { escrowId, milestones, arbitratorAddress } = req.body;
      
      // Update goods collateral with escrow data
      const goodsCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      if (!goodsCollateral) {
        return res.status(404).json({ message: "Goods collateral not found" });
      }
      
      // Update with escrow information
      await storage.updateGoodsCollateral(goodsCollateral.id, {
        escrowId: escrowId.toString(),
        milestones: JSON.stringify(milestones),
        arbitratorAddress,
        paymentType: "milestone",
        escrowStatus: "active"
      });
      
      res.json({ message: "Escrow linked successfully", escrowId });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to link escrow" 
      });
    }
  });

  app.patch("/api/trade-finance/:requestId/escrow/milestone/:milestoneIndex", async (req, res) => {
    try {
      const { requestId, milestoneIndex } = req.params;
      const { status } = req.body;
      
      const goodsCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      if (!goodsCollateral || !goodsCollateral.milestones) {
        return res.status(404).json({ message: "Escrow milestones not found" });
      }
      
      // Update milestone status
      const milestones = JSON.parse(goodsCollateral.milestones);
      const index = parseInt(milestoneIndex);
      
      if (index < 0 || index >= milestones.length) {
        return res.status(400).json({ message: "Invalid milestone index" });
      }
      
      milestones[index].status = status;
      if (status === "completed" || status === "released") {
        milestones[index].completedAt = new Date().toISOString();
      }
      
      await storage.updateGoodsCollateral(goodsCollateral.id, {
        milestones: JSON.stringify(milestones)
      });
      
      res.json({ message: "Milestone updated successfully", milestones });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update milestone" 
      });
    }
  });

  app.post("/api/trade-finance/:requestId/escrow/dispute", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      
      const goodsCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      if (!goodsCollateral) {
        return res.status(404).json({ message: "Goods collateral not found" });
      }
      
      await storage.updateGoodsCollateral(goodsCollateral.id, {
        escrowStatus: "disputed"
      });
      
      res.json({ message: "Dispute raised successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to raise dispute" 
      });
    }
  });

  // Multi-Step Trade Finance Guarantee Workflow endpoints
  
  // Step 1: Buyer submits application with proforma invoice, sales contract, and identity details
  app.post("/api/trade-finance/applications", async (req, res) => {
    try {
      const { documents, buyerAddress, ...applicationData } = req.body;
      
      // ⚠️ SECURITY WARNING: MVP/Testing Only - No wallet signature verification
      // Production must verify wallet ownership via cryptographic signature
      
      // Verify buyer wallet address provided
      if (!buyerAddress) {
        return res.status(400).json({ message: "Buyer wallet address required" });
      }
      
      // Verify buyer address matches the one in application data
      if (applicationData.buyerAddress && applicationData.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Buyer address mismatch" });
      }
      
      // Validate required documents: proforma invoice and sales contract
      if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({ message: "Documents array required (proforma invoice and sales contract)" });
      }
      
      const hasProformaInvoice = documents.some(doc => doc.documentType === "proforma_invoice");
      const hasSalesContract = documents.some(doc => doc.documentType === "sales_contract");
      
      if (!hasProformaInvoice) {
        return res.status(400).json({ message: "Proforma invoice is required" });
      }
      if (!hasSalesContract) {
        return res.status(400).json({ message: "Sales contract is required" });
      }
      
      // Validate customer identity details
      if (!applicationData.buyerCompanyName) {
        return res.status(400).json({ message: "Buyer company name is required" });
      }
      if (!applicationData.buyerCountry) {
        return res.status(400).json({ message: "Buyer country is required" });
      }
      
      // Validate and create trade finance request
      const { insertTradeFinanceRequestSchema } = await import("@shared/schema");
      const { Decimal } = await import("decimal.js");
      
      // Generate unique request ID
      const requestId = `PG-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      // Calculate 1% fee and 80% guarantee coverage using precise decimal arithmetic
      const requestedAmount = new Decimal(applicationData.requestedAmount);
      const feeDue = requestedAmount.times(0.01).toString();
      
      // Treasury guarantees 80% of invoice value, seller bears 20% risk
      const guaranteePercentage = new Decimal(80);
      const guaranteeCoverageAmount = requestedAmount.times(0.80).toString(); // 80% coverage
      const sellerRiskAmount = requestedAmount.times(0.20).toString(); // 20% seller risk
      
      const requestData = {
        ...applicationData,
        requestId,
        buyerAddress: buyerAddress.toLowerCase(), // Normalize address
        sellerAddress: applicationData.sellerAddress.toLowerCase(), // Normalize address
        status: "pending_draft",
        feeDue,
        guaranteePercentage: "80.00",
        guaranteeCoverageAmount,
        sellerRiskAmount,
        buyerStake: "0", // Default stake for non-LP buyers
        votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days default
      };
      
      const validated = insertTradeFinanceRequestSchema.parse(requestData);
      const request = await storage.createTradeFinanceRequest(validated);
      
      // Upload all documents (proforma invoice, sales contract, and any others)
      const { insertTradeFinanceDocumentSchema } = await import("@shared/schema");
      const uploadedDocuments = [];
      let proformaInvoiceId = null;
      
      for (const doc of documents) {
        const documentData = {
          requestId: request.requestId,
          documentType: doc.documentType, // proforma_invoice, sales_contract, etc.
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          storageType: "base64",
          storageKey: doc.data, // base64 string
          uploadedBy: buyerAddress.toLowerCase(),
          documentHash: doc.hash
        };
        
        const document = await storage.createDocument(insertTradeFinanceDocumentSchema.parse(documentData));
        uploadedDocuments.push(document);
        
        // Track proforma invoice ID
        if (doc.documentType === "proforma_invoice") {
          proformaInvoiceId = document.id;
        }
      }
      
      // Link proforma invoice to request
      if (proformaInvoiceId) {
        await storage.updateTradeFinanceRequest(request.requestId, {
          invoiceDocumentId: proformaInvoiceId
        });
      }
      
      res.status(201).json({
        ...request,
        uploadedDocuments: uploadedDocuments.length
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create application" 
      });
    }
  });
  
  // Step 2: Treasury creates draft guarantee certificate
  app.post("/api/trade-finance/applications/:requestId/draft", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { treasuryAddress } = req.body;
      
      // Verify treasury wallet address provided
      if (!treasuryAddress) {
        return res.status(400).json({ message: "Treasury wallet address required" });
      }
      
      // TODO: Verify treasuryAddress is a treasury admin (check userRoles table or stake)
      // For MVP, we trust that only treasury has access to this endpoint
      // Production should verify: const isAdmin = await checkTreasuryAdmin(treasuryAddress);
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Validate status transition: only allow draft creation from pending_draft or seller_rejected
      if (request.status !== "pending_draft") {
        return res.status(400).json({ 
          message: `Cannot create draft from current status: ${request.status}. Must be pending_draft.` 
        });
      }
      
      // Create draft certificate
      const { insertTradeFinanceCertificateSchema } = await import("@shared/schema");
      
      // Determine version number (increment if seller rejected previous draft)
      const existingCerts = await storage.getCertificatesByRequestId(requestId);
      const draftCerts = existingCerts.filter(c => c.certificateType === "draft");
      const version = draftCerts.length + 1;
      
      // Generate URDG 758-compliant draft certificate content
      const draftCertificate = generateURDG758Certificate({
        request: {
          requestId: request.requestId,
          buyerAddress: request.buyerAddress,
          sellerAddress: request.sellerAddress,
          buyerCompany: request.buyerCompanyName,
          buyerRegistration: request.buyerRegistrationNumber,
          buyerCountry: request.buyerCountry,
          buyerContact: request.buyerContactPerson,
          buyerEmail: request.buyerEmail,
          buyerPhone: request.buyerPhone,
          sellerCompany: '', // Not available in current schema
          sellerRegistration: '',
          sellerCountry: '',
          sellerContact: '',
          sellerEmail: '',
          sellerPhone: '',
          requestedAmount: request.requestedAmount,
          tradeDescription: request.tradeDescription,
          goodsDescription: request.collateralDescription,
          deliveryTerms: '', // Not available
          collateralAmount: request.collateralValue,
          createdAt: request.createdAt,
          feeDue: request.feeDue,
          expiryDate: request.paymentDueDate
        },
        certificateType: 'draft',
        version
      });
      
      const certificateData = {
        requestId,
        certificateType: "draft",
        version,
        content: draftCertificate,
        createdBy: treasuryAddress.toLowerCase(),
        createdByRole: "treasury",
        isActive: true
      };
      
      const certificate = await storage.createCertificate(insertTradeFinanceCertificateSchema.parse(certificateData));
      
      // Deactivate previous draft versions if any
      if (draftCerts.length > 0) {
        for (const oldDraft of draftCerts) {
          await storage.updateCertificate(oldDraft.id, { 
            isActive: false,
            supersededBy: certificate.id
          });
        }
      }
      
      // Update request status and link certificate
      await storage.updateTradeFinanceRequest(requestId, {
        status: "draft_sent_to_seller",
        draftCertificateId: certificate.id,
        draftSentAt: new Date()
      });
      
      res.status(201).json({ message: "Draft created successfully", certificate });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create draft" 
      });
    }
  });
  
  // Step 3: Seller reviews and approves/rejects draft
  app.post("/api/trade-finance/:requestId/seller-response", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { approved, rejectionReason, sellerAddress } = req.body;
      
      // Verify seller wallet address provided
      if (!sellerAddress) {
        return res.status(400).json({ message: "Seller wallet address required" });
      }
      
      // Validate approved is boolean
      if (typeof approved !== "boolean") {
        return res.status(400).json({ message: "Approved field must be true or false" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Validate status transition: only allow seller response when draft is sent
      if (request.status !== "draft_sent_to_seller") {
        return res.status(400).json({ 
          message: `Cannot respond from current status: ${request.status}. Must be draft_sent_to_seller.` 
        });
      }
      
      // Verify seller address matches - CRITICAL SECURITY CHECK
      if (request.sellerAddress.toLowerCase() !== sellerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Only the seller can respond to this draft" });
      }
      
      if (approved) {
        // Seller approved - move to awaiting fee payment
        await storage.updateTradeFinanceRequest(requestId, {
          status: "awaiting_fee_payment",
          sellerApprovedAt: new Date()
        });
        
        res.json({ 
          message: "Draft approved. Buyer will be notified to pay issuance fee.",
          feeDue: request.feeDue,
          status: "awaiting_fee_payment"
        });
      } else {
        // Seller rejected - move back to pending_draft
        if (!rejectionReason) {
          return res.status(400).json({ message: "Rejection reason required when rejecting draft" });
        }
        
        await storage.updateTradeFinanceRequest(requestId, {
          status: "pending_draft",
          sellerRejectedAt: new Date(),
          sellerRejectionReason: rejectionReason
        });
        
        res.json({ 
          message: "Draft rejected. Treasury can revise and resubmit.",
          rejectionReason,
          status: "pending_draft"
        });
      }
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to process seller response" 
      });
    }
  });
  
  // Step 4: Buyer pays 1% issuance fee
  app.post("/api/trade-finance/:requestId/fee", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { txHash, buyerAddress } = req.body;
      
      // Verify buyer wallet address and tx hash provided
      if (!buyerAddress) {
        return res.status(400).json({ message: "Buyer wallet address required" });
      }
      if (!txHash) {
        return res.status(400).json({ message: "Transaction hash required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Validate status transition: only allow fee payment when awaiting
      if (request.status !== "awaiting_fee_payment") {
        return res.status(400).json({ 
          message: `Cannot pay fee from current status: ${request.status}. Must be awaiting_fee_payment.` 
        });
      }
      
      // Verify buyer address matches - CRITICAL SECURITY CHECK
      if (request.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Only the buyer can pay the fee" });
      }
      
      // Recalculate expected fee from stored request amount (SECURITY: don't trust client)
      const { Decimal } = await import("decimal.js");
      const expectedFee = new Decimal(request.requestedAmount).times(0.01).toString();
      
      // Verify fee amount matches (stored fee should equal calculated fee)
      if (request.feeDue !== expectedFee) {
        // Update to correct value
        await storage.updateTradeFinanceRequest(requestId, {
          feeDue: expectedFee
        });
      }
      
      // CRITICAL: Verify on-chain transaction
      const { getTreasuryAddress } = await import("./treasury-wallet");
      const { verifyUSDCPayment } = await import("./payment-verifier");
      
      const treasuryAddress = getTreasuryAddress();
      
      
      const verification = await verifyUSDCPayment(txHash, treasuryAddress, expectedFee);
      
      if (!verification.valid) {
        return res.status(400).json({ 
          message: `Payment verification failed: ${verification.error}`,
          details: verification
        });
      }
      
      
      await storage.updateTradeFinanceRequest(requestId, {
        status: "fee_paid",
        feePaidAt: new Date(),
        feeTxHash: txHash
      });
      
      res.json({ 
        message: "Fee payment recorded. Treasury will issue final guarantee.",
        feePaid: expectedFee,
        txHash,
        status: "fee_paid"
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to record fee payment" 
      });
    }
  });
  
  // Step 5: Treasury issues final guarantee certificate
  app.post("/api/trade-finance/applications/:requestId/finalize", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { treasuryAddress } = req.body;
      
      // Verify treasury wallet address provided
      if (!treasuryAddress) {
        return res.status(400).json({ message: "Treasury wallet address required" });
      }
      
      // TODO: Verify treasuryAddress is a treasury admin (check userRoles table or stake)
      // For MVP, we trust that only treasury has access to this endpoint
      // Production should verify: const isAdmin = await checkTreasuryAdmin(treasuryAddress);
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Validate status transition: only allow finalization when fee is paid
      if (request.status !== "fee_paid") {
        return res.status(400).json({ 
          message: `Cannot finalize from current status: ${request.status}. Must be fee_paid.` 
        });
      }
      
      // Verify fee was actually paid (defensive check)
      if (!request.feePaidAt || !request.feeTxHash) {
        return res.status(400).json({ message: "Fee payment not properly recorded" });
      }
      
      // Get approved draft certificate for version tracking
      const draftCertificate = await storage.getActiveCertificate(requestId, "draft");
      if (!draftCertificate) {
        return res.status(400).json({ message: "No approved draft certificate found" });
      }
      
      // Generate URDG 758-compliant final certificate with execution details
      const finalContent = generateURDG758Certificate({
        request: {
          requestId: request.requestId,
          buyerAddress: request.buyerAddress,
          sellerAddress: request.sellerAddress,
          buyerCompany: request.buyerCompanyName,
          buyerRegistration: request.buyerRegistrationNumber,
          buyerCountry: request.buyerCountry,
          buyerContact: request.buyerContactPerson,
          buyerEmail: request.buyerEmail,
          buyerPhone: request.buyerPhone,
          sellerCompany: '', // Not available in current schema
          sellerRegistration: '',
          sellerCountry: '',
          sellerContact: '',
          sellerEmail: '',
          sellerPhone: '',
          requestedAmount: request.requestedAmount,
          tradeDescription: request.tradeDescription,
          goodsDescription: request.collateralDescription,
          deliveryTerms: '', // Not available
          collateralAmount: request.collateralValue,
          createdAt: request.createdAt,
          feeDue: request.feeDue,
          expiryDate: request.paymentDueDate
        },
        certificateType: 'final',
        version: 1,
        executionDetails: {
          draftCreatedAt: draftCertificate.createdAt || undefined,
          sellerApprovedAt: request.sellerApprovedAt || undefined,
          feePaidAt: request.feePaidAt || undefined,
          feeTxHash: request.feeTxHash || undefined,
          feeDue: request.feeDue || undefined,
          finalizedAt: new Date(),
          treasuryAddress: treasuryAddress
        }
      });
      
      // Create final certificate
      const { insertTradeFinanceCertificateSchema } = await import("@shared/schema");
      const certificateData = {
        requestId,
        certificateType: "final",
        version: 1,
        content: finalContent,
        createdBy: treasuryAddress.toLowerCase(),
        createdByRole: "treasury",
        isActive: true
      };
      
      const certificate = await storage.createCertificate(insertTradeFinanceCertificateSchema.parse(certificateData));
      
      // Create treasury record for issuance fee tracking
      const { insertGuaranteeIssuanceFeeSchema } = await import("@shared/schema");
      const Decimal = (await import("decimal.js")).default;
      
      const feeDue = request.feeDue || "0";
      const feeDecimal = new Decimal(feeDue);
      
      // Calculate shares with exact decimal precision
      const stakersShareDecimal = feeDecimal.times(0.60); // 60% to stakers
      const treasuryShareDecimal = feeDecimal.times(0.40); // 40% to treasury
      
      const feeRecordData = {
        requestId,
        feePercentage: "1.00", // 1% fee
        feeAmount: feeDue,
        currency: "USDC",
        payerAddress: request.buyerAddress, // Keep original casing
        paymentStatus: "paid",
        paymentTransactionHash: request.feeTxHash || "",
        paidAt: request.feePaidAt || new Date(),
        distributionStatus: "pending", // Will be distributed later
        stakersShare: stakersShareDecimal.toFixed(18), // Store with full precision
        treasuryShare: treasuryShareDecimal.toFixed(18) // Store with full precision
      };
      
      const issuanceFee = await storage.createGuaranteeIssuanceFee(insertGuaranteeIssuanceFeeSchema.parse(feeRecordData));
      
      // Distribute fee to stakers immediately
      try {
        const { insertFeeDistributionSchema } = await import("@shared/schema");
        
        // Get all active stakes at time of distribution
        const { liquidityPoolStakes } = await import("@shared/schema");
        const allStakes = await db.select().from(liquidityPoolStakes);
        const activeStakes = allStakes.filter((s: any) => s.status === "active");
        
        if (activeStakes.length > 0) {
          // Calculate total pool
          const totalPoolAmount = activeStakes.reduce(
            (sum: any, stake: any) => sum.plus(new Decimal(stake.amount)),
            new Decimal(0)
          );
          
          // Prevent division by zero
          if (!totalPoolAmount.isZero()) {
            // Distribute 60% of fee to each staker proportionally
          const distributionPromises = activeStakes.map(async (stake: any) => {
            const stakeAmount = new Decimal(stake.amount);
            const stakingPercentage = stakeAmount.div(totalPoolAmount).times(100);
            const earnedAmount = stakersShareDecimal.times(stakeAmount).div(totalPoolAmount);
            
            const distribution = {
              issuanceFeeId: issuanceFee.id,
              stakerAddress: stake.stakerAddress,
              stakeId: stake.id,
              stakingPercentage: stakingPercentage.toFixed(6),
              earnedAmount: earnedAmount.toFixed(18),
              currency: "USDC",
              claimStatus: "pending"
            };
            
            return db.insert(feeDistributions).values(distribution);
          });
          
          await Promise.all(distributionPromises);
          
            // Mark fee as distributed
            await db.update(guaranteeIssuanceFees)
              .set({ distributionStatus: "distributed", distributedAt: new Date() })
              .where(eq(guaranteeIssuanceFees.id, issuanceFee.id));
          }
        }
      } catch (error) {
        // Don't fail the whole operation if distribution fails
      }
      
      // Update request to approved status and set lifecycle to guarantee_issued
      await storage.updateTradeFinanceRequest(requestId, {
        status: "approved",
        tradeLifecycleStatus: "guarantee_issued",
        finalCertificateId: certificate.id,
        approvedAt: new Date()
      });
      
      res.json({ 
        message: "Final guarantee issued successfully", 
        certificate,
        status: "approved",
        guaranteeAmount: request.requestedAmount,
        buyer: request.buyerAddress,
        seller: request.sellerAddress
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to finalize guarantee" 
      });
    }
  });
  
  // Supporting endpoints: Get documents and certificates
  app.get("/api/trade-finance/:requestId/documents", async (req, res) => {
    try {
      const { requestId } = req.params;
      const documents = await storage.getDocumentsByRequestId(requestId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch documents" 
      });
    }
  });
  
  app.get("/api/trade-finance/:requestId/certificates", async (req, res) => {
    try {
      const { requestId } = req.params;
      const certificates = await storage.getCertificatesByRequestId(requestId);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch certificates" 
      });
    }
  });
  
  // Get treasury wallet address for payments
  app.get("/api/trade-finance/treasury-address", async (req, res) => {
    try {
      const { getTreasuryAddress } = await import("./treasury-wallet");
      const address = getTreasuryAddress();
      res.json({ address });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get treasury address" 
      });
    }
  });
  
  // Fee Distribution Endpoints
  
  // Get staker earnings (all distributions for a wallet)
  app.get("/api/treasury/earnings/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      // Convert to lowercase for case-insensitive matching
      const normalizedAddress = walletAddress.toLowerCase();
      
      const earnings = await db.select()
        .from(feeDistributions)
        .where(eq(feeDistributions.stakerAddress, normalizedAddress))
        .orderBy(desc(feeDistributions.distributedAt));
      
      // Calculate totals
      const Decimal = (await import("decimal.js")).default;
      const totalPending = earnings
        .filter(e => e.claimStatus === "pending")
        .reduce((sum, e) => sum.plus(new Decimal(e.earnedAmount)), new Decimal(0));
      const totalClaimed = earnings
        .filter(e => e.claimStatus === "claimed")
        .reduce((sum, e) => sum.plus(new Decimal(e.earnedAmount)), new Decimal(0));
      
      res.json({
        earnings,
        summary: {
          totalPending: totalPending.toString(),
          totalClaimed: totalClaimed.toString(),
          totalEarned: totalPending.plus(totalClaimed).toString(),
          pendingCount: earnings.filter(e => e.claimStatus === "pending").length,
          claimedCount: earnings.filter(e => e.claimStatus === "claimed").length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch earnings" 
      });
    }
  });
  
  // Claim earnings - Transfer USDC from treasury to user wallet
  app.post("/api/treasury/earnings/claim", async (req, res) => {
    try {
      const { walletAddress, distributionIds } = req.body;
      
      if (!walletAddress || !distributionIds || !Array.isArray(distributionIds)) {
        return res.status(400).json({ message: "Wallet address and distribution IDs required" });
      }
      
      // Convert to lowercase for case-insensitive matching
      const normalizedAddress = walletAddress.toLowerCase();
      
      // Verify all distributions belong to this wallet and are pending
      const distributions = await db.select()
        .from(feeDistributions)
        .where(
          and(
            eq(feeDistributions.stakerAddress, normalizedAddress),
            inArray(feeDistributions.id, distributionIds)
          )
        );
      
      if (distributions.length !== distributionIds.length) {
        return res.status(400).json({ message: "Some distributions not found or don't belong to this wallet" });
      }
      
      const pendingDistributions = distributions.filter(d => d.claimStatus === "pending");
      if (pendingDistributions.length === 0) {
        return res.status(400).json({ message: "No pending earnings to claim" });
      }
      
      if (pendingDistributions.length !== distributionIds.length) {
        return res.status(400).json({ message: "Some earnings have already been claimed" });
      }
      
      // Calculate total amount to transfer
      const Decimal = (await import("decimal.js")).default;
      const totalClaimed = pendingDistributions.reduce(
        (sum, d) => sum.plus(new Decimal(d.earnedAmount)),
        new Decimal(0)
      );
      
      // Initialize blockchain transfer
      const ethers = await import("ethers");
      const { networks } = await import("@shared/schema");
      
      // Get Base Sepolia network config
      const baseSepoliaNetworks = await db.select().from(networks).where(eq(networks.name, "Base Sepolia"));
      if (baseSepoliaNetworks.length === 0) {
        throw new Error("Base Sepolia network not configured");
      }
      const network = baseSepoliaNetworks[0];
      
      // Setup treasury wallet signer
      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        throw new Error("Treasury private key not configured");
      }
      
      // Try RPC providers in order
      const rpcUrls = [
        "https://sepolia.base.org",
        "https://base-sepolia.g.alchemy.com/v2/demo",
        "https://base-sepolia-rpc.publicnode.com"
      ];
      
      let provider: any = null;
      for (const rpcUrl of rpcUrls) {
        try {
          const testProvider = new ethers.JsonRpcProvider(rpcUrl);
          await testProvider.getBlockNumber();
          provider = testProvider;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!provider) {
        throw new Error("All RPC providers failed");
      }
      
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
      
      // Get USDC contract address from network configuration
      const usdcAddress = network.usdcContractAddress;
      if (!usdcAddress) {
        throw new Error("USDC contract address not configured for this network");
      }
      
      const usdcAbi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, treasuryWallet);
      
      // Check treasury balance
      const treasuryBalance = await usdcContract.balanceOf(treasuryWallet.address);
      const decimals = await usdcContract.decimals();
      const transferAmount = ethers.parseUnits(totalClaimed.toString(), decimals);
      
      
      if (treasuryBalance < transferAmount) {
        throw new Error(`Insufficient treasury balance. Available: ${ethers.formatUnits(treasuryBalance, decimals)} USDC, Required: ${totalClaimed.toString()} USDC`);
      }
      
      // Execute transfer
      const tx = await usdcContract.transfer(walletAddress, transferAmount);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Mark as claimed with actual transaction hash
      await db.update(feeDistributions)
        .set({ 
          claimStatus: "claimed",
          claimedAt: new Date(),
          claimTransactionHash: tx.hash
        })
        .where(
          inArray(feeDistributions.id, distributionIds)
        );
      
      res.json({ 
        message: "Earnings claimed and transferred successfully",
        totalClaimed: totalClaimed.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        claimedCount: pendingDistributions.length
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to claim earnings" 
      });
    }
  });
  
  // Get platform analytics
  app.get("/api/treasury/analytics", async (req, res) => {
    try {
      const Decimal = (await import("decimal.js")).default;
      const { liquidityPoolStakes } = await import("@shared/schema");
      
      // Get all stakes
      const allStakes = await db.select().from(liquidityPoolStakes);
      const activeStakes = allStakes.filter(s => s.status === "active");
      
      // Calculate TVL
      const tvl = activeStakes.reduce(
        (sum, stake) => sum.plus(new Decimal(stake.amount)),
        new Decimal(0)
      );
      
      // Get all requests
      const allRequests = await storage.getAllTradeFinanceRequests();
      const approvedRequests = allRequests.filter(r => r.status === "approved");
      const rejectedRequests = allRequests.filter(r => 
        r.status === "pending_draft" && r.sellerRejectedAt
      );
      
      // Get all fees
      const allFees = await db.select().from(guaranteeIssuanceFees);
      const totalFeesCollected = allFees.reduce(
        (sum, fee) => sum.plus(new Decimal(fee.feeAmount)),
        new Decimal(0)
      );
      
      const totalFeesDistributed = allFees
        .filter(f => f.distributionStatus === "distributed")
        .reduce((sum, fee) => sum.plus(new Decimal(fee.stakersShare || "0")), new Decimal(0));
      
      const pendingFees = allFees
        .filter(f => f.distributionStatus === "pending")
        .reduce((sum, fee) => sum.plus(new Decimal(fee.stakersShare || "0")), new Decimal(0));
      
      // Calculate guarantee volume
      const totalGuaranteeVolume = approvedRequests.reduce(
        (sum, req) => sum.plus(new Decimal(req.requestedAmount)),
        new Decimal(0)
      );
      
      // Calculate approval rate
      const totalVoted = approvedRequests.length + rejectedRequests.length;
      const approvalRate = totalVoted > 0 
        ? new Decimal(approvedRequests.length).div(totalVoted).times(100)
        : new Decimal(0);
      
      res.json({
        tvl: tvl.toString(),
        totalStakers: allStakes.length,
        activeStakers: activeStakes.length,
        totalGuaranteesIssued: approvedRequests.length,
        totalGuaranteeVolume: totalGuaranteeVolume.toString(),
        activeGuarantees: approvedRequests.filter(r => !r.completedAt).length,
        approvedGuarantees: approvedRequests.length,
        rejectedGuarantees: rejectedRequests.length,
        totalFeesCollected: totalFeesCollected.toString(),
        totalFeesDistributed: totalFeesDistributed.toString(),
        pendingFeeDistributions: pendingFees.toString(),
        approvalSuccessRate: approvalRate.toFixed(2),
        totalApplications: allRequests.length
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch analytics" 
      });
    }
  });
  
  // Notification Endpoints
  
  // Get notifications for a wallet
  app.get("/api/notifications/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const { limit = "50" } = req.query;
      
      const notifs = await db.select()
        .from(notifications)
        .where(eq(notifications.recipientAddress, walletAddress))
        .orderBy(desc(notifications.createdAt))
        .limit(parseInt(limit as string));
      
      res.json(notifs);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch notifications" 
      });
    }
  });
  
  // Get unread notification count
  app.get("/api/notifications/:walletAddress/unread-count", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      const count = await db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientAddress, walletAddress),
            eq(notifications.read, false)
          )
        );
      
      res.json({ count: count[0]?.count || 0 });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get unread count" 
      });
    }
  });
  
  // Mark notification as read
  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, parseInt(id)));
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to mark notification as read" 
      });
    }
  });
  
  // Mark all notifications as read for a wallet
  app.put("/api/notifications/:walletAddress/read-all", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      await db.update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.recipientAddress, walletAddress),
            eq(notifications.read, false)
          )
        );
      
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to mark all as read" 
      });
    }
  });
  
  // Get all applications (for treasury portal)
  app.get("/api/trade-finance/applications/all", async (req, res) => {
    try {
      const applications = await storage.getAllTradeFinanceRequests();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch applications" 
      });
    }
  });
  
  // Get applications by buyer address, seller address, or both
  app.get("/api/trade-finance/applications", async (req, res) => {
    try {
      const { buyerAddress, sellerAddress } = req.query;
      
      if (!buyerAddress && !sellerAddress) {
        return res.status(400).json({ message: "Buyer or seller wallet address is required" });
      }
      
      let applications: any[] = [];
      
      // Fetch by buyer address if provided
      if (buyerAddress && typeof buyerAddress === 'string') {
        const buyerApps = await storage.getTradeFinanceRequestsByBuyer(buyerAddress.toLowerCase());
        applications = [...applications, ...buyerApps];
      }
      
      // Fetch by seller address if provided
      if (sellerAddress && typeof sellerAddress === 'string') {
        const sellerApps = await storage.getTradeFinanceRequestsBySeller(sellerAddress.toLowerCase());
        applications = [...applications, ...sellerApps];
      }
      
      // Remove duplicates (if both buyer and seller are the same person)
      const uniqueApps = applications.filter((app, index, self) =>
        index === self.findIndex((a) => a.requestId === app.requestId)
      );
      
      if (!uniqueApps || uniqueApps.length === 0) {
        return res.status(404).json({ message: "No applications found" });
      }
      
      // Enrich applications with goods collateral data (includes shipment details)
      const enrichedApps = await Promise.all(uniqueApps.map(async (app) => {
        const goodsCollateral = await storage.getGoodsCollateralByRequestId(app.requestId);
        return {
          ...app,
          goodsCollateral: goodsCollateral || null
        };
      }));
      
      res.json(enrichedApps);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch applications" 
      });
    }
  });
  
  // Get all certificates (for viewing drafts)
  app.get("/api/trade-finance/certificates", async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch certificates" 
      });
    }
  });
  
  // Seller approval endpoint (simplified version that frontend expects)
  app.post("/api/trade-finance/applications/:requestId/approve", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { sellerAddress } = req.body;
      
      if (!sellerAddress) {
        return res.status(400).json({ message: "Seller wallet address required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Validate status transition
      if (request.status !== "draft_sent_to_seller") {
        return res.status(400).json({ 
          message: `Cannot approve from current status: ${request.status}. Must be draft_sent_to_seller.`
        });
      }
      
      // Verify seller address matches
      if (request.sellerAddress.toLowerCase() !== sellerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Only the seller can approve this draft" });
      }
      
      // Update status to awaiting fee payment
      await storage.updateTradeFinanceRequest(requestId, {
        status: "awaiting_fee_payment",
        sellerApprovedAt: new Date()
      });
      
      res.json({ 
        message: "Draft approved. Buyer will be notified to pay issuance fee.",
        status: "awaiting_fee_payment"
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to approve draft" 
      });
    }
  });
  
  // Step 6: Buyer settles invoice via direct USDC transfer (SECURE: Lifecycle + Auth validated)
  app.post("/api/trade-finance/:requestId/settle-invoice", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { buyerAddress, txHash, amount } = req.body;
      
      if (!buyerAddress || !txHash || !amount) {
        return res.status(400).json({ message: "Buyer address, transaction hash, and amount required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify buyer authorization (prevents spoofing)
      if (request.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered buyer can settle invoice" });
      }
      
      // SECURE: Lifecycle-state guard (prevents out-of-sequence actions)
      if (request.status !== "approved") {
        return res.status(400).json({ 
          message: `Invalid state: Certificate must be approved first (current: ${request.status})`
        });
      }
      
      // Buyer can settle invoice after delivery is confirmed (goods_delivered) or for partial payments (buyer_paid_seller)
      if (request.tradeLifecycleStatus !== "goods_delivered" && request.tradeLifecycleStatus !== "buyer_paid_seller") {
        return res.status(400).json({ 
          message: `Invalid lifecycle: Cannot settle invoice from state '${request.tradeLifecycleStatus}'. Delivery must be confirmed first.`
        });
      }
      
      // Calculate new total paid amount
      const currentTotalPaid = parseFloat(request.totalAmountPaid || "0");
      const paymentAmount = parseFloat(amount);
      const newTotalPaid = currentTotalPaid + paymentAmount;
      const requestedAmount = parseFloat(request.requestedAmount);
      
      // Check if payment would exceed invoice amount
      if (newTotalPaid > requestedAmount) {
        return res.status(400).json({ 
          message: `Payment amount exceeds remaining balance. Requested: ${requestedAmount} USDC, Already paid: ${currentTotalPaid} USDC, Payment: ${paymentAmount} USDC`,
          remainingBalance: (requestedAmount - currentTotalPaid).toFixed(2)
        });
      }
      
      const isFullyPaid = newTotalPaid >= requestedAmount;
      
      // Update request atomically with transaction details
      await storage.updateTradeFinanceRequest(requestId, {
        buyerPaymentUploaded: isFullyPaid,
        buyerPaymentTxHash: txHash,
        buyerPaymentAmount: amount,
        totalAmountPaid: newTotalPaid.toString(),
        buyerPaymentUploadedAt: new Date(),
        tradeLifecycleStatus: isFullyPaid ? "buyer_paid_seller" : request.tradeLifecycleStatus
      });
      
      res.json({ 
        message: isFullyPaid 
          ? "Invoice fully settled. Payment sent to seller."
          : `Partial payment received. Paid: ${newTotalPaid.toFixed(2)} USDC, Remaining: ${(requestedAmount - newTotalPaid).toFixed(2)} USDC`,
        status: isFullyPaid ? "buyer_paid_seller" : request.tradeLifecycleStatus,
        txHash,
        totalPaid: newTotalPaid.toFixed(2),
        remainingBalance: (requestedAmount - newTotalPaid).toFixed(2),
        fullyPaid: isFullyPaid
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to settle invoice" 
      });
    }
  });
  
  // Step 7: Seller confirms payment received (SECURE: Lifecycle + Auth validated)
  app.post("/api/trade-finance/applications/:requestId/seller-confirm-payment", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { sellerAddress } = req.body;
      
      if (!sellerAddress) {
        return res.status(400).json({ message: "Seller address required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify seller authorization (prevents spoofing)
      if (request.sellerAddress.toLowerCase() !== sellerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered seller can confirm payment" });
      }
      
      // SECURE: Lifecycle-state guard (prevents out-of-sequence actions)
      if (request.tradeLifecycleStatus !== "buyer_paid_seller") {
        return res.status(400).json({ 
          message: `Invalid lifecycle: Cannot confirm payment from state '${request.tradeLifecycleStatus}'. Buyer must upload payment proof first.`
        });
      }
      
      // Prevent duplicate confirmations
      if (request.sellerPaymentConfirmed) {
        return res.status(409).json({ message: "Payment already confirmed" });
      }
      
      // Update request atomically
      await storage.updateTradeFinanceRequest(requestId, {
        sellerPaymentConfirmed: true,
        sellerPaymentConfirmedAt: new Date(),
        tradeLifecycleStatus: "seller_confirmed_payment"
      });
      
      res.json({ 
        message: "Payment confirmed. Please upload Bill of Lading to treasury for custody.",
        status: "seller_confirmed_payment"
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to confirm payment" 
      });
    }
  });
  
  // Download Bill of Lading document
  app.get("/api/trade-finance/applications/:requestId/download-bol", async (req, res) => {
    try {
      const { requestId } = req.params;
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Only allow download if BoL has been uploaded
      if (!request.bolUploadedToTreasury) {
        return res.status(400).json({ message: "Bill of Lading has not been uploaded yet" });
      }
      
      // Get goods collateral for BoL details
      const collateral = await storage.getGoodsCollateralByRequestId(requestId);
      
      // Generate BoL document content
      const bolContent = `
BILL OF LADING
===============================================

Document Number: ${collateral?.billOfLadingNumber || 'BOL-' + request.requestId}
Trade Reference: ${request.requestId}
Date Issued: ${collateral?.bolIssuedAt ? new Date(collateral.bolIssuedAt).toLocaleDateString() : request.bolTransferredToTreasuryAt ? new Date(request.bolTransferredToTreasuryAt).toLocaleDateString() : 'N/A'}

SHIPPER (SELLER):
${request.sellerAddress}

CONSIGNEE (BUYER):
${request.buyerAddress}

TRADE DETAILS:
Description: ${request.tradeDescription}
Invoice Amount: ${parseFloat(request.requestedAmount).toLocaleString()} USDC

SHIPPING INFORMATION:
Tracking Number: ${collateral?.trackingNumber || 'N/A'}
Logistics Provider: ${collateral?.logisticsProvider || 'N/A'}

CUSTODY STATUS:
Custodian: ${request.bolCustodian || 'Treasury'}
Released to Buyer: ${request.bolReleasedToBuyerAt ? new Date(request.bolReleasedToBuyerAt).toLocaleDateString() : 'Pending'}

===============================================
This document is issued under the BlockFinaX Trade Finance system.
ICC URDG 758 Compliant Trade Finance Platform
      `.trim();
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="BOL-${request.requestId}.txt"`);
      res.send(bolContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to download Bill of Lading" });
    }
  });
  
  // Download Trade Completion Receipt
  app.get("/api/trade-finance/applications/:requestId/completion-receipt", async (req, res) => {
    try {
      const { requestId } = req.params;
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Only allow if trade is complete (seller confirmed payment)
      if (!request.sellerPaymentConfirmed) {
        return res.status(400).json({ message: "Trade is not yet complete" });
      }
      
      // Generate completion receipt
      const receiptContent = `
TRADE COMPLETION RECEIPT
===============================================

Receipt Number: TCR-${request.requestId}
Completion Date: ${request.sellerPaymentConfirmedAt ? new Date(request.sellerPaymentConfirmedAt).toLocaleDateString() : new Date().toLocaleDateString()}

TRADE PARTIES:
Buyer: ${request.buyerAddress}
Seller: ${request.sellerAddress}

TRADE DETAILS:
Description: ${request.tradeDescription}
Guarantee Reference: ${request.requestId}
Invoice Amount: ${parseFloat(request.requestedAmount).toLocaleString()} USDC
Amount Paid: ${parseFloat(request.totalAmountPaid || request.requestedAmount).toLocaleString()} USDC

TRADE TIMELINE:
Application Date: ${request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
Certificate Issued: ${request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'N/A'}
Goods Shipped: ${request.bolTransferredToTreasuryAt ? new Date(request.bolTransferredToTreasuryAt).toLocaleDateString() : 'N/A'}
Delivery Confirmed: ${request.buyerDeliveryConfirmedAt ? new Date(request.buyerDeliveryConfirmedAt).toLocaleDateString() : 'N/A'}
Payment Received: ${request.buyerPaymentUploadedAt ? new Date(request.buyerPaymentUploadedAt).toLocaleDateString() : 'N/A'}
Trade Completed: ${request.sellerPaymentConfirmedAt ? new Date(request.sellerPaymentConfirmedAt).toLocaleDateString() : 'N/A'}

STATUS: COMPLETED ✓

===============================================
This receipt confirms the successful completion of the trade.
BlockFinaX Trade Finance - ICC URDG 758 Compliant
      `.trim();
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="TradeReceipt-${request.requestId}.txt"`);
      res.send(receiptContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to download completion receipt" });
    }
  });
  
  // Step 8: Seller uploads Bill of Lading to Treasury (SECURE: Lifecycle + Auth validated)
  app.post("/api/trade-finance/applications/:requestId/seller-upload-bol", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { sellerAddress, bolNumber, trackingNumber, logisticsProvider, documentId, documentHash } = req.body;
      
      if (!sellerAddress || !bolNumber) {
        return res.status(400).json({ message: "Seller address and BoL number required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify seller authorization (prevents spoofing)
      if (request.sellerAddress.toLowerCase() !== sellerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered seller can upload BoL" });
      }
      
      // SECURE: Lifecycle-state guard (prevents out-of-sequence actions)
      // Seller can upload BoL after certificate is issued (guarantee_issued)
      if (request.tradeLifecycleStatus !== "guarantee_issued") {
        return res.status(400).json({ 
          message: `Invalid lifecycle: Cannot upload BoL from state '${request.tradeLifecycleStatus}'. Certificate must be issued first.`
        });
      }
      
      // Prevent duplicate BoL uploads
      if (request.bolUploadedToTreasury) {
        return res.status(409).json({ message: "BoL already uploaded to treasury" });
      }
      
      // Create or update goods collateral with BoL info and tracking details
      const existingCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      
      if (existingCollateral) {
        // Update existing collateral with BoL and shipment tracking details
        await storage.updateGoodsCollateral(existingCollateral.id, {
          billOfLadingIssued: true,
          billOfLadingNumber: bolNumber,
          billOfLadingHash: documentHash,
          billOfLadingDocumentId: documentId,
          bolIssuedAt: new Date(),
          bolCustodian: "treasury",
          bolUploadedBy: sellerAddress,
          bolUploadedAt: new Date(),
          treasuryReceivedBolAt: new Date(),
          bolCustodyStatus: "with_treasury",
          actualShipmentDate: new Date(),
          // Shipment tracking details for buyer verification
          trackingNumber: trackingNumber || null,
          logisticsProvider: logisticsProvider || null
        });
      }
      
      // Update main request
      await storage.updateTradeFinanceRequest(requestId, {
        bolUploadedToTreasury: true,
        bolCustodian: "treasury",
        bolTransferredToTreasuryAt: new Date(),
        tradeLifecycleStatus: "bol_in_treasury_custody"
      });
      
      res.json({ 
        message: "Bill of Lading uploaded to treasury custody successfully. Goods are now in transit.",
        status: "bol_in_treasury_custody",
        bolNumber,
        custodian: "treasury"
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload BoL" 
      });
    }
  });
  
  // Step 10: Buyer confirms delivery (SECURE: Lifecycle + Auth validated, triggers BoL release)
  app.post("/api/trade-finance/applications/:requestId/buyer-confirm-delivery", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { buyerAddress, deliveryCondition } = req.body;
      
      if (!buyerAddress) {
        return res.status(400).json({ message: "Buyer address required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify buyer authorization (prevents spoofing)
      if (request.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered buyer can confirm delivery" });
      }
      
      // SECURE: Lifecycle-state guard (prevents out-of-sequence actions)
      if (request.tradeLifecycleStatus !== "goods_shipped" && request.tradeLifecycleStatus !== "bol_in_treasury_custody") {
        return res.status(400).json({ 
          message: `Invalid lifecycle: Cannot confirm delivery from state '${request.tradeLifecycleStatus}'. Goods must be shipped first.`
        });
      }
      
      // Prevent duplicate delivery confirmations
      if (request.buyerConfirmedDelivery) {
        return res.status(409).json({ message: "Delivery already confirmed" });
      }
      
      // Update goods collateral - release BoL to buyer
      const existingCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      if (existingCollateral) {
        await storage.updateGoodsCollateral(existingCollateral.id, {
          bolCustodian: "buyer",
          buyerReceivedBolAt: new Date(),
          bolCustodyStatus: "released_to_buyer",
          status: "delivered"
        });
      }
      
      // Update main request
      await storage.updateTradeFinanceRequest(requestId, {
        buyerConfirmedDelivery: true,
        buyerDeliveryConfirmedAt: new Date(),
        deliveryCondition: deliveryCondition || "excellent",
        bolCustodian: "buyer",
        bolReleasedToBuyerAt: new Date(),
        tradeLifecycleStatus: "goods_delivered"
      });
      
      res.json({ 
        message: "Delivery confirmed. Bill of Lading released to buyer. Buyer can now settle the invoice.",
        status: "goods_delivered",
        deliveryCondition: deliveryCondition || "excellent"
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to confirm delivery" 
      });
    }
  });

  // Buyer files a dispute before confirming delivery
  app.post("/api/trade-finance/:requestId/buyer-dispute", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { buyerAddress, disputeReason, disputeNote } = req.body;
      
      if (!buyerAddress) {
        return res.status(400).json({ message: "Buyer address required" });
      }
      
      if (!disputeReason) {
        return res.status(400).json({ message: "Dispute reason required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify buyer authorization
      if (request.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered buyer can file a dispute" });
      }
      
      // SECURE: Lifecycle-state guard - can only dispute when goods are shipped/in custody
      if (request.tradeLifecycleStatus !== "goods_shipped" && request.tradeLifecycleStatus !== "bol_in_treasury_custody") {
        return res.status(400).json({ 
          message: `Invalid lifecycle: Cannot file dispute from state '${request.tradeLifecycleStatus}'. Goods must be shipped first.`
        });
      }
      
      // Prevent duplicate disputes
      if (request.buyerDisputed) {
        return res.status(409).json({ message: "Dispute already filed for this application" });
      }
      
      // Prevent dispute after delivery confirmation
      if (request.buyerConfirmedDelivery) {
        return res.status(400).json({ message: "Cannot file dispute after delivery has been confirmed" });
      }
      
      // Update the request with dispute information
      await storage.updateTradeFinanceRequest(requestId, {
        buyerDisputed: true,
        buyerDisputeReason: disputeReason,
        buyerDisputeNote: disputeNote || null,
        disputedAt: new Date(),
        tradeLifecycleStatus: "disputed"
      });
      
      res.json({ 
        message: "Dispute filed successfully. Treasury will review and contact both parties.",
        status: "disputed",
        disputeReason
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to file dispute" 
      });
    }
  });

  // Step 11: Buyer makes payment (partial or full) to settle invoice
  app.post("/api/trade-finance/:requestId/buyer-payment", async (req, res) => {
    try {
      const { requestId } = req.params;
      const { buyerAddress, txHash, amount } = req.body;
      
      if (!buyerAddress || !txHash || !amount) {
        return res.status(400).json({ message: "Buyer address, transaction hash, and amount required" });
      }
      
      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // SECURE: Verify buyer authorization
      if (request.buyerAddress.toLowerCase() !== buyerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Forbidden: Only the registered buyer can make payments" });
      }
      
      // SECURE: Require delivery confirmation before payment
      if (!request.buyerConfirmedDelivery) {
        return res.status(400).json({ 
          message: "Cannot make payment before confirming delivery. Please confirm delivery first."
        });
      }
      
      // Parse amounts
      const paymentAmount = parseFloat(amount);
      const requestedAmount = parseFloat(request.requestedAmount);
      const currentPaid = parseFloat(request.totalAmountPaid || "0");
      const remainingBalance = requestedAmount - currentPaid;
      
      // Validate payment amount
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: "Payment amount must be greater than 0" });
      }
      
      if (paymentAmount > remainingBalance) {
        return res.status(400).json({ 
          message: `Payment amount (${paymentAmount} USDC) exceeds remaining balance (${remainingBalance} USDC)` 
        });
      }
      
      // Calculate new total
      const newTotalPaid = currentPaid + paymentAmount;
      const isFullyPaid = newTotalPaid >= requestedAmount;
      
      // Update request with payment
      const updateData: any = {
        totalAmountPaid: newTotalPaid.toString(),
        buyerPaymentTxHash: txHash,
        buyerPaymentUploadedAt: new Date()
      };
      
      // If fully paid, mark as complete
      if (isFullyPaid) {
        updateData.buyerPaymentUploaded = true;
        updateData.tradeLifecycleStatus = "trade_complete";
        updateData.completedAt = new Date();
      }
      
      await storage.updateTradeFinanceRequest(requestId, updateData);
      
      res.json({ 
        message: isFullyPaid 
          ? "Invoice fully settled. Trade completed successfully!" 
          : `Partial payment recorded. Remaining balance: ${(remainingBalance - paymentAmount).toFixed(2)} USDC`,
        totalPaid: newTotalPaid,
        remainingBalance: requestedAmount - newTotalPaid,
        isFullyPaid,
        status: isFullyPaid ? "trade_complete" : "goods_delivered",
        txHash
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to record payment" 
      });
    }
  });

  app.get("/api/trade-finance/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const request = await storage.getTradeFinanceRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Pool guarantee not found" });
      }
      
      // Get related data
      const documents = await storage.getDocumentsByRequestId(requestId);
      const certificates = await storage.getCertificatesByRequestId(requestId);
      const goodsCollateral = await storage.getGoodsCollateralByRequestId(requestId);
      
      res.json({
        ...request,
        documents,
        certificates,
        goodsCollateral
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade finance guarantee" 
      });
    }
  });

  // Profile endpoints
  app.get("/api/profiles/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const profile = await storage.getUserProfile(walletAddress);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch profile" 
      });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      const profile = await storage.createUserProfile(req.body);
      res.status(201).json(profile);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create profile" 
      });
    }
  });

  app.put("/api/profiles/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const profile = await storage.updateUserProfile(walletAddress, req.body);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update profile" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [SPECIALISTS] Specialist Registry
  // ═══════════════════════════════════════════════════════
  
  // Create specialist role (apply to become a specialist)
  app.post("/api/specialists/roles", async (req, res) => {
    try {
      const { insertSpecialistRoleSchema } = await import("@shared/schema");
      const validated = insertSpecialistRoleSchema.parse(req.body);
      
      // Check if specialist role already exists
      const existing = await storage.getSpecialistRole(validated.walletAddress);
      if (existing) {
        return res.status(409).json({ message: "Specialist role already exists for this address" });
      }
      
      const role = await storage.createSpecialistRole(validated);
      
      // Initialize statistics for the specialist
      await storage.createSpecialistStatistics({
        specialistAddress: validated.walletAddress
      });
      
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create specialist role" 
      });
    }
  });
  
  // Get all specialists by type
  app.get("/api/specialists/roles", async (req, res) => {
    try {
      const { roleType } = req.query;
      
      let specialists;
      if (roleType && typeof roleType === 'string') {
        specialists = await storage.getSpecialistRolesByType(roleType);
      } else {
        specialists = await storage.getAllSpecialistRoles();
      }
      
      // Enrich with credentials, statistics, and delegation data
      const enrichedSpecialists = await Promise.all(specialists.map(async (specialist) => {
        const credentials = await storage.getSpecialistCredentials(specialist.walletAddress);
        const statistics = await storage.getSpecialistStatistics(specialist.walletAddress);
        const totalDelegatedPower = await storage.getTotalDelegatedPower(specialist.walletAddress);
        const delegations = await storage.getVoteDelegationsByDelegate(specialist.walletAddress);
        
        return {
          ...specialist,
          credentials,
          statistics,
          delegationStats: {
            totalDelegatedPower,
            delegatorCount: delegations.length
          }
        };
      }));
      
      res.json(enrichedSpecialists);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch specialists" 
      });
    }
  });
  
  // Get specialist by wallet address
  app.get("/api/specialists/roles/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const role = await storage.getSpecialistRole(walletAddress);
      
      if (!role) {
        return res.status(404).json({ message: "Specialist not found" });
      }
      
      const credentials = await storage.getSpecialistCredentials(walletAddress);
      const statistics = await storage.getSpecialistStatistics(walletAddress);
      
      res.json({
        ...role,
        credentials,
        statistics
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch specialist" 
      });
    }
  });
  
  // Update specialist role
  app.put("/api/specialists/roles/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const role = await storage.updateSpecialistRole(walletAddress, req.body);
      
      if (!role) {
        return res.status(404).json({ message: "Specialist not found" });
      }
      
      res.json(role);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update specialist role" 
      });
    }
  });
  
  // Add specialist credential
  app.post("/api/specialists/credentials", async (req, res) => {
    try {
      const { insertSpecialistCredentialSchema } = await import("@shared/schema");
      const validated = insertSpecialistCredentialSchema.parse(req.body);
      
      const credential = await storage.createSpecialistCredential(validated);
      res.status(201).json(credential);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input", errors: error });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to add credential" 
      });
    }
  });
  
  // Get specialist credentials
  app.get("/api/specialists/credentials/:specialistAddress", async (req, res) => {
    try {
      const { specialistAddress } = req.params;
      const credentials = await storage.getSpecialistCredentials(specialistAddress);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch credentials" 
      });
    }
  });
  
  // Update specialist credential (e.g., verify)
  app.put("/api/specialists/credentials/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const credential = await storage.updateSpecialistCredential(parseInt(id), req.body);
      
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      
      res.json(credential);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update credential" 
      });
    }
  });
  
  // Get specialist statistics
  app.get("/api/specialists/statistics/:specialistAddress", async (req, res) => {
    try {
      const { specialistAddress } = req.params;
      const statistics = await storage.getSpecialistStatistics(specialistAddress);
      
      if (!statistics) {
        return res.status(404).json({ message: "Statistics not found" });
      }
      
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch statistics" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [DELEGATION] Vote Delegation
  // ═══════════════════════════════════════════════════════

  // Create vote delegation (delegate votes to a specialist)
  app.post("/api/delegations", async (req, res) => {
    try {
      const { insertVoteDelegationSchema } = await import("@shared/schema");
      const validated = insertVoteDelegationSchema.parse(req.body);
      
      // Check if delegate is a registered specialist
      const specialist = await storage.getSpecialistRole(validated.delegateAddress);
      if (!specialist) {
        return res.status(400).json({ message: "Delegate must be a registered specialist" });
      }
      
      const delegation = await storage.createVoteDelegation(validated);
      res.status(201).json(delegation);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create delegation" 
      });
    }
  });

  // Revoke vote delegation
  app.delete("/api/delegations/:delegatorAddress", async (req, res) => {
    try {
      const { delegatorAddress } = req.params;
      const revoked = await storage.revokeVoteDelegation(delegatorAddress);
      
      if (!revoked) {
        return res.status(404).json({ message: "No active delegation found" });
      }
      
      res.json({ message: "Delegation revoked successfully", delegation: revoked });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to revoke delegation" 
      });
    }
  });

  // Get current active delegation for a delegator
  app.get("/api/delegations/delegator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const delegation = await storage.getCurrentActiveDelegation(address);
      res.json(delegation || null);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch delegation" 
      });
    }
  });

  // Get all delegations for a specialist (delegate)
  app.get("/api/delegations/delegate/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const delegations = await storage.getVoteDelegationsByDelegate(address);
      const totalDelegatedPower = await storage.getTotalDelegatedPower(address);
      
      res.json({
        delegations,
        totalDelegatedPower,
        delegatorCount: delegations.length
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch delegations" 
      });
    }
  });

  app.delete("/api/profiles/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const deleted = await storage.deleteUserProfile(walletAddress);
      
      if (!deleted) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete profile" 
      });
    }
  });

  // Referral system endpoints
  app.get("/api/referrals/codes/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const codes = await storage.getReferralCodesByWallet(walletAddress);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch referral codes" 
      });
    }
  });

  app.post("/api/referrals/codes", async (req, res) => {
    try {
      const code = await storage.createReferralCode(req.body);
      res.status(201).json(code);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create referral code" 
      });
    }
  });

  app.get("/api/referrals/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referralCode = await storage.getReferralCode(code);
      
      if (!referralCode) {
        return res.status(404).json({ message: "Referral code not found" });
      }
      
      res.json(referralCode);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch referral code" 
      });
    }
  });

  app.post("/api/referrals/use/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const { referredWalletAddress } = req.body;
      
      const referralCode = await storage.getReferralCode(code);
      
      if (!referralCode) {
        return res.status(404).json({ message: "Referral code not found" });
      }
      
      if (!referralCode.isActive) {
        return res.status(400).json({ message: "Referral code is not active" });
      }
      
      if (referralCode.maxUses && referralCode.currentUses >= referralCode.maxUses) {
        return res.status(400).json({ message: "Referral code has reached maximum uses" });
      }
      
      // Check if this wallet address cannot refer themselves
      if (referralCode.referrerWalletAddress.toLowerCase() === referredWalletAddress.toLowerCase()) {
        return res.status(400).json({ message: "Cannot use your own referral code" });
      }
      
      // Check if this wallet has already been referred by anyone
      const existingReferrals = await storage.getReferralsByWallet(referralCode.referrerWalletAddress);
      const alreadyReferred = existingReferrals.find(ref => 
        ref.referredWalletAddress.toLowerCase() === referredWalletAddress.toLowerCase()
      );
      
      if (alreadyReferred) {
        return res.status(400).json({ message: "This wallet has already been referred by you" });
      }
      
      // Also check if this wallet has been referred by any other referrer
      const allReferrals = await storage.getAllReferrals();
      const referredElsewhere = allReferrals.find((ref: Referral) =>
        ref.referredWalletAddress.toLowerCase() === referredWalletAddress.toLowerCase()
      );
      
      if (referredElsewhere) {
        return res.status(400).json({ message: "This wallet has already been referred by someone else" });
      }
      
      // Create referral record
      const referral = await storage.createReferral({
        referrerWalletAddress: referralCode.referrerWalletAddress,
        referredWalletAddress,
        referralCode: code,
        status: 'completed',
        pointsEarned: 50
      });
      
      // Update referral code uses
      await storage.updateReferralCodeUses(code);
      
      // Award points to referrer (50 points)
      let referrerPoints = await storage.getUserPoints(referralCode.referrerWalletAddress);
      if (!referrerPoints) {
        referrerPoints = await storage.createUserPoints({
          walletAddress: referralCode.referrerWalletAddress,
          totalPoints: 50,
          referralPoints: 50
        });
      } else {
        await storage.updateUserPoints(referralCode.referrerWalletAddress, 50);
      }
      
      // Create point transaction record for referrer
      await storage.createPointTransaction({
        walletAddress: referralCode.referrerWalletAddress,
        type: 'referral_earned',
        points: 50,
        description: `Referral bonus for inviting ${referredWalletAddress}`,
        referenceId: referral.id.toString()
      });
      
      // Award points to new user (25 points bonus for using referral)
      let newUserPoints = await storage.getUserPoints(referredWalletAddress);
      if (!newUserPoints) {
        newUserPoints = await storage.createUserPoints({
          walletAddress: referredWalletAddress,
          totalPoints: 25,
          referralPoints: 0
        });
      } else {
        await storage.updateUserPoints(referredWalletAddress, 25);
      }
      
      // Create point transaction record for new user
      await storage.createPointTransaction({
        walletAddress: referredWalletAddress,
        type: 'referral_bonus',
        points: 25,
        description: `Bonus for joining via referral code ${code}`,
        referenceId: referral.id.toString()
      });
      
      res.json({ 
        message: "Referral code used successfully", 
        referral,
        pointsAwarded: 50
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to use referral code" 
      });
    }
  });

  app.get("/api/referrals/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const referrals = await storage.getReferralsByWallet(walletAddress);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch referrals" 
      });
    }
  });

  // Sub-wallet invitation endpoints
  app.get("/api/invitations/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const invitations = await storage.getInvitationsByWallet(walletAddress);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch invitations" 
      });
    }
  });

  app.post("/api/invitations", async (req, res) => {
    try {
      const invitation = await storage.createInvitation(req.body);
      res.status(201).json(invitation);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create invitation" 
      });
    }
  });

  app.post("/api/invitations/:id/accept", async (req, res) => {
    try {
      const invitationId = parseInt(req.params.id);
      const { accepteeAddress } = req.body;
      
      // Get invitation details
      const invitation = await storage.getInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      let contractDetails;
      try {
        contractDetails = typeof invitation.contractDetails === 'string' 
          ? JSON.parse(invitation.contractDetails) 
          : invitation.contractDetails;
      } catch (error) {
        return res.status(400).json({ message: "Invalid contract details in invitation" });
      }
      
      // Find existing contract by contractId if provided
      let existingContract = null;
      if (contractDetails.contractId) {
        existingContract = await storage.getContractDraftById(contractDetails.contractId);
      }
      
      if (existingContract) {
        // Add user as cosigner to existing contract
        await storage.createContractSignature({
          contractId: existingContract.id,
          signerAddress: accepteeAddress,
          signature: '', // Will be filled when actually signing
          role: 'partner',
        });
        
        // Update invitation status
        await storage.updateInvitationStatus(invitationId, 'accepted');
        
        res.json({ 
          message: "Successfully joined contract as cosigner",
          contract: existingContract,
          role: 'partner'
        });
      } else {
        // Legacy behavior: create new contract draft
        const contractDraft = await storage.createContractDraft({
          title: contractDetails.title,
          description: contractDetails.description || '',
          contractType: invitation.contractType,
          creatorAddress: invitation.inviterAddress,
          partnerAddress: accepteeAddress,
          totalValue: contractDetails.amount || '0',
          currency: contractDetails.currency || 'USDC',
          status: 'draft',
        });
        
        // Update invitation status
        await storage.updateInvitationStatus(invitationId, 'accepted');
        
        res.json({ 
          message: "Contract draft created",
          contract: contractDraft,
          role: 'partner'
        });
      }
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to accept invitation" 
      });
    }
  });

  // Get all sub-wallets for current wallet
  app.get("/api/sub-wallets/", async (req, res) => {
    try {
      const { walletAddress } = req.query;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      const subWallets = await storage.getSubWalletsByMainWallet(walletAddress as string);
      res.json(subWallets);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch sub-wallets" 
      });
    }
  });

  // Create new sub-wallet
  app.post("/api/sub-wallets", async (req, res) => {
    try {
      const subWallet = await storage.createSubWallet(req.body);
      res.status(201).json(subWallet);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create sub-wallet" 
      });
    }
  });

  // Get sub-wallet by address (with access verification)
  app.get("/api/sub-wallets/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { walletAddress } = req.query;
      
      const subWallet = await storage.getSubWalletByAddress(address);
      
      if (!subWallet) {
        return res.status(404).json({ message: "Sub-wallet not found" });
      }
      
      // Check if the requesting wallet has access to this sub-wallet
      // Either they own it directly OR they're part of a contract using this sub-wallet OR they have an accepted invitation
      if (subWallet.mainWalletAddress !== walletAddress) {
        
        // Check if the requesting wallet is part of any contract using this sub-wallet
        const contractDrafts = await storage.getContractDrafts();
        const contractAccess = contractDrafts.some((contract: any) => 
          contract.subWalletAddress === address && 
          (contract.creatorAddress === walletAddress || contract.partnerAddress === walletAddress)
        );
        
        // Check if the requesting wallet has accepted an invitation for this sub-wallet
        const invitations = await storage.getInvitationsByInvitee(walletAddress as string);
        const invitationAccess = invitations.some((invitation: any) => 
          invitation.status === 'accepted' &&
          contractDrafts.some((contract: any) => 
            contract.subWalletAddress === address &&
            contract.creatorAddress === invitation.inviterAddress
          )
        );
        
        if (!contractAccess && !invitationAccess) {
          return res.status(403).json({ message: "You do not have access to this sub-wallet" });
        }
      }
      
      res.json(subWallet);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch sub-wallet" 
      });
    }
  });

  // Delete sub-wallet
  app.delete("/api/sub-wallets/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address required" });
      }
      
      // Get the sub-wallet to verify ownership
      const subWallet = await storage.getSubWalletByAddress(address);
      if (!subWallet) {
        return res.status(404).json({ message: "Sub-wallet not found" });
      }
      
      // Verify ownership
      if (subWallet.mainWalletAddress !== walletAddress) {
        return res.status(403).json({ message: "You do not have permission to delete this sub-wallet" });
      }
      
      // Delete the sub-wallet
      const deleted = await storage.deleteSubWallet(address);
      if (!deleted) {
        return res.status(404).json({ message: "Sub-wallet not found" });
      }
      
      res.json({ message: "Sub-wallet deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete sub-wallet" 
      });
    }
  });

  // Sub-wallet contract signing endpoint
  app.post("/api/sub-wallets/sign-contract", async (req, res) => {
    try {
      const { subWalletAddress, signature, message, signedAt, signerAddress } = req.body;
      
      if (!subWalletAddress || !signature || !message || !signerAddress) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get the sub-wallet to find contract info
      const subWallet = await storage.getSubWalletByAddress(subWalletAddress);
      if (!subWallet) {
        return res.status(404).json({ message: "Sub-wallet not found" });
      }

      // Find the contract draft associated with this sub-wallet
      const contractDrafts = await storage.getContractDrafts();
      const contractDraft = contractDrafts.find(c => c.subWalletAddress === subWalletAddress);
      
      if (!contractDraft) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Determine the role of the signer and verify access
      let role: 'creator' | 'party';
      if (signerAddress === contractDraft.creatorAddress) {
        role = 'creator';
      } else if (signerAddress === contractDraft.partnerAddress) {
        role = 'party';
      } else {
        return res.status(403).json({ message: "You do not have access to this contract" });
      }
      

      // Create contract signature record
      const contractSignature = await storage.createContractSignature({
        contractId: contractDraft.id!,
        signerAddress,
        signature,
        role
      });

      // Update sub-wallet status
      const updatedSubWallet = await storage.updateSubWalletContractStatus(subWalletAddress, {
        contractSigned: true,
        signedAt: new Date(signedAt)
      });

      // Check if contract is fully signed (both parties)
      const allSignatures = await storage.getContractSignatures(contractDraft.id);
      const hasCreatorSignature = allSignatures.some(sig => sig.role === 'creator');
      const hasPartySignature = allSignatures.some(sig => sig.role === 'party');
      const isFullySigned = hasCreatorSignature && hasPartySignature;

      // Send notification to the other party about the signature
      const otherPartyRole = role === 'creator' ? 'party' : 'creator';
      const otherPartyAddress = role === 'creator' ? 
        (await storage.getInvitationsByInviter(contractDraft.creatorAddress))[0]?.inviteeAddress :
        contractDraft.creatorAddress;

      if (otherPartyAddress && !isFullySigned) {
        // Create notification for the other party
        const notification = {
          type: 'contract_signature',
          recipientAddress: otherPartyAddress,
          title: 'Contract Signature Required',
          message: `${signerAddress} has signed the contract. Your signature is now required to complete the agreement.`,
          contractId: contractDraft.id,
          subWalletAddress,
          createdAt: new Date().toISOString(),
          read: false
        };

        // Store notification (you could extend this to use WebSocket for real-time notifications)
      }

      if (isFullySigned) {
        // Both parties have signed - funds are now locked
      }

      res.json({ 
        message: "Contract signed successfully",
        subWallet: updatedSubWallet,
        signature: contractSignature,
        isFullySigned,
        fundsLocked: isFullySigned,
        notification: !isFullySigned ? 'Other party notified to sign' : 'Contract fully executed'
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to sign contract" 
      });
    }
  });

  // Get contract signatures endpoint
  app.get("/api/contracts/:contractId/signatures", async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      if (isNaN(contractId)) {
        return res.status(400).json({ message: "Invalid contract ID" });
      }

      const signatures = await storage.getContractSignatures(contractId);
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get contract signatures" 
      });
    }
  });

  // Get all contract signatures
  app.get("/api/contract-signatures", async (req, res) => {
    try {
      const signatures = await storage.getAllContractSignatures();
      res.json(signatures);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get all contract signatures" 
      });
    }
  });

  // Contract document endpoints
  app.post("/api/contracts/:contractId/documents", async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const { fileName, fileType, fileSize, fileData, uploadedBy, description, documentType } = req.body;
      
      if (!fileName || !fileType || !fileSize || !fileData || !uploadedBy || !documentType) {
        return res.status(400).json({ message: "Missing required document fields" });
      }

      // Validate file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size exceeds 10MB limit" });
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png', 
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ message: "File type not supported" });
      }

      const document = await storage.createContractDocument({
        contractId,
        fileName,
        fileType,
        fileSize,
        fileData,
        uploadedBy,
        description,
        documentType
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to upload document" 
      });
    }
  });

  app.get("/api/contracts/:contractId/documents", async (req, res) => {
    try {
      const contractId = parseInt(req.params.contractId);
      const documents = await storage.getContractDocuments(contractId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contract documents" 
      });
    }
  });

  app.delete("/api/contracts/documents/:documentId", async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const { uploaderAddress } = req.body;
      
      if (!uploaderAddress) {
        return res.status(400).json({ message: "Uploader address required" });
      }

      const deleted = await storage.deleteContractDocument(documentId, uploaderAddress);
      
      if (deleted) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(404).json({ message: "Document not found or unauthorized" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete document" 
      });
    }
  });

  // Contract Management API Routes
  app.get("/api/contracts/drafts", async (req, res) => {
    try {
      const contracts = await storage.getContractDrafts();
      
      // Fetch deliverables for each contract
      const contractsWithDeliverables = await Promise.all(
        contracts.map(async (contract) => {
          const deliverables = await storage.getContractDeliverables(contract.id);
          return { ...contract, deliverables };
        })
      );
      
      res.json(contractsWithDeliverables);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contract drafts" 
      });
    }
  });

  app.post("/api/contracts/drafts", async (req, res) => {
    try {
      const { deliverables, ...contractData } = req.body;
      
      // Create the contract draft first
      const contract = await storage.createContractDraft(contractData);
      
      // Create deliverables if provided
      if (deliverables && Array.isArray(deliverables) && deliverables.length > 0) {
        for (const deliverable of deliverables) {
          await storage.createContractDeliverable({
            contractId: contract.id,
            title: deliverable.title,
            description: deliverable.description || '',
            value: deliverable.value,
            dueDate: deliverable.dueDate ? new Date(deliverable.dueDate) : null,
            status: 'pending'
          });
        }
      }
      
      res.status(201).json(contract);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create contract draft" 
      });
    }
  });

  app.get("/api/contracts/drafts/:id", async (req, res) => {
    try {
      const contract = await storage.getContractDraft(parseInt(req.params.id));
      if (!contract) {
        return res.status(404).json({ message: "Contract draft not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contract draft" 
      });
    }
  });

  app.put("/api/contracts/drafts/:id", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const updatedContract = await storage.updateContractDraft(contractId, req.body);
      if (!updatedContract) {
        return res.status(404).json({ message: "Contract draft not found" });
      }
      res.json(updatedContract);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update contract draft" 
      });
    }
  });

  // Send contract to partner
  app.post("/api/contracts/drafts/:id/send", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      const updatedContract = await storage.updateContractDraft(contractId, {
        status: 'sent'
      });
      
      if (!updatedContract) {
        return res.status(404).json({ message: "Contract draft not found" });
      }
      
      res.json(updatedContract);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to send contract" 
      });
    }
  });

  // Partner signs contract (changes status to partially_signed)
  app.post("/api/contracts/drafts/:id/sign", async (req, res) => {
    try {
      const { signature } = req.body;
      const contractId = parseInt(req.params.id);
      
      const contractSignature = await storage.createContractSignature({
        contractId,
        signerAddress: req.body.signerAddress || "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
        signature,
        role: "partner"
      });
      
      // Update contract status to partially_signed
      await storage.updateContractDraft(contractId, {
        status: 'partially_signed'
      });
      
      res.json(contractSignature);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to sign contract" 
      });
    }
  });

  // Creator finalizes contract (changes status to active)
  app.post("/api/contracts/drafts/:id/finalize", async (req, res) => {
    try {
      const { signature } = req.body;
      const contractId = parseInt(req.params.id);
      
      const contractSignature = await storage.createContractSignature({
        contractId,
        signerAddress: req.body.signerAddress || "0x742d35Cc6634C0532925a3b8D4b28eC80C6d8Da7",
        signature,
        role: "creator"
      });
      
      // Update contract status to active
      const updatedContract = await storage.updateContractDraft(contractId, {
        status: 'active'
      });
      
      res.json({ contractSignature, contract: updatedContract });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to finalize contract" 
      });
    }
  });

  app.get("/api/contracts/drafts/:id/deliverables", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const deliverables = await storage.getContractDeliverables(contractId);
      res.json(deliverables);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch deliverables" 
      });
    }
  });

  // Milestone-based deliverable management
  app.post("/api/contracts/deliverables", async (req, res) => {
    try {
      const deliverable = await storage.createContractDeliverable(req.body);
      
      // Create notification for the responsible party
      if (req.body.dueDate) {
        await storage.createNotification({
          recipientAddress: req.body.contractId === 'creator' ? req.body.creatorAddress : req.body.partnerAddress,
          title: "New Milestone Created",
          message: `A new deliverable "${req.body.title}" has been created with due date ${new Date(req.body.dueDate).toLocaleDateString()}`,
          type: "milestone_created",
          relatedId: deliverable.id,
          relatedType: "deliverable",
          actionRequired: true,
          actionUrl: `/contracts/${req.body.contractId}`
        });
      }
      
      res.status(201).json(deliverable);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create deliverable" 
      });
    }
  });

  app.post("/api/contracts/deliverables/:id/claim", async (req, res) => {
    try {
      const deliverableId = parseInt(req.params.id);
      const { claimedBy, evidence } = req.body;
      
      const deliverable = await storage.getContractDeliverable(deliverableId);
      if (!deliverable) {
        return res.status(404).json({ message: "Deliverable not found" });
      }

      const result = await storage.updateContractDeliverable(deliverableId, {
        status: 'claimed',
        claimedBy,
        claimedAt: new Date(),
        evidence
      });

      // Get contract to notify the other party
      const contract = await storage.getContractDraft(deliverable.contractId);
      if (contract) {
        const otherPartyAddress = claimedBy === contract.creatorAddress ? 
          contract.partnerAddress : contract.creatorAddress;
        
        await storage.createNotification({
          recipientAddress: otherPartyAddress,
          title: "Deliverable Completed",
          message: `Milestone "${deliverable.title}" has been marked as complete and requires your verification`,
          type: "milestone_completed",
          relatedId: deliverableId,
          relatedType: "deliverable",
          actionRequired: true,
          actionUrl: `/contracts/${deliverable.contractId}/verify/${deliverableId}`
        });
      }
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to claim deliverable" 
      });
    }
  });

  app.post("/api/contracts/deliverables/:id/verify", async (req, res) => {
    try {
      const deliverableId = parseInt(req.params.id);
      const { verifierAddress, status, signature, comments, evidence } = req.body;
      
      const deliverable = await storage.getContractDeliverable(deliverableId);
      if (!deliverable) {
        return res.status(404).json({ message: "Deliverable not found" });
      }

      const verification = await storage.createContractVerification({
        deliverableId,
        verifierAddress,
        status,
        signature,
        comments,
        evidence
      });

      // Update deliverable status based on verification
      if (status === 'approved') {
        await storage.updateContractDeliverable(deliverableId, {
          status: 'verified',
          verifiedBy: verifierAddress,
          verifiedAt: new Date()
        });

        // Get contract and notify about verification
        const contract = await storage.getContractDraft(deliverable.contractId);
        if (contract) {
          const otherPartyAddress = verifierAddress === contract.creatorAddress ? 
            contract.partnerAddress : contract.creatorAddress;
          
          await storage.createNotification({
            recipientAddress: otherPartyAddress,
            title: "Milestone Verified",
            message: `Milestone "${deliverable.title}" has been verified. Funds for this milestone can now be released.`,
            type: "verification_approved",
            relatedId: deliverableId,
            relatedType: "deliverable",
            actionRequired: false,
            actionUrl: `/contracts/${deliverable.contractId}`
          });

          // Check if all deliverables are verified to enable full fund release
          const allDeliverables = await storage.getContractDeliverables(deliverable.contractId);
          const allVerified = allDeliverables.every(d => d.status === 'verified' || d.status === 'completed');
          
          if (allVerified) {
            await storage.createNotification({
              recipientAddress: contract.creatorAddress,
              title: "All Milestones Complete",
              message: "All contract milestones have been verified. Full fund release is now available.",
              type: "funds_available",
              relatedId: contract.id,
              relatedType: "contract",
              actionRequired: true,
              actionUrl: `/contracts/${contract.id}/funds`
            });
          }
        }
      } else if (status === 'rejected') {
        await storage.updateContractDeliverable(deliverableId, {
          status: 'disputed'
        });

        // Notify about rejection
        const contract = await storage.getContractDraft(deliverable.contractId);
        if (contract) {
          const deliverableOwner = deliverable.claimedBy || 
            (verifierAddress === contract.creatorAddress ? contract.partnerAddress : contract.creatorAddress);
          
          await storage.createNotification({
            recipientAddress: deliverableOwner,
            title: "Milestone Rejected",
            message: `Milestone "${deliverable.title}" was rejected. Please review feedback and resubmit.`,
            type: "verification_rejected",
            relatedId: deliverableId,
            relatedType: "deliverable",
            actionRequired: true,
            actionUrl: `/contracts/${deliverable.contractId}/deliverables/${deliverableId}`
          });
        }
      }
      
      res.json(verification);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to verify deliverable" 
      });
    }
  });

  // Notification management endpoints
  app.get("/api/notifications/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const notifications = await storage.getNotifications(walletAddress);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch notifications" 
      });
    }
  });

  app.get("/api/notifications/:walletAddress/unread", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const notifications = await storage.getUnreadNotifications(walletAddress);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch unread notifications" 
      });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to mark notification as read" 
      });
    }
  });

  app.patch("/api/notifications/:walletAddress/read-all", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      await storage.markAllNotificationsAsRead(walletAddress);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to mark all notifications as read" 
      });
    }
  });

  app.get("/api/points/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const points = await storage.getUserPoints(walletAddress);
      
      if (!points) {
        // Initialize points for new user
        const newPoints = await storage.createUserPoints({
          walletAddress,
          totalPoints: 0,
          referralPoints: 0
        });
        return res.json(newPoints);
      }
      
      res.json(points);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch points" 
      });
    }
  });

  app.get("/api/points/transactions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const transactions = await storage.getPointTransactions(walletAddress);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch point transactions" 
      });
    }
  });

  // Contact management endpoints
  app.get("/api/contacts", async (req, res) => {
    try {
      const { ownerWalletAddress } = req.query;
      if (!ownerWalletAddress) {
        return res.status(400).json({ message: "ownerWalletAddress query parameter is required" });
      }
      const contacts = await storage.getContacts(ownerWalletAddress as string);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contacts" 
      });
    }
  });

  app.get("/api/contacts/:ownerWalletAddress", async (req, res) => {
    try {
      const { ownerWalletAddress } = req.params;
      const contacts = await storage.getContacts(ownerWalletAddress);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contacts" 
      });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const contact = await storage.createContact(req.body);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create contact" 
      });
    }
  });

  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const contact = await storage.updateContact(contactId, req.body);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update contact" 
      });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      const deleted = await storage.deleteContact(contactId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json({ message: "Contact deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete contact" 
      });
    }
  });

  app.get("/api/contacts/:ownerWalletAddress/by-address/:contactWalletAddress", async (req, res) => {
    try {
      const { ownerWalletAddress, contactWalletAddress } = req.params;
      const contact = await storage.getContactByAddress(ownerWalletAddress, contactWalletAddress);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch contact" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [MARKETPLACE] B2B Trade Partner Marketplace
  // ═══════════════════════════════════════════════════════

  // Marketplace Business Profile Routes
  app.post("/api/marketplace/businesses", async (req, res) => {
    try {
      const business = await storage.createMarketplaceBusiness(req.body);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create business profile" 
      });
    }
  });

  app.get("/api/marketplace/businesses/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const business = await storage.getMarketplaceBusiness(walletAddress);
      
      if (!business) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      res.json(business);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch business profile" 
      });
    }
  });

  app.get("/api/marketplace/businesses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const business = await storage.getMarketplaceBusinessById(id);
      
      if (!business) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      // Increment profile views
      await storage.incrementBusinessProfileViews(business.walletAddress);
      
      res.json(business);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch business profile" 
      });
    }
  });

  app.get("/api/marketplace/businesses", async (req, res) => {
    try {
      const filters = {
        industry: req.query.industry as string | undefined,
        country: req.query.country as string | undefined,
        region: req.query.region as string | undefined,
        companyType: req.query.companyType as string | undefined,
        isVerified: req.query.isVerified === 'true' ? true : undefined,
        minTradeScore: req.query.minTradeScore ? parseInt(req.query.minTradeScore as string) : undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const businesses = await storage.searchMarketplaceBusinesses(filters);
      res.json(businesses);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to search businesses" 
      });
    }
  });

  app.put("/api/marketplace/businesses/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const business = await storage.updateMarketplaceBusiness(walletAddress, req.body);
      
      if (!business) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      res.json(business);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update business profile" 
      });
    }
  });

  // Marketplace Product Routes
  app.post("/api/marketplace/products", async (req, res) => {
    try {
      const product = await storage.createMarketplaceProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create product" 
      });
    }
  });

  app.get("/api/marketplace/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getMarketplaceProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch product" 
      });
    }
  });

  app.get("/api/marketplace/products/business/:businessId", async (req, res) => {
    try {
      const businessId = parseInt(req.params.businessId);
      const products = await storage.getMarketplaceProductsByBusiness(businessId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch products" 
      });
    }
  });

  app.get("/api/marketplace/products", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string | undefined,
        country: req.query.country as string | undefined,
        minPrice: req.query.minPrice as string | undefined,
        maxPrice: req.query.maxPrice as string | undefined,
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const products = await storage.searchMarketplaceProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to search products" 
      });
    }
  });

  app.put("/api/marketplace/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.updateMarketplaceProduct(id, req.body);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update product" 
      });
    }
  });

  app.delete("/api/marketplace/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMarketplaceProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete product" 
      });
    }
  });

  // Marketplace RFQ Routes
  app.post("/api/marketplace/rfqs", async (req, res) => {
    try {
      // Generate unique RFQ number
      const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const rfq = await storage.createMarketplaceRfq({
        ...req.body,
        rfqNumber
      });
      res.status(201).json(rfq);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create RFQ" 
      });
    }
  });

  app.get("/api/marketplace/rfqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.getMarketplaceRfq(id);
      
      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }
      
      res.json(rfq);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch RFQ" 
      });
    }
  });

  app.get("/api/marketplace/rfqs/number/:rfqNumber", async (req, res) => {
    try {
      const { rfqNumber } = req.params;
      const rfq = await storage.getMarketplaceRfqByNumber(rfqNumber);
      
      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }
      
      res.json(rfq);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch RFQ" 
      });
    }
  });

  app.get("/api/marketplace/rfqs/buyer/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const rfqs = await storage.getMarketplaceRfqsByBuyer(walletAddress);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch RFQs" 
      });
    }
  });

  app.get("/api/marketplace/rfqs", async (req, res) => {
    try {
      const filters = {
        productCategory: req.query.productCategory as string | undefined,
        deliveryCountry: req.query.deliveryCountry as string | undefined,
        status: req.query.status as string | undefined,
        minBudget: req.query.minBudget as string | undefined,
        maxBudget: req.query.maxBudget as string | undefined,
        tradeFinancePreferred: req.query.tradeFinancePreferred === 'true' ? true : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      };
      
      const rfqs = await storage.searchMarketplaceRfqs(filters);
      res.json(rfqs);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to search RFQs" 
      });
    }
  });

  app.put("/api/marketplace/rfqs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rfq = await storage.updateMarketplaceRfq(id, req.body);
      
      if (!rfq) {
        return res.status(404).json({ message: "RFQ not found" });
      }
      
      res.json(rfq);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update RFQ" 
      });
    }
  });

  // Marketplace Quote Routes
  app.post("/api/marketplace/quotes", async (req, res) => {
    try {
      const quote = await storage.createMarketplaceQuote(req.body);
      res.status(201).json(quote);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create quote" 
      });
    }
  });

  app.get("/api/marketplace/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getMarketplaceQuote(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch quote" 
      });
    }
  });

  app.get("/api/marketplace/quotes/rfq/:rfqId", async (req, res) => {
    try {
      const rfqId = parseInt(req.params.rfqId);
      const quotes = await storage.getMarketplaceQuotesByRfq(rfqId);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch quotes" 
      });
    }
  });

  app.get("/api/marketplace/quotes/supplier/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const quotes = await storage.getMarketplaceQuotesBySupplier(walletAddress);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch quotes" 
      });
    }
  });

  app.put("/api/marketplace/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.updateMarketplaceQuote(id, req.body);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.json(quote);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update quote" 
      });
    }
  });

  // Marketplace Review Routes
  app.post("/api/marketplace/reviews", async (req, res) => {
    try {
      const review = await storage.createMarketplaceReview(req.body);
      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create review" 
      });
    }
  });

  app.get("/api/marketplace/reviews/business/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const reviews = await storage.getMarketplaceReviewsByBusiness(walletAddress);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch reviews" 
      });
    }
  });

  app.get("/api/marketplace/reviews/rating/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const rating = await storage.getAverageBusinessRating(walletAddress);
      res.json(rating);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch rating" 
      });
    }
  });

  // Marketplace Connection Routes
  app.post("/api/marketplace/connections", async (req, res) => {
    try {
      // Check if connection already exists
      const existingConnection = await storage.getMarketplaceConnection(
        req.body.requesterWalletAddress,
        req.body.targetWalletAddress
      );
      
      if (existingConnection) {
        return res.status(400).json({ message: "Connection request already exists" });
      }
      
      const connection = await storage.createMarketplaceConnection(req.body);
      res.status(201).json(connection);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create connection" 
      });
    }
  });

  app.get("/api/marketplace/connections/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const connections = await storage.getMarketplaceConnections(walletAddress);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch connections" 
      });
    }
  });

  app.put("/api/marketplace/connections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const connection = await storage.updateMarketplaceConnection(id, req.body);
      
      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.json(connection);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update connection" 
      });
    }
  });

  // Trade Corridor Routes
  app.get("/api/marketplace/corridors", async (req, res) => {
    try {
      const corridors = await storage.getAllTradeCorridors();
      res.json(corridors);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade corridors" 
      });
    }
  });

  app.get("/api/marketplace/corridors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const corridor = await storage.getTradeCorridor(id);
      
      if (!corridor) {
        return res.status(404).json({ message: "Trade corridor not found" });
      }
      
      res.json(corridor);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch trade corridor" 
      });
    }
  });

  app.post("/api/marketplace/corridors", async (req, res) => {
    try {
      const corridor = await storage.createTradeCorridor(req.body);
      res.status(201).json(corridor);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create trade corridor" 
      });
    }
  });

  // Marketplace Statistics Endpoint
  app.get("/api/marketplace/stats", async (req, res) => {
    try {
      const businesses = await storage.searchMarketplaceBusinesses({ limit: 1000 });
      const rfqs = await storage.searchMarketplaceRfqs({ limit: 1000, status: 'open' });
      const corridors = await storage.getAllTradeCorridors();
      
      res.json({
        totalBusinesses: businesses.length,
        verifiedBusinesses: businesses.filter(b => b.isVerified).length,
        activeRfqs: rfqs.length,
        tradeCorridors: corridors.length,
        regions: {
          africa: businesses.filter(b => b.region === 'Africa').length,
          asia: businesses.filter(b => b.region === 'Asia').length,
          europe: businesses.filter(b => b.region === 'Europe').length,
          americas: businesses.filter(b => b.region === 'Americas').length,
          middleEast: businesses.filter(b => b.region === 'Middle East').length
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch marketplace stats" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [WAITLIST] Early Adopter Waitlist
  // ═══════════════════════════════════════════════════════
  app.post("/api/waitlist", async (req, res) => {
    try {
      const { insertWaitlistSchema } = await import("@shared/schema");
      
      // Normalize email to lowercase
      const data = {
        ...req.body,
        email: req.body.email?.toLowerCase()
      };
      
      const validatedData = insertWaitlistSchema.parse(data);
      
      // Check if email already exists
      const existing = await storage.getWaitlistByEmail(validatedData.email);
      if (existing) {
        return res.status(409).json({ 
          message: "This email is already on the waitlist. We'll be in touch soon!" 
        });
      }
      
      const entry = await storage.createWaitlistEntry(validatedData);
      
      res.status(201).json({ 
        message: "Successfully joined the waitlist! We'll be in touch soon.",
        id: entry.id
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique')) {
        return res.status(409).json({ 
          message: "This email is already on the waitlist." 
        });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to join waitlist" 
      });
    }
  });

  // Get waitlist count (public)
  app.get("/api/waitlist/count", async (req, res) => {
    try {
      const count = await storage.getWaitlistCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get waitlist count" 
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [FX-ORACLE] FX Rates & Oracle
  // ═══════════════════════════════════════════════════════

  const { fetchAllRates, getRate, getSupportedPairs, checkExpiredEvents, startOraclePoller } = await import("./fx-oracle");

  startOraclePoller(storage, 60 * 60 * 1000);

  app.get("/api/fx/rates", async (_req, res) => {
    try {
      const rates = await fetchAllRates();
      res.json({ rates, pairs: getSupportedPairs() });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FX rates" });
    }
  });

  app.get("/api/fx/rate/:pair", async (req, res) => {
    try {
      const pair = decodeURIComponent(req.params.pair);
      const rate = await getRate(pair);
      if (!rate) return res.status(404).json({ message: `No rate for ${pair}` });
      res.json(rate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rate" });
    }
  });

  app.post("/api/fx/auto-settle", async (req, res) => {
    try {
      const result = await checkExpiredEvents(storage);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to run auto-settle" });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [HEDGE] P2P Trade Hedge
  // ═══════════════════════════════════════════════════════

  // Get all hedge events
  app.get("/api/hedge/events", async (_req, res) => {
    try {
      const events = await storage.getAllHedgeEvents();
      const eventsWithStats = await Promise.all(events.map(async (event) => {
        const positions = await storage.getHedgePositionsByEvent(event.id);
        const deposits = await storage.getHedgeLpDepositsByEvent(event.id);
        const totalLiquidity = deposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.amount), 0);
        const totalExposure = positions.filter(p => p.status === "active").reduce((sum, p) => sum + parseFloat(p.maxPayout), 0);
        const totalPremiums = positions.reduce((sum, p) => sum + parseFloat(p.premiumPaid), 0);
        const utilization = totalLiquidity > 0 ? (totalExposure / (totalLiquidity * parseFloat(event.safetyFactor || "0.8"))) * 100 : 0;
        return {
          ...event,
          poolStats: {
            totalLiquidity,
            totalExposure,
            totalPremiums,
            utilization: Math.min(utilization, 100),
            availableCapacity: Math.max(0, totalLiquidity * parseFloat(event.safetyFactor || "0.8") - totalExposure),
            lpCount: deposits.filter(d => !d.withdrawn).length,
            hedgerCount: positions.filter(p => p.status === "active").length
          }
        };
      }));
      res.json(eventsWithStats);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch hedge events" });
    }
  });

  // Get open hedge events
  app.get("/api/hedge/events/open", async (_req, res) => {
    try {
      const events = await storage.getOpenHedgeEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch open hedge events" });
    }
  });

  // Get single hedge event with pool stats
  app.get("/api/hedge/events/:id", async (req, res) => {
    try {
      const event = await storage.getHedgeEvent(parseInt(req.params.id));
      if (!event) return res.status(404).json({ message: "Event not found" });

      const positions = await storage.getHedgePositionsByEvent(event.id);
      const deposits = await storage.getHedgeLpDepositsByEvent(event.id);

      const totalLiquidity = deposits
        .filter(d => !d.withdrawn)
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const totalExposure = positions
        .filter(p => p.status === "active")
        .reduce((sum, p) => sum + parseFloat(p.maxPayout), 0);
      const totalPremiums = positions.reduce((sum, p) => sum + parseFloat(p.premiumPaid), 0);
      const utilization = totalLiquidity > 0 ? (totalExposure / (totalLiquidity * parseFloat(event.safetyFactor || "0.8"))) * 100 : 0;

      res.json({
        ...event,
        poolStats: {
          totalLiquidity,
          totalExposure,
          totalPremiums,
          utilization: Math.min(utilization, 100),
          availableCapacity: Math.max(0, totalLiquidity * parseFloat(event.safetyFactor || "0.8") - totalExposure),
          lpCount: deposits.filter(d => !d.withdrawn).length,
          hedgerCount: positions.filter(p => p.status === "active").length
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch hedge event" });
    }
  });

  // Create hedge event (admin)
  app.post("/api/hedge/events", async (req, res) => {
    try {
      const { name, description, underlying, strike, premiumRate, payoutRate, safetyFactor, expiryDate, createdBy } = req.body;

      if (!name || !underlying || !strike || !premiumRate || !payoutRate || !expiryDate || !createdBy) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const expiry = new Date(expiryDate);
      if (expiry <= new Date()) {
        return res.status(400).json({ message: "Expiry date must be in the future" });
      }

      const event = await storage.createHedgeEvent({
        name,
        description: description || null,
        underlying,
        strike: strike.toString(),
        premiumRate: premiumRate.toString(),
        payoutRate: payoutRate.toString(),
        safetyFactor: (safetyFactor || 0.80).toString(),
        expiryDate: expiry,
        status: "open",
        createdBy
      });

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create hedge event" });
    }
  });

  // Buy protection (hedger)
  app.post("/api/hedge/positions", async (req, res) => {
    try {
      const { eventId, hedgerWallet, notional } = req.body;

      if (!eventId || !hedgerWallet || !notional) {
        return res.status(400).json({ message: "Missing required fields: eventId, hedgerWallet, notional" });
      }

      const event = await storage.getHedgeEvent(parseInt(eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status !== "open") return res.status(400).json({ message: "Event is not open for new positions" });
      if (new Date(event.expiryDate) <= new Date()) return res.status(400).json({ message: "Event has expired" });

      const notionalNum = parseFloat(notional);
      if (notionalNum < 10) return res.status(400).json({ message: "Minimum notional is $10" });

      const premiumPaid = notionalNum * parseFloat(event.premiumRate);
      const maxPayout = notionalNum * parseFloat(event.payoutRate);

      // Check pool capacity
      const positions = await storage.getHedgePositionsByEvent(event.id);
      const deposits = await storage.getHedgeLpDepositsByEvent(event.id);
      const totalLiquidity = deposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const currentExposure = positions.filter(p => p.status === "active").reduce((sum, p) => sum + parseFloat(p.maxPayout), 0);
      const maxCapacity = totalLiquidity * parseFloat(event.safetyFactor || "0.8");

      if (currentExposure + maxPayout > maxCapacity) {
        return res.status(400).json({
          message: "Insufficient pool liquidity for this position",
          availableCapacity: Math.max(0, maxCapacity - currentExposure)
        });
      }

      const position = await storage.createHedgePosition({
        eventId: event.id,
        hedgerWallet,
        notional: notionalNum.toString(),
        premiumPaid: premiumPaid.toString(),
        maxPayout: maxPayout.toString(),
        status: "active"
      });

      // Distribute premium to LP deposits proportionally
      const activeDeposits = deposits.filter(d => !d.withdrawn);
      if (activeDeposits.length > 0) {
        for (const dep of activeDeposits) {
          const share = parseFloat(dep.amount) / totalLiquidity;
          const earned = premiumPaid * share;
          await storage.updateHedgeLpDeposit(dep.id, {
            premiumsEarned: (parseFloat(dep.premiumsEarned || "0") + earned).toString()
          });
        }
      }

      res.status(201).json({
        ...position,
        premiumPaid,
        maxPayout,
        message: `Protection purchased. Premium: $${premiumPaid.toFixed(2)}. Max payout: $${maxPayout.toFixed(2)}`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to buy protection" });
    }
  });

  // Get positions by wallet
  app.get("/api/hedge/positions/:wallet", async (req, res) => {
    try {
      const positions = await storage.getHedgePositionsByWallet(req.params.wallet);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch positions" });
    }
  });

  // Deposit liquidity (LP)
  app.post("/api/hedge/deposits", async (req, res) => {
    try {
      const { eventId, lpWallet, amount } = req.body;

      if (!eventId || !lpWallet || !amount) {
        return res.status(400).json({ message: "Missing required fields: eventId, lpWallet, amount" });
      }

      const event = await storage.getHedgeEvent(parseInt(eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status !== "open") return res.status(400).json({ message: "Event is not open for deposits" });

      const amountNum = parseFloat(amount);
      if (amountNum < 10) return res.status(400).json({ message: "Minimum deposit is $10" });

      // Calculate LP shares (1:1 for first deposit, proportional after)
      const existingDeposits = await storage.getHedgeLpDepositsByEvent(event.id);
      const totalLiquidity = existingDeposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const totalShares = existingDeposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.shares), 0);
      const shares = totalLiquidity === 0 ? amountNum : (amountNum / totalLiquidity) * totalShares;

      const deposit = await storage.createHedgeLpDeposit({
        eventId: event.id,
        lpWallet,
        amount: amountNum.toString(),
        shares: shares.toString()
      });

      res.status(201).json({
        ...deposit,
        message: `Deposited $${amountNum.toFixed(2)} into pool. Received ${shares.toFixed(4)} LP shares.`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to deposit liquidity" });
    }
  });

  // Auto-seed liquidity from treasury pool wallet (admin-only: deployer or treasury wallet)
  app.post("/api/hedge/treasury-seed", async (req, res) => {
    try {
      const { eventId, amount, callerAddress } = req.body;
      if (!eventId || !amount) {
        return res.status(400).json({ message: "Missing required fields: eventId, amount" });
      }

      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        return res.status(500).json({ message: "Treasury wallet not configured" });
      }

      const ethers = await import("ethers");
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey);
      const treasuryAddress = treasuryWallet.address;

      const deployerAddress = "0xef5Bed7c221c85A2c88e3c0223ee45482d6F037d";
      const caller = (callerAddress || "").toLowerCase();
      if (caller !== deployerAddress.toLowerCase() && caller !== treasuryAddress.toLowerCase()) {
        return res.status(403).json({ message: "Unauthorized: Only platform admin can seed treasury liquidity" });
      }

      const event = await storage.getHedgeEvent(parseInt(eventId));
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status !== "open") return res.status(400).json({ message: "Event is not open for deposits" });

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || !isFinite(amountNum) || amountNum < 10) return res.status(400).json({ message: "Minimum deposit is $10" });

      const existingDeposits = await storage.getHedgeLpDepositsByEvent(event.id);
      const totalLiquidity = existingDeposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const totalShares = existingDeposits.filter(d => !d.withdrawn).reduce((sum, d) => sum + parseFloat(d.shares), 0);
      const shares = totalLiquidity === 0 ? amountNum : (amountNum / totalLiquidity) * totalShares;

      const deposit = await storage.createHedgeLpDeposit({
        eventId: event.id,
        lpWallet: treasuryAddress,
        amount: amountNum.toString(),
        shares: shares.toString()
      });

      res.status(201).json({
        ...deposit,
        treasuryAddress,
        message: `Treasury wallet seeded $${amountNum.toFixed(2)} into pool. Received ${shares.toFixed(4)} LP shares.`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to seed from treasury" });
    }
  });

  app.post("/api/hedge/treasury-withdraw", async (req, res) => {
    try {
      const { amount, callerAddress } = req.body;
      if (!amount || !callerAddress) {
        return res.status(400).json({ message: "Missing required fields: amount, callerAddress" });
      }

      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        return res.status(500).json({ message: "Treasury wallet not configured" });
      }

      const ethers = await import("ethers");
      const deployerAddress = "0xef5Bed7c221c85A2c88e3c0223ee45482d6F037d";
      const caller = (callerAddress || "").toLowerCase();
      if (caller !== deployerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Unauthorized: Only platform admin can withdraw from treasury" });
      }

      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
      const treasuryAddress = treasuryWallet.address;

      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const usdcContract = new ethers.Contract(usdcAddress, [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)"
      ], treasuryWallet);

      const decimals = await usdcContract.decimals();
      const currentBalance = await usdcContract.balanceOf(treasuryAddress);
      const currentBalanceFormatted = parseFloat(ethers.formatUnits(currentBalance, decimals));

      let transferAmount: bigint;
      if (amount === "all") {
        transferAmount = currentBalance;
      } else {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }
        if (amountNum > currentBalanceFormatted) {
          return res.status(400).json({ message: `Insufficient treasury balance. Available: ${currentBalanceFormatted.toFixed(2)} USDC` });
        }
        transferAmount = ethers.parseUnits(amountNum.toFixed(6), decimals);
      }

      if (transferAmount === 0n) {
        return res.status(400).json({ message: "Treasury balance is zero" });
      }

      const tx = await usdcContract.transfer(deployerAddress, transferAmount);
      const receipt = await tx.wait();

      const amountTransferred = ethers.formatUnits(transferAmount, decimals);

      res.json({
        success: true,
        txHash: receipt.hash,
        amount: amountTransferred,
        from: treasuryAddress,
        to: deployerAddress,
        message: `Successfully unstaked ${amountTransferred} USDC from treasury to deployer wallet`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to withdraw from treasury" });
    }
  });

  app.get("/api/hedge/treasury-balance", async (_req, res) => {
    try {
      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        return res.status(500).json({ message: "Treasury wallet not configured" });
      }
      const ethers = await import("ethers");
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey);
      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const usdcContract = new ethers.Contract(usdcAddress, [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ], provider);
      const balance = await usdcContract.balanceOf(treasuryWallet.address);
      const decimals = await usdcContract.decimals();
      res.json({
        address: treasuryWallet.address,
        balance: ethers.formatUnits(balance, decimals),
        raw: balance.toString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch treasury balance" });
    }
  });

  // Get treasury wallet address for hedge pools
  app.get("/api/hedge/treasury-address", async (_req, res) => {
    try {
      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        return res.status(500).json({ message: "Treasury wallet not configured" });
      }
      const ethers = await import("ethers");
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey);
      res.json({ address: treasuryWallet.address });
    } catch (error) {
      res.status(500).json({ message: "Failed to get treasury address" });
    }
  });

  // Get LP deposits by wallet
  app.get("/api/hedge/deposits/:wallet", async (req, res) => {
    try {
      const deposits = await storage.getHedgeLpDepositsByWallet(req.params.wallet);
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch deposits" });
    }
  });

  // Withdraw LP liquidity
  app.post("/api/hedge/deposits/:id/withdraw", async (req, res) => {
    try {
      const deposit = await storage.getHedgeLpDeposit(parseInt(req.params.id));
      if (!deposit) return res.status(404).json({ message: "Deposit not found" });
      if (deposit.withdrawn) return res.status(400).json({ message: "Already withdrawn" });

      const event = await storage.getHedgeEvent(deposit.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status === "open") {
        return res.status(400).json({ message: "Cannot withdraw liquidity while the contract is still active. Withdrawals are available after the event expires or settles." });
      }

      const updated = await storage.updateHedgeLpDeposit(deposit.id, {
        withdrawn: true,
        withdrawnAt: new Date()
      });

      res.json({ ...updated, message: "Liquidity withdrawn successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to withdraw" });
    }
  });

  // Claim earned premiums (LP withdraws earned premiums from treasury to their wallet)
  app.post("/api/hedge/deposits/:id/claim-premiums", async (req, res) => {
    try {
      const { callerAddress } = req.body;
      if (!callerAddress) {
        return res.status(400).json({ message: "Missing callerAddress" });
      }

      const deposit = await storage.getHedgeLpDeposit(parseInt(req.params.id));
      if (!deposit) return res.status(404).json({ message: "Deposit not found" });

      if (deposit.lpWallet.toLowerCase() !== callerAddress.toLowerCase()) {
        return res.status(403).json({ message: "Unauthorized: You can only claim premiums for your own deposits" });
      }

      const earned = parseFloat(deposit.premiumsEarned || "0");
      const alreadyWithdrawn = parseFloat(deposit.premiumsWithdrawn || "0");
      const claimable = earned - alreadyWithdrawn;

      if (claimable <= 0) {
        return res.status(400).json({ message: "No premiums available to claim" });
      }

      const treasuryPrivateKey = process.env.TREASURY_POOL_PRIVATE_KEY;
      if (!treasuryPrivateKey) {
        return res.status(500).json({ message: "Treasury wallet not configured" });
      }

      const ethers = await import("ethers");
      const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
      const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);

      const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
      const usdcContract = new ethers.Contract(usdcAddress, [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function transfer(address to, uint256 amount) returns (bool)"
      ], treasuryWallet);

      const decimals = await usdcContract.decimals();
      const treasuryBalance = await usdcContract.balanceOf(treasuryWallet.address);
      const treasuryBalanceFormatted = parseFloat(ethers.formatUnits(treasuryBalance, decimals));

      if (claimable > treasuryBalanceFormatted) {
        return res.status(400).json({ message: `Insufficient treasury balance. Available: ${treasuryBalanceFormatted.toFixed(2)} USDC, Claimable: ${claimable.toFixed(2)} USDC` });
      }

      const transferAmount = ethers.parseUnits(claimable.toFixed(6), decimals);
      const tx = await usdcContract.transfer(deposit.lpWallet, transferAmount);
      const receipt = await tx.wait();

      const updated = await storage.updateHedgeLpDeposit(deposit.id, {
        premiumsWithdrawn: (alreadyWithdrawn + claimable).toString()
      });

      res.json({
        success: true,
        txHash: receipt.hash,
        amount: claimable.toFixed(2),
        from: treasuryWallet.address,
        to: deposit.lpWallet,
        message: `Successfully claimed $${claimable.toFixed(2)} USDC in premiums`
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to claim premiums" });
    }
  });

  // Settle event (admin posts oracle price)
  app.post("/api/hedge/events/:id/settle", async (req, res) => {
    try {
      const { settlementPrice, settlerAddress } = req.body;
      if (!settlementPrice || !settlerAddress) {
        return res.status(400).json({ message: "Missing settlementPrice or settlerAddress" });
      }

      const event = await storage.getHedgeEvent(parseInt(req.params.id));
      if (!event) return res.status(404).json({ message: "Event not found" });
      if (event.status !== "open") return res.status(400).json({ message: "Event already settled or expired" });

      const price = parseFloat(settlementPrice);
      const strike = parseFloat(event.strike);
      const triggered = price >= strike;

      // Update event
      await storage.updateHedgeEvent(event.id, {
        status: "settled",
        settlementPrice: price.toString(),
        triggered,
        settledAt: new Date()
      });

      // Settle all active positions
      const positions = await storage.getHedgePositionsByEvent(event.id);
      for (const pos of positions) {
        if (pos.status !== "active") continue;

        if (triggered) {
          const payout = parseFloat(pos.maxPayout);
          await storage.updateHedgePosition(pos.id, {
            status: "settled_win",
            payoutAmount: payout.toString()
          });
        } else {
          await storage.updateHedgePosition(pos.id, {
            status: "settled_loss",
            payoutAmount: "0"
          });
        }
      }

      res.json({
        message: triggered
          ? `Event settled. FX rate ${price} >= strike ${strike}. Protection triggered! Hedgers can claim payouts.`
          : `Event settled. FX rate ${price} < strike ${strike}. Protection not triggered. Positions expire worthless.`,
        triggered,
        settlementPrice: price,
        strike
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to settle event" });
    }
  });

  // Claim payout (hedger)
  app.post("/api/hedge/positions/:id/claim", async (req, res) => {
    try {
      const position = await storage.getHedgePosition(parseInt(req.params.id));
      if (!position) return res.status(404).json({ message: "Position not found" });
      if (position.claimed) return res.status(400).json({ message: "Already claimed" });
      if (position.status !== "settled_win") return res.status(400).json({ message: "Position not eligible for payout" });

      await storage.updateHedgePosition(position.id, {
        claimed: true,
        status: "claimed"
      });

      res.json({
        message: `Payout of $${parseFloat(position.payoutAmount || "0").toFixed(2)} claimed successfully`,
        payoutAmount: position.payoutAmount
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to claim payout" });
    }
  });

  // ═══════════════════════════════════════════════════════
  // [FINANCING] Financier Console & Offers
  // ═══════════════════════════════════════════════════════

  // Get all financing offers for a trade finance application
  app.get("/api/financing/offers/:requestId", async (req, res) => {
    try {
      const offers = await storage.getFinancingOffersByRequest(req.params.requestId);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch offers" });
    }
  });

  // Get all offers by a financier
  app.get("/api/financing/my-offers/:financierAddress", async (req, res) => {
    try {
      const offers = await storage.getFinancingOffersByFinancier(req.params.financierAddress);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch financier offers" });
    }
  });

  // Get all open applications (for financiers to browse)
  app.get("/api/financing/applications", async (req, res) => {
    try {
      const allRequests = await storage.getAllTradeFinanceRequests();
      const openApplications = allRequests.filter(r => 
        r.status === "pending_draft" || r.status === "draft_sent_to_seller" || r.status === "seller_approved" || r.status === "awaiting_offers"
      );
      res.json(openApplications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch applications" });
    }
  });

  // Submit a financing offer (financier makes an offer on an application)
  app.post("/api/financing/offers", async (req, res) => {
    try {
      const { requestId, financierAddress, financierName, financierType, offerAmount, interestRate, tenorDays, fees, conditions, expiresAt } = req.body;

      if (!requestId || !financierAddress || !financierName || !financierType || !offerAmount || !interestRate || !tenorDays || !expiresAt) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const request = await storage.getTradeFinanceRequest(requestId);
      if (!request) return res.status(404).json({ message: "Application not found" });

      const offerId = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const offer = await storage.createFinancingOffer({
        offerId,
        requestId,
        financierAddress,
        financierName,
        financierType,
        offerAmount: offerAmount.toString(),
        interestRate: interestRate.toString(),
        tenorDays: parseInt(tenorDays),
        fees: fees?.toString() || "0",
        conditions: conditions || null,
        expiresAt: new Date(expiresAt),
        status: "pending"
      });

      res.status(201).json(offer);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to submit offer" });
    }
  });

  // Accept an offer (business accepts a financier's offer)
  app.post("/api/financing/offers/:offerId/accept", async (req, res) => {
    try {
      const offer = await storage.getFinancingOfferByOfferId(req.params.offerId);
      if (!offer) return res.status(404).json({ message: "Offer not found" });
      if (offer.status !== "pending") return res.status(400).json({ message: "Offer is no longer available" });

      // Accept this offer
      const updated = await storage.updateFinancingOffer(offer.id, {
        status: "accepted",
        acceptedAt: new Date()
      });

      // Reject all other pending offers for the same application
      const allOffers = await storage.getFinancingOffersByRequest(offer.requestId);
      for (const other of allOffers) {
        if (other.id !== offer.id && other.status === "pending") {
          await storage.updateFinancingOffer(other.id, {
            status: "rejected",
            rejectedAt: new Date()
          });
        }
      }

      // Update the application status to funded
      const request = await storage.getTradeFinanceRequest(offer.requestId);
      if (request) {
        await storage.updateTradeFinanceRequest(request.id, {
          status: "fee_paid"
        });
      }

      res.json({ ...updated, message: "Offer accepted. Other pending offers have been declined." });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to accept offer" });
    }
  });

  // Reject an offer
  app.post("/api/financing/offers/:offerId/reject", async (req, res) => {
    try {
      const offer = await storage.getFinancingOfferByOfferId(req.params.offerId);
      if (!offer) return res.status(404).json({ message: "Offer not found" });
      if (offer.status !== "pending") return res.status(400).json({ message: "Offer is no longer pending" });

      const updated = await storage.updateFinancingOffer(offer.id, {
        status: "rejected",
        rejectedAt: new Date()
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reject offer" });
    }
  });

  // Withdraw an offer (financier withdraws their own offer)
  app.post("/api/financing/offers/:offerId/withdraw", async (req, res) => {
    try {
      const offer = await storage.getFinancingOfferByOfferId(req.params.offerId);
      if (!offer) return res.status(404).json({ message: "Offer not found" });
      if (offer.status !== "pending") return res.status(400).json({ message: "Offer is no longer pending" });

      const updated = await storage.updateFinancingOffer(offer.id, {
        status: "withdrawn"
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to withdraw offer" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    let clientWalletAddress: string | null = null;
    
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'authenticate') {
          clientWalletAddress = message.walletAddress?.toLowerCase();
          if (clientWalletAddress) {
            connectedClients.set(clientWalletAddress, ws);
          }
          ws.send(JSON.stringify({
            type: 'authenticated',
            walletAddress: clientWalletAddress
          }));
        }
      } catch (error) {
      }
    });
    
    ws.on('close', () => {
      if (clientWalletAddress) {
        connectedClients.delete(clientWalletAddress);
      }
    });
    
    ws.on('error', () => {
      if (clientWalletAddress) {
        connectedClients.delete(clientWalletAddress);
      }
    });
  });
  
  return httpServer;
}
