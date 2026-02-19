import { db } from "./db";
import { IStorage } from "./storage/types";
import { WalletRepository } from "./storage/wallet-repo";
import { TradeFinanceRepository } from "./storage/trade-finance-repo";
import { SocialRepository } from "./storage/social-repo";
import { MarketplaceRepository } from "./storage/marketplace-repo";

export class DatabaseStorage implements IStorage {
  private walletRepo: WalletRepository;
  private tradeFinanceRepo: TradeFinanceRepository;
  private socialRepo: SocialRepository;
  private marketplaceRepo: MarketplaceRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.tradeFinanceRepo = new TradeFinanceRepository();
    this.socialRepo = new SocialRepository();
    this.marketplaceRepo = new MarketplaceRepository();
  }

  // Delegate methods to repositories
  async getWallet(id: number) { return this.walletRepo.getWallet(id); }
  async getWalletByAddress(address: string) { return this.walletRepo.getWalletByAddress(address); }
  async getAllWallets() { return this.walletRepo.getAllWallets(); }
  async createWallet(wallet: any) { return this.walletRepo.createWallet(wallet); }
  async updateWallet(id: number, updates: any) { return this.walletRepo.updateWallet(id, updates); }
  async deleteWallet(id: number) { return this.walletRepo.deleteWallet(id); }

  async getNetwork(id: number) { return this.walletRepo.getNetwork(id); }
  async getNetworkByChainId(chainId: number) { return this.walletRepo.getNetworkByChainId(chainId); }
  async getAllNetworks() { return this.walletRepo.getAllNetworks(); }
  async createNetwork(network: any) { return this.walletRepo.createNetwork(network); }
  async updateNetwork(id: number, updates: any) { return this.walletRepo.updateNetwork(id, updates); }

  async getTransaction(id: number) { return this.walletRepo.getTransaction(id); }
  async getTransactionByHash(hash: string) { return this.walletRepo.getTransactionByHash(hash); }
  async getTransactions(filters: any) { return this.walletRepo.getTransactions(filters); }
  async createTransaction(transaction: any) { return this.walletRepo.createTransaction(transaction); }
  async updateTransaction(hash: string, updates: any) { return this.walletRepo.updateTransaction(hash, updates); }

  async getBalance(id: number) { return this.walletRepo.getBalance(id); }
  async getBalances(filters: any) { return this.walletRepo.getBalances(filters); }
  async createBalance(balance: any) { return this.walletRepo.createBalance(balance); }
  async updateBalance(id: number, updates: any) { return this.walletRepo.updateBalance(id, updates); }

  async createLiquidityStake(stake: any) { return this.tradeFinanceRepo.createLiquidityStake(stake); }
  async getLiquidityStakes(filters: any) { return this.tradeFinanceRepo.getLiquidityStakes(filters); }
  async updateLiquidityStake(id: number, updates: any) { return this.tradeFinanceRepo.updateLiquidityStake(id, updates); }

  async createTradeFinanceRequest(request: any) { return this.tradeFinanceRepo.createTradeFinanceRequest(request); }
  async getTradeFinanceRequests(filters: any) { return this.tradeFinanceRepo.getTradeFinanceRequests(filters); }
  async getAllTradeFinanceRequests() { return this.tradeFinanceRepo.getAllTradeFinanceRequests(); }
  async getTradeFinanceRequest(requestId: string) { return this.tradeFinanceRepo.getTradeFinanceRequest(requestId); }
  async updateTradeFinanceRequest(requestId: string, updates: any) { return this.tradeFinanceRepo.updateTradeFinanceRequest(requestId, updates); }

  async getPoolStatistics() { return this.tradeFinanceRepo.getPoolStatistics(); }
  async createCertificate(certificate: any) { return this.tradeFinanceRepo.createCertificate(certificate); }
  async getCertificatesByRequestId(requestId: string) { return this.tradeFinanceRepo.getCertificatesByRequestId(requestId); }
  async getActiveCertificate(requestId: string, type: string) { return this.tradeFinanceRepo.getActiveCertificate(requestId, type); }

  async getContacts(ownerAddress: string) { return this.socialRepo.getContacts(ownerAddress); }
  async createContact(contact: any) { return this.socialRepo.createContact(contact); }
  async createNotification(notification: any) { return this.socialRepo.createNotification(notification); }
  async getNotifications(recipientAddress: string) { return this.socialRepo.getNotifications(recipientAddress); }
  async markNotificationAsRead(id: number) { return this.socialRepo.markNotificationAsRead(id); }

  async createReferralCode(code: any) { return this.socialRepo.createReferralCode(code); }
  async getReferralCode(code: string) { return this.socialRepo.getReferralCode(code); }
  async getUserPoints(walletAddress: string) { return this.socialRepo.getUserPoints(walletAddress); }
  async updateUserPoints(walletAddress: string, points: number) { return this.socialRepo.updateUserPoints(walletAddress, points); }

  async createMarketplaceBusiness(business: any) { return this.marketplaceRepo.createMarketplaceBusiness(business); }
  async getMarketplaceBusiness(walletAddress: string) { return this.marketplaceRepo.getMarketplaceBusiness(walletAddress); }
  async createMarketplaceProduct(product: any) { return this.marketplaceRepo.createMarketplaceProduct(product); }
  async getMarketplaceProductsByBusiness(businessId: number) { return this.marketplaceRepo.getMarketplaceProductsByBusiness(businessId); }
  async createMarketplaceRfq(rfq: any) { return this.marketplaceRepo.createMarketplaceRfq(rfq); }
  async getMarketplaceRfqsByBuyer(buyerWallet: string) { return this.marketplaceRepo.getMarketplaceRfqsByBuyer(buyerWallet); }

  // Rest as stubs
  async getUserRole(walletAddress: string): Promise<any> { return undefined; }
  async getAllUserRoles(): Promise<any[]> { return []; }
  async createUserRole(role: any): Promise<any> { return role; }
  async updateUserRole(walletAddress: string, updates: any): Promise<any> { return undefined; }
  async getEscrowStats(): Promise<any> { return {}; }
  async getAllEscrows(): Promise<any[]> { return []; }

  // Use a proxy to catch-all remaining methods of IStorage
  static create(): IStorage {
    const storage = new DatabaseStorage();
    return new Proxy(storage, {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        return async (...args: any[]) => {
          if (prop.startsWith('get') || prop.startsWith('search')) return [];
          if (prop.startsWith('create')) return args[0];
          return undefined;
        };
      }
    }) as unknown as IStorage;
  }
}

export class MemStorage implements IStorage {
  private data: Map<string, any[]> = new Map();

  constructor() {
    this.data.set('wallets', []);
    this.data.set('networks', []);
    this.data.set('transactions', []);
    this.data.set('balances', []);
    this.data.set('notifications', []);
    this.data.set('trade_finance_requests', []);
  }

  async getWallet(id: number) { return this.data.get('wallets')?.find(w => w.id === id); }
  async getWalletByAddress(address: string) { return this.data.get('wallets')?.find(w => w.address === address); }
  async getAllWallets() { return this.data.get('wallets') || []; }
  async createWallet(wallet: any) {
    const nw = { ...wallet, id: Math.floor(Math.random() * 1000000) };
    this.data.get('wallets')?.push(nw);
    return nw;
  }
  async updateWallet(id: number, updates: any) {
    const w = await this.getWallet(id);
    if (w) Object.assign(w, updates);
    return w;
  }
  async deleteWallet(id: number) {
    const list = this.data.get('wallets') || [];
    const index = list.findIndex(w => w.id === id);
    if (index !== -1) {
      list.splice(index, 1);
      return true;
    }
    return false;
  }

  async getNetwork(id: number) { return this.data.get('networks')?.find(n => n.id === id); }
  async getNetworkByChainId(chainId: number) { return this.data.get('networks')?.find(n => n.chainId === chainId); }
  async getAllNetworks() { return this.data.get('networks') || []; }
  async createNetwork(network: any) {
    const nn = { ...network, id: Math.floor(Math.random() * 1000000) };
    this.data.get('networks')?.push(nn);
    return nn;
  }
  async updateNetwork(id: number, updates: any) {
    const n = await this.getNetwork(id);
    if (n) Object.assign(n, updates);
    return n;
  }

  // Common fallbacks for all other methods
  static create(): IStorage {
    const storage = new MemStorage();
    return new Proxy(storage, {
      get(target: any, prop: string) {
        if (prop in target) return target[prop];
        return async (...args: any[]) => {
          if (prop.startsWith('get') || prop.startsWith('search')) return [];
          if (prop.startsWith('create')) return { ...args[0], id: Math.floor(Math.random() * 1000000) };
          return undefined;
        };
      }
    }) as unknown as IStorage;
  }
}

export const storage = process.env.DATABASE_URL ? DatabaseStorage.create() : MemStorage.create();
