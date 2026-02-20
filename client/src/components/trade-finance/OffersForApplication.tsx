import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { queryClient } from "@/lib/api-client";
import { useTransactionSigner } from "@/contexts/TransactionSignerContext";
import { tradeFinanceService } from "@/services/tradeFinanceService";

interface OffersForApplicationProps {
  pgaId: string;
  walletAddress: string;
}

export function OffersForApplication({ pgaId, walletAddress }: OffersForApplicationProps) {
  const { toast } = useToast();
  const { requestSignature } = useTransactionSigner();

  // For demonstration/local test we still fetch mock offers but use real blockchain writes.
  const { data: offers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/financing/offers", pgaId],
    queryFn: async () => {
      const res = await fetch(`/api/financing/offers/${pgaId}`, { credentials: "include" });
      if (!res.ok) { if (res.status === 404) return []; throw new Error("Failed to fetch offers"); }
      return res.json();
    },
    enabled: !!pgaId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      // Find the specific offer to get the amount natively
      const offer = offers.find(o => o.id === offerId);
      const amountUSD = offer ? parseFloat(offer.amount || "0") : undefined;

      return requestSignature({
        title: "Accept Offer & Lock Collateral",
        description: `Accepting financing offer and depositing collateral for PGA ${pgaId.substring(0,8)}`,
        amountUSD,
        execute: async (privateKey) => {
          // On the smart contract, accepting an offer equates to locking in the collateral as a buyer
          // Passing a dummy token address for USDC on Sepolia testnets
          return tradeFinanceService.payCollateral(privateKey, pgaId, "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238");
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/offers", pgaId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      toast({ title: "Offer Accepted", description: "You have accepted the financing offer. The trade will proceed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (offerId: string) => {
      toast({ title: "Not Supported", description: "Rejecting from smart contract is currently not supported natively. Simply do not accept it.", variant: "destructive" });
      throw new Error("Not supported");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/offers", pgaId] });
      toast({ title: "Offer Rejected", description: "Offer has been declined." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  }

  if (offers.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Waiting for financier offers...</p>
        <p className="text-xs text-muted-foreground mt-1">Financiers are reviewing your application</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers.map((offer: any) => (
        <Card key={offer.id} className={`border-2 ${offer.status === "accepted" ? "border-green-500" : "border-transparent hover:border-primary/30"} transition-colors`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">{offer.financierName || "Financier"}</CardTitle>
                <CardDescription className="text-xs">{offer.financierType || "Trade Finance"}</CardDescription>
              </div>
              <Badge className={offer.status === "accepted" ? "bg-green-100 text-green-800" : offer.status === "rejected" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                {offer.status === "accepted" ? "Accepted" : offer.status === "rejected" ? "Rejected" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Amount</p>
                <p className="text-sm font-bold">${parseFloat(offer.amount || "0").toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                <p className="text-sm font-bold">{offer.interestRate || "\u2014"}%</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Tenor</p>
                <p className="text-sm font-bold">{offer.tenor || "\u2014"} days</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Fees</p>
                <p className="text-sm font-bold">{offer.fees || "\u2014"}</p>
              </div>
            </div>

            {offer.conditions && (
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Conditions</p>
                <p className="text-xs mt-0.5">{offer.conditions}</p>
              </div>
            )}

            {offer.expiresAt && (
              <p className="text-[10px] text-muted-foreground">
                Expires: {new Date(offer.expiresAt).toLocaleDateString()}
              </p>
            )}

            {offer.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" onClick={() => acceptMutation.mutate(offer.id)} disabled={acceptMutation.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => rejectMutation.mutate(offer.id)} disabled={rejectMutation.isPending}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
