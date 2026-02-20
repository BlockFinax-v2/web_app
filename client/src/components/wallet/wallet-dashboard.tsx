import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard, Loader2, Copy } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORK_CONFIGS } from '@/config/alchemyAccount';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

      {/* Unified Asset List */}
      <div className="pt-4">
        <h3 className="text-sm font-semibold mb-3 px-1">Tokens</h3>
        <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
          <div className="flex flex-col">
            {ASSETS.map((asset, index) => (
              <div 
                key={asset.symbol} 
                className={`p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer ${
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
                      {!asset.isReal && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50 rounded-full">Mock</Badge>}
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
      </div>

    </div>
  );
}