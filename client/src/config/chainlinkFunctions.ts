/**
 * Chainlink Functions config for FX oracle (Phase 2).
 * Only networks where Chainlink Functions is supported (Base Sepolia, Ethereum Sepolia).
 * Lisk Sepolia is not supported — use admin-posted settlement there.
 */
export interface ChainlinkFunctionsConfig {
  functionsRouterAddress: string;
  donId: string;
  donIdBytes32: string; // for contract call
  gatewayUrls: string[];
  linkTokenAddress: string;
}

const BASE_SEPOLIA: ChainlinkFunctionsConfig = {
  functionsRouterAddress: "0xf9B8fc078197181C841c296C876945aaa425B278",
  donId: "fun-base-sepolia-1",
  donIdBytes32: "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000",
  gatewayUrls: [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ],
  linkTokenAddress: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
};

const ETHEREUM_SEPOLIA: ChainlinkFunctionsConfig = {
  functionsRouterAddress: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
  donId: "fun-ethereum-sepolia-1",
  donIdBytes32: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
  gatewayUrls: [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ],
  linkTokenAddress: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Ethereum Sepolia LINK
};

export const CHAINLINK_FUNCTIONS_CONFIG: Record<number, ChainlinkFunctionsConfig> = {
  84532: BASE_SEPOLIA,
  11155111: ETHEREUM_SEPOLIA,
};

export function getChainlinkFunctionsConfig(chainId: number): ChainlinkFunctionsConfig | null {
  return CHAINLINK_FUNCTIONS_CONFIG[chainId] ?? null;
}

export function isChainlinkFunctionsSupported(chainId: number): boolean {
  return chainId in CHAINLINK_FUNCTIONS_CONFIG;
}
