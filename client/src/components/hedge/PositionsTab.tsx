import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2 } from "lucide-react";
import { HedgePosition, HedgeEvent } from "./types";
import { getStatusBadgeStyle, getStatusLabel } from "./constants";

interface PositionsTabProps {
  positions: HedgePosition[];
  events: HedgeEvent[];
  onClaim: (positionId: number) => void;
  isClaimPending: boolean;
}

export function PositionsTab({ 
  positions, 
  events, 
  onClaim, 
  isClaimPending 
}: PositionsTabProps) {
  const settledEvents = events.filter(e => e.status === "settled" || e.status === "expired");

  if (positions.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No positions yet</p>
        <p className="text-muted-foreground/70 text-sm mt-1">Buy protection on an active event to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {positions.map(pos => (
          <Card key={pos.id} className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Position #{pos.id}</span>
                  <span className="text-xs text-muted-foreground/70">Event #{pos.eventId}</span>
                </div>
                <Badge className={getStatusBadgeStyle(pos.status)}>
                  {getStatusLabel(pos.status)}
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
                <Button 
                  className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => onClaim(pos.id)}
                  disabled={isClaimPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Claim ${parseFloat(pos.payoutAmount || "0").toFixed(2)}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {settledEvents.length > 0 && (
        <Card className="bg-card border-border mt-6">
          <CardHeader>
            <CardTitle className="text-foreground text-base">Settled Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settledEvents.map(event => (
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
    </div>
  );
}
