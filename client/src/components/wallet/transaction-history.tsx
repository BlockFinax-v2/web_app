// Dummy — no real blockchain integration
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const DUMMY_TXS = [
  { type: 'send', amount: '-500 USDC', to: '0xAbCd...5678', date: 'Feb 18, 2025', status: 'confirmed' },
  { type: 'receive', amount: '+2,000 USDC', from: '0x1234...9012', date: 'Feb 16, 2025', status: 'confirmed' },
  { type: 'send', amount: '-0.5 ETH', to: '0xDeF0...3456', date: 'Feb 14, 2025', status: 'confirmed' },
  { type: 'receive', amount: '+0.8 ETH', from: '0x7890...1234', date: 'Feb 12, 2025', status: 'confirmed' },
];

interface Props { address?: string; networkId?: number; }
export function TransactionHistory(_props: Props) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold mb-3 px-1">Recent Activity</h3>
      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <div className="flex flex-col">
          {DUMMY_TXS.map((tx, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer ${
                i !== DUMMY_TXS.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'send' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  {tx.type === 'send'
                    ? <ArrowUpRight className="h-5 w-5 text-red-500" />
                    : <ArrowDownLeft className="h-5 w-5 text-emerald-500" />}
                </div>
                <div>
                  <p className="font-semibold text-base capitalize">{tx.type}</p>
                  <p className="text-sm text-muted-foreground font-mono">{tx.type === 'send' ? `To: ${tx.to}` : `From: ${tx.from}`}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-base ${tx.type === 'send' ? 'text-foreground' : 'text-emerald-500'}`}>{tx.amount}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">{tx.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      <div className="flex justify-center mt-4">
        <button className="text-sm text-primary font-medium hover:underline">
          View all activity
        </button>
      </div>
    </div>
  );
}
