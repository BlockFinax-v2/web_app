import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, ExternalLink } from "lucide-react";
import { EscrowData } from "./types";
import { formatAddress, getStatusColor } from "./constants";

interface EscrowsTabProps {
  escrows?: EscrowData[];
  isLoading: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onViewEscrow: (id: string) => void;
}

export function EscrowsTab({ 
  escrows, 
  isLoading, 
  statusFilter, 
  onStatusFilterChange, 
  onViewEscrow 
}: EscrowsTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading escrows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Escrows
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escrow Analytics</CardTitle>
          <CardDescription>Detailed escrow tracking and monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escrow ID</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(escrows) && escrows.map((escrow: EscrowData) => (
                <TableRow key={escrow.id}>
                  <TableCell className="font-mono text-sm">
                    {escrow.escrowId}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>E: {formatAddress(escrow.exporter)}</div>
                      <div>I: {formatAddress(escrow.importer)}</div>
                      {escrow.financier && (
                        <div>F: {formatAddress(escrow.financier)}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {parseFloat(escrow.amount).toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{escrow.tokenSymbol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(escrow.status)}>
                      {escrow.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(escrow.createdDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewEscrow(escrow.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`https://sepolia.etherscan.io/address/${escrow.contractAddress}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
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
