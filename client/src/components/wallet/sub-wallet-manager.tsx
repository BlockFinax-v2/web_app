// Dummy stub — no real blockchain integration
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props { address?: string; networkId?: number; onClose?: () => void; }
export function SubWalletManager(_props: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sub-Wallets</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Sub-wallet management will be available after mainnet launch.</p>
        <Badge variant="outline" className="mt-3">Coming Soon</Badge>
      </CardContent>
    </Card>
  );
}