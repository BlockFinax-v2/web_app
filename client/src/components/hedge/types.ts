export type HedgeEventStatus = "open" | "settled" | "expired";

export type HedgePositionStatus =
  | "active"
  | "settled_win"
  | "settled_loss"
  | "claimable"
  | "expired"
  | "claimed";

export interface HedgeEvent {
  id: number;
  creator: string;
  tokenAddress: string;
  name: string;
  underlying: string;
  strike: string; // decimal, e.g. "16.50"
  premiumRate: string; // decimal fraction, e.g. "0.025"
  payoutRate: string; // decimal fraction, e.g. "0.30"
  expiryDate: string; // ISO string
  status: HedgeEventStatus;
  settlementPrice?: string; // decimal, same units as strike
  triggered: boolean;
  poolOpen: boolean;
  allowExternalLp: boolean;
  // Optional UX-only fields (not stored on-chain)
  description?: string;
  safetyFactor?: string;
}

export interface HedgePosition {
  id: number;
  eventId: number;
  hedger: string;
  notional: string; // USD, 2 decimals
  premiumPaid: string; // USD, 2 decimals
  platformFeePaid: string; // USD, 2 decimals
  maxPayout: string; // USD, 2 decimals
  payoutAmount: string; // USD, 2 decimals
  status: HedgePositionStatus;
  claimed: boolean;
}

export interface HedgeLpDeposit {
  id: number;
  eventId: number;
  lp: string;
  amount: string; // USD, 2 decimals
  shares: string; // 18-decimal shares, formatted
  premiumsEarned: string; // USD, 2 decimals
  premiumsWithdrawn: string; // USD, 2 decimals
  withdrawn: boolean;
}

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
  initialLiquidity?: string;
}
