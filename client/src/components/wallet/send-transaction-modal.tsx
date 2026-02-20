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
import { TokenSelector } from './token-selector';

interface SendTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  networkId: string;
  address: string;
  assets: any[];
}

export function SendTransactionModal({ isOpen, onClose, networkId, address, assets }: SendTransactionModalProps) {
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  // We'll set the initial token to the Native token symbol instead of 'NATIVE', defaulting to 'ETH'
  const [tokenType, setTokenType] = useState(assets[0]?.symbol || 'ETH');
  const [useAA, setUseAA] = useState(true);
  const [password, setPassword] = useState('');
  
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Hardcoded for demo parity. In production, import STABLECOIN_ADDRESSES from config
  const usdcAddress = networkId === "84532" ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : 
                      networkId === "4202" ? "0x17b3531549F842552911CB287CCf7a5F328ff7d1" : 
                      networkId === "11155111" ? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" : undefined;

  useEffect(() => {
    if (!isOpen) {
      setRecipient('');
      setAmount('');
      setPassword('');
      setEstimatedGas(null);
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
          networkId,
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
        networkId,
        password,
        useAccountAbstraction: useAA,
        gasless: useAA
      });

      toast({
        title: "Transaction Sent",
        description: `Successfully transmitted! Hash: ${tx.hash.slice(0, 10)}...`,
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Send Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <Input 
              placeholder="0x..." 
              value={recipient} 
              onChange={(e) => setRecipient(e.target.value)} 
              className="font-mono text-sm tracking-tight rounded-xl bg-background/50"
            />
          </div>

          <div className="flex gap-4">
            <div className="space-y-2 flex-grow">
              <Label>Amount</Label>
              <Input 
                type="number"
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="font-mono text-lg rounded-xl bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset</Label>
              <TokenSelector 
                assets={assets}
                selectedSymbol={tokenType}
                onSelect={(symbol) => setTokenType(symbol)}
              />
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base flex items-center gap-1.5 cursor-pointer">
                  Gasless Transaction <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use Alchemy Account Abstraction to sponsor gas fees.
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

          <div className="space-y-2 pt-2">
            <Label>Wallet Password</Label>
            <Input 
              type="password"
              placeholder="Decrypt to sign" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="rounded-xl border-orange-500/30 focus-visible:ring-orange-500/50 bg-orange-500/5"
            />
            <p className="text-[10px] text-muted-foreground">
              Required to decrypt your secure local enclave and sign the payload.
            </p>
          </div>

          <Button 
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base mt-4 shadow-lg shadow-blue-500/20"
            onClick={handleSend}
            disabled={isSending || !recipient || !amount || !password}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {isSending ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
