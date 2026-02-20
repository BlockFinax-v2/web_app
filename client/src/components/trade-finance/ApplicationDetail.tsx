import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TruckIcon, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/api-client";
import { useTransactionSigner } from "@/contexts/TransactionSignerContext";
import { tradeFinanceService } from "@/services/tradeFinanceService";
import { ProgressTracker } from "./ProgressTracker";
import { OffersForApplication } from "./OffersForApplication";
import {
  getStatusLabel,
  getStatusColor,
  FINANCING_TYPE_LABELS
} from "./constants";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

interface ApplicationDetailProps {
  app: any;
  onBack: () => void;
  walletAddress: string;
  role: "buyer" | "seller";
}

export function ApplicationDetail({ app, onBack, walletAddress, role }: ApplicationDetailProps) {
  const { toast } = useToast();
  const { requestSignature } = useTransactionSigner();
  const [bolNumber, setBolNumber] = useState("");
  const [bolTrackingNumber, setBolTrackingNumber] = useState("");
  const [bolLogisticsProvider, setBolLogisticsProvider] = useState("");
  const [deliveryCondition, setDeliveryCondition] = useState("excellent");
  const [showBolDialog, setShowBolDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  // Use pgaId instead of requestId to match smart contract standard
  const pgaId = app.pgaId || app.requestId;

  const uploadBolMutation = useMutation({
    mutationFn: async () => {
      // Create a dummy IPFS URI representation for the bill of lading
      const proofOfShipmentURI = `ipfs://shipping/${bolNumber}/${bolTrackingNumber}`;
      
      return requestSignature({
        title: "Confirm Goods Shipped",
        description: `Uploading Bill of Lading ${bolNumber} on-chain via logistics partner`,
        execute: async (privateKey) => {
          return tradeFinanceService.confirmGoodsShipped(privateKey, pgaId, proofOfShipmentURI);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      toast({ title: "Bill of Lading Uploaded", description: "Shipping documents submitted. Buyer can now confirm delivery." });
      setShowBolDialog(false);
      setBolNumber(""); setBolTrackingNumber(""); setBolLogisticsProvider("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      // Create a dummy IPFS URI representation for proof of delivery
      const proofOfDeliveryURI = `ipfs://delivery/${deliveryCondition}`;

      return requestSignature({
        title: "Confirm Goods Delivered",
        description: `Confirming receipt and condition (${deliveryCondition}) to release final seller payment`,
        execute: async (privateKey) => {
          return tradeFinanceService.confirmGoodsDelivered(privateKey, pgaId, proofOfDeliveryURI);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Delivery Confirmed", description: "Goods received and verified." });
      setShowDeliveryDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">\u2190 Back to list</Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{app.buyerCompanyName || "Trade Application"}</CardTitle>
              <CardDescription>Request ID: {app.requestId}</CardDescription>
            </div>
            <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressTracker status={app.status} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Trade Value" value={`$${parseFloat(app.tradeValue || app.requestedAmount || "0").toLocaleString()}`} />
            <InfoItem label="Financing Type" value={FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"} />
            <InfoItem label="Financing Requested" value={`$${parseFloat(app.requestedAmount || "0").toLocaleString()}`} />
            <InfoItem label="Duration" value={`${app.requestedDuration || 90} days`} />
            <InfoItem label="Buyer" value={app.buyerAddress?.substring(0, 12) + "..."} />
            <InfoItem label="Seller" value={app.sellerAddress?.substring(0, 12) + "..."} />
            {app.buyerCountry && <InfoItem label="Country" value={app.buyerCountry} />}
          </div>

          {app.tradeDescription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trade Description</p>
              <p className="text-sm bg-muted rounded p-3">{app.tradeDescription}</p>
            </div>
          )}

          {app.bolNumber && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2"><TruckIcon className="h-4 w-4" /> Shipping Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">BoL #:</span> {app.bolNumber}</div>
                {app.trackingNumber && <div><span className="text-muted-foreground">Tracking:</span> {app.trackingNumber}</div>}
                {app.logisticsProvider && <div><span className="text-muted-foreground">Carrier:</span> {app.logisticsProvider}</div>}
              </div>
            </div>
          )}

          {role === "buyer" && pgaId && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Financing Offers</h4>
              <OffersForApplication pgaId={pgaId} walletAddress={walletAddress} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {role === "seller" && ["approved", "fee_paid", "seller_payment_confirmed", "offer_accepted"].includes(app.status) && (
              <Button size="sm" onClick={() => setShowBolDialog(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload Bill of Lading
              </Button>
            )}
            {role === "buyer" && ["seller_bol_uploaded", "bol_uploaded", "goods_shipped"].includes(app.status) && (
              <Button size="sm" onClick={() => setShowDeliveryDialog(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Delivery
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBolDialog} onOpenChange={setShowBolDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bill of Lading</DialogTitle>
            <DialogDescription>Enter shipping document details for this trade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Bill of Lading Number *</Label><Input value={bolNumber} onChange={(e) => setBolNumber(e.target.value)} placeholder="BOL-2026-001" /></div>
            <div><Label>Tracking Number</Label><Input value={bolTrackingNumber} onChange={(e) => setBolTrackingNumber(e.target.value)} placeholder="Shipping tracking #" /></div>
            <div><Label>Logistics Provider</Label><Input value={bolLogisticsProvider} onChange={(e) => setBolLogisticsProvider(e.target.value)} placeholder="e.g., Maersk, MSC" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBolDialog(false)}>Cancel</Button>
            <Button onClick={() => uploadBolMutation.mutate()} disabled={!bolNumber || uploadBolMutation.isPending}>
              {uploadBolMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload BoL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>Confirm that you have received the goods in acceptable condition</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Delivery Condition</Label>
              <Select value={deliveryCondition} onValueChange={setDeliveryCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - All goods as expected</SelectItem>
                  <SelectItem value="good">Good - Minor discrepancies</SelectItem>
                  <SelectItem value="acceptable">Acceptable - Some issues noted</SelectItem>
                  <SelectItem value="damaged">Damaged - Goods damaged in transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By confirming delivery, you acknowledge receipt of goods for trade #{pgaId?.substring(0, 8)}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>Cancel</Button>
            <Button onClick={() => confirmDeliveryMutation.mutate()} disabled={confirmDeliveryMutation.isPending}>
              {confirmDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
