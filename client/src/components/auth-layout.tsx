import React from 'react';
import { Blocks, Sparkles, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ui/theme-provider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next: Record<string, typeof theme> = { light: 'dark', dark: 'system', system: 'light' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      onClick={() => setTheme(next[theme])}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 border border-border transition-all"
      aria-label="Toggle theme"
    >
      <Icon className="w-3.5 h-3.5 text-foreground/70" />
    </button>
  );
}

export function AuthLayout({
  children,
  topRightAccessory
}: {
  children: React.ReactNode;
  topRightAccessory?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left Hero Panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between p-8 bg-primary relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
          {/* Floating grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
            <Blocks className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">BlockFinaX</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/90 text-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            Powered by Account Abstraction
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white leading-[1.1]">
            The future of<br />
            <span>trade finance</span>
          </h1>
          <p className="text-white/80 text-base max-w-sm leading-relaxed">
            Secure, transparent, and gasless transactions — backed by blockchain and account abstraction technology.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Gasless Txns', 'Smart Account', 'EOA Custody', 'Multi-chain'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/15 backdrop-blur"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 p-4 bg-white/5 backdrop-blur border border-white/10 rounded-2xl">
          <p className="text-white/60 text-sm italic">
            "BlockFinaX gives us the confidence to transact across borders with zero gas fees."
          </p>
          <p className="text-white/40 text-xs mt-2">— Trade Finance Director, Global Corp</p>
        </div>
      </div>

      {/* ── Right Auth Panel ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-3 shrink-0">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Blocks className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-base text-foreground tracking-tight">BlockFinaX</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {topRightAccessory}
          </div>
        </div>

        {/* Dynamic content (scrollable area for forms) */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
