import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/api-client";
import { useWallet } from "@/hooks/use-wallet";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowLeft,
  Wallet,
  BarChart3,
  Award,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { useTransactionSigner } from "@/contexts/TransactionSignerContext";
import { hedgeService, getHedgeDiamondAddress } from "@/services/hedgeService";
import { sendRequestFxRate, isChainlinkFxSupported } from "@/services/chainlinkFxService";

// Modular Components
import { HedgerTab } from "@/components/hedge/HedgerTab";
import { ProviderTab } from "@/components/hedge/ProviderTab";
import { PositionsTab } from "@/components/hedge/PositionsTab";
import { BuyProtectionDialog } from "@/components/hedge/dialogs/BuyProtectionDialog";
import { DepositLiquidityDialog } from "@/components/hedge/dialogs/DepositLiquidityDialog";
import { CreateEventDialog } from "@/components/hedge/dialogs/CreateEventDialog";
import { SettleEventDialog } from "@/components/hedge/dialogs/SettleEventDialog";
import {
  EventWithStats,
  NewEventState,
  HedgePosition,
  HedgeLpDeposit,
} from "@/components/hedge/types";

export default function Hedge() {
  const { wallet, address, settings } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hedger");
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(
    null,
  );
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [notional, setNotional] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [settlementPrice, setSettlementPrice] = useState("");

  const [newEvent, setNewEvent] = useState<NewEventState>({
    name: "",
    description: "",
    underlying: "USD/GHS",
    strike: "",
    premiumRate: "",
    payoutRate: "",
    safetyFactor: "0.80",
    expiryDays: "30",
    initialLiquidity: "100",
  });

  const { requestSignature } = useTransactionSigner();
  const chainId = settings?.selectedNetworkId || 4202;

  // ------- Queries (on-chain reads) -------

  const {
    data: events = [],
    isLoading: eventsLoading,
  } = useQuery<EventWithStats[]>({
    queryKey: ["hedge-events", chainId],
    queryFn: () => hedgeService.getAllEvents(chainId),
    enabled: !!wallet,
  });

  const {
    data: myPositions = [],
    isLoading: positionsLoading,
  } = useQuery<HedgePosition[]>({
    queryKey: ["hedge-positions", chainId, address],
    queryFn: () => (address ? hedgeService.getUserPositions(chainId, address) : Promise.resolve([])),
    enabled: !!wallet && !!address,
  });

  const {
    data: myDeposits = [],
    isLoading: depositsLoading,
  } = useQuery<HedgeLpDeposit[]>({
    queryKey: ["hedge-deposits", chainId, address],
    queryFn: () => (address ? hedgeService.getUserLpDeposits(chainId, address) : Promise.resolve([])),
    enabled: !!wallet && !!address,
  });

  const treasuryAddress = wallet
    ? { address: getHedgeDiamondAddress(chainId) }
    : undefined;

  const fetchEventDetails = (id: number) => {
    const event = events.find((e) => e.id === id) || null;
    setSelectedEvent(event);
    return Promise.resolve(event);
  };

  // ------- Mutations (AA + EOA via TransactionSignerContext) -------

  const buyProtectionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !notional || parseFloat(notional) < 10) {
        throw new Error("Enter a notional of at least $10");
      }
      return requestSignature({
        title: "Buy FX Protection",
        description: `Buying protection on ${selectedEvent.underlying} (Event #${selectedEvent.id})`,
        amountUSD: parseFloat(notional),
        execute: async (privateKey) =>
          hedgeService.buyProtection(privateKey, chainId, {
            eventId: selectedEvent.id,
            notional,
          }),
      });
    },
    onSuccess: () => {
      toast({ title: "Protection Purchased", description: "Your hedge position has been created on-chain." });
      setBuyDialogOpen(false);
      setNotional("");
      queryClient.invalidateQueries({ queryKey: ["hedge-positions", chainId, address] });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Purchase Failed",
        description: err?.message || "Unable to buy protection",
        variant: "destructive",
      });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !depositAmount || parseFloat(depositAmount) < 10) {
        throw new Error("Enter a deposit of at least $10");
      }
      return requestSignature({
        title: "Deposit Liquidity",
        description: `Depositing $${parseFloat(depositAmount).toLocaleString()} into Event #${selectedEvent.id}`,
        amountUSD: parseFloat(depositAmount),
        execute: async (privateKey) =>
          hedgeService.depositLiquidity(privateKey, chainId, {
            eventId: selectedEvent.id,
            amount: depositAmount,
          }),
      });
    },
    onSuccess: () => {
      toast({ title: "Liquidity Deposited", description: "Your LP position has been created on-chain." });
      setDepositDialogOpen(false);
      setDepositAmount("");
      queryClient.invalidateQueries({ queryKey: ["hedge-deposits", chainId, address] });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Deposit Failed",
        description: err?.message || "Unable to deposit liquidity",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!newEvent.name || !newEvent.strike || !newEvent.premiumRate || !newEvent.payoutRate || !newEvent.initialLiquidity) {
        throw new Error("Please fill all required event fields");
      }
      const initialLiquidity = parseFloat(newEvent.initialLiquidity);
      if (!initialLiquidity || initialLiquidity < 10) {
        throw new Error("Initial liquidity must be at least $10");
      }
      return requestSignature({
        title: "Create Hedge Event",
        description: `Creating ${newEvent.underlying} hedge event "${newEvent.name}"`,
        amountUSD: initialLiquidity,
        execute: async (privateKey) =>
          hedgeService.createHedgeEvent(privateKey, chainId, {
            name: newEvent.name,
            underlying: newEvent.underlying,
            strike: newEvent.strike,
            premiumRate: newEvent.premiumRate,
            payoutRate: newEvent.payoutRate,
            expiryDays: newEvent.expiryDays,
            initialLiquidity: newEvent.initialLiquidity!,
            poolOpen: true,
            allowExternalLp: true,
          }),
      });
    },
    onSuccess: () => {
      toast({ title: "Event Created", description: "Your hedge event is now live on-chain." });
      setCreateEventDialogOpen(false);
      setNewEvent((prev) => ({
        ...prev,
        name: "",
        description: "",
        strike: "",
        premiumRate: "",
        payoutRate: "",
        expiryDays: "30",
        initialLiquidity: "100",
      }));
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Event Creation Failed",
        description: err?.message || "Unable to create hedge event",
        variant: "destructive",
      });
    },
  });

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEvent || !settlementPrice) {
        throw new Error("Enter a settlement price");
      }
      return requestSignature({
        title: "Settle Hedge Event",
        description: `Settling Event #${selectedEvent.id} at FX rate ${settlementPrice}`,
        amountUSD: undefined,
        execute: async (privateKey) =>
          hedgeService.settleEvent(privateKey, chainId, {
            eventId: selectedEvent.id,
            settlementPrice,
          }),
      });
    },
    onSuccess: () => {
      toast({ title: "Event Settled", description: "The hedge event has been settled on-chain." });
      setSettleDialogOpen(false);
      setSettlementPrice("");
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
      queryClient.invalidateQueries({ queryKey: ["hedge-positions", chainId, address] });
    },
    onError: (err: any) => {
      toast({
        title: "Settlement Failed",
        description: err?.message || "Unable to settle hedge event",
        variant: "destructive",
      });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (positionId: number) => {
      return requestSignature({
        title: "Claim Hedge Payout",
        description: `Claiming payout for position #${positionId}`,
        execute: async (privateKey) =>
          hedgeService.claimPayout(privateKey, chainId, positionId),
      });
    },
    onSuccess: () => {
      toast({ title: "Payout Claimed", description: "Your hedge payout has been claimed." });
      queryClient.invalidateQueries({ queryKey: ["hedge-positions", chainId, address] });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Claim Failed",
        description: err?.message || "Unable to claim payout",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (depositId: number) => {
      return requestSignature({
        title: "Withdraw Liquidity",
        description: `Withdrawing liquidity for deposit #${depositId}`,
        execute: async (privateKey) =>
          hedgeService.withdrawCapital(privateKey, chainId, depositId),
      });
    },
    onSuccess: () => {
      toast({ title: "Liquidity Withdrawn", description: "Your capital has been returned." });
      queryClient.invalidateQueries({ queryKey: ["hedge-deposits", chainId, address] });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Withdrawal Failed",
        description: err?.message || "Unable to withdraw liquidity",
        variant: "destructive",
      });
    },
  });

  const claimPremiumsMutation = useMutation({
    mutationFn: async (depositId: number) => {
      return requestSignature({
        title: "Claim Premiums",
        description: `Claiming premiums for deposit #${depositId}`,
        execute: async (privateKey) =>
          hedgeService.claimPremiums(privateKey, chainId, depositId),
      });
    },
    onSuccess: () => {
      toast({ title: "Premiums Claimed", description: "Your LP premiums have been claimed." });
      queryClient.invalidateQueries({ queryKey: ["hedge-deposits", chainId, address] });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
    },
    onError: (err: any) => {
      toast({
        title: "Claim Failed",
        description: err?.message || "Unable to claim premiums",
        variant: "destructive",
      });
    },
  });

  const chainlinkRequestMutation = useMutation({
    mutationFn: async ({
      eventId,
      currencyCode,
      requestDataHex,
    }: {
      eventId: number;
      currencyCode: string;
      requestDataHex: string;
    }) => {
      return requestSignature({
        title: "Request Chainlink FX Rate",
        description: `Request on-chain rate for ${currencyCode} and settle event #${eventId}`,
        execute: async (privateKey) =>
          sendRequestFxRate(privateKey, chainId, {
            eventId,
            currencyCode,
            requestDataHex,
          }),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Request sent",
        description: "Event will settle when Chainlink DON fulfills the request.",
      });
      queryClient.invalidateQueries({ queryKey: ["hedge-events", chainId] });
      queryClient.invalidateQueries({ queryKey: ["chainlink-last-rate", chainId, variables.currencyCode] });
    },
    onError: (err: unknown) => {
      toast({
        title: "Chainlink request failed",
        description: err instanceof Error ? err.message : "Unable to send request",
        variant: "destructive",
      });
    },
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              Wallet Required
            </h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to access P2P Hedge
            </p>
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

  const premiumCalc =
    selectedEvent && notional
      ? parseFloat(notional) * parseFloat(selectedEvent.premiumRate)
      : 0;
  const payoutCalc =
    selectedEvent && notional
      ? parseFloat(notional) * parseFloat(selectedEvent.payoutRate)
      : 0;

  return (
    <>
      {/* Ultra-modern header: glass + gradient accent */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  P2P Trade Hedge
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  FX devaluation protection for importers
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setCreateEventDialogOpen(true)}
            size="sm"
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 mr-2" /> Create Event
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats: glass cards, hover lift, more spacing */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <Card className="group relative rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardContent className="relative pt-5 pb-4 px-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-emerald-500/15 p-1.5">
                  <Activity className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Active Events
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {events.filter((e) => e.status === "open").length}
              </p>
            </CardContent>
          </Card>
          <Card className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/15 p-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  My Positions
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {myPositions.filter((p) => p.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/15 p-1.5">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  My LP Deposits
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                $
                {myDeposits
                  .filter((d) => !d.withdrawn)
                  .reduce((s, d) => s + parseFloat(d.amount), 0)
                  .toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5 hover:-translate-y-0.5">
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-violet-500/15 p-1.5">
                  <Award className="h-4 w-4 text-violet-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Premiums Earned
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                $
                {myDeposits
                  .reduce((s, d) => s + parseFloat(d.premiumsEarned || "0"), 0)
                  .toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: pill style, gradient active state */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex h-12 rounded-2xl bg-card/60 border border-white/10 p-1.5 backdrop-blur-sm">
            <TabsTrigger
              value="hedger"
              className="rounded-xl px-5 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200"
            >
              <Shield className="h-4 w-4 mr-2" /> Buy Protection
            </TabsTrigger>
            <TabsTrigger
              value="provider"
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" /> Provide Liquidity
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" /> My Positions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hedger" className="mt-6">
            <HedgerTab
              events={events}
              isLoading={eventsLoading}
              walletAddress={wallet.address || ""}
              onBuyProtection={(e) => {
                fetchEventDetails(e.id);
                setBuyDialogOpen(true);
              }}
              onSettleEvent={(e) => {
                fetchEventDetails(e.id);
                setSettleDialogOpen(true);
              }}
            />
          </TabsContent>
          <TabsContent value="provider">
            <ProviderTab
              events={events}
              isLoading={eventsLoading}
              myDeposits={myDeposits}
              treasuryAddress={treasuryAddress}
              onDeposit={(e) => {
                fetchEventDetails(e.id);
                setDepositDialogOpen(true);
              }}
              onWithdraw={(id) => withdrawMutation.mutate(id)}
              onClaimPremiums={(id) => claimPremiumsMutation.mutate(id)}
              isWithdrawPending={withdrawMutation.isPending}
              isClaimPending={claimPremiumsMutation.isPending}
            />
          </TabsContent>
          <TabsContent value="positions">
            <PositionsTab
              positions={myPositions}
              events={events}
              onClaim={(id) => claimMutation.mutate(id)}
              isClaimPending={claimMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BuyProtectionDialog
        open={buyDialogOpen}
        onOpenChange={setBuyDialogOpen}
        selectedEvent={selectedEvent}
        notional={notional}
        onNotionalChange={setNotional}
        onBuy={() => buyProtectionMutation.mutate()}
        isPending={buyProtectionMutation.isPending}
        premiumCalc={premiumCalc}
        payoutCalc={payoutCalc}
      />
      <DepositLiquidityDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        selectedEvent={selectedEvent}
        depositAmount={depositAmount}
        onDepositAmountChange={setDepositAmount}
        onDeposit={() => depositMutation.mutate()}
        isPending={depositMutation.isPending}
      />
      <CreateEventDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        newEvent={newEvent}
        onNewEventChange={(u) => setNewEvent((p) => ({ ...p, ...u }))}
        onCreate={() => createEventMutation.mutate()}
        isPending={createEventMutation.isPending}
      />
      <SettleEventDialog
        open={settleDialogOpen}
        onOpenChange={setSettleDialogOpen}
        selectedEvent={selectedEvent}
        settlementPrice={settlementPrice}
        onSettlementPriceChange={setSettlementPrice}
        onSettle={() => settleMutation.mutate()}
        isPending={settleMutation.isPending}
        chainId={chainId}
        onRequestChainlinkRate={
          isChainlinkFxSupported(chainId)
            ? (eventId, currencyCode, requestDataHex) =>
                chainlinkRequestMutation.mutate({ eventId, currencyCode, requestDataHex })
            : undefined
        }
        isChainlinkRequestPending={chainlinkRequestMutation.isPending}
      />
    </>
  );
}
