import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { EventWithStats } from "../types";

interface BuyProtectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: EventWithStats | null;
  notional: string;
  onNotionalChange: (value: string) => void;
  onBuy: () => void;
  isPending: boolean;
  premiumCalc: number;
  payoutCalc: number;
}

export function BuyProtectionDialog({ 
  open, 
  onOpenChange, 
  selectedEvent, 
  notional, 
  onNotionalChange, 
  onBuy, 
  isPending,
  premiumCalc,
  payoutCalc
}: BuyProtectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                value={notional} onChange={e => onNotionalChange(e.target.value)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Cancel</Button>
          <Button 
            onClick={onBuy}
            disabled={!notional || parseFloat(notional) < 10 || isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? "Processing..." : `Pay $${premiumCalc.toFixed(2)} Premium`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
