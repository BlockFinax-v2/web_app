/**
 * Diamond Contract Interaction Layer
 *
 * Provides typed managers for Diamond facets deployed on Base Sepolia, Lisk Sepolia, and Base Mainnet.
 * Facets: EscrowFacet, DocumentFacet, LiquidityPoolFacet
 *
 * Exports: escrowManager, documentManager, liquidityPoolManager
 */
import { ethers } from 'ethers';
import { walletManager } from './wallet';
import { fallbackProvider } from './rpc-provider';
import { getNetworkById } from './networks';
import { tokenManager, getTokenBySymbol } from './tokens';

// ─── Diamond Contract Addresses (EIP-2535) ─────────────────────────────────
// Keys match internal network IDs: 1=Base Sepolia, 2=Lisk Sepolia, 10=Base Mainnet
const DIAMOND_ADDRESSES: Record<number, string> = {
  1: "0x2813e4a2Bd8d59A75db298a31e2b71191214F203",
  2: "0x3eDfA00a1E3C158A591097de2FA1756aCD66860D",
  10: "",
};

if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAINNET_DIAMOND_ADDRESS) {
  DIAMOND_ADDRESSES[10] = import.meta.env.VITE_MAINNET_DIAMOND_ADDRESS;
}

function getDiamondAddress(networkId: number): string {
  return DIAMOND_ADDRESSES[networkId] || DIAMOND_ADDRESSES[1];
}

async function getDiamondContract(networkId: number, abi: string[]): Promise<ethers.Contract | null> {
  try {
    const network = getNetworkById(networkId);
    if (!network) return null;

    const provider = await fallbackProvider.getWorkingProvider(network.chainId);
    if (!provider) return null;

    const signer = await walletManager.getSigner(networkId);
    if (!signer) return null;

    return new ethers.Contract(getDiamondAddress(networkId), abi, signer);
  } catch {
    return null;
  }
}

async function getReadOnlyDiamondContract(networkId: number, abi: string[]): Promise<ethers.Contract | null> {
  try {
    const network = getNetworkById(networkId);
    if (!network) return null;

    const provider = await fallbackProvider.getWorkingProvider(network.chainId);
    if (!provider) return null;

    return new ethers.Contract(getDiamondAddress(networkId), abi, provider);
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESCROW FACET
// ═══════════════════════════════════════════════════════════════════════════════

const ESCROW_FACET_ABI = [
  "function createEscrow(address _exporter, address _arbitrator, uint256 _arbitratorFee, uint256 _deadline, string _description, string _termsHash, string[] _milestonesTitles, string[] _milestonesDescriptions, uint256[] _milestonesAmounts, uint256[] _milestonesDueDates, address _tokenAddress) external payable returns (uint256)",
  "function addSubWallet(uint256 _escrowId, address _walletAddress, string _role, string[] _permissions) external",
  "function completeMilestone(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function releaseMilestonePayment(uint256 _escrowId, uint256 _milestoneIndex) external",
  "function raiseDispute(uint256 _escrowId, string _reason) external",
  "function resolveDispute(uint256 _escrowId, uint256[] _milestoneIndexes, bool[] _releaseToExporter) external",
  "function getEscrowDetails(uint256 _escrowId) external view returns (address importer, address exporter, address arbitrator, uint256 totalAmount, uint256 releasedAmount, uint256 arbitratorFee, uint256 deadline, uint8 status, uint8 disputeStatus, string description, string termsHash)",
  "function getMilestone(uint256 _escrowId, uint256 _index) external view returns (string title, string description, uint256 amount, uint256 dueDate, uint8 status, bool released)",
  "function getMilestones(uint256 _escrowId) external view returns (tuple(string title, string description, uint256 amount, uint256 dueDate, uint8 status, bool released)[])",
  "function getSubWallets(uint256 _escrowId) external view returns (address[])",
  "function hasPermission(uint256 _escrowId, address _wallet, string _permission) external view returns (bool)",
  "function getEscrowStats() external view returns (uint256 totalEscrows, uint256 activeEscrows, uint256 completedEscrows)",
  "event EscrowCreated(uint256 indexed escrowId, address indexed importer, address indexed exporter, address arbitrator, uint256 totalAmount)",
  "event MilestoneCompleted(uint256 indexed escrowId, uint256 milestoneIndex)",
  "event MilestoneReleased(uint256 indexed escrowId, uint256 milestoneIndex, uint256 amount)",
  "event DisputeRaised(uint256 indexed escrowId, address indexed initiator, string reason)",
  "event DisputeResolved(uint256 indexed escrowId, address indexed arbitrator)",
  "event SubWalletAdded(uint256 indexed escrowId, address wallet, string role)",
  "event FundsDeposited(uint256 indexed escrowId, uint256 amount)"
];

export enum EscrowStatus { Created, Funded, InProgress, Completed, Disputed, Refunded }
export enum DisputeStatus { None, Raised, InArbitration, Resolved }
export enum MilestoneStatus { Pending, Completed, Released }

export interface EscrowMilestone {
  title: string;
  description: string;
  amount: string;
  dueDate: Date;
  status: MilestoneStatus;
  released: boolean;
}

export interface EscrowDetails {
  importer: string;
  exporter: string;
  arbitrator: string;
  totalAmount: string;
  releasedAmount: string;
  arbitratorFee: string;
  deadline: Date;
  status: EscrowStatus;
  disputeStatus: DisputeStatus;
  description: string;
  termsHash: string;
}

export interface EscrowContract {
  id: number;
  contractAddress: string;
  importer: string;
  exporter: string;
  arbitrator: string;
  totalAmount: string;
  releasedAmount: string;
  arbitratorFee: string;
  currency: string;
  deadline: Date;
  status: EscrowStatus;
  disputeStatus: DisputeStatus;
  description: string;
  termsHash: string;
  milestones: EscrowMilestone[];
  networkId: number;
  subWalletAddress: string;
  subWalletPrivateKey: string;
}

export interface CreateEscrowParams {
  exporterAddress: string;
  arbitratorAddress: string;
  arbitratorFee: string;
  totalAmount: string;
  currency: string;
  deadline: Date;
  description: string;
  termsHash: string;
  milestones: {
    title: string;
    description: string;
    amount: string;
    dueDate: Date;
  }[];
  tokenAddress: string;
  networkId: number;
}

export interface EscrowStats {
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
}

class EscrowManager {
  async createEscrow(params: CreateEscrowParams): Promise<{ escrowId: number; txHash: string; subWallet: { address: string; privateKey: string } }> {
    const subWallet = ethers.Wallet.createRandom();

    const contract = await getDiamondContract(params.networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const milestoneAmounts = params.milestones.map(m => {
      const token = getTokenBySymbol(params.networkId, params.currency);
      const decimals = token?.decimals || 18;
      return ethers.parseUnits(m.amount, decimals);
    });
    const milestoneDueDates = params.milestones.map(m => Math.floor(m.dueDate.getTime() / 1000));

    const token = getTokenBySymbol(params.networkId, params.currency);
    const decimals = token?.decimals || 18;
    const arbitratorFeeWei = ethers.parseUnits(params.arbitratorFee, decimals);

    let value = BigInt(0);
    let tokenAddress = params.tokenAddress;

    if (params.currency === 'ETH' || tokenAddress === ethers.ZeroAddress) {
      tokenAddress = ethers.ZeroAddress;
      const totalMilestones = milestoneAmounts.reduce((a, b) => a + b, BigInt(0));
      value = totalMilestones + arbitratorFeeWei;
    }

    const tx = await contract.createEscrow(
      params.exporterAddress,
      params.arbitratorAddress,
      arbitratorFeeWei,
      Math.floor(params.deadline.getTime() / 1000),
      params.description,
      params.termsHash,
      params.milestones.map(m => m.title),
      params.milestones.map(m => m.description),
      milestoneAmounts,
      milestoneDueDates,
      tokenAddress,
      { value }
    );

    const receipt = await tx.wait();

    let escrowId = 1;
    const escrowCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === 'EscrowCreated';
      } catch {
        return false;
      }
    });
    if (escrowCreatedEvent) {
      const parsed = contract.interface.parseLog(escrowCreatedEvent);
      escrowId = Number(parsed?.args.escrowId || 1);
    }

    return {
      escrowId,
      txHash: tx.hash,
      subWallet: { address: subWallet.address, privateKey: subWallet.privateKey }
    };
  }

  async addSubWallet(escrowId: number, walletAddress: string, role: string, permissions: string[], networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const tx = await contract.addSubWallet(escrowId, walletAddress, role, permissions);
    await tx.wait();
    return tx.hash;
  }

  async completeMilestone(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const tx = await contract.completeMilestone(escrowId, milestoneIndex);
    await tx.wait();
    return tx.hash;
  }

  async releaseMilestonePayment(escrowId: number, milestoneIndex: number, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const tx = await contract.releaseMilestonePayment(escrowId, milestoneIndex);
    await tx.wait();
    return tx.hash;
  }

  async raiseDispute(escrowId: number, reason: string, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const tx = await contract.raiseDispute(escrowId, reason);
    await tx.wait();
    return tx.hash;
  }

  async resolveDispute(escrowId: number, milestoneIndexes: number[], releaseToExporter: boolean[], networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to escrow contract');

    const tx = await contract.resolveDispute(escrowId, milestoneIndexes, releaseToExporter);
    await tx.wait();
    return tx.hash;
  }

  async getEscrowDetails(escrowId: number, networkId: number): Promise<EscrowDetails | null> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return null;

    try {
      const d = await contract.getEscrowDetails(escrowId);
      return {
        importer: d.importer,
        exporter: d.exporter,
        arbitrator: d.arbitrator,
        totalAmount: ethers.formatEther(d.totalAmount),
        releasedAmount: ethers.formatEther(d.releasedAmount),
        arbitratorFee: ethers.formatEther(d.arbitratorFee),
        deadline: new Date(Number(d.deadline) * 1000),
        status: Number(d.status) as EscrowStatus,
        disputeStatus: Number(d.disputeStatus) as DisputeStatus,
        description: d.description,
        termsHash: d.termsHash
      };
    } catch {
      return null;
    }
  }

  async getMilestone(escrowId: number, index: number, networkId: number): Promise<EscrowMilestone | null> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return null;

    try {
      const m = await contract.getMilestone(escrowId, index);
      return {
        title: m.title,
        description: m.description,
        amount: ethers.formatEther(m.amount),
        dueDate: new Date(Number(m.dueDate) * 1000),
        status: Number(m.status) as MilestoneStatus,
        released: m.released
      };
    } catch {
      return null;
    }
  }

  async getMilestones(escrowId: number, networkId: number): Promise<EscrowMilestone[]> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return [];

    try {
      const milestones = await contract.getMilestones(escrowId);
      return milestones.map((m: any) => ({
        title: m.title,
        description: m.description,
        amount: ethers.formatEther(m.amount),
        dueDate: new Date(Number(m.dueDate) * 1000),
        status: Number(m.status) as MilestoneStatus,
        released: m.released
      }));
    } catch {
      return [];
    }
  }

  async getSubWallets(escrowId: number, networkId: number): Promise<string[]> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return [];

    try {
      return await contract.getSubWallets(escrowId);
    } catch {
      return [];
    }
  }

  async hasPermission(escrowId: number, wallet: string, permission: string, networkId: number): Promise<boolean> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return false;

    try {
      return await contract.hasPermission(escrowId, wallet, permission);
    } catch {
      return false;
    }
  }

  async getEscrowStats(networkId: number): Promise<EscrowStats> {
    const contract = await getReadOnlyDiamondContract(networkId, ESCROW_FACET_ABI);
    if (!contract) return { totalEscrows: 0, activeEscrows: 0, completedEscrows: 0 };

    try {
      const stats = await contract.getEscrowStats();
      return {
        totalEscrows: Number(stats.totalEscrows),
        activeEscrows: Number(stats.activeEscrows),
        completedEscrows: Number(stats.completedEscrows)
      };
    } catch {
      return { totalEscrows: 0, activeEscrows: 0, completedEscrows: 0 };
    }
  }

  async fundSubWallet(subWalletAddress: string, amount: string, currency: string, networkId: number): Promise<string> {
    if (!ethers.isAddress(subWalletAddress)) {
      throw new Error('Invalid Ethereum address format');
    }

    if (currency === 'ETH') {
      const result = await walletManager.sendTransaction(subWalletAddress, amount, networkId);
      return result.hash;
    } else {
      const token = getTokenBySymbol(networkId, currency);
      if (!token) throw new Error(`Token ${currency} not supported`);

      const signer = await walletManager.getSigner(networkId);
      if (!signer) throw new Error('No signer available');

      const result = await tokenManager.transferToken(token.address, subWalletAddress, amount, token.decimals, signer);
      return result.hash;
    }
  }

  async getSubWalletBalance(subWalletAddress: string, currency: string, networkId: number): Promise<string> {
    try {
      const network = getNetworkById(networkId);
      if (!network) return '0';

      if (currency === 'ETH') {
        const balance = await fallbackProvider.getBalance(subWalletAddress, network.chainId);
        return balance || '0';
      } else {
        const token = getTokenBySymbol(networkId, currency);
        if (!token) return '0';

        const provider = await fallbackProvider.getWorkingProvider(network.chainId);
        if (!provider) return '0';

        return await tokenManager.getTokenBalance(token.address, subWalletAddress, provider, token.decimals);
      }
    } catch {
      return '0';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENT FACET
// ═══════════════════════════════════════════════════════════════════════════════

const DOCUMENT_FACET_ABI = [
  "function registerDocument(bytes32 _documentHash, string _metadataURI, uint8 _docType) external returns (bytes32)",
  "function verifyDocument(bytes32 _documentHash) external view returns (bool exists, address uploader, uint256 timestamp)",
  "function linkDocumentToEscrow(bytes32 _documentHash, uint256 _escrowId) external",
  "function markDocumentVerified(bytes32 _documentHash) external",
  "function getDocument(bytes32 _documentHash) external view returns (bytes32 documentHash, string metadataURI, address uploader, uint256 timestamp, uint8 docType, uint256 linkedEscrowId, uint256 linkedInvoiceId, bool verified)",
  "function getUserDocuments(address _user) external view returns (bytes32[])",
  "function getEscrowDocuments(uint256 _escrowId) external view returns (bytes32[])",
  "function getTotalDocuments() external view returns (uint256)",
  "function batchVerifyDocuments(bytes32[] _documentHashes) external view returns (bool[])",
  "event DocumentRegistered(bytes32 indexed documentHash, address indexed uploader, uint8 docType, string metadataURI)",
  "event DocumentLinkedToEscrow(bytes32 indexed documentHash, uint256 indexed escrowId)",
  "event DocumentVerified(bytes32 indexed documentHash, address indexed verifier)"
];

export enum DocumentType { Contract, Invoice, ProofOfDelivery, LegalDocument, Specification, ComplianceCert, Other }

export interface DocumentRecord {
  documentHash: string;
  metadataURI: string;
  uploader: string;
  timestamp: Date;
  docType: DocumentType;
  linkedEscrowId: number;
  linkedInvoiceId: number;
  verified: boolean;
}

class DocumentManager {
  async registerDocument(documentHash: string, metadataURI: string, docType: DocumentType, networkId: number): Promise<{ txHash: string }> {
    const contract = await getDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to document contract');

    const tx = await contract.registerDocument(documentHash, metadataURI, docType);
    await tx.wait();
    return { txHash: tx.hash };
  }

  async verifyDocument(documentHash: string, networkId: number): Promise<{ exists: boolean; uploader: string; timestamp: Date } | null> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return null;

    try {
      const result = await contract.verifyDocument(documentHash);
      return {
        exists: result.exists,
        uploader: result.uploader,
        timestamp: new Date(Number(result.timestamp) * 1000)
      };
    } catch {
      return null;
    }
  }

  async linkDocumentToEscrow(documentHash: string, escrowId: number, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to document contract');

    const tx = await contract.linkDocumentToEscrow(documentHash, escrowId);
    await tx.wait();
    return tx.hash;
  }

  async markDocumentVerified(documentHash: string, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to document contract');

    const tx = await contract.markDocumentVerified(documentHash);
    await tx.wait();
    return tx.hash;
  }

  async getDocument(documentHash: string, networkId: number): Promise<DocumentRecord | null> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return null;

    try {
      const doc = await contract.getDocument(documentHash);
      return {
        documentHash: doc.documentHash,
        metadataURI: doc.metadataURI,
        uploader: doc.uploader,
        timestamp: new Date(Number(doc.timestamp) * 1000),
        docType: Number(doc.docType) as DocumentType,
        linkedEscrowId: Number(doc.linkedEscrowId),
        linkedInvoiceId: Number(doc.linkedInvoiceId),
        verified: doc.verified
      };
    } catch {
      return null;
    }
  }

  async getUserDocuments(userAddress: string, networkId: number): Promise<string[]> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return [];

    try {
      return await contract.getUserDocuments(userAddress);
    } catch {
      return [];
    }
  }

  async getEscrowDocuments(escrowId: number, networkId: number): Promise<string[]> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return [];

    try {
      return await contract.getEscrowDocuments(escrowId);
    } catch {
      return [];
    }
  }

  async getTotalDocuments(networkId: number): Promise<number> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return 0;

    try {
      return Number(await contract.getTotalDocuments());
    } catch {
      return 0;
    }
  }

  async batchVerifyDocuments(documentHashes: string[], networkId: number): Promise<boolean[]> {
    const contract = await getReadOnlyDiamondContract(networkId, DOCUMENT_FACET_ABI);
    if (!contract) return documentHashes.map(() => false);

    try {
      return await contract.batchVerifyDocuments(documentHashes);
    } catch {
      return documentHashes.map(() => false);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIQUIDITY POOL FACET
// ═══════════════════════════════════════════════════════════════════════════════

const LIQUIDITY_POOL_FACET_ABI = [
  "function stake(uint256 amount) external",
  "function unstake() external",
  "function getStake(address staker) external view returns (uint256 amount, uint256 timestamp, uint256 votingPower, bool active)",
  "function getPoolStats() external view returns (uint256 totalStaked, uint256 totalLPs, uint256 contractBalance)",
  "function getStakers() external view returns (address[])",
  "function distributeRewards(address staker, uint256 amount) external",
  "event Staked(address indexed staker, uint256 amount, uint256 votingPower)",
  "event Unstaked(address indexed staker, uint256 amount)",
  "event RewardsDistributed(address indexed staker, uint256 amount)"
];

export interface StakeInfo {
  amount: string;
  timestamp: Date;
  votingPower: string;
  active: boolean;
}

export interface PoolStats {
  totalStaked: string;
  totalLPs: number;
  contractBalance: string;
}

class LiquidityPoolManager {
  async stake(amount: string, decimals: number, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to liquidity pool contract');

    const amountWei = ethers.parseUnits(amount, decimals);
    const tx = await contract.stake(amountWei);
    await tx.wait();
    return tx.hash;
  }

  async unstake(networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to liquidity pool contract');

    const tx = await contract.unstake();
    await tx.wait();
    return tx.hash;
  }

  async getStake(stakerAddress: string, networkId: number): Promise<StakeInfo | null> {
    const contract = await getReadOnlyDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) return null;

    try {
      const s = await contract.getStake(stakerAddress);
      return {
        amount: ethers.formatEther(s.amount),
        timestamp: new Date(Number(s.timestamp) * 1000),
        votingPower: ethers.formatEther(s.votingPower),
        active: s.active
      };
    } catch {
      return null;
    }
  }

  async getPoolStats(networkId: number): Promise<PoolStats> {
    const contract = await getReadOnlyDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) return { totalStaked: '0', totalLPs: 0, contractBalance: '0' };

    try {
      const stats = await contract.getPoolStats();
      return {
        totalStaked: ethers.formatEther(stats.totalStaked),
        totalLPs: Number(stats.totalLPs),
        contractBalance: ethers.formatEther(stats.contractBalance)
      };
    } catch {
      return { totalStaked: '0', totalLPs: 0, contractBalance: '0' };
    }
  }

  async getStakers(networkId: number): Promise<string[]> {
    const contract = await getReadOnlyDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) return [];

    try {
      return await contract.getStakers();
    } catch {
      return [];
    }
  }

  async distributeRewards(stakerAddress: string, amount: string, decimals: number, networkId: number): Promise<string> {
    const contract = await getDiamondContract(networkId, LIQUIDITY_POOL_FACET_ABI);
    if (!contract) throw new Error('Failed to connect to liquidity pool contract');

    const amountWei = ethers.parseUnits(amount, decimals);
    const tx = await contract.distributeRewards(stakerAddress, amountWei);
    await tx.wait();
    return tx.hash;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const escrowManager = new EscrowManager();
export const documentManager = new DocumentManager();
export const liquidityPoolManager = new LiquidityPoolManager();
