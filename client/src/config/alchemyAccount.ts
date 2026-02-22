/**
 * Alchemy Account Kit Configuration - Multi-Chain Support (Web App)
 * Modeled after the mobile app version.
 */
import {
    mainnet, sepolia, goerli,
    base, baseSepolia,
    optimism, optimismSepolia,
    arbitrum, arbitrumSepolia,
    defineAlchemyChain,
} from '@account-kit/infra';
import type { Chain } from 'viem';

export function toAlchemyNetworkId(networkId: string): string {
    return networkId.replace(/-/g, '_');
}

export function fromAlchemyNetworkId(networkId: string): string {
    return networkId.replace(/_/g, '-');
}

export const SUPPORTED_STABLECOINS = ['USDC', 'USDT'] as const;
export type SupportedStablecoin = typeof SUPPORTED_STABLECOINS[number];

export const PRIMARY_TRANSACTION_TOKEN: SupportedStablecoin = 'USDC';

export const STABLECOIN_ADDRESSES: Record<string, Partial<Record<SupportedStablecoin, string>>> = {
    ethereum_mainnet: { USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    ethereum_sepolia: { USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
    base_sepolia: { USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' },
    lisk_sepolia: {
        USDC: '0x17b3531549F842552911CB287CCf7a5F328ff7d1',
        USDT: '0xa3f3aA5B62237961AF222B211477e572149EBFAe',
    },
};

export const liskChain = defineAlchemyChain({
    chain: {
        id: 1135,
        name: 'Lisk',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.api.lisk.com'] } },
        blockExplorers: { default: { name: 'Lisk Explorer', url: 'https://blockscout.lisk.com' } },
    },
    rpcBaseUrl: 'https://rpc.api.lisk.com',
});

export const liskSepoliaChain = defineAlchemyChain({
    chain: {
        id: 4202,
        name: 'Lisk Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['https://rpc.sepolia-api.lisk.com'] } },
        blockExplorers: { default: { name: 'Lisk Sepolia Explorer', url: 'https://sepolia-blockscout.lisk.com' } },
        testnet: true,
    },
    rpcBaseUrl: 'https://rpc.sepolia-api.lisk.com',
});

// For web, we use Vite's import.meta.env
export const baseSepoliaWithAlchemyRpc = defineAlchemyChain({
    chain: {
        ...baseSepolia,
        rpcUrls: {
            ...baseSepolia.rpcUrls,
            default: {
                http: [`https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`],
            },
            public: {
                http: ['https://sepolia.base.org'],
            },
        },
    },
    rpcBaseUrl: `https://base-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`,
});

export const ALCHEMY_CHAINS: Record<string, Chain> = {
    ethereum_mainnet: mainnet,
    base_mainnet: base,
    optimism_mainnet: optimism,
    arbitrum_mainnet: arbitrum,
    ethereum_sepolia: sepolia,
    ethereum_goerli: goerli,
    base_sepolia: baseSepoliaWithAlchemyRpc,
    optimism_sepolia: optimismSepolia,
    arbitrum_sepolia: arbitrumSepolia,
    lisk_mainnet: liskChain,
    lisk_sepolia: liskSepoliaChain,
};

export const OFFICIALLY_SUPPORTED_AA_NETWORKS = [
    'ethereum_mainnet', 'base_mainnet', 'optimism_mainnet', 'arbitrum_mainnet', 'ethereum_sepolia',
] as const;

export const SUPPORTED_ALCHEMY_NETWORKS = Object.keys(ALCHEMY_CHAINS);
export type SupportedAlchemyNetwork = keyof typeof ALCHEMY_CHAINS;

export function isAlchemyNetworkSupported(network: string): network is SupportedAlchemyNetwork {
    const alchemyNetworkId = toAlchemyNetworkId(network);
    return alchemyNetworkId in ALCHEMY_CHAINS;
}

export function isOfficiallySupported(network: string): boolean {
    const alchemyNetworkId = toAlchemyNetworkId(network);
    return OFFICIALLY_SUPPORTED_AA_NETWORKS.includes(alchemyNetworkId as any);
}

export function isConfiguredInAlchemyDashboard(network: string): boolean {
    const alchemyNetworkId = toAlchemyNetworkId(network);
    const mainnets = ['ethereum_mainnet', 'base_mainnet', 'optimism_mainnet', 'arbitrum_mainnet'];
    const testnets = ['ethereum_sepolia'];
    return [...mainnets, ...testnets].includes(alchemyNetworkId);
}

export function getAlchemyChain(network: string): Chain {
    const alchemyNetworkId = toAlchemyNetworkId(network);
    if (!isAlchemyNetworkSupported(network)) {
        throw new Error(`Network ${network} is not supported by Alchemy`);
    }
    return ALCHEMY_CHAINS[alchemyNetworkId];
}

export function getStablecoinAddress(
    network: string,
    stablecoin: SupportedStablecoin = PRIMARY_TRANSACTION_TOKEN
): string | undefined {
    const alchemyNetworkId = toAlchemyNetworkId(network);
    return STABLECOIN_ADDRESSES[alchemyNetworkId]?.[stablecoin];
}

export function getAlchemyApiKey(): string {
    const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_ALCHEMY_API_KEY is not set in environment variables');
    }
    return apiKey;
}

export function getAlchemyGasPolicyId(): string | undefined {
    return import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID;
}

export const NETWORK_CONFIGS: Record<string | number, any> = {
    // String Keys for legacy generic lookups
    lisk_sepolia: {
        name: 'Lisk Sepolia',
        chainId: 4202,
        rpcUrl: 'https://rpc.sepolia-api.lisk.com',
        explorerUrl: 'https://sepolia-blockscout.lisk.com',
        isTestnet: true,
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    },
    // Number Keys matching chainIds exactly to ensure correct rendering in Dashboard
    1: { name: 'Ethereum Mainnet', symbol: 'ETH', isTestnet: false, chainId: 1, rpcUrl: 'https://eth.llamarpc.com', explorerUrl: 'https://etherscan.io' },
    11155111: { name: 'Sepolia', symbol: 'SepoliaETH', isTestnet: true, chainId: 11155111, rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', explorerUrl: 'https://sepolia.etherscan.io' },
    8453: { name: 'Base', symbol: 'ETH', isTestnet: false, chainId: 8453, rpcUrl: 'https://mainnet.base.org', explorerUrl: 'https://basescan.org' },
    84532: { name: 'Base Sepolia', symbol: 'ETH', isTestnet: true, chainId: 84532, rpcUrl: 'https://sepolia.base.org', explorerUrl: 'https://sepolia.basescan.org' },
    10: { name: 'OP Mainnet', symbol: 'ETH', isTestnet: false, chainId: 10, rpcUrl: 'https://mainnet.optimism.io', explorerUrl: 'https://optimistic.etherscan.io' },
    42161: { name: 'Arbitrum One', symbol: 'ETH', isTestnet: false, chainId: 42161, rpcUrl: 'https://arb1.arbitrum.io/rpc', explorerUrl: 'https://arbiscan.io' },
    1135: { name: 'Lisk', symbol: 'ETH', isTestnet: false, chainId: 1135, rpcUrl: 'https://rpc.api.lisk.com', explorerUrl: 'https://blockscout.lisk.com' },
    4202: { name: 'Lisk Sepolia', symbol: 'ETH', isTestnet: true, chainId: 4202, rpcUrl: 'https://rpc.sepolia-api.lisk.com', explorerUrl: 'https://sepolia-blockscout.lisk.com' },
};

export function getNetworkConfig(network: string | number) {
    const config = NETWORK_CONFIGS[network];
    if (!config) {
        // Fallback for unknown networks
        return { name: 'Unknown Network', symbol: 'ETH', isTestnet: false };
    }
    return config;
}

export const ENTRY_POINT_ADDRESS = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const;
