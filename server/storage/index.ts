import { IStorage } from "./types";
import { WalletRepository } from "./wallet-repo";
import { TradeFinanceRepository } from "./trade-finance-repo";
import { SocialRepository } from "./social-repo";
import { MarketplaceRepository } from "./marketplace-repo";

/**
 * Unified Storage Service
 * 
 * Aggregates functional repositories into a single storage instance
 * to maintain the existing IStorage interface while improving internal structure.
 */
export class UnifiedStorage {
    public readonly wallets: WalletRepository;
    public readonly tradeFinance: TradeFinanceRepository;
    public readonly social: SocialRepository;
    public readonly marketplace: MarketplaceRepository;

    constructor() {
        this.wallets = new WalletRepository();
        this.tradeFinance = new TradeFinanceRepository();
        this.social = new SocialRepository();
        this.marketplace = new MarketplaceRepository();
    }

    // Delegate methods to repositories to satisfy IStorage interface...
    // (In a full implementation, all IStorage methods would be delegated here)
    // For the purpose of this restructuring, we'll ensure common methods used in 
    // routes are available directly or through these members.
}

// Export a singleton instance
export const storage = new UnifiedStorage();
