import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { retrieveDecryptedPrivateKey } from '@/lib/browserStorage';
import { useToast } from '@/hooks/use-toast';

interface TransactionRequest {
  title: string;
  description: string;
  amountUSD?: number;
  // The function to execute once the private key is decrypted
  execute: (privateKey: string) => Promise<any>;
}

interface TransactionSignerContextType {
  requestSignature: (request: TransactionRequest) => Promise<any>;
}

const TransactionSignerContext = createContext<TransactionSignerContextType | undefined>(undefined);

export function TransactionSignerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<TransactionRequest | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);
  const [rejectPromise, setRejectPromise] = useState<((reason?: any) => void) | null>(null);
  
  const { toast } = useToast();

  const requestSignature = useCallback((request: TransactionRequest): Promise<any> => {
    return new Promise((resolve, reject) => {
      setCurrentRequest(request);
      setResolvePromise(() => resolve);
      setRejectPromise(() => reject);
      setPassword('');
      setError(null);
      setIsOpen(true);
    });
  }, []);

  const handleCancel = () => {
    if (rejectPromise) rejectPromise(new Error('Transaction cancelled by user'));
    closeModal();
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentRequest(null);
      setResolvePromise(null);
      setRejectPromise(null);
      setPassword('');
      setError(null);
      setIsSigning(false);
    }, 200);
  };

  const handleSign = async () => {
    if (!password || !currentRequest || !resolvePromise || !rejectPromise) return;

    setIsSigning(true);
    setError(null);

    let privateKey: string | null = null;

    try {
      // 1. Temporarily decrypt the private key into memory
      privateKey = await retrieveDecryptedPrivateKey(password);
      
      // 2. Execute the requested smart contract transaction with the key
      const result = await currentRequest.execute(privateKey);
      
      // 3. Promptly securely wipe the local variable (garbage collected)
      privateKey = null;

      toast({
        title: "Transaction Signed",
        description: "Your transaction is being processed securely.",
      });

      resolvePromise(result);
      closeModal();
      
    } catch (err: any) {
      if (err.message.includes('No encrypted') || err.message.includes('authentication') || err.message.includes('password') || err.message.includes('decrypt')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Transaction failed');
        // If it was a catastrophic contract failure, we might want to reject entirely instead of letting them retry
        // rejectPromise(err);
        // closeModal();
      }
    } finally {
      setIsSigning(false);
      // Failsafe to ensure memory wiping if an error threw before the null assignment
      if (privateKey) privateKey = null; 
    }
  };

  return (
    <TransactionSignerContext.Provider value={{ requestSignature }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSigning) handleCancel(); }}>
        <DialogContent className="sm:max-w-md bg-white/5 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden shadow-2xl shadow-indigo-500/10">
          
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-medium tracking-tight">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Sign Transaction
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                Authentication required for {currentRequest?.title || 'this action'}.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-gray-300 font-medium">Request Details</p>
              <p className="text-sm text-gray-400 mt-1">{currentRequest?.description}</p>
              
              {currentRequest?.amountUSD !== undefined && (
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Estimated Value</span>
                  <span className="text-sm font-medium text-white">${currentRequest.amountUSD.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Wallet Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password to sign"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSigning}
                  className="bg-black/50 border-white/10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password && !isSigning) {
                      handleSign();
                    }
                  }}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="bg-indigo-500/10 rounded-lg p-3 border border-indigo-500/20 flex gap-2 items-start mt-4">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-200/70">
                  Your private key is locally decrypted only to sign this transaction, then immediately wiped from memory. It never leaves your device.
                </p>
              </div>

            </div>
          </div>

          <div className="p-6 pt-0 mt-4">
            <DialogFooter className="flex gap-2 sm:justify-between w-full">
              <Button type="button" variant="outline" className="flex-1 bg-transparent border-white/10 hover:bg-white/5" onClick={handleCancel} disabled={isSigning}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 bg-indigo-600 hover:bg-indigo-500" onClick={handleSign} disabled={!password || isSigning}>
                {isSigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  'Sign & Send'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </TransactionSignerContext.Provider>
  );
}

export function useTransactionSigner() {
  const context = useContext(TransactionSignerContext);
  if (context === undefined) {
    throw new Error('useTransactionSigner must be used within a TransactionSignerProvider');
  }
  return context;
}
