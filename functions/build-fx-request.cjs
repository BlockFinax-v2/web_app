// Node script to build CBOR-encoded request data (hex) for the
// Chainlink Functions FX median source (`fx-median-source.js`).
//
// Usage:
//   1) Configure `web_app/.env` with:
//      - PRIVATE_KEY
//      - RPC_URL               (for the network where your Functions subscription lives)
//      - FUNCTIONS_ROUTER_ADDRESS
//      - DON_ID
//      - GATEWAY_URLS          (comma-separated)
//      - SUBSCRIPTION_ID       (not used here, only for cost estimation / sending txs)
//      - FASTFOREX_API_KEY
//      - EXCHANGERATE_HOST_ACCESS_KEY
//      - EXCHANGERATE_API_KEY
//   2) Run:
//        cd web_app
//        node functions/build-fx-request.cjs GHS
//      or set CURRENCY_CODE in env and run without arg.
//   3) Copy the printed `requestDataHex` into the Hedge UI
//      "Request rate via Chainlink & settle" input.

const fs = require("fs");
const path = require("path");
const {
  SecretsManager,
  simulateScript,
  ReturnType,
  decodeResult,
  buildRequestCBOR,
  Location,
  CodeLanguage,
} = require("@chainlink/functions-toolkit");
// Toolkit expects ethers v5 signer; web_app uses ethers v6
const ethers5 = require("ethers5");

// Load plain .env from web_app root (@chainlink/env-enc expects .env.enc, not .env)
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

async function main() {
  const currencyCodeFromArg = process.argv[2];
  const currencyCodeEnv = process.env.CURRENCY_CODE;
  const currencyCode = currencyCodeFromArg || currencyCodeEnv;

  if (!currencyCode) {
    throw new Error(
      "Missing currency code. Pass it as CLI arg (e.g. `node functions/build-fx-request.cjs GHS`) or set CURRENCY_CODE in web_app/.env"
    );
  }

  // 1) Load JS source executed by the DON
  const sourcePath = path.resolve(__dirname, "fx-median-source.js");
  const source = fs.readFileSync(sourcePath).toString();

  // 2) Prepare secrets for the three FX APIs (names must match fx-median-source.js)
  const secrets = {
    fastForexApiKey: process.env.FASTFOREX_API_KEY || "",
    exchangerateHostKey: process.env.EXCHANGERATE_HOST_ACCESS_KEY || "",
    exchangerateApiKey: process.env.EXCHANGERATE_API_KEY || "",
  };

  if (!secrets.fastForexApiKey || !secrets.exchangerateHostKey || !secrets.exchangerateApiKey) {
    throw new Error(
      "Missing one or more FX API keys. Ensure FASTFOREX_API_KEY, EXCHANGERATE_HOST_ACCESS_KEY and EXCHANGERATE_API_KEY are set in web_app/.env"
    );
  }

  // 3) Simulate script off-chain for the given currency to verify everything works
  console.log(`\nSimulating fx-median-source.js for currency: ${currencyCode} ...`);

  const simulation = await simulateScript({
    source,
    args: [currencyCode],
    bytesArgs: [],
    secrets,
  });

  if (simulation.errorString) {
    console.error("❌ Error during simulation:", simulation.errorString);
    if (simulation.capturedTerminalOutput) {
      console.error("\nCaptured output:\n", simulation.capturedTerminalOutput);
    }
    throw new Error("Simulation failed. Fix the error above before building requestDataHex.");
  }

  if (simulation.responseBytesHexstring) {
    const decoded = decodeResult(simulation.responseBytesHexstring, ReturnType.uint256);
    console.log(`✅ Simulation median rate (6 decimals, uint256): ${decoded.toString()}`);
  } else {
    console.warn("Simulation returned no response bytes.");
  }

  // 4) Initialize signer (network where your Functions subscription + router live)
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL;
  const routerAddress = process.env.FUNCTIONS_ROUTER_ADDRESS;
  const donId = process.env.DON_ID;
  const gatewayUrlsEnv = process.env.GATEWAY_URLS || "";

  if (!privateKey) throw new Error("PRIVATE_KEY is not set in web_app/.env");
  if (!rpcUrl) throw new Error("RPC_URL is not set in web_app/.env");
  if (!routerAddress) throw new Error("FUNCTIONS_ROUTER_ADDRESS is not set in web_app/.env");
  if (!donId) throw new Error("DON_ID is not set in web_app/.env");
  if (!gatewayUrlsEnv) throw new Error("GATEWAY_URLS is not set in web_app/.env");

  const gatewayUrls = gatewayUrlsEnv
    .split(",")
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  if (gatewayUrls.length === 0) {
    throw new Error("GATEWAY_URLS is empty after parsing. Provide at least one gateway URL.");
  }

  const provider = new ethers5.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers5.Wallet(privateKey, provider);

  // 5) Upload secrets as DON-hosted encrypted secrets
  const secretsManager = new SecretsManager({
    signer: wallet,
    functionsRouterAddress: routerAddress,
    donId,
  });
  await secretsManager.initialize();

  console.log("\nEncrypting and uploading secrets to DON gateways...");
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  const slotIdNumber = 0;
  const expirationTimeMinutes = 60;

  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult || uploadResult.error) {
    console.error("❌ Error uploading secrets to DON:", uploadResult?.error || "Unknown error");
    throw new Error("Failed to upload secrets to DON.");
  }

  console.log("✅ Secrets uploaded. Gateway responses:", uploadResult);

  const donHostedSecretsVersion = parseInt(uploadResult.version, 10);
  if (!Number.isFinite(donHostedSecretsVersion)) {
    throw new Error(`Invalid DON-hosted secrets version returned: ${uploadResult.version}`);
  }

  // 6) Build encryptedSecretsReference for DON-hosted secrets
  const encryptedSecretsReference = secretsManager.buildDONHostedEncryptedSecretsReference({
    slotId: slotIdNumber,
    version: donHostedSecretsVersion,
  });

  // 7) Build CBOR-encoded request bytes (hex) for this FX median script
  const requestDataHex = buildRequestCBOR({
    codeLocation: Location.Inline, // inline JS source
    codeLanguage: CodeLanguage.JavaScript,
    source,
    secretsLocation: Location.DONHosted,
    encryptedSecretsReference,
    args: [currencyCode],
    // bytesArgs: [] // unused
  });

  console.log("\n✅ Built CBOR-encoded request data for Chainlink Functions.");
  console.log("Paste this value into the Hedge UI 'Request rate via Chainlink & settle' input:");
  console.log("\nrequestDataHex:", requestDataHex, "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

