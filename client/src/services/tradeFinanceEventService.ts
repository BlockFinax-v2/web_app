/**
 * Trade Finance Event Service (Web App)
 * Listens to smart contract events using ethers v6 syntax.
 */

import { ethers } from "ethers";
import { WalletNetwork } from "./smartContractTransactionService";

// TradeFinanceFacet Event ABI (abridged to standard events)
const TRADE_FINANCE_EVENT_ABI = [
    "event PGACreated(string indexed pgaId, address indexed buyer, address indexed seller, uint256 tradeValue, uint256 guaranteeAmount, uint256 collateralAmount, uint256 duration, string metadataURI, uint256 votingDeadline, uint256 createdAt)",
    "event PGAVoteCast(string indexed pgaId, address indexed voter, bool support, uint256 votingPower, uint256 timestamp)",
    "event PGAStatusChanged(string indexed pgaId, uint8 oldStatus, uint8 newStatus, uint256 timestamp)",
    "event GuaranteeApproved(string indexed pgaId, address indexed buyer, address indexed seller, string companyName, string registrationNumber, string tradeDescription, uint256 tradeValue, uint256 guaranteeAmount, uint256 duration, string beneficiaryName, address beneficiaryWallet, uint256 timestamp)",
    "event SellerApprovalReceived(string indexed pgaId, address indexed seller, uint256 timestamp)",
    "event CollateralPaid(string indexed pgaId, address indexed buyer, uint256 collateralAmount, uint256 timestamp)",
    "event GoodsShipped(string indexed pgaId, address indexed logisticPartner, string logisticPartnerName, uint256 timestamp)",
    "event BalancePaymentReceived(string indexed pgaId, address indexed buyer, uint256 balanceAmount, uint256 timestamp)",
    "event CertificateIssued(string indexed pgaId, string certificateNumber, uint256 issueDate, address indexed buyer, address indexed seller, uint256 tradeValue, uint256 guaranteeAmount, uint256 validityDays, string blockchainNetwork, address smartContract)",
    "event DeliveryAgreementCreated(string indexed agreementId, string indexed pgaId, address indexed deliveryPerson, address buyer, uint256 createdAt, uint256 deadline, string deliveryNotes)",
    "event BuyerConsentGiven(string indexed agreementId, string indexed pgaId, address indexed buyer, uint256 timestamp)",
    "event PGACompleted(string indexed pgaId, address indexed buyer, address indexed seller, uint256 completedAt)"
];

const DIAMOND_ADDRESSES: { [chainId: number]: string } = {
    11155111: "0xA4d19a7b133d2A9fAce5b1ad407cA7b9D4Ee9284", // Sepolia
    4202: "0xe133cd2ee4d835ac202942baff2b1d6d47862d34", // Lisk Sepolia
    84532: "0xb899a968e785dd721dbc40e71e2faed7b2d84711", // Base Sepolia
};

export interface PGAEvent {
    eventType: string;
    pgaId: string;
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
    data: any;
}

type EventCallback = (event: PGAEvent) => void;

class TradeFinanceEventService {
    private static instance: TradeFinanceEventService;
    private currentChainId: number = 4202;
    private currentNetworkConfig: WalletNetwork | null = null;
    private provider: ethers.JsonRpcProvider | null = null;
    private contract: ethers.Contract | null = null;
    private eventCallbacks: Map<string, EventCallback[]> = new Map();
    private lastProcessedBlock: number = 0;
    private isListening: boolean = false;

    public static getInstance(): TradeFinanceEventService {
        if (!TradeFinanceEventService.instance) {
            TradeFinanceEventService.instance = new TradeFinanceEventService();
        }
        return TradeFinanceEventService.instance;
    }

    public setNetwork(chainId: number, networkConfig: WalletNetwork): void {
        this.stopListening();
        this.currentChainId = chainId;
        this.currentNetworkConfig = networkConfig;
        this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
        const diamondAddress = this.getDiamondAddress();

        if (!diamondAddress) {
            this.contract = null;
            this.lastProcessedBlock = 0;
            console.log(`[TradeFinanceEventService] No Diamond for chainId ${chainId}. Events disabled.`);
            return;
        }
        this.contract = new ethers.Contract(
            diamondAddress,
            TRADE_FINANCE_EVENT_ABI,
            this.provider
        );
        this.lastProcessedBlock = 0;
        console.log(`[TradeFinanceEventService] Network switched to chainId: ${chainId}`);
    }

    private getDiamondAddress(): string | null {
        return DIAMOND_ADDRESSES[this.currentChainId] || null;
    }

    /**
     * Start listening for real-time events uniformly using ethers v6
     */
    public startListening(userAddress: string, callback: EventCallback): void {
        if (!this.contract || !this.provider) {
            console.warn("Service not initialized. Cannot listen to events.");
            return;
        }

        if (this.isListening) return;

        this.isListening = true;
        const callbacks = this.eventCallbacks.get(userAddress) || [];
        callbacks.push(callback);
        this.eventCallbacks.set(userAddress, callbacks);

        // Map over all events to construct topic filters if needed or just listen on wildcard
        this.contract.on("*", async (event: any) => {
            if (!event || !event.log) return;
            const logDescription = this.contract!.interface.parseLog({
                topics: event.log.topics.slice(),
                data: event.log.data
            });

            if (logDescription && this.isUserRelatedEvent(logDescription.name, logDescription.args, userAddress)) {
                // Fetch block for timestamp
                let timestamp = Date.now();
                if (event.log.blockNumber) {
                    try {
                        const block = await this.provider!.getBlock(event.log.blockNumber);
                        if (block) timestamp = block.timestamp * 1000;
                    } catch (e) { }
                }

                const pgaEvent: PGAEvent = {
                    eventType: logDescription.name,
                    pgaId: logDescription.args.pgaId || "",
                    blockNumber: event.log.blockNumber,
                    transactionHash: event.log.transactionHash,
                    timestamp,
                    data: logDescription.args
                };

                const currentCallbacks = this.eventCallbacks.get(userAddress) || [];
                currentCallbacks.forEach(cb => cb(pgaEvent));
            }
        });
        console.log("[TradeFinanceEventService] Listening to Trade Finance Events");
    }

    private isUserRelatedEvent(eventName: string, data: any, userAddress: string): boolean {
        const normalizedUser = userAddress.toLowerCase();

        // Check explicit roles if available
        if (data.buyer && data.buyer.toLowerCase() === normalizedUser) return true;
        if (data.seller && data.seller.toLowerCase() === normalizedUser) return true;
        if (data.voter && data.voter.toLowerCase() === normalizedUser) return true;

        // Broadcast global events so financiers can see everything for voting
        const eventsForAllUsers = [
            "PGACreated",
            "GuaranteeApproved",
            "PGAVoteCast",
            "PGAStatusChanged"
        ];

        if (eventsForAllUsers.includes(eventName)) {
            return true;
        }

        return false;
    }

    public stopListening(): void {
        if (!this.isListening || !this.contract) return;

        this.contract.removeAllListeners();
        this.eventCallbacks.clear();
        this.isListening = false;
        console.log("[TradeFinanceEventService] 🛑 Stopped event listeners");
    }

    public getLastProcessedBlock(): number {
        return this.lastProcessedBlock;
    }

    public getIsListening(): boolean {
        return this.isListening;
    }

    public async fetchPastEvents(userAddress: string, fromBlock: number | string = 0, toBlock: number | string = "latest", limit: number = 200): Promise<PGAEvent[]> {
        if (!this.contract || !this.provider || !this.getDiamondAddress()) return [];

        try {
            const filter = {
                address: this.getDiamondAddress() as string,
                fromBlock: fromBlock,
                toBlock: toBlock,
            };

            const logs = await this.provider.getLogs(filter);
            const events: PGAEvent[] = [];

            // Limit the processing for performance
            const processLogs = logs.slice(-limit);

            for (const log of processLogs) {
                try {
                    const parsedLog = this.contract.interface.parseLog({
                        topics: log.topics.slice(),
                        data: log.data
                    });

                    if (parsedLog && this.isUserRelatedEvent(parsedLog.name, parsedLog.args, userAddress)) {
                        let timestamp = Date.now();
                        const block = await this.provider.getBlock(log.blockNumber);
                        if (block) timestamp = block.timestamp * 1000;

                        events.push({
                            eventType: parsedLog.name,
                            pgaId: parsedLog.args.pgaId || "",
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            timestamp,
                            data: parsedLog.args
                        });
                    }
                } catch (e) {
                    // Ignore unparseable logs
                }
            }
            return events;
        } catch (error) {
            console.error("[TradeFinanceEventService] Error fetching past events:", error);
            return [];
        }
    }
}

export const tradeFinanceEventService = TradeFinanceEventService.getInstance();
