// Dummy wallet dashboard component — no real blockchain integration
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';

const DUMMY_BALANCES = [
  { symbol: 'USDC', name: 'USD Coin', balance: '12,450.00', usdValue: '$12,450.00', change: '+2.3%', positive: true },
  { symbol: 'ETH', name: 'Ethereum', balance: '3.812', usdValue: '$12,084.36', change: '+5.1%', positive: true },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.2841', usdValue: '$18,912.50', change: '-0.8%', positive: false },
];

interface Props {
  address: string;
  networkId?: number;
  onSend?: () => void;
  onReceive?: () => void;
}

export function EnhancedWalletOverview({ address }: Props) {
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
        {DUMMY_BALANCES.map(asset => (
          <Card key={asset.symbol}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-300 text-sm">
                  {asset.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{asset.balance}</p>
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