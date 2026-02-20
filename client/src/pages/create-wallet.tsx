import { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Eye, EyeOff,
  Zap,
  Download,
  Mail,
  ShieldCheck,
  ChevronRight,
  X,
  Key,
  FileText,
  Lock,
  UserCheck,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';

// ─── Types ────────────────────────────────────────────────────────────────

type Modal = 'none' | 'import' | 'password';
type ImportMethod = 'private-key' | 'seed-phrase';

// ─── Main Component ───────────────────────────────────────────────────────

export default function CreateWallet() {
  const [, setLocation] = useLocation();
  const { createWallet, importWallet, isLoading, hasWallet } = useWallet();
  const { toast } = useToast();

  // ── UI state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [modal, setModal] = useState<Modal>('none');
  const [importMethod, setImportMethod] = useState<ImportMethod>('private-key');
  const [importInput, setImportInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showImportSecret, setShowImportSecret] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'import' | 'email'>('create');
  const [loadingMsg, setLoadingMsg] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);

  // ── Helpers ───────────────────────────────────────────────────────────

  const openPasswordModal = (action: typeof pendingAction) => {
    setPendingAction(action);
    setPassword('');
    setConfirmPassword('');
    setModal('password');
  };

  const validatePassword = (): string | null => {
    if (!password.trim()) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return "Passwords don't match";
    return null;
  };

  // ── Email sign-in ─────────────────────────────────────────────────────

  const handleEmailContinue = () => {
    if (!email.trim()) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address.' });
      emailRef.current?.focus();
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ variant: 'destructive', title: 'Invalid Email', description: 'Please enter a valid email address.' });
      return;
    }
    // In production: call socialAuthService.signInWithEmail(email)
    // For now: simulate and open password modal
    openPasswordModal('email');
  };

  // ── Quick Create ──────────────────────────────────────────────────────

  const handleQuickCreate = () => {
    openPasswordModal('create');
  };

  // ── Import wallet ─────────────────────────────────────────────────────

  const handleImportOpen = () => {
    setImportInput('');
    setImportMethod('private-key');
    setModal('import');
  };

  const handleImportNext = () => {
    if (!importInput.trim()) {
      toast({ variant: 'destructive', title: 'Input Required', description: 'Please enter your private key or seed phrase.' });
      return;
    }
    setModal('none');
    openPasswordModal('import');
  };

  // ── Password submit ───────────────────────────────────────────────────

  const handlePasswordSubmit = async () => {
    const err = validatePassword();
    if (err) {
      toast({ variant: 'destructive', title: 'Password Error', description: err });
      return;
    }

    try {
      if (pendingAction === 'create' || pendingAction === 'email') {
        setLoadingMsg('Generating your wallet...');
        await createWallet(password, 'My Wallet');
        setLoadingMsg('Setting up Smart Account...');
      } else if (pendingAction === 'import') {
        setLoadingMsg('Validating wallet...');
        const type = importMethod === 'private-key' ? 'private_key' : 'mnemonic';
        await importWallet(password, importInput, type, 'Imported Wallet');
        setLoadingMsg('Setting up Smart Account...');
      }
      setModal('none');
      setTimeout(() => setLocation('/wallet'), 400);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Something went wrong.' });
    } finally {
      setLoadingMsg('');
    }
  };

  // ── Social (coming soon) ──────────────────────────────────────────────

  const showComingSoon = () => {
    toast({ title: '🚀 Coming Soon', description: 'Social sign-in will be available soon.' });
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <AuthLayout
      topRightAccessory={
        <Link href="/import-wallet">
          <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            Have a wallet?
          </span>
        </Link>
      }
    >
      {/* Auth card */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 py-8">
          <div className="w-full max-w-sm space-y-4">
          {hasWallet ? (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Account Exists</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  A non-custodial wallet is already secured on this device. Overwriting it could lead to permanent loss of access.
                </p>
              </div>
              <Button
                onClick={() => setLocation('/login')}
                className="w-full h-11 font-semibold text-sm rounded-xl"
              >
                Login to Existing Account
              </Button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Welcome to BlockFinaX</h2>
                <p className="text-muted-foreground text-xs">Secure access to the digital world of transparent trade finance.</p>
              </div>

            {/* ── Email section ─────────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sign in with Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={emailRef}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-muted/50 border-border/60 focus:border-primary/60 transition-all"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleEmailContinue}
                disabled={isLoading || !email.trim()}
                className="w-full h-10 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
              >
                {isLoading && pendingAction === 'email' ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />{loadingMsg || 'Signing in...'}</>
                ) : (
                  <><ChevronRight className="w-4 h-4 mr-1" />Continue with Email</>
                )}
              </Button>
            </div>

            {/* ── Quick Action buttons ──────────────────────────── */}
            <div className="space-y-2">
              <button
                onClick={handleQuickCreate}
                disabled={isLoading}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border-2 border-primary/40 hover:border-primary/80 hover:bg-primary/5 text-foreground font-semibold text-xs transition-all group"
              >
                {isLoading && pendingAction === 'create' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{loadingMsg || 'Creating...'}</>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    Create Wallet Instantly
                  </>
                )}
              </button>

              <button
                onClick={handleImportOpen}
                disabled={isLoading}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-primary/8 hover:bg-primary/15 border border-primary/20 text-foreground font-semibold text-xs transition-all group"
              >
                <Download className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                Import Existing Wallet
              </button>
            </div>

            {/* ── Divider ───────────────────────────────────────── */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── Social sign-in ────────────────────────────────── */}
            <div className="space-y-2">
              <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sign in with Social
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Google */}
                <button
                  onClick={showComingSoon}
                  className="h-9 flex items-center justify-center gap-2 rounded-lg border border-border/70 hover:bg-muted/60 text-xs font-medium text-foreground transition-all group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
                {/* Apple */}
                <button
                  onClick={showComingSoon}
                  className="h-9 flex items-center justify-center gap-2 rounded-lg border border-border/70 hover:bg-muted/60 text-xs font-medium text-foreground transition-all group"
                >
                  <svg className="w-4 h-4 fill-foreground" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </div>

            {/* ── AA badge ──────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              No sign-up required — Secured by Account Abstraction
            </div>
            </>
          )}
        </div>
      </div>
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* IMPORT WALLET MODAL                                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {modal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setModal('none')} />
          <div className="relative w-full sm:max-w-lg bg-card border border-border rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 sm:fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground">Import Wallet</h3>
                <p className="text-xs text-muted-foreground">Use your private key or seed phrase</p>
              </div>
              <button
                onClick={() => setModal('none')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Method selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
              {([
                { id: 'private-key', label: 'Private Key', Icon: Key },
                { id: 'seed-phrase', label: 'Seed Phrase', Icon: FileText },
              ] as const).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setImportMethod(id); setImportInput(''); }}
                  className={[
                    'flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all',
                    importMethod === id
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Input */}
            {importMethod === 'private-key' ? (
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Enter your private key (0x...)"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  className={[
                    'w-full resize-none rounded-xl border border-border/60 bg-muted/40 px-4 py-3 font-mono text-sm text-foreground',
                    'placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all',
                    showImportSecret ? '' : '[text-security:disc]',
                  ].join(' ')}
                  style={!showImportSecret ? { WebkitTextSecurity: 'disc' } as any : {}}
                />
                <button
                  type="button"
                  onClick={() => setShowImportSecret(!showImportSecret)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showImportSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <textarea
                rows={4}
                placeholder="Enter your 12 or 24-word seed phrase separated by spaces"
                value={importInput}
                onChange={(e) => setImportInput(e.target.value)}
                className="w-full resize-none rounded-xl border border-border/60 bg-muted/40 px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            )}

            {/* Security notice */}
            <div className="flex gap-2.5 p-3.5 bg-primary/5 border border-primary/15 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your wallet will be encrypted locally. You'll get a <strong className="text-foreground">Smart Account</strong> for gasless transactions while keeping full access to your original wallet.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setModal('none')} className="flex-1 h-11">
                Cancel
              </Button>
              <Button onClick={handleImportNext} disabled={!importInput.trim()} className="flex-1 h-11 font-semibold">
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PASSWORD CREATION MODAL                                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {modal === 'password' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 sm:fade-in duration-200">
            {/* Header */}
            <div className="space-y-1 text-center">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-bold text-foreground">Secure Your Account</h3>
              <p className="text-xs text-muted-foreground">
                Create a password to protect your wallet on this device.
              </p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Create Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 bg-muted/50 border-border/60 focus:border-primary/60"
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={[
                        'h-1 flex-1 rounded-full transition-all',
                        password.length >= i * 3
                          ? password.length < 8 ? 'bg-destructive' : password.length < 12 ? 'bg-yellow-500' : 'bg-emerald-500'
                          : 'bg-muted',
                      ].join(' ')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 h-11 bg-muted/50 border-border/60 focus:border-primary/60"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hint */}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              Your password is stored securely on this device only. We never see it.
            </p>

            {/* Actions */}
            <Button
              onClick={handlePasswordSubmit}
              disabled={isLoading || !password.trim() || !confirmPassword.trim()}
              className="w-full h-12 font-semibold text-base"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{loadingMsg || 'Securing...'}</>
              ) : (
                'Secure Account'
              )}
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
