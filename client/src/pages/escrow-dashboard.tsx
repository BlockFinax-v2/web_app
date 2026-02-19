import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Globe, Download } from "lucide-react";

// Modular Components
import { OverviewTab } from "@/components/escrow-dashboard/OverviewTab";
import { UsersTab } from "@/components/escrow-dashboard/UsersTab";
import { EscrowsTab } from "@/components/escrow-dashboard/EscrowsTab";
import { TransactionFeedTab } from "@/components/escrow-dashboard/TransactionFeedTab";
import { TokensTab } from "@/components/escrow-dashboard/TokensTab";
import { ContractsTab } from "@/components/escrow-dashboard/ContractsTab";
import { FinancePoolsTab } from "@/components/escrow-dashboard/FinancePoolsTab";
import { ReferralsTab } from "@/components/escrow-dashboard/ReferralsTab";
import { KycTab } from "@/components/escrow-dashboard/KycTab";

export default function EscrowDashboard() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Fetch escrow platform statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/escrow/stats'],
    queryFn: () => fetch('/api/escrow/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch user activity data
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/escrow/users'],
    queryFn: () => fetch('/api/escrow/users').then(res => res.json()),
  });

  // Fetch escrow analytics
  const { data: escrows, isLoading: escrowsLoading } = useQuery({
    queryKey: ['/api/escrow/escrows', statusFilter],
    queryFn: () => fetch(`/api/escrow/escrows?status=${statusFilter}`).then(res => res.json()),
  });

  // Fetch transaction feed
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/escrow/transactions'],
    queryFn: () => fetch('/api/escrow/transactions').then(res => res.json()),
    refetchInterval: 10000,
  });

  // Fetch token monitoring data
  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/escrow/tokens'],
    queryFn: () => fetch('/api/escrow/tokens').then(res => res.json()),
  });

  // Fetch smart contract registry
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/escrow/contracts'],
    queryFn: () => fetch('/api/escrow/contracts').then(res => res.json()),
  });

  // Fetch referral activity data
  const { data: referralStats, isLoading: referralStatsLoading } = useQuery({
    queryKey: ['/api/escrow/referrals/stats'],
    queryFn: () => fetch('/api/escrow/referrals/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch referral activity list
  const { data: referralActivity, isLoading: referralActivityLoading } = useQuery({
    queryKey: ['/api/escrow/referrals/activity'],
    queryFn: () => fetch('/api/escrow/referrals/activity').then(res => res.json()),
    refetchInterval: 15000,
  });

  // Fetch finance pools data
  const { data: financeStats, isLoading: financeStatsLoading } = useQuery({
    queryKey: ['/api/finance/stats'],
    queryFn: () => fetch('/api/finance/stats').then(res => res.json()),
    refetchInterval: 30000,
  });

  // Fetch finance pools list
  const { data: financePools, isLoading: financePoolsLoading } = useQuery({
    queryKey: ['/api/finance/pools'],
    queryFn: () => fetch('/api/finance/pools').then(res => res.json()),
    refetchInterval: 20000,
  });

  // Fetch active loans
  const { data: financeLoans, isLoading: financeLoansLoading } = useQuery({
    queryKey: ['/api/finance/loans'],
    queryFn: () => fetch('/api/finance/loans').then(res => res.json()),
    refetchInterval: 25000,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BlockFinaX Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Self-Custody Escrow Platform Monitoring & Analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="default">
            <Globe className="h-3 w-3 mr-1" />
            {stats?.networkStatus || 'Sepolia Testnet'}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="escrows">Escrows</TabsTrigger>
          <TabsTrigger value="transactions">Feed</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="finance">Finance Pools</TabsTrigger>
          <TabsTrigger value="referrals">Rewards</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={stats} escrows={escrows} tokens={tokens} />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab users={users} isLoading={usersLoading} onViewUser={setSelectedUser} />
        </TabsContent>

        <TabsContent value="escrows">
          <EscrowsTab 
            escrows={escrows} 
            isLoading={escrowsLoading} 
            statusFilter={statusFilter} 
            onStatusFilterChange={setStatusFilter}
            onViewEscrow={setSelectedEscrow} 
          />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionFeedTab transactions={transactions} isLoading={transactionsLoading} />
        </TabsContent>

        <TabsContent value="tokens">
          <TokensTab tokens={tokens} isLoading={tokensLoading} />
        </TabsContent>

        <TabsContent value="contracts">
          <ContractsTab contracts={contracts} isLoading={contractsLoading} />
        </TabsContent>

        <TabsContent value="finance">
          <FinancePoolsTab 
            stats={financeStats} 
            pools={financePools} 
            loans={financeLoans} 
            isLoading={financeStatsLoading || financePoolsLoading || financeLoansLoading} 
          />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralsTab 
            stats={referralStats} 
            activity={referralActivity} 
            isLoading={referralStatsLoading || referralActivityLoading} 
          />
        </TabsContent>

        <TabsContent value="kyc">
          <KycTab users={users} isLoading={usersLoading} onViewUser={setSelectedUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}