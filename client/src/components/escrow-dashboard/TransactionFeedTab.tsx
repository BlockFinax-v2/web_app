import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ExternalLink } from "lucide-react";
import { TransactionFeed } from "./types";
import { formatAddress, getEtherscanUrl } from "./constants";

interface TransactionFeedTabProps {
  transactions?: TransactionFeed[];
  isLoading: boolean;
}

export function TransactionFeedTab({ transactions, isLoading }: TransactionFeedTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading transactions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Real-time Transaction Feed</span>
        </CardTitle>
        <CardDescription>Live blockchain events and contract interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.isArray(transactions) && transactions.map((tx: TransactionFeed) => (
            <div key={tx.txHash} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{tx.eventName}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Block #{tx.blockNumber}
                  </span>
                </div>
                <div className="font-mono text-sm">
                  Contract: {formatAddress(tx.contractAddress)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(tx.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open(getEtherscanUrl(tx.txHash, tx.networkId), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
