import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, BarChart3, Clock, Activity, Eye } from "lucide-react";
import { ReferralStats, ReferralActivity } from "./types";
import { formatCurrency, formatAddress } from "./constants";

interface ReferralsTabProps {
  stats?: ReferralStats;
  activity?: ReferralActivity[];
  isLoading: boolean;
}

export function ReferralsTab({ stats, activity, isLoading }: ReferralsTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading referral data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">
              All-time referral sign-ups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeReferrers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users actively referring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Referrals to active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Sign-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentSignups || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Referral Sources</CardTitle>
            <CardDescription>Where new users are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(stats?.topReferralSources) && 
                stats.topReferralSources.map((source: any) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {source.source}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{source.count}</div>
                    <div className="text-xs text-muted-foreground">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referral Rewards</CardTitle>
            <CardDescription>Total rewards distributed to referrers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats?.totalRewardsDistributed || "0")}
                </div>
                <p className="text-sm text-muted-foreground">Total rewards paid</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending rewards</span>
                  <span className="font-semibold">$2,450.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Average per referrer</span>
                  <span className="font-semibold">$125.50</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Real-time Referral Activity</span>
          </CardTitle>
          <CardDescription>Live tracking of new account creation and referral events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(activity) && activity.map((act: ReferralActivity) => (
              <div key={act.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">New Account</Badge>
                    <Badge className={
                      act.status === 'completed' ? 'bg-green-100 text-green-800' :
                      act.status === 'rewarded' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {act.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground capitalize">
                      via {act.referralSource}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-mono text-sm">
                      <span className="text-muted-foreground">Referrer:</span> {formatAddress(act.referrerAddress)}
                    </div>
                    <div className="font-mono text-sm">
                      <span className="text-muted-foreground">New User:</span> {formatAddress(act.referredAddress)}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Code:</span> {act.referralCode}
                    </div>
                    {act.firstEscrowCreated && act.totalEscrowValue && (
                      <div className="text-sm text-green-600 font-medium">
                        ✓ First escrow created: {act.totalEscrowValue}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(act.accountCreatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  {act.rewardAmount ? (
                    <div className="font-semibold text-green-600">
                      +{act.rewardAmount} {act.rewardToken}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No reward
                    </div>
                  )}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {(!activity || activity.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No recent referral activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
