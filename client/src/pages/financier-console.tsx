import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  DollarSign,
  FileText,
  TrendingUp,
  Briefcase,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  ArrowLeft,
  Wallet,
  Building2,
  Globe,
  Package,
  BarChart3,
  Users,
  Landmark,
  HandCoins,
  CircleDollarSign,
  UserCheck,
  Download,
  Paperclip,
} from "lucide-react";
import { Link } from "wouter";

const FINANCING_TYPE_LABELS: Record<string, string> = {
  letter_of_credit: "Letter of Credit (LC)",
  bank_guarantee: "Bank Guarantee (BG)",
  invoice_discounting: "Invoice Discounting",
  invoice_factoring: "Invoice Factoring",
  supply_chain_finance: "Supply Chain Finance",
  pre_export_finance: "Pre-Export Finance",
  post_import_finance: "Post-Import Finance",
  trade_credit_insurance: "Trade Credit Insurance",
  forfaiting: "Forfaiting",
  documentary_collection: "Documentary Collection",
  warehouse_receipt_finance: "Warehouse Receipt Finance",
  purchase_order_finance: "Purchase Order Finance",
};

interface FinancierProfile {
  name: string;
  type: string;
  walletAddress: string;
}

function getFinancierProfile(): FinancierProfile | null {
  const stored = localStorage.getItem("financier_profile");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveFinancierProfile(profile: FinancierProfile) {
  localStorage.setItem("financier_profile", JSON.stringify(profile));
}

function getOfferStatusColor(status: string) {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "accepted": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "expired": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    case "withdrawn": return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400";
    default: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  }
}

function FinancierRegistration({ address, onRegistered }: { address: string; onRegistered: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const handleRegister = () => {
    if (!name || !type) return;
    saveFinancierProfile({ name, type, walletAddress: address });
    onRegistered();
  };

  return (
    <div className="min-h-screen bg-background/80 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 mx-auto mb-4">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">Financier Registration</CardTitle>
          <CardDescription className="mt-1.5">Set up your financier profile to start browsing and making offers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pb-8">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Financier Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Afreximbank, TDB Capital" className="rounded-xl border-white/10 h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Institution Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="rounded-xl border-white/10 h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="Trade Finance Fund">Trade Finance Fund</SelectItem>
                <SelectItem value="Family Office">Family Office</SelectItem>
                <SelectItem value="DFI">Development Finance Institution (DFI)</SelectItem>
                <SelectItem value="Institutional Investor">Institutional Investor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Wallet Address</Label>
            <Input value={address} disabled className="font-mono text-xs rounded-xl border-white/10 h-11 bg-white/5" />
          </div>
          <Button onClick={handleRegister} disabled={!name || !type} className="w-full rounded-xl h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            <UserCheck className="h-4 w-4 mr-2" /> Complete Registration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TreasuryPortal() {
  const { wallet, address } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  const [profile, setProfile] = useState<FinancierProfile | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [offerAmount, setOfferAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenorDays, setTenorDays] = useState("");
  const [fees, setFees] = useState("");
  const [conditions, setConditions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    setProfile(getFinancierProfile());
  }, []);

  const { data: applications = [], isLoading: appsLoading } = useQuery<any[]>({
    queryKey: ["/api/financing/applications"],
    queryFn: async () => {
      const res = await fetch("/api/financing/applications", { credentials: "include" });
      if (!res.ok) {
        const fallback = await fetch("/api/trade-finance/applications/all", { credentials: "include" });
        if (!fallback.ok) return [];
        return fallback.json();
      }
      return res.json();
    },
    enabled: !!wallet,
  });

  const { data: myOffers = [], isLoading: offersLoading } = useQuery<any[]>({
    queryKey: ["/api/financing/my-offers", address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/financing/my-offers/${address}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!address && !!profile,
  });

  const submitOfferMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !selectedApp) throw new Error("Missing profile or application");
      const expiryDate = expiresAt ? new Date(expiresAt).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      return await apiRequest("POST", "/api/financing/offers", {
        requestId: selectedApp.requestId || selectedApp.id,
        financierAddress: address,
        financierName: profile.name,
        financierType: profile.type,
        offerAmount: parseFloat(offerAmount),
        interestRate: parseFloat(interestRate),
        tenorDays: parseInt(tenorDays),
        fees: parseFloat(fees || "0"),
        conditions,
        expiresAt: expiryDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/my-offers", address] });
      queryClient.invalidateQueries({ queryKey: ["/api/financing/applications"] });
      toast({ title: "Offer Submitted", description: "Your financing offer has been submitted successfully." });
      resetOfferForm();
      setOfferDialogOpen(false);
      setSelectedApp(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit offer", variant: "destructive" });
    },
  });

  const withdrawOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      return await apiRequest("POST", `/api/financing/offers/${offerId}/withdraw`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/my-offers", address] });
      toast({ title: "Offer Withdrawn", description: "Your offer has been withdrawn." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to withdraw offer", variant: "destructive" });
    },
  });

  const resetOfferForm = () => {
    setOfferAmount("");
    setInterestRate("");
    setTenorDays("");
    setFees("");
    setConditions("");
    setExpiresAt("");
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background/80 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardContent className="pt-8 pb-8 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 mx-auto mb-5">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight mb-2">Wallet Required</h2>
            <p className="text-muted-foreground text-sm mb-6">Connect your wallet to access the Treasury portal</p>
            <Link href="/wallet">
              <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"><Wallet className="h-4 w-4 mr-2" /> Go to Wallet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return <FinancierRegistration address={address || ""} onRegistered={() => setProfile(getFinancierProfile())} />;
  }

  const openApps = applications.filter((a: any) =>
    ["pending_draft", "seller_approved", "draft_sent_to_seller"].includes(a.status)
  );
  const activeOffers = myOffers.filter((o: any) => o.status === "pending");
  const fundedDeals = myOffers.filter((o: any) => o.status === "accepted");
  const totalDeployed = fundedDeals.reduce((sum: number, o: any) => sum + parseFloat(o.offerAmount || "0"), 0);

  const filteredApps = openApps.filter((app: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (app.buyerCompanyName || "").toLowerCase().includes(q) ||
      (app.tradeDescription || "").toLowerCase().includes(q) ||
      (app.buyerCountry || "").toLowerCase().includes(q) ||
      (FINANCING_TYPE_LABELS[app.financingType] || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/wallet">
              <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Treasury</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Browse opportunities and submit competitive offers</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-medium border-primary/30">
              <Building2 className="h-3 w-3 mr-1" /> {profile.name}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-xs">{profile.type}</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard icon={<FileText className="h-4 w-4 text-blue-500" />} label="Open Applications" value={openApps.length} />
          <StatCard icon={<Send className="h-4 w-4 text-amber-500" />} label="My Active Offers" value={activeOffers.length} />
          <StatCard icon={<CheckCircle className="h-4 w-4 text-green-500" />} label="Funded Deals" value={fundedDeals.length} />
          <StatCard icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Total Deployed" value={`$${totalDeployed.toLocaleString()}`} sub="USDC" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-12 rounded-2xl bg-card/60 border border-white/10 p-1.5 backdrop-blur-sm flex-wrap sm:flex-nowrap gap-1">
            <TabsTrigger value="browse" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
              <Search className="h-4 w-4 mr-2" /> Browse
            </TabsTrigger>
            <TabsTrigger value="offers" className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
              <HandCoins className="h-4 w-4 mr-2" /> My Offers
            </TabsTrigger>
            <TabsTrigger value="funded" className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
              <Briefcase className="h-4 w-4 mr-2" /> Funded
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
              <BarChart3 className="h-4 w-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {selectedApp ? (
              <ApplicationDetailView
                app={selectedApp}
                onBack={() => setSelectedApp(null)}
                onMakeOffer={() => {
                  setTenorDays(String(selectedApp.requestedDuration || 90));
                  setOfferAmount(selectedApp.requestedAmount || "");
                  setOfferDialogOpen(true);
                }}
              />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by company, trade description, or country..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl border-white/10 bg-card/50 h-11"
                    />
                  </div>
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">{filteredApps.length} applications</Badge>
                </div>

                {appsLoading ? (
                  <div className="text-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground mt-2">Loading applications...</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
                    <CardContent className="pt-8 text-center py-16">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-4">
                        <FileText className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium">No open applications available</p>
                      <p className="text-sm text-muted-foreground mt-1">Check back later for new trade financing opportunities</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {filteredApps.map((app: any) => (
                      <ApplicationCard
                        key={app.requestId || app.id}
                        app={app}
                        onView={() => setSelectedApp(app)}
                        onMakeOffer={() => {
                          setSelectedApp(app);
                          setTenorDays(String(app.requestedDuration || 90));
                          setOfferAmount(app.requestedAmount || "");
                          setOfferDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers">
            <MyOffersTab offers={myOffers} isLoading={offersLoading} onWithdraw={(id) => withdrawOfferMutation.mutate(id)} withdrawPending={withdrawOfferMutation.isPending} />
          </TabsContent>

          <TabsContent value="funded">
            <FundedDealsTab deals={fundedDeals} />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab applications={applications} offers={myOffers} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><CircleDollarSign className="h-5 w-5 text-primary" /></span>
              Make Financing Offer
            </DialogTitle>
            <DialogDescription className="mt-1">
              Submit a competitive offer for {selectedApp?.buyerCompanyName || "this application"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApp && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm space-y-1.5">
                <p><span className="text-muted-foreground">Type:</span> {FINANCING_TYPE_LABELS[selectedApp.financingType] || "Letter of Credit"}</p>
                <p><span className="text-muted-foreground">Trade:</span> {selectedApp.tradeDescription?.substring(0, 80)}</p>
                <p><span className="text-muted-foreground">Requested:</span> ${parseFloat(selectedApp.requestedAmount || "0").toLocaleString()} USDC</p>
                <p><span className="text-muted-foreground">Duration:</span> {selectedApp.requestedDuration || 90} days</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Offer Amount (USDC) *</Label>
                <Input type="number" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder="100,000" className="rounded-xl border-white/10 h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Interest Rate (%) *</Label>
                <Input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="8.5" className="rounded-xl border-white/10 h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Tenor (days) *</Label>
                <Input type="number" value={tenorDays} onChange={(e) => setTenorDays(e.target.value)} placeholder="90" className="rounded-xl border-white/10 h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Fees (%)</Label>
                <Input type="number" step="0.1" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="1.0" className="rounded-xl border-white/10 h-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Offer Expiry Date</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded-xl border-white/10 h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Conditions & Notes</Label>
              <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Any conditions, requirements, or notes for the applicant..." rows={3} className="rounded-xl border-white/10 resize-none" />
            </div>
            {offerAmount && interestRate && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between"><span>Offer Amount</span><span className="font-semibold">${parseFloat(offerAmount).toLocaleString()} USDC</span></div>
                <div className="flex justify-between"><span>Interest ({interestRate}%)</span><span className="font-semibold">${(parseFloat(offerAmount) * parseFloat(interestRate) / 100 * (parseInt(tenorDays || "90") / 365)).toFixed(2)} USDC</span></div>
                {fees && parseFloat(fees) > 0 && (
                  <div className="flex justify-between"><span>Fees ({fees}%)</span><span className="font-semibold">${(parseFloat(offerAmount) * parseFloat(fees) / 100).toFixed(2)} USDC</span></div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setOfferDialogOpen(false); resetOfferForm(); }} className="rounded-xl border-white/20">Cancel</Button>
            <Button
              onClick={() => submitOfferMutation.mutate()}
              disabled={!offerAmount || !interestRate || !tenorDays || submitOfferMutation.isPending}
              className="rounded-xl shadow-lg shadow-primary/20"
            >
              {submitOfferMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4 mr-2" /> Submit Offer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="rounded-lg bg-white/10 p-1.5 border border-white/5 shrink-0">{icon}</div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function ApplicationCard({ app, onView, onMakeOffer }: { app: any; onView: () => void; onMakeOffer: () => void }) {
  return (
    <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:-translate-y-0.5 overflow-hidden">
      <CardContent className="pt-5 pb-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm tracking-tight">{app.buyerCompanyName || "Trade Application"}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{app.tradeDescription || "No description"}</p>
          </div>
          <Badge variant="outline" className="rounded-full shrink-0 text-xs border-emerald-500/30 text-emerald-400">
            {app.status === "seller_approved" ? "Verified" : "Open"}
          </Badge>
        </div>

        <Badge variant="secondary" className="rounded-lg text-[10px] w-fit">{FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"}</Badge>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>Requested: <span className="font-medium text-foreground tabular-nums">${parseFloat(app.requestedAmount || "0").toLocaleString()}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            <span>Trade: <span className="font-medium text-foreground tabular-nums">${parseFloat(app.tradeValue || "0").toLocaleString()}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{app.requestedDuration || 90} days</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span>{app.buyerCountry || "N/A"}</span>
          </div>
        </div>

        {app.sellerAddress && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3 w-3 shrink-0" />
            Seller: {app.sellerAddress.substring(0, 10)}...{app.sellerAddress.slice(-6)}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 rounded-xl border-white/20 hover:bg-white/5 h-9" onClick={onView}>
            <Eye className="h-3.5 w-3.5 mr-1.5" /> View
          </Button>
          <Button size="sm" className="flex-1 rounded-xl h-9 shadow-lg shadow-primary/20" onClick={onMakeOffer}>
            <CircleDollarSign className="h-3.5 w-3.5 mr-1.5" /> Make Offer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  proforma_invoice: "Proforma Invoice",
  sales_contract: "Sales Contract",
  bill_of_lading: "Bill of Lading",
  customs: "Customs Declaration",
  quality_cert: "Quality Certificate",
  invoice: "Invoice",
};

function ApplicationDetailView({ app, onBack, onMakeOffer }: { app: any; onBack: () => void; onMakeOffer: () => void }) {
  const requestId = app.requestId || app.id;
  const { data: documents = [], isLoading: docsLoading } = useQuery<any[]>({
    queryKey: ["/api/trade-finance", requestId, "documents"],
    queryFn: async () => {
      const res = await fetch(`/api/trade-finance/${requestId}/documents`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!requestId,
  });

  const handleDownload = (doc: any) => {
    const byteChars = atob(doc.storageKey);
    const byteArray = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteArray[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: doc.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl text-muted-foreground hover:bg-white/5">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
      </Button>

      <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold tracking-tight">{app.buyerCompanyName || "Trade Application"}</CardTitle>
                <CardDescription className="mt-0.5">Application ID: {app.requestId || app.id}</CardDescription>
              </div>
            </div>
            <Button onClick={onMakeOffer} className="rounded-xl shadow-lg shadow-primary/20">
              <CircleDollarSign className="h-4 w-4 mr-2" /> Make Offer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">Buyer / Importer Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Company" value={app.buyerCompanyName} />
              <InfoField label="Registration #" value={app.buyerRegistrationNumber} />
              <InfoField label="Country" value={app.buyerCountry} />
              <InfoField label="Contact Person" value={app.buyerContactPerson} />
              <InfoField label="Email" value={app.buyerEmail} />
              <InfoField label="Phone" value={app.buyerPhone} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Trade Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <InfoField label="Financing Type" value={FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"} />
              <div className="col-span-1 md:col-span-2">
                <InfoField label="Trade Description" value={app.tradeDescription} />
              </div>
              <InfoField label="Trade Value" value={`$${parseFloat(app.tradeValue || "0").toLocaleString()} USDC`} />
              <InfoField label="Requested Amount" value={`$${parseFloat(app.requestedAmount || "0").toLocaleString()} USDC`} />
              <InfoField label="Duration" value={`${app.requestedDuration || 90} days`} />
              <InfoField label="Collateral" value={app.collateralDescription} />
              <InfoField label="Collateral Value" value={app.collateralValue ? `$${parseFloat(app.collateralValue).toLocaleString()}` : "N/A"} />
              <InfoField label="Contract #" value={app.salesContractNumber} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Seller / Exporter</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoField label="Wallet Address" value={app.sellerAddress} mono />
              <InfoField label="Status" value={app.status === "seller_approved" ? "Seller Verified" : app.status?.replace(/_/g, " ")} />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Paperclip className="h-4 w-4" /> Uploaded Documents</h3>
            {docsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.fileName} · {(doc.fileSize / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} className="shrink-0 ml-2">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Financing Summary
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Coverage Ratio</p>
                <p className="font-semibold">
                  {app.tradeValue && app.requestedAmount
                    ? ((parseFloat(app.requestedAmount) / parseFloat(app.tradeValue)) * 100).toFixed(1)
                    : "0"}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Trade Value</p>
                <p className="font-semibold">${parseFloat(app.tradeValue || "0").toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Requested</p>
                <p className="font-semibold">${parseFloat(app.requestedAmount || "0").toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value || "N/A"}</p>
    </div>
  );
}

function MyOffersTab({ offers, isLoading, onWithdraw, withdrawPending }: { offers: any[]; isLoading: boolean; onWithdraw: (id: number) => void; withdrawPending: boolean }) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading offers...</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
        <CardContent className="pt-8 text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-4">
            <HandCoins className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No offers submitted yet</p>
          <p className="text-sm text-muted-foreground mt-1">Browse applications and submit competitive offers</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer: any) => (
        <Card key={offer.id} className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">Offer #{offer.id}</p>
                  <Badge className={getOfferStatusColor(offer.status)}>{offer.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Application: {offer.requestId}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium ml-1">${parseFloat(offer.offerAmount || "0").toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium ml-1">{offer.interestRate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tenor:</span>
                    <span className="font-medium ml-1">{offer.tenorDays} days</span>
                  </div>
                  {offer.fees && (
                    <div>
                      <span className="text-muted-foreground">Fees:</span>
                      <span className="font-medium ml-1">{offer.fees}%</span>
                    </div>
                  )}
                </div>
                {offer.conditions && (
                  <p className="text-xs text-muted-foreground mt-1">Conditions: {offer.conditions}</p>
                )}
                {offer.expiresAt && (
                  <p className="text-xs text-muted-foreground">Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>
                )}
              </div>
              {offer.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onWithdraw(offer.id)}
                  disabled={withdrawPending}
                  className="rounded-xl text-red-500 hover:text-red-400 border-red-500/30 hover:border-red-500/50"
                >
                  {withdrawPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                  Withdraw
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FundedDealsTab({ deals }: { deals: any[] }) {
  if (deals.length === 0) {
    return (
      <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
        <CardContent className="pt-8 text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 mx-auto mb-4">
            <Briefcase className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No funded deals yet</p>
          <p className="text-sm text-muted-foreground mt-1">Accepted offers will appear here</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {deals.map((deal: any) => (
        <Card key={deal.id} className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden"><CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sm">Deal #{deal.id} - {deal.requestId}</p>
              <p className="text-xs text-muted-foreground">Funded: ${parseFloat(deal.offerAmount || "0").toLocaleString()} USDC</p>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" /> Funded</Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div><span className="text-muted-foreground">Rate</span><p className="font-medium">{deal.interestRate}%</p></div>
            <div><span className="text-muted-foreground">Tenor</span><p className="font-medium">{deal.tenorDays} days</p></div>
            <div><span className="text-muted-foreground">Return</span><p className="font-medium text-green-600">${(parseFloat(deal.offerAmount || "0") * parseFloat(deal.interestRate || "0") / 100 * (parseInt(deal.tenorDays || "90") / 365)).toFixed(2)}</p></div>
          </div>
          <Separator className="my-3" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Delivery: Tracking</span>
            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Payment: Pending</span>
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}

function AnalyticsTab({ applications, offers }: { applications: any[]; offers: any[] }) {
  const totalApps = applications.length;
  const funded = offers.filter((o: any) => o.status === "accepted").length;
  const avgDealSize = funded > 0
    ? offers.filter((o: any) => o.status === "accepted").reduce((s: number, o: any) => s + parseFloat(o.offerAmount || "0"), 0) / funded
    : 0;
  const totalVolume = applications.reduce((s: number, a: any) => s + parseFloat(a.requestedAmount || "0"), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden"><CardContent className="pt-5 pb-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Applications</p><p className="text-2xl font-bold tracking-tight tabular-nums">{totalApps}</p></CardContent></Card>
        <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden"><CardContent className="pt-5 pb-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Funded</p><p className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">{funded}</p></CardContent></Card>
        <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden"><CardContent className="pt-5 pb-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Deal Size</p><p className="text-2xl font-bold tracking-tight tabular-nums">${avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></CardContent></Card>
        <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden"><CardContent className="pt-5 pb-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Platform Volume</p><p className="text-2xl font-bold tracking-tight tabular-nums">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p className="text-xs text-muted-foreground">USDC</p></CardContent></Card>
      </div>

      <Card className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"><BarChart3 className="h-4 w-4 text-primary" /></span>
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnalyticRow label="Funding Rate" value={totalApps > 0 ? `${((funded / totalApps) * 100).toFixed(1)}%` : "0%"} description="Percentage of applications that received funding" />
            <AnalyticRow label="Default Rate" value="0.0%" description="Current portfolio default rate" />
            <AnalyticRow label="Avg Interest Rate" value={
              offers.length > 0
                ? `${(offers.reduce((s: number, o: any) => s + parseFloat(o.interestRate || "0"), 0) / offers.length).toFixed(1)}%`
                : "N/A"
            } description="Average interest rate across all offers" />
            <AnalyticRow label="My Offers" value={String(offers.length)} description="Total offers you have submitted" />
            <AnalyticRow label="Success Rate" value={
              offers.length > 0
                ? `${((offers.filter((o: any) => o.status === "accepted").length / offers.length) * 100).toFixed(1)}%`
                : "N/A"
            } description="Percentage of your offers that were accepted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticRow({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}