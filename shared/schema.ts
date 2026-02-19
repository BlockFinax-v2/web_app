/**
 * Database Schema Definitions
 * 
 * Defines all database tables, types, and validation schemas
 * for the blockchain communication platform.
 */

import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import profile and referral schemas
export * from "./profile-schema";
export * from "./referral-schema";

// Wallet management table - stores encrypted wallet data
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  encryptedMnemonic: text("encrypted_mnemonic"),
  isImported: boolean("is_imported").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blockchain network configurations
export const networks = pgTable("networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chainId: integer("chain_id").notNull().unique(),
  rpcUrl: text("rpc_url").notNull(),
  symbol: text("symbol").notNull(),
  blockExplorerUrl: text("block_explorer_url"),
  isTestnet: boolean("is_testnet").default(true),
  usdcContractAddress: text("usdc_contract_address"),
});

// Transaction history tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  hash: text("hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  value: decimal("value", { precision: 78, scale: 18 }).notNull(),
  gasPrice: decimal("gas_price", { precision: 78, scale: 0 }),
  gasUsed: decimal("gas_used", { precision: 78, scale: 0 }),
  status: text("status").notNull(), // pending, confirmed, failed
  blockNumber: integer("block_number"),
  networkId: integer("network_id").references(() => networks.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Wallet balance tracking across networks
export const balances = pgTable("balances", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  networkId: integer("network_id").references(() => networks.id),
  balance: decimal("balance", { precision: 78, scale: 18 }).notNull(),
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Wallet-to-wallet messaging system
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  content: text("content").notNull(),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  attachmentSize: integer("attachment_size"),
  attachmentData: text("attachment_data"),
  read: boolean("read").default(false),
  delivered: boolean("delivered").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Contact management and address book
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  ownerWalletAddress: text("owner_wallet_address").notNull(),
  contactWalletAddress: text("contact_wallet_address").notNull(),
  contactName: text("contact_name").notNull(),
  notes: text("notes"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Escrow smart contracts registry
export const escrowContracts = pgTable("escrow_contracts", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(),
  deployer: text("deployer").notNull(),
  networkId: integer("network_id").references(() => networks.id),
  abiVersion: text("abi_version").notNull(),
  deploymentTxHash: text("deployment_tx_hash").notNull(),
  isActive: boolean("is_active").default(true),
  auditLink: text("audit_link"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sub-wallets for contract-specific escrow accounts
export const subWallets = pgTable("sub_wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  name: text("name").notNull(), // Human-readable name based on contract
  mainWalletAddress: text("main_wallet_address").notNull(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  contractId: text("contract_id"), // Links to specific contract
  purpose: text("purpose").notNull(), // escrow, trade_finance, etc.
  isActive: boolean("is_active").default(true),
  contractSigned: boolean("contract_signed").default(false), // Track if contract is signed
  signedAt: timestamp("signed_at"), // When contract was signed
  contractRole: text("contract_role"), // party, arbitrator
  createdAt: timestamp("created_at").defaultNow(),
});

// Sub-wallet invitations for party confirmation
export const subWalletInvitations = pgTable("sub_wallet_invitations", {
  id: serial("id").primaryKey(),
  inviterAddress: text("inviter_address").notNull(),
  inviteeAddress: text("invitee_address").notNull(),
  contractType: text("contract_type").notNull(), // trade_finance, escrow, etc.
  contractDetails: text("contract_details").notNull(), // JSON string
  status: text("status").notNull(), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Individual escrow instances
export const escrows = pgTable("escrows", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull(),
  escrowId: text("escrow_id").notNull(), // on-chain escrow ID
  exporter: text("exporter").notNull(), // wallet address
  importer: text("importer").notNull(), // wallet address
  financier: text("financier"), // optional wallet address
  exporterSubWallet: text("exporter_sub_wallet"), // dedicated sub-wallet for exporter
  importerSubWallet: text("importer_sub_wallet"), // dedicated sub-wallet for importer
  amount: decimal("amount", { precision: 78, scale: 18 }).notNull(),
  tokenAddress: text("token_address").notNull(), // ERC20 token or ETH
  tokenSymbol: text("token_symbol").notNull(),
  status: text("status").notNull(), // created, funded, released, expired, disputed
  expiryDate: timestamp("expiry_date"),
  networkId: integer("network_id").references(() => networks.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User role management
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // exporter, importer, financier, admin
  kycStatus: text("kyc_status").default("pending"), // pending, approved, failed
  kycDocuments: text("kyc_documents"), // JSON string of document links
  lastActivity: timestamp("last_activity").defaultNow(),
  referralSource: text("referral_source"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// On-chain event logs
export const eventLogs = pgTable("event_logs", {
  id: serial("id").primaryKey(),
  transactionHash: text("transaction_hash").notNull(),
  contractAddress: text("contract_address").notNull(),
  eventName: text("event_name").notNull(), // EscrowCreated, FundsDeposited, EscrowReleased, etc.
  blockNumber: integer("block_number").notNull(),
  logIndex: integer("log_index").notNull(),
  eventData: text("event_data").notNull(), // JSON string of event parameters
  networkId: integer("network_id").references(() => networks.id),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Token registry for monitoring
export const tokenRegistry = pgTable("token_registry", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  decimals: integer("decimals").notNull(),
  networkId: integer("network_id").references(() => networks.id),
  isActive: boolean("is_active").default(true),
  totalValueLocked: decimal("total_value_locked", { precision: 78, scale: 18 }).default("0"),
  priceUsd: decimal("price_usd", { precision: 10, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    uniqueTokenPerNetwork: unique().on(table.address, table.networkId),
  };
});

// Validation schemas for database operations
export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertNetworkSchema = createInsertSchema(networks).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertBalanceSchema = createInsertSchema(balances).omit({
  id: true,
  lastUpdated: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscrowContractSchema = createInsertSchema(escrowContracts).omit({
  id: true,
  createdAt: true,
});

export const insertEscrowSchema = createInsertSchema(escrows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export const insertEventLogSchema = createInsertSchema(eventLogs).omit({
  id: true,
  timestamp: true,
});

export const insertTokenRegistrySchema = createInsertSchema(tokenRegistry).omit({
  id: true,
  createdAt: true,
});

export const insertSubWalletSchema = createInsertSchema(subWallets).omit({
  id: true,
  createdAt: true,
});

export const insertSubWalletInvitationSchema = createInsertSchema(subWalletInvitations).omit({
  id: true,
  createdAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertNetwork = z.infer<typeof insertNetworkSchema>;
export type Network = typeof networks.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertBalance = z.infer<typeof insertBalanceSchema>;
export type Balance = typeof balances.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertEscrowContract = z.infer<typeof insertEscrowContractSchema>;
export type EscrowContract = typeof escrowContracts.$inferSelect;
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type Escrow = typeof escrows.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;
export type InsertTokenRegistry = z.infer<typeof insertTokenRegistrySchema>;
export type TokenRegistry = typeof tokenRegistry.$inferSelect;
export type InsertSubWallet = z.infer<typeof insertSubWalletSchema>;
export type SubWallet = typeof subWallets.$inferSelect;
export type InsertSubWalletInvitation = z.infer<typeof insertSubWalletInvitationSchema>;
export type SubWalletInvitation = typeof subWalletInvitations.$inferSelect;

// Contract drafting and signing system
export const contractDrafts = pgTable("contract_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  contractType: text("contract_type").notNull(), // escrow, trade_finance, service, etc.
  creatorAddress: text("creator_address").notNull(),
  partnerAddress: text("partner_address").notNull(),
  totalValue: decimal("total_value", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull(),
  terms: text("terms"), // Legacy field - replaced by deliverables table
  status: text("status").notNull().default("draft"), // draft, sent, signed, active, completed, cancelled
  subWalletAddress: text("sub_wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract supporting documents
export const contractDocuments = pgTable("contract_documents", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // application/pdf, image/png, etc.
  fileSize: integer("file_size").notNull(), // in bytes
  fileData: text("file_data").notNull(), // base64 encoded file content
  uploadedBy: text("uploaded_by").notNull(), // wallet address
  description: text("description"), // optional description of the document
  documentType: text("document_type").notNull(), // contract_template, legal_document, specification, proof_of_work, etc.
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Contract signatures for wallet-based signing
export const contractSignatures = pgTable("contract_signatures", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  signerAddress: text("signer_address").notNull(),
  signature: text("signature").notNull(), // Wallet signature
  signedAt: timestamp("signed_at").defaultNow(),
  role: text("role").notNull(), // creator, partner, witness
});

// Contract deliverables and milestones
export const contractDeliverables = pgTable("contract_deliverables", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contractDrafts.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: decimal("value", { precision: 78, scale: 18 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // pending, claimed, verified, completed, disputed
  claimedBy: text("claimed_by"), // wallet address
  claimedAt: timestamp("claimed_at"),
  verifiedBy: text("verified_by"), // wallet address
  verifiedAt: timestamp("verified_at"),
  evidence: text("evidence"), // JSON string with proof/documents
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract verification and disputes
export const contractVerifications = pgTable("contract_verifications", {
  id: serial("id").primaryKey(),
  deliverableId: integer("deliverable_id").references(() => contractDeliverables.id).notNull(),
  verifierAddress: text("verifier_address").notNull(),
  status: text("status").notNull(), // approved, rejected, disputed
  signature: text("signature").notNull(), // Wallet signature for verification
  comments: text("comments"),
  evidence: text("evidence"), // JSON string with verification proof
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for contract system
export const insertContractDraftSchema = createInsertSchema(contractDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSignatureSchema = createInsertSchema(contractSignatures).omit({
  id: true,
  signedAt: true,
});

export const insertContractDeliverableSchema = createInsertSchema(contractDeliverables).omit({
  id: true,
  createdAt: true,
});

export const insertContractVerificationSchema = createInsertSchema(contractVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertContractDocumentSchema = createInsertSchema(contractDocuments).omit({
  id: true,
  uploadedAt: true,
});

// Types for contract system
export type InsertContractDraft = z.infer<typeof insertContractDraftSchema>;
export type ContractDraft = typeof contractDrafts.$inferSelect;
export type InsertContractSignature = z.infer<typeof insertContractSignatureSchema>;
export type ContractSignature = typeof contractSignatures.$inferSelect;
export type InsertContractDeliverable = z.infer<typeof insertContractDeliverableSchema>;
export type ContractDeliverable = typeof contractDeliverables.$inferSelect;
export type InsertContractVerification = z.infer<typeof insertContractVerificationSchema>;
export type ContractVerification = typeof contractVerifications.$inferSelect;
export type InsertContractDocument = z.infer<typeof insertContractDocumentSchema>;
export type ContractDocument = typeof contractDocuments.$inferSelect;

// Invoice management system
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  senderAddress: text("sender_address").notNull(),
  recipientAddress: text("recipient_address").notNull(),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  title: text("title").notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, viewed, paid, overdue, cancelled
  paymentAddress: text("payment_address"), // Sub-wallet for payment collection
  paymentTxHash: text("payment_tx_hash"), // Transaction hash when paid
  paidAt: timestamp("paid_at"),
  paidAmount: decimal("paid_amount", { precision: 78, scale: 18 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"), // Percentage
  taxAmount: decimal("tax_amount", { precision: 78, scale: 18 }).default("0"),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 78, scale: 18 }).default("0"),
  subtotal: decimal("subtotal", { precision: 78, scale: 18 }).notNull(),
  notes: text("notes"),
  terms: text("terms"),
  isRecurring: boolean("is_recurring").default(false),
  recurringInterval: text("recurring_interval"), // monthly, quarterly, yearly
  nextInvoiceDate: timestamp("next_invoice_date"),
  templateId: text("template_id"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice line items for detailed billing
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 78, scale: 18 }).notNull(),
  totalPrice: decimal("total_price", { precision: 78, scale: 18 }).notNull(),
  category: text("category"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Invoice templates for reusable invoice structures
export const invoiceTemplates = pgTable("invoice_templates", {
  id: serial("id").primaryKey(),
  creatorAddress: text("creator_address").notNull(),
  templateName: text("template_name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  currency: text("currency").notNull().default("USDC"),
  defaultDueDays: integer("default_due_days").default(30),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  terms: text("terms"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  items: text("items"), // JSON string of default items
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice payment tracking and reminders
export const invoicePayments = pgTable("invoice_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  paymentAmount: decimal("payment_amount", { precision: 78, scale: 18 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // crypto, bank_transfer, card
  transactionHash: text("transaction_hash"),
  paymentAddress: text("payment_address"),
  blockNumber: integer("block_number"),
  paymentStatus: text("payment_status").notNull(), // pending, confirmed, failed
  paidBy: text("paid_by"), // Payer address
  paymentDate: timestamp("payment_date").defaultNow(),
  gasUsed: decimal("gas_used", { precision: 78, scale: 0 }),
  notes: text("notes"),
});

// Invoice notifications and reminders
export const invoiceNotifications = pgTable("invoice_notifications", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  notificationType: text("notification_type").notNull(), // sent, viewed, reminder, overdue
  recipientAddress: text("recipient_address").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveryStatus: text("delivery_status").default("sent"), // sent, delivered, failed
  reminderCount: integer("reminder_count").default(0),
  nextReminderAt: timestamp("next_reminder_at"),
});

// Insert schemas for invoice system
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments).omit({
  id: true,
  paymentDate: true,
});

export const insertInvoiceNotificationSchema = createInsertSchema(invoiceNotifications).omit({
  id: true,
  sentAt: true,
});

// Types for invoice system
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InsertInvoiceNotification = z.infer<typeof insertInvoiceNotificationSchema>;
export type InvoiceNotification = typeof invoiceNotifications.$inferSelect;

// Notifications system for milestone and contract updates
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientAddress: text("recipient_address").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // milestone_due, milestone_completed, contract_signed, verification_required, funds_released
  relatedId: integer("related_id"), // Contract ID, deliverable ID, etc.
  relatedType: text("related_type"), // contract, deliverable, verification
  actionRequired: boolean("action_required").default(false),
  actionUrl: text("action_url"), // Frontend route for action
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Wallet-to-wallet call logs for voice/video calling
export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  callerAddress: text("caller_address").notNull(),
  receiverAddress: text("receiver_address").notNull(),
  callType: text("call_type").notNull(), // voice, video
  status: text("status").notNull(), // initiated, ringing, answered, ended, missed, rejected, failed
  duration: integer("duration").default(0), // call duration in seconds
  startedAt: timestamp("started_at", { mode: 'string' }),
  endedAt: timestamp("ended_at", { mode: 'string' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type CallLog = typeof callLogs.$inferSelect;

// Trade Finance - Liquidity Pool Stakes (LP providers)
export const liquidityPoolStakes = pgTable("liquidity_pool_stakes", {
  id: serial("id").primaryKey(),
  stakerAddress: text("staker_address").notNull(),
  tokenAddress: text("token_address").notNull(), // Token being staked
  tokenSymbol: text("token_symbol").notNull(),
  amount: decimal("amount", { precision: 78, scale: 18 }).notNull(), // Amount staked
  networkId: integer("network_id").references(() => networks.id),
  status: text("status").notNull().default("active"), // active, withdrawn
  votingPower: decimal("voting_power", { precision: 78, scale: 18 }).notNull(), // Proportional voting power
  rewardsEarned: decimal("rewards_earned", { precision: 78, scale: 18 }).default("0"), // Accumulated rewards
  transactionHash: text("transaction_hash"), // Stake transaction hash
  stakedAt: timestamp("staked_at").defaultNow(),
  withdrawnAt: timestamp("withdrawn_at"),
});

// Trade Finance Requests (Buyers requesting financing)
export const tradeFinanceRequests = pgTable("trade_finance_requests", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().unique(), // Unique request identifier
  buyerAddress: text("buyer_address").notNull(), // Buyer/importer wallet
  sellerAddress: text("seller_address").notNull(), // Seller/exporter wallet
  buyerStake: decimal("buyer_stake", { precision: 78, scale: 18 }).default("0"), // Buyer's stake in pool (optional)
  requestedAmount: decimal("requested_amount", { precision: 78, scale: 18 }).notNull(), // Finance amount requested
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  networkId: integer("network_id").references(() => networks.id),
  
  // Financing type
  financingType: text("financing_type").notNull().default("letter_of_credit"), // Type of trade finance instrument requested

  // Trade details
  tradeDescription: text("trade_description").notNull(), // What goods/services
  tradeValue: decimal("trade_value", { precision: 78, scale: 18 }), // Total trade value (optional)
  collateralDescription: text("collateral_description").notNull(), // Collateral details
  collateralValue: decimal("collateral_value", { precision: 78, scale: 18 }), // Collateral value (optional)
  
  // Customer Identity Details (for buyer/importer)
  buyerCompanyName: text("buyer_company_name"),
  buyerRegistrationNumber: text("buyer_registration_number"),
  buyerCountry: text("buyer_country"),
  buyerContactPerson: text("buyer_contact_person"),
  buyerEmail: text("buyer_email"),
  buyerPhone: text("buyer_phone"),
  
  // Sales Contract Reference
  salesContractNumber: text("sales_contract_number"),
  salesContractDate: timestamp("sales_contract_date"),
  
  // Timeline
  requestedDuration: integer("requested_duration").notNull(), // Days of financing
  paymentDueDate: timestamp("payment_due_date").notNull(),
  
  // Multi-step workflow status
  status: text("status").notNull().default("pending_draft"), // pending_draft, draft_sent_to_seller, seller_approved, seller_rejected, awaiting_fee_payment, fee_paid, approved, rejected, cancelled
  
  // Invoice and draft tracking
  invoiceDocumentId: integer("invoice_document_id"), // Reference to uploaded invoice
  draftCertificateId: integer("draft_certificate_id"), // Reference to draft guarantee
  finalCertificateId: integer("final_certificate_id"), // Reference to final guarantee
  
  // Fee tracking (1% issuance fee)
  feeDue: decimal("fee_due", { precision: 78, scale: 18 }), // 1% of guarantee amount
  feePaidAt: timestamp("fee_paid_at"),
  feeTxHash: text("fee_tx_hash"), // On-chain payment transaction
  
  // Seller approval tracking
  sellerApprovedAt: timestamp("seller_approved_at"),
  sellerRejectedAt: timestamp("seller_rejected_at"),
  sellerRejectionReason: text("seller_rejection_reason"),
  draftSentAt: timestamp("draft_sent_at"),
  
  // Voting (deprecated for MVP - replaced by multi-step approval)
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  totalVotingPower: decimal("total_voting_power", { precision: 78, scale: 18 }).default("0"),
  votingDeadline: timestamp("voting_deadline"),
  
  // Performance bond (optional)
  requiresPerformanceBond: boolean("requires_performance_bond").default(false),
  performanceBondAmount: decimal("performance_bond_amount", { precision: 78, scale: 18 }),
  performanceBondStatus: text("performance_bond_status"), // pending, locked, released, forfeited
  
  // Smart contract
  contractAddress: text("contract_address"), // Deployed guarantee contract
  guaranteeTransactionHash: text("guarantee_transaction_hash"), // Pool guarantee tx
  
  // 80% Guarantee Coverage (Treasury guarantees 80%, seller bears 20% risk)
  guaranteePercentage: decimal("guarantee_percentage", { precision: 5, scale: 2 }).notNull().default("80.00"), // 80%
  guaranteeCoverageAmount: decimal("guarantee_coverage_amount", { precision: 78, scale: 18 }), // 80% of invoice value
  sellerRiskAmount: decimal("seller_risk_amount", { precision: 78, scale: 18 }), // 20% seller bears
  
  // Trade Lifecycle Status
  tradeLifecycleStatus: text("trade_lifecycle_status").default("guarantee_issued"), // guarantee_issued, payment_uploaded, payment_confirmed, bol_uploaded, bol_in_treasury_custody, goods_in_transit, goods_delivered, trade_complete, default_claimed
  
  // Buyer Payment Tracking
  buyerPaymentUploaded: boolean("buyer_payment_uploaded").default(false),
  buyerPaymentTxHash: text("buyer_payment_tx_hash"),
  buyerPaymentAmount: decimal("buyer_payment_amount", { precision: 78, scale: 18 }),
  totalAmountPaid: decimal("total_amount_paid", { precision: 78, scale: 18 }).default("0"),
  buyerPaymentUploadedAt: timestamp("buyer_payment_uploaded_at"),
  
  // Seller Payment Confirmation
  sellerPaymentConfirmed: boolean("seller_payment_confirmed").default(false),
  sellerPaymentConfirmedAt: timestamp("seller_payment_confirmed_at"),
  
  // Bill of Lading Custody (Treasury holds BoL as collateral)
  bolUploadedToTreasury: boolean("bol_uploaded_to_treasury").default(false),
  bolCustodian: text("bol_custodian"), // 'seller', 'treasury', 'buyer', 'liquidation_buyer'
  bolTransferredToTreasuryAt: timestamp("bol_transferred_to_treasury_at"),
  bolReleasedToBuyerAt: timestamp("bol_released_to_buyer_at"),
  
  // Buyer Delivery Confirmation
  buyerConfirmedDelivery: boolean("buyer_confirmed_delivery").default(false),
  buyerDeliveryConfirmedAt: timestamp("buyer_delivery_confirmed_at"),
  deliveryCondition: text("delivery_condition"), // 'excellent', 'good', 'damaged'
  
  // Buyer Dispute (filed before confirming delivery)
  buyerDisputed: boolean("buyer_disputed").default(false),
  buyerDisputeReason: text("buyer_dispute_reason"),
  buyerDisputeNote: text("buyer_dispute_note"),
  disputedAt: timestamp("disputed_at"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  // Liquidation (if buyer defaults and treasury sells goods)
  liquidationRequired: boolean("liquidation_required").default(false),
  liquidationBuyerAddress: text("liquidation_buyer_address"),
  liquidationSaleAmount: decimal("liquidation_sale_amount", { precision: 78, scale: 18 }),
  liquidationCompletedAt: timestamp("liquidation_completed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
});

// Trade Finance Votes (LP providers voting on requests)
export const tradeFinanceVotes = pgTable("trade_finance_votes", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  voterAddress: text("voter_address").notNull(), // LP provider
  stakeId: integer("stake_id").references(() => liquidityPoolStakes.id), // Their stake record
  vote: text("vote").notNull(), // approve, reject
  votingPower: decimal("voting_power", { precision: 78, scale: 18 }).notNull(), // Power used in this vote
  comment: text("comment"), // Optional vote reasoning
  votedAt: timestamp("voted_at").defaultNow(),
}, (table) => {
  return {
    uniqueVotePerRequest: unique().on(table.requestId, table.voterAddress),
  };
});

// Performance Bonds (Seller's commitment)
export const performanceBonds = pgTable("performance_bonds", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  sellerAddress: text("seller_address").notNull(),
  bondAmount: decimal("bond_amount", { precision: 78, scale: 18 }).notNull(),
  tokenAddress: text("token_address").notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  status: text("status").notNull().default("pending"), // pending, locked, released, forfeited
  contractAddress: text("contract_address"), // Smart contract holding bond
  lockTransactionHash: text("lock_transaction_hash"),
  releaseTransactionHash: text("release_transaction_hash"),
  lockedAt: timestamp("locked_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collateral (Goods being financed)
export const tradeCollateral = pgTable("trade_collateral", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  collateralType: text("collateral_type").notNull(), // goods, documents, title, etc.
  description: text("description").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 78, scale: 18 }).notNull(),
  verificationMethod: text("verification_method"), // inspection, documents, third_party
  verificationStatus: text("verification_status").default("pending"), // pending, verified, rejected
  verifiedBy: text("verified_by"), // Verifier wallet address
  documentHashes: text("document_hashes"), // JSON array of IPFS/document hashes
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertLiquidityPoolStakeSchema = createInsertSchema(liquidityPoolStakes).omit({
  id: true,
  stakedAt: true,
});

export const insertTradeFinanceRequestSchema = createInsertSchema(tradeFinanceRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  // requestId is required because backend always generates it before validation
  requestId: z.string(),
  // Make these fields optional since they may not be provided
  tradeValue: z.string().optional(),
  collateralValue: z.string().optional(),
  buyerStake: z.string().optional(),
  // Accept ISO date strings and convert to Date objects
  salesContractDate: z.union([z.string(), z.date()]).optional().transform(val => 
    val ? (typeof val === 'string' ? new Date(val) : val) : undefined
  ),
  paymentDueDate: z.union([z.string(), z.date()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
});

export const insertTradeFinanceVoteSchema = createInsertSchema(tradeFinanceVotes).omit({
  id: true,
  votedAt: true,
});

export const insertPerformanceBondSchema = createInsertSchema(performanceBonds).omit({
  id: true,
  createdAt: true,
});

export const insertTradeCollateralSchema = createInsertSchema(tradeCollateral).omit({
  id: true,
  createdAt: true,
});

// Trade Finance Documents (Invoice uploads and supporting documents)
export const tradeFinanceDocuments = pgTable("trade_finance_documents", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").references(() => tradeFinanceRequests.requestId),
  
  documentType: text("document_type").notNull(), // invoice, bill_of_lading, customs, quality_cert, etc.
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  mimeType: text("mime_type").notNull(),
  
  // Storage (base64 for MVP, can be upgraded to S3/IPFS later)
  storageType: text("storage_type").notNull().default("base64"), // base64, ipfs, s3
  storageKey: text("storage_key").notNull(), // base64 string or IPFS hash or S3 key
  
  // Metadata
  uploadedBy: text("uploaded_by").notNull(), // Wallet address
  documentHash: text("document_hash"), // SHA-256 hash for verification
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Trade Finance Certificates (Draft and Final Certificates)
export const tradeFinanceCertificates = pgTable("trade_finance_certificates", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  
  certificateType: text("certificate_type").notNull(), // draft, final
  version: integer("version").notNull().default(1), // Version number for revisions
  
  // Certificate content (Markdown format following ICC URDG 758 / SWIFT MT 710)
  content: text("content").notNull(), // Full certificate in Markdown
  
  // Metadata
  createdBy: text("created_by").notNull(), // Treasury admin wallet
  createdByRole: text("created_by_role").notNull().default("treasury"), // treasury, system
  
  // Versioning
  supersededBy: integer("superseded_by"), // ID of newer version that replaced this
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports
export type InsertLiquidityPoolStake = z.infer<typeof insertLiquidityPoolStakeSchema>;
export type LiquidityPoolStake = typeof liquidityPoolStakes.$inferSelect;
export type InsertTradeFinanceRequest = z.infer<typeof insertTradeFinanceRequestSchema>;
export type TradeFinanceRequest = typeof tradeFinanceRequests.$inferSelect;
export type InsertTradeFinanceVote = z.infer<typeof insertTradeFinanceVoteSchema>;
export type TradeFinanceVote = typeof tradeFinanceVotes.$inferSelect;
export type InsertPerformanceBond = z.infer<typeof insertPerformanceBondSchema>;
export type PerformanceBond = typeof performanceBonds.$inferSelect;
export type InsertTradeCollateral = z.infer<typeof insertTradeCollateralSchema>;
export type TradeCollateral = typeof tradeCollateral.$inferSelect;

// Trade Finance - Delivery Proofs (Proof of shipment/delivery)
export const deliveryProofs = pgTable("delivery_proofs", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  sellerAddress: text("seller_address").notNull(), // Who submitted proof
  
  // Shipping details
  billOfLadingHash: text("bill_of_lading_hash"), // Document hash/IPFS
  billOfLadingNumber: text("bill_of_lading_number"), // Tracking number
  trackingNumber: text("tracking_number"),
  logisticsProvider: text("logistics_provider"), // DHL, Maersk, etc.
  
  // Delivery confirmation
  deliveryDate: timestamp("delivery_date"),
  deliveryAddress: text("delivery_address"),
  receivedBy: text("received_by"), // Buyer's signature/confirmation
  
  // Supporting documents
  inspectionReportHash: text("inspection_report_hash"),
  photoHashes: text("photo_hashes"), // JSON array of photo IPFS hashes
  customsDocumentHash: text("customs_document_hash"),
  qualityCertificateHash: text("quality_certificate_hash"),
  
  // Verification
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, verified, disputed, rejected
  verifiedBy: text("verified_by"), // Verifier wallet address or buyer address
  verifierNotes: text("verifier_notes"),
  verifiedAt: timestamp("verified_at"),
  
  // Buyer dispute
  disputeReason: text("dispute_reason"),
  disputeEvidence: text("dispute_evidence"), // JSON with dispute docs
  disputedAt: timestamp("disputed_at"),
  
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Trade Finance - Goods Collateral Details (Detailed goods tracking)
export const goodsCollateral = pgTable("goods_collateral", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  
  // Goods description
  goodsType: text("goods_type"), // sugar, electronics, textiles, etc. (optional for MVP)
  goodsDescription: text("goods_description").notNull(),
  quantity: decimal("quantity", { precision: 18, scale: 2 }), // optional for MVP
  unit: text("unit"), // tons, pieces, containers, etc. (optional for MVP)
  
  // Valuation
  unitPrice: decimal("unit_price", { precision: 78, scale: 18 }), // optional for MVP
  totalValue: decimal("total_value", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  marketPrice: decimal("market_price", { precision: 78, scale: 18 }), // Current market price
  overCollateralizationRatio: decimal("over_collateralization_ratio", { precision: 5, scale: 2 }).default("110"), // e.g., 110% = 1.1x
  
  // Inspection & Quality
  inspectionRequired: boolean("inspection_required").default(true),
  inspectorAddress: text("inspector_address"), // Third-party inspector
  inspectionReportHash: text("inspection_report_hash"),
  qualityGrade: text("quality_grade"), // A, B, C or specific grading
  inspectionStatus: text("inspection_status").default("pending"), // pending, passed, failed
  inspectedAt: timestamp("inspected_at"),
  
  // Insurance
  insuranceRequired: boolean("insurance_required").default(true),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceCoverage: decimal("insurance_coverage", { precision: 78, scale: 18 }),
  insuranceDocumentHash: text("insurance_document_hash"),
  
  // Storage & Logistics
  storageLocation: text("storage_location"), // Warehouse, port, etc.
  warehouseReceiptHash: text("warehouse_receipt_hash"),
  storageProvider: text("storage_provider"),
  expectedShipmentDate: timestamp("expected_shipment_date"),
  actualShipmentDate: timestamp("actual_shipment_date"),
  
  // Bill of Lading (Title Document) - Treasury holds as collateral
  billOfLadingIssued: boolean("bill_of_lading_issued").default(false),
  billOfLadingNumber: text("bill_of_lading_number"),
  billOfLadingHash: text("bill_of_lading_hash"), // Document hash for verification
  billOfLadingDocumentId: integer("bill_of_lading_document_id"), // Reference to uploaded document
  billOfLadingNFT: text("bill_of_lading_nft"), // NFT contract address if tokenized
  bolIssuedAt: timestamp("bol_issued_at"),
  
  // Shipment Tracking Details (for buyer verification)
  trackingNumber: text("tracking_number"), // Shipment tracking number (e.g., TRACK123456789)
  logisticsProvider: text("logistics_provider"), // Logistics/shipping company (e.g., Maersk, DHL)
  
  // BoL Custody Control (CRITICAL for collateral protection)
  bolCustodian: text("bol_custodian").default("seller"), // 'seller', 'treasury', 'buyer', 'liquidation_buyer'
  bolCustodyTransferHistory: text("bol_custody_transfer_history"), // JSON: [{from, to, timestamp, reason}]
  bolUploadedBy: text("bol_uploaded_by"), // Seller wallet address
  bolUploadedAt: timestamp("bol_uploaded_at"),
  treasuryReceivedBolAt: timestamp("treasury_received_bol_at"),
  buyerReceivedBolAt: timestamp("buyer_received_bol_at"),
  
  // Custody Requirements
  bolCustodyRequired: boolean("bol_custody_required").default(true), // Must be uploaded to treasury
  bolCustodyStatus: text("bol_custody_status").default("pending"), // pending, with_treasury, released_to_buyer, transferred_to_liquidation_buyer
  
  // Liquidation readiness
  preLiquidationBuyers: text("pre_liquidation_buyers"), // JSON array of potential buyers
  liquidationPartner: text("liquidation_partner"), // Broker/trader for quick sale
  estimatedLiquidationValue: decimal("estimated_liquidation_value", { precision: 78, scale: 18 }),
  
  // Escrow Integration (Optional milestone-based payments)
  paymentType: text("payment_type").notNull().default("single"), // single, milestone
  escrowId: text("escrow_id"), // Links to on-chain escrow contract ID
  arbitratorAddress: text("arbitrator_address"), // Dispute arbitrator for milestone payments
  milestones: text("milestones"), // JSON array: [{title, amount, dueDate, status, completedAt}]
  escrowStatus: text("escrow_status"), // pending, active, completed, disputed
  
  status: text("status").notNull().default("pending"), // pending, verified, in_transit, delivered, liquidated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trade Finance - Seller Claims (When buyer defaults)
export const guaranteeClaims = pgTable("guarantee_claims", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  claimantAddress: text("claimant_address").notNull(), // Seller claiming payment
  
  // Claim details
  claimAmount: decimal("claim_amount", { precision: 78, scale: 18 }).notNull(),
  claimReason: text("claim_reason").notNull(), // buyer_default, payment_overdue, etc.
  
  // Evidence
  deliveryProofId: integer("delivery_proof_id").references(() => deliveryProofs.id),
  supportingDocuments: text("supporting_documents"), // JSON array of document hashes
  
  // Review & Approval
  status: text("status").notNull().default("pending"), // pending, under_review, approved, rejected, paid
  reviewedBy: text("reviewed_by"), // Governance voter or admin
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  // Payment
  approvedAmount: decimal("approved_amount", { precision: 78, scale: 18 }),
  paymentTransactionHash: text("payment_transaction_hash"),
  paidAmount: decimal("paid_amount", { precision: 78, scale: 18 }),
  paidAt: timestamp("paid_at"),
  
  // Dispute
  buyerDisputed: boolean("buyer_disputed").default(false),
  buyerDisputeReason: text("buyer_dispute_reason"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  claimedAt: timestamp("claimed_at").defaultNow(),
  
  // Voting period for claims (72 hours)
  votingStartedAt: timestamp("voting_started_at"),
  votingEndsAt: timestamp("voting_ends_at"),
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
});

// Trade Finance - Claim Votes (Treasury voting on claims)
export const claimVotes = pgTable("claim_votes", {
  id: serial("id").primaryKey(),
  claimId: integer("claim_id").notNull().references(() => guaranteeClaims.id),
  voterAddress: text("voter_address").notNull(), // Treasury staker
  stakeId: integer("stake_id").references(() => liquidityPoolStakes.id), // Their stake record
  vote: text("vote").notNull(), // approve, reject
  votingPower: decimal("voting_power", { precision: 78, scale: 18 }).notNull(), // Power used in this vote
  comment: text("comment"), // Optional vote reasoning
  votedAt: timestamp("voted_at").defaultNow(),
}, (table) => {
  return {
    uniqueVotePerClaim: unique().on(table.claimId, table.voterAddress),
  };
});

// Trade Finance - Issuance Fees Tracking
export const guaranteeIssuanceFees = pgTable("guarantee_issuance_fees", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  
  // Fee structure
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull(), // e.g., 1.5%
  feeAmount: decimal("fee_amount", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  
  // Payment
  payerAddress: text("payer_address").notNull(), // Buyer pays fee
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, refunded
  paymentTransactionHash: text("payment_transaction_hash"),
  paidAt: timestamp("paid_at"),
  
  // Distribution
  distributionStatus: text("distribution_status").default("pending"), // pending, distributed
  stakersShare: decimal("stakers_share", { precision: 78, scale: 18 }), // 70-80% to stakers
  treasuryShare: decimal("treasury_share", { precision: 78, scale: 18 }), // 20-30% to treasury
  distributedAt: timestamp("distributed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for Trade Finance Documents & Certificates
export const insertTradeFinanceDocumentSchema = createInsertSchema(tradeFinanceDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertTradeFinanceCertificateSchema = createInsertSchema(tradeFinanceCertificates).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for Trade Finance
export const insertDeliveryProofSchema = createInsertSchema(deliveryProofs).omit({
  id: true,
  submittedAt: true,
});

export const insertGoodsCollateralSchema = createInsertSchema(goodsCollateral).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuaranteeClaimSchema = createInsertSchema(guaranteeClaims).omit({
  id: true,
  claimedAt: true,
});

export const insertClaimVoteSchema = createInsertSchema(claimVotes).omit({
  id: true,
  votedAt: true,
});

export const insertGuaranteeIssuanceFeeSchema = createInsertSchema(guaranteeIssuanceFees).omit({
  id: true,
  createdAt: true,
});

// Type exports for Trade Finance Documents & Certificates
export type InsertTradeFinanceDocument = z.infer<typeof insertTradeFinanceDocumentSchema>;
export type TradeFinanceDocument = typeof tradeFinanceDocuments.$inferSelect;
export type InsertTradeFinanceCertificate = z.infer<typeof insertTradeFinanceCertificateSchema>;
export type TradeFinanceCertificate = typeof tradeFinanceCertificates.$inferSelect;

// Type exports for Trade Finance
export type InsertDeliveryProof = z.infer<typeof insertDeliveryProofSchema>;
export type DeliveryProof = typeof deliveryProofs.$inferSelect;
export type InsertGoodsCollateral = z.infer<typeof insertGoodsCollateralSchema>;
export type GoodsCollateral = typeof goodsCollateral.$inferSelect;
export type InsertGuaranteeClaim = z.infer<typeof insertGuaranteeClaimSchema>;
export type GuaranteeClaim = typeof guaranteeClaims.$inferSelect;
export type InsertClaimVote = z.infer<typeof insertClaimVoteSchema>;
export type ClaimVote = typeof claimVotes.$inferSelect;
export type InsertGuaranteeIssuanceFee = z.infer<typeof insertGuaranteeIssuanceFeeSchema>;
export type GuaranteeIssuanceFee = typeof guaranteeIssuanceFees.$inferSelect;

// Fee Distribution System - Individual staker earnings tracking
export const feeDistributions = pgTable("fee_distributions", {
  id: serial("id").primaryKey(),
  issuanceFeeId: integer("issuance_fee_id").references(() => guaranteeIssuanceFees.id).notNull(),
  stakerAddress: text("staker_address").notNull(),
  stakeId: integer("stake_id").references(() => liquidityPoolStakes.id),
  
  // Earnings calculation
  stakingPercentage: decimal("staking_percentage", { precision: 10, scale: 6 }).notNull(), // % of total pool at distribution time
  earnedAmount: decimal("earned_amount", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").notNull().default("USDC"),
  
  // Claim tracking
  claimStatus: text("claim_status").notNull().default("pending"), // pending, claimed, expired
  claimedAt: timestamp("claimed_at"),
  claimTransactionHash: text("claim_transaction_hash"),
  
  // Distribution metadata
  distributedAt: timestamp("distributed_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for unclaimed earnings
});

// Dispute Resolution System
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  disputeId: text("dispute_id").notNull().unique(),
  
  // Dispute context
  relatedType: text("related_type").notNull(), // trade_finance, escrow, contract, delivery
  relatedId: text("related_id").notNull(), // requestId, contractId, etc.
  
  // Parties
  initiatorAddress: text("initiator_address").notNull(),
  respondentAddress: text("respondent_address").notNull(),
  
  // Dispute details
  disputeReason: text("dispute_reason").notNull(),
  disputeDescription: text("dispute_description").notNull(),
  requestedResolution: text("requested_resolution").notNull(),
  disputedAmount: decimal("disputed_amount", { precision: 78, scale: 18 }),
  
  // Evidence
  evidenceDocuments: text("evidence_documents"), // JSON array of document hashes/IDs
  initiatorEvidence: text("initiator_evidence"), // Additional evidence text
  respondentEvidence: text("respondent_evidence"),
  
  // Resolution method
  resolutionMethod: text("resolution_method").notNull(), // arbitration, voting, automated
  arbitratorAddress: text("arbitrator_address"), // Kleros, ICC, or individual arbitrator
  arbitrationPlatform: text("arbitration_platform"), // kleros, siac, icc
  
  // Status
  status: text("status").notNull().default("open"), // open, under_review, resolved, closed, escalated
  resolution: text("resolution"), // Final decision text
  resolvedInFavorOf: text("resolved_in_favor_of"), // initiator, respondent, split
  
  // Timeline
  filedAt: timestamp("filed_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // Settlement
  settlementAmount: decimal("settlement_amount", { precision: 78, scale: 18 }),
  settlementTransactionHash: text("settlement_transaction_hash"),
  settledAt: timestamp("settled_at"),
});

// KYC/AML Verification System
export const kycVerifications = pgTable("kyc_verifications", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  
  // Verification level
  verificationType: text("verification_type").notNull(), // basic, enhanced, corporate
  verificationLevel: integer("verification_level").notNull().default(0), // 0=none, 1=basic, 2=enhanced, 3=full
  
  // Personal information (encrypted or hashed)
  fullName: text("full_name"),
  dateOfBirth: timestamp("date_of_birth"),
  nationality: text("nationality"),
  countryOfResidence: text("country_of_residence"),
  
  // Business information (for corporate accounts)
  companyName: text("company_name"),
  registrationNumber: text("registration_number"),
  companyCountry: text("company_country"),
  businessType: text("business_type"),
  
  // Document verification
  documentType: text("document_type"), // passport, drivers_license, national_id, business_registration
  documentNumber: text("document_number"),
  documentHash: text("document_hash"), // IPFS or encrypted hash
  documentExpiryDate: timestamp("document_expiry_date"),
  
  // Verification status
  status: text("status").notNull().default("pending"), // pending, under_review, approved, rejected, expired
  verifiedBy: text("verified_by"), // Verifier address or service
  verificationProvider: text("verification_provider"), // manual, onfido, sumsub, etc.
  
  // Risk assessment
  riskLevel: text("risk_level").default("medium"), // low, medium, high
  sanctionsCheck: boolean("sanctions_check").default(false),
  sanctionsCheckDate: timestamp("sanctions_check_date"),
  pepsCheck: boolean("peps_check").default(false), // Politically Exposed Persons
  
  // AML flags
  amlScore: integer("aml_score"), // 0-100 risk score
  flaggedTransactions: integer("flagged_transactions").default(0),
  lastAmlCheck: timestamp("last_aml_check"),
  
  // Approval/Rejection
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  
  // Renewal
  expiresAt: timestamp("expires_at"),
  renewalRequired: boolean("renewal_required").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Analytics Snapshots
export const platformAnalytics = pgTable("platform_analytics", {
  id: serial("id").primaryKey(),
  
  // Snapshot metadata
  snapshotDate: timestamp("snapshot_date").notNull(),
  snapshotType: text("snapshot_type").notNull(), // daily, weekly, monthly
  
  // Treasury metrics
  totalValueLocked: decimal("total_value_locked", { precision: 78, scale: 18 }).notNull(),
  totalStakers: integer("total_stakers").notNull(),
  activeStakers: integer("active_stakers").notNull(),
  
  // Trade Finance metrics
  totalGuaranteesIssued: integer("total_guarantees_issued").notNull(),
  totalGuaranteeVolume: decimal("total_guarantee_volume", { precision: 78, scale: 18 }).notNull(),
  activeGuarantees: integer("active_guarantees").notNull(),
  approvedGuarantees: integer("approved_guarantees").notNull(),
  rejectedGuarantees: integer("rejected_guarantees").notNull(),
  
  // Fee metrics
  totalFeesCollected: decimal("total_fees_collected", { precision: 78, scale: 18 }).notNull(),
  totalFeesDistributed: decimal("total_fees_distributed", { precision: 78, scale: 18 }).notNull(),
  pendingFeeDistributions: decimal("pending_fee_distributions", { precision: 78, scale: 18 }).notNull(),
  
  // Performance metrics
  averageApprovalTime: integer("average_approval_time"), // hours
  approvalSuccessRate: decimal("approval_success_rate", { precision: 5, scale: 2 }), // percentage
  defaultRate: decimal("default_rate", { precision: 5, scale: 2 }), // percentage
  
  // User metrics
  totalUsers: integer("total_users").notNull(),
  activeUsers: integer("active_users").notNull(), // active in last 30 days
  newUsers: integer("new_users").notNull(), // new in this period
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Notifications Tracking
export const emailNotifications = pgTable("email_notifications", {
  id: serial("id").primaryKey(),
  
  // Recipient
  recipientAddress: text("recipient_address").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  
  // Email content
  emailType: text("email_type").notNull(), // trade_finance_pending, vote_needed, earnings_available, dispute_filed, etc.
  subject: text("subject").notNull(),
  templateId: text("template_id"),
  
  // Related data
  relatedType: text("related_type"), // trade_finance, dispute, distribution
  relatedId: text("related_id"),
  
  // Delivery status
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed, bounced
  provider: text("provider"), // sendgrid, resend, mailgun
  providerMessageId: text("provider_message_id"),
  
  // Tracking
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertFeeDistributionSchema = createInsertSchema(feeDistributions).omit({
  id: true,
  distributedAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  filedAt: true,
});

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlatformAnalyticsSchema = createInsertSchema(platformAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertEmailNotificationSchema = createInsertSchema(emailNotifications).omit({
  id: true,
  createdAt: true,
});

// Specialist Roles - Trade Finance Specialists and Fraud Investigators
export const specialistRoles = pgTable("specialist_roles", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  roleType: text("role_type").notNull(), // trade_finance_specialist, fraud_investigator
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  specializations: text("specializations").array(), // ['URDG 758', 'Letters of Credit', 'Documentary Collections']
  yearsOfExperience: integer("years_of_experience"),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"), // Admin wallet who verified
  totalApplicationsReviewed: integer("total_applications_reviewed").default(0),
  totalClaimsInvestigated: integer("total_claims_investigated").default(0),
  averageReviewTime: integer("average_review_time"), // in hours
  approvalRate: decimal("approval_rate", { precision: 5, scale: 2 }), // percentage
  status: text("status").default("active"), // active, suspended, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Specialist Credentials - Professional certifications and documents
export const specialistCredentials = pgTable("specialist_credentials", {
  id: serial("id").primaryKey(),
  specialistAddress: text("specialist_address").notNull(),
  credentialType: text("credential_type").notNull(), // certification, education, license, professional_membership
  credentialName: text("credential_name").notNull(),
  issuingOrganization: text("issuing_organization").notNull(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  credentialNumber: text("credential_number"),
  documentName: text("document_name"),
  documentType: text("document_type"),
  documentSize: integer("document_size"),
  documentData: text("document_data"), // Base64 encoded
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Specialist Statistics - Performance metrics
export const specialistStatistics = pgTable("specialist_statistics", {
  id: serial("id").primaryKey(),
  specialistAddress: text("specialist_address").notNull().unique(),
  totalVotes: integer("total_votes").default(0),
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  totalReviews: integer("total_reviews").default(0),
  successfulOutcomes: integer("successful_outcomes").default(0),
  disputesRaised: integer("disputes_raised").default(0),
  averageResponseTime: integer("average_response_time"), // in hours
  lastActiveAt: timestamp("last_active_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vote Delegations - Stakers delegate voting power to specialists
export const voteDelegations = pgTable("vote_delegations", {
  id: serial("id").primaryKey(),
  delegatorAddress: text("delegator_address").notNull(), // Staker who is delegating
  delegateAddress: text("delegate_address").notNull(), // Specialist receiving delegation
  votingPower: decimal("voting_power", { precision: 20, scale: 6 }).notNull(), // Amount of voting power delegated (in USDC)
  status: text("status").notNull().default("active"), // active, revoked
  delegatedAt: timestamp("delegated_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
  revokedReason: text("revoked_reason"),
}, (table) => ({
  // Unique constraint: one active delegation per delegator
  uniqueActiveDelegation: unique("unique_active_delegation").on(table.delegatorAddress, table.status),
}));

export const insertSpecialistRoleSchema = createInsertSchema(specialistRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSpecialistCredentialSchema = createInsertSchema(specialistCredentials).omit({
  id: true,
  createdAt: true,
});

export const insertSpecialistStatisticsSchema = createInsertSchema(specialistStatistics).omit({
  id: true,
  updatedAt: true,
});

export const insertVoteDelegationSchema = createInsertSchema(voteDelegations).omit({
  id: true,
  delegatedAt: true,
});

// Type exports for new tables
export type InsertFeeDistribution = z.infer<typeof insertFeeDistributionSchema>;
export type FeeDistribution = typeof feeDistributions.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;
export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertPlatformAnalytics = z.infer<typeof insertPlatformAnalyticsSchema>;
export type PlatformAnalytics = typeof platformAnalytics.$inferSelect;
export type InsertEmailNotification = z.infer<typeof insertEmailNotificationSchema>;
export type EmailNotification = typeof emailNotifications.$inferSelect;

export type InsertSpecialistRole = z.infer<typeof insertSpecialistRoleSchema>;
export type SpecialistRole = typeof specialistRoles.$inferSelect;
export type InsertSpecialistCredential = z.infer<typeof insertSpecialistCredentialSchema>;
export type SpecialistCredential = typeof specialistCredentials.$inferSelect;
export type InsertSpecialistStatistics = z.infer<typeof insertSpecialistStatisticsSchema>;
export type SpecialistStatistics = typeof specialistStatistics.$inferSelect;
export type InsertVoteDelegation = z.infer<typeof insertVoteDelegationSchema>;
export type VoteDelegation = typeof voteDelegations.$inferSelect;

// ============================================================================
// B2B TRADE PARTNER MARKETPLACE TABLES
// ============================================================================

// Marketplace Business Profiles - Verified company profiles for trade discovery
export const marketplaceBusinesses = pgTable("marketplace_businesses", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  
  // Company Information
  companyName: text("company_name").notNull(),
  companyType: text("company_type").notNull(), // exporter, importer, both, manufacturer, distributor, freight_forwarder
  industry: text("industry").notNull(), // agriculture, energy, metals, manufacturing, textiles, etc.
  description: text("description"),
  logoData: text("logo_data"), // Base64 encoded logo
  websiteUrl: text("website_url"),
  
  // Location
  country: text("country").notNull(),
  city: text("city"),
  address: text("address"),
  region: text("region"), // Africa, Asia, Europe, Americas, Middle East
  
  // Business Details
  yearEstablished: integer("year_established"),
  employeeCount: text("employee_count"), // 1-10, 11-50, 51-200, 201-500, 500+
  annualRevenue: text("annual_revenue"), // <100K, 100K-1M, 1M-10M, 10M-100M, 100M+
  exportMarkets: text("export_markets").array(), // Countries they export to
  importSources: text("import_sources").array(), // Countries they import from
  
  // Product/Service Categories
  productCategories: text("product_categories").array(), // sugar, oil, coffee, metals, textiles, etc.
  certifications: text("certifications").array(), // ISO, RSPO, Fair Trade, etc.
  
  // Trade Score (calculated from trade finance history)
  tradeScore: integer("trade_score").default(0), // 0-100
  totalTrades: integer("total_trades").default(0),
  successfulTrades: integer("successful_trades").default(0),
  totalTradeVolume: decimal("total_trade_volume", { precision: 78, scale: 18 }).default("0"),
  defaultRate: decimal("default_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Verification Status
  isVerified: boolean("is_verified").default(false),
  verificationLevel: integer("verification_level").default(0), // 0=unverified, 1=basic, 2=enhanced, 3=premium
  verifiedAt: timestamp("verified_at"),
  verifiedBy: text("verified_by"),
  
  // Engagement Metrics
  profileViews: integer("profile_views").default(0),
  inquiriesReceived: integer("inquiries_received").default(0),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }).default("0"),
  averageResponseTime: integer("average_response_time"), // in hours
  
  // Status
  status: text("status").default("active"), // active, inactive, suspended
  featuredUntil: timestamp("featured_until"), // Premium featured listing
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace Product Listings - Products/services offered by businesses
export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").references(() => marketplaceBusinesses.id).notNull(),
  walletAddress: text("wallet_address").notNull(),
  
  // Product Details
  productName: text("product_name").notNull(),
  category: text("category").notNull(), // sugar, crude_oil, coffee, palm_oil, copper, etc.
  subcategory: text("subcategory"),
  description: text("description"),
  specifications: text("specifications"), // JSON with product specs
  
  // Pricing
  priceType: text("price_type").notNull(), // fixed, negotiable, rfq_only
  minPrice: decimal("min_price", { precision: 78, scale: 18 }),
  maxPrice: decimal("max_price", { precision: 78, scale: 18 }),
  currency: text("currency").default("USDC"),
  priceUnit: text("price_unit"), // per MT, per barrel, per kg, etc.
  
  // Quantity
  minOrderQuantity: decimal("min_order_quantity", { precision: 20, scale: 2 }),
  maxOrderQuantity: decimal("max_order_quantity", { precision: 20, scale: 2 }),
  quantityUnit: text("quantity_unit"), // MT, barrels, kg, units
  availableQuantity: decimal("available_quantity", { precision: 20, scale: 2 }),
  
  // Origin & Delivery
  countryOfOrigin: text("country_of_origin"),
  portOfLoading: text("port_of_loading"),
  deliveryTerms: text("delivery_terms").array(), // FOB, CIF, CFR, DDP, etc.
  leadTime: text("lead_time"), // 1-2 weeks, 2-4 weeks, etc.
  
  // Certifications & Quality
  certifications: text("certifications").array(),
  qualityGrade: text("quality_grade"),
  sampleAvailable: boolean("sample_available").default(false),
  
  // Images
  images: text("images").array(), // Array of base64 or URLs
  mainImage: text("main_image"),
  
  // Status
  status: text("status").default("active"), // active, inactive, out_of_stock
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  inquiryCount: integer("inquiry_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace RFQs - Request for Quotations from buyers
export const marketplaceRfqs = pgTable("marketplace_rfqs", {
  id: serial("id").primaryKey(),
  rfqNumber: text("rfq_number").notNull().unique(),
  buyerWalletAddress: text("buyer_wallet_address").notNull(),
  buyerBusinessId: integer("buyer_business_id").references(() => marketplaceBusinesses.id),
  
  // Product Requirements
  productCategory: text("product_category").notNull(),
  productName: text("product_name").notNull(),
  productSpecifications: text("product_specifications"), // JSON with detailed specs
  
  // Quantity & Budget
  quantity: decimal("quantity", { precision: 20, scale: 2 }).notNull(),
  quantityUnit: text("quantity_unit").notNull(),
  budgetMin: decimal("budget_min", { precision: 78, scale: 18 }),
  budgetMax: decimal("budget_max", { precision: 78, scale: 18 }),
  currency: text("currency").default("USDC"),
  
  // Delivery Requirements
  deliveryLocation: text("delivery_location").notNull(),
  deliveryPort: text("delivery_port"),
  deliveryCountry: text("delivery_country").notNull(),
  deliveryTerms: text("delivery_terms"), // FOB, CIF, etc.
  requiredDeliveryDate: timestamp("required_delivery_date"),
  
  // Source Preferences
  preferredOrigins: text("preferred_origins").array(), // Countries
  requiredCertifications: text("required_certifications").array(),
  qualityRequirements: text("quality_requirements"),
  
  // Payment Preferences
  paymentTerms: text("payment_terms"), // Trade Finance, LC, TT, etc.
  tradeFinancePreferred: boolean("trade_finance_preferred").default(true),
  
  // RFQ Status
  status: text("status").default("open"), // open, closed, awarded, cancelled, expired
  visibility: text("visibility").default("public"), // public, invited_only
  invitedSuppliers: text("invited_suppliers").array(), // Wallet addresses
  
  // Response Tracking
  totalQuotes: integer("total_quotes").default(0),
  viewCount: integer("view_count").default(0),
  
  // Expiry
  expiresAt: timestamp("expires_at").notNull(),
  awardedToWallet: text("awarded_to_wallet"),
  awardedAt: timestamp("awarded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace Quotes - Supplier responses to RFQs
export const marketplaceQuotes = pgTable("marketplace_quotes", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id").references(() => marketplaceRfqs.id).notNull(),
  supplierWalletAddress: text("supplier_wallet_address").notNull(),
  supplierBusinessId: integer("supplier_business_id").references(() => marketplaceBusinesses.id),
  
  // Quote Details
  unitPrice: decimal("unit_price", { precision: 78, scale: 18 }).notNull(),
  totalPrice: decimal("total_price", { precision: 78, scale: 18 }).notNull(),
  currency: text("currency").default("USDC"),
  priceUnit: text("price_unit"),
  
  // Product Details
  productOrigin: text("product_origin").notNull(),
  productSpecifications: text("product_specifications"), // JSON matching buyer requirements
  certifications: text("certifications").array(),
  qualityGrade: text("quality_grade"),
  
  // Delivery Terms
  deliveryTerms: text("delivery_terms").notNull(),
  portOfLoading: text("port_of_loading"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  leadTime: text("lead_time"),
  
  // Payment Terms
  paymentTerms: text("payment_terms").notNull(),
  acceptsTradeFinance: boolean("accepts_trade_finance").default(true),
  
  // Quantity
  offeredQuantity: decimal("offered_quantity", { precision: 20, scale: 2 }).notNull(),
  minOrderQuantity: decimal("min_order_quantity", { precision: 20, scale: 2 }),
  
  // Quote Validity
  validUntil: timestamp("valid_until").notNull(),
  
  // Additional Information
  notes: text("notes"),
  attachments: text("attachments"), // JSON array of document references
  sampleAvailable: boolean("sample_available").default(false),
  
  // Status
  status: text("status").default("submitted"), // submitted, under_review, shortlisted, accepted, rejected, withdrawn
  buyerResponse: text("buyer_response"), // Accept, counter, reject reason
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueQuotePerRfq: unique().on(table.rfqId, table.supplierWalletAddress),
}));

// Marketplace Business Reviews - Partner ratings and reviews
export const marketplaceReviews = pgTable("marketplace_reviews", {
  id: serial("id").primaryKey(),
  reviewerWalletAddress: text("reviewer_wallet_address").notNull(),
  reviewedWalletAddress: text("reviewed_wallet_address").notNull(),
  reviewerBusinessId: integer("reviewer_business_id").references(() => marketplaceBusinesses.id),
  reviewedBusinessId: integer("reviewed_business_id").references(() => marketplaceBusinesses.id),
  
  // Associated Trade (optional - for verified reviews)
  tradeRequestId: text("trade_request_id"), // Trade finance request ID
  rfqId: integer("rfq_id").references(() => marketplaceRfqs.id),
  
  // Ratings (1-5 scale)
  overallRating: integer("overall_rating").notNull(),
  qualityRating: integer("quality_rating"),
  communicationRating: integer("communication_rating"),
  deliveryRating: integer("delivery_rating"),
  priceRating: integer("price_rating"),
  
  // Review Content
  reviewTitle: text("review_title"),
  reviewText: text("review_text"),
  
  // Trade Context
  tradeType: text("trade_type"), // buyer, seller
  tradeValue: decimal("trade_value", { precision: 78, scale: 18 }),
  productCategory: text("product_category"),
  
  // Verification
  isVerified: boolean("is_verified").default(false), // True if linked to completed trade finance deal
  
  // Moderation
  status: text("status").default("published"), // pending, published, hidden, removed
  
  // Response
  responseText: text("response_text"),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueReviewPerTrade: unique().on(table.reviewerWalletAddress, table.tradeRequestId),
}));

// Marketplace Business Connections - Business networking
export const marketplaceConnections = pgTable("marketplace_connections", {
  id: serial("id").primaryKey(),
  requesterWalletAddress: text("requester_wallet_address").notNull(),
  targetWalletAddress: text("target_wallet_address").notNull(),
  requesterBusinessId: integer("requester_business_id").references(() => marketplaceBusinesses.id),
  targetBusinessId: integer("target_business_id").references(() => marketplaceBusinesses.id),
  
  // Connection Details
  connectionType: text("connection_type").default("follow"), // follow, partnership, preferred_vendor
  status: text("status").default("pending"), // pending, accepted, rejected
  message: text("message"), // Connection request message
  
  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => ({
  uniqueConnection: unique().on(table.requesterWalletAddress, table.targetWalletAddress),
}));

// Trade Corridors - Predefined trade routes with analytics
export const tradeCorridors = pgTable("trade_corridors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sourceRegion: text("source_region").notNull(),
  sourceCountries: text("source_countries").array(),
  destinationRegion: text("destination_region").notNull(),
  destinationCountries: text("destination_countries").array(),
  productCategories: text("product_categories").array(),
  
  // Trade Statistics
  totalTradeVolume: decimal("total_trade_volume", { precision: 78, scale: 18 }).default("0"),
  averageTradeSize: decimal("average_trade_size", { precision: 78, scale: 18 }).default("0"),
  activeTraders: integer("active_traders").default(0),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Logistics Info
  typicalLeadTime: text("typical_lead_time"),
  commonPorts: text("common_ports").array(),
  shippingRoutes: text("shipping_routes"),
  
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for Marketplace
export const insertMarketplaceBusinessSchema = createInsertSchema(marketplaceBusinesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceProductSchema = createInsertSchema(marketplaceProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceRfqSchema = createInsertSchema(marketplaceRfqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceQuoteSchema = createInsertSchema(marketplaceQuotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceReviewSchema = createInsertSchema(marketplaceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketplaceConnectionSchema = createInsertSchema(marketplaceConnections).omit({
  id: true,
  requestedAt: true,
});

export const insertTradeCorridorSchema = createInsertSchema(tradeCorridors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports for Marketplace
export type InsertMarketplaceBusiness = z.infer<typeof insertMarketplaceBusinessSchema>;
export type MarketplaceBusiness = typeof marketplaceBusinesses.$inferSelect;
export type InsertMarketplaceProduct = z.infer<typeof insertMarketplaceProductSchema>;
export type MarketplaceProduct = typeof marketplaceProducts.$inferSelect;
export type InsertMarketplaceRfq = z.infer<typeof insertMarketplaceRfqSchema>;
export type MarketplaceRfq = typeof marketplaceRfqs.$inferSelect;
export type InsertMarketplaceQuote = z.infer<typeof insertMarketplaceQuoteSchema>;
export type MarketplaceQuote = typeof marketplaceQuotes.$inferSelect;
export type InsertMarketplaceReview = z.infer<typeof insertMarketplaceReviewSchema>;
export type MarketplaceReview = typeof marketplaceReviews.$inferSelect;
export type InsertMarketplaceConnection = z.infer<typeof insertMarketplaceConnectionSchema>;
export type MarketplaceConnection = typeof marketplaceConnections.$inferSelect;
export type InsertTradeCorridor = z.infer<typeof insertTradeCorridorSchema>;
export type TradeCorridor = typeof tradeCorridors.$inferSelect;

// Export all referral-related schemas
export * from './referral-schema';

// ============================================
// WAITLIST
// ============================================

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // 'buyer' or 'seller'
  companyName: text("company_name"),
  country: text("country").notNull(),
  goodsTraded: text("goods_traded"),
  tradingVolume: text("trading_volume"),
  challenges: text("challenges"),
  preferredChannel: text("preferred_channel").notNull(), // 'email', 'whatsapp', 'other'
  preferredChannelOther: text("preferred_channel_other"),
  additionalComments: text("additional_comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

// P2P Hedge Events - FX devaluation protection events
export const hedgeEvents = pgTable("hedge_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  underlying: text("underlying").notNull(), // e.g. "USD/GHS"
  strike: decimal("strike", { precision: 18, scale: 6 }).notNull(),
  premiumRate: decimal("premium_rate", { precision: 10, scale: 6 }).notNull(), // e.g. 0.025 for 2.5%
  payoutRate: decimal("payout_rate", { precision: 10, scale: 6 }).notNull(), // e.g. 0.10 for 10%
  safetyFactor: decimal("safety_factor", { precision: 5, scale: 2 }).notNull().default("0.80"),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").notNull().default("open"), // open, settled, expired
  settlementPrice: decimal("settlement_price", { precision: 18, scale: 6 }),
  triggered: boolean("triggered").default(false),
  settledAt: timestamp("settled_at"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHedgeEventSchema = createInsertSchema(hedgeEvents).omit({
  id: true,
  createdAt: true,
  settledAt: true,
  triggered: true,
  settlementPrice: true,
});

export type InsertHedgeEvent = z.infer<typeof insertHedgeEventSchema>;
export type HedgeEvent = typeof hedgeEvents.$inferSelect;

// P2P Hedge Positions - hedger (importer) protection positions
export const hedgePositions = pgTable("hedge_positions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => hedgeEvents.id).notNull(),
  hedgerWallet: text("hedger_wallet").notNull(),
  notional: decimal("notional", { precision: 18, scale: 2 }).notNull(), // coverage amount in USD
  premiumPaid: decimal("premium_paid", { precision: 18, scale: 2 }).notNull(),
  maxPayout: decimal("max_payout", { precision: 18, scale: 2 }).notNull(),
  payoutAmount: decimal("payout_amount", { precision: 18, scale: 2 }),
  claimed: boolean("claimed").default(false),
  status: text("status").notNull().default("active"), // active, settled_win, settled_loss, claimed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHedgePositionSchema = createInsertSchema(hedgePositions).omit({
  id: true,
  createdAt: true,
  payoutAmount: true,
  claimed: true,
});

export type InsertHedgePosition = z.infer<typeof insertHedgePositionSchema>;
export type HedgePosition = typeof hedgePositions.$inferSelect;

// P2P Hedge LP Deposits - liquidity provider deposits
export const hedgeLpDeposits = pgTable("hedge_lp_deposits", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => hedgeEvents.id).notNull(),
  lpWallet: text("lp_wallet").notNull(),
  amount: decimal("amount", { precision: 18, scale: 2 }).notNull(),
  shares: decimal("shares", { precision: 18, scale: 6 }).notNull(),
  premiumsEarned: decimal("premiums_earned", { precision: 18, scale: 2 }).default("0"),
  premiumsWithdrawn: decimal("premiums_withdrawn", { precision: 18, scale: 2 }).default("0"),
  withdrawn: boolean("withdrawn").default(false),
  withdrawnAt: timestamp("withdrawn_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHedgeLpDepositSchema = createInsertSchema(hedgeLpDeposits).omit({
  id: true,
  createdAt: true,
  premiumsEarned: true,
  premiumsWithdrawn: true,
  withdrawn: true,
  withdrawnAt: true,
});

export type InsertHedgeLpDeposit = z.infer<typeof insertHedgeLpDepositSchema>;
export type HedgeLpDeposit = typeof hedgeLpDeposits.$inferSelect;

// Financing Offers - Financiers submit offers on trade finance applications
export const financingOffers = pgTable("financing_offers", {
  id: serial("id").primaryKey(),
  offerId: text("offer_id").notNull().unique(),
  requestId: text("request_id").notNull().references(() => tradeFinanceRequests.requestId),
  financierAddress: text("financier_address").notNull(),
  financierName: text("financier_name").notNull(),
  financierType: text("financier_type").notNull(), // bank, trade_finance_fund, family_office, dfi, institutional_investor
  offerAmount: decimal("offer_amount", { precision: 78, scale: 18 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // Annual rate %
  tenorDays: integer("tenor_days").notNull(), // Financing duration in days
  fees: decimal("fees", { precision: 5, scale: 2 }).default("0"), // Additional fees %
  conditions: text("conditions"), // Special conditions or requirements
  expiresAt: timestamp("expires_at").notNull(), // Offer expiry
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired, withdrawn
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFinancingOfferSchema = createInsertSchema(financingOffers).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
  rejectedAt: true,
});

export type InsertFinancingOffer = z.infer<typeof insertFinancingOfferSchema>;
export type FinancingOffer = typeof financingOffers.$inferSelect;
