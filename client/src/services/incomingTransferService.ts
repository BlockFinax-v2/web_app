import { ethers } from "ethers";
import { NETWORK_CONFIGS } from "@/config/alchemyAccount";
import { toast } from "@/hooks/use-toast";
import { transactionHistoryService } from "./transactionHistoryService";

export class IncomingTransferService {
    private static instance: IncomingTransferService;
    private currentAddress: string | null = null;

    // Polling state per network
    private activeIntervals: Record<string, NodeJS.Timeout> = {};
    private lastBalances: Record<string, bigint> = {};
    private providers: Record<string, ethers.JsonRpcProvider> = {};
    private isListening = false;

    private constructor() { }

    public static getInstance() {
        if (!IncomingTransferService.instance) {
            IncomingTransferService.instance = new IncomingTransferService();
        }
        return IncomingTransferService.instance;
    }

    private getNetworkConfig(networkId: string | number) {
        const configs = Object.values(NETWORK_CONFIGS);
        // Fallback exact match or string mapping
        let network = configs.find(n => n.chainId === Number(networkId)) || configs[0];
        if (typeof networkId === 'string' && networkId.includes('_')) {
            const idMap: Record<string, number> = {
                'ethereum_mainnet': 1, 'ethereum_sepolia': 11155111,
                'base_mainnet': 8453, 'base_sepolia': 84532,
                'optimism_mainnet': 10, 'arbitrum_mainnet': 42161,
                'lisk_mainnet': 1135, 'lisk_sepolia': 4202,
            };
            const mappedId = idMap[networkId];
            if (mappedId) network = configs.find(n => n.chainId === mappedId) || configs[0];
        }
        return network;
    }

    /**
     * Starts listening for incoming native token transfers by polling the balance
     * across ALL supported networks simultaneously.
     */
    public async startListening(address: string) {
        if (this.currentAddress === address && this.isListening) {
            return;
        }

        this.stopListening();
        this.currentAddress = address;
        this.isListening = true;

        const uniqueConfigs = Object.values(NETWORK_CONFIGS).reduce((acc: any[], config: any) => {
            if (!acc.find(c => c.chainId === config.chainId)) {
                acc.push(config);
            }
            return acc;
        }, []);

        console.log(`[IncomingTransferService] Booting listeners for ${uniqueConfigs.length} networks...`);

        for (const config of uniqueConfigs) {
            const chainKey = config.chainId.toString();
            try {
                const provider = new ethers.JsonRpcProvider(config.rpcUrl);
                this.providers[chainKey] = provider;

                // Fetch initial baseline sync asynchronously so we don't block the loop
                provider.getBalance(address).then(balance => {
                    this.lastBalances[chainKey] = balance;
                    // Poll every 15 seconds per network
                    this.activeIntervals[chainKey] = setInterval(() => this.pollBalance(address, config, provider), 15000);
                }).catch(e => {
                    // Initial balance fetch failed (e.g. rate limit), retry next cycle
                    this.lastBalances[chainKey] = 0n;
                    this.activeIntervals[chainKey] = setInterval(() => this.pollBalance(address, config, provider), 15000);
                });
            } catch (error) {
                console.error(`[IncomingTransferService] Failed to start listener on ${config.name}:`, error);
            }
        }
    }

    public stopListening() {
        Object.values(this.activeIntervals).forEach(interval => clearInterval(interval));
        this.activeIntervals = {};
        this.lastBalances = {};
        this.providers = {};
        this.isListening = false;
        console.log("[IncomingTransferService] Stopped all network listeners.");
    }

    private async pollBalance(address: string, config: any, provider: ethers.JsonRpcProvider) {
        if (!this.isListening) return;
        const chainKey = config.chainId.toString();

        try {
            const currentBalance = await provider.getBalance(address);
            const baseline = this.lastBalances[chainKey];

            if (baseline !== undefined && currentBalance > baseline) {
                const diff = currentBalance - baseline;
                const formattedDiff = ethers.formatEther(diff);
                const symbol = config.nativeCurrency?.symbol || 'ETH';

                console.log(`[IncomingTransferService] 🚨 INCOMING DETECTED ON ${config.name}: +${formattedDiff} ${symbol}`);

                // 1. Show dynamic, premium toast
                toast({
                    title: "Tokens Received!",
                    description: `You just received +${parseFloat(formattedDiff).toFixed(4)} ${symbol} on ${config.name}`,
                    variant: "success",
                });

                // 2. Record it in the activity history 
                const txHashId = `incoming-${Date.now()}-${chainKey}`;
                await transactionHistoryService.recordTransaction({
                    hash: txHashId,
                    from: "External Sender",
                    to: address.toLowerCase(),
                    category: 'wallet',
                    type: 'receive',
                    status: 'success',
                    amount: formattedDiff,
                    tokenSymbol: symbol,
                    network: config.name,
                    networkId: config.chainId.toString(),
                    chainId: config.chainId,
                    description: `Received ${parseFloat(formattedDiff).toFixed(4)} ${symbol}`,
                    timestamp: Date.now()
                });
            }

            // Always update last balance
            this.lastBalances[chainKey] = currentBalance;

        } catch (error) {
            // Silently fail polling iterations to prevent console spam on rate limits
        }
    }
}

export const incomingTransferService = IncomingTransferService.getInstance();
