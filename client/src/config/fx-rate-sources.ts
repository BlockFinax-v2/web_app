/**
 * Pluggable FX rate API sources for the Rates tab.
 * Add new APIs by adding an entry to FX_RATE_SOURCES and the corresponding env var.
 * Used only for offline median aggregation (no Chainlink / LINK).
 */

const BASE = "USD";

/**
 * Target currency codes (ISO 4217). Used to request rates from APIs that need
 * an explicit list (e.g. exchangerate.host). Derived from exchangerate-api supported set.
 * Order preserved for stable display; add new codes at the end when expanding.
 */
export const TARGET_CURRENCY_CODES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
  "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLF", "CLP",
  "CNH", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP",
  "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL",
  "GGP", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK",
  "HTG", "HUF", "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP",
  "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD",
  "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL",
  "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN",
  "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB",
  "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB",
  "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL",
  "SOS", "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND",
  "TOP", "TRY", "TTD", "TVD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS",
  "VES", "VND", "VUV", "WST", "XAF", "XCD", "XCG", "XDR", "XOF", "XPF",
  "YER", "ZAR", "ZMW", "ZWG", "ZWL",
] as const;

export type CurrencyCode = (typeof TARGET_CURRENCY_CODES)[number];

export type AuthConfig =
  | { type: "header"; key: string; envVar: string }
  | { type: "query"; param: string; envVar: string }
  | { type: "path"; envVar: string }; // key in URL path (e.g. exchangerate-api)

export type ResponseParser = (json: unknown) => Record<string, number>;

export interface FxRateSourceConfig {
  id: string;
  name: string;
  enabled: boolean;
  /** Builds the fetch URL. For path auth, replace placeholder with key from env. */
  getUrl: (currencyCodes?: string[]) => string;
  auth: AuthConfig;
  /** Extracts Record<currencyCode, rate> from API response (base USD). */
  parseResponse: ResponseParser;
}

function getEnv(key: string): string {
  const v = import.meta.env[key];
  return typeof v === "string" ? v.trim() : "";
}

/** FastForex: GET fetch-all, header X-API-Key. Response .results = { AED: 3.67, ... } */
const fastForexParser: ResponseParser = (json) => {
  const o = json as { results?: Record<string, number> };
  if (!o?.results || typeof o.results !== "object") return {};
  const out: Record<string, number> = {};
  for (const [code, rate] of Object.entries(o.results)) {
    if (code === BASE) continue;
    const n = Number(rate);
    if (Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
};

/** exchangerate.host: .quotes = { USDNGN: 1362, USDGHS: 10.64, ... } */
const exchangerateHostParser: ResponseParser = (json) => {
  const o = json as { quotes?: Record<string, number> };
  if (!o?.quotes || typeof o.quotes !== "object") return {};
  const prefix = "USD";
  const out: Record<string, number> = {};
  for (const [key, rate] of Object.entries(o.quotes)) {
    if (!key.startsWith(prefix) || key.length <= prefix.length) continue;
    const code = key.slice(prefix.length);
    const n = Number(rate);
    if (Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
};

/** exchangerate-api v6: .conversion_rates = { USD: 1, AED: 3.67, ... } */
const exchangerateApiParser: ResponseParser = (json) => {
  const o = json as { conversion_rates?: Record<string, number> };
  if (!o?.conversion_rates || typeof o.conversion_rates !== "object") return {};
  const out: Record<string, number> = {};
  for (const [code, rate] of Object.entries(o.conversion_rates)) {
    if (code === BASE) continue;
    const n = Number(rate);
    if (Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
};

export const FX_RATE_SOURCES: FxRateSourceConfig[] = [
  {
    id: "fastforex",
    name: "FastForex",
    enabled: true,
    getUrl: () => "https://api.fastforex.io/fetch-all",
    auth: { type: "header", key: "X-API-Key", envVar: "VITE_FASTFOREX_API_KEY" },
    parseResponse: fastForexParser,
  },
  {
    id: "exchangerate_host",
    name: "exchangerate.host",
    enabled: true,
    getUrl: (codes) => {
      const list = (codes ?? TARGET_CURRENCY_CODES).join(",");
      const key = getEnv("VITE_EXCHANGERATE_HOST_ACCESS_KEY");
      return `https://api.exchangerate.host/live?source=USD&currencies=${encodeURIComponent(list)}&access_key=${key}`;
    },
    auth: { type: "query", param: "access_key", envVar: "VITE_EXCHANGERATE_HOST_ACCESS_KEY" },
    parseResponse: exchangerateHostParser,
  },
  {
    id: "exchangerate_api",
    name: "exchangerate-api",
    enabled: true,
    getUrl: () => {
      const key = getEnv("VITE_EXCHANGERATE_API_KEY");
      return `https://v6.exchangerate-api.com/v6/${key}/latest/USD`;
    },
    auth: { type: "path", envVar: "VITE_EXCHANGERATE_API_KEY" },
    parseResponse: exchangerateApiParser,
  },
];

/** Sources that are enabled and have their env key set. */
export function getActiveSources(): FxRateSourceConfig[] {
  return FX_RATE_SOURCES.filter((s) => {
    if (!s.enabled) return false;
    const key = getEnv(s.auth.envVar);
    return key.length > 0;
  });
}

export function getCurrencyListForRequest(): string[] {
  return [...TARGET_CURRENCY_CODES];
}
