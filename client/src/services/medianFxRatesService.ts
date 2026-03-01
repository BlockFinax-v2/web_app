/**
 * Median FX rates aggregation service.
 * Fetches from all configured APIs in parallel, normalizes to USD base,
 * and computes median per currency. Used by the Rates tab only (no Chainlink).
 */

import {
  getActiveSources,
  getCurrencyListForRequest,
  type FxRateSourceConfig,
} from "@/config/fx-rate-sources";

function getEnv(key: string): string {
  const v = import.meta.env[key];
  return typeof v === "string" ? v.trim() : "";
}

/** Minimum number of sources required to include a currency's median. Increase when you add more APIs. */
function getMinSourcesForMedian(): number {
  const v = getEnv("VITE_RATES_MIN_SOURCES");
  if (!v) return 2;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 1 ? n : 2;
}

export interface MedianRateEntry {
  pair: string;
  currency: string;
  median: number;
  sources: string[];
  sourceCount: number;
  /** Per-source rate for tooltip (source id -> rate) */
  bySource: Record<string, number>;
}

export interface MedianFxRatesResult {
  rates: Record<string, MedianRateEntry>;
  pairs: string[];
  lastUpdated: number;
  /** Number of sources that contributed at least one rate */
  sourcesUsed: number;
  /** Total sources configured and active */
  sourcesTotal: number;
}

function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

async function fetchOneSource(
  source: FxRateSourceConfig
): Promise<{ id: string; name: string; rates: Record<string, number> }> {
  const auth = source.auth;
  const key = getEnv(auth.envVar);
  const url =
    source.id === "exchangerate_host"
      ? source.getUrl(getCurrencyListForRequest())
      : source.getUrl();

  const headers: Record<string, string> = {};
  if (auth.type === "header" && key) {
    headers[auth.key] = key;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`${source.name}: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const rates = source.parseResponse(json);
  return { id: source.id, name: source.name, rates };
}

export async function fetchMedianFxRates(): Promise<MedianFxRatesResult> {
  const sources = getActiveSources();
  const lastUpdated = Date.now();

  if (sources.length === 0) {
    return {
      rates: {},
      pairs: [],
      lastUpdated,
      sourcesUsed: 0,
      sourcesTotal: 0,
    };
  }

  const results = await Promise.allSettled(
    sources.map((s) => fetchOneSource(s))
  );

  const byCurrency: Record<
    string,
    { values: number[]; sourceNames: string[]; bySource: Record<string, number> }
  > = {};

  let sourcesUsed = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const source = sources[i]!;
    if (r.status === "rejected") {
      console.warn(`[medianFx] ${source.name} failed:`, r.reason);
      continue;
    }
    sourcesUsed += 1;
    const { id, name, rates } = r.value;
    for (const [code, rate] of Object.entries(rates)) {
      if (!byCurrency[code]) {
        byCurrency[code] = { values: [], sourceNames: [], bySource: {} };
      }
      byCurrency[code].values.push(rate);
      byCurrency[code].sourceNames.push(name);
      byCurrency[code].bySource[id] = rate;
    }
  }

  const rates: Record<string, MedianRateEntry> = {};
  const pairs: string[] = [];
  const minSources = getMinSourcesForMedian();

  for (const [currency, data] of Object.entries(byCurrency)) {
    if (data.values.length < minSources) continue;
    const median = computeMedian(data.values);
    const pair = `USD/${currency}`;
    pairs.push(pair);
    rates[pair] = {
      pair,
      currency,
      median,
      sources: data.sourceNames,
      sourceCount: data.values.length,
      bySource: data.bySource,
    };
  }

  pairs.sort();

  return {
    rates,
    pairs,
    lastUpdated,
    sourcesUsed,
    sourcesTotal: sources.length,
  };
}
