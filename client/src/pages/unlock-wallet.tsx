import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Eye, EyeOff,
  ShieldCheck,
  Blocks,
  Fingerprint,
  Trash2,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';


function truncate(addr: string, chars = 6): string {
  return addr ? `${addr.slice(0, chars + 2)}...${addr.slice(-4)}` : '';
}

export default function UnlockWallet() {
  const [, setLocation] = useLocation();
  const { unlockWallet, deleteWallet, isLoading, address, smartAccountAddress, isSmartAccountEnabled, walletName } = useWallet();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAnimatingIn] = useState(true);

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setError('');
    try {
      await unlockWallet(password);
      setLocation('/wallet');
    } catch (err: any) {
      setError(err.message || 'Invalid password. Please try again.');
    }
  };

  const handleDelete = () => {
    deleteWallet();
    setLocation('/create-wallet');
  };

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 py-8">
        <div
          className={[
            'w-full max-w-sm',
            isAnimatingIn ? 'animate-in fade-in slide-in-from-bottom-4 duration-500' : '',
          ].join(' ')}
        >
        {/* Solid card no gradient behind it */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xl space-y-5">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Blocks className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-foreground tracking-tight">BlockFinaX</span>
            </div>
            {/* AA badge */}
            {isSmartAccountEnabled && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider">
                <Wifi className="w-2.5 h-2.5" />
                Smart Account
              </span>
            )}
          </div>

          {/* Icon + title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Fingerprint className="w-7 h-7 text-primary" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-2xl border border-primary/20 animate-ping opacity-30" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Unlock Wallet</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Enter your password to access</p>
            </div>
          </div>

          {/* Wallet info */}
          {address && (
            <div className="bg-muted/40 rounded-xl p-3 space-y-2 border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Wallet</span>
                <span className="text-xs font-semibold text-foreground">{walletName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">EOA</span>
                <span className="font-mono text-[10px] text-foreground">{truncate(address)}</span>
              </div>
              {smartAccountAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Smart Account</span>
                  <span className="font-mono text-[10px] text-primary">{truncate(smartAccountAddress)}</span>
                </div>
              )}
            </div>
          )}

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="pl-10 pr-10 h-10 bg-muted/50 border-border/60 focus:border-primary/60 text-sm transition-all"
                autoFocus
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-[10px] text-destructive flex items-center gap-1.5 pl-1">
                <WifiOff className="w-3 h-3" /> {error}
              </p>
            )}
          </div>

          {/* Unlock button */}
          <Button
            onClick={handleUnlock}
            disabled={isLoading || !password.trim()}
            className="w-full h-10 font-semibold text-sm rounded-xl"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Unlocking...</>
            ) : (
              <><ChevronRight className="w-4 h-4 mr-1" />Unlock Wallet</>
            )}
          </Button>

          {/* Links */}
          <div className="text-center space-y-2 pt-1">
            <p className="text-[10px] text-muted-foreground">
              Don't have a wallet?{' '}
              <Link href="/create-wallet">
                <span className="text-primary hover:underline cursor-pointer font-medium">Create new</span>
              </Link>
              {' or '}
              <Link href="/import-wallet">
                <span className="text-primary hover:underline cursor-pointer font-medium">import</span>
              </Link>
            </p>

            {/* Delete wallet */}
            <div className="border-t border-border/50 pt-3">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Wallet
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-center text-muted-foreground">
                    This will permanently remove your wallet.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-8 text-xs">
                      Cancel
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="flex-1 h-8 text-xs">
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
