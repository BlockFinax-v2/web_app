import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Shield, TrendingUp, DollarSign, Plus, ArrowLeft, Wallet, BarChart3, 
  Award, Activity
} from "lucide-react";
import { Link } from "wouter";

// Modular Components
import { HedgerTab } from "@/components/hedge/HedgerTab";
import { ProviderTab } from "@/components/hedge/ProviderTab";
import { PositionsTab } from "@/components/hedge/PositionsTab";
import { BuyProtectionDialog } from "@/components/hedge/dialogs/BuyProtectionDialog";
import { DepositLiquidityDialog } from "@/components/hedge/dialogs/DepositLiquidityDialog";
import { CreateEventDialog } from "@/components/hedge/dialogs/CreateEventDialog";
import { SettleEventDialog } from "@/components/hedge/dialogs/SettleEventDialog";
import { EventWithStats, FXData, NewEventState } from "@/components/hedge/types";

// ---- Dummy types (formerly from @shared/schema) ----
type HedgePosition = { id: number; status: string; notional: string; eventId: number; };
type HedgeLpDeposit = { id: number; amount: string; withdrawn: boolean; premiumsEarned?: string; eventId: number; };

// ---- Dummy data ----
const DUMMY_EVENTS: EventWithStats[] = [
  { id: 1, name: "USD/GHS Q1 Protection", status: "open", premiumRate: "0.05", payoutRate: "0.80", underlying: "USD/GHS", strike: "12.50", expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(), totalNotional: 250000, totalDeposited: 120000 } as any,
  { id: 2, name: "USD/NGN Q1 Protection", status: "open", premiumRate: "0.04", payoutRate: "0.75", underlying: "USD/NGN", strike: "1600", expiryDate: new Date(Date.now() + 45 * 86400000).toISOString(), totalNotional: 180000, totalDeposited: 90000 } as any,
];
const DUMMY_FX: FXData = { rates: { "USD/GHS": { pair: "USD/GHS", rate: 12.48, source: "Oracle" } as any, "USD/NGN": { pair: "USD/NGN", rate: 1598.5, source: "Oracle" } as any }, pairs: ["USD/GHS", "USD/NGN"] };
// ---- End dummy data ----


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

  const [newEvent, setNewEvent] = useState<NewEventState>({
    name: "", description: "", underlying: "USD/GHS",
    strike: "", premiumRate: "", payoutRate: "", safetyFactor: "0.80",
    expiryDays: "30"
  });

  const events: EventWithStats[] = DUMMY_EVENTS;
  const eventsLoading = false;
  const myPositions: HedgePosition[] = [];
  const treasuryAddress = { address: '0xTreasury...Demo' };
  const fxData: FXData = DUMMY_FX;
  const myDeposits: HedgeLpDeposit[] = [];

  const fetchEventDetails = (id: number) => {
    const event = DUMMY_EVENTS.find(e => e.id === id) || null;
    setSelectedEvent(event);
    return Promise.resolve(event);
  };

  const makeDummyMutation = (title: string, description: string, cleanup?: () => void) => ({
    mutate: () => { setTimeout(() => { toast({ title, description }); cleanup?.(); }, 800); },
    isPending: false,
  });

  const buyProtectionMutation = makeDummyMutation("Protection Purchased (Demo)", `Notional: $${parseFloat(notional || '0').toLocaleString()}`, () => { setBuyDialogOpen(false); setNotional(''); });
  const depositMutation = makeDummyMutation("Liquidity Deposited (Demo)", `$${parseFloat(depositAmount || '0').toLocaleString()} USDC`, () => { setDepositDialogOpen(false); setDepositAmount(''); });
  const createEventMutation = makeDummyMutation("Event Created (Demo)", "New hedge event simulated", () => setCreateEventDialogOpen(false));
  const settleMutation = makeDummyMutation("Event Settled (Demo)", "Settlement simulated", () => { setSettleDialogOpen(false); setSettlementPrice(''); });
  const claimMutation = { mutate: (_id: number) => toast({ title: "Payout Claimed (Demo)" }), isPending: false };
  const withdrawMutation = { mutate: (_id: number) => toast({ title: "Liquidity Withdrawn (Demo)" }), isPending: false };
  const claimPremiumsMutation = { mutate: (_id: number) => toast({ title: "Premiums Claimed (Demo)" }), isPending: false };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">Connect your wallet to access P2P Hedge</p>
            <Link href="/wallet"><Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><Wallet className="h-4 w-4 mr-2" /> Go to Wallet</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const premiumCalc = selectedEvent && notional ? parseFloat(notional) * parseFloat(selectedEvent.premiumRate) : 0;
  const payoutCalc = selectedEvent && notional ? parseFloat(notional) * parseFloat(selectedEvent.payoutRate) : 0;

  return (
    <>
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/wallet"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">P2P Trade Hedge</h1>
              <p className="text-xs text-muted-foreground">FX Devaluation Protection for Importers</p>
            </div>
          </div>
          <Button onClick={() => setCreateEventDialogOpen(true)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Create Event</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-green-400" /><span className="text-xs text-muted-foreground">Active Events</span></div>
              <p className="text-2xl font-bold text-foreground">{events.filter(e => e.status === "open").length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">My Positions</span></div>
              <p className="text-2xl font-bold text-foreground">{myPositions.filter(p => p.status === "active").length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">My LP Deposits</span></div>
              <p className="text-2xl font-bold text-foreground">${myDeposits.filter(d => !d.withdrawn).reduce((s, d) => s + parseFloat(d.amount), 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1"><Award className="h-4 w-4 text-purple-400" /><span className="text-xs text-muted-foreground">Premiums Earned</span></div>
              <p className="text-2xl font-bold text-foreground">${myDeposits.reduce((s, d) => s + parseFloat(d.premiumsEarned || "0"), 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {fxData && Object.keys(fxData.rates).length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-green-400" /><span className="text-sm font-semibold text-foreground">Live FX Oracle</span>
                <span className="text-xs text-muted-foreground/70 ml-auto">Source: {Object.values(fxData.rates)[0]?.source}</span>
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
            <TabsTrigger value="hedger" className="data-[state=active]:bg-primary"><Shield className="h-4 w-4 mr-2" /> Buy Protection</TabsTrigger>
            <TabsTrigger value="provider" className="data-[state=active]:bg-primary"><TrendingUp className="h-4 w-4 mr-2" /> Provide Liquidity</TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-primary"><BarChart3 className="h-4 w-4 mr-2" /> My Positions</TabsTrigger>
          </TabsList>

          <TabsContent value="hedger"><HedgerTab events={events} isLoading={eventsLoading} fxData={fxData} walletAddress={wallet.address || ""} onBuyProtection={(e) => { fetchEventDetails(e.id); setBuyDialogOpen(true); }} onSettleEvent={(e) => { fetchEventDetails(e.id); setSettleDialogOpen(true); }} /></TabsContent>
          <TabsContent value="provider"><ProviderTab events={events} isLoading={eventsLoading} myDeposits={myDeposits} treasuryAddress={treasuryAddress} onDeposit={(e) => { fetchEventDetails(e.id); setDepositDialogOpen(true); }} onWithdraw={(id) => withdrawMutation.mutate(id)} onClaimPremiums={(id) => claimPremiumsMutation.mutate(id)} isWithdrawPending={withdrawMutation.isPending} isClaimPending={claimPremiumsMutation.isPending} /></TabsContent>
          <TabsContent value="positions"><PositionsTab positions={myPositions} events={events} onClaim={(id) => claimMutation.mutate(id)} isClaimPending={claimMutation.isPending} /></TabsContent>
        </Tabs>
      </div>

      <BuyProtectionDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen} selectedEvent={selectedEvent} notional={notional} onNotionalChange={setNotional} onBuy={() => buyProtectionMutation.mutate()} isPending={buyProtectionMutation.isPending} premiumCalc={premiumCalc} payoutCalc={payoutCalc} />
      <DepositLiquidityDialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen} selectedEvent={selectedEvent} depositAmount={depositAmount} onDepositAmountChange={setDepositAmount} onDeposit={() => depositMutation.mutate()} isPending={depositMutation.isPending} />
      <CreateEventDialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen} newEvent={newEvent} onNewEventChange={(u) => setNewEvent(p => ({ ...p, ...u }))} onCreate={() => createEventMutation.mutate()} isPending={createEventMutation.isPending} />
      <SettleEventDialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen} selectedEvent={selectedEvent} settlementPrice={settlementPrice} onSettlementPriceChange={setSettlementPrice} onSettle={() => settleMutation.mutate()} isPending={settleMutation.isPending} fxData={fxData} />
    </>
  );
}