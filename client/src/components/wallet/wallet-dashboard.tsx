import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Loader2, Copy, MoreVertical } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORK_CONFIGS } from '@/config/alchemyAccount';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { NetworkSelector } from '@/components/wallet/network-selector';
import { TokenIcon } from '@/components/wallet/token-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { SendTransactionModal } from '@/components/wallet/send-transaction-modal';
import { ReceiveModal } from '@/components/wallet/receive-modal';

// Basic cache keys for the dashboard balances
const CACHE_KEYS = {
  ETH_BALANCE: 'blockfinax.dashboard.balanceETH',
  USDC_BALANCE: 'blockfinax.dashboard.balanceUSDC',
  INTERACTED_TOKENS: 'blockfinax.dashboard.interactedTokens'
};

// Basic ERC-20 ABI for balance checking
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

interface Props {
  address: string;
  smartAccountAddress?: string | null;
  isSmartAccountEnabled?: boolean;
  networkId?: number;
  selectedNetworkId?: number;
  onSend?: () => void;
  onReceive?: () => void;
  onTabChange?: (tab: string) => void;
  onNetworkChange?: (id: number) => void;
}

export function EnhancedWalletOverview({ 
  address, 
  smartAccountAddress,
  isSmartAccountEnabled = true,
  networkId = 1, 
  onNetworkChange 
}: Props) {
  // Initialize from cache immediately to prevent 0.00 flash
  const [balanceETH, setBalanceETH] = useState<string>(() => localStorage.getItem(CACHE_KEYS.ETH_BALANCE) || "0.00");
  const [usdcBalance, setUSDCBalance] = useState<string>(() => localStorage.getItem(CACHE_KEYS.USDC_BALANCE) || "0.00");
  const [interactedTokens, setInteractedTokens] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEYS.INTERACTED_TOKENS) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  
  const currentNetwork = Object.values(NETWORK_CONFIGS).find(n => n.chainId === networkId) || NETWORK_CONFIGS[networkId] || { symbol: 'ETH', name: 'Ethereum' };
  const nativeSymbol = currentNetwork?.nativeCurrency?.symbol || currentNetwork?.symbol || 'ETH';
  
  // Track which asset is selected to display its standalone balance in the header
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>(nativeSymbol);
  
  // Log Smart Account strictly to console as requested by user
  useEffect(() => {
    if (isSmartAccountEnabled && smartAccountAddress) {
      console.log(`[Account Abstraction] Active Smart Account Address: ${smartAccountAddress}`);
    }
  }, [isSmartAccountEnabled, smartAccountAddress]);

  const handleTransactionComplete = (symbol: string, amount: string) => {
    if (!interactedTokens.includes(symbol)) {
      const updated = [...interactedTokens, symbol];
      setInteractedTokens(updated);
      localStorage.setItem(CACHE_KEYS.INTERACTED_TOKENS, JSON.stringify(updated));
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchBalances() {
      if (!address) return;
      try {
        setLoading(true);
        const configs = Object.values(NETWORK_CONFIGS);
        const network = configs.find(n => n.chainId === networkId) || configs[0];
        
        if (network && network.rpcUrl) {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          
          // Fetch Native Balance (strictly EOA for UI display)
          const balanceWei = await provider.getBalance(address);
          if (isMounted) {
            const formattedEth = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);
            setBalanceETH(formattedEth);
            localStorage.setItem(CACHE_KEYS.ETH_BALANCE, formattedEth);
          }

          // Fetch USDC Balance (if known, trying Base Sepolia USDC first, or general)
          // Look up USDC address in config 
          // Note: Hardcoded for demo if not using full alchemyAccount config export
          const usdcAddress = networkId === 84532 ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : 
                            networkId === 4202 ? "0x17b3531549F842552911CB287CCf7a5F328ff7d1" : 
                            networkId === 11155111 ? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" : null;

          if (usdcAddress) {
              const contract = new ethers.Contract(usdcAddress, ERC20_ABI, provider);
              const bal = await contract.balanceOf(address);
              const dec = await contract.decimals();
              if (isMounted) {
                const formattedUSDC = parseFloat(ethers.formatUnits(bal, dec)).toFixed(2);
                setUSDCBalance(formattedUSDC);
                localStorage.setItem(CACHE_KEYS.USDC_BALANCE, formattedUSDC);
              }
          } else {
              if (isMounted) {
                setUSDCBalance("0.00");
                localStorage.setItem(CACHE_KEYS.USDC_BALANCE, "0.00");
              }
          }
        }
      } catch (err) {
        console.error("Failed to fetch balances", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchBalances();
    return () => { isMounted = false; };
  }, [address, networkId]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard"
    });
  };

  const ASSETS = [
    { symbol: nativeSymbol, name: currentNetwork?.name || 'Ethereum', balance: balanceETH, usdValue: '$0.00', change: '+0.0%', positive: true, isReal: true },
    { symbol: 'USDC', name: 'USD Coin', balance: usdcBalance, usdValue: '$0.00', change: '+0.0%', positive: true, isReal: true },
    { symbol: 'USDT', name: 'Tether', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'DAI', name: 'Dai Stablecoin', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'LINK', name: 'Chainlink', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'UNI', name: 'Uniswap', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'WETH', name: 'Wrapped Ether', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'MATIC', name: 'Polygon', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'ARB', name: 'Arbitrum', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'OP', name: 'Optimism', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'SHIB', name: 'Shiba Inu', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'PEPE', name: 'Pepe', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'AAVE', name: 'Aave', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'CRV', name: 'Curve DAO', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'COMP', name: 'Compound', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'MKR', name: 'Maker', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'FRAX', name: 'Frax', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'LDO', name: 'Lido DAO', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'SNX', name: 'Synthetix', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'STETH', name: 'Lido Staked ETH', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'TON', name: 'Toncoin', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'DOT', name: 'Polkadot', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'TRX', name: 'TRON', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'ADA', name: 'Cardano', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'AVAX', name: 'Avalanche', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'BCH', name: 'Bitcoin Cash', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'XLM', name: 'Stellar', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'NEAR', name: 'NEAR Protocol', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'APT', name: 'Aptos', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'INJ', name: 'Injective', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'FIL', name: 'Filecoin', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'ICP', name: 'Internet Computer', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'RNDR', name: 'Render', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
    { symbol: 'TIA', name: 'Celestia', balance: '0.00', usdValue: '$0.00', change: '+0.0%', positive: true, isReal: false },
  ];

  // Tokens that have balances > 0, are defaults (native), or were specifically interacted with
  const dashboardVisibleAssets = ASSETS.filter(a => {
    // strict parsing to catch cases like "0.00" string versus actual numbers like "7.96"
    const parsedBalance = parseFloat((a.balance || "0").replace(/[^0-9.]/g, ''));
    return parsedBalance > 0 || [nativeSymbol].includes(a.symbol) || interactedTokens.includes(a.symbol);
  }).map(a => {
    // Inject mock prices for realistic view
    let price = 0;
    if (['ETH', 'WETH'].includes(a.symbol)) price = 3105.20;
    else if (['USDC', 'USDT', 'DAI'].includes(a.symbol)) price = 1.0;
    else if (['BTC', 'WBTC'].includes(a.symbol)) price = 64230.10;
    else if (a.symbol === 'SOL') price = 145.20;
    else price = 15.40; // generic mock price

    const balNum = parseFloat(a.balance || '0');
    const val = balNum * price;
    return {
      ...a,
      usdValue: val > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val) : '$0.00',
      _rawVal: val
    };
  });

  const totalValueNum = dashboardVisibleAssets.reduce((acc, a) => acc + (a._rawVal || 0), 0);
  
  const activeAsset = dashboardVisibleAssets.find(a => a.symbol === selectedAssetSymbol) || dashboardVisibleAssets[0];
  
  const todayChange = (activeAsset?._rawVal || 0) * 0.032; // Mock 3.2% daily change based on asset balance
  const isPositive = todayChange >= 0;

  return (
    <div className="space-y-6">
      
      {/* Sleek Centralized Balance Card */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <button 
          onClick={copyAddress}
          className="flex items-center gap-2 mb-4 px-3 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full text-xs font-mono transition-colors border border-transparent hover:border-border/50"
        >
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Loading...'}
          <Copy className="h-3 w-3" />
        </button>
        
        <h1 className="text-4xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-foreground text-center">
          {activeAsset?.balance} {activeAsset?.symbol}
        </h1>
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground">{activeAsset?.usdValue}</span>
          <span className={isPositive ? 'text-emerald-500' : 'text-red-500'}>
            {isPositive ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(todayChange)} (+3.2%)
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={() => setIsSendModalOpen(true)}
            size="icon" 
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
          >
            <ArrowUpRight className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium">Send</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <Button 
            onClick={() => setIsReceiveModalOpen(true)}
            size="icon" 
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
          >
            <ArrowDownLeft className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium">Receive</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button size="icon" variant="outline" className="h-14 w-14 rounded-full border-border/50 shadow-sm bg-background">
            <RefreshCw className="h-5 w-5 text-foreground" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Swap</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button size="icon" variant="outline" className="h-14 w-14 rounded-full border-border/50 shadow-sm bg-background">
            <CreditCard className="h-5 w-5 text-foreground" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground">Buy</span>
        </div>
      </div>

      {/* MetaMask-style Bottom Tabs container */}
      <Tabs defaultValue="tokens" className="w-full pt-4">
        {/* Tab Headers */}
        <div className="border-b border-border/50 px-2 flex mb-4">
          <TabsList className="bg-transparent p-0 justify-start gap-4 sm:gap-6 h-auto w-full overflow-x-auto no-scrollbar">
            {['Tokens', 'Activity'].map((tabValue) => (
              <TabsTrigger 
                key={tabValue}
                value={tabValue.toLowerCase()} 
                className="px-0 py-2 sm:py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground font-semibold transition-all shadow-none whitespace-nowrap text-sm sm:text-base"
              >
                {tabValue}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tokens Tab Content */}
        <TabsContent value="tokens" className="m-0 focus-visible:outline-none space-y-4">
          
          <div className="flex items-center justify-between px-2">
            <NetworkSelector selectedNetworkId={networkId} onNetworkChange={onNetworkChange} />
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                 <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 5.5H13.5M4.5 10.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                 <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm bg-card/50">
            <div className="flex flex-col">
              {dashboardVisibleAssets.map((asset, index) => (
                <div 
                  key={asset.symbol} 
                  onClick={() => setSelectedAssetSymbol(asset.symbol)}
                  className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer ${
                    selectedAssetSymbol === asset.symbol ? 'bg-muted/30 border-l-4 border-l-primary' : ''
                  } ${
                    index !== dashboardVisibleAssets.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <TokenIcon symbol={asset.symbol} className="w-10 h-10" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base">{asset.symbol}</p>
                        {!asset.isReal && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-muted/80 rounded flex items-center">Mock</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <p className={`font-semibold text-base transition-opacity duration-300 ${loading && asset.isReal ? 'opacity-50' : 'opacity-100'}`}>
                        {asset.balance}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{asset.usdValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
        </TabsContent>

        <TabsContent value="activity" className="m-0 focus-visible:outline-none">
          <TransactionHistory networkId={networkId} address={address} />
        </TabsContent>

      </Tabs>

      <SendTransactionModal 
        isOpen={isSendModalOpen} 
        onClose={() => setIsSendModalOpen(false)} 
        networkId={networkId} 
        onNetworkChange={onNetworkChange || (() => {})}
        address={address} 
        assets={ASSETS}
        onTransactionComplete={handleTransactionComplete}
      />
      
      <ReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        address={address}
      />
    </div>
  );
}