import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { queryClient, apiRequest } from "@/lib/api-client";
// Dummy replacements for removed blockchain libs
const secureStorage = { loadSettings: () => ({ selectedNetworkId: 1 }) };
const getNetworkById = (_id: number) => ({ name: 'Ethereum Mainnet', chainId: 1 });
const usdcManager = { getUSDCBalance: async (_addr: string, _chain: number) => '12450.00' };
import {
  FINANCING_TYPE_DESCRIPTIONS,
  fileToBase64,
  computeHash
} from "./constants";

interface UploadedFile {
  file: File;
  documentType: string;
  preview: string;
}

export function ApplicationForm({ walletAddress }: { walletAddress: string }) {
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
            <strong>How it works:</strong> Apply \u2192 Receive Offers from Financiers \u2192 Compare and Select Best Offer \u2192 Platform Fee: 1%
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
                  <p className="text-xs text-muted-foreground mt-1">No collateral pledged \u2014 financiers will assess risk accordingly</p>
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
