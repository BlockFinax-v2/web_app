import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, DollarSignIcon, Clock, BuildingIcon } from "lucide-react";
import { ApplicationDetail } from "./ApplicationDetail";
import { ProgressTracker } from "./ProgressTracker";
import {
  getStatusLabel,
  getStatusColor,
  FINANCING_TYPE_LABELS
} from "./constants";

interface MyApplicationsTabProps {
  applications: any[];
  isLoading: boolean;
  walletAddress: string;
}

export function MyApplicationsTab({ applications, isLoading, walletAddress }: MyApplicationsTabProps) {
  const [selectedApp, setSelectedApp] = useState<any>(null);

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="text-muted-foreground mt-2">Loading applications...</p></div>;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No applications yet</p>
          <p className="text-sm text-muted-foreground mt-1">Submit a trade financing application to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedApp ? (
        <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} walletAddress={walletAddress} role="buyer" />
      ) : (
        applications.map((app: any) => (
          <Card key={app.pgaId || app.requestId || app.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedApp(app)}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{app.buyerCompanyName || "Trade Application"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.tradeDescription?.substring(0, 80) || "No description"}...</p>
                </div>
                <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"}</Badge>
                <span className="flex items-center gap-1"><DollarSignIcon className="h-3 w-3" /> ${parseFloat(app.requestedAmount || "0").toLocaleString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {app.requestedDuration || 90} days</span>
                <span className="flex items-center gap-1"><BuildingIcon className="h-3 w-3" /> {app.sellerAddress?.substring(0, 8)}...</span>
              </div>
              <ProgressTracker status={app.status} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
