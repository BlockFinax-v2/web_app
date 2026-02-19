import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { useLocation as useWouterLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUpIcon,
  FileTextIcon,
  CheckCircleIcon,
  DollarSignIcon,
  Handshake,
  Users,
  Package,
  Send,
  FileText,
  Star,
  Wallet
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";

// Modular Components
import { StatsCard } from "@/components/trade-finance/StatsCard";
import { ApplicationForm } from "@/components/trade-finance/ApplicationForm";
import { MyApplicationsTab } from "@/components/trade-finance/MyApplicationsTab";
import { SellerDashboardTab } from "@/components/trade-finance/SellerDashboardTab";
import { OffersTab } from "@/components/trade-finance/OffersTab";
import { 
  getProgressIndex, 
  getStatusLabel, 
  getStatusColor 
} from "@/components/trade-finance/constants";

export default function TradeFinancePage() {
  const { wallet, address } = useWallet();
  const { toast } = useToast();
  const [, setLocation] = useWouterLocation();
  const [userRole, setUserRole] = useState<"buyer" | "seller">("buyer");

  const { data: buyerApps = [], isLoading: buyerLoading } = useQuery<any[]>({
    queryKey: ["/api/trade-finance/applications", "buyer", address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/trade-finance/applications?buyerAddress=${address}`, { credentials: "include" });
      if (!res.ok) { if (res.status === 404) return []; throw new Error("Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  const { data: sellerApps = [], isLoading: sellerLoading } = useQuery<any[]>({
    queryKey: ["/api/trade-finance/applications", "seller", address],
    queryFn: async () => {
      if (!address) return [];
      const res = await fetch(`/api/trade-finance/applications?sellerAddress=${address}`, { credentials: "include" });
      if (!res.ok) { if (res.status === 404) return []; throw new Error("Failed"); }
      return res.json();
    },
    enabled: !!address,
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Handshake className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">Connect your wallet to access Trade Finance</p>
            <Link href="/wallet">
              <Button><Wallet className="h-4 w-4 mr-2" /> Go to Wallet</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeApps = buyerApps.filter((a: any) => !["completed", "seller_confirmed_payment", "seller_rejected", "cancelled"].includes(a.status));
  const offersCount = buyerApps.filter((a: any) => ["seller_approved", "offers_received", "offer_accepted"].includes(a.status)).length;
  const fundedCount = buyerApps.filter((a: any) => getProgressIndex(a.status) >= 2).length;
  const totalVolume = buyerApps.reduce((sum: number, a: any) => sum + parseFloat(a.requestedAmount || "0"), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/wallet")} className="text-muted-foreground hover:text-foreground -ml-2">
              <TrendingUpIcon className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold tracking-tight">Trade Finance</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select value={userRole} onValueChange={(v: "buyer" | "seller") => setUserRole(v)}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer / Importer</SelectItem>
                <SelectItem value="seller">Seller / Exporter</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs font-normal">Matchmaking</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard icon={<FileTextIcon className="h-4 w-4 text-blue-500" />} label="Active Applications" value={activeApps.length} />
          <StatsCard icon={<Users className="h-4 w-4 text-amber-500" />} label="Offers Received" value={offersCount} />
          <StatsCard icon={<CheckCircleIcon className="h-4 w-4 text-green-500" />} label="Funded Trades" value={fundedCount} />
          <StatsCard icon={<DollarSignIcon className="h-4 w-4 text-emerald-500" />} label="Total Volume" value={`$${totalVolume.toLocaleString()}`} sub="USDC" />
        </div>

        {userRole === "seller" ? (
          <Tabs defaultValue="seller" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="seller"><Package className="h-3.5 w-3.5 mr-1.5" />Seller Dashboard</TabsTrigger>
            </TabsList>
            <TabsContent value="seller">
              <SellerDashboardTab applications={sellerApps} isLoading={sellerLoading} walletAddress={address!} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="apply" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="apply"><Send className="h-3.5 w-3.5 mr-1.5" />Apply</TabsTrigger>
              <TabsTrigger value="applications"><FileText className="h-3.5 w-3.5 mr-1.5" />My Apps</TabsTrigger>
              <TabsTrigger value="offers"><Star className="h-3.5 w-3.5 mr-1.5" />Offers</TabsTrigger>
            </TabsList>
            <TabsContent value="apply">
              <ApplicationForm walletAddress={address!} />
            </TabsContent>
            <TabsContent value="applications">
              <MyApplicationsTab applications={buyerApps} isLoading={buyerLoading} walletAddress={address!} />
            </TabsContent>
            <TabsContent value="offers">
              <OffersTab applications={buyerApps} isLoading={buyerLoading} walletAddress={address!} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}