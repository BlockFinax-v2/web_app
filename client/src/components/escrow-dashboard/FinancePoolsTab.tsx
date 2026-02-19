import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, DollarSign, Users, TrendingUp } from "lucide-react";
import { FinanceStats, FinancePool, FinanceLoan } from "./types";
import { formatCurrency, getPoolTypeLabel, formatAddress, getStatusColor } from "./constants";

interface FinancePoolsTabProps {
  stats?: FinanceStats;
  pools?: FinancePool[];
  loans?: FinanceLoan[];
  isLoading: boolean;
}

export function FinancePoolsTab({ stats, pools, loans, isLoading }: FinancePoolsTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading finance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Financiers</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPools || 0}</div>
            <p className="text-xs text-muted-foreground">
              Financiers providing capital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalFundingDeployed || "0")}</div>
            <p className="text-xs text-muted-foreground">
              Deployed across all pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsersServed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Borrowers and lenders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageUtilization || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Pool utilization rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Financier Pools</CardTitle>
          <CardDescription>Monitor financier activity and pool performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Financier</TableHead>
                <TableHead>Total Funding</TableHead>
                <TableHead>Users Served</TableHead>
                <TableHead>Active Loans</TableHead>
                <TableHead>APR</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(pools) && pools.map((pool: FinancePool) => (
                <TableRow key={pool.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pool.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getPoolTypeLabel(pool.type)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{formatCurrency(pool.totalFunding)}</div>
                  </TableCell>
                  <TableCell>{pool.usersServed}</TableCell>
                  <TableCell>{pool.activeLoans}</TableCell>
                  <TableCell>{pool.averageAPR}%</TableCell>
                  <TableCell>
                    <Badge className={
                      pool.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {pool.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Trade Finance Loans</CardTitle>
          <CardDescription>Monitor active borrowing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Financier Pool</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(loans) && loans.map((loan: FinanceLoan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-mono">
                    {formatAddress(loan.borrowerAddress)}
                  </TableCell>
                  <TableCell>
                    {pools?.find((p: FinancePool) => p.id === loan.poolId)?.name || 'Unknown Pool'}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">
                      {parseFloat(loan.amount).toLocaleString()} {loan.currency}
                    </div>
                  </TableCell>
                  <TableCell>{loan.term}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(loan.status)}>
                      {loan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
