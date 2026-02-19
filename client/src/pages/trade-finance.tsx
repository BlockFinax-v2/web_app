import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useWallet } from "@/hooks/use-wallet";
import { secureStorage } from "@/lib/encrypted-storage";
import { getNetworkById } from "@/lib/networks";
import { usdcManager } from "@/lib/usdc-manager";
import { useLocation as useWouterLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/api-client";
import {
  TrendingUpIcon,
  FileTextIcon,
  CheckCircleIcon,
  Clock,
  DollarSignIcon,
  Loader2,
  Shield,
  UserIcon,
  BuildingIcon,
  Wallet,
  Upload,
  CheckCircle2,
  TruckIcon,
  FileText,
  AlertCircle,
  Package,
  ArrowRight,
  Users,
  Send,
  Eye,
  Star,
  XCircle,
  Handshake
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";

const PROGRESS_STEPS = [
  "Applied",
  "Offers Received",
  "Offer Accepted",
  "Documents Verified",
  "Goods Shipped",
  "Delivery Confirmed",
  "Payment Complete",
];

const FINANCING_TYPE_LABELS: Record<string, string> = {
  letter_of_credit: "Letter of Credit (LC)",
  bank_guarantee: "Bank Guarantee (BG)",
  invoice_discounting: "Invoice Discounting",
  invoice_factoring: "Invoice Factoring",
  supply_chain_finance: "Supply Chain Finance",
  pre_export_finance: "Pre-Export Finance",
  post_import_finance: "Post-Import Finance",
  trade_credit_insurance: "Trade Credit Insurance",
  forfaiting: "Forfaiting",
  documentary_collection: "Documentary Collection",
  warehouse_receipt_finance: "Warehouse Receipt Finance",
  purchase_order_finance: "Purchase Order Finance",
};

const FINANCING_TYPE_DESCRIPTIONS: Record<string, string> = {
  letter_of_credit: "Bank-issued guarantee of payment to the seller upon presentation of compliant shipping documents.",
  bank_guarantee: "Bank commitment to cover a loss if the buyer fails to fulfill contractual obligations.",
  invoice_discounting: "Advance cash against unpaid invoices while retaining control of your sales ledger.",
  invoice_factoring: "Sell your receivables to a factor who collects payment from your buyers directly.",
  supply_chain_finance: "Buyer-led financing that lets suppliers get early payment on approved invoices.",
  pre_export_finance: "Working capital loan to fund production and preparation of goods before export.",
  post_import_finance: "Short-term financing for importers to pay suppliers while awaiting resale proceeds.",
  trade_credit_insurance: "Insurance policy protecting against buyer non-payment due to insolvency or political risk.",
  forfaiting: "Purchase of medium/long-term receivables at a discount, transferring all risk to the forfaiter.",
  documentary_collection: "Bank-intermediated exchange of shipping documents against payment or acceptance.",
  warehouse_receipt_finance: "Loan secured against commodities stored in a certified warehouse.",
  purchase_order_finance: "Funding to pay suppliers based on confirmed purchase orders from creditworthy buyers.",
};

function getProgressIndex(status: string): number {
  const map: Record<string, number> = {
    pending_draft: 0,
    draft_sent_to_seller: 0,
    seller_approved: 1,
    offers_received: 1,
    offer_accepted: 2,
    awaiting_fee_payment: 2,
    fee_paid: 3,
    documents_verified: 3,
    approved: 3,
    goods_shipped: 4,
    bol_uploaded: 4,
    buyer_payment_uploaded: 4,
    seller_payment_confirmed: 4,
    seller_bol_uploaded: 4,
    delivery_confirmed: 5,
    buyer_confirmed_delivery: 5,
    payment_complete: 6,
    completed: 6,
    seller_confirmed_payment: 6,
  };
  return map[status] ?? 0;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_draft: "Application Submitted",
    draft_sent_to_seller: "Sent to Seller",
    seller_approved: "Seller Approved",
    seller_rejected: "Seller Rejected",
    offers_received: "Offers Available",
    offer_accepted: "Offer Accepted",
    awaiting_fee_payment: "Awaiting Fee",
    fee_paid: "Fee Paid",
    approved: "Approved",
    documents_verified: "Docs Verified",
    goods_shipped: "Goods Shipped",
    bol_uploaded: "BoL Uploaded",
    buyer_payment_uploaded: "Payment Sent",
    seller_payment_confirmed: "Payment Confirmed",
    seller_bol_uploaded: "Shipped",
    delivery_confirmed: "Delivered",
    buyer_confirmed_delivery: "Delivery Confirmed",
    payment_complete: "Complete",
    completed: "Complete",
    seller_confirmed_payment: "Payment Confirmed",
  };
  return labels[status] || status.replace(/_/g, " ").toUpperCase();
}

function getStatusColor(status: string): string {
  if (status.includes("rejected") || status.includes("cancelled")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  if (status.includes("complete") || status.includes("confirmed")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (status.includes("approved") || status.includes("accepted")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
}

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

function StatsCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-background rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressTracker({ status }: { status: string }) {
  const current = getProgressIndex(status);
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {PROGRESS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center shrink-0">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
            i < current ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            i === current ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-muted text-muted-foreground"
          }`}>
            {i < current ? <CheckCircle2 className="h-3 w-3" /> : <span className="w-3 h-3 flex items-center justify-center">{i + 1}</span>}
            <span className="hidden sm:inline">{step}</span>
          </div>
          {i < PROGRESS_STEPS.length - 1 && <ArrowRight className="h-3 w-3 mx-0.5 text-muted-foreground shrink-0" />}
        </div>
      ))}
    </div>
  );
}

interface UploadedFile {
  file: File;
  documentType: string;
  preview: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function computeHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function ApplicationForm({ walletAddress }: { walletAddress: string }) {
  const { toast } = useToast();
  const [financingType, setFinancingType] = useState("letter_of_credit");
  const [buyerCompanyName, setBuyerCompanyName] = useState("");
  const [buyerRegistrationNumber, setBuyerRegistrationNumber] = useState("");
  const [buyerCountry, setBuyerCountry] = useState("");
  const [buyerContactPerson, setBuyerContactPerson] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [tradeDescription, setTradeDescription] = useState("");
  const [tradeValue, setTradeValue] = useState("");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [collateralType, setCollateralType] = useState("none");
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [sellerAddress, setSellerAddress] = useState("");
  const [requestedDuration, setRequestedDuration] = useState("90");
  const [salesContractNumber, setSalesContractNumber] = useState("");
  const [salesContractDate, setSalesContractDate] = useState("");
  const [proformaInvoice, setProformaInvoice] = useState<UploadedFile | null>(null);
  const [salesContract, setSalesContract] = useState<UploadedFile | null>(null);

  const settings = secureStorage.loadSettings();
  const activeNetworkId = settings.selectedNetworkId || 1;
  const activeNetwork = getNetworkById(activeNetworkId);
  const chainId = activeNetwork?.chainId || 84532;

  useEffect(() => {
    if (collateralType === "wallet_balance" && walletAddress) {
      setBalanceLoading(true);
      usdcManager.getUSDCBalance(walletAddress, chainId).then((balance) => {
        setWalletBalance(balance);
        setBalanceLoading(false);
      }).catch(() => {
        setWalletBalance("0");
        setBalanceLoading(false);
      });
    } else {
      setWalletBalance(null);
    }
  }, [collateralType, walletAddress, chainId]);

  const calculatedFee = requestedAmount ? (parseFloat(requestedAmount) * 0.01).toFixed(2) : "0.00";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: "proforma_invoice" | "sales_contract") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum file size is 10 MB", variant: "destructive" });
      return;
    }
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF or image file (PNG, JPG)", variant: "destructive" });
      return;
    }
    const uploaded: UploadedFile = { file, documentType: docType, preview: file.name };
    if (docType === "proforma_invoice") setProformaInvoice(uploaded);
    else setSalesContract(uploaded);
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!proformaInvoice || !salesContract) {
        throw new Error("Both Proforma Invoice and Sales Contract are required");
      }
      const documents = await Promise.all(
        [proformaInvoice, salesContract].map(async (doc) => {
          const data = await fileToBase64(doc.file);
          const hash = await computeHash(doc.file);
          return {
            documentType: doc.documentType,
            fileName: doc.file.name,
            fileSize: doc.file.size,
            mimeType: doc.file.type,
            data,
            hash,
          };
        })
      );
      return await apiRequest("POST", "/api/trade-finance/applications", {
        buyerAddress: walletAddress.toLowerCase(),
        financingType,
        buyerCompanyName,
        buyerRegistrationNumber,
        buyerCountry,
        buyerContactPerson,
        buyerEmail,
        buyerPhone,
        sellerAddress: sellerAddress.toLowerCase(),
        tradeDescription,
        tradeValue,
        requestedAmount,
        collateralDescription: collateralType === "wallet_balance" ? "Wallet Balance" : "No Collateral",
        collateralValue: collateralType === "wallet_balance" ? (walletBalance || "0") : "0",
        requestedDuration: parseInt(requestedDuration),
        salesContractNumber,
        salesContractDate,
        documents,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      toast({ title: "Application Submitted", description: "Your trade financing application has been submitted with documents. Financiers will review and send offers." });
      setFinancingType("letter_of_credit"); setBuyerCompanyName(""); setBuyerRegistrationNumber(""); setBuyerCountry("");
      setBuyerContactPerson(""); setBuyerEmail(""); setBuyerPhone("");
      setTradeDescription(""); setTradeValue(""); setRequestedAmount("");
      setCollateralType("none"); setWalletBalance(null); setSellerAddress("");
      setRequestedDuration("90"); setSalesContractNumber(""); setSalesContractDate("");
      setProformaInvoice(null); setSalesContract(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit application", variant: "destructive" });
    },
  });

  const canSubmit = buyerCompanyName && buyerCountry && sellerAddress && tradeDescription && requestedAmount && tradeValue && proformaInvoice && salesContract;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          Apply for Trade Financing
        </CardTitle>
        <CardDescription>
          Submit your trade details. BlockFinaX will match you with financiers who will compete to offer you the best terms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Handshake className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Apply → Receive Offers from Financiers → Compare and Select Best Offer → Platform Fee: 1%
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4" /> Financing Instrument *</h3>
          <Select value={financingType} onValueChange={setFinancingType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select financing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="letter_of_credit">Letter of Credit (LC)</SelectItem>
              <SelectItem value="bank_guarantee">Bank Guarantee (BG)</SelectItem>
              <SelectItem value="invoice_discounting">Invoice Discounting</SelectItem>
              <SelectItem value="invoice_factoring">Invoice Factoring</SelectItem>
              <SelectItem value="supply_chain_finance">Supply Chain Finance</SelectItem>
              <SelectItem value="pre_export_finance">Pre-Export Finance</SelectItem>
              <SelectItem value="post_import_finance">Post-Import Finance</SelectItem>
              <SelectItem value="trade_credit_insurance">Trade Credit Insurance</SelectItem>
              <SelectItem value="forfaiting">Forfaiting</SelectItem>
              <SelectItem value="documentary_collection">Documentary Collection</SelectItem>
              <SelectItem value="warehouse_receipt_finance">Warehouse Receipt Finance</SelectItem>
              <SelectItem value="purchase_order_finance">Purchase Order Finance</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1.5">{FINANCING_TYPE_DESCRIPTIONS[financingType] || ""}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><UserIcon className="h-4 w-4" /> Buyer / Importer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Company Name *</Label><Input value={buyerCompanyName} onChange={(e) => setBuyerCompanyName(e.target.value)} placeholder="Your company name" /></div>
            <div><Label>Registration Number</Label><Input value={buyerRegistrationNumber} onChange={(e) => setBuyerRegistrationNumber(e.target.value)} placeholder="Business registration #" /></div>
            <div><Label>Country</Label><Input value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} placeholder="Country of operation" /></div>
            <div><Label>Contact Person</Label><Input value={buyerContactPerson} onChange={(e) => setBuyerContactPerson(e.target.value)} placeholder="Primary contact" /></div>
            <div><Label>Email</Label><Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="contact@company.com" /></div>
            <div><Label>Phone</Label><Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+1 234 567 890" /></div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><BuildingIcon className="h-4 w-4" /> Seller / Exporter</h3>
          <div><Label>Seller Wallet Address *</Label><Input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder="0x..." className="font-mono" /></div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileTextIcon className="h-4 w-4" /> Trade Details</h3>
          <div className="space-y-4">
            <div><Label>Trade Description *</Label><Textarea value={tradeDescription} onChange={(e) => setTradeDescription(e.target.value)} placeholder="Describe the goods/services being traded" rows={3} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Trade Value (USDC) *</Label><Input type="number" value={tradeValue} onChange={(e) => setTradeValue(e.target.value)} placeholder="Total trade value" /></div>
              <div><Label>Requested Financing (USDC) *</Label><Input type="number" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} placeholder="Amount needed" /></div>
              <div>
                <Label>Collateral</Label>
                <Select value={collateralType} onValueChange={setCollateralType}>
                  <SelectTrigger><SelectValue placeholder="Select collateral type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet_balance">Wallet Balance</SelectItem>
                    <SelectItem value="none">No Collateral</SelectItem>
                  </SelectContent>
                </Select>
                {collateralType === "wallet_balance" ? (
                  <div className="mt-2 bg-muted rounded-md p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">USDC Balance ({activeNetwork?.name || "Base Sepolia"})</span>
                    {balanceLoading ? (
                      <span className="text-sm flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Fetching...</span>
                    ) : (
                      <span className="text-sm font-semibold">{walletBalance ? `${parseFloat(walletBalance).toFixed(2)} USDC` : "0.00 USDC"}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No collateral pledged — financiers will assess risk accordingly</p>
                )}
              </div>
              <div>
                <Label>Duration (days)</Label>
                <Select value={requestedDuration} onValueChange={setRequestedDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="120">120 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Sales Contract Number</Label><Input value={salesContractNumber} onChange={(e) => setSalesContractNumber(e.target.value)} placeholder="SC-2026-001" /></div>
            </div>
            {salesContractNumber && (
              <div><Label>Contract Date</Label><Input type="date" value={salesContractDate} onChange={(e) => setSalesContractDate(e.target.value)} /></div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Upload className="h-4 w-4" /> Required Documents *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proforma Invoice *</Label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${proformaInvoice ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25 hover:border-primary/50"}`}>
                {proformaInvoice ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm truncate">{proformaInvoice.preview}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setProformaInvoice(null)} className="shrink-0 text-muted-foreground h-7 px-2">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Click to upload proforma invoice</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, or JPG (max 10 MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileSelect(e, "proforma_invoice")} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sales Contract *</Label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${salesContract ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-muted-foreground/25 hover:border-primary/50"}`}>
                {salesContract ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm truncate">{salesContract.preview}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSalesContract(null)} className="shrink-0 text-muted-foreground h-7 px-2">
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Click to upload sales contract</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, or JPG (max 10 MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileSelect(e, "sales_contract")} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {requestedAmount && parseFloat(requestedAmount) > 0 && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Requested Financing</span><span className="font-semibold">${parseFloat(requestedAmount).toLocaleString()} USDC</span></div>
            <div className="flex justify-between text-sm"><span>Platform Fee (1%)</span><span className="font-semibold">${calculatedFee} USDC</span></div>
            <div className="border-t pt-2 flex justify-between text-sm font-semibold"><span>Fee Due on Acceptance</span><span>${calculatedFee} USDC</span></div>
          </div>
        )}

        <Button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending} className="w-full">
          {submitMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4 mr-2" /> Submit Application</>}
        </Button>
      </CardContent>
    </Card>
  );
}

function MyApplicationsTab({ applications, isLoading, walletAddress }: { applications: any[]; isLoading: boolean; walletAddress: string }) {
  const [selectedApp, setSelectedApp] = useState<any>(null);

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="text-muted-foreground mt-2">Loading applications...</p></div>;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No applications yet</p>
          <p className="text-sm text-muted-foreground mt-1">Submit a trade financing application to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {selectedApp ? (
        <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} walletAddress={walletAddress} role="buyer" />
      ) : (
        applications.map((app: any) => (
          <Card key={app.requestId || app.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedApp(app)}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{app.buyerCompanyName || "Trade Application"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.tradeDescription?.substring(0, 80) || "No description"}...</p>
                </div>
                <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"}</Badge>
                <span className="flex items-center gap-1"><DollarSignIcon className="h-3 w-3" /> ${parseFloat(app.requestedAmount || "0").toLocaleString()}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {app.requestedDuration || 90} days</span>
                <span className="flex items-center gap-1"><BuildingIcon className="h-3 w-3" /> {app.sellerAddress?.substring(0, 8)}...</span>
              </div>
              <ProgressTracker status={app.status} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function SellerDashboardTab({ applications, isLoading, walletAddress }: { applications: any[]; isLoading: boolean; walletAddress: string }) {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/trade-finance/applications/${requestId}/approve`, { sellerAddress: walletAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Approved", description: "Trade application approved. Buyer can now receive financing offers." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/trade-finance/applications/${requestId}/reject`, { sellerAddress: walletAddress, rejectionReason: "Seller rejected" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Rejected", description: "Trade application rejected." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/trade-finance/applications/${requestId}/seller-confirm-payment`, { sellerAddress: walletAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Payment Confirmed", description: "Payment receipt confirmed successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No trades where you are the seller</p>
          <p className="text-sm text-muted-foreground mt-1">Buyers will add your wallet address when applying for financing</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedApp) {
    return <ApplicationDetail app={selectedApp} onBack={() => setSelectedApp(null)} walletAddress={walletAddress} role="seller" />;
  }

  return (
    <div className="space-y-4">
      {applications.map((app: any) => (
        <Card key={app.requestId || app.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="cursor-pointer" onClick={() => setSelectedApp(app)}>
                <p className="font-semibold text-sm">{app.buyerCompanyName || "Trade Application"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From: {app.buyerAddress?.substring(0, 10)}...</p>
              </div>
              <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"}</Badge>
              <span>${parseFloat(app.requestedAmount || "0").toLocaleString()} USDC</span>
              <span>{app.requestedDuration || 90} days</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{app.tradeDescription?.substring(0, 120)}</p>

            <ProgressTracker status={app.status} />

            <div className="flex gap-2 mt-3">
              {app.status === "draft_sent_to_seller" && (
                <>
                  <Button size="sm" onClick={() => approveMutation.mutate(app.requestId)} disabled={approveMutation.isPending}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(app.requestId)} disabled={rejectMutation.isPending}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </>
              )}
              {(app.status === "buyer_payment_uploaded" || app.status === "seller_payment_confirmed") && (
                <Button size="sm" onClick={() => confirmPaymentMutation.mutate(app.requestId)} disabled={confirmPaymentMutation.isPending}>
                  <DollarSignIcon className="h-3.5 w-3.5 mr-1" /> Confirm Payment
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelectedApp(app)}>
                <Eye className="h-3.5 w-3.5 mr-1" /> Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OffersTab({ applications, isLoading, walletAddress }: { applications: any[]; isLoading: boolean; walletAddress: string }) {
  const appsWithOffers = applications.filter((a: any) => ["seller_approved", "offers_received", "offer_accepted", "awaiting_fee_payment", "fee_paid", "approved"].includes(a.status));

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (appsWithOffers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No offers yet</p>
          <p className="text-sm text-muted-foreground mt-1">Offers will appear here once financiers review your applications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {appsWithOffers.map((app: any) => (
        <div key={app.requestId || app.id}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold">{app.buyerCompanyName || "Application"}</h3>
            <Badge variant="outline" className="text-xs">${parseFloat(app.requestedAmount || "0").toLocaleString()}</Badge>
          </div>
          <OffersForApplication requestId={app.requestId} walletAddress={walletAddress} />
        </div>
      ))}
    </div>
  );
}

function OffersForApplication({ requestId, walletAddress }: { requestId: string; walletAddress: string }) {
  const { toast } = useToast();

  const { data: offers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/financing/offers", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/financing/offers/${requestId}`, { credentials: "include" });
      if (!res.ok) { if (res.status === 404) return []; throw new Error("Failed to fetch offers"); }
      return res.json();
    },
    enabled: !!requestId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest("POST", `/api/financing/offers/${offerId}/accept`, { buyerAddress: walletAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/offers", requestId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      toast({ title: "Offer Accepted", description: "You have accepted the financing offer. The trade will proceed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest("POST", `/api/financing/offers/${offerId}/reject`, { buyerAddress: walletAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financing/offers", requestId] });
      toast({ title: "Offer Rejected", description: "Offer has been declined." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>;
  }

  if (offers.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Waiting for financier offers...</p>
        <p className="text-xs text-muted-foreground mt-1">Financiers are reviewing your application</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers.map((offer: any) => (
        <Card key={offer.id} className={`border-2 ${offer.status === "accepted" ? "border-green-500" : "border-transparent hover:border-primary/30"} transition-colors`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm">{offer.financierName || "Financier"}</CardTitle>
                <CardDescription className="text-xs">{offer.financierType || "Trade Finance"}</CardDescription>
              </div>
              <Badge className={offer.status === "accepted" ? "bg-green-100 text-green-800" : offer.status === "rejected" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                {offer.status === "accepted" ? "Accepted" : offer.status === "rejected" ? "Rejected" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Amount</p>
                <p className="text-sm font-bold">${parseFloat(offer.amount || "0").toLocaleString()}</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Interest Rate</p>
                <p className="text-sm font-bold">{offer.interestRate || "—"}%</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Tenor</p>
                <p className="text-sm font-bold">{offer.tenor || "—"} days</p>
              </div>
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Fees</p>
                <p className="text-sm font-bold">{offer.fees || "—"}</p>
              </div>
            </div>

            {offer.conditions && (
              <div className="bg-muted rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground">Conditions</p>
                <p className="text-xs mt-0.5">{offer.conditions}</p>
              </div>
            )}

            {offer.expiresAt && (
              <p className="text-[10px] text-muted-foreground">
                Expires: {new Date(offer.expiresAt).toLocaleDateString()}
              </p>
            )}

            {offer.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1" onClick={() => acceptMutation.mutate(offer.id)} disabled={acceptMutation.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => rejectMutation.mutate(offer.id)} disabled={rejectMutation.isPending}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ApplicationDetail({ app, onBack, walletAddress, role }: { app: any; onBack: () => void; walletAddress: string; role: "buyer" | "seller" }) {
  const { toast } = useToast();
  const [bolNumber, setBolNumber] = useState("");
  const [bolTrackingNumber, setBolTrackingNumber] = useState("");
  const [bolLogisticsProvider, setBolLogisticsProvider] = useState("");
  const [deliveryCondition, setDeliveryCondition] = useState("excellent");
  const [showBolDialog, setShowBolDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);

  const uploadBolMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/trade-finance/applications/${app.requestId}/seller-upload-bol`, {
        sellerAddress: walletAddress,
        bolNumber,
        trackingNumber: bolTrackingNumber,
        logisticsProvider: bolLogisticsProvider,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      toast({ title: "Bill of Lading Uploaded", description: "Shipping documents submitted. Buyer can now confirm delivery." });
      setShowBolDialog(false);
      setBolNumber(""); setBolTrackingNumber(""); setBolLogisticsProvider("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/trade-finance/applications/${app.requestId}/buyer-confirm-delivery`, {
        buyerAddress: walletAddress,
        deliveryCondition,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "buyer", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/applications", "seller", walletAddress] });
      toast({ title: "Delivery Confirmed", description: "Goods received and verified." });
      setShowDeliveryDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">← Back to list</Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{app.buyerCompanyName || "Trade Application"}</CardTitle>
              <CardDescription>Request ID: {app.requestId}</CardDescription>
            </div>
            <Badge className={getStatusColor(app.status)}>{getStatusLabel(app.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressTracker status={app.status} />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoItem label="Trade Value" value={`$${parseFloat(app.tradeValue || app.requestedAmount || "0").toLocaleString()}`} />
            <InfoItem label="Financing Type" value={FINANCING_TYPE_LABELS[app.financingType] || "Letter of Credit"} />
            <InfoItem label="Financing Requested" value={`$${parseFloat(app.requestedAmount || "0").toLocaleString()}`} />
            <InfoItem label="Duration" value={`${app.requestedDuration || 90} days`} />
            <InfoItem label="Buyer" value={app.buyerAddress?.substring(0, 12) + "..."} />
            <InfoItem label="Seller" value={app.sellerAddress?.substring(0, 12) + "..."} />
            {app.buyerCountry && <InfoItem label="Country" value={app.buyerCountry} />}
          </div>

          {app.tradeDescription && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Trade Description</p>
              <p className="text-sm bg-muted rounded p-3">{app.tradeDescription}</p>
            </div>
          )}

          {app.bolNumber && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2"><TruckIcon className="h-4 w-4" /> Shipping Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">BoL #:</span> {app.bolNumber}</div>
                {app.trackingNumber && <div><span className="text-muted-foreground">Tracking:</span> {app.trackingNumber}</div>}
                {app.logisticsProvider && <div><span className="text-muted-foreground">Carrier:</span> {app.logisticsProvider}</div>}
              </div>
            </div>
          )}

          {role === "buyer" && app.requestId && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Financing Offers</h4>
              <OffersForApplication requestId={app.requestId} walletAddress={walletAddress} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {role === "seller" && ["approved", "fee_paid", "seller_payment_confirmed", "offer_accepted"].includes(app.status) && (
              <Button size="sm" onClick={() => setShowBolDialog(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload Bill of Lading
              </Button>
            )}
            {role === "buyer" && ["seller_bol_uploaded", "bol_uploaded", "goods_shipped"].includes(app.status) && (
              <Button size="sm" onClick={() => setShowDeliveryDialog(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Delivery
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showBolDialog} onOpenChange={setShowBolDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bill of Lading</DialogTitle>
            <DialogDescription>Enter shipping document details for this trade</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Bill of Lading Number *</Label><Input value={bolNumber} onChange={(e) => setBolNumber(e.target.value)} placeholder="BOL-2026-001" /></div>
            <div><Label>Tracking Number</Label><Input value={bolTrackingNumber} onChange={(e) => setBolTrackingNumber(e.target.value)} placeholder="Shipping tracking #" /></div>
            <div><Label>Logistics Provider</Label><Input value={bolLogisticsProvider} onChange={(e) => setBolLogisticsProvider(e.target.value)} placeholder="e.g., Maersk, MSC" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBolDialog(false)}>Cancel</Button>
            <Button onClick={() => uploadBolMutation.mutate()} disabled={!bolNumber || uploadBolMutation.isPending}>
              {uploadBolMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Upload BoL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>Confirm that you have received the goods in acceptable condition</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Delivery Condition</Label>
              <Select value={deliveryCondition} onValueChange={setDeliveryCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent - All goods as expected</SelectItem>
                  <SelectItem value="good">Good - Minor discrepancies</SelectItem>
                  <SelectItem value="acceptable">Acceptable - Some issues noted</SelectItem>
                  <SelectItem value="damaged">Damaged - Goods damaged in transit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By confirming delivery, you acknowledge receipt of goods for trade #{app.requestId?.substring(0, 8)}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>Cancel</Button>
            <Button onClick={() => confirmDeliveryMutation.mutate()} disabled={confirmDeliveryMutation.isPending}>
              {confirmDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}