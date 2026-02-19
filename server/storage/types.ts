import {
    type Wallet, type InsertWallet,
    type Network, type InsertNetwork,
    type Transaction, type InsertTransaction,
    type Balance, type InsertBalance,
    type Contact, type InsertContact,
    type Notification, type InsertNotification,
    type ReferralCode, type InsertReferralCode,
    type Referral, type InsertReferral,
    type UserPoints, type InsertUserPoints,
    type TradeFinanceRequest, type InsertTradeFinanceRequest,
    type LiquidityPoolStake, type InsertLiquidityPoolStake,
    type TradeFinanceCertificate, type InsertTradeFinanceCertificate,
    type MarketplaceBusiness, type InsertMarketplaceBusiness,
    type MarketplaceProduct, type InsertMarketplaceProduct,
    type MarketplaceRfq, type InsertMarketplaceRfq,
    type UserRole, type InsertUserRole,
    type Escrow, type InsertEscrow,
    type EventLog, type InsertEventLog,
    type TokenRegistry, type InsertTokenRegistry,
    type SubWallet, type InsertSubWallet,
    type SubWalletInvitation, type InsertSubWalletInvitation,
    type ContractDraft, type InsertContractDraft,
    type ContractSignature, type InsertContractSignature,
    type ContractDeliverable, type InsertContractDeliverable,
    type ContractVerification, type InsertContractVerification,
    type ContractDocument, type InsertContractDocument,
    type Invoice, type InsertInvoice,
    type InvoiceItem, type InsertInvoiceItem,
    type InvoiceTemplate, type InsertInvoiceTemplate,
    type InvoicePayment, type InsertInvoicePayment,
    type InvoiceNotification, type InsertInvoiceNotification,
    type LiquidityPoolStake as Stake,
    type TradeFinanceVote, type InsertTradeFinanceVote,
    type PerformanceBond, type InsertPerformanceBond,
    type TradeCollateral, type InsertTradeCollateral,
    type TradeFinanceDocument, type InsertTradeFinanceDocument,
    type DeliveryProof, type InsertDeliveryProof,
    type GoodsCollateral, type InsertGoodsCollateral,
    type GuaranteeClaim, type InsertGuaranteeClaim,
    type ClaimVote, type InsertClaimVote,
    type GuaranteeIssuanceFee, type InsertGuaranteeIssuanceFee,
    type SpecialistRole, type InsertSpecialistRole,
    type SpecialistCredential, type InsertSpecialistCredential,
    type SpecialistStatistics, type InsertSpecialistStatistics,
    type VoteDelegation, type InsertVoteDelegation,
    type MarketplaceQuote, type InsertMarketplaceQuote,
    type MarketplaceReview, type InsertMarketplaceReview,
    type MarketplaceConnection, type InsertMarketplaceConnection,
    type TradeCorridor, type InsertTradeCorridor,
    type HedgeEvent, type InsertHedgeEvent,
    type HedgePosition, type InsertHedgePosition,
    type HedgeLpDeposit, type InsertHedgeLpDeposit,
    type FinancingOffer, type InsertFinancingOffer
} from "@shared/schema";

export interface IStorage {
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

    // Escrow operations
    getEscrowByContractAndId(contractAddress: string, escrowId: string): Promise<Escrow | undefined>;
    getEscrows(filters: any): Promise<Escrow[]>;
    createEscrow(escrow: InsertEscrow): Promise<Escrow>;
    updateEscrow(id: number, updates: Partial<InsertEscrow>): Promise<Escrow | undefined>;
    getAllEscrows(): Promise<Escrow[]>;

    // User Role operations
    getUserRole(walletAddress: string): Promise<UserRole | undefined>;
    getAllUserRoles(): Promise<UserRole[]>;
    createUserRole(role: InsertUserRole): Promise<UserRole>;
    updateUserRole(walletAddress: string, updates: Partial<InsertUserRole>): Promise<UserRole | undefined>;

    // Event Log operations
    getEventLogs(filters: any): Promise<EventLog[]>;
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
    createContractSignature(signature: InsertContractSignature): Promise<ContractSignature>;
    getContractSignatures(contractId: number): Promise<ContractSignature[]>;
    getAllContractSignatures(): Promise<ContractSignature[]>;

    createContractDeliverable(deliverable: InsertContractDeliverable): Promise<ContractDeliverable>;
    getContractDeliverable(id: number): Promise<ContractDeliverable | undefined>;
    getContractDeliverables(contractId: number): Promise<ContractDeliverable[]>;
    updateContractDeliverable(id: number, updates: Partial<InsertContractDeliverable>): Promise<ContractDeliverable | undefined>;
    claimDeliverable(id: number, claimedBy: string): Promise<ContractDeliverable | undefined>;

    createContractVerification(verification: InsertContractVerification): Promise<ContractVerification>;
    getContractVerification(deliverableId: number, verifierAddress: string): Promise<ContractVerification | undefined>;

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
    markInvoiceAsPaid(id: number, paymentData: any): Promise<Invoice | undefined>;

    createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
    getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
    updateInvoiceItem(id: number, updates: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
    deleteInvoiceItem(id: number): Promise<boolean>;

    createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
    getInvoiceTemplate(id: number): Promise<InvoiceTemplate | undefined>;
    getInvoiceTemplatesByCreator(creatorAddress: string): Promise<InvoiceTemplate[]>;
    updateInvoiceTemplate(id: number, updates: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate | undefined>;
    deleteInvoiceTemplate(id: number): Promise<boolean>;

    createInvoicePayment(payment: InsertInvoicePayment): Promise<InvoicePayment>;
    getInvoicePayments(invoiceId: number): Promise<InvoicePayment[]>;
    updateInvoicePayment(id: number, updates: Partial<InsertInvoicePayment>): Promise<InvoicePayment | undefined>;

    createInvoiceNotification(notification: InsertInvoiceNotification): Promise<InvoiceNotification>;
    getInvoiceNotifications(invoiceId: number): Promise<InvoiceNotification[]>;
    updateInvoiceNotification(id: number, updates: Partial<InsertInvoiceNotification>): Promise<InvoiceNotification | undefined>;

    // Portfolio
    getPortfolioStats(walletId: number): Promise<any>;
    getEscrowStats(): Promise<any>;

    // Trade Finance
    createLiquidityStake(stake: InsertLiquidityPoolStake): Promise<LiquidityPoolStake>;
    getLiquidityStakes(filters: any): Promise<LiquidityPoolStake[]>;
    updateLiquidityStake(id: number, updates: Partial<InsertLiquidityPoolStake>): Promise<LiquidityPoolStake | undefined>;

    createTradeFinanceRequest(request: InsertTradeFinanceRequest): Promise<TradeFinanceRequest>;
    getTradeFinanceRequests(filters: any): Promise<TradeFinanceRequest[]>;
    getAllTradeFinanceRequests(): Promise<TradeFinanceRequest[]>;
    getTradeFinanceRequest(requestId: string): Promise<TradeFinanceRequest | undefined>;
    updateTradeFinanceRequest(requestId: string, updates: Partial<InsertTradeFinanceRequest>): Promise<TradeFinanceRequest | undefined>;

    getPoolStatistics(): Promise<any>;

    createTradeFinanceVote(vote: InsertTradeFinanceVote): Promise<TradeFinanceVote>;
    getTradeFinanceVotes(requestId: string): Promise<TradeFinanceVote[]>;

    createPerformanceBond(bond: InsertPerformanceBond): Promise<PerformanceBond>;
    getPerformanceBond(requestId: string): Promise<PerformanceBond | undefined>;

    createTradeCollateral(collateral: InsertTradeCollateral): Promise<TradeCollateral>;
    getTradeCollateral(requestId: string): Promise<TradeCollateral[]>;

    createDocument(document: InsertTradeFinanceDocument): Promise<TradeFinanceDocument>;
    getDocument(id: number): Promise<TradeFinanceDocument | undefined>;
    getDocumentsByRequestId(requestId: string): Promise<TradeFinanceDocument[]>;
    getDocumentsByType(requestId: string, documentType: string): Promise<TradeFinanceDocument[]>;

    createCertificate(certificate: InsertTradeFinanceCertificate): Promise<TradeFinanceCertificate>;
    getCertificate(id: number): Promise<TradeFinanceCertificate | undefined>;
    getCertificatesByRequestId(requestId: string): Promise<TradeFinanceCertificate[]>;
    getAllCertificates(): Promise<TradeFinanceCertificate[]>;
    getActiveCertificate(requestId: string, type: string): Promise<TradeFinanceCertificate | undefined>;
    updateCertificate(id: number, updates: Partial<InsertTradeFinanceCertificate>): Promise<TradeFinanceCertificate | undefined>;

    createDeliveryProof(proof: InsertDeliveryProof): Promise<DeliveryProof>;
    getDeliveryProof(requestId: string): Promise<DeliveryProof | undefined>;
    updateDeliveryProof(requestId: string, updates: Partial<InsertDeliveryProof>): Promise<DeliveryProof | undefined>;

    createGoodsCollateral(collateral: InsertGoodsCollateral): Promise<GoodsCollateral>;
    getGoodsCollateral(requestId: string): Promise<GoodsCollateral | undefined>;
    getGoodsCollateralByRequestId(requestId: string): Promise<GoodsCollateral | undefined>;
    updateGoodsCollateral(id: number, updates: Partial<InsertGoodsCollateral>): Promise<GoodsCollateral | undefined>;
    getAllGoodsCollateral(): Promise<GoodsCollateral[]>;

    createGuaranteeClaim(claim: InsertGuaranteeClaim): Promise<GuaranteeClaim>;
    getGuaranteeClaims(filters: any): Promise<GuaranteeClaim[]>;
    getGuaranteeClaim(id: number): Promise<GuaranteeClaim | undefined>;
    updateGuaranteeClaim(id: number, updates: Partial<InsertGuaranteeClaim>): Promise<GuaranteeClaim | undefined>;

    createClaimVote(vote: InsertClaimVote): Promise<ClaimVote>;
    getClaimVotes(claimId: number): Promise<ClaimVote[]>;
    getClaimVoteByVoter(claimId: number, voterAddress: string): Promise<ClaimVote | undefined>;

    createGuaranteeIssuanceFee(fee: InsertGuaranteeIssuanceFee): Promise<GuaranteeIssuanceFee>;
    getGuaranteeIssuanceFee(requestId: string): Promise<GuaranteeIssuanceFee | undefined>;

    // Specialist operations
    createSpecialistRole(role: InsertSpecialistRole): Promise<SpecialistRole>;
    getSpecialistRole(walletAddress: string): Promise<SpecialistRole | undefined>;
    getSpecialistRolesByType(roleType: string): Promise<SpecialistRole[]>;
    getAllSpecialistRoles(): Promise<SpecialistRole[]>;
    updateSpecialistRole(walletAddress: string, updates: Partial<InsertSpecialistRole>): Promise<SpecialistRole | undefined>;

    createSpecialistCredential(credential: InsertSpecialistCredential): Promise<SpecialistCredential>;
    getSpecialistCredentials(specialistAddress: string): Promise<SpecialistCredential[]>;
    getSpecialistCredential(id: number): Promise<SpecialistCredential | undefined>;
    updateSpecialistCredential(id: number, updates: Partial<InsertSpecialistCredential>): Promise<SpecialistCredential | undefined>;

    getSpecialistStatistics(specialistAddress: string): Promise<SpecialistStatistics | undefined>;
    updateSpecialistStatistics(specialistAddress: string, updates: Partial<InsertSpecialistStatistics>): Promise<SpecialistStatistics | undefined>;
    createSpecialistStatistics(stats: InsertSpecialistStatistics): Promise<SpecialistStatistics>;

    // Delegation
    createVoteDelegation(delegation: InsertVoteDelegation): Promise<VoteDelegation>;
    revokeVoteDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined>;
    getCurrentActiveDelegation(delegatorAddress: string): Promise<VoteDelegation | undefined>;
    getVoteDelegationsByDelegate(delegateAddress: string): Promise<VoteDelegation[]>;
    getTotalDelegatedPower(delegateAddress: string): Promise<number>;

    // Marketplace
    createMarketplaceBusiness(business: InsertMarketplaceBusiness): Promise<MarketplaceBusiness>;
    getMarketplaceBusiness(walletAddress: string): Promise<MarketplaceBusiness | undefined>;
    getMarketplaceBusinessById(id: number): Promise<MarketplaceBusiness | undefined>;
    searchMarketplaceBusinesses(filters: any): Promise<MarketplaceBusiness[]>;
    updateMarketplaceBusiness(walletAddress: string, updates: Partial<InsertMarketplaceBusiness>): Promise<MarketplaceBusiness | undefined>;
    incrementBusinessProfileViews(walletAddress: string): Promise<void>;

    createMarketplaceProduct(product: InsertMarketplaceProduct): Promise<MarketplaceProduct>;
    getMarketplaceProduct(id: number): Promise<MarketplaceProduct | undefined>;
    getMarketplaceProductsByBusiness(businessId: number): Promise<MarketplaceProduct[]>;
    searchMarketplaceProducts(filters: any): Promise<MarketplaceProduct[]>;
    updateMarketplaceProduct(id: number, updates: Partial<InsertMarketplaceProduct>): Promise<MarketplaceProduct | undefined>;
    deleteMarketplaceProduct(id: number): Promise<boolean>;

    createMarketplaceRfq(rfq: InsertMarketplaceRfq): Promise<MarketplaceRfq>;
    getMarketplaceRfq(id: number): Promise<MarketplaceRfq | undefined>;
    getMarketplaceRfqByNumber(rfqNumber: string): Promise<MarketplaceRfq | undefined>;
    getMarketplaceRfqsByBuyer(buyerWallet: string): Promise<MarketplaceRfq[]>;
    searchMarketplaceRfqs(filters: any): Promise<MarketplaceRfq[]>;
    updateMarketplaceRfq(id: number, updates: Partial<InsertMarketplaceRfq>): Promise<MarketplaceRfq | undefined>;

    createMarketplaceQuote(quote: InsertMarketplaceQuote): Promise<MarketplaceQuote>;
    getMarketplaceQuote(id: number): Promise<MarketplaceQuote | undefined>;
    getMarketplaceQuotesByRfq(rfqId: number): Promise<MarketplaceQuote[]>;
    getMarketplaceQuotesBySupplier(supplierWallet: string): Promise<MarketplaceQuote[]>;
    updateMarketplaceQuote(id: number, updates: Partial<InsertMarketplaceQuote>): Promise<MarketplaceQuote | undefined>;

    createMarketplaceReview(review: InsertMarketplaceReview): Promise<MarketplaceReview>;
    getMarketplaceReviewsByBusiness(businessWallet: string): Promise<MarketplaceReview[]>;
    getMarketplaceReviewsByReviewer(reviewerWallet: string): Promise<MarketplaceReview[]>;
    getAverageBusinessRating(businessWallet: string): Promise<{ rating: number; count: number }>;
    updateMarketplaceReview(id: number, updates: Partial<InsertMarketplaceReview>): Promise<MarketplaceReview | undefined>;

    createMarketplaceConnection(connection: InsertMarketplaceConnection): Promise<MarketplaceConnection>;
    getMarketplaceConnections(walletAddress: string): Promise<MarketplaceConnection[]>;
    getMarketplaceConnection(requesterWallet: string, targetWallet: string): Promise<MarketplaceConnection | undefined>;
    updateMarketplaceConnection(id: number, updates: Partial<InsertMarketplaceConnection>): Promise<MarketplaceConnection | undefined>;

    createTradeCorridor(corridor: InsertTradeCorridor): Promise<TradeCorridor>;
    getTradeCorridor(id: number): Promise<TradeCorridor | undefined>;
    getAllTradeCorridors(): Promise<TradeCorridor[]>;
    getTradeCorridorsByRegion(sourceRegion: string, destinationRegion: string): Promise<TradeCorridor[]>;
    updateTradeCorridor(id: number, updates: Partial<InsertTradeCorridor>): Promise<TradeCorridor | undefined>;

    // Hedge
    createHedgeEvent(event: InsertHedgeEvent): Promise<HedgeEvent>;
    getHedgeEvent(id: number): Promise<HedgeEvent | undefined>;
    getAllHedgeEvents(): Promise<HedgeEvent[]>;
    getOpenHedgeEvents(): Promise<HedgeEvent[]>;
    updateHedgeEvent(id: number, updates: Partial<HedgeEvent>): Promise<HedgeEvent | undefined>;

    createHedgePosition(position: InsertHedgePosition): Promise<HedgePosition>;
    getHedgePosition(id: number): Promise<HedgePosition | undefined>;
    getHedgePositionsByEvent(eventId: number): Promise<HedgePosition[]>;
    getHedgePositionsByWallet(wallet: string): Promise<HedgePosition[]>;
    updateHedgePosition(id: number, updates: Partial<HedgePosition>): Promise<HedgePosition | undefined>;

    createHedgeLpDeposit(deposit: InsertHedgeLpDeposit): Promise<HedgeLpDeposit>;
    getHedgeLpDeposit(id: number): Promise<HedgeLpDeposit | undefined>;
    getHedgeLpDepositsByEvent(eventId: number): Promise<HedgeLpDeposit[]>;
    getHedgeLpDepositsByWallet(wallet: string): Promise<HedgeLpDeposit[]>;
    updateHedgeLpDeposit(id: number, updates: Partial<HedgeLpDeposit>): Promise<HedgeLpDeposit | undefined>;

    // Financing
    createFinancingOffer(offer: InsertFinancingOffer): Promise<FinancingOffer>;
    getFinancingOffer(id: number): Promise<FinancingOffer | undefined>;
    getFinancingOfferByOfferId(offerId: string): Promise<FinancingOffer | undefined>;
    getFinancingOffersByRequest(requestId: string): Promise<FinancingOffer[]>;
    getFinancingOffersByFinancier(financierAddress: string): Promise<FinancingOffer[]>;
    updateFinancingOffer(id: number, updates: Partial<FinancingOffer>): Promise<FinancingOffer | undefined>;

    // Social
    getUserProfile(walletAddress: string): Promise<any>;
    createUserProfile(profile: any): Promise<any>;
    updateUserProfile(walletAddress: string, updates: any): Promise<any>;
    deleteUserProfile(walletAddress: string): Promise<boolean>;
    getContact(id: number): Promise<any>;
    getContactByAddress(ownerAddress: string, contactAddress: string): Promise<any>;
    updateContact(id: number, updates: any): Promise<any>;
    deleteContact(id: number): Promise<boolean>;
    getReferralCodesByWallet(walletAddress: string): Promise<any[]>;
    updateReferralCodeUses(code: string): Promise<any>;
    createReferral(referral: any): Promise<any>;
    getReferralsByWallet(walletAddress: string): Promise<any[]>;
    getAllReferrals(): Promise<any[]>;
    updateReferralStatus(id: number, status: string): Promise<any>;
    getAllUserPoints(): Promise<any[]>;
    createUserPoints(points: any): Promise<any>;
}
