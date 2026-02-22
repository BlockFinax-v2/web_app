import { ethers } from "ethers";
import { NETWORK_CONFIGS } from "@/config/alchemyAccount";
import { toast } from "@/hooks/use-toast";
import { transactionHistoryService } from "./transactionHistoryService";

export class IncomingTransferService {
    private static instance: IncomingTransferService;
    private currentAddresses: string[] = [];

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
     * across ALL supported networks for MULTIPLE addresses (e.g. EOA + Smart Account)
     */
    public async startListening(addresses: string[]) {
        const sortedAddresses = [...addresses].sort().join(',');
        if (this.currentAddresses.sort().join(',') === sortedAddresses && this.isListening) {
            return;
        }

        this.stopListening();
        this.currentAddresses = addresses;
        this.isListening = true;

        const uniqueConfigs = Object.values(NETWORK_CONFIGS).reduce((acc: any[], config: any) => {
            if (!acc.find(c => c.chainId === config.chainId)) {
                acc.push(config);
            }
            return acc;
        }, []);

        console.log(`[IncomingTransferService] Booting listeners for ${uniqueConfigs.length} networks across ${addresses.length} addresses...`);

        for (const config of uniqueConfigs) {
            const chainKey = config.chainId.toString();
            try {
                const provider = new ethers.JsonRpcProvider(config.rpcUrl);
                this.providers[chainKey] = provider;

                for (const address of addresses) {
                    const key = `${chainKey}-${address}`;
                    // Fetch initial baseline sync asynchronously
                    provider.getBalance(address).then(balance => {
                        this.lastBalances[key] = balance;
                        console.log(`[IncomingTransferService] ${config.name} (${address.slice(0, 6)}) Baseline: ${ethers.formatEther(balance)}`);
                    }).catch(e => {
                        console.log(`[IncomingTransferService] ${config.name} (${address.slice(0, 6)}) Fetch Failed. Will retry.`);
                    });
                }

                // Poll every 15 seconds per network regardless
                this.activeIntervals[chainKey] = setInterval(() => this.pollBalances(addresses, config, provider), 15000);
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

    private async pollBalances(addresses: string[], config: any, provider: ethers.JsonRpcProvider) {
        if (!this.isListening) return;
        const chainKey = config.chainId.toString();

        for (const address of addresses) {
            const key = `${chainKey}-${address}`;
            try {
                const currentBalance = await provider.getBalance(address);
                const baseline = this.lastBalances[key];

                // If we never successfully got a baseline, THIS is our baseline. Do not trigger a diff.
                if (baseline === undefined) {
                    this.lastBalances[key] = currentBalance;
                    continue;
                }

                if (currentBalance > baseline) {
                    const diff = currentBalance - baseline;
                    const formattedDiff = ethers.formatEther(diff);
                    const symbol = config.nativeCurrency?.symbol || 'ETH';

                    console.log(`🚨 INCOMING ON ${config.name} TO ${address.slice(0, 6)}: +${formattedDiff} ${symbol}`);

                    toast({
                        title: "Tokens Received!",
                        description: `Received +${parseFloat(formattedDiff).toFixed(4)} ${symbol} on ${config.name}`,
                        variant: "success",
                    });

                    const txHashId = `incoming-${Date.now()}-${chainKey}-${address.slice(0, 8)}`;
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

                this.lastBalances[key] = currentBalance;
            } catch (error) {
                // Silently fail polling iterations
            }
        }
    }
}

export const incomingTransferService = IncomingTransferService.getInstance();
