/**
 * Tokens - Token registry and ERC-20 contract helpers
 *
 * Defines token configurations per network and provides balance/transfer utilities.
 * Exports: tokenManager, TokenManager class, TokenConfig, NETWORK_TOKENS, getTokensForNetwork, getTokenBySymbol, ERC20_ABI
 */
import { ethers } from 'ethers';

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  color: string;
}

export interface NetworkTokens {
  [networkId: number]: TokenConfig[];
}

// ERC20 ABI for basic token operations
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

// Token configurations by network
// Note: Keys are network.id from NETWORKS array, NOT chainId
export const NETWORK_TOKENS: NetworkTokens = {
  // Base Sepolia (network.id = 1, chainId = 84532) - Testnet
  1: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      decimals: 6,
      icon: '💵',
      color: '#2775CA'
    }
  ],
  // Lisk Sepolia (network.id = 2, chainId = 4202) - Testnet
  2: [
    {
      symbol: 'USDC.e',
      name: 'Bridged USDC',
      address: '0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83',
      decimals: 6,
      icon: '💵',
      color: '#2775CA'
    }
  ],
  // Base Mainnet (network.id = 10, chainId = 8453) - Production
  10: [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
      icon: '💵',
      color: '#2775CA'
    }
  ]
};

export const getTokensForNetwork = (networkId: number): TokenConfig[] => {
  return NETWORK_TOKENS[networkId] || [];
};

export const getTokenBySymbol = (networkId: number, symbol: string): TokenConfig | undefined => {
  const tokens = getTokensForNetwork(networkId);
  return tokens.find(token => token.symbol === symbol);
};

export class TokenManager {
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    provider: ethers.JsonRpcProvider,
    decimals: number = 18
  ): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      // Force dynamic detection for main wallet when standard detection fails
      throw error; // Re-throw to trigger fallback in getAllTokenBalances
    }
  }

  async getAllTokenBalances(
    networkId: number,
    walletAddress: string,
    provider: ethers.JsonRpcProvider
  ): Promise<Array<{ token: TokenConfig; balance: string; usdValue: number }>> {
    const tokens = getTokensForNetwork(networkId);
    const balances = [];

    for (const token of tokens) {
      let balance = '0';
      let usdValue = 0;
      
      if (token.symbol === 'USDC' || token.symbol === 'USDC.e') {
        // Get USDC balance directly from the network-specific contract
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const rawBalance = await contract.balanceOf(walletAddress);
          balance = ethers.formatUnits(rawBalance, token.decimals);
          usdValue = parseFloat(balance) * 1.0; // $1 per USDC
        } catch (error) {
          balance = '0';
        }
      } else {
        // For other tokens, use standard detection
        try {
          balance = await this.getTokenBalance(
            token.address,
            walletAddress,
            provider,
            token.decimals
          );
          usdValue = parseFloat(balance) * 1; // Mock price for other tokens
        } catch (error) {
          balance = '0';
          usdValue = 0;
        }
      }
      
      // Always include tokens in the result for consistent UI
      balances.push({
        token,
        balance,
        usdValue
      });
    }

    return balances;
  }

  // Dynamic USDC detection using transaction history analysis
  async detectUSDCBalance(
    walletAddress: string,
    provider: ethers.JsonRpcProvider,
    networkId: number
  ): Promise<string> {
    try {
      // Use known working USDC contract addresses for this network
      let usdcContracts: string[] = [];
      
      if (networkId === 1) { // Base Sepolia (network.id = 1, chainId = 84532)
        usdcContracts = [
          '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
        ];
      } else if (networkId === 2) { // Lisk Sepolia (network.id = 2, chainId = 4202)
        usdcContracts = [
          '0x0E82fDDAd51cc3ac12b69761C45bBCB9A2Bf3C83', // Lisk Sepolia USDC.e
        ];
      } else if (networkId === 10) { // Base Mainnet (network.id = 10, chainId = 8453)
        usdcContracts = [
          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
        ];
      }
      
      // Try each known USDC contract
      for (const usdcAddress of usdcContracts) {
        try {
          const usdcContract = new ethers.Contract(usdcAddress, [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)',
            'function symbol() view returns (string)'
          ], provider);
          
          const balance = await usdcContract.balanceOf(walletAddress);
          if (balance > 0) {
            const decimals = await usdcContract.decimals();
            const symbol = await usdcContract.symbol();
            const formatted = ethers.formatUnits(balance, decimals);
            return formatted;
          }
        } catch (error) {
        }
      }
      
      // If no direct contracts work, analyze transaction history
      
      try {
        const latestBlock = await provider.getBlockNumber();
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        
        const logs = await provider.getLogs({
          fromBlock: Math.max(0, latestBlock - 1000),
          toBlock: latestBlock,
          topics: [
            transferTopic,
            null,
            ethers.zeroPadValue(walletAddress, 32)
          ]
        });
        
        if (logs.length > 0) {
          const tokenContractSet = new Set(logs.map((log: any) => log.address));
          const tokenContracts = Array.from(tokenContractSet);
          
          for (const tokenAddress of tokenContracts) {
            try {
              const tokenContract = new ethers.Contract(tokenAddress as string, [
                'function balanceOf(address owner) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)',
                'function name() view returns (string)'
              ], provider);
              
              const balance = await tokenContract.balanceOf(walletAddress);
              if (balance > 0) {
                const decimals = await tokenContract.decimals();
                const symbol = await tokenContract.symbol();
                const name = await tokenContract.name();
                
                const symbolLower = symbol.toLowerCase();
                const nameLower = name.toLowerCase();
                
                if (symbolLower.includes('usdc') || nameLower.includes('usdc') || 
                    symbolLower.includes('usd') || nameLower.includes('usd coin')) {
                  const formatted = ethers.formatUnits(balance, decimals);
                  return formatted;
                }
              }
            } catch (error) {
              // Silent fail for invalid contracts
            }
          }
        }
      } catch (error) {
      }
      
      return '0';
    } catch (error) {
      return '0';
    }
  }

  async transferToken(
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number,
    signer: ethers.Wallet
  ): Promise<ethers.TransactionResponse> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const amountInWei = ethers.parseUnits(amount, decimals);
    return await contract.transfer(to, amountInWei);
  }
}

export const tokenManager = new TokenManager();