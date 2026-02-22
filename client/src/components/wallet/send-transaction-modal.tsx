import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { transactionService } from '@/services/transactionService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import { TokenSelector, TokenIcon, getTokenColor, hasValue } from './token-selector';
import { NetworkSelector } from './network-selector';
import { Search, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: number;
  onNetworkChange: (id: number) => void;
  address: string;
  assets: any[];
  onTransactionComplete?: (symbol: string, amount: string) => void;
}

export function SendTransactionModal({ isOpen, onClose, networkId, onNetworkChange, address, assets, onTransactionComplete }: SendTransactionModalProps) {
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenType, setTokenType] = useState(assets[0]?.symbol || 'ETH');
  const [useAA, setUseAA] = useState(true);
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'select' | 'form' | 'password'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Hardcoded for demo parity. In production, import STABLECOIN_ADDRESSES from config
  const usdcAddress = networkId === 84532 ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : 
                      networkId === 4202 ? "0x17b3531549F842552911CB287CCf7a5F328ff7d1" : 
                      networkId === 11155111 ? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" : undefined;

  useEffect(() => {
    if (!isOpen) {
      setRecipient('');
      setAmount('');
      setPassword('');
      setEstimatedGas(null);
      setStep('select');
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const estimate = async () => {
      if (!recipient || !amount || parseFloat(amount) <= 0 || recipient.length !== 42) {
        setEstimatedGas(null);
        return;
      }

      setIsEstimating(true);
      try {
        const isNative = tokenType === assets[0]?.symbol;
        const gas = await transactionService.estimateGas({
          recipientAddress: recipient,
          amount,
          tokenAddress: !isNative ? usdcAddress : undefined,
          tokenDecimals: !isNative ? 6 : 18,
          networkId: networkId.toString(),
          password: password || 'dummy' // Ethers requires the signer to estimate gas, we inject a temp or actual password
        });
        setEstimatedGas(gas.estimatedCost);
      } catch (err) {
        setEstimatedGas(null);
      } finally {
        setIsEstimating(false);
      }
    };
    
    // We only estimate if password is typed (or if we abstract the estimation to public provider later)
    if (password.length >= 6) {
        const timeout = setTimeout(estimate, 1000);
        return () => clearTimeout(timeout);
    }
  }, [recipient, amount, tokenType, password, networkId, usdcAddress]);

  const handleSend = async () => {
    if (!recipient || !amount || !password) {
      toast({ title: "Incomplete", description: "Please fill all fields natively.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const isNative = tokenType === assets[0]?.symbol;
      const tx = await transactionService.sendTransaction({
        recipientAddress: recipient,
        amount,
        tokenAddress: !isNative ? usdcAddress : undefined,
        tokenDecimals: !isNative ? 6 : 18,
        networkId: networkId.toString(),
        password,
        useAccountAbstraction: useAA,
        gasless: useAA
      });

      toast({
        title: "Transaction Sent",
        description: `Successfully transmitted! Hash: ${tx.hash.slice(0, 10)}...`,
      });
      onTransactionComplete?.(tokenType, amount);
      onClose();
    } catch (err: any) {
      toast({
        title: "Transaction Failed",
        description: err.message || "Failed to broadcast transaction",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredAssets = assets.filter(a => 
    a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = assets.find((asset) => asset.symbol === tokenType) || assets[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 border-border/50 gap-0 p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[650px] max-h-screen">
        <DialogHeader className="p-4 border-b border-border/50 relative shrink-0">
          <div className="flex items-center justify-center">
            {step !== 'select' && (
              <button 
                onClick={() => setStep(step === 'password' ? 'form' : 'select')}
                className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-lg font-bold">
              {step === 'select' ? "Send" : step === 'form' ? `Send ${tokenType}` : "Confirm Transaction"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {step === 'select' && (
            <div className="flex flex-col h-full">
              <div className="p-4 space-y-4 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search for an asset to send" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background/50 border border-border/50 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border transition-colors focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                
                <div>
                  <NetworkSelector 
                    selectedNetworkId={networkId} 
                    onNetworkChange={onNetworkChange} 
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {filteredAssets.length === 0 ? (
                   <div className="py-8 text-center text-muted-foreground text-sm">No tokens found.</div>
                ) : (
                  filteredAssets.map((asset) => (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        setTokenType(asset.symbol);
                        setStep('form');
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group relative"
                    >
                      <TokenIcon symbol={asset.symbol} className="w-10 h-10" />
                      
                      <div className="flex-1 overflow-hidden flex flex-col justify-center">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                          {asset.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{asset.symbol}</p>
                      </div>

                      <div className="text-right flex flex-col justify-center">
                        <span className="font-semibold text-sm text-foreground">
                          {hasValue(asset.usdValue) ? asset.usdValue : `${asset.balance} ${asset.symbol}`}
                        </span>
                        {hasValue(asset.usdValue) && (
                          <span className="text-xs text-muted-foreground">{asset.balance} {asset.symbol}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="p-6 space-y-6 flex-1 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <TokenIcon symbol={selectedAsset.symbol} className="w-8 h-8" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedAsset.symbol} Balance</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{selectedAsset.balance}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input 
                  placeholder="0x..." 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)} 
                  className="font-mono text-sm tracking-tight rounded-xl bg-background/50 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="0.00" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="font-mono text-lg rounded-xl bg-background/50 h-14 pr-16"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    {tokenType}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-1.5 cursor-pointer">
                      Gasless Transaction <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Use Alchemy Account Abstraction
                    </p>
                  </div>
                  <Switch 
                    checked={useAA} 
                    onCheckedChange={setUseAA} 
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {estimatedGas && !useAA && (
                  <div className="text-xs font-mono text-muted-foreground flex justify-between pt-2 border-t border-primary/10">
                    <span>Estimated Gas:</span>
                    <span>{estimatedGas}</span>
                  </div>
                )}
                {useAA && (
                  <div className="text-xs font-mono text-emerald-500 flex justify-between pt-2 border-t border-primary/10">
                    <span>Estimated Gas:</span>
                    <span>SPONSORED ($0.00)</span>
                  </div>
                )}
              </div>

              <div className="flex-1" />

              <Button 
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/20 shrink-0 mt-4"
                onClick={() => setStep('password')}
                disabled={!recipient || !amount || parseFloat(amount) <= 0}
              >
                Next
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Decrypt with password</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                    Enter your local wallet password to decrypt your secure enclave and sign the {amount} {tokenType} transaction.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  type="password"
                  placeholder="Enter Password" 
                  value={password} 
                  autoFocus
                  onChange={(e) => setPassword(e.target.value)} 
                  className="rounded-xl border-border/50 focus-visible:ring-primary/50 bg-background/50 h-12 text-center text-lg"
                />
              </div>

              <div className="flex-1" />

              <Button 
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/20 shrink-0 mt-4"
                onClick={handleSend}
                disabled={isSending || !password}
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {isSending ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
