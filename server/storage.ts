/**
 * Database Storage Interface and Implementation
 * 
 * Provides comprehensive CRUD operations for all database entities
 * including wallets, messages, contacts, referrals, and user profiles.
 */

import { 
  wallets, 
  networks, 
  transactions, 
  balances,
  contacts,
  userProfiles,
  referralCodes,
  referrals,
  userPoints,
  pointTransactions,
  escrowContracts,
  escrows,
  userRoles,
  eventLogs,
  tokenRegistry,
  subWallets,
  subWalletInvitations,
  contractDrafts,
  contractSignatures,
  contractDeliverables,
  contractVerifications,
  contractDocuments,
  invoices,
  invoiceItems,
  invoiceTemplates,
  invoicePayments,
  invoiceNotifications,
  waitlist,
  type Waitlist,
  type InsertWaitlist,
  type Wallet, 
  type InsertWallet,
  type Network,
  type InsertNetwork,
  type Transaction,
  type InsertTransaction,
  type Balance,
  type InsertBalance,
  type Contact,
  type InsertContact,
  type UserProfile,
  type InsertUserProfile,
  type ReferralCode,
  type InsertReferralCode,
  type Referral,
  type InsertReferral,
  type UserPoints,
  type InsertUserPoints,
  type PointTransaction,
  type InsertPointTransaction,
  type EscrowContract,
  type InsertEscrowContract,
  type Escrow,
  type InsertEscrow,
  type UserRole,
  type InsertUserRole,
  type EventLog,
  type InsertEventLog,
  type TokenRegistry,
  type InsertTokenRegistry,
  type SubWallet,
  type InsertSubWallet,
  type SubWalletInvitation,
  type InsertSubWalletInvitation,
  type ContractDraft,
  type InsertContractDraft,
  type ContractSignature,
  type InsertContractSignature,
  type ContractDeliverable,
  type InsertContractDeliverable,
  type ContractVerification,
  type InsertContractVerification,
  type ContractDocument,
  type InsertContractDocument,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type InvoiceTemplate,
  type InsertInvoiceTemplate,
  type InvoicePayment,
  type InsertInvoicePayment,
  type InvoiceNotification,
  type InsertInvoiceNotification,
  notifications,
  type Notification,
  type InsertNotification,
  liquidityPoolStakes,
  type LiquidityPoolStake,
  type InsertLiquidityPoolStake,
  tradeFinanceRequests,
  type TradeFinanceRequest,
  type InsertTradeFinanceRequest,
  tradeFinanceVotes,
  type TradeFinanceVote,
  type InsertTradeFinanceVote,
  performanceBonds,
  type PerformanceBond,
  type InsertPerformanceBond,
  tradeCollateral,
  type TradeCollateral,
  type InsertTradeCollateral,
  deliveryProofs,
  type DeliveryProof,
  type InsertDeliveryProof,
  goodsCollateral,
  type GoodsCollateral,
  type InsertGoodsCollateral,
  guaranteeClaims,
  type GuaranteeClaim,
  type InsertGuaranteeClaim,
  claimVotes,
  type ClaimVote,
  type InsertClaimVote,
  guaranteeIssuanceFees,
  type GuaranteeIssuanceFee,
  type InsertGuaranteeIssuanceFee,
  tradeFinanceDocuments,
  type TradeFinanceDocument,
  type InsertTradeFinanceDocument,
  tradeFinanceCertificates,
  type TradeFinanceCertificate,
  type InsertTradeFinanceCertificate,
  feeDistributions,
  type FeeDistribution,
  type InsertFeeDistribution,
  disputes,
  type Dispute,
  type InsertDispute,
  kycVerifications,
  type KycVerification,
  type InsertKycVerification,
  platformAnalytics,
  type PlatformAnalytics,
  type InsertPlatformAnalytics,
  emailNotifications,
  type EmailNotification,
  type InsertEmailNotification,
  specialistRoles,
  type SpecialistRole,
  type InsertSpecialistRole,
  specialistCredentials,
  type SpecialistCredential,
  type InsertSpecialistCredential,
  specialistStatistics,
  type SpecialistStatistics,
  type InsertSpecialistStatistics,
  voteDelegations,
  type VoteDelegation,
  type InsertVoteDelegation,
  marketplaceBusinesses,
  type MarketplaceBusiness,
  type InsertMarketplaceBusiness,
  marketplaceProducts,
  type MarketplaceProduct,
  type InsertMarketplaceProduct,
  marketplaceRfqs,
  type MarketplaceRfq,
  type InsertMarketplaceRfq,
  marketplaceQuotes,
  type MarketplaceQuote,
  type InsertMarketplaceQuote,
  marketplaceReviews,
  type MarketplaceReview,
  type InsertMarketplaceReview,
  marketplaceConnections,
  type MarketplaceConnection,
  type InsertMarketplaceConnection,
  tradeCorridors,
  type TradeCorridor,
  type InsertTradeCorridor,
  hedgeEvents,
  type HedgeEvent,
  type InsertHedgeEvent,
  hedgePositions,
  type HedgePosition,
  type InsertHedgePosition,
  hedgeLpDeposits,
  type HedgeLpDeposit,
  type InsertHedgeLpDeposit,
  financingOffers,
  type FinancingOffer,
  type InsertFinancingOffer
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and, sql } from "drizzle-orm";

/**
 * Storage interface defining all database operations
 * Ensures consistent data access patterns across the application
 */
export interface IStorage {
  // ═══════════════════════════════════════════════════════
  // TABLE OF CONTENTS
  // ═══════════════════════════════════════════════════════
  // [WALLET]                  Wallet Management
  // [NETWORK]                 Network Management
  // [TRANSACTION]             Transaction Management
  // [BALANCE]                 Balance Management
  // [CONTACTS]                Contacts
  // [PROFILES]                User Profiles
  // [REFERRALS]               Referral System
  // [ESCROW]                  Escrow Stats
  // [SUB-WALLET]              Sub-Wallet Management
  // [SUB-WALLET-INVITATIONS]  Sub-Wallet Invitations
  // [PORTFOLIO]               Portfolio Stats
  // [INVOICES]                Invoice Management
  // [TRADE-FINANCE]           Trade Finance Applications
  // [MARKETPLACE]             B2B Marketplace
  // [HEDGE]                   P2P Trade Hedge
  // [FINANCING]               Financier Console
  // ═══════════════════════════════════════════════════════

  // Wallet operations
  getWallet(id: number): Promise<Wallet | undefined>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  getAllWallets(): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;

  // Network operations
  getNetwork(id: number): Promise<Network | undefined>;
  getNetworkByChainId(chainId: number): Promise<Network | undefined>;
  getAllNetworks(): Promise<Network[]>;
  createNetwork(network: InsertNetwork): Promise<Network>;
  updateNetwork(id: number, updates: Partial<InsertNetwork>): Promise<Network | undefined>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByHash(hash: string): Promise<Transaction | undefined>;
  getTransactions(filters: {
    walletId?: number;
    networkId?: number;
    status?: string;
    limit?: number;
  }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined>;

  // Balance operations
  getBalance(id: number): Promise<Balance | undefined>;
  getBalances(filters: {
    walletId?: number;
    networkId?: number;
  }): Promise<Balance[]>;
  createBalance(balance: InsertBalance): Promise<Balance>;
  updateBalance(id: number, updates: Partial<InsertBalance>): Promise<Balance | undefined>;

  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContacts(ownerWalletAddress: string): Promise<Contact[]>;
  getContactByAddress(ownerWalletAddress: string, contactWalletAddress: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Profile operations
  getUserProfile(walletAddress: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(walletAddress: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  deleteUserProfile(walletAddress: string): Promise<boolean>;

  // Referral operations
  createReferralCode(code: InsertReferralCode): Promise<ReferralCode>;
  getReferralCode(code: string): Promise<ReferralCode | undefined>;
  getReferralCodesByWallet(walletAddress: string): Promise<ReferralCode[]>;
  updateReferralCodeUses(code: string): Promise<ReferralCode | undefined>;
  
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralsByWallet(walletAddress: string): Promise<Referral[]>;
  getAllReferrals(): Promise<Referral[]>;
  updateReferralStatus(id: number, status: string): Promise<Referral | undefined>;
  
  getUserPoints(walletAddress: string): Promise<UserPoints | undefined>;
  getAllUserPoints(): Promise<UserPoints[]>;
  createUserPoints(points: InsertUserPoints): Promise<UserPoints>;
  updateUserPoints(walletAddress: string, points: number): Promise<UserPoints | undefined>;
  
  createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction>;
  getPointTransactions(walletAddress: string): Promise<PointTransaction[]>;

  // Escrow Contract operations
  getEscrowContract(id: number): Promise<EscrowContract | undefined>;
  getEscrowContractByAddress(address: string): Promise<EscrowContract | undefined>;
  getAllEscrowContracts(): Promise<EscrowContract[]>;
  createEscrowContract(contract: InsertEscrowContract): Promise<EscrowContract>;
  updateEscrowContract(id: number, updates: Partial<InsertEscrowContract>): Promise<EscrowContract | undefined>;

  // Escrow operations
  getEscrow(id: number): Promise<Escrow | undefined>;
  getEscrowByContractAndId(contractAddress: string, escrowId: string): Promise<Escrow | undefined>;
  getEscrows(filters: {
    status?: string;
    exporter?: string;
    importer?: string;
    financier?: string;
    networkId?: number;
    limit?: number;
  }): Promise<Escrow[]>;
  getAllEscrows(): Promise<Escrow[]>;
  createEscrow(escrow: InsertEscrow): Promise<Escrow>;
  updateEscrow(id: number, updates: Partial<InsertEscrow>): Promise<Escrow | undefined>;

  // User Role operations
  getUserRole(walletAddress: string): Promise<UserRole | undefined>;
  getAllUserRoles(): Promise<UserRole[]>;
  createUserRole(role: InsertUserRole): Promise<UserRole>;
  updateUserRole(walletAddress: string, updates: Partial<InsertUserRole>): Promise<UserRole | undefined>;

  // Event Log operations
  getEventLogs(filters: {
    contractAddress?: string;
    eventName?: string;
    networkId?: number;
    limit?: number;
  }): Promise<EventLog[]>;
  createEventLog(log: InsertEventLog): Promise<EventLog>;

  // Token Registry operations
  getTokenRegistry(id: number): Promise<TokenRegistry | undefined>;
  getTokenByAddress(address: string, networkId: number): Promise<TokenRegistry | undefined>;
  getAllTokens(): Promise<TokenRegistry[]>;
  getActiveTokens(networkId?: number): Promise<TokenRegistry[]>;
  createToken(token: InsertTokenRegistry): Promise<TokenRegistry>;
  updateToken(id: number, updates: Partial<InsertTokenRegistry>): Promise<TokenRegistry | undefined>;

  // Sub-wallet operations
  getSubWallet(id: number): Promise<SubWallet | undefined>;
  getSubWalletByAddress(address: string): Promise<SubWallet | undefined>;
  getSubWalletsByMainWallet(mainWalletAddress: string): Promise<SubWallet[]>;
  getSubWalletsByContract(contractId: string): Promise<SubWallet[]>;
  createSubWallet(subWallet: InsertSubWallet): Promise<SubWallet>;
  updateSubWallet(id: number, updates: Partial<InsertSubWallet>): Promise<SubWallet | undefined>;
  deactivateSubWallet(id: number): Promise<boolean>;
  deleteSubWallet(address: string): Promise<boolean>;

  // Sub-wallet invitation operations
  getSubWalletInvitation(id: number): Promise<SubWalletInvitation | undefined>;
  getInvitation(id: number): Promise<SubWalletInvitation | undefined>;
  getInvitationsByInvitee(inviteeAddress: string): Promise<SubWalletInvitation[]>;
  getInvitationsByInviter(inviterAddress: string): Promise<SubWalletInvitation[]>;
  getPendingInvitations(inviteeAddress: string): Promise<SubWalletInvitation[]>;
  createSubWalletInvitation(invitation: InsertSubWalletInvitation): Promise<SubWalletInvitation>;
  updateInvitationStatus(id: number, status: string, respondedAt?: Date): Promise<SubWalletInvitation | undefined>;

  // Contract operations
  getContractDraftById(id: number): Promise<ContractDraft | undefined>;
  addContractCosigner(contractId: number, signature: InsertContractSignature): Promise<ContractSignature>;

  // Contract signature operations
  createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
  getContractSignatures(contractId: number): Promise<ContractSignature[]>;
  getAllContractSignatures(): Promise<ContractSignature[]>;

  // Contract deliverable operations
  createContractDeliverable(deliverable: InsertContractDeliverable): Promise<ContractDeliverable>;
  getContractDeliverable(id: number): Promise<ContractDeliverable | undefined>;
  getContractDeliverables(contractId: number): Promise<ContractDeliverable[]>;
  updateContractDeliverable(id: number, updates: Partial<InsertContractDeliverable>): Promise<ContractDeliverable | undefined>;
  claimDeliverable(id: number, claimedBy: string): Promise<ContractDeliverable | undefined>;
  
  // Contract verification operations
  createContractVerification(verification: InsertContractVerification): Promise<ContractVerification>;
  getContractVerification(deliverableId: number, verifierAddress: string): Promise<ContractVerification | undefined>;
  getContractVerifications(deliverableId: number): Promise<ContractVerification[]>;
  
  // Contract document operations
  createContractDocument(document: InsertContractDocument): Promise<ContractDocument>;
  getContractDocument(id: number): Promise<ContractDocument | undefined>;
  getContractDocuments(contractId: number): Promise<ContractDocument[]>;
  deleteContractDocument(id: number): Promise<boolean>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(recipientAddress: string): Promise<Notification[]>;
  getUnreadNotifications(recipientAddress: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(recipientAddress: string): Promise<void>;

  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoicesBySender(senderAddress: string): Promise<Invoice[]>;
  getInvoicesByRecipient(recipientAddress: string): Promise<Invoice[]>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  markInvoiceAsPaid(id: number, paymentData: { txHash: string; amount: string; paidBy: string }): Promise<Invoice | undefined>;

  // Invoice items operations
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  updateInvoiceItem(id: number, updates: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;

  // Invoice templates operations
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
  getInvoiceTemplatesByCreator(creatorAddress: string): Promise<InvoiceTemplate[]>;
  updateInvoiceTemplate(id: number, updates: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
  deleteInvoiceTemplate(id: number): Promise<boolean>;

  // Invoice payments operations
  createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment>;
  getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]>;
  updateInvoicePayment(id: number, updates: Partial<InsertInvoicePayment>): Promise<InvoicePayment | undefined>;

  // Invoice notifications operations
  createInvoiceNotification(notification: InsertInvoiceNotification): Promise<InvoiceNotification>;
  getInvoiceNotifications(invoiceId: number): Promise<InvoiceNotification[]>;
  updateInvoiceNotification(id: number, updates: Partial<InsertInvoiceNotification>): Promise<InvoiceNotification | undefined>;

  // Statistics
  getPortfolioStats(walletId: number): Promise<{
    totalValue: number;
    networkBreakdown: Array<{
      networkId: number;
      balance: string;
      usdValue: number;
      percentage: number;
    }>;
    transactionCount: number;
    lastActivity: Date | null;
  }>;

  // Escrow Analytics
  getEscrowStats(): Promise<{
    totalEscrows: number;
    totalValueLocked: number;
    escrowsByStatus: Record<string, number>;
    escrowsByRole: Record<string, number>;
    averageEscrowValue: number;
    topTokens: Array<{
      symbol: string;
      count: number;
      totalValue: number;
    }>;
  }>;

  // Trade Finance operations
  createLiquidityStake(stake: InsertLiquidityPoolStake): Promise<LiquidityPoolStake>;
  getLiquidityStakes(filters: {
    id?: number;
    stakerAddress?: string;
    status?: string;
  }): Promise<LiquidityPoolStake[]>;
  updateLiquidityStake(id: number, updates: Partial<InsertLiquidityPoolStake>): Promise<LiquidityPoolStake | undefined>;
  
  createTradeFinanceRequest(request: InsertTradeFinanceRequest): Promise<TradeFinanceRequest>;
  getTradeFinanceRequests(filters: {
    buyerAddress?: string;
    sellerAddress?: string;
    status?: string;
  }): Promise<TradeFinanceRequest[]>;
  getAllTradeFinanceRequests(): Promise<TradeFinanceRequest[]>;
  getTradeFinanceRequestsByBuyer(buyerAddress: string): Promise<TradeFinanceRequest[]>;
  getTradeFinanceRequestsBySeller(sellerAddress: string): Promise<TradeFinanceRequest[]>;
  getTradeFinanceRequest(requestId: string): Promise<TradeFinanceRequest | undefined>;
  updateTradeFinanceRequest(requestId: string, updates: Partial<InsertTradeFinanceRequest>): Promise<TradeFinanceRequest | undefined>;
  
  createTradeFinanceVote(vote: InsertTradeFinanceVote): Promise<TradeFinanceVote>;
  getTradeFinanceVotes(requestId: string): Promise<TradeFinanceVote[]>;
  
  getPoolStatistics(): Promise<{
    totalStaked: string;
    totalLPs: number;
    activeRequests: number;
    totalFinanced: string;
  }>;
  
  createPerformanceBond(bond: InsertPerformanceBond): Promise<PerformanceBond>;
  getPerformanceBond(requestId: string): Promise<PerformanceBond | undefined>;
  
  createTradeCollateral(collateral: InsertTradeCollateral): Promise<TradeCollateral>;
  getTradeCollateral(requestId: string): Promise<TradeCollateral[]>;

  // Trade Finance Documents (Invoice uploads)
  createDocument(document: InsertTradeFinanceDocument): Promise<TradeFinanceDocument>;
  getDocument(id: number): Promise<TradeFinanceDocument | undefined>;
  getDocumentsByRequestId(requestId: string): Promise<TradeFinanceDocument[]>;
  getDocumentsByType(requestId: string, documentType: string): Promise<TradeFinanceDocument[]>;

  // Trade Finance Certificates (Draft and Final guarantees)
  createCertificate(certificate: InsertTradeFinanceCertificate): Promise<TradeFinanceCertificate>;
  getCertificate(id: number): Promise<TradeFinanceCertificate | undefined>;
  getCertificatesByRequestId(requestId: string): Promise<TradeFinanceCertificate[]>;
  getAllCertificates(): Promise<TradeFinanceCertificate[]>;
  getActiveCertificate(requestId: string, type: string): Promise<TradeFinanceCertificate | undefined>;
  updateCertificate(id: number, updates: Partial<InsertTradeFinanceCertificate>): Promise<TradeFinanceCertificate | undefined>;

  // Trade Finance delivery operations
  createDeliveryProof(proof: InsertDeliveryProof): Promise<DeliveryProof>;
  getDeliveryProof(requestId: string): Promise<DeliveryProof | undefined>;
  updateDeliveryProof(requestId: string, updates: Partial<InsertDeliveryProof>): Promise<DeliveryProof | undefined>;

  createGoodsCollateral(collateral: InsertGoodsCollateral): Promise<GoodsCollateral>;
  getGoodsCollateral(requestId: string): Promise<GoodsCollateral | undefined>;
  getGoodsCollateralByRequestId(requestId: string): Promise<GoodsCollateral | undefined>;
  updateGoodsCollateral(id: number, updates: Partial<InsertGoodsCollateral>): Promise<GoodsCollateral | undefined>;
  getAllGoodsCollateral(): Promise<GoodsCollateral[]>;

  createGuaranteeClaim(claim: InsertGuaranteeClaim): Promise<GuaranteeClaim>;
  getGuaranteeClaims(filters: {
    requestId?: string;
    status?: string;
  }): Promise<GuaranteeClaim[]>;
  getGuaranteeClaim(id: number): Promise<GuaranteeClaim | undefined>;
  updateGuaranteeClaim(id: number, updates: Partial<InsertGuaranteeClaim>): Promise<GuaranteeClaim | undefined>;
  
  createClaimVote(vote: InsertClaimVote): Promise<ClaimVote>;
  getClaimVotes(claimId: number): Promise<ClaimVote[]>;
  getClaimVoteByVoter(claimId: number, voterAddress: string): Promise<ClaimVote | undefined>;

  createGuaranteeIssuanceFee(fee: InsertGuaranteeIssuanceFee): Promise<GuaranteeIssuanceFee>;
  getGuaranteeIssuanceFee(requestId: string): Promise<GuaranteeIssuanceFee | undefined>;

  // Specialist Role operations
  createSpecialistRole(role: InsertSpecialistRole): Promise<SpecialistRole>;
  getSpecialistRole(walletAddress: string): Promise<SpecialistRole | undefined>;
  getSpecialistRolesByType(roleType: string): Promise<SpecialistRole[]>;
  getAllSpecialistRoles(): Promise<SpecialistRole[]>;
  updateSpecialistRole(walletAddress: string, updates: Partial<InsertSpecialistRole>): Promise<SpecialistRole | undefined>;
  
  // Specialist Credential operations
  createSpecialistCredential(credential: InsertSpecialistCredential): Promise<SpecialistCredential>;
  getSpecialistCredentials(specialistAddress: string): Promise<SpecialistCredential[]>;
  getSpecialistCredential(id: number): Promise<SpecialistCredential | undefined>;
  updateSpecialistCredential(id: number, updates: Partial<InsertSpecialistCredential>): Promise<SpecialistCredential | undefined>;
  
  // Specialist Statistics operations
  getSpecialistStatistics(specialistAddress: string): Promise<SpecialistStatistics | undefined>;
  updateSpecialistStatistics(specialistAddress: string, updates: Partial<InsertSpecialistStatistics>): Promise<SpecialistStatistics | undefined>;
  createSpecialistStatistics(stats: InsertSpecialistStatistics): Promise<SpecialistStatistics>;

  // Vote Delegation operations
  createVoteDelegation(delegation: InsertVoteDelegation): Promise<VoteDelegation>;
  revokeVoteDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined>;
  getCurrentActiveDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined>;
  getVoteDelegationsByDelegate(delegateAddress: string): Promise<VoteDelegation[]>;
  getTotalDelegatedPower(delegateAddress: string): Promise<number>;

  // ═══════════════════════════════════════════════════════
  // [MARKETPLACE] B2B Marketplace
  // ═══════════════════════════════════════════════════════
  
  // Marketplace Business operations
  createMarketplaceBusiness(business: InsertMarketplaceBusiness): Promise<MarketplaceBusiness>;
  getMarketplaceBusiness(walletAddress: string): Promise<MarketplaceBusiness | undefined>;
  getMarketplaceBusinessById(id: number): Promise<MarketplaceBusiness | undefined>;
  searchMarketplaceBusinesses(filters: {
    industry?: string;
    country?: string;
    region?: string;
    companyType?: string;
    productCategories?: string[];
    isVerified?: boolean;
    minTradeScore?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceBusiness[]>;
  updateMarketplaceBusiness(walletAddress: string, updates: Partial<InsertMarketplaceBusiness>): Promise<MarketplaceBusiness | undefined>;
  incrementBusinessProfileViews(walletAddress: string): Promise<void>;

  // Marketplace Product operations
  createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct>;
  getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined>;
  getMarketplaceProductsByBusiness(businessId: number): Promise<MarketplaceProduct[]>;
  searchMarketplaceProducts(filters: {
    category?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceProduct[]>;
  updateMarketplaceProduct(id: number, updates: Partial<InsertMarketplaceProduct>): Promise<MarketplaceProduct | undefined>;
  deleteMarketplaceProduct(id: number): Promise<boolean>;

  // Marketplace RFQ operations
  createMarketplaceRfq(rfq: InsertMarketplaceRfq): Promise<MarketplaceRfq>;
  getMarketplaceRfq(id: number): Promise<MarketplaceRfq | undefined>;
  getMarketplaceRfqByNumber(rfqNumber: string): Promise<MarketplaceRfq | undefined>;
  getMarketplaceRfqsByBuyer(buyerWallet: string): Promise<MarketplaceRfq[]>;
  searchMarketplaceRfqs(filters: {
    productCategory?: string;
    deliveryCountry?: string;
    status?: string;
    minBudget?: string;
    maxBudget?: string;
    tradeFinancePreferred?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceRfq[]>;
  updateMarketplaceRfq(id: number, updates: Partial<InsertMarketplaceRfq>): Promise<MarketplaceRfq | undefined>;

  // Marketplace Quote operations
  createMarketplaceQuote(quote: InsertMarketplaceQuote): Promise<MarketplaceQuote>;
  getMarketplaceQuote(id: number): Promise<MarketplaceQuote | undefined>;
  getMarketplaceQuotesByRfq(rfqId: number): Promise<MarketplaceQuote[]>;
  getMarketplaceQuotesBySupplier(supplierWallet: string): Promise<MarketplaceQuote[]>;
  updateMarketplaceQuote(id: number, updates: Partial<InsertMarketplaceQuote>): Promise<MarketplaceQuote | undefined>;

  // Marketplace Review operations
  createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>;
  getMarketplaceReviewsByBusiness(businessWallet: string): Promise<MarketplaceReview[]>;
  getMarketplaceReviewsByReviewer(reviewerWallet: string): Promise<MarketplaceReview[]>;
  getAverageBusinessRating(businessWallet: string): Promise<{ rating: number; count: number }>;
  updateMarketplaceReview(id: number, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview | undefined>;

  // Marketplace Connection operations
  createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection>;
  getMarketplaceConnections(walletAddress: string): Promise<MarketplaceConnection[]>;
  getMarketplaceConnection(requesterWallet: string, targetWallet: string): Promise<MarketplaceConnection | undefined>;
  updateMarketplaceConnection(id: number, updates: Partial<InsertMarketplaceConnection>): Promise<MarketplaceConnection | undefined>;

  // Trade Corridor operations
  createTradeCorridor(corridor: InsertTradeCorridor): Promise<TradeCorridor>;
  getTradeCorridor(id: number): Promise<TradeCorridor | undefined>;
  getAllTradeCorridors(): Promise<TradeCorridor[]>;
  getTradeCorridorsByRegion(sourceRegion: string, destinationRegion: string): Promise<TradeCorridor[]>;
  updateTradeCorridor(id: number, updates: Partial<InsertTradeCorridor>): Promise<TradeCorridor | undefined>;

  // Hedge Event operations
  createHedgeEvent(event: InsertHedgeEvent): Promise<HedgeEvent>;
  getHedgeEvent(id: number): Promise<HedgeEvent | undefined>;
  getAllHedgeEvents(): Promise<HedgeEvent[]>;
  getOpenHedgeEvents(): Promise<HedgeEvent[]>;
  updateHedgeEvent(id: number, updates: Partial<HedgeEvent>): Promise<HedgeEvent | undefined>;

  // Hedge Position operations
  createHedgePosition(position: InsertHedgePosition): Promise<HedgePosition>;
  getHedgePosition(id: number): Promise<HedgePosition | undefined>;
  getHedgePositionsByEvent(eventId: number): Promise<HedgePosition[]>;
  getHedgePositionsByWallet(wallet: string): Promise<HedgePosition[]>;
  updateHedgePosition(id: number, updates: Partial<HedgePosition>): Promise<HedgePosition | undefined>;

  // Hedge LP Deposit operations
  createHedgeLpDeposit(deposit: InsertHedgeLpDeposit): Promise<HedgeLpDeposit>;
  getHedgeLpDeposit(id: number): Promise<HedgeLpDeposit | undefined>;
  getHedgeLpDepositsByEvent(eventId: number): Promise<HedgeLpDeposit[]>;
  getHedgeLpDepositsByWallet(wallet: string): Promise<HedgeLpDeposit[]>;
  updateHedgeLpDeposit(id: number, updates: Partial<HedgeLpDeposit>): Promise<HedgeLpDeposit | undefined>;

  // Financing Offer operations
  createFinancingOffer(offer: InsertFinancingOffer): Promise<FinancingOffer>;
  getFinancingOffer(id: number): Promise<FinancingOffer | undefined>;
  getFinancingOfferByOfferId(offerId: string): Promise<FinancingOffer | undefined>;
  getFinancingOffersByRequest(requestId: string): Promise<FinancingOffer[]>;
  getFinancingOffersByFinancier(financierAddress: string): Promise<FinancingOffer[]>;
  updateFinancingOffer(id: number, updates: Partial<FinancingOffer>): Promise<FinancingOffer | undefined>;
}

export class MemStorage implements IStorage {
  private wallets: Map<number, Wallet>;
  private networks: Map<number, Network>;
  private transactions: Map<number, Transaction>;
  private balances: Map<number, Balance>;
  private profiles: Map<string, UserProfile>;
  private transactionsByHash: Map<string, Transaction>;
  private contacts: Map<number, Contact>;
  private referralCodes: Map<string, ReferralCode>;
  private referrals: Map<number, Referral>;
  private userPoints: Map<string, UserPoints>;
  private pointTransactions: Map<number, PointTransaction>;
  private userRoles: Map<string, UserRole>;
  private escrowContracts: Map<number, EscrowContract>;
  private escrows: Map<number, Escrow>;
  private eventLogs: Map<number, EventLog>;
  private tokenRegistry: Map<number, TokenRegistry>;
  private subWallets: Map<number, SubWallet>;
  private subWalletInvitations: Map<number, SubWalletInvitation>;
  private contractSignatures: Map<number, ContractSignature>;
  private currentWalletId: number;
  private currentNetworkId: number;
  private currentTransactionId: number;
  private currentBalanceId: number;
  private currentProfileId: number;
  private currentContactId: number;
  private currentReferralId: number;
  private currentPointTransactionId: number;
  private currentUserRoleId: number;
  private currentEscrowContractId: number;
  private currentEscrowId: number;
  private currentEventLogId: number;
  private currentTokenId: number;
  private currentSubWalletId: number;
  private currentSubWalletInvitationId: number;
  private currentContractSignatureId: number;

  constructor() {
    this.wallets = new Map();
    this.networks = new Map();
    this.transactions = new Map();
    this.balances = new Map();
    this.profiles = new Map();
    this.transactionsByHash = new Map();
    this.contacts = new Map();
    this.referralCodes = new Map();
    this.referrals = new Map();
    this.userPoints = new Map();
    this.pointTransactions = new Map();
    this.userRoles = new Map();
    this.escrowContracts = new Map();
    this.escrows = new Map();
    this.eventLogs = new Map();
    this.tokenRegistry = new Map();
    this.subWallets = new Map();
    this.subWalletInvitations = new Map();
    this.contractSignatures = new Map();
    this.currentWalletId = 1;
    this.currentNetworkId = 1;
    this.currentTransactionId = 1;
    this.currentBalanceId = 1;
    this.currentProfileId = 1;
    this.currentContactId = 1;
    this.currentReferralId = 1;
    this.currentPointTransactionId = 1;
    this.currentUserRoleId = 1;
    this.currentEscrowContractId = 1;
    this.currentEscrowId = 1;
    this.currentEventLogId = 1;
    this.currentTokenId = 1;
    this.currentSubWalletId = 1;
    this.currentSubWalletInvitationId = 1;
    this.currentContractSignatureId = 1;

    // Initialize with default testnet networks
    this.initializeDefaultNetworks();
  }

  private async initializeDefaultNetworks(): Promise<void> {
    const defaultNetworks: InsertNetwork[] = [
      {
        name: "Base Sepolia",
        chainId: 84532,
        rpcUrl: "https://sepolia.base.org",
        symbol: "ETH",
        blockExplorerUrl: "https://sepolia-explorer.base.org",
        isTestnet: true
      },
      {
        name: "Ethereum Sepolia",
        chainId: 11155111,
        rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
        symbol: "ETH",
        blockExplorerUrl: "https://sepolia.etherscan.io",
        isTestnet: true
      },
      {
        name: "Polygon Mumbai",
        chainId: 80001,
        rpcUrl: "https://rpc-mumbai.maticvigil.com",
        symbol: "MATIC",
        blockExplorerUrl: "https://mumbai.polygonscan.com",
        isTestnet: true
      },
      {
        name: "BSC Testnet",
        chainId: 97,
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
        symbol: "BNB",
        blockExplorerUrl: "https://testnet.bscscan.com",
        isTestnet: true
      },
      {
        name: "Arbitrum Goerli",
        chainId: 421613,
        rpcUrl: "https://goerli-rollup.arbitrum.io/rpc",
        symbol: "ETH",
        blockExplorerUrl: "https://goerli.arbiscan.io",
        isTestnet: true
      }
    ];

    for (const network of defaultNetworks) {
      await this.createNetwork(network);
    }
  }

  // Wallet operations
  async getWallet(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      wallet => wallet.address.toLowerCase() === address.toLowerCase()
    );
  }

  async getAllWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = {
      ...insertWallet,
      id,
      encryptedMnemonic: insertWallet.encryptedMnemonic || null,
      isImported: insertWallet.isImported || false,
      createdAt: new Date()
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(id);
    if (!wallet) return undefined;

    const updatedWallet = { ...wallet, ...updates };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    return this.wallets.delete(id);
  }

  // Network operations
  async getNetwork(id: number): Promise<Network | undefined> {
    return this.networks.get(id);
  }

  async getNetworkByChainId(chainId: number): Promise<Network | undefined> {
    return Array.from(this.networks.values()).find(
      network => network.chainId === chainId
    );
  }

  async getAllNetworks(): Promise<Network[]> {
    return Array.from(this.networks.values());
  }

  async createNetwork(insertNetwork: InsertNetwork): Promise<Network> {
    const id = this.currentNetworkId++;
    const network: Network = { 
      ...insertNetwork, 
      id,
      blockExplorerUrl: insertNetwork.blockExplorerUrl || null,
      isTestnet: insertNetwork.isTestnet || false
    };
    this.networks.set(id, network);
    return network;
  }

  async updateNetwork(id: number, updates: Partial<InsertNetwork>): Promise<Network | undefined> {
    const network = this.networks.get(id);
    if (!network) return undefined;

    const updatedNetwork = { ...network, ...updates };
    this.networks.set(id, updatedNetwork);
    return updatedNetwork;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    return this.transactionsByHash.get(hash);
  }

  async getTransactions(filters: {
    walletId?: number;
    networkId?: number;
    status?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    let result = Array.from(this.transactions.values());

    if (filters.walletId) {
      result = result.filter(tx => tx.walletId === filters.walletId);
    }

    if (filters.networkId) {
      result = result.filter(tx => tx.networkId === filters.networkId);
    }

    if (filters.status) {
      result = result.filter(tx => tx.status === filters.status);
    }

    // Sort by timestamp, newest first
    result.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    if (filters.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      walletId: insertTransaction.walletId || null,
      networkId: insertTransaction.networkId || null,
      gasPrice: insertTransaction.gasPrice || null,
      gasUsed: insertTransaction.gasUsed || null,
      blockNumber: insertTransaction.blockNumber || null,
      timestamp: new Date()
    };
    
    this.transactions.set(id, transaction);
    this.transactionsByHash.set(transaction.hash, transaction);
    return transaction;
  }

  async updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactionsByHash.get(hash);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(transaction.id, updatedTransaction);
    this.transactionsByHash.set(hash, updatedTransaction);
    return updatedTransaction;
  }

  // Balance operations
  async getBalance(id: number): Promise<Balance | undefined> {
    return this.balances.get(id);
  }

  async getBalances(filters: {
    walletId?: number;
    networkId?: number;
  }): Promise<Balance[]> {
    let result = Array.from(this.balances.values());

    if (filters.walletId) {
      result = result.filter(balance => balance.walletId === filters.walletId);
    }

    if (filters.networkId) {
      result = result.filter(balance => balance.networkId === filters.networkId);
    }

    return result;
  }

  async createBalance(insertBalance: InsertBalance): Promise<Balance> {
    const id = this.currentBalanceId++;
    const balance: Balance = {
      ...insertBalance,
      id,
      walletId: insertBalance.walletId || null,
      networkId: insertBalance.networkId || null,
      usdValue: insertBalance.usdValue || null,
      lastUpdated: new Date()
    };
    this.balances.set(id, balance);
    return balance;
  }

  async updateBalance(id: number, updates: Partial<InsertBalance>): Promise<Balance | undefined> {
    const balance = this.balances.get(id);
    if (!balance) return undefined;

    const updatedBalance = { 
      ...balance, 
      ...updates,
      lastUpdated: new Date()
    };
    this.balances.set(id, updatedBalance);
    return updatedBalance;
  }

  // Sub-wallet operations
  async getSubWallet(id: number): Promise<SubWallet | undefined> {
    return this.subWallets.get(id);
  }

  async getSubWalletsByMainWallet(mainWalletAddress: string): Promise<SubWallet[]> {
    return Array.from(this.subWallets.values()).filter(
      subWallet => subWallet.mainWalletAddress === mainWalletAddress
    );
  }

  async getSubWalletsByContract(contractId: string): Promise<SubWallet[]> {
    return Array.from(this.subWallets.values()).filter(
      subWallet => subWallet.contractId === contractId
    );
  }

  async createSubWallet(subWallet: InsertSubWallet): Promise<SubWallet> {
    const id = this.currentSubWalletId++;
    const newSubWallet: SubWallet = {
      id,
      address: subWallet.address,
      name: subWallet.name || `Contract Sub-Wallet`,
      encryptedPrivateKey: subWallet.encryptedPrivateKey,
      mainWalletAddress: subWallet.mainWalletAddress,
      contractId: subWallet.contractId || null,
      purpose: subWallet.purpose,
      isActive: subWallet.isActive ?? true,
      contractSigned: false,
      signedAt: null,
      contractRole: null,
      createdAt: new Date()
    };
    this.subWallets.set(id, newSubWallet);
    return newSubWallet;
  }

  async updateSubWalletContractStatus(address: string, updates: { contractSigned: boolean; signedAt: Date }): Promise<SubWallet | null> {
    const subWallet = Array.from(this.subWallets.values()).find(sw => sw.address === address);
    if (!subWallet) return null;

    const updatedSubWallet = {
      ...subWallet,
      contractSigned: updates.contractSigned,
      signedAt: updates.signedAt
    };

    this.subWallets.set(subWallet.id, updatedSubWallet);
    return updatedSubWallet;
  }

  async updateSubWallet(id: number, updates: Partial<InsertSubWallet>): Promise<SubWallet | undefined> {
    const subWallet = this.subWallets.get(id);
    if (!subWallet) return undefined;

    const updatedSubWallet = {
      ...subWallet,
      ...updates
    };
    this.subWallets.set(id, updatedSubWallet);
    return updatedSubWallet;
  }

  async deactivateSubWallet(id: number): Promise<boolean> {
    const subWallet = this.subWallets.get(id);
    if (!subWallet) return false;

    const updated = await this.updateSubWallet(id, { isActive: false });
    return !!updated;
  }

  async deleteSubWallet(address: string): Promise<boolean> {
    const subWallet = Array.from(this.subWallets.values()).find(sw => sw.address === address);
    if (!subWallet) return false;

    this.subWallets.delete(subWallet.id);
    return true;
  }

  // Sub-wallet invitation operations
  async getSubWalletInvitation(id: number): Promise<SubWalletInvitation | undefined> {
    return this.subWalletInvitations.get(id);
  }

  async getInvitationsByInvitee(inviteeAddress: string): Promise<SubWalletInvitation[]> {
    return Array.from(this.subWalletInvitations.values()).filter(
      invitation => invitation.inviteeAddress === inviteeAddress
    );
  }

  async getInvitationsByInviter(inviterAddress: string): Promise<SubWalletInvitation[]> {
    return Array.from(this.subWalletInvitations.values()).filter(
      invitation => invitation.inviterAddress === inviterAddress
    );
  }

  async getPendingInvitations(inviteeAddress: string): Promise<SubWalletInvitation[]> {
    return Array.from(this.subWalletInvitations.values()).filter(
      invitation => invitation.inviteeAddress === inviteeAddress && invitation.status === 'pending'
    );
  }

  async createSubWalletInvitation(invitation: InsertSubWalletInvitation): Promise<SubWalletInvitation> {
    const id = this.currentSubWalletInvitationId++;
    const newInvitation: SubWalletInvitation = {
      id,
      inviterAddress: invitation.inviterAddress,
      inviteeAddress: invitation.inviteeAddress,
      contractType: invitation.contractType,
      contractDetails: invitation.contractDetails,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: new Date(),
      respondedAt: invitation.respondedAt ?? null
    };
    this.subWalletInvitations.set(id, newInvitation);
    return newInvitation;
  }

  async updateInvitationStatus(id: number, status: string, respondedAt?: Date): Promise<SubWalletInvitation | undefined> {
    const invitation = this.subWalletInvitations.get(id);
    if (!invitation) return undefined;

    const updatedInvitation = {
      ...invitation,
      status,
      respondedAt: respondedAt || new Date()
    };
    this.subWalletInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  // Statistics
  async getPortfolioStats(walletId: number): Promise<{
    totalValue: number;
    networkBreakdown: Array<{
      networkId: number;
      balance: string;
      usdValue: number;
      percentage: number;
    }>;
    transactionCount: number;
    lastActivity: Date | null;
  }> {
    const balances = await this.getBalances({ walletId });
    const transactions = await this.getTransactions({ walletId });

    const totalValue = balances.reduce((sum, balance) => {
      return sum + (balance.usdValue ? parseFloat(balance.usdValue) : 0);
    }, 0);

    const networkBreakdown = balances.map(balance => {
      const usdValue = balance.usdValue ? parseFloat(balance.usdValue) : 0;
      return {
        networkId: balance.networkId!,
        balance: balance.balance,
        usdValue,
        percentage: totalValue > 0 ? (usdValue / totalValue) * 100 : 0
      };
    });

    const lastActivity = transactions.length > 0 
      ? transactions.reduce((latest, tx) => {
          const txTime = tx.timestamp ? new Date(tx.timestamp) : new Date(0);
          return txTime > latest ? txTime : latest;
        }, new Date(0))
      : null;

    return {
      totalValue,
      networkBreakdown,
      transactionCount: transactions.length,
      lastActivity
    };
  }

  async getEscrowStats(): Promise<{
    totalEscrows: number;
    totalValueLocked: number;
    escrowsByStatus: Record<string, number>;
    escrowsByRole: Record<string, number>;
    averageEscrowValue: number;
    topTokens: Array<{
      symbol: string;
      count: number;
      totalValue: number;
    }>;
  }> {
    const escrows = Array.from(this.escrows.values());
    
    const totalEscrows = escrows.length;
    const totalValueLocked = escrows.reduce((sum, escrow) => {
      return sum + parseFloat(escrow.amount);
    }, 0);

    const escrowsByStatus: Record<string, number> = {};
    const escrowsByRole: Record<string, number> = {};
    const tokenStats: Record<string, { count: number; totalValue: number }> = {};

    escrows.forEach(escrow => {
      // Count by status
      escrowsByStatus[escrow.status] = (escrowsByStatus[escrow.status] || 0) + 1;
      
      // Count by role (simplified)
      if (escrow.exporter) escrowsByRole.exporter = (escrowsByRole.exporter || 0) + 1;
      if (escrow.importer) escrowsByRole.importer = (escrowsByRole.importer || 0) + 1;
      if (escrow.financier) escrowsByRole.financier = (escrowsByRole.financier || 0) + 1;
      
      // Token statistics
      const symbol = escrow.tokenSymbol;
      const value = parseFloat(escrow.amount);
      if (!tokenStats[symbol]) {
        tokenStats[symbol] = { count: 0, totalValue: 0 };
      }
      tokenStats[symbol].count++;
      tokenStats[symbol].totalValue += value;
    });

    const topTokens = Object.entries(tokenStats)
      .map(([symbol, stats]) => ({ symbol, ...stats }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);

    const averageEscrowValue = totalEscrows > 0 ? totalValueLocked / totalEscrows : 0;

    return {
      totalEscrows,
      totalValueLocked,
      escrowsByStatus,
      escrowsByRole,
      averageEscrowValue,
      topTokens
    };
  }

  // Profile operations (MemStorage placeholders)
  async getUserProfile(walletAddress: string): Promise<UserProfile | undefined> {
    return this.profiles.get(walletAddress);
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const profile: UserProfile = {
      id: this.currentProfileId++,
      walletAddress: insertProfile.walletAddress,
      displayName: insertProfile.displayName || null,
      firstName: insertProfile.firstName || null,
      lastName: insertProfile.lastName || null,
      email: insertProfile.email || null,
      phoneNumber: insertProfile.phoneNumber || null,
      companyName: insertProfile.companyName || null,
      jobTitle: insertProfile.jobTitle || null,
      country: insertProfile.country || null,
      city: insertProfile.city || null,
      address: insertProfile.address || null,
      postalCode: insertProfile.postalCode || null,
      dateOfBirth: insertProfile.dateOfBirth || null,
      nationality: insertProfile.nationality || null,
      idType: insertProfile.idType || null,
      idNumber: insertProfile.idNumber || null,
      taxId: insertProfile.taxId || null,
      website: insertProfile.website || null,
      linkedIn: insertProfile.linkedIn || null,
      twitter: insertProfile.twitter || null,
      bio: insertProfile.bio || null,
      avatar: insertProfile.avatar || null,
      kycStatus: insertProfile.kycStatus || "pending",
      kycDocuments: insertProfile.kycDocuments || null,
      isPublic: insertProfile.isPublic || false,
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    this.profiles.set(profile.walletAddress, profile);
    return profile;
  }

  async updateUserProfile(walletAddress: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = this.profiles.get(walletAddress);
    if (profile) {
      Object.assign(profile, { ...updates, lastUpdated: new Date() });
    }
    return profile;
  }

  async deleteUserProfile(walletAddress: string): Promise<boolean> {
    return this.profiles.delete(walletAddress);
  }

  // Contact operations (minimal stubs for MemStorage)
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContacts(ownerWalletAddress: string): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(c => c.ownerWalletAddress === ownerWalletAddress);
  }

  async getContactByAddress(ownerWalletAddress: string, contactWalletAddress: string): Promise<Contact | undefined> {
    return Array.from(this.contacts.values()).find(c => 
      c.ownerWalletAddress === ownerWalletAddress && c.contactWalletAddress === contactWalletAddress
    );
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact: Contact = {
      id: this.currentContactId++,
      ownerWalletAddress: contact.ownerWalletAddress,
      contactWalletAddress: contact.contactWalletAddress,
      contactName: contact.contactName,
      notes: contact.notes || null,
      isFavorite: contact.isFavorite || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contacts.set(newContact.id, newContact);
    return newContact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (contact) {
      Object.assign(contact, { ...updates, lastUpdated: new Date() });
    }
    return contact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Referral operations (minimal stubs for MemStorage)
  async createReferralCode(code: InsertReferralCode): Promise<ReferralCode> {
    const newCode: ReferralCode = {
      id: this.currentReferralId++,
      code: code.code,
      referrerWalletAddress: code.referrerWalletAddress,
      description: code.description || "Invite your partners",
      isActive: code.isActive !== undefined ? code.isActive : true,
      maxUses: code.maxUses || null,
      currentUses: 0,
      createdAt: new Date(),
      expiresAt: code.expiresAt || null
    };
    this.referralCodes.set(newCode.code, newCode);
    return newCode;
  }

  async getReferralCode(code: string): Promise<ReferralCode | undefined> {
    return this.referralCodes.get(code);
  }

  async getReferralCodesByWallet(walletAddress: string): Promise<ReferralCode[]> {
    return Array.from(this.referralCodes.values()).filter(c => c.referrerWalletAddress === walletAddress);
  }

  async updateReferralCodeUses(code: string): Promise<ReferralCode | undefined> {
    const referralCode = this.referralCodes.get(code);
    if (referralCode) {
      referralCode.currentUses++;
    }
    return referralCode;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const newReferral: Referral = {
      id: this.currentReferralId++,
      referralCode: referral.referralCode,
      referrerWalletAddress: referral.referrerWalletAddress,
      referredWalletAddress: referral.referredWalletAddress,
      status: referral.status || "pending",
      pointsEarned: referral.pointsEarned || 50,
      createdAt: new Date(),
      completedAt: null
    };
    this.referrals.set(newReferral.id, newReferral);
    return newReferral;
  }

  async getReferralsByWallet(walletAddress: string): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(r => r.referrerWalletAddress === walletAddress);
  }

  async getAllReferrals(): Promise<Referral[]> {
    return Array.from(this.referrals.values());
  }

  async updateReferralStatus(id: number, status: string): Promise<Referral | undefined> {
    const referral = this.referrals.get(id);
    if (referral) {
      referral.status = status;
      referral.completedAt = status === 'completed' ? new Date() : null;
    }
    return referral;
  }

  async getUserPoints(walletAddress: string): Promise<UserPoints | undefined> {
    return this.userPoints.get(walletAddress);
  }

  async getAllUserPoints(): Promise<UserPoints[]> {
    return Array.from(this.userPoints.values());
  }

  async createUserPoints(points: InsertUserPoints): Promise<UserPoints> {
    const newPoints: UserPoints = {
      id: this.currentReferralId++,
      walletAddress: points.walletAddress,
      totalPoints: points.totalPoints || 0,
      referralPoints: points.referralPoints || 0,
      lastUpdated: new Date()
    };
    this.userPoints.set(newPoints.walletAddress, newPoints);
    return newPoints;
  }

  async updateUserPoints(walletAddress: string, points: number): Promise<UserPoints | undefined> {
    const userPoints = this.userPoints.get(walletAddress);
    if (userPoints) {
      userPoints.totalPoints += points;
      userPoints.referralPoints += points;
      userPoints.lastUpdated = new Date();
    }
    return userPoints;
  }

  async createPointTransaction(transaction: InsertPointTransaction): Promise<PointTransaction> {
    const newTransaction: PointTransaction = {
      id: this.currentPointTransactionId++,
      walletAddress: transaction.walletAddress,
      type: transaction.type,
      points: transaction.points,
      description: transaction.description,
      referenceId: transaction.referenceId || null,
      createdAt: new Date()
    };
    this.pointTransactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async getPointTransactions(walletAddress: string): Promise<PointTransaction[]> {
    return Array.from(this.pointTransactions.values()).filter(t => t.walletAddress === walletAddress);
  }

  // User Role operations
  async getUserRole(walletAddress: string): Promise<UserRole | undefined> {
    return this.userRoles.get(walletAddress);
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return Array.from(this.userRoles.values());
  }

  async createUserRole(role: InsertUserRole): Promise<UserRole> {
    const newRole: UserRole = {
      id: this.currentUserRoleId++,
      walletAddress: role.walletAddress,
      role: role.role,
      kycStatus: role.kycStatus || 'pending',
      kycDocuments: role.kycDocuments || null,
      lastActivity: new Date(),
      referralSource: role.referralSource || null,
      isActive: role.isActive !== undefined ? role.isActive : true,
      createdAt: new Date()
    };
    this.userRoles.set(newRole.walletAddress, newRole);
    return newRole;
  }

  async updateUserRole(walletAddress: string, updates: Partial<InsertUserRole>): Promise<UserRole | undefined> {
    const userRole = this.userRoles.get(walletAddress);
    if (userRole) {
      Object.assign(userRole, { ...updates, lastActivity: new Date() });
    }
    return userRole;
  }

  // Stub implementations for other required methods
  async getEscrowContract(id: number): Promise<EscrowContract | undefined> {
    return this.escrowContracts.get(id);
  }

  async getEscrowContractByAddress(address: string): Promise<EscrowContract | undefined> {
    return Array.from(this.escrowContracts.values()).find(c => c.contractAddress === address);
  }

  async getAllEscrowContracts(): Promise<EscrowContract[]> {
    return Array.from(this.escrowContracts.values());
  }

  async createEscrowContract(contract: InsertEscrowContract): Promise<EscrowContract> {
    const newContract: EscrowContract = {
      id: this.currentEscrowContractId++,
      contractAddress: contract.contractAddress,
      deployer: contract.deployer,
      networkId: contract.networkId ?? null,
      abiVersion: contract.abiVersion,
      deploymentTxHash: contract.deploymentTxHash ?? null,
      isActive: contract.isActive ?? true,
      auditLink: contract.auditLink ?? null,
      createdAt: new Date()
    };
    this.escrowContracts.set(newContract.id, newContract);
    return newContract;
  }

  async updateEscrowContract(id: number, updates: Partial<InsertEscrowContract>): Promise<EscrowContract | undefined> {
    const contract = this.escrowContracts.get(id);
    if (contract) {
      Object.assign(contract, updates);
    }
    return contract;
  }

  async getEscrow(id: number): Promise<Escrow | undefined> {
    return this.escrows.get(id);
  }

  async getEscrowByContractAndId(contractAddress: string, escrowId: string): Promise<Escrow | undefined> {
    return Array.from(this.escrows.values()).find(e => e.contractAddress === contractAddress && e.escrowId === escrowId);
  }

  async getEscrows(filters: any): Promise<Escrow[]> {
    let result = Array.from(this.escrows.values());
    if (filters.status) result = result.filter(e => e.status === filters.status);
    if (filters.exporter) result = result.filter(e => e.exporter === filters.exporter);
    if (filters.importer) result = result.filter(e => e.importer === filters.importer);
    if (filters.financier) result = result.filter(e => e.financier === filters.financier);
    if (filters.limit) result = result.slice(0, filters.limit);
    return result;
  }

  async getAllEscrows(): Promise<Escrow[]> {
    return Array.from(this.escrows.values());
  }

  async createEscrow(escrow: InsertEscrow): Promise<Escrow> {
    const newEscrow: Escrow = {
      id: this.currentEscrowId++,
      contractAddress: escrow.contractAddress,
      escrowId: escrow.escrowId,
      exporter: escrow.exporter,
      importer: escrow.importer,
      financier: escrow.financier || null,
      exporterSubWallet: escrow.exporterSubWallet || null,
      importerSubWallet: escrow.importerSubWallet || null,
      amount: escrow.amount,
      tokenAddress: escrow.tokenAddress,
      tokenSymbol: escrow.tokenSymbol,
      status: escrow.status,
      expiryDate: escrow.expiryDate || null,
      networkId: escrow.networkId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.escrows.set(newEscrow.id, newEscrow);
    return newEscrow;
  }

  async updateEscrow(id: number, updates: Partial<InsertEscrow>): Promise<Escrow | undefined> {
    const escrow = this.escrows.get(id);
    if (escrow) {
      Object.assign(escrow, { ...updates, updatedAt: new Date() });
    }
    return escrow;
  }

  async getEventLogs(filters: any): Promise<EventLog[]> {
    let result = Array.from(this.eventLogs.values());
    if (filters.contractAddress) result = result.filter(e => e.contractAddress === filters.contractAddress);
    if (filters.eventName) result = result.filter(e => e.eventName === filters.eventName);
    if (filters.networkId) result = result.filter(e => e.networkId === filters.networkId);
    if (filters.limit) result = result.slice(0, filters.limit);
    return result;
  }

  async createEventLog(log: InsertEventLog): Promise<EventLog> {
    const newLog: EventLog = {
      id: this.currentEventLogId++,
      transactionHash: log.transactionHash,
      contractAddress: log.contractAddress,
      eventName: log.eventName,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      eventData: log.eventData,
      networkId: log.networkId ?? null,
      timestamp: new Date()
    };
    this.eventLogs.set(newLog.id, newLog);
    return newLog;
  }

  async getTokenRegistry(id: number): Promise<TokenRegistry | undefined> {
    return this.tokenRegistry.get(id);
  }

  async getTokenByAddress(address: string, networkId: number): Promise<TokenRegistry | undefined> {
    return Array.from(this.tokenRegistry.values()).find(t => t.address === address && t.networkId === networkId);
  }

  async getAllTokens(): Promise<TokenRegistry[]> {
    return Array.from(this.tokenRegistry.values());
  }

  async getActiveTokens(networkId?: number): Promise<TokenRegistry[]> {
    let result = Array.from(this.tokenRegistry.values()).filter(t => t.isActive);
    if (networkId) result = result.filter(t => t.networkId === networkId);
    return result;
  }

  async createToken(token: InsertTokenRegistry): Promise<TokenRegistry> {
    const newToken: TokenRegistry = {
      id: this.currentTokenId++,
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      networkId: token.networkId ?? null,
      isActive: token.isActive !== undefined ? token.isActive : true,
      totalValueLocked: token.totalValueLocked || "0",
      priceUsd: token.priceUsd || null,
      createdAt: new Date()
    };
    this.tokenRegistry.set(newToken.id, newToken);
    return newToken;
  }

  async updateToken(id: number, updates: Partial<InsertTokenRegistry>): Promise<TokenRegistry | undefined> {
    const token = this.tokenRegistry.get(id);
    if (token) {
      Object.assign(token, updates);
    }
    return token;
  }

  // Contract signature operations
  async createContractSignature(signature: InsertContractSignature): Promise<ContractSignature> {
    const newSignature: ContractSignature = {
      id: this.currentContractSignatureId++,
      contractId: signature.contractId,
      signerAddress: signature.signerAddress,
      signature: signature.signature,
      signedAt: new Date(),
      role: signature.role
    };
    this.contractSignatures.set(newSignature.id, newSignature);
    return newSignature;
  }

  async getContractSignatures(contractId: number): Promise<ContractSignature[]> {
    return Array.from(this.contractSignatures.values()).filter(s => s.contractId === contractId);
  }

  async getAllContractSignatures(): Promise<ContractSignature[]> {
    return Array.from(this.contractSignatures.values());
  }

  async getSubWalletByAddress(address: string): Promise<SubWallet | undefined> {
    return Array.from(this.subWallets.values()).find(
      subWallet => subWallet.address === address
    );
  }

  // ═══════════════════════════════════════════════════════
  // [MARKETPLACE] B2B Marketplace (stubs)
  // ═══════════════════════════════════════════════════════
  
  async createMarketplaceBusiness(business: InsertMarketplaceBusiness): Promise<MarketplaceBusiness> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceBusiness(walletAddress: string): Promise<MarketplaceBusiness | undefined> {
    return undefined;
  }
  async getMarketplaceBusinessById(id: number): Promise<MarketplaceBusiness | undefined> {
    return undefined;
  }
  async searchMarketplaceBusinesses(filters: any): Promise<MarketplaceBusiness[]> {
    return [];
  }
  async updateMarketplaceBusiness(walletAddress: string, updates: Partial<InsertMarketplaceBusiness>): Promise<MarketplaceBusiness | undefined> {
    return undefined;
  }
  async incrementBusinessProfileViews(walletAddress: string): Promise<void> {}
  
  async createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined> {
    return undefined;
  }
  async getMarketplaceProductsByBusiness(businessId: number): Promise<MarketplaceProduct[]> {
    return [];
  }
  async searchMarketplaceProducts(filters: any): Promise<MarketplaceProduct[]> {
    return [];
  }
  async updateMarketplaceProduct(id: number, updates: Partial<InsertMarketplaceProduct>): Promise<MarketplaceProduct | undefined> {
    return undefined;
  }
  async deleteMarketplaceProduct(id: number): Promise<boolean> {
    return false;
  }
  
  async createMarketplaceRfq(rfq: InsertMarketplaceRfq): Promise<MarketplaceRfq> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceRfq(id: number): Promise<MarketplaceRfq | undefined> {
    return undefined;
  }
  async getMarketplaceRfqByNumber(rfqNumber: string): Promise<MarketplaceRfq | undefined> {
    return undefined;
  }
  async getMarketplaceRfqsByBuyer(buyerWallet: string): Promise<MarketplaceRfq[]> {
    return [];
  }
  async searchMarketplaceRfqs(filters: any): Promise<MarketplaceRfq[]> {
    return [];
  }
  async updateMarketplaceRfq(id: number, updates: Partial<InsertMarketplaceRfq>): Promise<MarketplaceRfq | undefined> {
    return undefined;
  }
  
  async createMarketplaceQuote(quote: InsertMarketplaceQuote): Promise<MarketplaceQuote> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceQuote(id: number): Promise<MarketplaceQuote | undefined> {
    return undefined;
  }
  async getMarketplaceQuotesByRfq(rfqId: number): Promise<MarketplaceQuote[]> {
    return [];
  }
  async getMarketplaceQuotesBySupplier(supplierWallet: string): Promise<MarketplaceQuote[]> {
    return [];
  }
  async updateMarketplaceQuote(id: number, updates: Partial<InsertMarketplaceQuote>): Promise<MarketplaceQuote | undefined> {
    return undefined;
  }
  
  async createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceReviewsByBusiness(businessWallet: string): Promise<MarketplaceReview[]> {
    return [];
  }
  async getMarketplaceReviewsByReviewer(reviewerWallet: string): Promise<MarketplaceReview[]> {
    return [];
  }
  async getAverageBusinessRating(businessWallet: string): Promise<{ rating: number; count: number }> {
    return { rating: 0, count: 0 };
  }
  async updateMarketplaceReview(id: number, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview | undefined> {
    return undefined;
  }
  
  async createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getMarketplaceConnections(walletAddress: string): Promise<MarketplaceConnection[]> {
    return [];
  }
  async getMarketplaceConnection(requesterWallet: string, targetWallet: string): Promise<MarketplaceConnection | undefined> {
    return undefined;
  }
  async updateMarketplaceConnection(id: number, updates: Partial<InsertMarketplaceConnection>): Promise<MarketplaceConnection | undefined> {
    return undefined;
  }
  
  async createTradeCorridor(corridor: InsertTradeCorridor): Promise<TradeCorridor> {
    throw new Error("MemStorage: Marketplace not implemented - use DatabaseStorage");
  }
  async getTradeCorridor(id: number): Promise<TradeCorridor | undefined> {
    return undefined;
  }
  async getAllTradeCorridors(): Promise<TradeCorridor[]> {
    return [];
  }
  async getTradeCorridorsByRegion(sourceRegion: string, destinationRegion: string): Promise<TradeCorridor[]> {
    return [];
  }
  async updateTradeCorridor(id: number, updates: Partial<InsertTradeCorridor>): Promise<TradeCorridor | undefined> {
    return undefined;
  }
}

export class DatabaseStorage implements IStorage {
  // ═══════════════════════════════════════════════════════
  // [WALLET] Wallet Management
  // ═══════════════════════════════════════════════════════

  async getWallet(id: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || undefined;
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet || undefined;
  }

  async getAllWallets(): Promise<Wallet[]> {
    return await db.select().from(wallets);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values(insertWallet)
      .returning();
    return wallet;
  }

  async updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const [wallet] = await db
      .update(wallets)
      .set(updates)
      .where(eq(wallets.id, id))
      .returning();
    return wallet || undefined;
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = await db.delete(wallets).where(eq(wallets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ═══════════════════════════════════════════════════════
  // [NETWORK] Network Management
  // ═══════════════════════════════════════════════════════

  async getNetwork(id: number): Promise<Network | undefined> {
    const [network] = await db.select().from(networks).where(eq(networks.id, id));
    return network || undefined;
  }

  async getNetworkByChainId(chainId: number): Promise<Network | undefined> {
    const [network] = await db.select().from(networks).where(eq(networks.chainId, chainId));
    return network || undefined;
  }

  async getAllNetworks(): Promise<Network[]> {
    return await db.select().from(networks);
  }

  async createNetwork(insertNetwork: InsertNetwork): Promise<Network> {
    const [network] = await db
      .insert(networks)
      .values(insertNetwork)
      .returning();
    return network;
  }

  async updateNetwork(id: number, updates: Partial<InsertNetwork>): Promise<Network | undefined> {
    const [network] = await db
      .update(networks)
      .set(updates)
      .where(eq(networks.id, id))
      .returning();
    return network || undefined;
  }

  // ═══════════════════════════════════════════════════════
  // [TRANSACTION] Transaction Management
  // ═══════════════════════════════════════════════════════

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionByHash(hash: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.hash, hash));
    return transaction || undefined;
  }

  async getTransactions(filters: {
    walletId?: number;
    networkId?: number;
    status?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    let query = db.select().from(transactions);
    
    if (filters.walletId) {
      query = query.where(eq(transactions.walletId, filters.walletId)) as any;
    }
    if (filters.networkId) {
      query = query.where(eq(transactions.networkId, filters.networkId)) as any;
    }
    if (filters.status) {
      query = query.where(eq(transactions.status, filters.status)) as any;
    }
    
    query = query.orderBy(desc(transactions.timestamp)) as any;
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async updateTransaction(hash: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.hash, hash))
      .returning();
    return transaction || undefined;
  }

  // ═══════════════════════════════════════════════════════
  // [BALANCE] Balance Management
  // ═══════════════════════════════════════════════════════

  async getBalance(id: number): Promise<Balance | undefined> {
    const [balance] = await db.select().from(balances).where(eq(balances.id, id));
    return balance || undefined;
  }

  async getBalances(filters: {
    walletId?: number;
    networkId?: number;
  }): Promise<Balance[]> {
    let query = db.select().from(balances);
    
    if (filters.walletId) {
      query = query.where(eq(balances.walletId, filters.walletId)) as any;
    }
    if (filters.networkId) {
      query = query.where(eq(balances.networkId, filters.networkId)) as any;
    }
    
    return await query;
  }

  async createBalance(insertBalance: InsertBalance): Promise<Balance> {
    const [balance] = await db
      .insert(balances)
      .values(insertBalance)
      .returning();
    return balance;
  }

  async updateBalance(id: number, updates: Partial<InsertBalance>): Promise<Balance | undefined> {
    const [balance] = await db
      .update(balances)
      .set(updates)
      .where(eq(balances.id, id))
      .returning();
    return balance || undefined;
  }

  // ═══════════════════════════════════════════════════════
  // [PORTFOLIO] Portfolio Stats
  // ═══════════════════════════════════════════════════════

  async getPortfolioStats(walletId: number): Promise<{
    totalValue: number;
    networkBreakdown: Array<{
      networkId: number;
      balance: string;
      usdValue: number;
      percentage: number;
    }>;
    transactionCount: number;
    lastActivity: Date | null;
  }> {
    const walletBalances = await this.getBalances({ walletId });
    const walletTransactions = await this.getTransactions({ walletId });

    const totalValue = walletBalances.reduce((sum, balance) => {
      return sum + (balance.usdValue ? parseFloat(balance.usdValue) : 0);
    }, 0);

    const networkBreakdown = walletBalances.map(balance => {
      const usdValue = balance.usdValue ? parseFloat(balance.usdValue) : 0;
      return {
        networkId: balance.networkId!,
        balance: balance.balance,
        usdValue,
        percentage: totalValue > 0 ? (usdValue / totalValue) * 100 : 0
      };
    });

    const lastActivity = walletTransactions.length > 0 
      ? walletTransactions.reduce((latest, tx) => {
          const txTime = tx.timestamp ? new Date(tx.timestamp) : new Date(0);
          return txTime > latest ? txTime : latest;
        }, new Date(0))
      : null;

    return {
      totalValue,
      networkBreakdown,
      transactionCount: walletTransactions.length,
      lastActivity
    };
  }

  // ═══════════════════════════════════════════════════════
  // [PROFILES] User Profiles
  // ═══════════════════════════════════════════════════════

  async getUserProfile(walletAddress: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.walletAddress, walletAddress));
    return profile || undefined;
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const [profile] = await db
      .insert(userProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateUserProfile(walletAddress: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [profile] = await db
      .update(userProfiles)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(userProfiles.walletAddress, walletAddress))
      .returning();
    return profile || undefined;
  }

  async deleteUserProfile(walletAddress: string): Promise<boolean> {
    const result = await db
      .delete(userProfiles)
      .where(eq(userProfiles.walletAddress, walletAddress));
    return (result.rowCount || 0) > 0;
  }

  // ═══════════════════════════════════════════════════════
  // [CONTACTS] Contacts
  // ═══════════════════════════════════════════════════════

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getContacts(ownerWalletAddress: string): Promise<Contact[]> {
    return await db.select().from(contacts)
      .where(eq(contacts.ownerWalletAddress, ownerWalletAddress))
      .orderBy(contacts.contactName);
  }

  async getContactByAddress(ownerWalletAddress: string, contactWalletAddress: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts)
      .where(and(
        eq(contacts.ownerWalletAddress, ownerWalletAddress),
        eq(contacts.contactWalletAddress, contactWalletAddress)
      ));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // ═══════════════════════════════════════════════════════
  // [REFERRALS] Referral System
  // ═══════════════════════════════════════════════════════

  async createReferralCode(insertCode: InsertReferralCode): Promise<ReferralCode> {
    const [code] = await db
      .insert(referralCodes)
      .values(insertCode)
      .returning();
    return code;
  }

  async getReferralCode(code: string): Promise<ReferralCode | undefined> {
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code));
    return referralCode;
  }

  async getReferralCodesByWallet(walletAddress: string): Promise<ReferralCode[]> {
    return await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.referrerWalletAddress, walletAddress))
      .orderBy(desc(referralCodes.createdAt));
  }

  async updateReferralCodeUses(code: string): Promise<ReferralCode | undefined> {
    const [updated] = await db
      .update(referralCodes)
      .set({ currentUses: sql`${referralCodes.currentUses} + 1` })
      .where(eq(referralCodes.code, code))
      .returning();
    return updated;
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(insertReferral)
      .returning();
    return referral;
  }

  async getReferralsByWallet(walletAddress: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerWalletAddress, walletAddress))
      .orderBy(desc(referrals.createdAt));
  }

  async getAllReferrals(): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferralStatus(id: number, status: string): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({ 
        status,
        completedAt: status === 'completed' ? new Date() : null
      })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async getUserPoints(walletAddress: string): Promise<UserPoints | undefined> {
    const [points] = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.walletAddress, walletAddress));
    return points;
  }

  async getAllUserPoints(): Promise<UserPoints[]> {
    return await db.select().from(userPoints);
  }

  async createUserPoints(insertPoints: InsertUserPoints): Promise<UserPoints> {
    const [points] = await db
      .insert(userPoints)
      .values(insertPoints)
      .returning();
    return points;
  }

  async updateUserPoints(walletAddress: string, points: number): Promise<UserPoints | undefined> {
    const [updated] = await db
      .update(userPoints)
      .set({ 
        totalPoints: sql`${userPoints.totalPoints} + ${points}`,
        referralPoints: sql`${userPoints.referralPoints} + ${points}`,
        lastUpdated: new Date()
      })
      .where(eq(userPoints.walletAddress, walletAddress))
      .returning();
    return updated;
  }

  async createPointTransaction(insertTransaction: InsertPointTransaction): Promise<PointTransaction> {
    const [transaction] = await db
      .insert(pointTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getPointTransactions(walletAddress: string): Promise<PointTransaction[]> {
    return await db
      .select()
      .from(pointTransactions)
      .where(eq(pointTransactions.walletAddress, walletAddress))
      .orderBy(desc(pointTransactions.createdAt));
  }

  async getPointTransactionsByWallet(walletAddress: string): Promise<PointTransaction[]> {
    return this.getPointTransactions(walletAddress);
  }

  // User Role operations
  async getUserRole(walletAddress: string): Promise<UserRole | undefined> {
    const [role] = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.walletAddress, walletAddress));
    return role;
  }

  async getAllUserRoles(): Promise<UserRole[]> {
    return await db.select().from(userRoles);
  }

  async createUserRole(insertRole: InsertUserRole): Promise<UserRole> {
    const [role] = await db
      .insert(userRoles)
      .values(insertRole)
      .returning();
    return role;
  }

  async updateUserRole(walletAddress: string, updates: Partial<InsertUserRole>): Promise<UserRole | undefined> {
    const [updated] = await db
      .update(userRoles)
      .set({ ...updates, lastActivity: new Date() })
      .where(eq(userRoles.walletAddress, walletAddress))
      .returning();
    return updated;
  }

  // Escrow Contract operations
  async getEscrowContract(id: number): Promise<EscrowContract | undefined> {
    const [contract] = await db
      .select()
      .from(escrowContracts)
      .where(eq(escrowContracts.id, id));
    return contract;
  }

  async getEscrowContractByAddress(address: string): Promise<EscrowContract | undefined> {
    const [contract] = await db
      .select()
      .from(escrowContracts)
      .where(eq(escrowContracts.contractAddress, address));
    return contract;
  }

  async getAllEscrowContracts(): Promise<EscrowContract[]> {
    return await db.select().from(escrowContracts);
  }

  async createEscrowContract(insertContract: InsertEscrowContract): Promise<EscrowContract> {
    const [contract] = await db
      .insert(escrowContracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateEscrowContract(id: number, updates: Partial<InsertEscrowContract>): Promise<EscrowContract | undefined> {
    const [updated] = await db
      .update(escrowContracts)
      .set(updates)
      .where(eq(escrowContracts.id, id))
      .returning();
    return updated;
  }

  // Escrow operations
  async getEscrow(id: number): Promise<Escrow | undefined> {
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(eq(escrows.id, id));
    return escrow;
  }

  async getEscrowByContractAndId(contractAddress: string, escrowId: string): Promise<Escrow | undefined> {
    const [escrow] = await db
      .select()
      .from(escrows)
      .where(
        and(
          eq(escrows.contractAddress, contractAddress),
          eq(escrows.escrowId, escrowId)
        )
      );
    return escrow;
  }

  async getEscrows(filters: {
    status?: string;
    exporter?: string;
    importer?: string;
    financier?: string;
    networkId?: number;
    limit?: number;
  }): Promise<Escrow[]> {
    let query = db.select().from(escrows);

    const conditions = [];
    if (filters.status) conditions.push(eq(escrows.status, filters.status));
    if (filters.exporter) conditions.push(eq(escrows.exporter, filters.exporter));
    if (filters.importer) conditions.push(eq(escrows.importer, filters.importer));
    if (filters.financier) conditions.push(eq(escrows.financier, filters.financier));
    if (filters.networkId) conditions.push(eq(escrows.networkId, filters.networkId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(escrows.createdAt)) as any;

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getAllEscrows(): Promise<Escrow[]> {
    return await db.select().from(escrows).orderBy(desc(escrows.createdAt));
  }

  async createEscrow(insertEscrow: InsertEscrow): Promise<Escrow> {
    const [escrow] = await db
      .insert(escrows)
      .values(insertEscrow)
      .returning();
    return escrow;
  }

  async updateEscrow(id: number, updates: Partial<InsertEscrow>): Promise<Escrow | undefined> {
    const [updated] = await db
      .update(escrows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(escrows.id, id))
      .returning();
    return updated;
  }

  // Event Log operations
  async getEventLogs(filters: {
    contractAddress?: string;
    eventName?: string;
    networkId?: number;
    limit?: number;
  }): Promise<EventLog[]> {
    let query = db.select().from(eventLogs);

    const conditions = [];
    if (filters.contractAddress) conditions.push(eq(eventLogs.contractAddress, filters.contractAddress));
    if (filters.eventName) conditions.push(eq(eventLogs.eventName, filters.eventName));
    if (filters.networkId) conditions.push(eq(eventLogs.networkId, filters.networkId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(eventLogs.timestamp)) as any;

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async createEventLog(insertLog: InsertEventLog): Promise<EventLog> {
    const [log] = await db
      .insert(eventLogs)
      .values(insertLog)
      .returning();
    return log;
  }



  async createContractSignature(insertSignature: InsertContractSignature): Promise<ContractSignature> {
    const [signature] = await db
      .insert(contractSignatures)
      .values(insertSignature)
      .returning();
    return signature;
  }

  async getContractSignatures(contractId: number): Promise<ContractSignature[]> {
    return await db
      .select()
      .from(contractSignatures)
      .where(eq(contractSignatures.contractId, contractId))
      .orderBy(desc(contractSignatures.signedAt));
  }

  async getAllContractSignatures(): Promise<ContractSignature[]> {
    return await db
      .select()
      .from(contractSignatures)
      .orderBy(desc(contractSignatures.signedAt));
  }

  // Contract deliverable operations
  async createContractDeliverable(insertDeliverable: InsertContractDeliverable): Promise<ContractDeliverable> {
    const [deliverable] = await db
      .insert(contractDeliverables)
      .values(insertDeliverable)
      .returning();
    return deliverable;
  }

  async getContractDeliverable(id: number): Promise<ContractDeliverable | undefined> {
    const [deliverable] = await db
      .select()
      .from(contractDeliverables)
      .where(eq(contractDeliverables.id, id));
    return deliverable;
  }

  async getContractDeliverables(contractId: number): Promise<ContractDeliverable[]> {
    return await db
      .select()
      .from(contractDeliverables)
      .where(eq(contractDeliverables.contractId, contractId))
      .orderBy(contractDeliverables.dueDate);
  }

  async updateContractDeliverable(id: number, updates: Partial<InsertContractDeliverable>): Promise<ContractDeliverable | undefined> {
    const [updated] = await db
      .update(contractDeliverables)
      .set(updates)
      .where(eq(contractDeliverables.id, id))
      .returning();
    return updated;
  }

  async claimDeliverable(id: number, claimedBy: string): Promise<ContractDeliverable | undefined> {
    const [updated] = await db
      .update(contractDeliverables)
      .set({ 
        status: 'claimed',
        claimedBy,
        claimedAt: new Date()
      })
      .where(eq(contractDeliverables.id, id))
      .returning();
    return updated;
  }

  // Contract verification operations
  async createContractVerification(insertVerification: InsertContractVerification): Promise<ContractVerification> {
    const [verification] = await db
      .insert(contractVerifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async getContractVerification(deliverableId: number, verifierAddress: string): Promise<ContractVerification | undefined> {
    const [verification] = await db
      .select()
      .from(contractVerifications)
      .where(
        and(
          eq(contractVerifications.deliverableId, deliverableId),
          eq(contractVerifications.verifierAddress, verifierAddress)
        )
      );
    return verification;
  }

  async getContractVerifications(deliverableId: number): Promise<ContractVerification[]> {
    return await db
      .select()
      .from(contractVerifications)
      .where(eq(contractVerifications.deliverableId, deliverableId))
      .orderBy(desc(contractVerifications.createdAt));
  }

  // Contract document operations
  async createContractDocument(insertDocument: InsertContractDocument): Promise<ContractDocument> {
    const [document] = await db
      .insert(contractDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async getContractDocument(id: number): Promise<ContractDocument | undefined> {
    const [document] = await db
      .select()
      .from(contractDocuments)
      .where(eq(contractDocuments.id, id));
    return document;
  }

  async getContractDocuments(contractId: number): Promise<ContractDocument[]> {
    return await db
      .select()
      .from(contractDocuments)
      .where(eq(contractDocuments.contractId, contractId))
      .orderBy(desc(contractDocuments.uploadedAt));
  }

  async deleteContractDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(contractDocuments)
      .where(eq(contractDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotifications(recipientAddress: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientAddress, recipientAddress))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(recipientAddress: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientAddress, recipientAddress),
          eq(notifications.read, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(recipientAddress: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.recipientAddress, recipientAddress),
          eq(notifications.read, false)
        )
      );
  }

  // Token Registry operations
  async getTokenRegistry(id: number): Promise<TokenRegistry | undefined> {
    const [token] = await db
      .select()
      .from(tokenRegistry)
      .where(eq(tokenRegistry.id, id));
    return token;
  }

  async getTokenByAddress(address: string, networkId: number): Promise<TokenRegistry | undefined> {
    const [token] = await db
      .select()
      .from(tokenRegistry)
      .where(
        and(
          eq(tokenRegistry.address, address),
          eq(tokenRegistry.networkId, networkId)
        )
      );
    return token;
  }

  async getAllTokens(): Promise<TokenRegistry[]> {
    return await db.select().from(tokenRegistry);
  }

  async getActiveTokens(networkId?: number): Promise<TokenRegistry[]> {
    let query = db.select().from(tokenRegistry).where(eq(tokenRegistry.isActive, true));
    
    if (networkId) {
      query = query.where(eq(tokenRegistry.networkId, networkId)) as any;
    }

    return await query;
  }

  async createToken(insertToken: InsertTokenRegistry): Promise<TokenRegistry> {
    const [token] = await db
      .insert(tokenRegistry)
      .values(insertToken)
      .returning();
    return token;
  }

  async updateToken(id: number, updates: Partial<InsertTokenRegistry>): Promise<TokenRegistry | undefined> {
    const [updated] = await db
      .update(tokenRegistry)
      .set(updates)
      .where(eq(tokenRegistry.id, id))
      .returning();
    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // [SUB-WALLET] Sub-Wallet Management
  // ═══════════════════════════════════════════════════════

  async getSubWallet(id: number): Promise<SubWallet | undefined> {
    const [subWallet] = await db
      .select()
      .from(subWallets)
      .where(eq(subWallets.id, id));
    return subWallet;
  }

  async getSubWalletByAddress(address: string): Promise<SubWallet | undefined> {
    const [subWallet] = await db
      .select()
      .from(subWallets)
      .where(eq(subWallets.address, address));
    return subWallet;
  }



  async getSubWalletsByMainWallet(mainWalletAddress: string): Promise<SubWallet[]> {
    return await db
      .select()
      .from(subWallets)
      .where(eq(subWallets.mainWalletAddress, mainWalletAddress));
  }

  async getSubWalletsByContract(contractId: string): Promise<SubWallet[]> {
    return await db
      .select()
      .from(subWallets)
      .where(eq(subWallets.contractId, contractId));
  }

  async createSubWallet(subWallet: InsertSubWallet): Promise<SubWallet> {
    // Check if sub-wallet already exists
    const existing = await this.getSubWalletByAddress(subWallet.address);
    if (existing) {
      return existing;
    }
    
    const [created] = await db
      .insert(subWallets)
      .values(subWallet)
      .returning();
    return created;
  }

  async updateSubWallet(id: number, updates: Partial<InsertSubWallet>): Promise<SubWallet | undefined> {
    const [updated] = await db
      .update(subWallets)
      .set(updates)
      .where(eq(subWallets.id, id))
      .returning();
    return updated;
  }

  async updateSubWalletContractStatus(address: string, updates: { contractSigned: boolean; signedAt: Date }): Promise<SubWallet | undefined> {
    const [updated] = await db
      .update(subWallets)
      .set(updates)
      .where(eq(subWallets.address, address))
      .returning();
    return updated;
  }

  async deactivateSubWallet(id: number): Promise<boolean> {
    const result = await db
      .update(subWallets)
      .set({ isActive: false })
      .where(eq(subWallets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteSubWallet(address: string): Promise<boolean> {
    const result = await db
      .delete(subWallets)
      .where(eq(subWallets.address, address));
    return (result.rowCount ?? 0) > 0;
  }

  // ═══════════════════════════════════════════════════════
  // [SUB-WALLET-INVITATIONS] Sub-Wallet Invitations
  // ═══════════════════════════════════════════════════════

  async getSubWalletInvitation(id: number): Promise<SubWalletInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(subWalletInvitations)
      .where(eq(subWalletInvitations.id, id));
    return invitation;
  }

  async getInvitationsByWallet(walletAddress: string): Promise<SubWalletInvitation[]> {
    return await db
      .select()
      .from(subWalletInvitations)
      .where(eq(subWalletInvitations.inviteeAddress, walletAddress));
  }

  async getInvitationsByInvitee(inviteeAddress: string): Promise<SubWalletInvitation[]> {
    return await db
      .select()
      .from(subWalletInvitations)
      .where(eq(subWalletInvitations.inviteeAddress, inviteeAddress));
  }

  async getInvitationsByInviter(inviterAddress: string): Promise<SubWalletInvitation[]> {
    return await db
      .select()
      .from(subWalletInvitations)
      .where(eq(subWalletInvitations.inviterAddress, inviterAddress));
  }

  async getPendingInvitations(inviteeAddress: string): Promise<SubWalletInvitation[]> {
    return await db
      .select()
      .from(subWalletInvitations)
      .where(
        and(
          eq(subWalletInvitations.inviteeAddress, inviteeAddress),
          eq(subWalletInvitations.status, 'pending')
        )
      );
  }

  async createInvitation(invitation: any): Promise<SubWalletInvitation> {
    // Convert string dates to Date objects for Drizzle ORM
    const invitationData = {
      inviterAddress: invitation.inviterAddress,
      inviteeAddress: invitation.inviteeAddress,
      contractType: invitation.contractType,
      contractDetails: invitation.contractDetails,
      status: invitation.status || 'pending',
      expiresAt: new Date(invitation.expiresAt),
      respondedAt: invitation.respondedAt ? new Date(invitation.respondedAt) : undefined
    };
    
    const [created] = await db
      .insert(subWalletInvitations)
      .values(invitationData)
      .returning();
    return created;
  }

  async createSubWalletInvitation(invitation: InsertSubWalletInvitation): Promise<SubWalletInvitation> {
    const [created] = await db
      .insert(subWalletInvitations)
      .values(invitation)
      .returning();
    return created;
  }

  async acceptInvitation(invitationId: number, subWalletData: any): Promise<{ invitation: SubWalletInvitation; subWallet: SubWallet }> {
    // Update invitation status
    const [invitation] = await db
      .update(subWalletInvitations)
      .set({ status: 'accepted', respondedAt: new Date() })
      .where(eq(subWalletInvitations.id, invitationId))
      .returning();

    // Check if sub-wallet already exists
    let subWallet = await this.getSubWalletByAddress(subWalletData.address);
    
    if (!subWallet) {
      // Create sub-wallet only if it doesn't exist
      const [created] = await db
        .insert(subWallets)
        .values(subWalletData)
        .returning();
      subWallet = created;
    }

    return { invitation, subWallet };
  }

  async updateInvitationStatus(id: number, status: string, respondedAt?: Date): Promise<SubWalletInvitation | undefined> {
    const [updated] = await db
      .update(subWalletInvitations)
      .set({ status, respondedAt })
      .where(eq(subWalletInvitations.id, id))
      .returning();
    return updated;
  }

  async getInvitation(id: number): Promise<SubWalletInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(subWalletInvitations)
      .where(eq(subWalletInvitations.id, id))
      .limit(1);
    return invitation;
  }

  async getContractDraftById(id: number): Promise<ContractDraft | undefined> {
    const [contract] = await db
      .select()
      .from(contractDrafts)
      .where(eq(contractDrafts.id, id))
      .limit(1);
    return contract;
  }

  async addContractCosigner(contractId: number, signature: InsertContractSignature): Promise<ContractSignature> {
    const [newSignature] = await db
      .insert(contractSignatures)
      .values({
        ...signature,
        contractId
      })
      .returning();
    return newSignature;
  }

  // Contract Management Methods
  async getContractDrafts(): Promise<ContractDraft[]> {
    return await db.select().from(contractDrafts);
  }

  async getContractDraft(id: number): Promise<ContractDraft | undefined> {
    const [contract] = await db
      .select()
      .from(contractDrafts)
      .where(eq(contractDrafts.id, id));
    return contract;
  }

  async createContractDraft(insertContract: InsertContractDraft): Promise<ContractDraft> {
    const [contract] = await db
      .insert(contractDrafts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateContractDraft(id: number, updates: Partial<InsertContractDraft>): Promise<ContractDraft | undefined> {
    const [updated] = await db
      .update(contractDrafts)
      .set(updates)
      .where(eq(contractDrafts.id, id))
      .returning();
    return updated;
  }



  async createContractDeliverable(insertDeliverable: InsertContractDeliverable): Promise<ContractDeliverable> {
    const [deliverable] = await db
      .insert(contractDeliverables)
      .values(insertDeliverable)
      .returning();
    return deliverable;
  }

  async getContractDeliverables(contractId: number): Promise<ContractDeliverable[]> {
    return await db
      .select()
      .from(contractDeliverables)
      .where(eq(contractDeliverables.contractId, contractId));
  }

  async claimDeliverable(deliverableId: number, claimedBy: string, evidence?: string): Promise<ContractDeliverable | undefined> {
    const [updated] = await db
      .update(contractDeliverables)
      .set({
        status: 'claimed',
        claimedBy,
        claimedAt: new Date(),
        evidence
      })
      .where(eq(contractDeliverables.id, deliverableId))
      .returning();
    return updated;
  }

  async verifyDeliverable(deliverableId: number, verifiedBy: string): Promise<ContractDeliverable | undefined> {
    const [updated] = await db
      .update(contractDeliverables)
      .set({
        status: 'verified',
        verifiedBy,
        verifiedAt: new Date()
      })
      .where(eq(contractDeliverables.id, deliverableId))
      .returning();
    return updated;
  }

  async createContractVerification(insertVerification: InsertContractVerification): Promise<ContractVerification> {
    const [verification] = await db
      .insert(contractVerifications)
      .values(insertVerification)
      .returning();
    return verification;
  }

  async getContractVerifications(deliverableId: number): Promise<ContractVerification[]> {
    return await db
      .select()
      .from(contractVerifications)
      .where(eq(contractVerifications.deliverableId, deliverableId));
  }

  // Contract document operations
  async createContractDocument(insertDocument: InsertContractDocument): Promise<ContractDocument> {
    const [document] = await db
      .insert(contractDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async getContractDocuments(contractId: number): Promise<ContractDocument[]> {
    return await db
      .select()
      .from(contractDocuments)
      .where(eq(contractDocuments.contractId, contractId));
  }

  async deleteContractDocument(documentId: number, uploaderAddress: string): Promise<boolean> {
    const result = await db
      .delete(contractDocuments)
      .where(
        and(
          eq(contractDocuments.id, documentId),
          eq(contractDocuments.uploadedBy, uploaderAddress)
        )
      );
    return (result.rowCount || 0) > 0;
  }

  // ═══════════════════════════════════════════════════════
  // [INVOICES] Invoice Management
  // ═══════════════════════════════════════════════════════

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return created;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1);
    return invoice;
  }

  async getInvoicesBySender(senderAddress: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.senderAddress, senderAddress))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByRecipient(recipientAddress: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.recipientAddress, recipientAddress))
      .orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(eq(invoices.id, id));
    return (result.rowCount || 0) > 0;
  }

  async markInvoiceAsPaid(id: number, paymentData: { txHash: string; amount: string; paidBy: string }): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paymentTxHash: paymentData.txHash,
        paidAmount: paymentData.amount,
        paidAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  // Invoice items operations
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [created] = await db
      .insert(invoiceItems)
      .values(item)
      .returning();
    return created;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(invoiceItems.sortOrder);
  }

  async updateInvoiceItem(id: number, updates: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const [updated] = await db
      .update(invoiceItems)
      .set(updates)
      .where(eq(invoiceItems.id, id))
      .returning();
    return updated;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Invoice templates operations
  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const [created] = await db
      .insert(invoiceTemplates)
      .values(template)
      .returning();
    return created;
  }

  async getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id))
      .limit(1);
    return template;
  }

  async getInvoiceTemplatesByCreator(creatorAddress: string): Promise<InvoiceTemplate[]> {
    return await db
      .select()
      .from(invoiceTemplates)
      .where(and(
        eq(invoiceTemplates.creatorAddress, creatorAddress),
        eq(invoiceTemplates.isActive, true)
      ))
      .orderBy(desc(invoiceTemplates.createdAt));
  }

  async updateInvoiceTemplate(id: number, updates: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined> {
    const [updated] = await db
      .update(invoiceTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoiceTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteInvoiceTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Invoice payments operations
  async createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment> {
    const [created] = await db
      .insert(invoicePayments)
      .values(payment)
      .returning();
    return created;
  }

  async getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]> {
    return await db
      .select()
      .from(invoicePayments)
      .where(eq(invoicePayments.invoiceId, invoiceId))
      .orderBy(desc(invoicePayments.paymentDate));
  }

  async updateInvoicePayment(id: number, updates: Partial<InsertInvoicePayment>): Promise<InvoicePayment | undefined> {
    const [updated] = await db
      .update(invoicePayments)
      .set(updates)
      .where(eq(invoicePayments.id, id))
      .returning();
    return updated;
  }

  // Invoice notifications operations
  async createInvoiceNotification(notification: InsertInvoiceNotification): Promise<InvoiceNotification> {
    const [created] = await db
      .insert(invoiceNotifications)
      .values(notification)
      .returning();
    return created;
  }

  async getInvoiceNotifications(invoiceId: number): Promise<InvoiceNotification[]> {
    return await db
      .select()
      .from(invoiceNotifications)
      .where(eq(invoiceNotifications.invoiceId, invoiceId))
      .orderBy(desc(invoiceNotifications.sentAt));
  }

  async updateInvoiceNotification(id: number, updates: Partial<InsertInvoiceNotification>): Promise<InvoiceNotification | undefined> {
    const [updated] = await db
      .update(invoiceNotifications)
      .set(updates)
      .where(eq(invoiceNotifications.id, id))
      .returning();
    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // [ESCROW] Escrow Stats
  // ═══════════════════════════════════════════════════════

  async getEscrowStats(): Promise<{
    totalEscrows: number;
    totalValueLocked: number;
    escrowsByStatus: Record<string, number>;
    escrowsByRole: Record<string, number>;
    averageEscrowValue: number;
    topTokens: Array<{
      symbol: string;
      count: number;
      totalValue: number;
    }>;
  }> {
    const allEscrows = await this.getAllEscrows();
    
    const totalEscrows = allEscrows.length;
    const totalValueLocked = allEscrows.reduce((sum, escrow) => sum + parseFloat(escrow.amount), 0);
    
    const escrowsByStatus = allEscrows.reduce((acc, escrow) => {
      acc[escrow.status] = (acc[escrow.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const escrowsByRole = {};
    const topTokens: Array<{ symbol: string; count: number; totalValue: number; }> = [];

    return {
      totalEscrows,
      totalValueLocked,
      escrowsByStatus,
      escrowsByRole,
      averageEscrowValue: totalEscrows > 0 ? totalValueLocked / totalEscrows : 0,
      topTokens
    };
  }

  // ═══════════════════════════════════════════════════════
  // [TRADE-FINANCE] Trade Finance Applications
  // ═══════════════════════════════════════════════════════

  async createLiquidityStake(stake: InsertLiquidityPoolStake): Promise<LiquidityPoolStake> {
    const [created] = await db
      .insert(liquidityPoolStakes)
      .values(stake)
      .returning();
    return created;
  }

  async getLiquidityStakes(filters: {
    id?: number;
    stakerAddress?: string;
    status?: string;
  }): Promise<LiquidityPoolStake[]> {
    let query = db.select().from(liquidityPoolStakes);
    
    const conditions = [];
    if (filters.id !== undefined) {
      conditions.push(eq(liquidityPoolStakes.id, filters.id));
    }
    if (filters.stakerAddress) {
      // Use SQL LOWER() to compare addresses case-insensitively
      conditions.push(sql`LOWER(${liquidityPoolStakes.stakerAddress}) = LOWER(${filters.stakerAddress})`);
    }
    if (filters.status) {
      conditions.push(eq(liquidityPoolStakes.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(liquidityPoolStakes.stakedAt));
  }

  async updateLiquidityStake(id: number, updates: Partial<InsertLiquidityPoolStake>): Promise<LiquidityPoolStake | undefined> {
    const [updated] = await db
      .update(liquidityPoolStakes)
      .set(updates)
      .where(eq(liquidityPoolStakes.id, id))
      .returning();
    return updated;
  }

  async createTradeFinanceRequest(request: InsertTradeFinanceRequest): Promise<TradeFinanceRequest> {
    const [created] = await db
      .insert(tradeFinanceRequests)
      .values(request)
      .returning();
    return created;
  }

  async getTradeFinanceRequests(filters: {
    buyerAddress?: string;
    sellerAddress?: string;
    status?: string;
  }): Promise<TradeFinanceRequest[]> {
    let query = db.select().from(tradeFinanceRequests);
    
    const conditions = [];
    if (filters.buyerAddress) {
      conditions.push(eq(tradeFinanceRequests.buyerAddress, filters.buyerAddress.toLowerCase()));
    }
    if (filters.sellerAddress) {
      conditions.push(eq(tradeFinanceRequests.sellerAddress, filters.sellerAddress.toLowerCase()));
    }
    if (filters.status) {
      conditions.push(eq(tradeFinanceRequests.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(tradeFinanceRequests.createdAt));
  }

  async getAllTradeFinanceRequests(): Promise<TradeFinanceRequest[]> {
    return await db
      .select()
      .from(tradeFinanceRequests)
      .orderBy(desc(tradeFinanceRequests.createdAt));
  }

  async getTradeFinanceRequestsByBuyer(buyerAddress: string): Promise<TradeFinanceRequest[]> {
    return await db
      .select()
      .from(tradeFinanceRequests)
      .where(eq(tradeFinanceRequests.buyerAddress, buyerAddress.toLowerCase()))
      .orderBy(desc(tradeFinanceRequests.createdAt));
  }

  async getTradeFinanceRequestsBySeller(sellerAddress: string): Promise<TradeFinanceRequest[]> {
    return await db
      .select()
      .from(tradeFinanceRequests)
      .where(eq(tradeFinanceRequests.sellerAddress, sellerAddress.toLowerCase()))
      .orderBy(desc(tradeFinanceRequests.createdAt));
  }

  async getTradeFinanceRequest(requestId: string): Promise<TradeFinanceRequest | undefined> {
    const [request] = await db
      .select()
      .from(tradeFinanceRequests)
      .where(eq(tradeFinanceRequests.requestId, requestId));
    return request;
  }

  async updateTradeFinanceRequest(requestId: string, updates: Partial<InsertTradeFinanceRequest>): Promise<TradeFinanceRequest | undefined> {
    const [updated] = await db
      .update(tradeFinanceRequests)
      .set(updates)
      .where(eq(tradeFinanceRequests.requestId, requestId))
      .returning();
    return updated;
  }

  async createTradeFinanceVote(vote: InsertTradeFinanceVote): Promise<TradeFinanceVote> {
    const [created] = await db
      .insert(tradeFinanceVotes)
      .values(vote)
      .returning();
    return created;
  }

  async getTradeFinanceVotes(requestId: string): Promise<TradeFinanceVote[]> {
    return await db
      .select()
      .from(tradeFinanceVotes)
      .where(eq(tradeFinanceVotes.requestId, requestId))
      .orderBy(desc(tradeFinanceVotes.votedAt));
  }

  async getPoolStatistics(): Promise<{
    totalStaked: string;
    totalLPs: number;
    activeRequests: number;
    totalFinanced: string;
  }> {
    const activeStakes = await db
      .select()
      .from(liquidityPoolStakes)
      .where(eq(liquidityPoolStakes.status, 'active'));
    
    const totalStaked = activeStakes.reduce((sum, stake) => 
      sum + parseFloat(stake.amount), 0
    ).toString();
    
    const uniqueLPs = new Set(activeStakes.map(s => s.stakerAddress)).size;
    
    const pendingRequests = await db
      .select()
      .from(tradeFinanceRequests)
      .where(eq(tradeFinanceRequests.status, 'pending'));
    
    const approvedRequests = await db
      .select()
      .from(tradeFinanceRequests)
      .where(eq(tradeFinanceRequests.status, 'approved'));
    
    const totalFinanced = approvedRequests.reduce((sum, req) => 
      sum + parseFloat(req.requestedAmount), 0
    ).toString();
    
    return {
      totalStaked,
      totalLPs: uniqueLPs,
      activeRequests: pendingRequests.length,
      totalFinanced
    };
  }

  async createPerformanceBond(bond: InsertPerformanceBond): Promise<PerformanceBond> {
    const [created] = await db
      .insert(performanceBonds)
      .values(bond)
      .returning();
    return created;
  }

  async getPerformanceBond(requestId: string): Promise<PerformanceBond | undefined> {
    const [bond] = await db
      .select()
      .from(performanceBonds)
      .where(eq(performanceBonds.requestId, requestId));
    return bond;
  }

  async createTradeCollateral(collateral: InsertTradeCollateral): Promise<TradeCollateral> {
    const [created] = await db
      .insert(tradeCollateral)
      .values(collateral)
      .returning();
    return created;
  }

  async getTradeCollateral(requestId: string): Promise<TradeCollateral[]> {
    return await db
      .select()
      .from(tradeCollateral)
      .where(eq(tradeCollateral.requestId, requestId))
      .orderBy(desc(tradeCollateral.createdAt));
  }

  // Trade Finance delivery operations
  async createDeliveryProof(proof: InsertDeliveryProof): Promise<DeliveryProof> {
    const [created] = await db
      .insert(deliveryProofs)
      .values(proof)
      .returning();
    return created;
  }

  async getDeliveryProof(requestId: string): Promise<DeliveryProof | undefined> {
    const [proof] = await db
      .select()
      .from(deliveryProofs)
      .where(eq(deliveryProofs.requestId, requestId));
    return proof;
  }

  async updateDeliveryProof(requestId: string, updates: Partial<InsertDeliveryProof>): Promise<DeliveryProof | undefined> {
    const [updated] = await db
      .update(deliveryProofs)
      .set(updates)
      .where(eq(deliveryProofs.requestId, requestId))
      .returning();
    return updated;
  }

  async createGoodsCollateral(collateral: InsertGoodsCollateral): Promise<GoodsCollateral> {
    const [created] = await db
      .insert(goodsCollateral)
      .values(collateral)
      .returning();
    return created;
  }

  async getGoodsCollateral(requestId: string): Promise<GoodsCollateral | undefined> {
    const [collateral] = await db
      .select()
      .from(goodsCollateral)
      .where(eq(goodsCollateral.requestId, requestId));
    return collateral;
  }

  async getGoodsCollateralByRequestId(requestId: string): Promise<GoodsCollateral | undefined> {
    const [collateral] = await db
      .select()
      .from(goodsCollateral)
      .where(eq(goodsCollateral.requestId, requestId));
    return collateral;
  }

  async updateGoodsCollateral(id: number, updates: Partial<InsertGoodsCollateral>): Promise<GoodsCollateral | undefined> {
    const [updated] = await db
      .update(goodsCollateral)
      .set(updates)
      .where(eq(goodsCollateral.id, id))
      .returning();
    return updated;
  }

  async getAllGoodsCollateral(): Promise<GoodsCollateral[]> {
    return await db.select().from(goodsCollateral);
  }

  async createGuaranteeClaim(claim: InsertGuaranteeClaim): Promise<GuaranteeClaim> {
    const [created] = await db
      .insert(guaranteeClaims)
      .values(claim)
      .returning();
    return created;
  }

  async getGuaranteeClaims(filters: {
    requestId?: string;
    status?: string;
  }): Promise<GuaranteeClaim[]> {
    let query = db.select().from(guaranteeClaims);
    
    const conditions = [];
    if (filters.requestId) {
      conditions.push(eq(guaranteeClaims.requestId, filters.requestId));
    }
    if (filters.status) {
      conditions.push(eq(guaranteeClaims.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(guaranteeClaims.claimedAt));
  }

  async getGuaranteeClaim(id: number): Promise<GuaranteeClaim | undefined> {
    const [claim] = await db
      .select()
      .from(guaranteeClaims)
      .where(eq(guaranteeClaims.id, id));
    return claim;
  }

  async updateGuaranteeClaim(id: number, updates: Partial<InsertGuaranteeClaim>): Promise<GuaranteeClaim | undefined> {
    const [updated] = await db
      .update(guaranteeClaims)
      .set(updates)
      .where(eq(guaranteeClaims.id, id))
      .returning();
    return updated;
  }

  async createClaimVote(vote: InsertClaimVote): Promise<ClaimVote> {
    const [created] = await db
      .insert(claimVotes)
      .values(vote)
      .returning();
    return created;
  }

  async getClaimVotes(claimId: number): Promise<ClaimVote[]> {
    return await db
      .select()
      .from(claimVotes)
      .where(eq(claimVotes.claimId, claimId))
      .orderBy(desc(claimVotes.votedAt));
  }

  async getClaimVoteByVoter(claimId: number, voterAddress: string): Promise<ClaimVote | undefined> {
    const [vote] = await db
      .select()
      .from(claimVotes)
      .where(
        and(
          eq(claimVotes.claimId, claimId),
          eq(claimVotes.voterAddress, voterAddress.toLowerCase())
        )
      );
    return vote;
  }

  async createGuaranteeIssuanceFee(fee: InsertGuaranteeIssuanceFee): Promise<GuaranteeIssuanceFee> {
    const [created] = await db
      .insert(guaranteeIssuanceFees)
      .values(fee)
      .returning();
    return created;
  }

  async getGuaranteeIssuanceFee(requestId: string): Promise<GuaranteeIssuanceFee | undefined> {
    const [fee] = await db
      .select()
      .from(guaranteeIssuanceFees)
      .where(eq(guaranteeIssuanceFees.requestId, requestId));
    return fee;
  }

  // Trade Finance Documents (Invoice uploads)
  async createDocument(document: InsertTradeFinanceDocument): Promise<TradeFinanceDocument> {
    const [created] = await db
      .insert(tradeFinanceDocuments)
      .values(document)
      .returning();
    return created;
  }

  async getDocument(id: number): Promise<TradeFinanceDocument | undefined> {
    const [doc] = await db
      .select()
      .from(tradeFinanceDocuments)
      .where(eq(tradeFinanceDocuments.id, id));
    return doc;
  }

  async getDocumentsByRequestId(requestId: string): Promise<TradeFinanceDocument[]> {
    return await db
      .select()
      .from(tradeFinanceDocuments)
      .where(eq(tradeFinanceDocuments.requestId, requestId))
      .orderBy(desc(tradeFinanceDocuments.createdAt));
  }

  async getDocumentsByType(requestId: string, documentType: string): Promise<TradeFinanceDocument[]> {
    return await db
      .select()
      .from(tradeFinanceDocuments)
      .where(
        and(
          eq(tradeFinanceDocuments.requestId, requestId),
          eq(tradeFinanceDocuments.documentType, documentType)
        )
      )
      .orderBy(desc(tradeFinanceDocuments.createdAt));
  }

  // Trade Finance Certificates (Draft and Final guarantees)
  async createCertificate(certificate: InsertTradeFinanceCertificate): Promise<TradeFinanceCertificate> {
    const [created] = await db
      .insert(tradeFinanceCertificates)
      .values(certificate)
      .returning();
    return created;
  }

  async getCertificate(id: number): Promise<TradeFinanceCertificate | undefined> {
    const [cert] = await db
      .select()
      .from(tradeFinanceCertificates)
      .where(eq(tradeFinanceCertificates.id, id));
    return cert;
  }

  async getCertificatesByRequestId(requestId: string): Promise<TradeFinanceCertificate[]> {
    return await db
      .select()
      .from(tradeFinanceCertificates)
      .where(eq(tradeFinanceCertificates.requestId, requestId))
      .orderBy(desc(tradeFinanceCertificates.createdAt));
  }

  async getAllCertificates(): Promise<TradeFinanceCertificate[]> {
    return await db
      .select()
      .from(tradeFinanceCertificates)
      .orderBy(desc(tradeFinanceCertificates.createdAt));
  }

  async getActiveCertificate(requestId: string, type: string): Promise<TradeFinanceCertificate | undefined> {
    const [cert] = await db
      .select()
      .from(tradeFinanceCertificates)
      .where(
        and(
          eq(tradeFinanceCertificates.requestId, requestId),
          eq(tradeFinanceCertificates.certificateType, type),
          eq(tradeFinanceCertificates.isActive, true)
        )
      )
      .orderBy(desc(tradeFinanceCertificates.version));
    return cert;
  }

  async updateCertificate(id: number, updates: Partial<InsertTradeFinanceCertificate>): Promise<TradeFinanceCertificate | undefined> {
    const [updated] = await db
      .update(tradeFinanceCertificates)
      .set(updates)
      .where(eq(tradeFinanceCertificates.id, id))
      .returning();
    return updated;
  }

  // Specialist Role operations
  async createSpecialistRole(role: InsertSpecialistRole): Promise<SpecialistRole> {
    const [created] = await db
      .insert(specialistRoles)
      .values({
        ...role,
        walletAddress: role.walletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getSpecialistRole(walletAddress: string): Promise<SpecialistRole | undefined> {
    const [role] = await db
      .select()
      .from(specialistRoles)
      .where(eq(specialistRoles.walletAddress, walletAddress.toLowerCase()));
    return role;
  }

  async getSpecialistRolesByType(roleType: string): Promise<SpecialistRole[]> {
    return await db
      .select()
      .from(specialistRoles)
      .where(eq(specialistRoles.roleType, roleType))
      .orderBy(desc(specialistRoles.createdAt));
  }

  async getAllSpecialistRoles(): Promise<SpecialistRole[]> {
    return await db
      .select()
      .from(specialistRoles)
      .orderBy(desc(specialistRoles.createdAt));
  }

  async updateSpecialistRole(walletAddress: string, updates: Partial<InsertSpecialistRole>): Promise<SpecialistRole | undefined> {
    const [updated] = await db
      .update(specialistRoles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(specialistRoles.walletAddress, walletAddress.toLowerCase()))
      .returning();
    return updated;
  }

  // Specialist Credential operations
  async createSpecialistCredential(credential: InsertSpecialistCredential): Promise<SpecialistCredential> {
    const [created] = await db
      .insert(specialistCredentials)
      .values({
        ...credential,
        specialistAddress: credential.specialistAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getSpecialistCredentials(specialistAddress: string): Promise<SpecialistCredential[]> {
    return await db
      .select()
      .from(specialistCredentials)
      .where(eq(specialistCredentials.specialistAddress, specialistAddress.toLowerCase()))
      .orderBy(desc(specialistCredentials.createdAt));
  }

  async getSpecialistCredential(id: number): Promise<SpecialistCredential | undefined> {
    const [credential] = await db
      .select()
      .from(specialistCredentials)
      .where(eq(specialistCredentials.id, id));
    return credential;
  }

  async updateSpecialistCredential(id: number, updates: Partial<InsertSpecialistCredential>): Promise<SpecialistCredential | undefined> {
    const [updated] = await db
      .update(specialistCredentials)
      .set(updates)
      .where(eq(specialistCredentials.id, id))
      .returning();
    return updated;
  }

  // Specialist Statistics operations
  async getSpecialistStatistics(specialistAddress: string): Promise<SpecialistStatistics | undefined> {
    const [stats] = await db
      .select()
      .from(specialistStatistics)
      .where(eq(specialistStatistics.specialistAddress, specialistAddress.toLowerCase()));
    return stats;
  }

  async updateSpecialistStatistics(specialistAddress: string, updates: Partial<InsertSpecialistStatistics>): Promise<SpecialistStatistics | undefined> {
    const [updated] = await db
      .update(specialistStatistics)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(specialistStatistics.specialistAddress, specialistAddress.toLowerCase()))
      .returning();
    return updated;
  }

  async createSpecialistStatistics(stats: InsertSpecialistStatistics): Promise<SpecialistStatistics> {
    const [created] = await db
      .insert(specialistStatistics)
      .values({
        ...stats,
        specialistAddress: stats.specialistAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  // Vote Delegation operations
  async createVoteDelegation(delegation: InsertVoteDelegation): Promise<VoteDelegation> {
    // First, revoke any existing active delegation
    await this.revokeVoteDelegation(delegation.delegatorAddress);
    
    const [created] = await db
      .insert(voteDelegations)
      .values({
        ...delegation,
        delegatorAddress: delegation.delegatorAddress.toLowerCase(),
        delegateAddress: delegation.delegateAddress.toLowerCase(),
        status: 'active'
      })
      .returning();
    return created;
  }

  async revokeVoteDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined> {
    const [revoked] = await db
      .update(voteDelegations)
      .set({
        status: 'revoked',
        revokedAt: new Date()
      })
      .where(
        and(
          eq(voteDelegations.delegatorAddress, delegatorAddress.toLowerCase()),
          eq(voteDelegations.status, 'active')
        )
      )
      .returning();
    return revoked;
  }

  async getCurrentActiveDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined> {
    const [delegation] = await db
      .select()
      .from(voteDelegations)
      .where(
        and(
          eq(voteDelegations.delegatorAddress, delegatorAddress.toLowerCase()),
          eq(voteDelegations.status, 'active')
        )
      );
    return delegation;
  }

  async getVoteDelegationsByDelegate(delegateAddress: string): Promise<VoteDelegation[]> {
    return await db
      .select()
      .from(voteDelegations)
      .where(
        and(
          eq(voteDelegations.delegateAddress, delegateAddress.toLowerCase()),
          eq(voteDelegations.status, 'active')
        )
      );
  }

  async getTotalDelegatedPower(delegateAddress: string): Promise<number> {
    const result = await db
      .select({
        total: sql<string>`COALESCE(SUM(${voteDelegations.votingPower}), 0)`
      })
      .from(voteDelegations)
      .where(
        and(
          eq(voteDelegations.delegateAddress, delegateAddress.toLowerCase()),
          eq(voteDelegations.status, 'active')
        )
      );
    
    return parseFloat(result[0]?.total || '0');
  }

  // ═══════════════════════════════════════════════════════
  // [MARKETPLACE] B2B Marketplace
  // ═══════════════════════════════════════════════════════

  async createMarketplaceBusiness(business: InsertMarketplaceBusiness): Promise<MarketplaceBusiness> {
    const [created] = await db
      .insert(marketplaceBusinesses)
      .values({
        ...business,
        walletAddress: business.walletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getMarketplaceBusiness(walletAddress: string): Promise<MarketplaceBusiness | undefined> {
    const [business] = await db
      .select()
      .from(marketplaceBusinesses)
      .where(eq(marketplaceBusinesses.walletAddress, walletAddress.toLowerCase()));
    return business;
  }

  async getMarketplaceBusinessById(id: number): Promise<MarketplaceBusiness | undefined> {
    const [business] = await db
      .select()
      .from(marketplaceBusinesses)
      .where(eq(marketplaceBusinesses.id, id));
    return business;
  }

  async searchMarketplaceBusinesses(filters: {
    industry?: string;
    country?: string;
    region?: string;
    companyType?: string;
    productCategories?: string[];
    isVerified?: boolean;
    minTradeScore?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceBusiness[]> {
    let query = db.select().from(marketplaceBusinesses);
    const conditions: any[] = [eq(marketplaceBusinesses.status, 'active')];
    
    if (filters.industry) {
      conditions.push(eq(marketplaceBusinesses.industry, filters.industry));
    }
    if (filters.country) {
      conditions.push(eq(marketplaceBusinesses.country, filters.country));
    }
    if (filters.region) {
      conditions.push(eq(marketplaceBusinesses.region, filters.region));
    }
    if (filters.companyType) {
      conditions.push(eq(marketplaceBusinesses.companyType, filters.companyType));
    }
    if (filters.isVerified !== undefined) {
      conditions.push(eq(marketplaceBusinesses.isVerified, filters.isVerified));
    }
    if (filters.minTradeScore !== undefined) {
      conditions.push(sql`${marketplaceBusinesses.tradeScore} >= ${filters.minTradeScore}`);
    }
    if (filters.search) {
      conditions.push(sql`(
        LOWER(${marketplaceBusinesses.companyName}) LIKE ${`%${filters.search.toLowerCase()}%`} OR
        LOWER(${marketplaceBusinesses.description}) LIKE ${`%${filters.search.toLowerCase()}%`}
      )`);
    }
    
    const results = await db
      .select()
      .from(marketplaceBusinesses)
      .where(and(...conditions))
      .orderBy(desc(marketplaceBusinesses.tradeScore), desc(marketplaceBusinesses.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
    
    return results;
  }

  async updateMarketplaceBusiness(walletAddress: string, updates: Partial<InsertMarketplaceBusiness>): Promise<MarketplaceBusiness | undefined> {
    const [updated] = await db
      .update(marketplaceBusinesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceBusinesses.walletAddress, walletAddress.toLowerCase()))
      .returning();
    return updated;
  }

  async incrementBusinessProfileViews(walletAddress: string): Promise<void> {
    await db
      .update(marketplaceBusinesses)
      .set({
        profileViews: sql`${marketplaceBusinesses.profileViews} + 1`
      })
      .where(eq(marketplaceBusinesses.walletAddress, walletAddress.toLowerCase()));
  }

  // Marketplace Product operations
  async createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct> {
    const [created] = await db
      .insert(marketplaceProducts)
      .values({
        ...product,
        walletAddress: product.walletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined> {
    const [product] = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.id, id));
    return product;
  }

  async getMarketplaceProductsByBusiness(businessId: number): Promise<MarketplaceProduct[]> {
    return await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.businessId, businessId))
      .orderBy(desc(marketplaceProducts.createdAt));
  }

  async searchMarketplaceProducts(filters: {
    category?: string;
    country?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceProduct[]> {
    const conditions: any[] = [];
    
    if (filters.status) {
      conditions.push(eq(marketplaceProducts.status, filters.status));
    } else {
      conditions.push(eq(marketplaceProducts.status, 'active'));
    }
    
    if (filters.category) {
      conditions.push(eq(marketplaceProducts.category, filters.category));
    }
    if (filters.country) {
      conditions.push(eq(marketplaceProducts.countryOfOrigin, filters.country));
    }
    if (filters.minPrice) {
      conditions.push(sql`${marketplaceProducts.minPrice} >= ${filters.minPrice}`);
    }
    if (filters.maxPrice) {
      conditions.push(sql`${marketplaceProducts.maxPrice} <= ${filters.maxPrice}`);
    }
    if (filters.search) {
      conditions.push(sql`(
        LOWER(${marketplaceProducts.productName}) LIKE ${`%${filters.search.toLowerCase()}%`} OR
        LOWER(${marketplaceProducts.description}) LIKE ${`%${filters.search.toLowerCase()}%`}
      )`);
    }
    
    return await db
      .select()
      .from(marketplaceProducts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(marketplaceProducts.isFeatured), desc(marketplaceProducts.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
  }

  async updateMarketplaceProduct(id: number, updates: Partial<InsertMarketplaceProduct>): Promise<MarketplaceProduct | undefined> {
    const [updated] = await db
      .update(marketplaceProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceProducts.id, id))
      .returning();
    return updated;
  }

  async deleteMarketplaceProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(marketplaceProducts)
      .where(eq(marketplaceProducts.id, id));
    return true;
  }

  // Marketplace RFQ operations
  async createMarketplaceRfq(rfq: InsertMarketplaceRfq): Promise<MarketplaceRfq> {
    const [created] = await db
      .insert(marketplaceRfqs)
      .values({
        ...rfq,
        buyerWalletAddress: rfq.buyerWalletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getMarketplaceRfq(id: number): Promise<MarketplaceRfq | undefined> {
    const [rfq] = await db
      .select()
      .from(marketplaceRfqs)
      .where(eq(marketplaceRfqs.id, id));
    return rfq;
  }

  async getMarketplaceRfqByNumber(rfqNumber: string): Promise<MarketplaceRfq | undefined> {
    const [rfq] = await db
      .select()
      .from(marketplaceRfqs)
      .where(eq(marketplaceRfqs.rfqNumber, rfqNumber));
    return rfq;
  }

  async getMarketplaceRfqsByBuyer(buyerWallet: string): Promise<MarketplaceRfq[]> {
    return await db
      .select()
      .from(marketplaceRfqs)
      .where(eq(marketplaceRfqs.buyerWalletAddress, buyerWallet.toLowerCase()))
      .orderBy(desc(marketplaceRfqs.createdAt));
  }

  async searchMarketplaceRfqs(filters: {
    productCategory?: string;
    deliveryCountry?: string;
    status?: string;
    minBudget?: string;
    maxBudget?: string;
    tradeFinancePreferred?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<MarketplaceRfq[]> {
    const conditions: any[] = [];
    
    if (filters.status) {
      conditions.push(eq(marketplaceRfqs.status, filters.status));
    } else {
      conditions.push(eq(marketplaceRfqs.status, 'open'));
    }
    
    if (filters.productCategory) {
      conditions.push(eq(marketplaceRfqs.productCategory, filters.productCategory));
    }
    if (filters.deliveryCountry) {
      conditions.push(eq(marketplaceRfqs.deliveryCountry, filters.deliveryCountry));
    }
    if (filters.tradeFinancePreferred !== undefined) {
      conditions.push(eq(marketplaceRfqs.tradeFinancePreferred, filters.tradeFinancePreferred));
    }
    if (filters.minBudget) {
      conditions.push(sql`${marketplaceRfqs.budgetMin} >= ${filters.minBudget}`);
    }
    if (filters.maxBudget) {
      conditions.push(sql`${marketplaceRfqs.budgetMax} <= ${filters.maxBudget}`);
    }
    
    // Only show non-expired RFQs
    conditions.push(sql`${marketplaceRfqs.expiresAt} > NOW()`);
    
    return await db
      .select()
      .from(marketplaceRfqs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(marketplaceRfqs.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);
  }

  async updateMarketplaceRfq(id: number, updates: Partial<InsertMarketplaceRfq>): Promise<MarketplaceRfq | undefined> {
    const [updated] = await db
      .update(marketplaceRfqs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceRfqs.id, id))
      .returning();
    return updated;
  }

  // Marketplace Quote operations
  async createMarketplaceQuote(quote: InsertMarketplaceQuote): Promise<MarketplaceQuote> {
    const [created] = await db
      .insert(marketplaceQuotes)
      .values({
        ...quote,
        supplierWalletAddress: quote.supplierWalletAddress.toLowerCase()
      })
      .returning();
    
    // Increment quote count on RFQ
    await db
      .update(marketplaceRfqs)
      .set({
        totalQuotes: sql`${marketplaceRfqs.totalQuotes} + 1`
      })
      .where(eq(marketplaceRfqs.id, quote.rfqId));
    
    return created;
  }

  async getMarketplaceQuote(id: number): Promise<MarketplaceQuote | undefined> {
    const [quote] = await db
      .select()
      .from(marketplaceQuotes)
      .where(eq(marketplaceQuotes.id, id));
    return quote;
  }

  async getMarketplaceQuotesByRfq(rfqId: number): Promise<MarketplaceQuote[]> {
    return await db
      .select()
      .from(marketplaceQuotes)
      .where(eq(marketplaceQuotes.rfqId, rfqId))
      .orderBy(desc(marketplaceQuotes.createdAt));
  }

  async getMarketplaceQuotesBySupplier(supplierWallet: string): Promise<MarketplaceQuote[]> {
    return await db
      .select()
      .from(marketplaceQuotes)
      .where(eq(marketplaceQuotes.supplierWalletAddress, supplierWallet.toLowerCase()))
      .orderBy(desc(marketplaceQuotes.createdAt));
  }

  async updateMarketplaceQuote(id: number, updates: Partial<InsertMarketplaceQuote>): Promise<MarketplaceQuote | undefined> {
    const [updated] = await db
      .update(marketplaceQuotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceQuotes.id, id))
      .returning();
    return updated;
  }

  // Marketplace Review operations
  async createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview> {
    const [created] = await db
      .insert(marketplaceReviews)
      .values({
        ...review,
        reviewerWalletAddress: review.reviewerWalletAddress.toLowerCase(),
        reviewedWalletAddress: review.reviewedWalletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getMarketplaceReviewsByBusiness(businessWallet: string): Promise<MarketplaceReview[]> {
    return await db
      .select()
      .from(marketplaceReviews)
      .where(
        and(
          eq(marketplaceReviews.reviewedWalletAddress, businessWallet.toLowerCase()),
          eq(marketplaceReviews.status, 'published')
        )
      )
      .orderBy(desc(marketplaceReviews.createdAt));
  }

  async getMarketplaceReviewsByReviewer(reviewerWallet: string): Promise<MarketplaceReview[]> {
    return await db
      .select()
      .from(marketplaceReviews)
      .where(eq(marketplaceReviews.reviewerWalletAddress, reviewerWallet.toLowerCase()))
      .orderBy(desc(marketplaceReviews.createdAt));
  }

  async getAverageBusinessRating(businessWallet: string): Promise<{ rating: number; count: number }> {
    const result = await db
      .select({
        avgRating: sql<string>`COALESCE(AVG(${marketplaceReviews.overallRating}), 0)`,
        reviewCount: sql<string>`COUNT(*)`
      })
      .from(marketplaceReviews)
      .where(
        and(
          eq(marketplaceReviews.reviewedWalletAddress, businessWallet.toLowerCase()),
          eq(marketplaceReviews.status, 'published')
        )
      );
    
    return {
      rating: parseFloat(result[0]?.avgRating || '0'),
      count: parseInt(result[0]?.reviewCount || '0')
    };
  }

  async updateMarketplaceReview(id: number, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview | undefined> {
    const [updated] = await db
      .update(marketplaceReviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceReviews.id, id))
      .returning();
    return updated;
  }

  // Marketplace Connection operations
  async createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection> {
    const [created] = await db
      .insert(marketplaceConnections)
      .values({
        ...connection,
        requesterWalletAddress: connection.requesterWalletAddress.toLowerCase(),
        targetWalletAddress: connection.targetWalletAddress.toLowerCase()
      })
      .returning();
    return created;
  }

  async getMarketplaceConnections(walletAddress: string): Promise<MarketplaceConnection[]> {
    return await db
      .select()
      .from(marketplaceConnections)
      .where(
        or(
          eq(marketplaceConnections.requesterWalletAddress, walletAddress.toLowerCase()),
          eq(marketplaceConnections.targetWalletAddress, walletAddress.toLowerCase())
        )
      )
      .orderBy(desc(marketplaceConnections.requestedAt));
  }

  async getMarketplaceConnection(requesterWallet: string, targetWallet: string): Promise<MarketplaceConnection | undefined> {
    const [connection] = await db
      .select()
      .from(marketplaceConnections)
      .where(
        and(
          eq(marketplaceConnections.requesterWalletAddress, requesterWallet.toLowerCase()),
          eq(marketplaceConnections.targetWalletAddress, targetWallet.toLowerCase())
        )
      );
    return connection;
  }

  async updateMarketplaceConnection(id: number, updates: Partial<InsertMarketplaceConnection>): Promise<MarketplaceConnection | undefined> {
    const [updated] = await db
      .update(marketplaceConnections)
      .set({ ...updates, respondedAt: new Date() })
      .where(eq(marketplaceConnections.id, id))
      .returning();
    return updated;
  }

  // Trade Corridor operations
  async createTradeCorridor(corridor: InsertTradeCorridor): Promise<TradeCorridor> {
    const [created] = await db
      .insert(tradeCorridors)
      .values(corridor)
      .returning();
    return created;
  }

  async getTradeCorridor(id: number): Promise<TradeCorridor | undefined> {
    const [corridor] = await db
      .select()
      .from(tradeCorridors)
      .where(eq(tradeCorridors.id, id));
    return corridor;
  }

  async getAllTradeCorridors(): Promise<TradeCorridor[]> {
    return await db
      .select()
      .from(tradeCorridors)
      .where(eq(tradeCorridors.status, 'active'))
      .orderBy(desc(tradeCorridors.totalTradeVolume));
  }

  async getTradeCorridorsByRegion(sourceRegion: string, destinationRegion: string): Promise<TradeCorridor[]> {
    return await db
      .select()
      .from(tradeCorridors)
      .where(
        and(
          eq(tradeCorridors.sourceRegion, sourceRegion),
          eq(tradeCorridors.destinationRegion, destinationRegion),
          eq(tradeCorridors.status, 'active')
        )
      );
  }

  async updateTradeCorridor(id: number, updates: Partial<InsertTradeCorridor>): Promise<TradeCorridor | undefined> {
    const [updated] = await db
      .update(tradeCorridors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tradeCorridors.id, id))
      .returning();
    return updated;
  }

  // Waitlist operations
  async createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist> {
    const [created] = await db
      .insert(waitlist)
      .values(entry)
      .returning();
    return created;
  }

  async getWaitlistByEmail(email: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()));
    return entry;
  }

  async getAllWaitlistEntries(): Promise<Waitlist[]> {
    return await db
      .select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));
  }

  async getWaitlistCount(): Promise<number> {
    const result = await db
      .select()
      .from(waitlist);
    return result.length;
  }

  // ═══════════════════════════════════════════════════════
  // [HEDGE] P2P Trade Hedge
  // ═══════════════════════════════════════════════════════

  async createHedgeEvent(event: InsertHedgeEvent): Promise<HedgeEvent> {
    const [created] = await db.insert(hedgeEvents).values(event).returning();
    return created;
  }

  async getHedgeEvent(id: number): Promise<HedgeEvent | undefined> {
    const [event] = await db.select().from(hedgeEvents).where(eq(hedgeEvents.id, id));
    return event;
  }

  async getAllHedgeEvents(): Promise<HedgeEvent[]> {
    return await db.select().from(hedgeEvents).orderBy(desc(hedgeEvents.createdAt));
  }

  async getOpenHedgeEvents(): Promise<HedgeEvent[]> {
    return await db.select().from(hedgeEvents).where(eq(hedgeEvents.status, "open")).orderBy(desc(hedgeEvents.createdAt));
  }

  async updateHedgeEvent(id: number, updates: Partial<HedgeEvent>): Promise<HedgeEvent | undefined> {
    const [updated] = await db.update(hedgeEvents).set(updates).where(eq(hedgeEvents.id, id)).returning();
    return updated;
  }

  // Hedge Position operations
  async createHedgePosition(position: InsertHedgePosition): Promise<HedgePosition> {
    const [created] = await db.insert(hedgePositions).values(position).returning();
    return created;
  }

  async getHedgePosition(id: number): Promise<HedgePosition | undefined> {
    const [position] = await db.select().from(hedgePositions).where(eq(hedgePositions.id, id));
    return position;
  }

  async getHedgePositionsByEvent(eventId: number): Promise<HedgePosition[]> {
    return await db.select().from(hedgePositions).where(eq(hedgePositions.eventId, eventId)).orderBy(desc(hedgePositions.createdAt));
  }

  async getHedgePositionsByWallet(wallet: string): Promise<HedgePosition[]> {
    return await db.select().from(hedgePositions).where(eq(hedgePositions.hedgerWallet, wallet)).orderBy(desc(hedgePositions.createdAt));
  }

  async updateHedgePosition(id: number, updates: Partial<HedgePosition>): Promise<HedgePosition | undefined> {
    const [updated] = await db.update(hedgePositions).set(updates).where(eq(hedgePositions.id, id)).returning();
    return updated;
  }

  // Hedge LP Deposit operations
  async createHedgeLpDeposit(deposit: InsertHedgeLpDeposit): Promise<HedgeLpDeposit> {
    const [created] = await db.insert(hedgeLpDeposits).values(deposit).returning();
    return created;
  }

  async getHedgeLpDeposit(id: number): Promise<HedgeLpDeposit | undefined> {
    const [deposit] = await db.select().from(hedgeLpDeposits).where(eq(hedgeLpDeposits.id, id));
    return deposit;
  }

  async getHedgeLpDepositsByEvent(eventId: number): Promise<HedgeLpDeposit[]> {
    return await db.select().from(hedgeLpDeposits).where(eq(hedgeLpDeposits.eventId, eventId)).orderBy(desc(hedgeLpDeposits.createdAt));
  }

  async getHedgeLpDepositsByWallet(wallet: string): Promise<HedgeLpDeposit[]> {
    return await db.select().from(hedgeLpDeposits).where(eq(hedgeLpDeposits.lpWallet, wallet)).orderBy(desc(hedgeLpDeposits.createdAt));
  }

  async updateHedgeLpDeposit(id: number, updates: Partial<HedgeLpDeposit>): Promise<HedgeLpDeposit | undefined> {
    const [updated] = await db.update(hedgeLpDeposits).set(updates).where(eq(hedgeLpDeposits.id, id)).returning();
    return updated;
  }

  // ═══════════════════════════════════════════════════════
  // [FINANCING] Financier Console
  // ═══════════════════════════════════════════════════════

  async createFinancingOffer(offer: InsertFinancingOffer): Promise<FinancingOffer> {
    const [created] = await db.insert(financingOffers).values(offer).returning();
    return created;
  }

  async getFinancingOffer(id: number): Promise<FinancingOffer | undefined> {
    const [offer] = await db.select().from(financingOffers).where(eq(financingOffers.id, id));
    return offer;
  }

  async getFinancingOfferByOfferId(offerId: string): Promise<FinancingOffer | undefined> {
    const [offer] = await db.select().from(financingOffers).where(eq(financingOffers.offerId, offerId));
    return offer;
  }

  async getFinancingOffersByRequest(requestId: string): Promise<FinancingOffer[]> {
    return await db.select().from(financingOffers).where(eq(financingOffers.requestId, requestId)).orderBy(desc(financingOffers.createdAt));
  }

  async getFinancingOffersByFinancier(financierAddress: string): Promise<FinancingOffer[]> {
    return await db.select().from(financingOffers).where(eq(financingOffers.financierAddress, financierAddress)).orderBy(desc(financingOffers.createdAt));
  }

  async updateFinancingOffer(id: number, updates: Partial<FinancingOffer>): Promise<FinancingOffer | undefined> {
    const [updated] = await db.update(financingOffers).set(updates).where(eq(financingOffers.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
