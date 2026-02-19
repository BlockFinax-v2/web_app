/**
 * Foreign Exchange Rate Oracle
 * 
 * Provides real-time FX rates for trade hedge system with caching mechanism.
 * Exports: fetchAllRates, getRate, getSupportedPairs, checkExpiredEvents, startOraclePoller, stopOraclePoller
 */

const SUPPORTED_PAIRS: Record<string, { base: string; quote: string }> = {
  "USD/GHS": { base: "USD", quote: "GHS" },
  "USD/NGN": { base: "USD", quote: "NGN" },
  "USD/KES": { base: "USD", quote: "KES" },
  "USD/ZAR": { base: "USD", quote: "ZAR" },
  "USD/XOF": { base: "USD", quote: "XOF" },
  "EUR/GHS": { base: "EUR", quote: "GHS" },
};

interface FXRate {
  pair: string;
  rate: number;
  source: string;
  timestamp: number;
  lastUpdated: string;
}

interface OracleCache {
  rates: Record<string, FXRate>;
  lastFetch: number;
}

const cache: OracleCache = {
  rates: {},
  lastFetch: 0,
};

const CACHE_TTL = 5 * 60 * 1000;
const API_URL = "https://open.er-api.com/v6/latest";

async function fetchRatesForBase(base: string): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${API_URL}/${base}`);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (data.result !== "success") throw new Error("API returned error");
    return data.rates;
  } catch (error) {
    return {};
  }
}

export async function fetchAllRates(): Promise<Record<string, FXRate>> {
  const now = Date.now();
  if (now - cache.lastFetch < CACHE_TTL && Object.keys(cache.rates).length > 0) {
    return cache.rates;
  }

  const bases = Array.from(new Set(Object.values(SUPPORTED_PAIRS).map(p => p.base)));
  const allRates: Record<string, Record<string, number>> = {};

  await Promise.all(bases.map(async (base) => {
    allRates[base] = await fetchRatesForBase(base);
  }));

  const result: Record<string, FXRate> = {};
  for (const [pair, { base, quote }] of Object.entries(SUPPORTED_PAIRS)) {
    const rate = allRates[base]?.[quote];
    if (rate) {
      result[pair] = {
        pair,
        rate,
        source: "exchangerate-api.com",
        timestamp: now,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  cache.rates = result;
  cache.lastFetch = now;
  return result;
}

export async function getRate(pair: string): Promise<FXRate | null> {
  const rates = await fetchAllRates();
  return rates[pair] || null;
}

export function getSupportedPairs(): string[] {
  return Object.keys(SUPPORTED_PAIRS);
}

export async function checkExpiredEvents(storage: any): Promise<{ settled: number; errors: string[] }> {
  const events = await storage.getAllHedgeEvents();
  const now = new Date();
  let settled = 0;
  const errors: string[] = [];

  for (const event of events) {
    if (event.status !== "open") continue;
    if (new Date(event.expiryDate) > now) continue;

    const rate = await getRate(event.underlying);
    if (!rate) {
      errors.push(`No rate available for ${event.underlying} (event #${event.id})`);
      continue;
    }

    try {
      const positions = await storage.getHedgePositionsByEvent(event.id);
      const deposits = await storage.getHedgeLpDepositsByEvent(event.id);
      const triggered = rate.rate >= parseFloat(event.strike);

      if (triggered) {
        for (const pos of positions.filter((p: any) => p.status === "active")) {
          await storage.updateHedgePosition(pos.id, {
            status: "claimable",
            payoutAmount: pos.maxPayout,
          });
        }
      } else {
        for (const pos of positions.filter((p: any) => p.status === "active")) {
          await storage.updateHedgePosition(pos.id, {
            status: "expired",
            payoutAmount: "0",
          });
        }
      }

      const totalPremiums = positions.reduce((sum: number, p: any) => sum + parseFloat(p.premiumPaid), 0);
      const totalShares = deposits.filter((d: any) => !d.withdrawn).reduce((sum: number, d: any) => sum + parseFloat(d.shares), 0);
      if (totalShares > 0) {
        for (const dep of deposits.filter((d: any) => !d.withdrawn)) {
          const share = parseFloat(dep.shares) / totalShares;
          const earned = parseFloat(dep.premiumsEarned || "0") + (totalPremiums * share);
          await storage.updateHedgeLpDeposit(dep.id, { premiumsEarned: earned.toString() });
        }
      }

      await storage.updateHedgeEvent(event.id, {
        status: "settled",
        settlementPrice: rate.rate.toString(),
        triggered,
        settledAt: new Date(),
      });

      settled++;
    } catch (error) {
      errors.push(`Failed to settle event #${event.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { settled, errors };
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startOraclePoller(storage: any, intervalMs: number = 60 * 60 * 1000) {
  fetchAllRates();

  intervalId = setInterval(async () => {
    try {
      await fetchAllRates();
      await checkExpiredEvents(storage);
    } catch (error) {
    }
  }, intervalMs);
}

export function stopOraclePoller() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
