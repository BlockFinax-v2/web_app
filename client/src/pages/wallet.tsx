import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { EnhancedWalletOverview } from '@/components/wallet/wallet-dashboard';
import { TransactionHistory } from '@/components/wallet/transaction-history';
import { NetworkSelector } from '@/components/wallet/network-selector';
import { TradeFinanceModal } from '@/components/trade-finance/trade-finance-modal';
import TradeFinancePage from '@/pages/trade-finance';
import { EscrowDashboard } from '@/components/escrow/escrow-dashboard';
import { TransactionChecker } from '@/components/wallet/transaction-checker';
import DocumentManager from '@/components/document-management/document-manager';
import ProfileSettings from '@/components/profile/profile-settings';
import { useWallet } from '@/hooks/use-wallet';
import { Settings, Lock, Download, Upload, FileText, User, TrendingUp, Shield, Copy, Eye, EyeOff, Gift, Landmark, Store, Wallet as WalletIcon, Menu, HelpCircle, Bell } from 'lucide-react';
import logoPath from "@/assets/logo.png";
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
  const { isUnlocked, lockWallet, settings, exportPrivateKey, exportMnemonic, walletExists, isLoading, wallet } = useWallet();
  const [selectedNetworkId, setSelectedNetworkId] = useState(settings.selectedNetworkId);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'privateKey' | 'mnemonic'>('privateKey');
  const [exportedData, setExportedData] = useState('');
  const [showExportData, setShowExportData] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  // Redirect if wallet doesn't exist or after loading is complete and still not unlocked
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img 
            src={logoPath} 
            alt="BlockFinaX Logo" 
            className="w-24 h-16 object-contain mx-auto mb-4"
          />
          <div className="text-lg font-semibold mb-2">Loading BlockFinaX...</div>
        </div>
      </div>
    );
  }

  if (!walletExists() || !isUnlocked) {
    return null; // Will redirect
  }

  const handleExportPrivateKey = () => {
    try {
      const privateKey = exportPrivateKey();
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

  const handleExportMnemonic = () => {
    try {
      const mnemonic = exportMnemonic();
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

  const handleLockWallet = () => {
    lockWallet();
    setLocation('/unlock-wallet');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img 
                src={logoPath} 
                alt="BlockFinaX Logo" 
                className="w-7 h-7 object-contain shrink-0"
              />
              <span className="text-base font-semibold tracking-tight">BlockFinaX</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 hidden sm:inline">
                TESTNET
              </span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/trade-finance')}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-trade-finance-nav"
                >
                  Trade Finance
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/treasury')}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-financier-nav"
                >
                  Financier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/marketplace')}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="button-marketplace-nav"
                >
                  Marketplace
                </Button>
              </div>
              
              {/* Mobile nav icons */}
              <div className="flex lg:hidden items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/treasury')}
                  className="h-8 w-8"
                  data-testid="button-financier-icon"
                  title="Financier Console"
                >
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/marketplace')}
                  className="h-8 w-8"
                  data-testid="button-marketplace-icon"
                  title="Marketplace"
                >
                  <Store className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              
              <NetworkSelector
                selectedNetworkId={selectedNetworkId}
                onNetworkChange={setSelectedNetworkId}
                className="h-8 text-xs px-2"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {wallet?.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : 'Not connected'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setLocation('/rewards')}>
                    <Gift className="h-4 w-4 mr-2" />
                    Rewards & Referrals
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setLocation('/notifications')} disabled>
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">Soon</Badge>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Shield className="h-4 w-4 mr-2" />
                      Security
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={handleExportMnemonic}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Seed Phrase
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPrivateKey}>
                        <Upload className="h-4 w-4 mr-2" />
                        Export Private Key
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuItem disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">Soon</Badge>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => window.open('https://blockfinax.com/help', '_blank')} disabled>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help & Support
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLockWallet} className="text-destructive">
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsContent value="overview" className="space-y-4">
            <EnhancedWalletOverview 
              selectedNetworkId={selectedNetworkId}
              onTabChange={setActiveTab}
            />
            <TransactionHistory networkId={selectedNetworkId} />
          </TabsContent>


          <TabsContent value="defi" className="">
            <TradeFinancePage />
          </TabsContent>

          <TabsContent value="documents" className="">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="profile" className="">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </main>

      {/* Export Modal */}
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
            {/* Security Warning */}
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

            {/* Export Data */}
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

      {/* Bottom Navigation - Binance Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'overview' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <WalletIcon className="h-5 w-5" />
              <span className="text-[10px] font-medium">Wallet</span>
            </button>
            <button
              onClick={() => setLocation('/hedge')}
              className="flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Shield className="h-5 w-5" />
              <span className="text-[10px] font-medium">Hedge</span>
            </button>
            <button
              onClick={() => setActiveTab('defi')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'defi' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-[10px] font-medium">Trade</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === 'documents' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium">Docs</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
