import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { NewEventState } from "../types";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newEvent: NewEventState;
  onNewEventChange: (updates: Partial<NewEventState>) => void;
  onCreate: () => void;
  isPending: boolean;
}

export function CreateEventDialog({ 
  open, 
  onOpenChange, 
  newEvent, 
  onNewEventChange, 
  onCreate, 
  isPending 
}: CreateEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Input 
              value={newEvent.name} 
              onChange={e => onNewEventChange({ name: e.target.value })}
              placeholder="e.g. USD/GHS 30-Day Protection" 
              className="bg-muted border-border text-foreground mt-1" 
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Description (optional)</Label>
            <Textarea 
              value={newEvent.description} 
              onChange={e => onNewEventChange({ description: e.target.value })}
              placeholder="Details about this hedge event" 
              className="bg-muted border-border text-foreground mt-1" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground">Currency Pair</Label>
              <Select value={newEvent.underlying} onValueChange={v => onNewEventChange({ underlying: v })}>
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
              <Input 
                type="number" step="0.01" value={newEvent.strike}
                onChange={e => onNewEventChange({ strike: e.target.value })}
                placeholder="e.g. 16.00" 
                className="bg-muted border-border text-foreground mt-1" 
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-muted-foreground">Premium (%)</Label>
              <Input 
                type="number" step="0.1" value={newEvent.premiumRate}
                onChange={e => onNewEventChange({ premiumRate: e.target.value })}
                placeholder="e.g. 2.5" 
                className="bg-muted border-border text-foreground mt-1" 
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Payout (%)</Label>
              <Input 
                type="number" step="1" value={newEvent.payoutRate}
                onChange={e => onNewEventChange({ payoutRate: e.target.value })}
                placeholder="e.g. 10" 
                className="bg-muted border-border text-foreground mt-1" 
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Duration (days)</Label>
              <Input 
                type="number" step="1" value={newEvent.expiryDays}
                onChange={e => onNewEventChange({ expiryDays: e.target.value })}
                placeholder="e.g. 30" 
                className="bg-muted border-border text-foreground mt-1" 
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Initial Liquidity (USDC)</Label>
            <Input
              type="number"
              min="10"
              step="1"
              value={newEvent.initialLiquidity || ""}
              onChange={e => onNewEventChange({ initialLiquidity: e.target.value })}
              placeholder="e.g. 100"
              className="bg-muted border-border text-foreground mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum $10. This is the creator&apos;s first LP deposit into the pool.
            </p>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-muted-foreground">Cancel</Button>
          <Button 
            onClick={onCreate}
            disabled={
              !newEvent.name ||
              !newEvent.strike ||
              !newEvent.premiumRate ||
              !newEvent.payoutRate ||
              !newEvent.initialLiquidity ||
              isPending
            }
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPending ? "Creating..." : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
