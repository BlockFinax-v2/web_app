import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, TrendingUp, Users, Lock, DollarSign, Rocket, Target, Globe, Zap, UserCheck, Package, Coins, FileText, Shield, BarChart3, Building2, Wallet, Vote, CircleDollarSign, Network, Award, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@/assets/logo.png";
import exporterImg from "@assets/stock_images/professional_asian_b_942bc5e4.jpg";
import importerImg from "@assets/stock_images/professional_african_4c60995c.jpg";
import financierImg from "@assets/stock_images/professional_caucasi_a0db0b50.jpg";

const slides = [
  {
    id: 1,
    type: "cover",
    title: "BlockFinaX",
    subtitle: "DeFi Infrastructure for Global Trade Finance",
    tagline: "Building Trust and Unlocking Capital for Cross-Border Trade",
  },
  {
    id: 2,
    type: "problem",
    title: "The Global Trade Finance Crisis",
    subtitle: "A massive capital mismatch creating opportunity",
    problems: [
      { 
        icon: TrendingUp, 
        stat: "$4 Trillion", 
        label: "Trade Finance Gap", 
        desc: "Unmet financing demand in emerging markets",
        color: "text-red-500"
      },
      { 
        icon: Coins, 
        stat: "$3.3 Trillion", 
        label: "Idle Blockchain Capital", 
        desc: "Digital assets but only 4.1% is locked for yield",
        color: "text-green-500"
      },
    ],
    painPoints: [
      { icon: Users, issue: "Trust Gap", desc: "Exporters won't ship without payment, importers won't pay without delivery" },
      { icon: DollarSign, issue: "High Bank Fees", desc: "Traditional letters of credit cost 5-15% of transaction value - BlockFinaX charges 1% with NO bank fees" },
      { icon: Globe, issue: "Payment Friction", desc: "Cross-border settlements take 3-7 days and incur multiple fees - USDC settles instantly" },
      { icon: Building2, issue: "Capital Unavailability", desc: "Banks deny 45% of SME trade finance applications - blockchain is permissionless" },
    ],
  },
  {
    id: 3,
    type: "opportunity",
    title: "Massive Market Opportunity",
    subtitle: "$3.3T in digital assets (only 4.1% locked for yield) ready to flow into $4T trade gap",
    urgency: "The opportunity is NOW: $3.3 trillion in idle blockchain capital ready to flow into secured trade finance with proper infrastructure",
    stats: [
      { value: "$4T", label: "Global Trade Finance Gap", growth: "Growing 8% annually", icon: TrendingUp },
      { value: "$18T", label: "Annual Global Trade Volume", growth: "SMEs represent 40%", icon: Globe },
      { value: "60M", label: "Underserved SME Exporters", growth: "Emerging markets", icon: Building2 },
      { value: "1%", label: "BlockFinaX Fee (NO Bank Fees)", growth: "vs. Bank 5-15% - 80% savings", icon: DollarSign },
    ],
  },
  {
    id: 4,
    type: "personas",
    title: "Our Users",
    subtitle: "Three key stakeholder groups driving the platform",
    users: [
      { 
        icon: Package, 
        name: "Exporters / Sellers", 
        desc: "Emerging market businesses needing payment guarantees",
        value: "Ship with confidence knowing 80% payment is guaranteed by treasury pool",
        image: exporterImg,
        color: "from-blue-500 to-blue-600"
      },
      { 
        icon: Globe, 
        name: "Importers / Buyers", 
        desc: "International traders sourcing from emerging markets",
        value: "Pay only upon delivery with escrow protection and instant USDC settlement",
        image: importerImg,
        color: "from-purple-500 to-purple-600"
      },
      { 
        icon: Vote, 
        name: "Treasury Stakers (Liquidity Providers)", 
        desc: "Provide USDC liquidity to treasury pool and govern guarantee approvals",
        value: "Stake capital, vote on applications, earn 60% of 1% issuance fees (~8-12% APY)",
        image: financierImg,
        color: "from-green-500 to-green-600"
      },
    ],
  },
  {
    id: 5,
    type: "solution",
    title: "BlockFinaX Solution",
    subtitle: "Trustless trade infrastructure on blockchain",
    features: [
      { icon: Lock, title: "Smart Contract Escrow", desc: "EIP-2535 Diamond Standard contracts for milestone-based payments" },
      { icon: CircleDollarSign, title: "USDC Settlements", desc: "Instant cross-border payments with stablecoin eliminating 3-7 day delays" },
      { icon: Zap, title: "Wallet-to-Wallet Messaging", desc: "Encrypted communication between trading partners with file attachments" },
      { icon: FileText, title: "Digital Documentation", desc: "Bill of Lading, invoices, and contracts stored on-chain" },
    ],
  },
  {
    id: 6,
    type: "trade_finance",
    title: "Trade Finance Engine",
    subtitle: "Our key differentiator replacing traditional Letter of Credit",
    differentiator: "Unlike banks that require lengthy approvals and charge 5-15%, BlockFinaX provides trustless blockchain-backed guarantees at 1% with NO bank fees through democratic treasury voting and physical goods collateral custody",
    guaranteeDetails: {
      coverage: "80% Treasury Guarantee",
      coverageDesc: "Treasury pool covers 80% of invoice value, seller bears 20% risk exposure",
      collateral: "Bill of Lading Custody",
      collateralDesc: "Treasury holds title document as collateral - can sell goods if buyer defaults",
      compliance: "ICC URDG 758 Compliant",
      complianceDesc: "International Chamber of Commerce Uniform Rules for Demand Guarantees",
      fee: "1% Issuance Fee (NO Bank Fees)",
      feeDesc: "vs. 5-15% traditional bank charges - 80% cost savings, zero intermediary fees",
    },
    process: [
      "Buyer applies for Trade Finance",
      "Treasury votes on application (≥60 votes, ≥60% approval)",
      "Draft certificate issued to seller",
      "Seller approves guarantee terms",
      "Buyer pays 1% fee → Final certificate issued",
      "Goods ship → Bill of Lading transferred to treasury custody",
      "Upon delivery, treasury releases BoL to buyer",
      "If default, treasury keeps BoL and sells goods to recover 80% payment",
    ],
  },
  {
    id: 7,
    type: "staker_economics",
    title: "Treasury Staker Flywheel",
    subtitle: "DeFi decision makers earning trade finance yield",
    incomeExample: "Real Example: $100K guarantee approved → $1K issuance fee → $600 distributed to stakers. With $10M staked and $200M annual volume, stakers earn ~10% APY",
    flywheel: [
      { step: "Stake USDC in Treasury Pool", icon: Wallet, benefit: "Gain voting power" },
      { step: "Vote on Trade Finance Applications", icon: Vote, benefit: "Democratic governance" },
      { step: "Approved Guarantees Issue (1% fee)", icon: Award, benefit: "Fee generation" },
      { step: "60% of Fees Distributed to Stakers", icon: CircleDollarSign, benefit: "Proportional yield" },
      { step: "Compound or Withdraw Earnings", icon: TrendingUp, benefit: "Flexible returns" },
    ],
    metrics: {
      stakingAPY: "8-12% projected APY",
      feeDistribution: "60% to stakers, 40% to treasury reserve",
      votingPower: "Proportional to stake amount",
      claimVoting: "72-hour voting window on seller default claims",
    },
  },
  {
    id: 8,
    type: "ecosystem",
    title: "Ecosystem & Partnerships",
    subtitle: "Building with industry-leading protocols",
    partnerships: [
      { category: "Stablecoin Infrastructure", partners: "USDC (Circle), Base Network", icon: Coins },
      { category: "Oracles & Data", partners: "Target: Chainlink, UMA for price feeds", icon: BarChart3 },
      { category: "Compliance & KYC", partners: "Under evaluation for AML/KYC integration", icon: Shield },
      { category: "DeFi Protocols", partners: "Target: Aave, Compound for liquidity optimization", icon: Network },
    ],
    note: "Partnership discussions in progress - final integrations to be announced Q1 2026",
  },
  {
    id: 9,
    type: "business_model",
    title: "Revenue Streams",
    subtitle: "Multiple monetization channels",
    revenue: [
      { 
        stream: "Trade Finance Issuance Fees", 
        rate: "1% of invoice value (40% to treasury)", 
        example: "$100K invoice = $1K fee → $400 treasury revenue",
        potential: "$2M ARR at $200M annual guarantee volume"
      },
      { 
        stream: "Escrow Transaction Fees", 
        rate: "0.5% per milestone-based escrow", 
        example: "$50K escrow = $250 fee",
        potential: "$500K ARR at 2,000 monthly transactions"
      },
      { 
        stream: "Platform Subscriptions", 
        rate: "$99-$499/month for business accounts", 
        example: "Advanced analytics, priority support",
        potential: "$600K ARR at 1,000 subscribers"
      },
      { 
        stream: "Trade Financing Services", 
        rate: "2-4% on working capital provision", 
        example: "$100K loan at 3% = $3K fee",
        potential: "$1.2M ARR at $30M financing volume"
      },
    ],
    totalProjection: "$4.3M ARR at moderate scale",
  },
  {
    id: 10,
    type: "roadmap",
    title: "Roadmap to Mainnet",
    subtitle: "12-month plan to full production launch",
    quarters: [
      {
        q: "Q1 2026 (Current)",
        goals: [
          "Complete Trade Finance MVP on testnet",
          "Launch pilot program with 10-20 emerging market exporters",
          "Integrate USDC payment rails",
          "Begin compliance framework implementation",
        ],
      },
      {
        q: "Q2 2026",
        goals: [
          "Process first $1M in guaranteed trades on testnet",
          "Complete ICC URDG 758 legal review",
          "Smart contract security audits (2 independent firms)",
          "Build treasury staker community (target 50+ stakers)",
        ],
      },
      {
        q: "Q3 2026 (July 7 Mainnet Launch)",
        goals: [
          "Deploy production smart contracts on Base mainnet",
          "Launch with $5M+ in treasury liquidity",
          "Onboard first 50 production users (exporters + importers)",
          "Begin marketing and partnership announcements",
        ],
      },
      {
        q: "Q4 2026",
        goals: [
          "Scale to $50M in Trade Finance issuance",
          "Expand to 3 additional blockchain networks",
          "Launch mobile applications (iOS + Android)",
          "Prepare Series A fundraise with traction metrics",
        ],
      },
    ],
    mainnetDate: "July 7, 2026",
  },
  {
    id: 11,
    type: "ask",
    title: "Join Our Mission",
    subtitle: "Help us unlock $4T in trade finance for emerging markets",
    vision: "We're building the infrastructure to connect $3.3 trillion in DeFi liquidity with millions of underserved exporters in emerging markets. Trade Finance guarantees replace expensive bank letters of credit with transparent, blockchain-backed guarantees at 1% cost with NO bank fees.",
    ask: [
      { category: "Strategic Partners", description: "DeFi protocols, stablecoin issuers, trade finance institutions" },
      { category: "Pilot Customers", description: "Exporters/importers ready to test Trade Finance system on testnet" },
      { category: "Treasury Stakers", description: "Early liquidity providers for mainnet launch pool" },
      { category: "Investors", description: "Funding details available upon request for qualified partners" },
    ],
    contact: "Let's democratize global trade finance together",
    cta: "Contact us to learn more about partnership opportunities",
  },
];

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSlide]);

  const downloadPDF = async () => {
    try {
      setIsDownloading(true);
      const originalSlide = currentSlide;
      
      toast({
        title: "Generating PDF",
        description: `Capturing all ${slides.length} slides...`,
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1920, 1080],
      });

      // Capture all slides
      for (let i = 0; i < slides.length; i++) {
        setDirection(0);
        setCurrentSlide(i);
        
        // Wait for slide to render and animations to settle
        await new Promise(resolve => setTimeout(resolve, 800));

        // Find the main container
        const mainContainer = document.querySelector('[role="main"]');
        if (!mainContainer) {
          throw new Error("Main container not found");
        }

        const canvas = await html2canvas(mainContainer as HTMLElement, {
          scale: 1.5,
          backgroundColor: "#0f172a",
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowWidth: 1920,
          windowHeight: 1080,
          foreignObjectRendering: false,
          imageTimeout: 0,
        });

        const imgData = canvas.toDataURL("image/png", 1.0);
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = pdf.internal.pageSize.getHeight();

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
      }

      // Restore original slide
      setDirection(0);
      setCurrentSlide(originalSlide);

      pdf.save("BlockFinaX-Pitch-Deck.pdf");

      toast({
        title: "Success!",
        description: `All ${slides.length} slides downloaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? 1000 : -1000),
      opacity: prefersReducedMotion ? 1 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: prefersReducedMotion ? 0 : (direction > 0 ? -1000 : 1000),
      opacity: prefersReducedMotion ? 1 : 0,
    }),
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" role="main" aria-label="BlockFinaX Pitch Deck">
      {/* Download Button */}
      <div className="fixed top-8 right-8 z-50">
        <Button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="bg-primary hover:bg-primary/80 text-white shadow-lg"
          data-testid="button-download-pdf"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 min-h-screen flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="flex-1 flex items-center justify-center"
            role="region"
            aria-live="polite"
            aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}
          >
            <div className="w-full">
              {slide.type === "cover" && (
                <div className="text-center space-y-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-8"
                  >
                    <img src={logoPath} alt="BlockFinaX" className="w-24 h-24" />
                  </motion.div>
                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-7xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"
                  >
                    {slide.title}
                  </motion.h1>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl text-primary/80"
                  >
                    {slide.subtitle}
                  </motion.p>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl text-gray-400 max-w-3xl mx-auto"
                  >
                    {slide.tagline}
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-sm text-gray-500 mt-12"
                  >
                    Press → to continue
                  </motion.div>
                </div>
              )}

              {slide.type === "problem" && (
                <div className="space-y-10">
                  <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                  </div>
                  
                  {/* Capital Mismatch - Two Big Numbers */}
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    {slide.problems?.map((problem, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.2 }}
                        className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border-2 border-primary/30"
                      >
                        <problem.icon className={`w-16 h-16 ${problem.color} mb-4 mx-auto`} />
                        <h3 className="text-5xl font-bold text-center mb-2">{problem.stat}</h3>
                        <p className="text-xl font-semibold text-center text-primary mb-2">{problem.label}</p>
                        <p className="text-gray-400 text-center">{problem.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pain Points Grid */}
                  <div>
                    <h3 className="text-2xl font-bold text-center text-primary mb-6">Core Challenges</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {slide.painPoints?.map((pain, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-primary/20"
                        >
                          <div className="flex items-start gap-3">
                            <pain.icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                            <div>
                              <h4 className="text-lg font-semibold mb-1">{pain.issue}</h4>
                              <p className="text-sm text-gray-400">{pain.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {slide.type === "opportunity" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400 mb-6">{slide.subtitle}</p>
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-r from-green-500/20 to-primary/20 border-2 border-green-500/40 rounded-xl p-4 max-w-4xl mx-auto"
                    >
                      <p className="text-lg font-semibold text-green-400">{slide.urgency}</p>
                    </motion.div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.stats?.map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-primary/20 text-center"
                      >
                        <stat.icon className="w-12 h-12 text-primary mb-4 mx-auto" />
                        <h3 className="text-4xl font-bold text-primary mb-2">{stat.value}</h3>
                        <p className="text-xl font-semibold mb-2">{stat.label}</p>
                        <p className="text-gray-400 text-sm">{stat.growth}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "personas" && (
                <div className="space-y-8">
                  <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.users?.map((user, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.15 }}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center`}>
                            <user.icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{user.name}</h3>
                            <p className="text-sm text-gray-400">{user.desc}</p>
                          </div>
                        </div>
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                          <p className="text-sm text-gray-300"><span className="font-semibold text-primary">Value:</span> {user.value}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "solution" && (
                <div className="space-y-8">
                  <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.features?.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20"
                      >
                        <feature.icon className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-400">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "trade_finance" && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400 mb-4">{slide.subtitle}</p>
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-primary/20 to-blue-600/20 border-2 border-primary/40 rounded-xl p-4 max-w-5xl mx-auto"
                    >
                      <p className="text-base font-semibold text-primary">{slide.differentiator}</p>
                    </motion.div>
                  </div>
                  
                  {/* Key Features Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/40"
                    >
                      <Shield className="w-12 h-12 text-primary mb-3" />
                      <h3 className="text-2xl font-bold mb-2">{slide.guaranteeDetails?.coverage}</h3>
                      <p className="text-gray-300 text-sm">{slide.guaranteeDetails?.coverageDesc}</p>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/40"
                    >
                      <Package className="w-12 h-12 text-primary mb-3" />
                      <h3 className="text-2xl font-bold mb-2">{slide.guaranteeDetails?.collateral}</h3>
                      <p className="text-gray-300 text-sm">{slide.guaranteeDetails?.collateralDesc}</p>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm p-6 rounded-xl border-2 border-primary/40"
                    >
                      <Award className="w-12 h-12 text-primary mb-3" />
                      <h3 className="text-2xl font-bold mb-2">{slide.guaranteeDetails?.compliance}</h3>
                      <p className="text-gray-300 text-sm">{slide.guaranteeDetails?.complianceDesc}</p>
                    </motion.div>

                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-green-500/20 to-green-500/5 backdrop-blur-sm p-6 rounded-xl border-2 border-green-500/40"
                    >
                      <DollarSign className="w-12 h-12 text-green-500 mb-3" />
                      <h3 className="text-2xl font-bold mb-2">{slide.guaranteeDetails?.fee}</h3>
                      <p className="text-gray-300 text-sm">{slide.guaranteeDetails?.feeDesc}</p>
                    </motion.div>
                  </div>

                  {/* Process Flow */}
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20">
                    <h3 className="text-xl font-bold text-primary mb-4 text-center">Guarantee Issuance Process</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {slide.process?.map((step, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + idx * 0.05 }}
                          className="flex items-start gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-gray-300">{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {slide.type === "staker_economics" && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400 mb-4">{slide.subtitle}</p>
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-r from-green-500/20 to-primary/20 border-2 border-green-500/40 rounded-xl p-4 max-w-5xl mx-auto"
                    >
                      <p className="text-base font-semibold text-green-400">{slide.incomeExample}</p>
                    </motion.div>
                  </div>
                  
                  {/* Flywheel Diagram */}
                  <div className="relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center z-10">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 text-white mx-auto mb-1" />
                        <p className="text-white text-xs font-bold">Earn Yield</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {slide.flywheel?.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.15 }}
                          className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-primary/20 text-center"
                        >
                          <item.icon className="w-10 h-10 text-primary mx-auto mb-2" />
                          <p className="text-xs font-semibold mb-1">{item.step}</p>
                          <p className="text-xs text-green-400">{item.benefit}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {Object.entries(slide.metrics || {}).map(([key, value], idx) => (
                      <motion.div
                        key={key}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        className="bg-primary/10 border border-primary/30 rounded-lg p-4"
                      >
                        <p className="text-sm text-gray-400 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="text-lg font-bold text-primary">{value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "ecosystem" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.partnerships?.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.15 }}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20"
                      >
                        <item.icon className="w-12 h-12 text-primary mb-3" />
                        <h3 className="text-xl font-semibold mb-2">{item.category}</h3>
                        <p className="text-gray-400">{item.partners}</p>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center"
                  >
                    <p className="text-sm text-gray-300"><span className="font-semibold text-primary">Note:</span> {slide.note}</p>
                  </motion.div>
                </div>
              )}

              {slide.type === "business_model" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                  </div>
                  <div className="space-y-4">
                    {slide.revenue?.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-primary">{item.stream}</h3>
                          <span className="text-sm bg-primary/20 px-3 py-1 rounded-full">{item.rate}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{item.example}</p>
                        <p className="text-sm font-semibold text-green-400">{item.potential}</p>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-primary/20 to-blue-600/20 border-2 border-primary/40 rounded-xl p-6 text-center"
                  >
                    <p className="text-2xl font-bold text-primary">{slide.totalProjection}</p>
                  </motion.div>
                </div>
              )}

              {slide.type === "roadmap" && (
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400">{slide.subtitle}</p>
                    <p className="text-xl text-green-400 mt-2 font-semibold">🎯 Mainnet Launch: {slide.mainnetDate}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {slide.quarters?.map((quarter, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.15 }}
                        className={`bg-white/5 backdrop-blur-sm p-6 rounded-xl border-2 ${idx === 2 ? 'border-green-500/50 bg-green-500/5' : 'border-primary/20'}`}
                      >
                        <h3 className="text-2xl font-bold text-primary mb-4">{quarter.q}</h3>
                        <ul className="space-y-2">
                          {quarter.goals.map((goal, goalIdx) => (
                            <li key={goalIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-300">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {slide.type === "ask" && (
                <div className="space-y-8 text-center">
                  <div className="mb-8">
                    <h2 className="text-5xl font-bold text-primary mb-4">{slide.title}</h2>
                    <p className="text-2xl text-gray-400 mb-6">{slide.subtitle}</p>
                    <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">{slide.vision}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-12">
                    {slide.ask?.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-primary/20"
                      >
                        <h3 className="text-xl font-bold text-primary mb-2">{item.category}</h3>
                        <p className="text-gray-400">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 space-y-4"
                  >
                    <p className="text-2xl font-semibold text-primary">{slide.contact}</p>
                    <p className="text-gray-400">{slide.cta}</p>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                      data-testid="button-contact-cta"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Get in Touch
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            onClick={prevSlide}
            variant="outline"
            size="icon"
            className="bg-white/5 border-primary/30 hover:bg-primary/20"
            disabled={currentSlide === 0}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentSlide ? 1 : -1);
                  setCurrentSlide(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-gray-600'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
                data-testid={`button-slide-${idx + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={nextSlide}
            variant="outline"
            size="icon"
            className="bg-white/5 border-primary/30 hover:bg-primary/20"
            disabled={currentSlide === slides.length - 1}
            data-testid="button-next-slide"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Slide Counter */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Slide {currentSlide + 1} of {slides.length}
        </div>
      </div>
    </div>
  );
}
