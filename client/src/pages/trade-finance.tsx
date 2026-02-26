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
  Wallet,
  Briefcase
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
    queryKey: ["pga", "buyer", address],
    queryFn: async () => {
      if (!address) return [];
      try {
        const { tradeFinanceService } = await import("@/services/tradeFinanceService");
        return await tradeFinanceService.getPGAsByBuyer(address);
      } catch (err) {
        console.error("Failed to fetch buyer PGAs:", err);
        return [];
      }
    },
    enabled: !!address,
  });

  const { data: sellerApps = [], isLoading: sellerLoading } = useQuery<any[]>({
    queryKey: ["pga", "seller", address],
    queryFn: async () => {
      if (!address) return [];
      try {
        const { tradeFinanceService } = await import("@/services/tradeFinanceService");
        return await tradeFinanceService.getAllPGAsBySeller(address);
      } catch (err) {
        console.error("Failed to fetch seller PGAs:", err);
        return [];
      }
    },
    enabled: !!address,
  });

  if (!wallet) {
    return (
      <div className="min-h-screen bg-background/80 flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-2xl border border-white/10 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardContent className="pt-8 pb-8 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 mx-auto mb-5">
              <Handshake className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight mb-2">Wallet Required</h2>
            <p className="text-muted-foreground text-sm mb-6">Connect your wallet to access Trade Finance</p>
            <Link href="/wallet">
              <Button className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"><Wallet className="h-4 w-4 mr-2" /> Go to Wallet</Button>
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
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/wallet")} className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5">
              <TrendingUpIcon className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Trade Finance</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Apply for financing and receive competitive offers</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={userRole} onValueChange={(v: "buyer" | "seller") => setUserRole(v)}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-white/10 bg-card/60 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer / Importer</SelectItem>
                <SelectItem value="seller">Seller / Exporter</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs font-medium border-primary/30 text-primary">Matchmaking</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatsCard icon={<FileTextIcon className="h-4 w-4 text-blue-500" />} label="Active Applications" value={activeApps.length} />
          <StatsCard icon={<Users className="h-4 w-4 text-amber-500" />} label="Offers Received" value={offersCount} />
          <StatsCard icon={<CheckCircleIcon className="h-4 w-4 text-green-500" />} label="Funded Trades" value={fundedCount} />
          <StatsCard icon={<DollarSignIcon className="h-4 w-4 text-emerald-500" />} label="Total Volume" value={`$${totalVolume.toLocaleString()}`} sub="USDC" />
        </div>

        {userRole === "seller" ? (
          <Tabs defaultValue="seller" className="space-y-6">
            <TabsList className="inline-flex h-12 rounded-2xl bg-card/60 border border-white/10 p-1.5 backdrop-blur-sm w-full sm:w-auto">
              <TabsTrigger value="seller" className="rounded-xl px-5 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200 flex-1 sm:flex-initial">
                <Package className="h-4 w-4 mr-2" /> Seller Dashboard
              </TabsTrigger>
            </TabsList>
            <TabsContent value="seller" className="mt-6">
              <SellerDashboardTab applications={sellerApps} isLoading={sellerLoading} walletAddress={address!} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="apply" className="space-y-6">
            <TabsList className="inline-flex h-12 rounded-2xl bg-card/60 border border-white/10 p-1.5 backdrop-blur-sm">
              <TabsTrigger value="apply" className="rounded-xl px-5 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
                <Send className="h-4 w-4 mr-2" /> Apply
              </TabsTrigger>
              <TabsTrigger value="applications" className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
                <FileText className="h-4 w-4 mr-2" /> My Apps
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25 transition-all duration-200">
                <Star className="h-4 w-4 mr-2" /> Offers
              </TabsTrigger>
            </TabsList>
            <TabsContent value="apply" className="mt-6">
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
    </>
  );
}