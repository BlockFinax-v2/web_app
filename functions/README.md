# Chainlink Functions — FX median source

This folder contains the JavaScript source run by the Chainlink DON to fetch a median FX rate from three APIs (FastForex, exchangerate.host, exchangerate-api).

## Usage

- **Args:** `[currencyCode]` e.g. `"GHS"` for USD/GHS.
- **Secrets (DON-hosted):** `fastForexApiKey`, `exchangerateHostKey`, `exchangerateApiKey`.
- **Return:** `Functions.encodeUint256(Math.round(medianRate * 1e6))` (6 decimals).

## Getting request data (hex) for the web app

To use "Request rate & settle" in the Settle dialog you need the CBOR-encoded request bytes (hex). Options:

1. **Backend:** Implement an endpoint that uses `@chainlink/functions-toolkit` to load `fx-median-source.js`, upload secrets (API keys), encode the request with `FunctionsRequest.encodeCBOR()`, and return the hex. The frontend then calls the Diamond’s `sendRequestFxRate(eventId, currencyCode, requestDataHex, ...)`.

2. **Node script:** Run a script (with API keys in env) that uses the toolkit to simulate, upload secrets, encode, and either send the tx to the Diamond or output the request data hex for pasting in the UI.

Example (pseudo) with the toolkit:

- Load source from `fx-median-source.js`.
- Build secrets: `{ fastForexApiKey, exchangerateHostKey, exchangerateApiKey }`.
- Upload secrets to DON (e.g. `SecretsManager.uploadEncryptedSecretsToDON`), get slot + version.
- Build request with `FunctionsRequest` (inline JS, DON-hosted secrets slot/version, args `[currencyCode]`), then `encodeCBOR()`.
- Either send the tx to the Diamond’s `sendRequestFxRate` with that bytes, or return the hex to the user.

## Minimum sources

At least 2 of the 3 APIs must return a valid rate; otherwise the source throws and the request fails.
