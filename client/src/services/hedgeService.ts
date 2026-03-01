import { ethers } from "ethers";
import {
  smartContractTransactionService,
  type WalletNetwork,
} from "./smartContractTransactionService";
import {
  EventWithStats,
  HedgeEvent,
  HedgeLpDeposit,
  HedgePosition,
  HedgePositionStatus,
} from "@/components/hedge/types";
import { NETWORK_CONFIGS, getStablecoinAddress } from "@/config/alchemyAccount";

// Diamond addresses per chain (same as other services)
const DIAMOND_ADDRESSES: { [chainId: number]: string } = {
  11155111: "0xA4d19a7b133d2A9fAce5b1ad407cA7b9D4Ee9284", // Ethereum Sepolia
  4202: "0xe133cd2ee4d835ac202942baff2b1d6d47862d34", // Lisk Sepolia
  84532: "0xb899a968e785dd721dbc40e71e2faed7b2d84711", // Base Sepolia
};

// P2PHedgingFacet ABI (minimal, string-based for viem/ethers interop)
const HEDGE_FACET_ABI = [
  // Creator
  "function createHedgeEvent(address tokenAddress,string name,string underlying,uint256 strike,uint256 premiumRate,uint256 payoutRate,uint256 expiryDate,bool poolOpen,bool allowExternalLp,uint256 initialLiquidity) external",
  "function setHedgePoolSettings(uint256 eventId,bool poolOpen,bool allowExternalLp) external",
  "function withdrawHedgeCreatorEarnings(uint256 eventId) external",

  // LP
  "function depositHedgeLiquidity(uint256 eventId,uint256 amount) external",
  "function claimHedgePremiums(uint256 depositId) external",
  "function withdrawHedgeCapital(uint256 depositId) external",

  // Hedger
  "function buyHedgeProtection(uint256 eventId,uint256 notional) external",
  "function claimHedgePayout(uint256 positionId) external",

  // Oracle admin
  "function settleHedgeEvent(uint256 eventId,uint256 settlementPrice) external",

  // Views
  "function getHedgeEventIds() external view returns (uint256[] memory)",
  "function getHedgeEventCore(uint256 eventId) external view returns (uint256,address,address,string memory,string memory,uint256,uint256,uint256,uint256,uint8,uint256,bool,bool,bool)",
  "function getHedgeEventStats(uint256 eventId) external view returns (uint256,uint256,uint256,uint256,uint256,uint256)",
  "function getHedgePoolUtilization(uint256 eventId) external view returns (uint256,uint256,uint256,uint256)",
  "function getHedgeHedgerPositionIds(address hedger) external view returns (uint256[] memory)",
  "function getHedgeLpDepositIds(address lp) external view returns (uint256[] memory)",
  "function getHedgePosition(uint256 positionId) external view returns (uint256,uint256,address,uint256,uint256,uint256,uint256,uint8,bool)",
  "function getHedgeLpDeposit(uint256 depositId) external view returns (uint256,uint256,address,uint256,uint256,uint256,uint256,bool)",
  "function getHedgeSupportedTokens() external view returns (address[] memory)",
];

export function getHedgeDiamondAddress(chainId: number): string {
  const addr = DIAMOND_ADDRESSES[chainId];
  if (!addr) {
    throw new Error(`Hedge not deployed on chainId ${chainId}`);
  }
  return addr;
}

function getWalletNetwork(chainId: number): WalletNetwork {
  const config = NETWORK_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  // Map numeric chain IDs to string IDs used by AA config
  const idMap: Record<number, string> = {
    11155111: "ethereum-sepolia",
    4202: "lisk-sepolia",
    84532: "base-sepolia",
  };

  const id = idMap[chainId] || `chain-${chainId}`;

  return {
    id,
    name: config.name,
    chainId: config.chainId,
    rpcUrl: config.rpcUrl,
    explorerUrl: config.explorerUrl,
    symbol: config.symbol || config.nativeCurrency?.symbol || "ETH",
  };
}

function getProvider(chainId: number): ethers.JsonRpcProvider {
  const config = NETWORK_CONFIGS[chainId];
  if (!config?.rpcUrl) {
    throw new Error(`No RPC URL configured for chainId ${chainId}`);
  }
  return new ethers.JsonRpcProvider(config.rpcUrl, {
    name: config.name,
    chainId: config.chainId,
  });
}

function toDecimalString(value: bigint, decimals = 6): string {
  return ethers.formatUnits(value, decimals);
}

function toNumber(value: bigint, decimals = 6): number {
  return Number(ethers.formatUnits(value, decimals));
}

function mapEventStatus(status: number): "open" | "settled" | "expired" {
  switch (status) {
    case 0:
      return "open";
    case 1:
      return "settled";
    case 2:
      return "expired";
    default:
      return "open";
  }
}

function mapPositionStatus(status: number): HedgePositionStatus {
  switch (status) {
    case 0:
      return "active";
    case 1:
      return "settled_win";
    case 2:
      return "settled_loss";
    case 3:
      return "claimable";
    case 4:
      return "expired";
    case 5:
      return "claimed";
    default:
      return "active";
  }
}

class HedgeService {
  private static instance: HedgeService;

  public static getInstance(): HedgeService {
    if (!HedgeService.instance) {
      HedgeService.instance = new HedgeService();
    }
    return HedgeService.instance;
  }

  // -------- READ --------

  public async getAllEvents(chainId: number): Promise<EventWithStats[]> {
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(
      getHedgeDiamondAddress(chainId),
      HEDGE_FACET_ABI,
      provider,
    );

    const ids: bigint[] = await contract.getHedgeEventIds();
    const events: EventWithStats[] = [];

    for (const idBig of ids) {
      const id = Number(idBig);
      if (!Number.isFinite(id)) continue;

      const core = await contract.getHedgeEventCore(id);
      const stats = await contract.getHedgeEventStats(id);
      const util = await contract.getHedgePoolUtilization(id);

      const evt: HedgeEvent = {
        id,
        creator: core[1],
        tokenAddress: core[2],
        name: core[3],
        underlying: core[4],
        strike: toDecimalString(core[5]),
        premiumRate: toDecimalString(core[6]),
        payoutRate: toDecimalString(core[7]),
        expiryDate: new Date(Number(core[8]) * 1000).toISOString(),
        status: mapEventStatus(core[9]),
        settlementPrice:
          core[10] > 0n ? toDecimalString(core[10]) : undefined,
        triggered: Boolean(core[11]),
        poolOpen: Boolean(core[12]),
        allowExternalLp: Boolean(core[13]),
        safetyFactor: "1.00",
      };

      const poolStats = {
        totalLiquidity: toNumber(stats[0]),
        totalExposure: toNumber(stats[1]),
        totalPremiums: toNumber(stats[2]),
        lpCount: Number(stats[4]),
        hedgerCount: Number(stats[5]),
        availableCapacity: toNumber(util[2]),
        utilization: Number(util[3]),
      };

      events.push({ ...evt, poolStats });
    }

    // Sort by id descending (most recent first)
    events.sort((a, b) => b.id - a.id);
    return events;
  }

  public async getUserPositions(
    chainId: number,
    hedgerAddress: string,
  ): Promise<HedgePosition[]> {
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(
      getHedgeDiamondAddress(chainId),
      HEDGE_FACET_ABI,
      provider,
    );

    const ids: bigint[] = await contract.getHedgeHedgerPositionIds(
      hedgerAddress,
    );
    const positions: HedgePosition[] = [];

    for (const idBig of ids) {
      const id = Number(idBig);
      if (!Number.isFinite(id)) continue;
      const p = await contract.getHedgePosition(id);

      positions.push({
        id,
        eventId: Number(p[1]),
        hedger: p[2],
        notional: toDecimalString(p[3]),
        premiumPaid: toDecimalString(p[4]),
        platformFeePaid: toDecimalString(p[5]),
        maxPayout: toDecimalString(p[6]),
        payoutAmount: toDecimalString(p[7]),
        status: mapPositionStatus(Number(p[8])),
        claimed: Boolean(p[9]),
      });
    }

    // Most recent first
    positions.sort((a, b) => b.id - a.id);
    return positions;
  }

  public async getUserLpDeposits(
    chainId: number,
    lpAddress: string,
  ): Promise<HedgeLpDeposit[]> {
    const provider = getProvider(chainId);
    const contract = new ethers.Contract(
      getHedgeDiamondAddress(chainId),
      HEDGE_FACET_ABI,
      provider,
    );

    const ids: bigint[] = await contract.getHedgeLpDepositIds(lpAddress);
    const deposits: HedgeLpDeposit[] = [];

    for (const idBig of ids) {
      const id = Number(idBig);
      if (!Number.isFinite(id)) continue;
      const d = await contract.getHedgeLpDeposit(id);

      deposits.push({
        id,
        eventId: Number(d[1]),
        lp: d[2],
        amount: toDecimalString(d[3]),
        shares: ethers.formatUnits(d[4], 18),
        premiumsEarned: toDecimalString(d[5]),
        premiumsWithdrawn: toDecimalString(d[6]),
        withdrawn: Boolean(d[7]),
      });
    }

    deposits.sort((a, b) => b.id - a.id);
    return deposits;
  }

  // -------- WRITE HELPERS --------

  private getStablecoinForChain(chainId: number): string {
    const idMap: Record<number, string> = {
      11155111: "ethereum-sepolia",
      4202: "lisk-sepolia",
      84532: "base-sepolia",
    };
    const networkKey = idMap[chainId];
    if (!networkKey) {
      throw new Error(`No stablecoin config for chainId ${chainId}`);
    }
    const addr = getStablecoinAddress(networkKey, "USDC");
    if (!addr) {
      throw new Error(`USDC not configured for network ${networkKey}`);
    }
    return addr;
  }

  // -------- WRITE (AA + EOA via SmartContractTransactionService) --------

  public async createHedgeEvent(
    privateKey: string,
    chainId: number,
    params: {
      name: string;
      underlying: string;
      strike: string; // e.g. "16.5"
      premiumRate: string; // percent, e.g. "2.5"
      payoutRate: string; // percent, e.g. "30"
      expiryDays: string; // "30"
      initialLiquidity: string; // USD amount, e.g. "100"
      poolOpen: boolean;
      allowExternalLp: boolean;
    },
  ) {
    const network = getWalletNetwork(chainId);
    const tokenAddress = this.getStablecoinForChain(chainId);

    const strike = ethers.parseUnits(params.strike || "0", 6);
    const premiumRate = ethers.parseUnits(
      ((Number(params.premiumRate) || 0) / 100).toFixed(6),
      6,
    );
    const payoutRate = ethers.parseUnits(
      ((Number(params.payoutRate) || 0) / 100).toFixed(6),
      6,
    );
    const seconds = Number(params.expiryDays || "30") * 24 * 60 * 60;
    const expiry = BigInt(Math.floor(Date.now() / 1000) + seconds);
    const initialLiquidity = ethers.parseUnits(
      params.initialLiquidity || "0",
      6,
    );

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "createHedgeEvent",
      args: [
        tokenAddress,
        params.name,
        params.underlying,
        strike,
        premiumRate,
        payoutRate,
        expiry,
        params.poolOpen,
        params.allowExternalLp,
        initialLiquidity,
      ],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "event_create",
        description: `Create hedge event ${params.name} (${params.underlying})`,
        amount: params.initialLiquidity,
        tokenSymbol: "USDC",
        tokenAddress,
      },
    });
  }

  public async depositLiquidity(
    privateKey: string,
    chainId: number,
    params: { eventId: number; amount: string },
  ) {
    const network = getWalletNetwork(chainId);
    const amount = ethers.parseUnits(params.amount || "0", 6);

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "depositHedgeLiquidity",
      args: [params.eventId, amount],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "lp_deposit",
        description: `Deposit liquidity into hedge event #${params.eventId}`,
        amount: params.amount,
        tokenSymbol: "USDC",
      },
    });
  }

  public async buyProtection(
    privateKey: string,
    chainId: number,
    params: { eventId: number; notional: string },
  ) {
    const network = getWalletNetwork(chainId);
    const notional = ethers.parseUnits(params.notional || "0", 6);

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "buyHedgeProtection",
      args: [params.eventId, notional],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "buy_protection",
        description: `Buy protection on event #${params.eventId}`,
        amount: params.notional,
        tokenSymbol: "USDC",
      },
    });
  }

  public async settleEvent(
    privateKey: string,
    chainId: number,
    params: { eventId: number; settlementPrice: string },
  ) {
    const network = getWalletNetwork(chainId);
    const settlementPrice = ethers.parseUnits(
      params.settlementPrice || "0",
      6,
    );

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "settleHedgeEvent",
      args: [params.eventId, settlementPrice],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "event_settle",
        description: `Settle hedge event #${params.eventId}`,
      },
    });
  }

  public async claimPayout(
    privateKey: string,
    chainId: number,
    positionId: number,
  ) {
    const network = getWalletNetwork(chainId);

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "claimHedgePayout",
      args: [positionId],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "claim_payout",
        description: `Claim hedge payout for position #${positionId}`,
      },
    });
  }

  public async withdrawCapital(
    privateKey: string,
    chainId: number,
    depositId: number,
  ) {
    const network = getWalletNetwork(chainId);

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "withdrawHedgeCapital",
      args: [depositId],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "lp_withdraw",
        description: `Withdraw hedge liquidity for deposit #${depositId}`,
      },
    });
  }

  public async claimPremiums(
    privateKey: string,
    chainId: number,
    depositId: number,
  ) {
    const network = getWalletNetwork(chainId);

    return smartContractTransactionService.executeTransaction({
      contractAddress: getHedgeDiamondAddress(chainId),
      abi: HEDGE_FACET_ABI,
      functionName: "claimHedgePremiums",
      args: [depositId],
      network,
      privateKey,
      transactionMetadata: {
        category: "hedge",
        type: "lp_claim_premiums",
        description: `Claim hedge premiums for deposit #${depositId}`,
      },
    });
  }
}

export const hedgeService = HedgeService.getInstance();

