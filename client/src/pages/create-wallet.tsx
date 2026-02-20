import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useWallet } from '@/hooks/use-wallet';
import { Loader2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoPath from "@/assets/logo.png";

const DEMO_MNEMONIC = 'trade finance hedge escrow letter credit invoice settlement border payment margin vault';

const createWalletSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Wallet name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateWalletFormData = z.infer<typeof createWalletSchema>;

export default function CreateWallet() {
  const [, setLocation] = useLocation();
  const { createWallet, isLoading } = useWallet();
  const { toast } = useToast();

  const [step, setStep] = useState<'form' | 'mnemonic' | 'verify'>('form');
  const [mnemonicCopied, setMnemonicCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationInput, setVerificationInput] = useState(['', '', '']);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Demo: 3 fixed positions to verify (indices 0, 4, 8)
  const verificationPositions = [0, 4, 8];
  const mnemonicWords = DEMO_MNEMONIC.split(' ');

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<CreateWalletFormData>({
    resolver: zodResolver(createWalletSchema),
  });

  const onSubmit = (data: CreateWalletFormData) => {
    if (!acceptTerms) {
      toast({ variant: "destructive", title: "Terms Required", description: "You must accept the terms to continue" });
      return;
    }
    setStep('mnemonic');
  };

  const handleCopyMnemonic = async () => {
    await navigator.clipboard.writeText(DEMO_MNEMONIC).catch(() => {});
    setMnemonicCopied(true);
    toast({ title: "Seed Phrase Copied", description: "Store it safely — never share it." });
    setTimeout(() => setMnemonicCopied(false), 2000);
  };

  const verifyAndCreate = async () => {
    const isValid = verificationPositions.every((pos, i) =>
      mnemonicWords[pos] === verificationInput[i].toLowerCase().trim()
    );
    if (!isValid) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Words don't match your seed phrase." });
      return;
    }
    const formData = getValues();
    await createWallet(formData.password, formData.name);
    setLocation('/wallet');
  };

  if (step === 'mnemonic') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src={logoPath} alt="BlockFinaX" className="w-8 h-8" />
                <span>Backup Your Seed Phrase</span>
              </div>
            </CardTitle>
            <p className="text-muted-foreground">Write it down and store it safely. You'll need it to recover your wallet.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-destructive mb-1">Important Security Notice</p>
              <p>• Never share your seed phrase with anyone</p>
              <p>• Store it offline in a secure location</p>
              <p>• Anyone with this phrase can access your funds</p>
            </div>
            <div className="relative">
              <div className="grid grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
                {mnemonicWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                    <span className="font-mono">{word}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyMnemonic} className="absolute top-2 right-2">
                {mnemonicCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">Back</Button>
              <Button onClick={() => setStep('verify')} className="flex-1">I've Saved My Seed Phrase</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold">Verify Your Seed Phrase</CardTitle>
            <p className="text-muted-foreground">Enter the requested words to confirm you saved it.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {verificationPositions.map((pos, i) => (
                <div key={i} className="space-y-2">
                  <Label>Word #{pos + 1}</Label>
                  <Input
                    placeholder={`Enter word ${pos + 1}`}
                    value={verificationInput[i]}
                    onChange={e => {
                      const v = [...verificationInput];
                      v[i] = e.target.value;
                      setVerificationInput(v);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('mnemonic')} className="flex-1">Back</Button>
              <Button onClick={verifyAndCreate} disabled={verificationInput.some(w => !w.trim()) || isLoading} className="flex-1">
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : 'Create Wallet'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={logoPath} alt="BlockFinaX" className="w-8 h-8" />
              <span>Create New Wallet</span>
            </div>
          </CardTitle>
          <p className="text-muted-foreground">Create a BlockFinaX wallet to get started with trade finance</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wallet Name</Label>
              <Input id="name" placeholder="My Wallet" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter a strong password" {...register('password')} className={errors.password ? 'border-destructive' : ''} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm your password" {...register('confirmPassword')} className={errors.confirmPassword ? 'border-destructive' : ''} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="acceptTerms" checked={acceptTerms} onCheckedChange={c => setAcceptTerms(c === true)} />
              <Label htmlFor="acceptTerms" className="text-sm">I am responsible for saving my seed phrase and understand it cannot be recovered</Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : 'Create Wallet'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">Already have a wallet?{' '}
              <Link href="/import-wallet" className="text-primary hover:underline">Import existing wallet</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
