import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EventWithStats } from "../types";

interface DepositLiquidityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: EventWithStats | null;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
  isPending: boolean;
}

export function DepositLiquidityDialog({ 
  open, 
  onOpenChange, 
  selectedEvent, 
  depositAmount, 
  onDepositAmountChange, 
  onDeposit, 
  isPending 
}: DepositLiquidityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                value={depositAmount} onChange={e => onDepositAmountChange(e.target.value)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Cancel</Button>
          <Button 
            onClick={onDeposit}
            disabled={!depositAmount || parseFloat(depositAmount) < 10 || isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? "Depositing..." : `Deposit $${depositAmount || "0"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
