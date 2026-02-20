import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { EnhancedWalletOverview } from '@/components/wallet/wallet-dashboard';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { useWallet } from '@/hooks/use-wallet';
import { Download, Upload, Shield, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Wallet() {
  const [, setLocation] = useLocation();
  const { isUnlocked, settings, exportPrivateKey, exportMnemonic, walletExists, isLoading, wallet } = useWallet();
  const selectedNetworkId = settings.selectedNetworkId;
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'privateKey' | 'mnemonic'>('privateKey');
  const [exportedData, setExportedData] = useState('');
  const [showExportData, setShowExportData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!walletExists()) {
        setLocation('/create-wallet');
      } else if (!isUnlocked) {
        setLocation('/unlock-wallet');
      }
    }
  }, [isUnlocked, walletExists, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-lg font-semibold animate-pulse">Loading BlockFinaX...</div>
      </div>
    );
  }

  if (!walletExists() || !isUnlocked) {
    return null; // Will redirect
  }

  const handleExportPrivateKey = async () => {
    try {
      const password = window.prompt("Enter your wallet password to export private key:");
      if (!password) return;
      
      const privateKey = await exportPrivateKey(password);
      setExportedData(privateKey);
      setExportType('privateKey');
      setExportModalOpen(true);
      setShowExportData(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export private key. Make sure your wallet is unlocked.",
      });
    }
  };

  const handleExportMnemonic = async () => {
    try {
      const password = window.prompt("Enter your wallet password to export seed phrase:");
      if (!password) return;

      const mnemonic = await exportMnemonic(password);
      if (mnemonic) {
        setExportedData(mnemonic);
        setExportType('mnemonic');
        setExportModalOpen(true);
        setShowExportData(false);
      } else {
        toast({
          variant: "destructive",
          title: "No Seed Phrase",
          description: "This wallet was imported using a private key and doesn't have a seed phrase.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not export seed phrase. Make sure your wallet is unlocked.",
      });
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportedData);
    toast({
      title: "Copied!",
      description: `${exportType === 'privateKey' ? 'Private key' : 'Seed phrase'} copied to clipboard.`,
    });
  };

  return (
    <div className="h-full flex flex-col items-center bg-muted/10 overflow-y-auto w-full">
      <div className="w-full max-w-md p-4 sm:p-6 space-y-6 pb-24">
      
      <EnhancedWalletOverview 
        address={wallet?.address || ""}
        networkId={selectedNetworkId}
        onTabChange={() => {}}
      />
      
      <TransactionHistory networkId={selectedNetworkId} />

      {/* Security settings moved into the page content cleanly */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-primary" /> Security & Backup
        </h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={handleExportMnemonic} className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4" /> Export Seed Phrase
          </Button>
          <Button variant="outline" onClick={handleExportPrivateKey} className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" /> Export Private Key
          </Button>
        </div>
      </div>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}</span>
            </DialogTitle>
            <DialogDescription>
              {exportType === 'privateKey' 
                ? 'Your private key gives full access to your wallet. Keep it secure and never share it.'
                : 'Your seed phrase can restore your entire wallet. Store it safely and never share it.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive mb-1">Security Warning</p>
                  <p className="text-muted-foreground">
                    Anyone with access to this {exportType === 'privateKey' ? 'private key' : 'seed phrase'} can steal your funds. 
                    Only copy it to a secure location.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">
                {exportType === 'privateKey' ? 'Private Key' : 'Seed Phrase'}
              </div>
              <div className="relative">
                <textarea
                  id="export-data"
                  className="w-full p-3 bg-muted rounded-lg font-mono text-sm min-h-[100px] resize-none"
                  value={showExportData ? exportedData : '•'.repeat(exportedData.length)}
                  readOnly
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowExportData(!showExportData)}
                >
                  {showExportData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyToClipboard} className="flex items-center space-x-2">
              <Copy className="h-4 w-4" />
              <span>Copy to Clipboard</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      </div>
    </div>
  );
}
