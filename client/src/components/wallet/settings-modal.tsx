import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  X, 
  Search, 
  Settings, 
  SlidersHorizontal, 
  HardDrive, 
  Users, 
  ShieldCheck, 
  Bell, 
  Lock,
  ChevronRight,
  ChevronLeft,
  Copy,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  children: React.ReactNode;
}

type SettingsView = 'main' | 'security' | 'reveal_password' | 'reveal_keys' | 'advanced' | 'clear_data';

export function SettingsModal({ children }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SettingsView>('main');
  
  // Security + Reveal State
  const [password, setPassword] = useState('');
  const [revealedPrivateKey, setRevealedPrivateKey] = useState<string | null>(null);
  const [revealedMnemonic, setRevealedMnemonic] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const { exportPrivateKey, exportMnemonic, deleteWallet, lockWallet } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setTimeout(() => {
        setView('main');
        setPassword('');
        setRevealedPrivateKey(null);
        setRevealedMnemonic(null);
        setShowPrivateKey(false);
        setShowMnemonic(false);
      }, 300);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard. Keep it perfectly safe.`,
    });
  };

  const handleRevealSubmit = async () => {
    if (!password) {
      toast({ title: "Error", description: "Password required to decrypt wallet.", variant: "destructive" });
      return;
    }
    
    setIsRevealing(true);
    try {
      const pk = await exportPrivateKey(password);
      const mnemonic = await exportMnemonic(password);
      
      setRevealedPrivateKey(pk);
      if (mnemonic) setRevealedMnemonic(mnemonic);
      
      setView('reveal_keys');
    } catch (err: any) {
      toast({
        title: "Decryption Failed",
        description: err.message || "Invalid password.",
        variant: "destructive"
      });
    } finally {
      setIsRevealing(false);
    }
  };

  const handleClearDataSubmit = async () => {
    if (!password) {
      toast({ title: "Error", description: "Password required to authorize deletion.", variant: "destructive" });
      return;
    }

    try {
      // We verify password implicitly by trying to export the private key.
      await exportPrivateKey(password);
      
      deleteWallet(); // Clears localStorage
      lockWallet();   // Clears in-memory zustand/context state
      setOpen(false);
      setLocation('/login');
    } catch (err: any) {
      toast({
        title: "Authorization Failed",
        description: err.message || "Invalid password.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md bg-card/95 border-border/50 gap-0 p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[650px] max-h-screen">
        <DialogHeader className="p-4 border-b border-border/50 relative shrink-0">
          <div className="flex items-center justify-center">
            {view !== 'main' && (
              <button 
                onClick={() => {
                  if (view === 'reveal_password' || view === 'reveal_keys') setView('security');
                  else if (view === 'clear_data') setView('advanced');
                  else setView('main');
                  
                  // Reset sensitive states when navigating back
                  setPassword('');
                  setRevealedPrivateKey(null);
                  setRevealedMnemonic(null);
                  setShowPrivateKey(false);
                  setShowMnemonic(false);
                }}
                className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-lg font-bold">
              {view === 'main' && 'Settings'}
              {view === 'security' && 'Security & Privacy'}
              {view === 'reveal_password' && 'Enter Password'}
              {view === 'reveal_keys' && 'Secret Credentials'}
              {view === 'advanced' && 'Advanced'}
              {view === 'clear_data' && 'Clear Wallet Data'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {view === 'main' && (
            <div className="p-2 space-y-1">
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search settings..." 
                    className="w-full bg-background/50 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              {[
                { id: 'general', icon: Settings, label: 'General' },
                { id: 'advanced', icon: SlidersHorizontal, label: 'Advanced', action: () => setView('advanced') },
                { id: 'backup', icon: HardDrive, label: 'Backup and sync' },
                { id: 'contacts', icon: Users, label: 'Contacts' },
                { id: 'shield', icon: ShieldCheck, label: 'Transaction Shield' },
                { id: 'notifications', icon: Bell, label: 'Notifications' },
                { id: 'security', icon: Lock, label: 'Security & privacy', action: () => setView('security') },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {view === 'security' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-red-500 mb-2">Danger Zone</h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">Reveal Secret Recovery Phrase</p>
                      <p className="text-xs text-muted-foreground">
                        If you lose this phrase, you will lose access to your wallet forever. Never share this with anyone.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2"
                    onClick={() => setView('reveal_password')}
                  >
                    Reveal Credentials
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <h3 className="font-bold">Privacy Settings</h3>
                <Label className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 cursor-pointer">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm">MetaMask Metrics</p>
                    <p className="text-xs text-muted-foreground">Participate in MetaMetrics</p>
                  </div>
                  <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                </Label>
              </div>
            </div>
          )}

          {view === 'reveal_password' && (
            <div className="p-6 space-y-6 flex flex-col h-full">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Enter Password</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
                    Enter your local wallet password to decrypt and reveal your private keys.
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
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/20"
                onClick={handleRevealSubmit}
                disabled={isRevealing || !password}
              >
                {isRevealing ? 'Decrypting...' : 'Next'}
              </Button>
            </div>
          )}

          {view === 'reveal_keys' && (
            <div className="p-6 space-y-6">
               <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                 <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-xs font-medium text-red-500 leading-relaxed">
                   Do not share these credentials with anyone! These keys provide full, unfettered access to all funds on this wallet across all blockchains.
                 </p>
               </div>

               {revealedMnemonic && (
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <Label className="font-semibold text-muted-foreground">Secret Recovery Phrase</Label>
                     <button onClick={() => setShowMnemonic(!showMnemonic)} className="text-muted-foreground hover:text-foreground">
                       {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                     </button>
                   </div>
                   
                   <div className="relative group">
                     <div className={cn("p-4 bg-background border border-border/50 rounded-xl font-mono text-sm leading-relaxed tracking-tight break-words", !showMnemonic && "blur-md select-none")}>
                        {revealedMnemonic}
                     </div>
                     {showMnemonic && (
                       <button 
                         onClick={() => handleCopy(revealedMnemonic, "Seed Phrase")}
                         className="absolute top-2 right-2 p-2 bg-muted/80 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground text-muted-foreground"
                       >
                         <Copy className="h-4 w-4" />
                       </button>
                     )}
                   </div>
                 </div>
               )}

               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <Label className="font-semibold text-muted-foreground">Private Key</Label>
                   <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="text-muted-foreground hover:text-foreground">
                     {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                 </div>
                 
                 <div className="relative group">
                   <div className={cn("p-4 bg-background border border-border/50 rounded-xl font-mono text-xs break-all", !showPrivateKey && "blur-md select-none")}>
                      {revealedPrivateKey}
                   </div>
                   {showPrivateKey && (
                     <button 
                       onClick={() => handleCopy(revealedPrivateKey!, "Private Key")}
                       className="absolute top-2 right-2 p-2 bg-muted/80 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground text-muted-foreground"
                     >
                       <Copy className="h-4 w-4" />
                     </button>
                   )}
                 </div>
               </div>
            </div>
          )}

          {view === 'advanced' && (
            <div className="p-4 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
                 <div className="flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                   <div className="space-y-1">
                     <p className="font-semibold text-sm text-foreground">Clear Wallet Data</p>
                     <p className="text-xs text-muted-foreground">
                       This will completely wipe all local storage contexts, pinned networks, and encrypted keys from this browser. This action is irreversible.
                     </p>
                   </div>
                 </div>
                 <Button 
                   variant="destructive" 
                   className="w-full mt-2"
                   onClick={() => setView('clear_data')}
                 >
                   Clear Activity & Wallet Data
                 </Button>
              </div>
            </div>
          )}

          {view === 'clear_data' && (
            <div className="p-6 space-y-6 flex flex-col h-full">
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-red-500">Are you absolutely sure?</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    If you haven't backed up your Secret Recovery Phrase or Private Key, <strong className="text-foreground">you will permanently lose access to your funds.</strong> We cannot recover your wallet under any circumstances once wiped.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Input 
                  type="password"
                  placeholder="Enter Password to Confirm" 
                  value={password} 
                  autoFocus
                  onChange={(e) => setPassword(e.target.value)} 
                  className="rounded-xl border-red-500/50 focus-visible:ring-red-500/50 bg-background/50 h-12 text-center text-lg"
                />
              </div>

              <div className="flex-1" />

              <div className="grid grid-cols-2 gap-3 mt-4">
                 <Button 
                   variant="outline" 
                   className="h-12 rounded-xl"
                   onClick={() => setView('advanced')}
                 >
                   Cancel
                 </Button>
                 <Button 
                   variant="destructive"
                   className="h-12 rounded-xl font-semibold shadow-lg shadow-red-500/20"
                   onClick={handleClearDataSubmit}
                   disabled={!password}
                 >
                   Clear Data
                 </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
