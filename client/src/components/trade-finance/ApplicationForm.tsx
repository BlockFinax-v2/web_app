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
import { queryClient } from "@/lib/api-client";
import { useTransactionSigner } from "@/contexts/TransactionSignerContext";
import { tradeFinanceService } from "@/services/tradeFinanceService";

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
  const { requestSignature } = useTransactionSigner();
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
      const pgaId = `PGA-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      
      const documentURIs = documents.map(d => `ipfs://${d.hash}`);

      return requestSignature({
        title: "Create Trade Application",
        description: `Creating Pool Guarantee Application for ${parseFloat(requestedAmount).toLocaleString()} USDC`,
        amountUSD: parseFloat(requestedAmount),
        execute: async (privateKey) => {
          return tradeFinanceService.createPGA(privateKey, {
            pgaId,
            seller: sellerAddress.toLowerCase(),
            companyName: buyerCompanyName,
            registrationNumber: buyerRegistrationNumber,
            tradeDescription: tradeDescription,
            tradeValue: tradeValue,
            guaranteeAmount: requestedAmount,
            collateralAmount: collateralType === "wallet_balance" ? (walletBalance || "0") : "0",
            issuanceFee: calculatedFee,
            duration: parseInt(requestedDuration),
            beneficiaryName: buyerContactPerson,
            beneficiaryWallet: sellerAddress,
            metadataURI: `ipfs://${documents[0].hash}`, // Using first doc hash as generic metadata for now
            documentURIs: documentURIs
          });
        }
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
    <Card className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Send className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">Apply for Trade Financing</CardTitle>
            <CardDescription className="mt-0.5">
              Submit your trade details. BlockFinaX will match you with financiers who will compete to offer you the best terms.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
          <Handshake className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">How it works</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Apply → Receive offers from financiers → Compare and select the best offer → Platform fee: 1%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10"><Shield className="h-4 w-4 text-primary" /></span>
            Financing Instrument *
          </h3>
          <Select value={financingType} onValueChange={setFinancingType}>
            <SelectTrigger className="w-full rounded-xl border-white/10 bg-background/50 h-11">
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

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10"><UserIcon className="h-4 w-4 text-primary" /></span>
            Buyer / Importer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label className="text-muted-foreground">Company Name *</Label><Input value={buyerCompanyName} onChange={(e) => setBuyerCompanyName(e.target.value)} placeholder="Your company name" className="rounded-xl border-white/10 h-11" /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground">Registration Number</Label><Input value={buyerRegistrationNumber} onChange={(e) => setBuyerRegistrationNumber(e.target.value)} placeholder="Business registration #" className="rounded-xl border-white/10 h-11" /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground">Country</Label><Input value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} placeholder="Country of operation" className="rounded-xl border-white/10 h-11" /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground">Contact Person</Label><Input value={buyerContactPerson} onChange={(e) => setBuyerContactPerson(e.target.value)} placeholder="Primary contact" className="rounded-xl border-white/10 h-11" /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground">Email</Label><Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="contact@company.com" className="rounded-xl border-white/10 h-11" /></div>
            <div className="space-y-1.5"><Label className="text-muted-foreground">Phone</Label><Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="+1 234 567 890" className="rounded-xl border-white/10 h-11" /></div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10"><BuildingIcon className="h-4 w-4 text-primary" /></span>
            Seller / Exporter
          </h3>
          <div className="space-y-1.5"><Label className="text-muted-foreground">Seller Wallet Address *</Label><Input value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder="0x..." className="font-mono rounded-xl border-white/10 h-11" /></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10"><FileTextIcon className="h-4 w-4 text-primary" /></span>
            Trade Details
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-muted-foreground">Trade Description *</Label><Textarea value={tradeDescription} onChange={(e) => setTradeDescription(e.target.value)} placeholder="Describe the goods/services being traded" rows={3} className="rounded-xl border-white/10 resize-none" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-muted-foreground">Trade Value (USDC) *</Label><Input type="number" value={tradeValue} onChange={(e) => setTradeValue(e.target.value)} placeholder="Total trade value" className="rounded-xl border-white/10 h-11" /></div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">Requested Financing (USDC) *</Label><Input type="number" value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} placeholder="Amount needed" className="rounded-xl border-white/10 h-11" /></div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Collateral</Label>
                <Select value={collateralType} onValueChange={setCollateralType}>
                  <SelectTrigger className="rounded-xl border-white/10 h-11"><SelectValue placeholder="Select collateral type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet_balance">Wallet Balance</SelectItem>
                    <SelectItem value="none">No Collateral</SelectItem>
                  </SelectContent>
                </Select>
                {collateralType === "wallet_balance" ? (
                  <div className="mt-2 rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">USDC Balance ({activeNetwork?.name || "Base Sepolia"})</span>
                    {balanceLoading ? (
                      <span className="text-sm flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Fetching...</span>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums">{walletBalance ? `${parseFloat(walletBalance).toFixed(2)} USDC` : "0.00 USDC"}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">No collateral pledged — financiers will assess risk accordingly</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Duration (days)</Label>
                <Select value={requestedDuration} onValueChange={setRequestedDuration}>
                  <SelectTrigger className="rounded-xl border-white/10 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="120">120 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-muted-foreground">Sales Contract Number</Label><Input value={salesContractNumber} onChange={(e) => setSalesContractNumber(e.target.value)} placeholder="SC-2026-001" className="rounded-xl border-white/10 h-11" /></div>
            </div>
            {salesContractNumber && (
              <div className="space-y-1.5"><Label className="text-muted-foreground">Contract Date</Label><Input type="date" value={salesContractDate} onChange={(e) => setSalesContractDate(e.target.value)} className="rounded-xl border-white/10 h-11" /></div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10"><Upload className="h-4 w-4 text-primary" /></span>
            Required Documents *
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Proforma Invoice *</Label>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${proformaInvoice ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/20 hover:border-primary/40 bg-white/5"}`}>
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
              <Label className="text-muted-foreground">Sales Contract *</Label>
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${salesContract ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/20 hover:border-primary/40 bg-white/5"}`}>
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
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Requested Financing</span><span className="font-semibold tabular-nums">${parseFloat(requestedAmount).toLocaleString()} USDC</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Platform Fee (1%)</span><span className="font-semibold tabular-nums">${calculatedFee} USDC</span></div>
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-semibold"><span>Fee Due on Acceptance</span><span className="tabular-nums">${calculatedFee} USDC</span></div>
          </div>
        )}

        <Button onClick={() => submitMutation.mutate()} disabled={!canSubmit || submitMutation.isPending} className="w-full rounded-xl h-11 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          {submitMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4 mr-2" /> Submit Application</>}
        </Button>
      </CardContent>
    </Card>
  );
}
