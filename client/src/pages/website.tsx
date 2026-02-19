import { Link } from "wouter";
import { 
  Wallet, 
  Shield, 
  Globe, 
  Zap, 
  Users, 
  FileText,
  ArrowRight,
  CheckCircle2,
  Banknote,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronDown,
  Twitter,
  Linkedin,
  Github,
  Send,
  ArrowDown,
  UserCheck,
  Package,
  Coins,
  Menu,
  X,
  Code2,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import logoPath from "@/assets/logo.png";

export default function Website() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  
  
  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Mainnet launch date: July 7, 2026
  const mainnetLaunchDate = new Date('2026-07-07T00:00:00Z').getTime();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = mainnetLaunchDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80; // Account for sticky header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setMobileMenuOpen(false); // Close mobile menu after navigation
      setMobileSolutionsOpen(false); // Close solutions submenu
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-3 cursor-pointer"
              data-testid="link-home"
            >
              <img src={logoPath} alt="BlockFinaX" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                BlockFinaX
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-medium hover:text-primary transition-colors"
                data-testid="nav-home"
              >
                Home
              </button>

              <button 
                onClick={() => scrollToSection('about')}
                className="text-sm font-medium hover:text-primary transition-colors"
                data-testid="nav-about"
              >
                About Us
              </button>

              {/* Solutions Dropdown */}
              <div 
                className="relative"
                onMouseEnter={() => setSolutionsOpen(true)}
                onMouseLeave={() => setSolutionsOpen(false)}
              >
                <button 
                  className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                  data-testid="nav-solutions"
                >
                  Solutions
                  <ChevronDown className={`h-4 w-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {solutionsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg py-2">
                    <button 
                      onClick={() => scrollToSection('about')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      data-testid="nav-finance"
                    >
                      Finance
                    </button>
                    <button 
                      onClick={() => scrollToSection('about')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      data-testid="nav-pay"
                    >
                      Pay
                    </button>
                    <Link href="/hedge">
                      <button 
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                        data-testid="nav-hedge"
                      >
                        Hedge
                      </button>
                    </Link>
                    <button 
                      onClick={() => scrollToSection('about')}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                      data-testid="nav-escrow"
                    >
                      Escrow Protection
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium hover:text-primary transition-colors"
                data-testid="nav-how-it-works"
              >
                How It Works
              </button>

              <button 
                onClick={() => scrollToSection('use-cases')}
                className="text-sm font-medium hover:text-primary transition-colors"
                data-testid="nav-use-cases"
              >
                Who We Serve
              </button>

              <Link href="/whitepaper">
                <button 
                  className="text-sm font-medium hover:text-primary transition-colors"
                  data-testid="nav-whitepaper"
                >
                  Whitepaper
                </button>
              </Link>

              <Link href="/create-wallet">
                <Button 
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  data-testid="nav-get-started"
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background">
              <div className="py-4 space-y-2">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="mobile-nav-home"
                >
                  Home
                </button>

                <button
                  onClick={() => scrollToSection('about')}
                  className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="mobile-nav-about"
                >
                  About Us
                </button>

                {/* Solutions Collapsible */}
                <div>
                  <button
                    onClick={() => setMobileSolutionsOpen(!mobileSolutionsOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    data-testid="mobile-nav-solutions"
                  >
                    Solutions
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileSolutionsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {mobileSolutionsOpen && (
                    <div className="pl-8 pr-4 py-2 space-y-2">
                      <button
                        onClick={() => scrollToSection('about')}
                        className="block w-full text-left py-1 text-sm hover:text-primary transition-colors"
                        data-testid="mobile-nav-finance"
                      >
                        Finance
                      </button>
                      <button
                        onClick={() => scrollToSection('about')}
                        className="block w-full text-left py-1 text-sm hover:text-primary transition-colors"
                        data-testid="mobile-nav-pay"
                      >
                        Pay
                      </button>
                      <Link href="/hedge">
                        <button
                          className="block w-full text-left py-1 text-sm hover:text-primary transition-colors"
                          data-testid="mobile-nav-hedge"
                        >
                          Hedge
                        </button>
                      </Link>
                      <button
                        onClick={() => scrollToSection('about')}
                        className="block w-full text-left py-1 text-sm hover:text-primary transition-colors"
                        data-testid="mobile-nav-escrow"
                      >
                        Escrow Protection
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="mobile-nav-how-it-works"
                >
                  How It Works
                </button>

                <button
                  onClick={() => scrollToSection('use-cases')}
                  className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="mobile-nav-use-cases"
                >
                  Who We Serve
                </button>

                <Link href="/whitepaper">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                    data-testid="mobile-nav-whitepaper"
                  >
                    Whitepaper
                  </button>
                </Link>

                <div className="px-4 pt-2">
                  <Link href="/create-wallet">
                    <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90" data-testid="mobile-nav-get-started">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 dark:from-primary/5 dark:via-blue-500/5 dark:to-purple-500/5"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-24 md:py-36 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-blue-600 bg-clip-text text-transparent leading-tight"
            >
              Pay. Finance. Hedge.
              <br />
              <span className="text-3xl md:text-5xl lg:text-6xl">The Trade Finance Marketplace</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Pay across borders, finance trade, and hedge against currency risk — all in one platform for emerging markets.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
                <Link href="/waitlist">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-lg px-10 h-14 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105" data-testid="button-join-waitlist">
                    Join the Waitlist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/unlock-wallet">
                  <Button size="lg" variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-10 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" data-testid="button-try-demo">
                    Try Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
            </motion.div>

            {/* Mainnet Countdown Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="bg-gradient-to-r from-primary/10 via-blue-600/10 to-purple-600/10 border border-primary/20 rounded-lg px-4 py-3 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                  <span className="text-muted-foreground font-medium">
                    Mainnet Launch: <span className="text-primary font-semibold">July 7, 2026</span>
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-primary" data-testid="countdown-days">{timeLeft.days}</span>
                      <span className="text-xs text-muted-foreground">days</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-primary" data-testid="countdown-hours">{timeLeft.hours}</span>
                      <span className="text-xs text-muted-foreground">hrs</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-primary" data-testid="countdown-minutes">{timeLeft.minutes}</span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-primary" data-testid="countdown-seconds">{timeLeft.seconds}</span>
                      <span className="text-xs text-muted-foreground">sec</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built for How Trade Really Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              One platform. Three powerful tools. Everything your cross-border business needs to move faster and grow bigger.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Banknote,
                title: "Finance",
                description: "Get matched with global financiers who compete to fund your trade. No bank collateral needed — your goods and invoice are your security.",
                color: "text-primary"
              },
              {
                icon: Globe,
                title: "Pay",
                description: "Pay suppliers anywhere using stablecoins. Fast settlement, low fees, no currency barriers. Funds held in escrow until delivery is confirmed.",
                color: "text-primary"
              },
              {
                icon: TrendingUp,
                title: "Hedge",
                description: "Protect against currency risk with on-chain FX hedging. Buy protection as an importer or provide liquidity and earn premiums.",
                color: "text-primary"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-8 text-center hover:border-primary/50 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center mx-auto mb-5 ${item.color}`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get started in minutes with our simple onboarding process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {[
              {
                step: "01",
                title: "Create Your Wallet",
                description: "Set up your secure digital wallet in seconds. Your wallet is your identity on BlockFinaX — no banks, no paperwork."
              },
              {
                step: "02",
                title: "Finance, Pay, or Hedge",
                description: "Apply for trade financing, pay suppliers with stablecoins, or hedge against currency risk — all from one platform."
              },
              {
                step: "03",
                title: "Execute with Confidence",
                description: "Funds are held in smart contract escrow. Delivery is verified on-platform. Settlements happen automatically."
              }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-7xl font-bold text-primary/10 mb-6">{step.step}</div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 -right-6 text-primary/30">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transaction Flow Diagram */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How the Finance Marketplace Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We match businesses with qualified financiers who compete to fund your trade. Apply once, compare offers, and execute with confidence.
            </p>
          </div>

          <div className="relative">
            {/* Flow Steps */}
            <div className="space-y-8">
              {[
                {
                  icon: FileText,
                  title: "Apply",
                  description: "Submit your trade financing application with supporting documentation. No lengthy bank paperwork required.",
                  color: "text-blue-500"
                },
                {
                  icon: Users,
                  title: "Match",
                  description: "Our platform shares your application with qualified financiers who specialize in your trade corridor and commodity.",
                  color: "text-green-500"
                },
                {
                  icon: BarChart3,
                  title: "Compare Offers",
                  description: "Receive multiple competitive financing offers from global financiers. Compare rates, terms, and conditions side by side.",
                  color: "text-purple-500"
                },
                {
                  icon: Coins,
                  title: "Accept & Fund",
                  description: "Pick the best offer for your trade. Once accepted, funds are securely escrowed on-platform, protecting all parties.",
                  color: "text-orange-500"
                },
                {
                  icon: CheckCircle2,
                  title: "Deliver & Settle",
                  description: "Goods are shipped, delivery is verified on-platform, and payment is released automatically to the seller.",
                  color: "text-primary"
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.2, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative flex items-start gap-6"
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: i * 0.2 + 0.3, duration: 0.3 }}
                    viewport={{ once: true }}
                    className={`flex-shrink-0 w-16 h-16 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center ${step.color}`}
                  >
                    <step.icon className="h-8 w-8" />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>

                  {/* Connecting Line */}
                  {i < 4 && (
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: "100%" }}
                      transition={{ delay: i * 0.2 + 0.5, duration: 0.4 }}
                      viewport={{ once: true }}
                      className="absolute left-8 top-16 w-0.5 h-full bg-gradient-to-b from-primary/50 to-primary/20"
                    />
                  )}

                  {/* Animated Arrow */}
                  {i < 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: i * 0.2 + 0.8,
                        duration: 0.3,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      viewport={{ once: true }}
                      className="absolute left-7 top-20 text-primary/50"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              viewport={{ once: true }}
              className="mt-12 p-6 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Verifiable & Secure</h4>
                  <p className="text-sm text-muted-foreground">
                    Every transaction is recorded with complete transparency. Delivery verification, financing terms, and settlements are all tracked on-platform. All parties can verify status instantly, and records are tamper-proof.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-8">
                Why Choose BlockFinaX?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                The finance match marketplace built for importers, exporters, and financiers in emerging markets.
              </p>
              
              <div className="space-y-5">
                {[
                  "No bank collateral - Your goods and invoices are your security",
                  "Competitive offers - Multiple financiers bid on your trade",
                  "Fast settlements - Pay with stablecoins, settle in minutes",
                  "FX protection - Hedge against currency devaluation on-chain",
                  "Escrow security - Funds released only when delivery is confirmed",
                  "Lower costs - 1% platform fee vs 5-10% from traditional brokers"
                ].map((benefit, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground leading-relaxed">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  {[
                    { icon: Users, label: "Multi-Party Support" },
                    { icon: Zap, label: "Instant Execution" },
                    { icon: Shield, label: "Secure by Default" },
                    { icon: Globe, label: "Global Access" }
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border flex flex-col items-center justify-center text-center space-y-2 hover:scale-105 transition-transform"
                    >
                      <item.icon className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src={logoPath} alt="BlockFinaX" className="w-8 h-8" />
                <span className="text-xl font-bold">BlockFinaX</span>
              </div>
              <p className="text-muted-foreground mb-6">
                The trade finance marketplace where businesses pay, finance, and hedge — without bank barriers. Simple, secure, and transparent.
              </p>
              <div className="flex space-x-4 mb-4">
                <a href="https://x.com/blockfinax" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors group" data-testid="link-twitter">
                  <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
                <a href="https://www.linkedin.com/company/blockfinax/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors group" data-testid="link-linkedin">
                  <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center transition-colors group">
                  <Github className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/create-wallet" className="hover:text-primary transition-colors">Create Wallet</Link></li>
                <li><Link href="/unlock-wallet" className="hover:text-primary transition-colors">Sign In</Link></li>
                <li><Link href="/import-wallet" className="hover:text-primary transition-colors">Import Wallet</Link></li>
                <li><Link href="/website" className="hover:text-primary transition-colors">About</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Finance</li>
                <li>Pay</li>
                <li><Link href="/hedge" className="hover:text-primary transition-colors">Hedge</Link></li>
                <li>Escrow Protection</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:info@blockfinax.com" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><Link href="/website" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><a href="mailto:info@blockfinax.com" className="hover:text-primary transition-colors">Help Center</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; {new Date().getFullYear()} BlockFinaX. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground justify-center">
              <Link href="/website" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="/website" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="/website" className="hover:text-primary transition-colors">Cookie Policy</Link>
              <Link href="/website" className="hover:text-primary transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
