import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Activity } from "lucide-react";
import { EventWithStats, FXData } from "./types";

interface HedgerTabProps {
  events: EventWithStats[];
  isLoading: boolean;
  fxData?: FXData;
  walletAddress?: string;
  onBuyProtection: (event: EventWithStats) => void;
  onSettleEvent: (event: EventWithStats) => void;
}

export function HedgerTab({ 
  events, 
  isLoading, 
  fxData, 
  walletAddress, 
  onBuyProtection, 
  onSettleEvent 
}: HedgerTabProps) {
  const activeEvents = events.filter(e => e.status === "open");

  if (isLoading) {
    return <div className="col-span-full text-center py-12 text-muted-foreground">Loading events...</div>;
  }

  if (activeEvents.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No active hedge events available</p>
        <p className="text-muted-foreground/70 text-sm mt-1">Create an event to get started</p>
      </div>
    );
  }

  const getExpiryProgress = (expiryDate: string) => {
    const total = 60; // assume ~60d max for display
    const remaining = Math.max(0, (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.min(100, (remaining / total) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      {activeEvents.map(event => {
        const daysLeft = Math.max(0, Math.ceil((new Date(event.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        const expiryProgress = getExpiryProgress(event.expiryDate);
        return (
          <Card
            key={event.id}
            className="group rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg shadow-black/5 transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
            onClick={() => onBuyProtection(event)}
          >
            <CardHeader className="pb-4 px-5 pt-5">
              <div className="flex items-center justify-between">
                <Badge className="rounded-full bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium px-2.5 py-0.5">
                  Open
                </Badge>
                <span className="text-xs font-medium text-muted-foreground/80">#{event.id}</span>
              </div>
              <CardTitle className="text-foreground text-lg font-semibold tracking-tight mt-3">{event.name}</CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-0.5">{event.underlying} Protection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Strike</p>
                  <p className="text-base font-bold tracking-tight text-foreground tabular-nums mt-0.5">{parseFloat(event.strike).toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Premium</p>
                  <p className="text-base font-bold tracking-tight text-primary tabular-nums mt-0.5">{(parseFloat(event.premiumRate) * 100).toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Max Payout</p>
                  <p className="text-base font-bold tracking-tight text-emerald-400 tabular-nums mt-0.5">{(parseFloat(event.payoutRate) * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">Expires</p>
                  <p className="text-base font-bold tracking-tight text-foreground tabular-nums mt-0.5">{daysLeft}d</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all duration-500"
                      style={{ width: `${expiryProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {fxData?.rates[event.underlying] && (
                <div
                  className={`rounded-xl p-3.5 flex items-center justify-between border ${
                    fxData.rates[event.underlying].rate >= parseFloat(event.strike)
                      ? "bg-red-500/10 border-red-500/20"
                      : "bg-emerald-500/10 border-emerald-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${fxData.rates[event.underlying].rate >= parseFloat(event.strike) ? "text-red-400" : "text-emerald-400"}`} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground/80">Live Spot</p>
                      <p className="text-sm font-bold tracking-tight text-foreground tabular-nums">{fxData.rates[event.underlying].rate.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground/80">vs Strike</p>
                    <p className={`text-sm font-bold ${fxData.rates[event.underlying].rate >= parseFloat(event.strike) ? "text-red-400" : "text-emerald-400"}`}>
                      {fxData.rates[event.underlying].rate >= parseFloat(event.strike) ? "ITM" : "Safe"}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground/80">Pool Liquidity</p>
                  <p className="text-sm font-bold text-primary tabular-nums">${(event.poolStats?.totalLiquidity || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground/80">Available</p>
                  <p className="text-sm font-bold text-emerald-400 tabular-nums">${(event.poolStats?.availableCapacity || 0).toLocaleString()}</p>
                </div>
              </div>

              <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200">
                Buy Protection
              </Button>

              {event.createdBy === walletAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/5"
                  onClick={(e) => { e.stopPropagation(); onSettleEvent(event); }}
                >
                  <Activity className="h-3 w-3 mr-2" /> Settle Event
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
