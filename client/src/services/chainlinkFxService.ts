/**
 * Chainlink Functions FX oracle service (Phase 2).
 * Calls the Diamond's ChainlinkFxOracleFacet: sendRequestFxRate, getLastFulfilledRate.
 * Request data (CBOR) must be built off-chain (backend or script with @chainlink/functions-toolkit).
 */
import { ethers } from "ethers";
import {
  smartContractTransactionService,
  type WalletNetwork,
} from "./smartContractTransactionService";
import { getHedgeDiamondAddress } from "./hedgeService";
import {
  getChainlinkFunctionsConfig,
  isChainlinkFunctionsSupported,
} from "@/config/chainlinkFunctions";
import { NETWORK_CONFIGS } from "@/config/alchemyAccount";

const DIAMOND_ADDRESSES: { [chainId: number]: string } = {
  11155111: "0xA4d19a7b133d2A9fAce5b1ad407cA7b9D4Ee9284",
  4202: "0xe133cd2ee4d835ac202942baff2b1d6d47862d34",
  84532: "0xb899a968e785dd721dbc40e71e2faed7b2d84711",
};

const CHAINLINK_FX_ABI = [
  "function sendRequestFxRate(uint256 eventId,string currencyCode,bytes requestData,uint32 callbackGasLimit,bytes32 donId) external returns (bytes32 requestId)",
  "function getLastFulfilledRate(bytes32 currencyKey) view returns (uint256)",
  "function getPendingFxRequest(bytes32 requestId) view returns (uint256 eventId, bytes32 currencyKey)",
  "function getChainlinkFunctionsConfig() view returns (address router, uint64 subscriptionId)",
  "event RequestSent(bytes32 indexed requestId)",
  "event RequestFulfilled(bytes32 indexed requestId, uint256 eventId, bytes32 currencyKey, uint256 rate)",
];

const DEFAULT_CALLBACK_GAS_LIMIT = 300000;

function getWalletNetwork(chainId: number): WalletNetwork {
  const config = NETWORK_CONFIGS[chainId];
  if (!config) throw new Error(`Unsupported network: ${chainId}`);
  const idMap: Record<number, string> = {
    11155111: "ethereum-sepolia",
    4202: "lisk-sepolia",
    84532: "base-sepolia",
  };
  return {
    id: idMap[chainId] || `chain-${chainId}`,
    name: config.name,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    explorerUrl: config.explorerUrl,
    symbol: config.symbol ?? config.nativeCurrency?.symbol ?? "ETH",
  };
}

export function isChainlinkFxSupported(chainId: number): boolean {
  return isChainlinkFunctionsSupported(chainId);
}

export function getChainlinkFxConfig(chainId: number) {
  return getChainlinkFunctionsConfig(chainId);
}

/**
 * Currency code to bytes32 (keccak256(abi.encodePacked(currencyCode))).
 */
export function currencyKey(currencyCode: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(currencyCode));
}

/**
 * Last fulfilled rate for a currency (6 decimals). Returns 0 if none.
 */
export async function getLastFulfilledRate(
  chainId: number,
  currencyCode: string
): Promise<string> {
  const diamond = DIAMOND_ADDRESSES[chainId] ?? getHedgeDiamondAddress(chainId);
  const config = NETWORK_CONFIGS[chainId];
  if (!config?.rpcUrl) throw new Error(`No RPC for chainId ${chainId}`);
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, {
    name: config.name,
    chainId: config.chainId,
  });
  const contract = new ethers.Contract(diamond, CHAINLINK_FX_ABI, provider);
  const key = currencyKey(currencyCode);
  const rate = await contract.getLastFulfilledRate(key);
  return ethers.formatUnits(rate, 6);
}

/**
 * Send a Chainlink Functions request for FX rate; optionally settle the event on fulfillment.
 * requestDataHex: CBOR-encoded request bytes as hex (from backend or script with @chainlink/functions-toolkit).
 */
export async function sendRequestFxRate(
  privateKey: string,
  chainId: number,
  params: {
    eventId: number;
    currencyCode: string;
    requestDataHex: string;
    callbackGasLimit?: number;
  }
): Promise<{ requestId: string; txHash: string }> {
  if (!isChainlinkFunctionsSupported(chainId)) {
    throw new Error(`Chainlink Functions not supported on chainId ${chainId}. Use Base Sepolia or Ethereum Sepolia.`);
  }
  const cfg = getChainlinkFunctionsConfig(chainId)!;
  const diamond = DIAMOND_ADDRESSES[chainId] ?? getHedgeDiamondAddress(chainId);
  const requestData = ethers.getBytes(params.requestDataHex.startsWith("0x") ? params.requestDataHex : "0x" + params.requestDataHex);
  const donIdBytes = ethers.toUtf8Bytes(cfg.donId);
  const donIdPadded = new Uint8Array(32);
  donIdPadded.set(donIdBytes);
  const donIdBytes32 = ethers.hexlify(donIdPadded);
  const gasLimit = params.callbackGasLimit ?? DEFAULT_CALLBACK_GAS_LIMIT;

  const network = getWalletNetwork(chainId);
  const result = await smartContractTransactionService.executeTransaction({
    contractAddress: diamond,
    abi: CHAINLINK_FX_ABI,
    functionName: "sendRequestFxRate",
    args: [
      BigInt(params.eventId),
      params.currencyCode,
      requestData,
      gasLimit,
      donIdBytes32,
    ],
    network,
    privateKey,
  });

  if (!result.success || !result.txHash) {
    throw new Error(result.error ?? "Transaction failed");
  }

  const config = NETWORK_CONFIGS[chainId];
  const provider = new ethers.JsonRpcProvider(config.rpcUrl, { chainId: config.chainId });
  const receipt = await provider.getTransactionReceipt(result.txHash);
  const iface = new ethers.Interface(CHAINLINK_FX_ABI);
  const requestSentTopic = iface.getEvent("RequestSent")?.topicHash;
  const log = receipt?.logs?.find((l: { topics: string[] }) => l.topics[0] === requestSentTopic);
  let requestId = "0x0000000000000000000000000000000000000000000000000000000000000000";
  if (log && log.topics[1]) requestId = log.topics[1];

  return { requestId, txHash: result.txHash };
}
