import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2 } from "lucide-react";
import { OffersForApplication } from "./OffersForApplication";

interface OffersTabProps {
  applications: any[];
  isLoading: boolean;
  walletAddress: string;
}

export function OffersTab({ applications, isLoading, walletAddress }: OffersTabProps) {
  const appsWithOffers = applications.filter((a: any) => ["seller_approved", "offers_received", "offer_accepted", "awaiting_fee_payment", "fee_paid", "approved"].includes(a.status));

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (appsWithOffers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No offers yet</p>
          <p className="text-sm text-muted-foreground mt-1">Offers will appear here once financiers review your applications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {appsWithOffers.map((app: any) => (
        <div key={app.pgaId || app.requestId || app.id}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">{app.buyerCompanyName || "Application"}</h3>
            <Badge variant="outline" className="text-xs">${parseFloat(app.requestedAmount || "0").toLocaleString()}</Badge>
          </div>
          <OffersForApplication pgaId={app.pgaId || app.requestId} walletAddress={walletAddress} />
        </div>
      ))}
    </div>
  );
}
