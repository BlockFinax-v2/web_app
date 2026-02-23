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
import { Search, ChevronLeft, ChevronRight, Check, Info, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NETWORK_CONFIGS } from "@/config/alchemyAccount";

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
  const [step, setStep] = useState<'select' | 'form' | 'review' | 'password'>('select');
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
                onClick={() => {
                  if (step === 'password') setStep('review');
                  else if (step === 'review') setStep('form');
                  else if (step === 'form') setStep('select');
                }}
                className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-lg font-bold">
              {step === 'select' ? "Send" : step === 'form' ? `Send ${tokenType}` : step === 'review' ? 'Review' : "Confirm Transaction"}
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
                <div className="flex items-center justify-between">
                  <Label>Amount</Label>
                  <button
                    type="button"
                    onClick={() => setAmount(selectedAsset?.balance ?? '')}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md transition-colors"
                  >
                    Max
                  </button>
                </div>
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
                onClick={() => setStep('review')}
                disabled={!recipient || !amount || parseFloat(amount) <= 0}
              >
                Review
              </Button>
            </div>
          )}

          {step === 'review' && (
            <div className="p-4 sm:p-6 space-y-6 flex-1 flex flex-col overflow-y-auto bg-[#1c1c1e]">
              <div className="flex flex-col items-center justify-center space-y-1 py-4">
                <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center mb-2">
                  <span className="font-bold text-lg">{tokenType.charAt(0)}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-center text-white">
                  {amount} {tokenType}
                </p>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4 bg-[#2c2c2e] rounded-xl border border-white/5">
                <div className="space-y-1.5">
                  <p className="text-xs text-white/50 font-medium">From</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-purple-500/20 items-center justify-center flex shrink-0">
                      <span className="text-[10px] text-purple-400">❖</span>
                    </div>
                    <div className="flex flex-col w-full overflow-hidden">
                       <p className="text-sm font-medium text-white truncate">
                         {address ? `${address.slice(0, 8)}...` : 'Wallet 1'}
                       </p>
                       <p className="text-[10px] text-white/50">Wallet 1</p>
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="h-5 w-5 text-white/30" />
                
                <div className="space-y-1.5 pl-2">
                  <p className="text-xs text-white/50 font-medium">To</p>
                   <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 items-center justify-center flex shrink-0">
                      <span className="text-[10px] text-blue-400">◢</span>
                    </div>
                    <div className="flex flex-col w-full overflow-hidden">
                       <p className="text-sm font-medium text-white truncate">
                         {recipient.slice(0, 8)}...
                       </p>
                       <p className="text-[10px] text-white/50">Wallet 2</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-0 text-white rounded-xl overflow-hidden border border-white/5">
                <div className="flex justify-between items-center p-4 bg-[#2c2c2e] border-b border-black/20">
                  <span className="text-[15px] font-medium text-white/60 flex items-center gap-1.5">Network <Info className="h-3 w-3" /></span>
                  <span className="font-medium text-[15px] flex items-center gap-2">
                    <div className="w-4 h-4 bg-black rounded flex items-center justify-center"><span className="text-[10px] font-bold">{(NETWORK_CONFIGS as Record<string, any>)[networkId]?.name?.charAt(0) || 'N'}</span></div>
                    {(NETWORK_CONFIGS as Record<string, any>)[networkId]?.name || 'Unknown'}
                  </span>
                </div>
                
                <div className="p-4 bg-[#2c2c2e] space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[15px] font-medium text-white/60 flex items-center gap-1.5">Network fee <Info className="h-3 w-3" /></span>
                    <div className="flex flex-col items-end text-right">
                       <span className="font-medium text-[15px] flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-4 w-4 text-blue-400 hover:text-blue-300"><Edit2 className="h-3 w-3"/></Button>
                         {useAA ? '0' : estimatedGas || '...'} <span className="text-white/80">{(NETWORK_CONFIGS as Record<string, any>)[networkId]?.nativeCurrency?.symbol || 'ETH'}</span>
                       </span>
                       <span className="text-xs text-white/40 mt-0.5">$0.00</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[15px] font-medium text-white/60">Speed</span>
                    <span className="text-[15px] font-medium text-blue-400">Market <span className="text-white/80">~15 sec</span></span>
                  </div>
                   <div className="flex justify-between items-center pt-2">
                    <span className="text-[15px] font-medium text-white/60 flex items-center gap-1.5">Max fee <Info className="h-3 w-3" /></span>
                     <span className="font-medium text-[15px]">
                         {useAA ? '0' : estimatedGas || '0'}
                     </span>
                  </div>
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex gap-4 mt-2 shrink-0 border-t border-white/5 pt-4">
                <Button 
                  variant="outline"
                  className="w-full h-14 rounded-2xl bg-[#2c2c2e] border-transparent hover:bg-[#3a3a3c] text-white hover:text-white text-base font-semibold"
                  onClick={() => setStep('form')}
                >
                  Cancel
                </Button>
                <Button 
                  className="w-full h-14 rounded-2xl bg-white hover:bg-gray-200 text-black font-bold text-base shadow-lg"
                  onClick={() => setStep('password')}
                >
                  Confirm
                </Button>
              </div>
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
