export type HedgeEvent = any;
export type HedgePosition = any;
export type HedgeLpDeposit = any;

export type EventWithStats = HedgeEvent & {
    poolStats?: {
        totalLiquidity: number;
        totalExposure: number;
        totalPremiums: number;
        utilization: number;
        availableCapacity: number;
        lpCount: number;
        hedgerCount: number;
    };
};

export type FXRate = {
    pair: string;
    rate: number;
    source: string;
    timestamp: number;
    lastUpdated: string;
};

export type FXData = {
    rates: Record<string, FXRate>;
    pairs: string[];
};

export interface NewEventState {
    name: string;
    description: string;
    underlying: string;
    strike: string;
    premiumRate: string;
    payoutRate: string;
    safetyFactor: string;
    expiryDays: string;
}
