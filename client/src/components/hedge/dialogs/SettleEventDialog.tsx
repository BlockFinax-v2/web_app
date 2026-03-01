import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Link2 } from "lucide-react";
import { EventWithStats } from "../types";
import { getLastFulfilledRate, isChainlinkFxSupported } from "@/services/chainlinkFxService";

interface SettleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEvent: EventWithStats | null;
  settlementPrice: string;
  onSettlementPriceChange: (value: string) => void;
  onSettle: () => void;
  isPending: boolean;
  chainId?: number;
  onRequestChainlinkRate?: (eventId: number, currencyCode: string, requestDataHex: string) => Promise<void>;
  isChainlinkRequestPending?: boolean;
}

/** Extract quote currency from underlying e.g. "USD/GHS" -> "GHS" */
function quoteCurrency(underlying: string): string {
  const parts = underlying.split("/");
  return parts.length >= 2 ? parts[1]! : underlying;
}

export function SettleEventDialog({
  open,
  onOpenChange,
  selectedEvent,
  settlementPrice,
  onSettlementPriceChange,
  onSettle,
  isPending,
  chainId = 0,
  onRequestChainlinkRate,
  isChainlinkRequestPending = false,
}: SettleEventDialogProps) {
  const [chainlinkRequestDataHex, setChainlinkRequestDataHex] = useState("");
  const currencyCode = selectedEvent ? quoteCurrency(selectedEvent.underlying) : "";
  const chainlinkSupported = !!chainId && isChainlinkFxSupported(chainId);

  const { data: lastChainlinkRate } = useQuery({
    queryKey: ["chainlink-last-rate", chainId, currencyCode],
    queryFn: () => getLastFulfilledRate(chainId!, currencyCode),
    enabled: open && !!chainId && !!currencyCode && chainlinkSupported,
  });

  const handleUseLastChainlinkRate = () => {
    if (lastChainlinkRate) onSettlementPriceChange(lastChainlinkRate);
  };

  const handleSubmitChainlinkRequest = () => {
    if (!selectedEvent || !chainlinkRequestDataHex.trim() || !onRequestChainlinkRate) return;
    onRequestChainlinkRate(selectedEvent.id, currencyCode, chainlinkRequestDataHex.trim());
    setChainlinkRequestDataHex("");
  };

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
                type="number"
                step="0.01"
                value={settlementPrice}
                onChange={(e) => onSettlementPriceChange(e.target.value)}
                placeholder={`Current ${selectedEvent.underlying} rate`}
                className="bg-muted border-border text-foreground mt-1"
              />
              {chainlinkSupported && lastChainlinkRate && parseFloat(lastChainlinkRate) > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-primary/30 text-primary text-xs"
                  onClick={handleUseLastChainlinkRate}
                >
                  <Link2 className="h-3 w-3 mr-1" /> Use last Chainlink rate: {lastChainlinkRate}
                </Button>
              )}
            </div>
            {chainlinkSupported && onRequestChainlinkRate && (
              <div className="rounded-lg border border-white/10 bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Request rate via Chainlink & settle
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Paste request data (hex) from the request script, then submit. Event will settle when the DON fulfills.
                </p>
                <Input
                  placeholder="0x... (request data hex)"
                  value={chainlinkRequestDataHex}
                  onChange={(e) => setChainlinkRequestDataHex(e.target.value)}
                  className="bg-background border-border text-foreground font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 text-primary"
                  onClick={handleSubmitChainlinkRequest}
                  disabled={!chainlinkRequestDataHex.trim() || isChainlinkRequestPending}
                >
                  {isChainlinkRequestPending ? "Submitting..." : "Submit request"}
                </Button>
              </div>
            )}
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
