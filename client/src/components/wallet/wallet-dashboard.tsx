import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Loader2, Copy, MoreVertical } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORK_CONFIGS } from '@/config/alchemyAccount';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { NetworkSelector } from '@/components/wallet/network-selector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionHistory } from '@/components/wallet/transaction-history';

interface Props {
  address: string;
  networkId?: number;
  selectedNetworkId?: number;
  onSend?: () => void;
  onReceive?: () => void;
  onTabChange?: (tab: string) => void;
}

export function EnhancedWalletOverview({ address, networkId = 84532 }: Props) {
  const [balanceETH, setBalanceETH] = useState<string>("0.00");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    async function fetchBalance() {
      if (!address) return;
      try {
        setLoading(true);
        const configs = Object.values(NETWORK_CONFIGS);
        const network = configs.find(n => n.chainId === networkId) || configs[0];
        
        if (network && network.rpcUrl) {
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const balanceWei = await provider.getBalance(address);
          const balStr = ethers.formatEther(balanceWei);
          // Round to 4 decimal places
          if (isMounted) setBalanceETH(parseFloat(balStr).toFixed(4));
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchBalance();
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
    { symbol: 'ETH', name: 'Ethereum', balance: balanceETH, usdValue: '$0.00', change: '+0.0%', positive: true, isReal: true },
    { symbol: 'USDC', name: 'USD Coin', balance: '12,450.00', usdValue: '$12,450.00', change: '+2.3%', positive: true, isReal: false },
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.2841', usdValue: '$18,912.50', change: '-0.8%', positive: false, isReal: false },
  ];

  const totalUsd = '$43,446.86';

  return (
    <div className="space-y-6">
      
      {/* Sleek Centralized Balance Card */}
      <div className="flex flex-col items-center justify-center pt-4 pb-2">
        <button 
          onClick={copyAddress}
          className="flex items-center gap-2 mb-4 px-3 py-1 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full text-xs font-mono transition-colors"
        >
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Loading...'}
          <Copy className="h-3 w-3" />
        </button>
        
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 text-foreground">
          {totalUsd}
        </h1>
        <p className="text-sm font-medium text-emerald-500">
          +$1,346.20 (3.2%) Today
        </p>
      </div>

      {/* Action Buttons Row */}
      <div className="flex justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-2">
          <Button size="icon" className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            <ArrowUpRight className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium">Send</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <Button size="icon" className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
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
            {['Tokens', 'DeFi', 'NFTs', 'Activity'].map((tabValue) => (
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
            <NetworkSelector selectedNetworkId={networkId} onNetworkChange={() => {}} />
            
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
              {ASSETS.map((asset, index) => (
                <div 
                  key={asset.symbol} 
                  className={`p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer ${
                    index !== ASSETS.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {asset.symbol.slice(0, 2)}
                    </div>
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
                      {loading && asset.isReal 
                        ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> 
                        : <p className="font-semibold text-base">{asset.balance}</p>
                      }
                    </div>
                    <p className="text-sm text-muted-foreground">{asset.usdValue}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <div className="flex justify-center pt-2">
            <button className="text-sm font-semibold text-primary hover:underline">
               Import tokens
            </button>
          </div>
        </TabsContent>

        {/* Placeholders for other tabs */}
        <TabsContent value="defi" className="m-0 focus-visible:outline-none">
          <div className="py-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             </div>
             <h3 className="text-lg font-semibold">No DeFi Positions</h3>
             <p className="text-sm text-muted-foreground max-w-xs mt-2">Explore the ecosystem to start earning yield.</p>
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="m-0 focus-visible:outline-none">
          <div className="py-12 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             </div>
             <h3 className="text-lg font-semibold">No NFTs yet</h3>
             <p className="text-sm text-muted-foreground max-w-xs mt-2">Learn more about digital collectibles.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="m-0 focus-visible:outline-none">
          <TransactionHistory networkId={networkId} address={address} />
        </TabsContent>

      </Tabs>
    </div>
  );
}