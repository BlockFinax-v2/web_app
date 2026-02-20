/**
 * Gasless Transaction Limit Service (Web App)
 * Tracks daily gasless transaction usage and enforces limits based on localStorage.
 */

const STORAGE_KEY = 'blockfinax.gaslessUsage';
const DAILY_LIMIT_USD = 0.5; // $0.50 per day

interface DailyUsage {
    date: string; // YYYY-MM-DD
    totalUSD: number;
    transactions: {
        timestamp: number;
        amountUSD: number;
        token: string;
    }[];
}

class GaslessLimitService {
    private static instance: GaslessLimitService;

    public static getInstance(): GaslessLimitService {
        if (!GaslessLimitService.instance) {
            GaslessLimitService.instance = new GaslessLimitService();
        }
        return GaslessLimitService.instance;
    }

    private getTodayDate(): string {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    private getDailyUsage(): DailyUsage {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return { date: this.getTodayDate(), totalUSD: 0, transactions: [] };
            }

            const usage = JSON.parse(stored) as DailyUsage;

            if (usage.date !== this.getTodayDate()) {
                return { date: this.getTodayDate(), totalUSD: 0, transactions: [] };
            }
            return usage;
        } catch (error) {
            return { date: this.getTodayDate(), totalUSD: 0, transactions: [] };
        }
    }

    private saveDailyUsage(usage: DailyUsage): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
        } catch (error) {
            console.error('[GaslessLimit] Error saving usage', error);
        }
    }

    public async canUseGasless(amountUSD: number): Promise<{
        allowed: boolean;
        remainingUSD: number;
        usedUSD: number;
        limitUSD: number;
    }> {
        const usage = this.getDailyUsage();
        const remainingUSD = DAILY_LIMIT_USD - usage.totalUSD;
        const allowed = (usage.totalUSD + amountUSD) <= DAILY_LIMIT_USD;

        return {
            allowed,
            remainingUSD: Math.max(0, remainingUSD),
            usedUSD: usage.totalUSD,
            limitUSD: DAILY_LIMIT_USD,
        };
    }

    public async recordTransaction(amountUSD: number, token: string): Promise<void> {
        const usage = this.getDailyUsage();
        usage.totalUSD += amountUSD;
        usage.transactions.push({
            timestamp: Date.now(),
            amountUSD,
            token,
        });
        this.saveDailyUsage(usage);
    }
}

export const gaslessLimitService = GaslessLimitService.getInstance();
