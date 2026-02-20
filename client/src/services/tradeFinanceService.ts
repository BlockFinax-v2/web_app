/**
 * Trade Finance Service (Web App)
 * Interacts with the TradeFinanceFacet of the BlockFinaX smart contract.
 * Adapted for web to accept `privateKey` directly from the TransactionSignerContext.
 */

import { ethers } from "ethers";
import { smartContractTransactionService, WalletNetwork } from "./smartContractTransactionService";

// TradeFinanceFacet ABI (abridged for brevity, containing essential functions)
const TRADE_FINANCE_FACET_ABI = [
    // Events
    "event PGACreated(string indexed pgaId, address indexed buyer, address indexed seller, uint256 tradeValue, uint256 guaranteeAmount, uint256 collateralAmount, uint256 duration, string metadataURI, uint256 votingDeadline, uint256 createdAt)",
    "event PGAVoteCast(string indexed pgaId, address indexed voter, bool support, uint256 votingPower, uint256 timestamp)",
    "event SellerApprovalReceived(string indexed pgaId, address indexed seller, uint256 timestamp)",
    "event CollateralPaid(string indexed pgaId, address indexed buyer, uint256 collateralAmount, uint256 timestamp)",
    "event GoodsShipped(string indexed pgaId, address indexed logisticPartner, string logisticPartnerName, string proofOfShipmentURI, uint256 timestamp)",
    "event GoodsDelivered(string indexed pgaId, address indexed logisticPartner, string proofOfDeliveryURI, uint256 timestamp)",
    "event IssuanceFeePaid(string indexed pgaId, address indexed buyer, address indexed blockfinaxAddress, uint256 feeAmount, uint256 timestamp)",
    // Functions
    "function createPGA(string pgaId, address seller, string companyName, string registrationNumber, string tradeDescription, uint256 tradeValue, uint256 guaranteeAmount, uint256 collateralAmount, uint256 issuanceFee, uint256 duration, string beneficiaryName, address beneficiaryWallet, string metadataURI, string[] documentURIs) external",
    "function voteOnPGA(string pgaId, bool support) external",
    "function sellerVoteOnPGA(string pgaId, bool approve) external",
    "function payCollateral(string pgaId, address tokenAddress) external",
    "function payIssuanceFee(string pgaId, address tokenAddress) external",
    "function confirmGoodsShipped(string pgaId, string proofOfShipmentURI) external",
    "function takeUpPGA(string pgaId) external",
    "function confirmGoodsDelivered(string pgaId, string proofOfDeliveryURI) external",
    "function payBalancePayment(string pgaId) external",
    "function issueCertificate(string pgaId) external",
    "function releasePaymentToSeller(string pgaId) external",
    "function claimSellerPayment(string pgaId) external",
    "function refundCollateral(string pgaId) external",
    "function cancelPGA(string pgaId) external",
    "function getPGA(string pgaId) external view returns (string _pgaId, address buyer, address seller, uint256 tradeValue, uint256 guaranteeAmount, uint256 collateralAmount, uint256 issuanceFee, uint256 duration, uint256 votesFor, uint256 votesAgainst, uint256 createdAt, uint256 votingDeadline, uint8 status, bool collateralPaid, bool issuanceFeePaid, bool balancePaymentPaid, bool goodsShipped, bool goodsDelivered, bool sellerPaymentClaimed, address tokenAddress, string logisticPartner, address logisticsPartner, uint256 certificateIssuedAt, string deliveryAgreementId, string metadataURI, string companyName, string registrationNumber, string tradeDescription, string beneficiaryName, address beneficiaryWallet, string[] uploadedDocuments)",
    "function getAllPGAs() external view returns (string[] memory)",
    "function getActivePGAs() external view returns (string[] memory)",
    "function getPGAsByBuyer(address buyer) external view returns (string[] memory)",
    "function getPGAsBySeller(address seller) external view returns (string[] memory)"
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

const DIAMOND_ADDRESSES: { [chainId: number]: string } = {
    11155111: "0xA4d19a7b133d2A9fAce5b1ad407cA7b9D4Ee9284", // Sepolia
    4202: "0xe133cd2ee4d835ac202942baff2b1d6d47862d34", // Lisk Sepolia
    84532: "0xb899a968e785dd721dbc40e71e2faed7b2d84711", // Base Sepolia
};

export enum PGAStatus {
    None, Created, GuaranteeApproved, SellerApproved, CollateralPaid, LogisticsNotified,
    LogisticsTakeup, GoodsShipped, BalancePaymentPaid, GoodsDelivered, SellerPaymentClaimed,
    CertificateIssued, Completed, Rejected, Expired, Disputed
}

export interface PGAInfo {
    pgaId: string;
    buyer: string;
    seller: string;
    tradeValue: string;
    guaranteeAmount: string;
    collateralAmount: string;
    issuanceFee: string;
    duration: number;
    status: PGAStatus;
    tokenAddress: string;
    companyName: string;
    createdAt: number;
    // ... omitting extensive type definitions for brevity in porting core logic
}

class TradeFinanceService {
    private static instance: TradeFinanceService;
    private currentChainId: number = 4202;
    private currentNetworkConfig: WalletNetwork | null = null;
    private pgaCache: Map<string, { data: PGAInfo; timestamp: number }> = new Map();
    private readonly CACHE_TTL_MS = 30000;

    public static getInstance(): TradeFinanceService {
        if (!TradeFinanceService.instance) {
            TradeFinanceService.instance = new TradeFinanceService();
        }
        return TradeFinanceService.instance;
    }

    public setNetwork(chainId: number, networkConfig: WalletNetwork): void {
        this.currentChainId = chainId;
        this.currentNetworkConfig = networkConfig;
        this.pgaCache.clear();
    }

    private getDiamondAddress(): string {
        if (!this.currentNetworkConfig) throw new Error("Network not configured");
        return DIAMOND_ADDRESSES[this.currentChainId] || "";
    }

    private async getProvider(): Promise<ethers.JsonRpcProvider> {
        if (!this.currentNetworkConfig?.rpcUrl) throw new Error('No RPC URL');
        return new ethers.JsonRpcProvider(this.currentNetworkConfig.rpcUrl);
    }

    // ==========================================
    // READ FUNCTIONS
    // ==========================================

    public async getPGA(pgaId: string, skipCache: boolean = false): Promise<PGAInfo> {
        if (!skipCache && this.pgaCache.has(pgaId)) return this.pgaCache.get(pgaId)!.data;

        const provider = await this.getProvider();
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        const data = await contract.getPGA(pgaId);

        const pgaInfo: PGAInfo = {
            pgaId: data[0],
            buyer: data[1],
            seller: data[2],
            tradeValue: ethers.formatUnits(data[3], 6),
            guaranteeAmount: ethers.formatUnits(data[4], 6),
            collateralAmount: ethers.formatUnits(data[5], 6),
            issuanceFee: ethers.formatUnits(data[6], 6),
            duration: Number(data[7]),
            status: data[12] as PGAStatus,
            tokenAddress: data[19],
            companyName: data[25],
            createdAt: Number(data[10]),
        };

        this.pgaCache.set(pgaId, { data: pgaInfo, timestamp: Date.now() });
        return pgaInfo;
    }

    public async getAllActivePGAs(): Promise<string[]> {
        const provider = await this.getProvider();
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        return await contract.getActivePGAs();
    }

    public async getPGAsByBuyer(buyer: string): Promise<PGAInfo[]> {
        const provider = await this.getProvider();
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        const ids = await contract.getPGAsByBuyer(buyer);
        return Promise.all(ids.slice(0, 10).map((id: string) => this.getPGA(id)));
    }

    public async getPGAsBySeller(seller: string): Promise<PGAInfo[]> {
        const provider = await this.getProvider();
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        const ids = await contract.getPGAsBySeller(seller);
        return Promise.all(ids.slice(0, 10).map((id: string) => this.getPGA(id)));
    }

    public async getAllPGAsBySeller(seller: string): Promise<PGAInfo[]> {
        // Alias for UI component usage
        return this.getPGAsBySeller(seller);
    }

    // ==========================================
    // WRITE FUNCTIONS (Requires privateKey injected via TransactionSignModal)
    // ==========================================

    public async createPGA(privateKey: string, params: {
        pgaId: string; seller: string; companyName: string; registrationNumber: string;
        tradeDescription: string; tradeValue: string; guaranteeAmount: string;
        collateralAmount: string; issuanceFee: string; duration: number;
        beneficiaryName: string; beneficiaryWallet: string; metadataURI: string; documentURIs: string[];
    }) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "createPGA",
            args: [
                params.pgaId, params.seller, params.companyName, params.registrationNumber, params.tradeDescription,
                ethers.parseUnits(params.tradeValue, 6),
                ethers.parseUnits(params.guaranteeAmount, 6),
                ethers.parseUnits(params.collateralAmount, 6),
                ethers.parseUnits(params.issuanceFee, 6),
                params.duration, params.beneficiaryName, params.beneficiaryWallet, params.metadataURI, params.documentURIs
            ],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'pga_create', description: `Created PGA: ${params.pgaId}`, amount: params.tradeValue }
        });
    }

    public async voteOnPGA(privateKey: string, pgaId: string, support: boolean) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "voteOnPGA",
            args: [pgaId, support],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'pga_vote', description: `Voted ${support ? 'FOR' : 'AGAINST'} PGA: ${pgaId}` }
        });
    }

    public async sellerVoteOnPGA(privateKey: string, pgaId: string, approve: boolean) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "sellerVoteOnPGA",
            args: [pgaId, approve],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'pga_vote', description: `Seller ${approve ? 'approved' : 'rejected'} PGA: ${pgaId}` }
        });
    }

    public async approvePGA(privateKey: string, pgaId: string) {
        return this.sellerVoteOnPGA(privateKey, pgaId, true);
    }

    public async confirmGoodsShipped(privateKey: string, pgaId: string, proofURI: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "confirmGoodsShipped",
            args: [pgaId, proofURI],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'goods_shipped', description: `Confirmed goods shipped for PGA: ${pgaId}` }
        });
    }

    public async confirmGoodsDelivered(privateKey: string, pgaId: string, proofURI: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "confirmGoodsDelivered",
            args: [pgaId, proofURI],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'goods_delivered', description: `Confirmed goods delivered for PGA: ${pgaId}` }
        });
    }

    public async confirmBalancePaymentReceived(privateKey: string, pgaId: string) {
        // The seller confirming balance payment receipt essentially completes their flow 
        // We'll map this to `releasePaymentToSeller` or `claimSellerPayment` based on smart contract logic
        // For simplicity based on the interface provided, let's call `claimSellerPayment`
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "claimSellerPayment",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'payment_claimed', description: `Claimed seller payment for PGA: ${pgaId}` }
        });
    }

    public async takeUpPGA(privateKey: string, pgaId: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "takeUpPGA",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'pga_takeup', description: `Logistics partner took up PGA: ${pgaId}` }
        });
    }

    public async issueCertificate(privateKey: string, pgaId: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "issueCertificate",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'certificate_issued', description: `Issued certificate for PGA: ${pgaId}` }
        });
    }

    public async createDeliveryAgreement(privateKey: string, params: {
        agreementId: string;
        pgaId: string;
        agreementDeadline: number;
        deliveryNotes: string;
        deliveryProofURI: string;
    }) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "createDeliveryAgreement",
            args: [params.agreementId, params.pgaId, params.agreementDeadline, params.deliveryNotes, params.deliveryProofURI],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'delivery_agreement_created', description: `Created delivery agreement for PGA: ${params.pgaId}` }
        });
    }

    public async buyerConsentToDelivery(privateKey: string, agreementId: string, consent: boolean) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "buyerConsentToDelivery",
            args: [agreementId, consent],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'buyer_consent', description: `Buyer ${consent ? 'consented' : 'rejected'} delivery agreement: ${agreementId}` }
        });
    }

    public async releasePaymentToSeller(privateKey: string, pgaId: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "releasePaymentToSeller",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'payment_released', description: `Released payment to seller for PGA: ${pgaId}` }
        });
    }

    public async refundCollateral(privateKey: string, pgaId: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "refundCollateral",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'collateral_refund', description: `Refunded collateral for PGA: ${pgaId}` }
        });
    }

    public async cancelPGA(privateKey: string, pgaId: string) {
        return smartContractTransactionService.executeTransaction({
            contractAddress: this.getDiamondAddress(),
            abi: TRADE_FINANCE_FACET_ABI,
            functionName: "cancelPGA",
            args: [pgaId],
            network: this.currentNetworkConfig!,
            privateKey,
            transactionMetadata: { category: 'trade', type: 'pga_cancelled', description: `Cancelled PGA: ${pgaId}` }
        });
    }

    public async getAllLogisticsPartners(): Promise<string[]> {
        const provider = new ethers.JsonRpcProvider(this.currentNetworkConfig!.rpcUrl);
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        return await contract.getAllLogisticsPartners();
    }

    public async getAuthorizedLogisticsPartners(): Promise<string[]> {
        const provider = new ethers.JsonRpcProvider(this.currentNetworkConfig!.rpcUrl);
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        const allPartners: string[] = await contract.getAllLogisticsPartners();
        const authorized: string[] = [];
        for (const partner of allPartners) {
            const isAuthorized = await contract.isAuthorizedLogisticsPartner(partner);
            if (isAuthorized) authorized.push(partner);
        }
        return authorized;
    }

    public async getAllDeliveryPersons(): Promise<string[]> {
        const provider = new ethers.JsonRpcProvider(this.currentNetworkConfig!.rpcUrl);
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        return await contract.getAllDeliveryPersons();
    }

    public async isAuthorizedLogisticsPartner(partner: string): Promise<boolean> {
        const provider = new ethers.JsonRpcProvider(this.currentNetworkConfig!.rpcUrl);
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        return await contract.isAuthorizedLogisticsPartner(partner);
    }

    public async isAuthorizedDeliveryPerson(deliveryPerson: string): Promise<boolean> {
        const provider = new ethers.JsonRpcProvider(this.currentNetworkConfig!.rpcUrl);
        const contract = new ethers.Contract(this.getDiamondAddress(), TRADE_FINANCE_FACET_ABI, provider);
        return await contract.isAuthorizedDeliveryPerson(deliveryPerson);
    }

    /**
     * Executes an ERC-20 approval followed by the smart contract call using Account Abstraction batching
     */
    private async executeTokenPayment(privateKey: string, pgaId: string, tokenAddress: string, amountToPay: bigint | string, functionName: string, description: string) {
        const diamond = this.getDiamondAddress();

        // Use batch transaction to approve + spend in one UserOp if AA
        return smartContractTransactionService.executeBatchTransaction({
            transactions: [
                {
                    contractAddress: tokenAddress,
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [diamond, amountToPay]
                },
                {
                    contractAddress: diamond,
                    abi: TRADE_FINANCE_FACET_ABI,
                    functionName: functionName,
                    args: [pgaId, tokenAddress]
                }
            ],
            network: this.currentNetworkConfig!,
            privateKey,
            expectGasSponsorship: true
        });
    }

    public async payCollateral(privateKey: string, pgaId: string, tokenAddress: string) {
        const pga = await this.getPGA(pgaId);
        return this.executeTokenPayment(privateKey, pgaId, tokenAddress, ethers.parseUnits(pga.collateralAmount, 6), "payCollateral", `Paid collateral for PGA: ${pgaId}`);
    }

    public async payIssuanceFee(privateKey: string, pgaId: string, tokenAddress: string) {
        const pga = await this.getPGA(pgaId);
        return this.executeTokenPayment(privateKey, pgaId, tokenAddress, ethers.parseUnits(pga.issuanceFee, 6), "payIssuanceFee", `Paid issuance fee for PGA: ${pgaId}`);
    }
}

export const tradeFinanceService = TradeFinanceService.getInstance();
