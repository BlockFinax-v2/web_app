import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Activity } from "lucide-react";
import { EventWithStats, FXData } from "../types";

interface SettleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: EventWithStats | null;
  settlementPrice: string;
  onSettlementPriceChange: (value: string) => void;
  onSettle: () => void;
  isPending: boolean;
  fxData?: FXData;
}

export function SettleEventDialog({ 
  open, 
  onOpenChange, 
  selectedEvent, 
  settlementPrice, 
  onSettlementPriceChange, 
  onSettle, 
  isPending,
  fxData
}: SettleEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <Input 
                type="number" step="0.01" value={settlementPrice}
                onChange={e => onSettlementPriceChange(e.target.value)}
                placeholder={`Current ${selectedEvent.underlying} rate`}
                className="bg-muted border-border text-foreground mt-1" 
              />
              {fxData?.rates[selectedEvent.underlying] && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-primary/30 text-primary text-xs"
                  onClick={() => onSettlementPriceChange(fxData.rates[selectedEvent.underlying!].rate.toFixed(4))}
                >
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Cancel</Button>
          <Button 
            onClick={onSettle}
            disabled={!settlementPrice || isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? "Settling..." : "Settle Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
