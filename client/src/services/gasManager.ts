import { parseEther, formatEther } from "viem";

/**
 * Gas Manager Service (Web App)
 * Manages gas sponsorship policies and tracks user gas usage.
 */

export interface GasSponsorshipPolicy {
    perUserDailyLimitUSD: number;
    perUserDailyLimitETH: bigint;
    globalDailyLimitUSD: number;
    globalDailyLimitETH: bigint;
    maxSponsoredValueUSD: number;
    maxSponsoredValueETH: bigint;
    sponsoredOperations: string[];
}

export interface UserGasUsage {
    userId: string;
    dailyGasUsedWei: string;
    dailyGasUsedUSD: number;
    lastResetDate: string;
    totalTransactions: number;
    sponsoredTransactions: number;
}

export interface GlobalGasUsage {
    dailyGasUsedWei: string;
    dailyGasUsedUSD: number;
    lastResetDate: string;
    totalUsers: number;
}

export type GasPaymentMethod = 'sponsored' | 'erc20' | 'native';

export interface GasPaymentDecision {
    method: GasPaymentMethod;
    reason: string;
    estimatedCostUSD: number;
    estimatedCostETH: bigint;
    remainingSponsoredUSD: number;
    canAfford: boolean;
}

const DEFAULT_POLICY: GasSponsorshipPolicy = {
    perUserDailyLimitUSD: 0.50,
    perUserDailyLimitETH: parseEther("0.0002"),
    globalDailyLimitUSD: 50.0,
    globalDailyLimitETH: parseEther("0.02"),
    maxSponsoredValueUSD: 100.0,
    maxSponsoredValueETH: parseEther("0.04"),
    sponsoredOperations: ['transfer', 'approve', 'stake', 'unstake', 'swap', 'claim', 'createPGA', 'payCollateral', 'vote'],
};

class GasManagerService {
    private policy: GasSponsorshipPolicy = DEFAULT_POLICY;

    private readonly STORAGE_PREFIX = 'blockfinax.gas_manager.';
    private readonly USER_USAGE_KEY = (userId: string) => `${this.STORAGE_PREFIX}user_${userId}`;
    private readonly GLOBAL_USAGE_KEY = `${this.STORAGE_PREFIX}global`;

    initialize(customPolicy?: Partial<GasSponsorshipPolicy>): void {
        if (customPolicy) {
            this.policy = { ...DEFAULT_POLICY, ...customPolicy };
        }
    }

    private getUserGasUsage(userId: string): UserGasUsage {
        try {
            const stored = localStorage.getItem(this.USER_USAGE_KEY(userId));
            if (stored) return JSON.parse(stored);
        } catch { }

        return {
            userId,
            dailyGasUsedWei: "0",
            dailyGasUsedUSD: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            totalTransactions: 0,
            sponsoredTransactions: 0,
        };
    }

    private getGlobalGasUsage(): GlobalGasUsage {
        try {
            const stored = localStorage.getItem(this.GLOBAL_USAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch { }

        return {
            dailyGasUsedWei: "0",
            dailyGasUsedUSD: 0,
            lastResetDate: new Date().toISOString().split('T')[0],
            totalUsers: 0,
        };
    }

    private saveUserGasUsage(userId: string, usage: UserGasUsage): void {
        localStorage.setItem(this.USER_USAGE_KEY(userId), JSON.stringify(usage));
    }

    private saveGlobalGasUsage(usage: GlobalGasUsage): void {
        localStorage.setItem(this.GLOBAL_USAGE_KEY, JSON.stringify(usage));
    }

    private resetDailyLimitsIfNeeded(): void {
        const today = new Date().toISOString().split('T')[0];
        const globalUsage = this.getGlobalGasUsage();
        if (globalUsage.lastResetDate !== today) {
            globalUsage.dailyGasUsedWei = "0";
            globalUsage.dailyGasUsedUSD = 0;
            globalUsage.lastResetDate = today;
            this.saveGlobalGasUsage(globalUsage);
        }
    }

    async checkSponsorshipEligibility(
        userId: string,
        estimatedGasWei: bigint,
        transactionValueUSD: number,
        operation?: string
    ): Promise<GasPaymentDecision> {
        try {
            this.resetDailyLimitsIfNeeded();

            const userUsage = this.getUserGasUsage(userId);
            const globalUsage = this.getGlobalGasUsage();

            const estimatedCostETH = estimatedGasWei;
            const estimatedCostUSD = parseFloat(formatEther(estimatedGasWei)) * 2500;

            const userRemainingUSD = this.policy.perUserDailyLimitUSD - userUsage.dailyGasUsedUSD;
            const globalRemainingUSD = this.policy.globalDailyLimitUSD - globalUsage.dailyGasUsedUSD;

            if (operation && !this.policy.sponsoredOperations.includes(operation)) {
                return { method: 'erc20', reason: `Operation '${operation}' not eligible for sponsorship`, estimatedCostUSD, estimatedCostETH, remainingSponsoredUSD: userRemainingUSD, canAfford: true };
            }

            if (transactionValueUSD > this.policy.maxSponsoredValueUSD) {
                return { method: 'erc20', reason: `Transaction value ($${transactionValueUSD.toFixed(2)}) exceeds max sponsored value`, estimatedCostUSD, estimatedCostETH, remainingSponsoredUSD: userRemainingUSD, canAfford: true };
            }

            if (estimatedCostUSD > userRemainingUSD) {
                return { method: 'erc20', reason: `Daily sponsored limit exceeded.`, estimatedCostUSD, estimatedCostETH, remainingSponsoredUSD: userRemainingUSD, canAfford: true };
            }

            if (estimatedCostUSD > globalRemainingUSD) {
                return { method: 'erc20', reason: `Global daily limit reached.`, estimatedCostUSD, estimatedCostETH, remainingSponsoredUSD: userRemainingUSD, canAfford: true };
            }

            return {
                method: 'sponsored',
                reason: `✨ Transaction eligible for gas sponsorship!`,
                estimatedCostUSD,
                estimatedCostETH,
                remainingSponsoredUSD: userRemainingUSD,
                canAfford: true,
            };
        } catch {
            return { method: 'erc20', reason: 'Unable to check status. Using token payment.', estimatedCostUSD: 0, estimatedCostETH: BigInt(0), remainingSponsoredUSD: 0, canAfford: true };
        }
    }

    async trackGasUsage(userId: string, gasUsedWei: bigint, wasSponsored: boolean): Promise<void> {
        try {
            const gasUsedUSD = parseFloat(formatEther(gasUsedWei)) * 2500;
            const userUsage = this.getUserGasUsage(userId);

            const prevWei = BigInt(userUsage.dailyGasUsedWei);
            userUsage.dailyGasUsedWei = (prevWei + gasUsedWei).toString();
            userUsage.dailyGasUsedUSD += gasUsedUSD;
            userUsage.totalTransactions += 1;

            if (wasSponsored) {
                userUsage.sponsoredTransactions += 1;
                const globalUsage = this.getGlobalGasUsage();
                globalUsage.dailyGasUsedWei = (BigInt(globalUsage.dailyGasUsedWei) + gasUsedWei).toString();
                globalUsage.dailyGasUsedUSD += gasUsedUSD;
                this.saveGlobalGasUsage(globalUsage);
            }
            this.saveUserGasUsage(userId, userUsage);
        } catch (e) {
            console.error('[GasManager] Error tracking usage', e);
        }
    }
}

export const gasManager = new GasManagerService();
