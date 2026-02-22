import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Clock, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { transactionHistoryService, UnifiedTransaction } from '@/services/transactionHistoryService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props { address?: string; networkId?: number | string; }
export function TransactionHistory({ address, networkId }: Props) {
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTx, setSelectedTx] = useState<UnifiedTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory(showLoader = true) {
      if (!address) return;
      try {
        if (showLoader) setLoading(true);
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
    
    // Listen for real-time background transactions (Pending -> Success/Failure)
    const handleTxUpdate = () => {
      if (isMounted) fetchHistory(false); // fetch without showing main skeleton loader
    };
    
    transactionHistoryService.events.addEventListener('transaction_updated', handleTxUpdate);

    return () => { 
      isMounted = false; 
      transactionHistoryService.events.removeEventListener('transaction_updated', handleTxUpdate);
    };
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
              onClick={() => {
                setSelectedTx(tx);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.status === 'pending' ? 'bg-blue-500/10' :
                  tx.type === 'send' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                }`}>
                  {tx.status === 'pending' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : tx.type === 'send' ? (
                    <ArrowUpRight className="h-5 w-5 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-base capitalize flex items-center gap-2">
                    {tx.description || tx.type.replace(/_/g, ' ')}
                    {tx.status === 'pending' && <span className="text-xs text-blue-500 font-medium tracking-tight animate-pulse">(Pending)</span>}
                  </p>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 border-border/50 p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-border/50">
            <DialogTitle className="text-lg font-bold text-center">
              Transaction Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTx && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  selectedTx.status === 'pending' ? 'bg-blue-500/10' :
                  selectedTx.type === 'send' ? 'bg-red-500/10' : 'bg-emerald-500/10'
                }`}>
                  {selectedTx.status === 'pending' ? (
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  ) : selectedTx.type === 'send' ? (
                    <ArrowUpRight className="h-8 w-8 text-red-500" />
                  ) : (
                    <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {selectedTx.type === 'send' ? 'Send' : 'Receive'} {selectedTx.tokenSymbol || 'ETH'}
                </h3>
                <p className={`font-semibold text-2xl ${selectedTx.type === 'send' ? 'text-foreground' : 'text-emerald-500'}`}>
                  {selectedTx.type === 'send' ? '-' : '+'}{selectedTx.amount || '0'} {selectedTx.tokenSymbol || 'ETH'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${
                    selectedTx.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    selectedTx.status === 'pending' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {selectedTx.status}
                  </span>
                  {selectedTx.description?.toLowerCase().includes('gasless') && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider bg-purple-500/10 text-purple-500">
                      Gasless
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 bg-muted/30 p-4 rounded-xl border border-border/50 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Network</span>
                  <span className="font-semibold">{selectedTx.network || 'Ethereum'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Date</span>
                  <span className="font-semibold">
                    {new Date(selectedTx.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">From</span>
                  <span className="font-mono font-medium truncate max-w-[150px]">
                    {selectedTx.from}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">To</span>
                  <span className="font-mono font-medium truncate max-w-[150px]">
                    {selectedTx.to}
                  </span>
                </div>
                {selectedTx.hash && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">Hash</span>
                    <button 
                      onClick={() => handleCopyHash(selectedTx.hash)}
                      className="flex items-center gap-1.5 font-mono font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedTx.hash.slice(0, 10)}...{selectedTx.hash.slice(-8)}
                      {copiedHash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={() => selectedTx.explorerUrl && window.open(selectedTx.explorerUrl, '_blank')}
                  disabled={!selectedTx.explorerUrl}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
