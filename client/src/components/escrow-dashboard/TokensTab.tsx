import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TokenStats } from "./types";
import { formatCurrency } from "./constants";

interface TokensTabProps {
  tokens?: TokenStats[];
  isLoading: boolean;
}

export function TokensTab({ tokens, isLoading }: TokensTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading token data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Distribution & Usage</CardTitle>
        <CardDescription>Monitor token usage across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Escrow Count</TableHead>
              <TableHead>Platform %</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(tokens) && tokens.map((token: TokenStats) => (
              <TableRow key={token.symbol}>
                <TableCell className="font-semibold">{token.symbol}</TableCell>
                <TableCell>{formatCurrency(token.totalValue)}</TableCell>
                <TableCell>{token.escrowCount}</TableCell>
                <TableCell>{token.percentage.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
