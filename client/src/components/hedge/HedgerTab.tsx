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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activeEvents.map(event => (
        <Card 
          key={event.id} 
          className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onBuyProtection(event)}
        >
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
            
            {event.createdBy === walletAddress && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 border-border text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); onSettleEvent(event); }}
              >
                <Activity className="h-3 w-3 mr-1" /> Settle Event
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
