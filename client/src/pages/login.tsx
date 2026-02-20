import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, ChevronRight, ShieldCheck, WifiOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';

export default function Login() {
  const [, setLocation] = useLocation();
  const { unlockWallet, isLoading } = useWallet();


  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setError('');
    try {
      await unlockWallet(password);
      setLocation('/wallet');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AuthLayout
      topRightAccessory={
        <Link href="/create-wallet">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Create account
          </span>
        </Link>
      }
    >
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 py-8">
        <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Welcome Back</h1>
            <p className="text-xs text-muted-foreground">Sign in to your BlockFinaX account</p>
          </div>

          <div className="space-y-4">
            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                <Link href="/import-wallet">
                  <span className="text-[10px] text-primary hover:underline cursor-pointer">Forgot password? / Recovery</span>
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="pl-10 h-10 bg-muted/50 border-border/60 focus:border-primary/60 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="text-[10px] text-destructive flex items-center gap-1.5 pt-1">
                  <WifiOff className="w-3 h-3" /> {error}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleLogin}
              disabled={isLoading || !password.trim()}
              className="w-full h-11 font-semibold text-sm rounded-xl mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing In...</>
              ) : (
                <><ChevronRight className="w-4 h-4 mr-1" />Sign In</>
              )}
            </Button>
          </div>

          {/* Secure note */}
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            End-to-end encrypted • Smart Account abstraction
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
