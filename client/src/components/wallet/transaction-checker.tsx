// Dummy stub — no real blockchain integration
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props { address?: string; networkId?: number; }
export function TransactionChecker(_props: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Transaction Checker</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Your recent transactions are shown in the Activity tab. On-chain verification is available after mainnet launch.</p>
        <Badge variant="outline" className="mt-3">Demo Mode</Badge>
      </CardContent>
    </Card>
  );
}