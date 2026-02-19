import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Wallet, Lock, Unlock } from "lucide-react";
import { EventWithStats } from "./types";
import { HedgeLpDeposit } from "@shared/schema";

interface ProviderTabProps {
  events: EventWithStats[];
  isLoading: boolean;
  myDeposits: HedgeLpDeposit[];
  treasuryAddress?: { address: string };
  onDeposit: (event: EventWithStats) => void;
  onWithdraw: (depositId: number) => void;
  onClaimPremiums: (depositId: number) => void;
  isWithdrawPending: boolean;
  isClaimPending: boolean;
}

export function ProviderTab({ 
  events, 
  isLoading, 
  myDeposits, 
  treasuryAddress, 
  onDeposit, 
  onWithdraw, 
  onClaimPremiums,
  isWithdrawPending,
  isClaimPending
}: ProviderTabProps) {
  const activePools = events.filter(e => e.status === "open");

  if (isLoading) {
    return <div className="col-span-full text-center py-12 text-muted-foreground">Loading pools...</div>;
  }

  if (activePools.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No pools available for deposits</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePools.map(event => (
          <Card 
            key={event.id} 
            className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => onDeposit(event)}
          >
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

      {myDeposits.length > 0 && (
        <Card className="bg-card border-border">
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
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-border text-muted-foreground hover:text-foreground"
                            onClick={() => onWithdraw(dep.id)}
                            disabled={isWithdrawPending}
                          >
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
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => onClaimPremiums(dep.id)}
                          disabled={isClaimPending}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          {isClaimPending ? "Claiming..." : `Claim $${claimable.toFixed(2)}`}
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
    </div>
  );
}
