// Dummy — no real blockchain integration
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const DUMMY_TXS = [
  { type: 'send', amount: '-500 USDC', to: '0xAbCd...5678', date: '2025-02-18', status: 'confirmed' },
  { type: 'receive', amount: '+2,000 USDC', from: '0x1234...9012', date: '2025-02-16', status: 'confirmed' },
  { type: 'send', amount: '-0.5 ETH', to: '0xDeF0...3456', date: '2025-02-14', status: 'confirmed' },
  { type: 'receive', amount: '+0.8 ETH', from: '0x7890...1234', date: '2025-02-12', status: 'confirmed' },
  { type: 'send', amount: '-300 USDC', to: '0xAaBb...9988', date: '2025-02-10', status: 'confirmed' },
];

interface Props { address?: string; networkId?: number; }
export function TransactionHistory(_props: Props) {
  return (
    <div className="space-y-3">
      {DUMMY_TXS.map((tx, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'send' ? 'bg-red-100 dark:bg-red-900' : 'bg-emerald-100 dark:bg-emerald-900'}`}>
                {tx.type === 'send'
                  ? <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-300" />
                  : <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
              </div>
              <div>
                <p className="font-medium text-sm capitalize">{tx.type}</p>
                <p className="text-xs text-muted-foreground font-mono">{tx.type === 'send' ? tx.to : tx.from}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${tx.type === 'send' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{tx.amount}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="h-3 w-3" />{tx.date}</p>
              <Badge variant="outline" className="text-xs mt-0.5">Confirmed</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
