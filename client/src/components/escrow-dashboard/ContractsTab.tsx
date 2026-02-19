import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { SmartContract } from "./types";
import { formatAddress } from "./constants";

interface ContractsTabProps {
  contracts?: SmartContract[];
  isLoading: boolean;
}

export function ContractsTab({ contracts, isLoading }: ContractsTabProps) {
  if (isLoading) {
    return <div className="text-center py-12">Loading contract registry...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Contract Registry</CardTitle>
        <CardDescription>Deployed escrow contracts and metadata</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract Address</TableHead>
              <TableHead>Deployer</TableHead>
              <TableHead>ABI Version</TableHead>
              <TableHead>Active Instances</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(contracts) && contracts.map((contract: SmartContract) => (
              <TableRow key={contract.contractAddress}>
                <TableCell className="font-mono">
                  {formatAddress(contract.contractAddress)}
                </TableCell>
                <TableCell className="font-mono">
                  {formatAddress(contract.deployer)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{contract.abiVersion}</Badge>
                </TableCell>
                <TableCell>{contract.activeInstances}</TableCell>
                <TableCell>
                  <Badge className={contract.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {contract.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`https://sepolia.etherscan.io/address/${contract.contractAddress}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {contract.auditLink && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(contract.auditLink, '_blank')}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
