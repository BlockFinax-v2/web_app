import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { UserActivity } from "./types";
import { formatAddress } from "./constants";

interface KycTabProps {
  users?: UserActivity[];
  isLoading: boolean;
  onViewUser: (address: string) => void;
}

export function KycTab({ users, isLoading, onViewUser }: KycTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading KYC data...</div>;
  }

  const filteredUsers = Array.isArray(users) ? users : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">KYC Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Approved</span>
                <Badge className="bg-green-100 text-green-800">
                  {filteredUsers.filter(u => u.kycStatus === 'approved').length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Pending</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {filteredUsers.filter(u => u.kycStatus === 'pending').length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Failed</span>
                <Badge className="bg-red-100 text-red-800">
                  {filteredUsers.filter(u => u.kycStatus === 'failed').length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredUsers.length > 0 ? 
                Math.round((filteredUsers.filter(u => u.kycStatus === 'approved').length / filteredUsers.length) * 100) : 0
              }%
            </div>
            <p className="text-sm text-muted-foreground">Users with approved KYC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {filteredUsers.filter(u => u.kycStatus === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KYC Status by User</CardTitle>
          <CardDescription>View-only KYC verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: UserActivity) => (
                <TableRow key={user.walletAddress}>
                  <TableCell className="font-mono">
                    {formatAddress(user.walletAddress)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      user.kycStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {user.kycStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.lastActivity).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onViewUser(user.walletAddress)}>
                      <Eye className="h-4 w-4" />
                    </Button>
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
