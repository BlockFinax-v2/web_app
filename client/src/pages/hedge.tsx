import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { queryClient, apiRequest } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, TrendingUp, DollarSign, Clock, AlertTriangle, CheckCircle2, 
  Plus, ArrowLeft, Wallet, BarChart3, Users, Lock, Unlock, Award,
  Activity, PieChart, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import type { HedgeEvent, HedgePosition, HedgeLpDeposit } from "@shared/schema";
import { usdcManager } from "@/lib/usdc-manager";
import { walletManager } from "@/lib/wallet";

type EventWithStats = HedgeEvent & {
  poolStats?: {
    totalLiquidity: number;
    totalExposure: number;
    totalPremiums: number;
    utilization: number;
    availableCapacity: number;
    lpCount: number;
    hedgerCount: number;
  };
};

export default function Hedge() {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hedger");
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [notional, setNotional] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [settlementPrice, setSettlementPrice] = useState("");

  const [newEvent, setNewEvent] = useState({
    name: "", description: "", underlying: "USD/GHS",
    strike: "", premiumRate: "", payoutRate: "", safetyFactor: "0.80",
    expiryDays: "30"
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithStats[]>({
    queryKey: ["/api/hedge/events"],
  });

  const { data: myPositions = [] } = useQuery<HedgePosition[]>({
    queryKey: ["/api/hedge/positions", wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => fetch(`/api/hedge/positions/${wallet?.address}`).then(r => r.json()),
  });

  const { data: treasuryAddress } = useQuery<{ address: string }>({
    queryKey: ["/api/hedge/treasury-address"],
  });


  type FXRate = { pair: string; rate: number; source: string; timestamp: number; lastUpdated: string };
  const { data: fxData } = useQuery<{ rates: Record<string, FXRate>; pairs: string[] }>({
    queryKey: ["/api/fx/rates"],
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: myDeposits = [] } = useQuery<HedgeLpDeposit[]>({
    queryKey: ["/api/hedge/deposits", wallet?.address],
    enabled: !!wallet?.address,
    queryFn: () => fetch(`/api/hedge/deposits/${wallet?.address}`).then(r => r.json()),
  });

  const fetchEventDetails = async (id: number) => {
    const res = await fetch(`/api/hedge/events/${id}`);
    const data = await res.json();
    setSelectedEvent(data);
    return data;
  };

  const buyProtectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !treasuryAddress?.address) throw new Error("Treasury wallet not available");
      const signer = await walletManager.getSigner();
      if (!signer) throw new Error("Wallet signer not available. Please unlock your wallet.");

      const premium = parseFloat(notional) * parseFloat(selectedEvent.premiumRate);
      const premiumStr = premium.toFixed(6);

      const txHash = await usdcManager.transferUSDC(
        signer, treasuryAddress.address, premiumStr, 84532
      );

      return await apiRequest("POST", "/api/hedge/positions", {
        eventId: selectedEvent.id,
        hedgerWallet: wallet?.address,
        notional: parseFloat(notional),
        txHash
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/positions", wallet?.address] });
      if (selectedEvent) await fetchEventDetails(selectedEvent.id);
      toast({ title: "Protection Purchased", description: `Notional: $${parseFloat(notional).toLocaleString()} — Premium paid to treasury` });
      setBuyDialogOpen(false);
      setNotional("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to buy protection", variant: "destructive" });
    }
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent) throw new Error("No event selected");
      if (!treasuryAddress?.address) throw new Error("Treasury wallet not available");
      if (!wallet?.address) throw new Error("Wallet not connected");
      const signer = await walletManager.getSigner();
      if (!signer) throw new Error("Wallet signer not available. Please unlock your wallet.");

      const txHash = await usdcManager.transferUSDC(
        signer, treasuryAddress.address, depositAmount, 84532
      );

      const result = await apiRequest("POST", "/api/hedge/deposits", {
        eventId: selectedEvent.id,
        lpWallet: wallet.address,
        amount: parseFloat(depositAmount),
        txHash
      });
      return result;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/deposits", wallet?.address] });
      if (selectedEvent) await fetchEventDetails(selectedEvent.id);
      toast({ title: "Liquidity Deposited", description: `$${parseFloat(depositAmount).toLocaleString()} USDC sent to treasury pool` });
      setDepositDialogOpen(false);
      setDepositAmount("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to deposit", variant: "destructive" });
    }
  });


  const createEventMutation = useMutation({
    mutationFn: async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(newEvent.expiryDays));
      return await apiRequest("POST", "/api/hedge/events", {
        ...newEvent,
        strike: parseFloat(newEvent.strike),
        premiumRate: parseFloat(newEvent.premiumRate) / 100,
        payoutRate: parseFloat(newEvent.payoutRate) / 100,
        safetyFactor: parseFloat(newEvent.safetyFactor),
        expiryDate: expiryDate.toISOString(),
        createdBy: wallet?.address
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/events"] });
      toast({ title: "Event Created", description: "New hedge event is now open" });
      setCreateEventDialogOpen(false);
      setNewEvent({ name: "", description: "", underlying: "USD/GHS", strike: "", premiumRate: "", payoutRate: "", safetyFactor: "0.80", expiryDays: "30" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create event", variant: "destructive" });
    }
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/hedge/events/${selectedEvent?.id}/settle`, {
        settlementPrice: parseFloat(settlementPrice),
        settlerAddress: wallet?.address
      });
    },
    onSuccess: async (res: any) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/positions", wallet?.address] });
      if (selectedEvent) await fetchEventDetails(selectedEvent.id);
      toast({ title: "Event Settled", description: data.message });
      setSettleDialogOpen(false);
      setSettlementPrice("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to settle", variant: "destructive" });
    }
  });

  const claimMutation = useMutation({
    mutationFn: async (positionId: number) => {
      return await apiRequest("POST", `/api/hedge/positions/${positionId}/claim`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/positions", wallet?.address] });
      toast({ title: "Payout Claimed", description: "Funds have been credited" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to claim", variant: "destructive" });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (depositId: number) => {
      return await apiRequest("POST", `/api/hedge/deposits/${depositId}/withdraw`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/deposits", wallet?.address] });
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/events"] });
      toast({ title: "Liquidity Withdrawn", description: "Funds returned to your wallet" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to withdraw", variant: "destructive" });
    }
  });

  const claimPremiumsMutation = useMutation({
    mutationFn: async (depositId: number) => {
      return await apiRequest("POST", `/api/hedge/deposits/${depositId}/claim-premiums`, {
        callerAddress: wallet?.address
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hedge/deposits", wallet?.address] });
      toast({ title: "Premiums Claimed", description: data.message || `Premiums sent to your wallet` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to claim premiums", variant: "destructive" });
    }
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">Connect your wallet to access P2P Hedge</p>
            <Link href="/wallet">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Wallet className="h-4 w-4 mr-2" /> Go to Wallet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const premiumCalc = selectedEvent && notional ? parseFloat(notional) * parseFloat(selectedEvent.premiumRate) : 0;
  const payoutCalc = selectedEvent && notional ? parseFloat(notional) * parseFloat(selectedEvent.payoutRate) : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/wallet">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">P2P Trade Hedge</h1>
              <p className="text-xs text-muted-foreground">FX Devaluation Protection for Importers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCreateEventDialogOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-xs text-muted-foreground">Active Events</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{events.filter(e => e.status === "open").length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">My Positions</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{myPositions.filter(p => p.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">My LP Deposits</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${myDeposits.filter(d => !d.withdrawn).reduce((s, d) => s + parseFloat(d.amount), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Premiums Earned</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${myDeposits.reduce((s, d) => s + parseFloat(d.premiumsEarned || "0"), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {fxData && Object.keys(fxData.rates).length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold text-foreground">Live FX Oracle</span>
                <span className="text-xs text-muted-foreground/70 ml-auto">
                  Source: {Object.values(fxData.rates)[0]?.source} | Updated: {new Date(Object.values(fxData.rates)[0]?.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.values(fxData.rates).map(r => (
                  <div key={r.pair} className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{r.pair}</span>
                    <span className="text-sm font-bold text-foreground">{r.rate.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="hedger" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4 mr-2" /> Buy Protection
            </TabsTrigger>
            <TabsTrigger value="provider" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-4 w-4 mr-2" /> Provide Liquidity
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-4 w-4 mr-2" /> My Positions
            </TabsTrigger>
          </TabsList>

          {/* HEDGER TAB */}
          <TabsContent value="hedger" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsLoading ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">Loading events...</div>
              ) : events.filter(e => e.status === "open").length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active hedge events available</p>
                  <p className="text-muted-foreground/70 text-sm mt-1">Create an event to get started</p>
                </div>
              ) : events.filter(e => e.status === "open").map(event => (
                <Card key={event.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={async () => { await fetchEventDetails(event.id); setBuyDialogOpen(true); }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Open</Badge>
                      <span className="text-xs text-muted-foreground/70">#{event.id}</span>
                    </div>
                    <CardTitle className="text-foreground text-lg mt-2">{event.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{event.underlying} Protection</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Strike</p>
                        <p className="text-sm font-bold text-foreground">{parseFloat(event.strike).toFixed(2)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Premium</p>
                        <p className="text-sm font-bold text-primary">{(parseFloat(event.premiumRate) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Max Payout</p>
                        <p className="text-sm font-bold text-green-400">{(parseFloat(event.payoutRate) * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Expires</p>
                        <p className="text-sm font-bold text-foreground">
                          {Math.max(0, Math.ceil((new Date(event.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                        </p>
                      </div>
                    </div>
                    {fxData?.rates[event.underlying] && (
                      <div className={`rounded-lg p-2.5 flex items-center justify-between ${
                        fxData.rates[event.underlying].rate >= parseFloat(event.strike)
                          ? "bg-red-500/10 border border-red-500/30"
                          : "bg-green-500/10 border border-green-500/30"
                      }`}>
                        <div>
                          <p className="text-xs text-muted-foreground/70">Live Spot Rate</p>
                          <p className="text-sm font-bold text-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3 text-green-400" />
                            {fxData.rates[event.underlying].rate.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground/70">vs Strike</p>
                          <p className={`text-sm font-bold ${fxData.rates[event.underlying].rate >= parseFloat(event.strike) ? "text-red-400" : "text-green-400"}`}>
                            {fxData.rates[event.underlying].rate >= parseFloat(event.strike) ? "IN THE MONEY" : "Safe"}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground/70">Pool Liquidity</p>
                        <p className="text-sm font-bold text-primary">${(event.poolStats?.totalLiquidity || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground/70">Available</p>
                        <p className="text-sm font-bold text-green-400">${(event.poolStats?.availableCapacity || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      Buy Protection
                    </Button>
                    {event.createdBy === wallet?.address && (
                      <Button variant="outline" size="sm" className="w-full mt-2 border-border text-muted-foreground hover:text-foreground"
                        onClick={async (e) => { e.stopPropagation(); await fetchEventDetails(event.id); setSettleDialogOpen(true); }}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Settle Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* LIQUIDITY PROVIDER TAB */}
          <TabsContent value="provider" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsLoading ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">Loading events...</div>
              ) : events.filter(e => e.status === "open").length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No pools available for deposits</p>
                </div>
              ) : events.filter(e => e.status === "open").map(event => (
                <Card key={event.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={async () => { await fetchEventDetails(event.id); setDepositDialogOpen(true); }}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-primary/20 text-primary border-primary/30">Pool Open</Badge>
                      <span className="text-xs text-muted-foreground/70">#{event.id}</span>
                    </div>
                    <CardTitle className="text-foreground text-lg mt-2">{event.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">Earn premiums from {event.underlying} hedgers</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Premium Rate</p>
                        <p className="text-sm font-bold text-green-400">{(parseFloat(event.premiumRate) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Risk (Payout)</p>
                        <p className="text-sm font-bold text-red-400">{(parseFloat(event.payoutRate) * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Safety Factor</p>
                        <p className="text-sm font-bold text-foreground">{(parseFloat(event.safetyFactor || "0.8") * 100).toFixed(0)}%</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground/70">Expires</p>
                        <p className="text-sm font-bold text-foreground">
                          {Math.max(0, Math.ceil((new Date(event.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                        </p>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground/70">Pool Liquidity</p>
                        <p className="text-sm font-bold text-primary">${(event.poolStats?.totalLiquidity || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground/70">LPs / Hedgers</p>
                        <p className="text-sm font-bold text-foreground">{event.poolStats?.lpCount || 0} / {event.poolStats?.hedgerCount || 0}</p>
                      </div>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      <DollarSign className="h-4 w-4 mr-1" /> Deposit Liquidity
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {treasuryAddress && (
              <Card className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>Treasury Pool Wallet:</span>
                    <code className="text-xs bg-muted/50 px-2 py-0.5 rounded text-foreground">
                      {treasuryAddress.address.slice(0, 6)}...{treasuryAddress.address.slice(-4)}
                    </code>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My LP Deposits */}
            {myDeposits.length > 0 && (
              <Card className="bg-card border-border mt-6">
                <CardHeader>
                  <CardTitle className="text-foreground text-base">My LP Deposits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {myDeposits.map(dep => {
                      const earned = parseFloat(dep.premiumsEarned || "0");
                      const claimed = parseFloat(dep.premiumsWithdrawn || "0");
                      const claimable = earned - claimed;
                      const depEvent = events.find(e => e.id === dep.eventId);
                      const isEventOpen = depEvent?.status === "open";
                      return (
                        <div key={dep.id} className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm text-foreground font-medium">Event #{dep.eventId}</p>
                              {isEventOpen && <p className="text-xs text-yellow-500">Locked until contract expires</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              {dep.withdrawn ? (
                                <Badge className="bg-muted text-muted-foreground">Withdrawn</Badge>
                              ) : isEventOpen ? (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                  <Lock className="h-3 w-3 mr-1" /> Locked
                                </Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:text-foreground"
                                  onClick={() => withdrawMutation.mutate(dep.id)}
                                  disabled={withdrawMutation.isPending}>
                                  <Unlock className="h-3 w-3 mr-1" /> Withdraw Liquidity
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Deposited: ${parseFloat(dep.amount).toLocaleString()} | 
                            Shares: {parseFloat(dep.shares).toFixed(4)}
                          </p>
                          <div className="flex items-center justify-between bg-background/50 rounded px-3 py-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Premiums Earned: <span className="text-green-400 font-medium">${earned.toFixed(2)}</span></p>
                              {claimed > 0 && <p className="text-xs text-muted-foreground">Already Claimed: ${claimed.toFixed(2)}</p>}
                              {claimable > 0 && <p className="text-xs text-primary font-medium">Claimable: ${claimable.toFixed(2)}</p>}
                            </div>
                            {claimable > 0 && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => claimPremiumsMutation.mutate(dep.id)}
                                disabled={claimPremiumsMutation.isPending}>
                                <DollarSign className="h-3 w-3 mr-1" />
                                {claimPremiumsMutation.isPending ? "Claiming..." : `Claim $${claimable.toFixed(2)}`}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MY POSITIONS TAB */}
          <TabsContent value="positions" className="space-y-4">
            {myPositions.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No positions yet</p>
                <p className="text-muted-foreground/70 text-sm mt-1">Buy protection on an active event to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPositions.map(pos => (
                  <Card key={pos.id} className="bg-card border-border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Position #{pos.id}</span>
                          <span className="text-xs text-muted-foreground/70">Event #{pos.eventId}</span>
                        </div>
                        <Badge className={
                          pos.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                          pos.status === "settled_win" ? "bg-primary/20 text-primary border-primary/30" :
                          pos.status === "claimed" ? "bg-primary/20 text-primary border-primary/30" :
                          "bg-muted/50 text-muted-foreground border-border"
                        }>
                          {pos.status === "active" ? "Active" :
                           pos.status === "settled_win" ? "Payout Available" :
                           pos.status === "settled_loss" ? "Expired" :
                           pos.status === "claimed" ? "Claimed" : pos.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground/70">Notional</p>
                          <p className="text-sm font-bold text-foreground">${parseFloat(pos.notional).toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground/70">Premium Paid</p>
                          <p className="text-sm font-bold text-primary">${parseFloat(pos.premiumPaid).toFixed(2)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground/70">Max Payout</p>
                          <p className="text-sm font-bold text-green-400">${parseFloat(pos.maxPayout).toFixed(2)}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground/70">Payout</p>
                          <p className="text-sm font-bold text-foreground">
                            {pos.payoutAmount ? `$${parseFloat(pos.payoutAmount).toFixed(2)}` : "—"}
                          </p>
                        </div>
                      </div>
                      {pos.status === "settled_win" && !pos.claimed && (
                        <Button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => claimMutation.mutate(pos.id)}
                          disabled={claimMutation.isPending}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Claim ${parseFloat(pos.payoutAmount || "0").toFixed(2)}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Settled Events Section */}
            {events.filter(e => e.status === "settled" || e.status === "expired").length > 0 && (
              <Card className="bg-card border-border mt-6">
                <CardHeader>
                  <CardTitle className="text-foreground text-base">Settled Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {events.filter(e => e.status === "settled" || e.status === "expired").map(event => (
                      <div key={event.id} className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-foreground font-medium">{event.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Strike: {parseFloat(event.strike).toFixed(2)} | 
                            Settlement: {event.settlementPrice ? parseFloat(event.settlementPrice).toFixed(2) : "N/A"}
                          </p>
                        </div>
                        <Badge className={event.triggered ? "bg-red-500/20 text-red-400" : "bg-muted/50 text-muted-foreground"}>
                          {event.triggered ? "Triggered" : "Not Triggered"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* BUY PROTECTION DIALOG */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Buy FX Protection
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedEvent?.name} — {selectedEvent?.underlying}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground/70">Strike Price</p>
                  <p className="text-lg font-bold text-foreground">{parseFloat(selectedEvent.strike).toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground/70">Expires In</p>
                  <p className="text-lg font-bold text-foreground">
                    {Math.max(0, Math.ceil((new Date(selectedEvent.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                  </p>
                </div>
              </div>

              {selectedEvent.poolStats && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Pool Utilization</span>
                    <span>{selectedEvent.poolStats.utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(selectedEvent.poolStats.utilization, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Available: ${selectedEvent.poolStats.availableCapacity.toLocaleString()} | Pool: ${selectedEvent.poolStats.totalLiquidity.toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Coverage Amount (USD)</Label>
                <Input
                  type="number" min="10" step="1" placeholder="e.g. 100"
                  value={notional} onChange={e => setNotional(e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">Minimum $10</p>
              </div>

              {notional && parseFloat(notional) >= 10 && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Premium ({(parseFloat(selectedEvent.premiumRate) * 100).toFixed(1)}%)</span>
                    <span className="text-sm font-bold text-primary">${premiumCalc.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Payout ({(parseFloat(selectedEvent.payoutRate) * 100).toFixed(0)}%)</span>
                    <span className="text-sm font-bold text-green-400">${payoutCalc.toFixed(2)}</span>
                  </div>
                  <hr className="border-border" />
                  <p className="text-xs text-muted-foreground">
                    If {selectedEvent.underlying} ≥ {parseFloat(selectedEvent.strike).toFixed(2)} at expiry, you receive ${payoutCalc.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
            <Button onClick={() => buyProtectionMutation.mutate()}
              disabled={!notional || parseFloat(notional) < 10 || buyProtectionMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {buyProtectionMutation.isPending ? "Processing..." : `Pay $${premiumCalc.toFixed(2)} Premium`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DEPOSIT LIQUIDITY DIALOG */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Deposit Liquidity
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedEvent?.name} — Earn premiums from hedgers
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.poolStats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground/70">Total Pool</p>
                    <p className="text-lg font-bold text-foreground">${selectedEvent.poolStats.totalLiquidity.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground/70">Utilization</p>
                    <p className="text-lg font-bold text-foreground">{selectedEvent.poolStats.utilization.toFixed(1)}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground/70">Premiums Collected</p>
                    <p className="text-lg font-bold text-green-400">${selectedEvent.poolStats.totalPremiums.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground/70">LPs / Hedgers</p>
                    <p className="text-lg font-bold text-foreground">{selectedEvent.poolStats.lpCount} / {selectedEvent.poolStats.hedgerCount}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Deposit Amount (USDC)</Label>
                <Input
                  type="number" min="10" step="1" placeholder="e.g. 500"
                  value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                  className="bg-muted border-border text-foreground mt-1"
                />
                <p className="text-xs text-muted-foreground/70 mt-1">Minimum $10</p>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 inline mr-1 text-yellow-400" />
                  Risk: If the event triggers, your deposit may be used to pay hedgers (up to {(parseFloat(selectedEvent.payoutRate) * 100).toFixed(0)}% of covered notional).
                </p>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-400" />
                  Reward: You earn a share of all premiums paid by hedgers proportional to your deposit.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositDialogOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
            <Button onClick={() => depositMutation.mutate()}
              disabled={!depositAmount || parseFloat(depositAmount) < 10 || depositMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {depositMutation.isPending ? "Depositing..." : `Deposit $${depositAmount || "0"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE EVENT DIALOG */}
      <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Hedge Event
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set up a new FX devaluation protection event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-muted-foreground">Event Name</Label>
              <Input value={newEvent.name} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. USD/GHS 30-Day Protection" className="bg-muted border-border text-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Description (optional)</Label>
              <Textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                placeholder="Details about this hedge event" className="bg-muted border-border text-foreground mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">Currency Pair</Label>
                <Select value={newEvent.underlying} onValueChange={v => setNewEvent(p => ({ ...p, underlying: v }))}>
                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="USD/GHS">USD/GHS</SelectItem>
                    <SelectItem value="USD/NGN">USD/NGN</SelectItem>
                    <SelectItem value="USD/KES">USD/KES</SelectItem>
                    <SelectItem value="USD/ZAR">USD/ZAR</SelectItem>
                    <SelectItem value="USD/XOF">USD/XOF</SelectItem>
                    <SelectItem value="EUR/GHS">EUR/GHS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Strike Price</Label>
                <Input type="number" step="0.01" value={newEvent.strike}
                  onChange={e => setNewEvent(p => ({ ...p, strike: e.target.value }))}
                  placeholder="e.g. 16.00" className="bg-muted border-border text-foreground mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-muted-foreground">Premium (%)</Label>
                <Input type="number" step="0.1" value={newEvent.premiumRate}
                  onChange={e => setNewEvent(p => ({ ...p, premiumRate: e.target.value }))}
                  placeholder="e.g. 2.5" className="bg-muted border-border text-foreground mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Payout (%)</Label>
                <Input type="number" step="1" value={newEvent.payoutRate}
                  onChange={e => setNewEvent(p => ({ ...p, payoutRate: e.target.value }))}
                  placeholder="e.g. 10" className="bg-muted border-border text-foreground mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Duration (days)</Label>
                <Input type="number" step="1" value={newEvent.expiryDays}
                  onChange={e => setNewEvent(p => ({ ...p, expiryDays: e.target.value }))}
                  placeholder="e.g. 30" className="bg-muted border-border text-foreground mt-1" />
              </div>
            </div>

            {newEvent.strike && newEvent.premiumRate && newEvent.payoutRate && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Example: $10,000 hedge</p>
                <p className="text-xs text-muted-foreground">
                  Premium: ${(10000 * parseFloat(newEvent.premiumRate) / 100).toFixed(2)} | 
                  Payout if triggered: ${(10000 * parseFloat(newEvent.payoutRate) / 100).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Triggers if {newEvent.underlying} ≥ {parseFloat(newEvent.strike).toFixed(2)} at expiry ({newEvent.expiryDays} days)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateEventDialogOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
            <Button onClick={() => createEventMutation.mutate()}
              disabled={!newEvent.name || !newEvent.strike || !newEvent.premiumRate || !newEvent.payoutRate || createEventMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createEventMutation.isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SETTLE EVENT DIALOG */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Settle Event
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Post the final FX rate for {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground/70">Strike Price</p>
                <p className="text-lg font-bold text-foreground">{parseFloat(selectedEvent.strike).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  If settlement price ≥ {parseFloat(selectedEvent.strike).toFixed(2)}, hedgers get paid
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Settlement FX Rate</Label>
                <Input type="number" step="0.01" value={settlementPrice}
                  onChange={e => setSettlementPrice(e.target.value)}
                  placeholder={`Current ${selectedEvent.underlying} rate`}
                  className="bg-muted border-border text-foreground mt-1" />
                {fxData?.rates[selectedEvent.underlying] && (
                  <Button variant="outline" size="sm" className="mt-2 border-primary/30 text-primary text-xs"
                    onClick={() => setSettlementPrice(fxData.rates[selectedEvent.underlying].rate.toFixed(4))}>
                    <Activity className="h-3 w-3 mr-1" /> Use Live Oracle Rate: {fxData.rates[selectedEvent.underlying].rate.toFixed(4)}
                  </Button>
                )}
              </div>
              {settlementPrice && (
                <div className={`rounded-lg p-3 ${parseFloat(settlementPrice) >= parseFloat(selectedEvent.strike) ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                  <p className="text-sm font-medium">
                    {parseFloat(settlementPrice) >= parseFloat(selectedEvent.strike)
                      ? "⚠️ Protection TRIGGERED — Hedgers will receive payouts"
                      : "✓ Protection NOT triggered — Positions expire worthless"}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettleDialogOpen(false)} className="border-border text-muted-foreground">Cancel</Button>
            <Button onClick={() => settleMutation.mutate()}
              disabled={!settlementPrice || settleMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {settleMutation.isPending ? "Settling..." : "Settle Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}