// Chainlink Functions source: FX median rate from 3 APIs (USD/base pair).
// Args: [currencyCode] e.g. "GHS" for USD/GHS.
// Secrets: fastForexApiKey, exchangerateHostKey, exchangerateApiKey (DON-hosted).
// Returns: Functions.encodeUint256(Math.round(medianRate * 1e6)) for 6-decimal rate.

const currencyCode = args[0];
if (!currencyCode || typeof currencyCode !== "string") {
  throw new Error("args[0] must be a currency code (e.g. GHS)");
}

const fastForexRequest = Functions.makeHttpRequest({
  url: "https://api.fastforex.io/fetch-all",
  headers: {
    "X-API-Key": secrets.fastForexApiKey || "",
    "Content-Type": "application/json",
  },
});

const exchangerateHostRequest = Functions.makeHttpRequest({
  url: `https://api.exchangerate.host/live?source=USD&currencies=${encodeURIComponent(currencyCode)}&access_key=${secrets.exchangerateHostKey || ""}`,
  headers: { "Accept": "application/json" },
});

const exchangerateApiKey = secrets.exchangerateApiKey || "";
const exchangerateApiRequest = Functions.makeHttpRequest({
  url: `https://v6.exchangerate-api.com/v6/${exchangerateApiKey}/latest/USD`,
  headers: { "Accept": "application/json" },
});

const [fastForexResponse, exchangerateHostResponse, exchangerateApiResponse] =
  await Promise.all([fastForexRequest, exchangerateHostRequest, exchangerateApiRequest]);

const rates = [];

if (!fastForexResponse.error && fastForexResponse.data?.results?.[currencyCode] != null) {
  const n = Number(fastForexResponse.data.results[currencyCode]);
  if (Number.isFinite(n) && n > 0) rates.push(n);
} else {
  console.log("FastForex Error");
}

const usdPrefix = "USD";
if (!exchangerateHostResponse.error && exchangerateHostResponse.data?.quotes) {
  const key = usdPrefix + currencyCode;
  const val = exchangerateHostResponse.data.quotes[key];
  if (val != null) {
    const n = Number(val);
    if (Number.isFinite(n) && n > 0) rates.push(n);
  }
} else {
  console.log("exchangerate.host Error");
}

if (!exchangerateApiResponse.error && exchangerateApiResponse.data?.conversion_rates?.[currencyCode] != null) {
  const n = Number(exchangerateApiResponse.data.conversion_rates[currencyCode]);
  if (Number.isFinite(n) && n > 0) rates.push(n);
} else {
  console.log("exchangerate-api Error");
}

if (rates.length < 2) {
  throw new Error("At least 2 API sources required for median");
}

const sorted = [...rates].sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const medianRate = sorted.length % 2 === 0
  ? (sorted[mid - 1] + sorted[mid]) / 2
  : sorted[mid];

// 6 decimals (same as hedge contract PRECISION)
return Functions.encodeUint256(Math.round(medianRate * 1e6));
