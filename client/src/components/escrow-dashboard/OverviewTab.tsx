import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, DollarSign, Wallet } from "lucide-react";
import { EscrowStats, EscrowData, TokenStats } from "./types";
import { formatCurrency, getStatusColor } from "./constants";

interface OverviewTabProps {
  stats?: EscrowStats;
  escrows?: EscrowData[];
  tokens?: TokenStats[];
}

export function OverviewTab({ stats, escrows, tokens }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Exporters: {stats?.usersByRole?.exporters || 0}</div>
              <div>Importers: {stats?.usersByRole?.importers || 0}</div>
              <div>Financiers: {stats?.usersByRole?.financiers || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Escrows</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEscrows || 0}</div>
            <div className="text-xs text-muted-foreground">
              <div>Active: {stats?.activeEscrows || 0}</div>
              <div>Completed: {stats?.completedEscrows || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalValueLocked || "0")}</div>
            <p className="text-xs text-muted-foreground">
              Across all active escrows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWallets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Connected to platform
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Escrow Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {escrows && Object.entries(
                Array.isArray(escrows) ? 
                escrows.reduce((acc: any, escrow: EscrowData) => {
                  acc[escrow.status] = (acc[escrow.status] || 0) + 1;
                  return acc;
                }, {}) : {}
              ).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status}
                    </Badge>
                  </div>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tokens by Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(tokens) && tokens.slice(0, 5).map((token: TokenStats) => (
                <div key={token.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium">{token.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(token.totalValue)}</div>
                    <div className="text-xs text-muted-foreground">{token.escrowCount} escrows</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
