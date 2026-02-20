import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/hooks/use-wallet';
import { useTheme } from '@/components/ui/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Eye, EyeOff,
  ShieldCheck,
  Key,
  FileText,
  ChevronLeft,
  Lock,
  UserCheck,
} from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';


type Step = 'import' | 'password';
type ImportMethod = 'private_key' | 'mnemonic';

export default function ImportWallet() {
  const [, setLocation] = useLocation();
  const { importWallet, isLoading, hasWallet } = useWallet();

  const [step, setStep] = useState<Step>('import');
  const [importMethod, setImportMethod] = useState<ImportMethod>('private_key');
  const [importInput, setImportInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');

  const handleImportNext = () => {
    if (!importInput.trim()) {
      setError('Please enter your ' + (importMethod === 'private_key' ? 'private key' : 'seed phrase'));
      return;
    }
    setError('');
    setStep('password');
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) { setError('Password is required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError("Passwords don't match"); return; }
    setError('');

    try {
      setLoadingMsg('Validating wallet...');
      await importWallet(password, importInput, importMethod, 'Imported Wallet');
      setLoadingMsg('Setting up Smart Account...');
      setTimeout(() => setLocation('/wallet'), 400);
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet');
      setLoadingMsg('');
    }
  };

  return (
    <AuthLayout>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 py-8">
        <div className="w-full max-w-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
          {/* Back Action */}
          <Link href="/create-wallet">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-2 font-medium">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back
            </button>
          </Link>

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
              {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(['import', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    step === s
                      ? 'bg-primary text-primary-foreground'
                      : i < (['import', 'password'] as Step[]).indexOf(step)
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-muted text-muted-foreground',
                  ].join(' ')}
                >
                  {i + 1}
                </div>
                {i < 1 && <div className={`h-px flex-1 w-8 transition-all ${step === 'password' ? 'bg-primary/40' : 'bg-border'}`} />}
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {step === 'import' ? 'Import method' : 'Secure wallet'}
            </span>
          </div>

          {/* ── Step 1: Import ───────────────────────────────── */}
          {step === 'import' && (
            <>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-foreground">Import Wallet</h1>
                <p className="text-xs text-muted-foreground">
                  Use your existing private key or seed phrase to restore your wallet.
                </p>
              </div>

              {/* Method tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl">
                {([
                  { id: 'private_key' as ImportMethod, label: 'Private Key', Icon: Key },
                  { id: 'mnemonic' as ImportMethod, label: 'Seed Phrase', Icon: FileText },
                ]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setImportMethod(id); setImportInput(''); setError(''); setShowSecret(false); }}
                    className={[
                      'flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all',
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
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {importMethod === 'private_key' ? 'Private Key' : 'Seed Phrase'}
                </Label>
                {importMethod === 'private_key' ? (
                  <div className="relative">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      placeholder="0x... (64 hex chars)"
                      value={importInput}
                      onChange={(e) => { setImportInput(e.target.value); setError(''); }}
                      className="pr-10 h-10 bg-muted/50 border-border/60 focus:border-primary/60 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    placeholder="word1 word2 word3 ... (12 or 24 words)"
                    value={importInput}
                    onChange={(e) => { setImportInput(e.target.value); setError(''); }}
                    className="w-full resize-none rounded-xl border border-border/60 bg-muted/50 px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
                  />
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              {/* Security notice */}
              <div className="flex gap-2.5 p-3 bg-primary/5 border border-primary/15 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">Security Notice</p>
                  <p>Your wallet will be encrypted locally. You'll get a <strong className="text-primary">Smart Account</strong> for gasless txns while keeping full custody.</p>
                </div>
              </div>

              <Button onClick={handleImportNext} className="w-full h-10 font-semibold text-sm">
                Continue →
              </Button>
            </>
          )}

          {/* ── Step 2: Password ─────────────────────────────── */}
          {step === 'password' && (
            <>
              <div className="space-y-0.5">
                <h1 className="text-xl font-bold text-foreground">Secure Your Wallet</h1>
                <p className="text-xs text-muted-foreground">
                  Create a password to encrypt your imported wallet on this device.
                </p>
              </div>

              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Password fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="pr-10 h-10 bg-muted/50 border-border/60 focus:border-primary/60 text-sm"
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
                  {/* Strength indicator */}
                  {password.length > 0 && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={['h-1 flex-1 rounded-full transition-all',
                          password.length >= i * 3
                            ? password.length < 8 ? 'bg-destructive' : password.length < 12 ? 'bg-yellow-500' : 'bg-emerald-500'
                            : 'bg-muted'].join(' ')} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="pr-10 h-10 bg-muted/50 border-border/60 focus:border-primary/60 text-sm"
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

                {error && <p className="text-sm text-destructive">{error}</p>}

                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  Password is stored only on this device — we never see it.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('import')} className="h-10 px-4 text-sm" disabled={isLoading}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                  className="flex-1 h-10 font-semibold text-sm"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />{loadingMsg || 'Importing...'}</>
                  ) : (
                    'Import Wallet'
                  )}
                </Button>
              </div>
            </>
          )}
          </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
