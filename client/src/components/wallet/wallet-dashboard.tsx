import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORK_CONFIGS } from '@/config/alchemyAccount';

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

  // We keep USDC and BTC as dummy visual placeholders for now to maintain the rich UI
  // until a covalent/alchemy token API is fully integrated, but ETH is real.
  const ASSETS = [
    { symbol: 'ETH', name: 'Ethereum', balance: balanceETH, usdValue: '---', change: '+0.0%', positive: true, isReal: true },
    { symbol: 'USDC', name: 'USD Coin', balance: '12,450.00', usdValue: '$12,450.00', change: '+2.3%', positive: true, isReal: false },
    { symbol: 'BTC', name: 'Bitcoin', balance: '0.2841', usdValue: '$18,912.50', change: '-0.8%', positive: false, isReal: false },
  ];

  const totalUsd = '$43,446.86';

  return (
    <div className="space-y-6">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
        <CardContent className="p-6">
          <p className="text-blue-200 text-sm mb-1">Total Portfolio Value</p>
          <p className="text-4xl font-bold mb-1">{totalUsd}</p>
          <div className="flex items-center gap-1 text-emerald-300 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span>+3.2% this week</span>
          </div>
          <p className="text-blue-300 text-xs mt-3 font-mono">{address}</p>
        </CardContent>
      </Card>

      {/* Asset List */}
      <div className="space-y-3">
        {ASSETS.map(asset => (
          <Card key={asset.symbol}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-sm">
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{asset.symbol}</p>
                    {!asset.isReal && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">Mock</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {loading && asset.isReal ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : <p className="font-semibold text-sm">{asset.balance}</p>}
                </div>
                <p className="text-xs text-muted-foreground">{asset.usdValue}</p>
                <Badge variant={asset.positive ? 'default' : 'destructive'} className="text-xs mt-0.5">
                  {asset.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <span className="font-medium text-sm">Send</span>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            </div>
            <span className="font-medium text-sm">Receive</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}