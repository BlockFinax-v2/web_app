import { ethers } from "ethers";
import type { FXData, FXRate } from "@/components/hedge/types";
import { NETWORK_CONFIGS } from "@/config/alchemyAccount";

/**
 * Generic FX provider interface.
 *
 * The hedge UI should depend only on this interface so that
 * the underlying data source (HTTP API vs. Chainlink vs. mixed)
 * can be swapped without touching page components.
 */
export interface FxProvider {
  getAfricanRates(): Promise<FXData>;
}

// ---------------------------------------------------------------------------
// Shared configuration
// ---------------------------------------------------------------------------

// ISO currency codes for major African currencies.
// This list is intentionally explicit so the UI can render
// a comprehensive FX table for the continent.
export const AFRICAN_CURRENCIES = [
  "GHS", // Ghana
  "NGN", // Nigeria
  "KES", // Kenya
  "ZAR", // South Africa
  "EGP", // Egypt
  "TZS", // Tanzania
  "UGX", // Uganda
  "XOF", // West African CFA
  "XAF", // Central African CFA
  "MAD", // Morocco
  "DZD", // Algeria
  "TND", // Tunisia
  "MUR", // Mauritius
  "MWK", // Malawi
  "ZMW", // Zambia
  "ETB", // Ethiopia
  "RWF", // Rwanda
  "BWP", // Botswana
  "NAD", // Namibia
  "SCR", // Seychelles
  "SLL", // Sierra Leone
  "LRD", // Liberia
  "GMD", // Gambia
  "CVE", // Cape Verde
  "CDF", // DR Congo
  "SOS", // Somalia
  "SDG", // Sudan
  "SSP", // South Sudan
  "AOA", // Angola
  "MZN", // Mozambique
  "LSL", // Lesotho
  "SZL", // Eswatini
] as const;

// ---------------------------------------------------------------------------
// HTTP-based provider (exchangerate.host)
// ---------------------------------------------------------------------------

class ExchangerateHostProvider implements FxProvider {
  async getAfricanRates(): Promise<FXData> {
    const symbols = AFRICAN_CURRENCIES.join(",");

    const res = await fetch(
      `https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`,
    );

    if (!res.ok) {
      throw new Error("Failed to fetch FX rates from exchangerate.host");
    }

    const json = await res.json();
    const base = (json.base as string) || "USD";
    const timestampMs =
      typeof json.timestamp === "number"
        ? json.timestamp * 1000
        : Date.now();

    const rates: Record<string, FXRate> = {};
    const pairs: string[] = [];

    for (const code of AFRICAN_CURRENCIES) {
      const rateValue = json.rates?.[code];
      if (typeof rateValue !== "number") continue;

      const pair = `${base}/${code}`;
      pairs.push(pair);
      rates[pair] = {
        pair,
        rate: rateValue,
        source: "exchangerate.host",
        timestamp: timestampMs,
        lastUpdated: new Date(timestampMs).toISOString(),
      };
    }

    return { rates, pairs };
  }
}

// ---------------------------------------------------------------------------
// Optional Chainlink-based provider (overrides for configured pairs)
// ---------------------------------------------------------------------------

// Minimal AggregatorV3 interface for Chainlink FX feeds
const AGGREGATOR_V3_ABI = [
  "function latestRoundData() view returns (uint80 roundId,int256 answer,uint256 startedAt,uint256 updatedAt,uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
];

type ChainlinkFeedConfig = {
  chainId: number;
  address: string;
};

/**
 * Env-configured Chainlink FX feeds. Addresses are injected via env so you can
 * configure whichever feeds you have available without hard-coding them into
 * the frontend bundle.
 *
 * Example env vars (all optional, use only those you have addresses for):
 * - VITE_CHAINLINK_FX_USD_GHS
 * - VITE_CHAINLINK_FX_USD_NGN
 * - VITE_CHAINLINK_FX_USD_KES
 * - VITE_CHAINLINK_FX_USD_ZAR
 * - VITE_CHAINLINK_FX_USD_XOF
 * - VITE_CHAINLINK_FX_EUR_GHS
 */
const CHAINLINK_FEEDS: Record<string, ChainlinkFeedConfig> = {
  "USD/GHS": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_USD_GHS || "",
  },
  "USD/NGN": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_USD_NGN || "",
  },
  "USD/KES": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_USD_KES || "",
  },
  "USD/ZAR": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_USD_ZAR || "",
  },
  "USD/XOF": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_USD_XOF || "",
  },
  "EUR/GHS": {
    chainId: 1,
    address: import.meta.env.VITE_CHAINLINK_FX_EUR_GHS || "",
  },
};

async function fetchChainlinkRate(pair: string): Promise<FXRate | null> {
  const cfg = CHAINLINK_FEEDS[pair];
  if (!cfg || !cfg.address) return null;

  const net = NETWORK_CONFIGS[cfg.chainId];
  if (!net?.rpcUrl) return null;

  const provider = new ethers.JsonRpcProvider(net.rpcUrl, {
    name: net.name,
    chainId: cfg.chainId,
  });

  const contract = new ethers.Contract(
    cfg.address,
    AGGREGATOR_V3_ABI,
    provider,
  );

  try {
    const [roundData, decimals] = await Promise.all([
      contract.latestRoundData(),
      contract.decimals(),
    ]);

    const answer: bigint =
      typeof roundData.answer === "bigint"
        ? roundData.answer
        : BigInt(roundData[1]);

    if (answer <= 0n) return null;

    const rate = Number(ethers.formatUnits(answer, decimals));
    const timestampMs =
      typeof roundData.updatedAt === "bigint"
        ? Number(roundData.updatedAt) * 1000
        : Date.now();

    return {
      pair,
      rate,
      source: "Chainlink",
      timestamp: timestampMs,
      lastUpdated: new Date(timestampMs).toISOString(),
    };
  } catch {
    return null;
  }
}

class ChainlinkFxProvider {
  async getAfricanRates(): Promise<FXData> {
    const pairs = Object.keys(CHAINLINK_FEEDS);
    if (pairs.length === 0) {
      return { rates: {}, pairs: [] };
    }

    const overrides = await Promise.all(pairs.map((p) => fetchChainlinkRate(p)));
    const rates: Record<string, FXRate> = {};

    for (const fx of overrides) {
      if (!fx) continue;
      rates[fx.pair] = fx;
    }

    return { rates, pairs: Object.keys(rates) };
  }
}

class CombinedFxProvider implements FxProvider {
  constructor(
    private readonly base: FxProvider,
    private readonly overrides: ChainlinkFxProvider,
  ) {}

  async getAfricanRates(): Promise<FXData> {
    const baseData = await this.base.getAfricanRates();
    const overrideData = await this.overrides.getAfricanRates();

    const rates: Record<string, FXRate> = { ...baseData.rates };
    const pairs: string[] = [...baseData.pairs];

    for (const [pair, fx] of Object.entries(overrideData.rates)) {
      rates[pair] = fx;
      if (!pairs.includes(pair)) {
        pairs.push(pair);
      }
    }

    return { rates, pairs };
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create the active FX provider based on configuration.
 *
 *  - exchangerate_host (default): HTTP API only
 *  - chainlink: Chainlink overrides on top of HTTP base (same as mixed)
 *  - mixed: same as chainlink (kept for clarity / future expansion)
 */
export function createFxProvider(): FxProvider {
  const mode = (import.meta.env.VITE_FX_PROVIDER || "exchangerate_host")
    .toString()
    .toLowerCase()
    .trim();

  const httpProvider = new ExchangerateHostProvider();
  const chainlinkProvider = new ChainlinkFxProvider();

  if (mode === "chainlink" || mode === "mixed") {
    return new CombinedFxProvider(httpProvider, chainlinkProvider);
  }

  // Default: pure HTTP FX API for testing & development
  return httpProvider;
}

