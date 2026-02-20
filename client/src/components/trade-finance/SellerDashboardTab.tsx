import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Package, Loader2, CheckCircle2, XCircle, DollarSignIcon, Eye } from "lucide-react";
import { useTransactionSigner } from "@/contexts/TransactionSignerContext";
import { queryClient } from "@/lib/api-client";
import { tradeFinanceService } from "@/services/tradeFinanceService";
import { ApplicationDetail } from "./ApplicationDetail";
import { ProgressTracker } from "./ProgressTracker";
import {
  getStatusLabel,
  getStatusColor,
  FINANCING_TYPE_LABELS
} from "./constants";

interface SellerDashboardTabProps {
  applications: any[];
  isLoading: boolean;
  walletAddress: string;
}

export function SellerDashboardTab({ applications, isLoading, walletAddress }: SellerDashboardTabProps) {
  const { toast } = useToast();
  const { requestSignature } = useTransactionSigner();
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const approveMutation = useMutation({
    mutationFn: async (pgaId: string) => {
      return requestSignature({
        title: "Approve Trade Finance Application",
        description: `Confirming you are the seller for PGA ${pgaId.substring(0,8)}`,
        execute: async (privateKey) => {
          return tradeFinanceService.approvePGA(privateKey, pgaId);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Approved", description: "Trade application approved. Buyer can now receive financing offers." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (pgaId: string) => {
      // Temporary mock or skip for rejecting since there's no native reject on the diamond
      toast({ title: "Not Supported", description: "Rejecting from smart contract is currently not supported. Wait for expiration.", variant: "destructive" });
      throw new Error("Not supported");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Rejected", description: "Trade application rejected." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (pgaId: string) => {
      return requestSignature({
        title: "Confirm Payment Received",
        description: `Confirming full balance payment received for PGA ${pgaId.substring(0,8)}`,
        execute: async (privateKey) => {
          return tradeFinanceService.confirmBalancePaymentReceived(privateKey, pgaId);
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Payment Confirmed", description: "Payment receipt confirmed successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No trades where you are the seller</p>
          <p className="text-sm text-muted-foreground mt-1">Buyers will add your wallet address when applying for financing</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedApp) {
    return <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} walletAddress={walletAddress} role="seller" />;
  }

  return (
    <div className="space-y-4">
      {applications.map((app: any) => (
        <Card key={app.requestId || app.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="cursor-pointer" onClick={() => setSelectedApp(app)}>
                <p className="font-semibold text-sm">{app.buyerCompanyName || "Trade Application"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From: {app.buyerAddress?.substring(0, 10)}...</p>
              </div>
              <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"}</Badge>
              <span>${parseFloat(app.requestedAmount || "0").toLocaleString()} USDC</span>
              <span>{app.requestedDuration || 90} days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{app.tradeDescription?.substring(0, 120)}</p>

            <ProgressTracker status={app.status} />

            <div className="flex gap-2 mt-3">
              {app.status === "draft_sent_to_seller" && (
                <>
                  <Button size="sm" onClick={() => approveMutation.mutate(app.pgaId || app.requestId)} disabled={approveMutation.isPending}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(app.pgaId || app.requestId)} disabled={rejectMutation.isPending}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </>
              )}
              {(app.status === "buyer_payment_uploaded" || app.status === "seller_payment_confirmed") && (
                <Button size="sm" onClick={() => confirmPaymentMutation.mutate(app.pgaId || app.requestId)} disabled={confirmPaymentMutation.isPending}>
                  <DollarSignIcon className="h-3.5 w-3.5 mr-1" /> Confirm Payment
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
