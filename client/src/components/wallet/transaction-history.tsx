import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Clock, Loader2 } from 'lucide-react';
import { transactionHistoryService, UnifiedTransaction } from '@/services/transactionHistoryService';

interface Props { address?: string; networkId?: number | string; }
export function TransactionHistory({ address, networkId }: Props) {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!address) return;
      try {
        setLoading(true);
        // Note: In a fully production app with an indexer, we'd query Alchemy/Etherscan here.
        // For this implementation, we read our local recorded history for parity with mobile.
        const history = await transactionHistoryService.getTransactionHistory(address, {
          network: networkId?.toString()
        });
        if (isMounted) setTransactions(history);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, [address, networkId]);
  return (
    <div className="pt-2">
      <h3 className="text-sm font-semibold mb-3 px-1">Recent Activity</h3>
      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <div className="flex flex-col">
          {loading ? (
            <div className="p-8 flex justify-center items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
                 <Clock className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-semibold">No recent activity</h3>
               <p className="text-sm text-muted-foreground max-w-xs mt-2">Transactions you make will appear here.</p>
            </div>
          ) : transactions.map((tx, i) => (
            <div 
              key={tx.id || i} 
              className={`p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer ${
                i !== transactions.length - 1 ? 'border-b border-border/50' : ''
              }`}
              onClick={() => tx.explorerUrl && window.open(tx.explorerUrl, '_blank')}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'send' ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                  {tx.type === 'send'
                    ? <ArrowUpRight className="h-5 w-5 text-red-500" />
                    : <ArrowDownLeft className="h-5 w-5 text-emerald-500" />}
                </div>
                <div>
                  <p className="font-semibold text-base capitalize">{tx.description || tx.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {tx.type === 'send' 
                      ? `To: ${tx.to.slice(0,6)}...${tx.to.slice(-4)}` 
                      : tx.from ? `From: ${tx.from.slice(0,6)}...${tx.from.slice(-4)}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-base ${tx.type === 'send' ? 'text-foreground' : 'text-emerald-500'}`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount || '0'} {tx.tokenSymbol || 'ETH'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                  {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
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
