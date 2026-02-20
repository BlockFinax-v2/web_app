import { Link } from "wouter";
import {
  ArrowRight, Shield, Globe, Zap, FileText, Banknote,
  TrendingUp, CheckCircle2, Twitter, Linkedin, Github,
  Menu, X, Coins, Lock, BarChart3, Clock,
  Building2, Users, ArrowUpRight, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import logoPath from "@/assets/logo.png";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// ─── Scroll reveal helper ───────────────────────────────────────────
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.42, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Section entrance wrapper ────────────────────────────────────────────
// Wraps each section’s max-w container; the ENTIRE block slides-up + fades
// as the section scrolls into view — layered on top of per-element Reveal.
function SectionIn({
  children, className = "", id,
}: {
  children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ───────────────────────────────────────────────
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const inc = Math.ceil(end / 60);
    const t = setInterval(() => {
      cur = Math.min(cur + inc, end);
      setVal(cur);
      if (cur >= end) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Trade instrument ticker card ───────────────────────────────────
function InstrumentCard({ flag, code, name, change, positive }: {
  flag: string; code: string; name: string; change: string; positive: boolean;
}) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 rounded-lg bg-slate-100 dark:bg-[#141B2D] border border-border dark:border-white/5 min-w-[220px] cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1a2236] transition-colors">
      <span className="text-2xl">{flag}</span>
      <div>
        <p className="text-sm font-bold text-foreground">{code}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{name}</p>
      </div>
      <span className={`ml-auto text-xs font-medium ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{change}</span>
    </div>
  );
}

// ─── Hero Protocol Flow Background Animation ──────────────────────────
// Narrates the full BlockFinaX flow as an animated SVG diagram.
function ProtocolFlowAnimation() {
  // Six nodes, alternating vertically for a zig-zag flow
  const nodes = [
    { id: "importer",  x: 110, y: 340, label: "Importer",    sub: "Needs Capital",      color: "#2563eb" },
    { id: "platform",  x: 350, y: 140, label: "BlockFinaX",  sub: "Protocol Hub",       color: "#4f46e5" },
    { id: "financier", x: 590, y: 340, label: "Financier",   sub: "Capital Provider",   color: "#0891b2" },
    { id: "approval",  x: 830, y: 140, label: "Approved",    sub: "Smart Contract",     color: "#059669" },
    { id: "delivery",  x: 1060,y: 340, label: "Delivery",    sub: "On-Chain Verified",  color: "#d97706" },
    { id: "hedge",     x: 1270,y: 140, label: "FX Hedge",    sub: "P2P Protection",     color: "#7c3aed" },
  ];

  // Icon paths (Lucide-style, 24×24 viewBox) keyed by node id.
  // Rendered via `translate(nx, ny) scale(s) translate(-12,-12)` to center in the node circle.
  const nodeIconPaths: Record<string, React.ReactNode> = {
    // Person / User
    importer: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    // Layers / Platform stack
    platform: (
      <>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </>
    ),
    // Landmark columns / Bank
    financier: (
      <>
        <line x1="3" y1="22" x2="21" y2="22" />
        <line x1="6" y1="17" x2="6" y2="11" />
        <line x1="10" y1="17" x2="10" y2="11" />
        <line x1="14" y1="17" x2="14" y2="11" />
        <line x1="18" y1="17" x2="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
      </>
    ),
    // Check-circle / Approved
    approval: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    // Package box / Delivery
    delivery: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
    // TrendingUp / FX Hedge
    hedge: (
      <>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </>
    ),
  };


  // Bezier path between each adjacent pair
  const edges = nodes.slice(0, -1).map((a, i) => {
    const b = nodes[i + 1];
    // control point pulls the curve toward the midpoint vertically
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    return { id: `e${i}`, d: `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`, color: b.color };
  });

  // Edge labels describing what travels along each path
  const edgeLabels = [
    "Apply for funds",
    "Match financier",
    "Approve & fund",
    "Release escrow",
    "Hedge FX risk",
  ];

  return (
    <svg
      viewBox="-80 60 1560 360"
      className="w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        {/* Glow filter for nodes */}
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Path IDs for animateMotion */}
        {edges.map(e => <path key={e.id} id={e.id} d={e.d} fill="none" />)}
      </defs>

      {/* ── Background grid dots ── */}
      <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.04" />
      </pattern>
      <rect width="1400" height="480" fill="url(#grid)" />

      {/* ── Edge paths (dashed lines) ── */}
      {edges.map((e, i) => (
        <g key={e.id}>
          {/* Ghost path (always visible, dimmed) */}
          <path d={e.d} fill="none" stroke={e.color} strokeWidth="1.5" strokeDasharray="6 5" opacity="0.18" />
          {/* Animated highlight pulse along the path */}
          <path d={e.d} fill="none" stroke={e.color} strokeWidth="2" opacity="0.45"
            strokeDasharray="60 400"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="460" to="-60"
              dur={`${2.4 + i * 0.3}s`}
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
              calcMode="linear"
            />
          </path>

          {/* ── Traveling data-packet dot ── */}
          <circle r="5" fill={e.color} filter="url(#glow)" opacity="0.95">
            <animateMotion
              dur={`${2.8 + i * 0.3}s`}
              begin={`${i * 0.5}s`}
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath href={`#${e.id}`} />
            </animateMotion>
          </circle>
          {/* Second dot, staggered */}
          <circle r="3.5" fill="#ffffff" opacity="0.7">
            <animateMotion
              dur={`${2.8 + i * 0.3}s`}
              begin={`${i * 0.5 + 1.4}s`}
              repeatCount="indefinite"
              calcMode="linear"
            >
              <mpath href={`#${e.id}`} />
            </animateMotion>
          </circle>

          {/* Edge label at midpoint */}
          {(() => {
            const a = nodes[i]; const b = nodes[i + 1];
            const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
            return (
              <text x={mx} y={my - 12} textAnchor="middle" fill={e.color}
                fontSize="10" fontFamily="-apple-system, sans-serif" fontWeight="500"
                opacity="0.55">
                {edgeLabels[i]}
              </text>
            );
          })()}
        </g>
      ))}

      {/* ── Nodes ── */}
      {nodes.map((n) => (
        <g key={n.id}>
          {/* Outer pulsing ring */}
          <circle cx={n.x} cy={n.y} r="28" fill="none" stroke={n.color} strokeWidth="1" opacity="0">
            <animate attributeName="r" values="26;40;26" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          {/* Inner ring */}
          <circle cx={n.x} cy={n.y} r="22" fill="none" stroke={n.color} strokeWidth="1.2" opacity="0.3" />
          {/* Node fill circle */}
          <circle cx={n.x} cy={n.y} r="18" fill="hsl(var(--background))" stroke={n.color} strokeWidth="1.8" opacity="0.9" filter="url(#glow)" />
          {/* Icon centered in node circle — scale(0.46) maps 24×24 → ~11×11 */}
          <g
            transform={`translate(${n.x}, ${n.y}) scale(0.46) translate(-12, -12)`}
            fill="none"
            stroke={n.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {nodeIconPaths[n.id]}
          </g>
          {/* Node title */}
          <text x={n.x} y={n.y + 42} textAnchor="middle" fill="hsl(var(--foreground))"
            fontSize="10.5" fontFamily="-apple-system, sans-serif" fontWeight="600" opacity="0.9">
            {n.label}
          </text>
          {/* Node subtitle */}
          <text x={n.x} y={n.y + 55} textAnchor="middle" fill="hsl(var(--muted-foreground))"
            fontSize="9" fontFamily="-apple-system, sans-serif" opacity="0.75">
            {n.sub}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Website() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ── Cursor parallax for hero ──────────────────────────────────────────
  // Tracks normalized cursor position (-0.5 → +0.5) relative to section center.
  const heroMouseX = useMotionValue(0);
  const heroMouseY = useMotionValue(0);
  // Glow follows cursor at raw pixel coords — faster spring for immediacy.
  const glowX = useMotionValue(-600);
  const glowY = useMotionValue(-600);

  const springCfg = { stiffness: 60, damping: 20 };
  const smoothX = useSpring(heroMouseX, springCfg);
  const smoothY = useSpring(heroMouseY, springCfg);
  const fastGlowX = useSpring(glowX, { stiffness: 180, damping: 30 });
  const fastGlowY = useSpring(glowY, { stiffness: 180, damping: 30 });

  // Layer 1 (headline) — strongest movement, feels closest.
  const h1X = useTransform(smoothX, v => v * -18);
  const h1Y = useTransform(smoothY, v => v * -12);
  // Layer 2 (subtitle) — medium, feels mid-distance.
  const subX = useTransform(smoothX, v => v * -10);
  const subY = useTransform(smoothY, v => v * -7);
  // Layer 3 (CTAs) — least, feels furthest away.
  const ctaX = useTransform(smoothX, v => v * -5);
  const ctaY = useTransform(smoothY, v => v * -4);

  // Glow div translation
  const glowTransX = useTransform(fastGlowX, v => v - 280);
  const glowTransY = useTransform(fastGlowY, v => v - 280);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    heroMouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    heroMouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
  };
  const handleHeroMouseLeave = () => {
    heroMouseX.set(0);
    heroMouseY.set(0);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ════════════════════════════════════
          NAV
      ════════════════════════════════════ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${scrolled ? "bg-background border-b border-border shadow-sm" : "bg-background"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <img src={logoPath} alt="BlockFinaX" className="h-7 w-7" />
                <span className="font-bold text-base tracking-tight">BlockFinaX</span>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1 flex-1">
              {[
                ["Markets", "markets"],
                ["Trade Finance", "features"],
                ["How It Works", "how-it-works"],
                ["Company", "company"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm font-medium">Login</Button>
              </Link>
              <Link href="/create-wallet">
                <Button size="sm" className="text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-5">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden ml-auto flex items-center gap-2">
              <ThemeToggle />
              <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
            {["Trade Finance", "How It Works", "Markets", "Company"].map(l => (
              <button key={l} onClick={() => scrollTo(l.toLowerCase().replace(/ /g, "-"))} className="block w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md">
                {l}
              </button>
            ))}
            <div className="flex gap-2 pt-3">
              <Link href="/login"><Button variant="outline" size="sm" className="flex-1">Login</Button></Link>
              <Link href="/create-wallet"><Button size="sm" className="flex-1 bg-primary text-primary-foreground">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════
          HERO — dark section
      ════════════════════════════════════ */}
      <section
        className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:bg-[#0D1321] dark:[background-image:none] pt-28 pb-20 relative overflow-hidden"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* ── Cursor spotlight glow ── */}
        {/* Cursor spotlight — plain semi-transparent circle, no gradient */}
        <motion.div
          className="absolute pointer-events-none z-[1] w-[480px] h-[480px] rounded-full bg-blue-600/[0.06]"
          style={{ x: glowTransX, y: glowTransY }}
        />
        {/* ── Protocol flow background animation ── */}
        {/* Covers the bottom 65% of the hero so the diagram sits behind the content naturally */}
        <div className="absolute top-0 left-0 right-0 z-0" style={{ height: "45%",  opacity: 0.28 }}>
          <div className="pt-[200px]">
            <ProtocolFlowAnimation />
          </div>
        </div>

        {/* ── Hero content — three independent parallax layers ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">

          {/* Badge — no parallax, stays perfectly centered */}
          <Reveal>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Trusted by over <strong className="text-slate-800 dark:text-white">1,200+ companies</strong> across 48 countries
            </p>
          </Reveal>

          {/* Headline — Layer 1: strongest movement */}
          <Reveal delay={0.05}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
              Pay. Finance. Hedge.
            </h1>
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-600 dark:text-slate-300 leading-tight tracking-tight mb-8">
              The Trade Finance Marketplace
            </h2>
          </Reveal>

          {/* Subtitle — Layer 2: medium movement */}
          <Reveal delay={0.1}>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
              Pay across borders, finance trade, and hedge against currency risk — all in one platform for emerging markets.
            </p>
          </Reveal>

          {/* CTAs — Layer 3: least movement, feels furthest */}
          <motion.div style={{ x: ctaX, y: ctaY }}>
            <Reveal delay={0.15}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/create-wallet">
                  <Button size="lg" className="px-8 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white border-0">
                    Open a Free Account
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={() => scrollTo("how-it-works")} className="px-8 h-12 text-base border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white">
                  Watch Demo
                </Button>
              </div>
            </Reveal>
          </motion.div>
        </div>

        {/* ── INFINITE MARQUEE TICKER ── */}
        <div id="markets" className="mt-16 border-t border-slate-200 dark:border-white/5 pt-10">
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mb-6 px-4">
            Easy Access to <strong className="text-slate-600 dark:text-slate-300">50+ Trade Finance Instruments</strong>
          </p>

          {/* Outer wrapper: clip overflow — no gradient mask, just hard clip */}
          <div className="relative overflow-hidden">
            <style>{`
              @keyframes ticker-scroll {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
            <div
              className="flex gap-3 w-max"
              style={{ animation: "ticker-scroll 32s linear infinite" }}
            >
              {/* First set */}
              {[
                { flag: "🌍", code: "LC / USDC", name: "Letter of Credit · Stablecoin", change: "+3 today", positive: true },
                { flag: "🏦", code: "INV / FIN", name: "Invoice Financing · Fixed Rate", change: "4.2% APR", positive: true },
                { flag: "📦", code: "ESCROW", name: "Smart Escrow · Auto-Release", change: "99.8% rate", positive: true },
                { flag: "💱", code: "FX / HEDGE", name: "FX Hedging · Forward Contracts", change: "-0.12%", positive: false },
                { flag: "🌐", code: "USDC / EUR", name: "Cross-Border Settlement", change: "0.9173", positive: true },
                { flag: "📊", code: "RISK / AI", name: "AI Compliance & Risk Scoring", change: "Live", positive: true },
                { flag: "🛳️", code: "TRADE / BL", name: "Bill of Lading Verification", change: "< 2s", positive: true },
                { flag: "📋", code: "DOC / CHECK", name: "Document Compliance Scan", change: "99.6%", positive: true },
              ].map((inst) => <InstrumentCard key={`a-${inst.code}`} {...inst} />)}

              {/* Duplicate set — makes the loop seamless */}
              {[
                { flag: "🌍", code: "LC / USDC", name: "Letter of Credit · Stablecoin", change: "+3 today", positive: true },
                { flag: "🏦", code: "INV / FIN", name: "Invoice Financing · Fixed Rate", change: "4.2% APR", positive: true },
                { flag: "📦", code: "ESCROW", name: "Smart Escrow · Auto-Release", change: "99.8% rate", positive: true },
                { flag: "💱", code: "FX / HEDGE", name: "FX Hedging · Forward Contracts", change: "-0.12%", positive: false },
                { flag: "🌐", code: "USDC / EUR", name: "Cross-Border Settlement", change: "0.9173", positive: true },
                { flag: "📊", code: "RISK / AI", name: "AI Compliance & Risk Scoring", change: "Live", positive: true },
                { flag: "🛳️", code: "TRADE / BL", name: "Bill of Lading Verification", change: "< 2s", positive: true },
                { flag: "📋", code: "DOC / CHECK", name: "Document Compliance Scan", change: "99.6%", positive: true },
              ].map((inst) => <InstrumentCard key={`b-${inst.code}`} {...inst} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════
          STATS — dark rounded section
      ════════════════════════════════════ */}
      {/* ════ STATS — dark card on white ════ */}
      <section className="bg-background pt-0 pb-6">
        <SectionIn className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-blue-50 dark:bg-[#0D1321] rounded-2xl px-10 py-14 border border-blue-100 dark:border-transparent">
            <Reveal>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-white">Our Results Are Proven in Numbers</h2>
                <p className="text-blue-700/70 dark:text-slate-400 mt-3">The numbers that define how BlockFinaX is reshaping global trade finance.</p>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { end: 500, suffix: "M+", prefix: "$", label: "Trade Volume Financed" },
                { end: 1200, suffix: "+", prefix: "", label: "Partner Companies" },
                { end: 48, suffix: "", prefix: "", label: "Countries Supported" },
                { end: 0, suffix: ".1%", prefix: "", label: "Protocol Fee" },
              ].map(({ end, suffix, prefix, label }) => (
                <Reveal key={label}>
                  <p className="text-4xl md:text-5xl font-bold text-blue-800 dark:text-white">
                    <Counter end={end} suffix={suffix} prefix={prefix} />
                  </p>
                  <p className="mt-2 text-sm text-blue-600/70 dark:text-slate-400">{label}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          FEATURES — white section
      ════════════════════════════════════ */}
      {/* ════ FEATURES — white ════ */}
      <section id="features" className="bg-background py-24">
        <SectionIn className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-foreground mb-3">
                Discover BlockFinaX's <span className="text-blue-600">Core Services</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Everything required to replace fragmented, paper-based trade finance with a single, transparent protocol.</p>
            </div>
          </Reveal>

          {/* Feature cards grid — inspired by XM "Discover Our Traders' Favourites" */}
          <div className="grid md:grid-cols-2 gap-5">

            {/* Large dark feature card (left) — with product screenshot */}
            <Reveal>
              <div className="rounded-2xl bg-blue-900 dark:bg-[#0D1321] h-full flex flex-col md:flex-row overflow-hidden min-h-[340px]">
                {/* Text */}
                <div className="p-8 flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 mb-5">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">On-Chain Letters of Credit</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                      Issue, amend, and settle LCs entirely on-chain. Smart contracts enforce documentary compliance automatically — eliminating bank intermediaries and cutting costs by up to 80%.
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 text-blue-400 text-sm font-medium mt-8 hover:text-blue-300 transition-colors">
                    Explore Letters of Credit <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
                {/* Screenshot */}
                <div className="md:w-[55%] flex-shrink-0 relative overflow-hidden">
                  <img
                    src="/img-lc-dashboard.png"
                    alt="BlockFinaX LC Dashboard"
                    className="w-full h-full object-cover object-left-top"
                    style={{ minHeight: 220 }}
                  />
                  {/* Subtle overlay so the image blends with card bg on the left edge */}
                  <div className="absolute inset-y-0 left-0 w-8" style={{ background: 'rgb(30 58 138)', maskImage: 'linear-gradient(to right, rgb(30 58 138), transparent)', WebkitMaskImage: 'linear-gradient(to right, rgb(30 58 138), transparent)' }} />
                </div>
              </div>
            </Reveal>

            {/* Solid blue feature card (right) — with mockup */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl bg-blue-600 h-full flex flex-col overflow-hidden min-h-[340px]">
                {/* Screenshot at top */}
                <div className="relative overflow-hidden h-44 flex-shrink-0">
                  <img
                    src="/img-platform-mockup.png"
                    alt="BlockFinaX Platform"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12" style={{ background: '#2563eb', maskImage: 'linear-gradient(to top, #2563eb, transparent)', WebkitMaskImage: 'linear-gradient(to top, #2563eb, transparent)' }} />
                </div>
                {/* Text */}
                <div className="p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 mb-5">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Invoice Financing Marketplace</h3>
                    <p className="text-white/80 text-sm leading-relaxed max-w-xs">
                      Upload invoices and get matched with global liquidity providers in minutes. Unlock working capital at competitive rates — your invoice is your collateral.
                    </p>
                    <p className="text-white font-semibold mt-3">Rates from 3.5% APR</p>
                  </div>
                  <button className="flex items-center gap-1.5 text-white text-sm font-medium mt-8 hover:opacity-80 transition-opacity">
                    Access Invoice Financing <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Light card */}
            <Reveal>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border p-8 h-full flex flex-col justify-between min-h-[260px]">
                <div>
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 mb-5">
                    <TrendingUp className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">FX Hedging & Derivatives</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Lock in exchange rates with on-chain forward contracts and options. Protect your margins against currency volatility before shipments arrive.
                  </p>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-6 hover:text-blue-700 transition-colors">
                  Start Hedging <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </Reveal>

            {/* Light card */}
            <Reveal delay={0.05}>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border p-8 h-full flex flex-col justify-between min-h-[260px]">
                <div>
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 mb-5">
                    <Shield className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Smart Escrow & Settlement</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Funds are held in programmable escrow and released automatically upon verified delivery. Stablecoin settlements broadcast in under 2 seconds — to 48 countries.
                  </p>
                </div>
                <button className="flex items-center gap-1 text-blue-600 text-sm font-semibold mt-6 hover:text-blue-700 transition-colors">
                  Explore Escrow <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </Reveal>
          </div>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          HOW IT WORKS — alternating section
      ════════════════════════════════════ */}
      {/* ════ HOW IT WORKS — rounded top lifts from white ════ */}
      <section id="how-it-works" className="bg-muted/30 dark:bg-slate-950 py-24 border-t border-border">
        <SectionIn className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-3">How BlockFinaX Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">From purchase order to final settlement — every step orchestrated on-chain in minutes, not weeks.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { n: "01", icon: Building2, title: "Create Trade Terms", desc: "Importer and exporter agree on terms. An on-chain Letter of Credit is drafted with all conditions encoded as smart contract logic." },
              { n: "02", icon: FileText, title: "Submit Documents", desc: "Shipping documents are submitted digitally. AI cross-checks against LC terms in seconds — not 5–7 banking days." },
              { n: "03", icon: Coins, title: "Escrow & Finance", desc: "Stablecoins are locked in escrow. Access invoice financing from our liquidity pool at competitive rates if needed." },
              { n: "04", icon: CheckCircle2, title: "Auto Settlement", desc: "On document compliance, the smart contract releases funds to the exporter's wallet. No manual wire, no delays." },
            ].map(({ n, icon: Icon, title, desc }, i) => (
              <Reveal key={n} delay={i * 0.07}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl font-black text-slate-200 dark:text-slate-800 leading-none">{n}</span>
                    <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h4 className="font-bold text-foreground mb-2">{title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <div className="mt-12 text-center">
              <Link href="/create-wallet">
                <Button size="lg" className="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white border-0 font-semibold">
                  Open Your Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>

          {/* Port photo — full-bleed image below the steps */}
          <Reveal delay={0.25}>
            <div className="mt-14 rounded-2xl overflow-hidden">
              <img
                src="/img-trade-port.png"
                alt="Global shipping port — the trade BlockFinaX finances"
                className="w-full h-72 object-cover"
              />
              <div className="bg-blue-900 dark:bg-[#0D1321] px-6 py-4 flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 relative" />
                </span>
                <p className="text-blue-200 dark:text-slate-400 text-sm">BlockFinaX finances real-world trade flows across 48 countries. <span className="text-white font-medium">From container shipments to commodity imports.</span></p>
              </div>
            </div>
          </Reveal>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          USE CASES — white section
      ════════════════════════════════════ */}
      {/* ════ USE CASES — white ════ */}
      <section id="company" className="bg-background py-24 border-t border-border">
        <SectionIn className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-foreground mb-3">
                Who BlockFinaX Is <span className="text-blue-600">Built For</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">From SME exporters to global commodity traders — BlockFinaX adapts to every trade structure.</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { icon: Globe, title: "Exporters & SMEs", desc: "Access buyers globally and get paid faster. Stop waiting 60–90 days — unlock capital against your invoices the moment goods ship.", cta: "Explore for Exporters", dark: true },
              { icon: Building2, title: "Importers & Corporates", desc: "Manage trade payables with precision. Issue LCs, approve supplier financing requests, and reconcile payments in one dashboard.", cta: "Explore for Importers", dark: false },
              { icon: Banknote, title: "Liquidity Providers", desc: "Earn competitive yields financing real-world trade flows. All positions are transparently collateralized and on-chain verifiable.", cta: "Start Earning", dark: false },
              { icon: Users, title: "Trade Finance Banks", desc: "Integrate BlockFinaX as a digitalisation layer. Offer clients faster, cheaper LC and financing services while retaining your relationship.", cta: "Partner with Us", dark: true },
            ].map(({ icon: Icon, title, desc, cta, dark }) => (
              <Reveal key={title}>
                <div className={`rounded-2xl p-8 flex flex-col justify-between min-h-[220px] ${dark ? "bg-blue-900 dark:bg-[#0D1321]" : "bg-slate-50 dark:bg-slate-900 border border-border"}`}>
                  <div className="flex items-start gap-5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? "bg-blue-600" : "bg-blue-100 dark:bg-blue-900/40"}`}>
                      <Icon className={`h-5 w-5 ${dark ? "text-white" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${dark ? "text-white" : "text-foreground"}`}>{title}</h3>
                      <p className={`text-sm leading-relaxed ${dark ? "text-slate-400" : "text-muted-foreground"}`}>{desc}</p>
                    </div>
                  </div>
                  <button className={`flex items-center gap-1.5 mt-6 text-sm font-semibold ${dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} transition-colors`}>
                    {cta} <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          SECURITY — dark section
      ════════════════════════════════════ */}
      {/* ════ SECURITY — dark section, rounded top rises from white ════ */}
      <section className="bg-slate-50 dark:bg-[#0D1321] py-24 rounded-t-[2.5rem] border-t border-border dark:border-transparent">
        <SectionIn className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-4xl font-bold text-foreground dark:text-white mb-3">Enterprise Security, By Design</h2>
              <p className="text-muted-foreground dark:text-slate-400 max-w-xl mx-auto">Funds are never held by BlockFinaX. Every transaction is transparently auditable on-chain.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Lock, title: "Non-Custodial", desc: "You hold your keys at all times. BlockFinaX never controls your funds." },
              { icon: Shield, title: "Audited Contracts", desc: "Smart contracts independently audited by leading security firms." },
              { icon: Zap, title: "SOC 2 Type II", desc: "Independently certified for security, availability, and confidentiality." },
              { icon: Clock, title: "99.9% Uptime", desc: "Decentralized infrastructure with no single point of failure." },
            ].map(({ icon: Icon, title, desc }) => (
              <Reveal key={title}>
                <div className="rounded-xl bg-white dark:bg-[#141B2D] border border-border dark:border-white/5 p-6 shadow-sm dark:shadow-none">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="font-semibold text-foreground dark:text-white mb-1.5">{title}</h4>
                  <p className="text-sm text-muted-foreground dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          LIVE ACTIVITY — dark section
      ════════════════════════════════════ */}
      {/* ════ LIVE ACTIVITY — darkest, seamless from security ════ */}
      <section className="bg-background dark:bg-[#060B17] py-20 border-t border-border dark:border-transparent">
        <SectionIn className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground dark:text-slate-500 mb-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500 relative" />
                </span>
                Protocol Live
              </span>
              <h2 className="text-3xl font-bold text-foreground dark:text-white">Real-Time Protocol Activity</h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-xl bg-card dark:bg-[#0D1321] border border-border dark:border-white/5 divide-y divide-border dark:divide-white/5 overflow-hidden shadow-sm dark:shadow-none">
              {[
                { action: "📄 LC Issued", party: "Acme Corp → Delta Supply Co.", amount: "$420,000 USDC", time: "2 min ago", badge: "Confirmed" },
                { action: "💰 Invoice Financed", party: "TradeMax GmbH · 4.2% APR", amount: "$180,000 USDT", time: "11 min ago", badge: "Active" },
                { action: "✅ Settlement", party: "Pacific Exports → Buyer Corp.", amount: "$1,200,000 USDC", time: "24 min ago", badge: "Settled" },
                { action: "🔒 FX Hedge Locked", party: "EUR/USD Forward Contract", amount: "€250,000 notional", time: "35 min ago", badge: "Locked" },
                { action: "🏛️ Dispute Resolved", party: "Arbitration #A-0012", amount: "$67,000 released", time: "1h ago", badge: "Resolved" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
                  <span className="text-sm text-foreground">{tx.action}</span>
                  <span className="text-sm text-muted-foreground hidden sm:block">{tx.party}</span>
                  <span className="ml-auto font-mono text-sm text-foreground dark:text-slate-300 flex-shrink-0">{tx.amount}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0 w-20 text-right">{tx.time}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium hidden md:block flex-shrink-0">{tx.badge}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          CTA — solid blue section
      ════════════════════════════════════ */}
      {/* ════ CTA — solid blue, rounded top lifts from dark ════ */}
      <section className="bg-blue-600 py-24 rounded-t-[2.5rem]">
        <SectionIn className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Start Trading Without Borders. Today.
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
              Join 1,200+ companies already financing and settling trade on BlockFinaX. No waiting. No paperwork. No banks required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create-wallet">
                <Button size="lg" className="px-8 h-12 font-semibold bg-white text-blue-600 hover:bg-blue-50 border-0">
                  Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 h-12 font-semibold border-white/40 text-white hover:bg-white/10 hover:text-white">
                Schedule a Demo
              </Button>
            </div>
          </Reveal>
        </SectionIn>
      </section>

      {/* ════════════════════════════════════
          FOOTER
      ════════════════════════════════════ */}
      <footer className="bg-slate-100 dark:bg-[#060B17] border-t border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoPath} alt="BlockFinaX" className="h-7 w-7" />
                <span className="font-bold text-slate-900 dark:text-white">BlockFinaX</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed mb-5">
                The decentralized infrastructure layer for global trade finance. Transparent, programmable, borderless.
              </p>
              <div className="flex gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-md border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-500 dark:hover:border-white/30 transition-all">
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {[
              { title: "Platform", links: ["Letters of Credit", "Invoice Financing", "FX Hedging", "Smart Escrow", "API"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h5 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{title}</h5>
                <ul className="space-y-3">
                  {links.map(l => (
                    <li key={l}><a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <p>© 2026 BlockFinaX Protocol. All rights reserved.</p>
            <p>Built on Ethereum & Base L2 · Non-custodial · Open Source</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
