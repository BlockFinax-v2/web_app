import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useWallet } from "@/hooks/use-wallet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/api-client";
import { 
  Shield, 
  FileCheck, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Award,
  UserPlus,
  Search,
  Filter,
  ArrowLeft,
  Upload,
  FileText,
  GraduationCap,
  Briefcase,
  Vote,
  Info
} from "lucide-react";
import { useDropzone } from "react-dropzone";

interface SpecialistCredential {
  id: number;
  credentialType: string;
  credentialName: string;
  issuingOrganization: string;
  issueDate: string | null;
  expiryDate: string | null;
  credentialNumber: string | null;
  isVerified: boolean;
  documentName: string | null;
  documentType: string | null;
  documentData: string | null;
}

interface SpecialistStatistics {
  totalVotes: number;
  votesFor: number;
  votesAgainst: number;
  totalReviews: number;
  successfulOutcomes: number;
  averageResponseTime: number | null;
  lastActiveAt: string | null;
}

interface Specialist {
  id: number;
  walletAddress: string;
  roleType: string;
  displayName: string;
  bio: string | null;
  specializations: string[] | null;
  yearsOfExperience: number | null;
  isVerified: boolean;
  verifiedAt: string | null;
  totalApplicationsReviewed: number;
  totalClaimsInvestigated: number;
  averageReviewTime: number | null;
  approvalRate: string | null;
  status: string;
  createdAt: string;
  credentials: SpecialistCredential[];
  statistics: SpecialistStatistics | null;
  delegationStats: {
    totalDelegatedPower: number;
    delegatorCount: number;
  };
}

// Application Modal Component
function BecomeSpecialistModal() {
  const [open, setOpen] = useState(false);
  const [roleType, setRoleType] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [credentials, setCredentials] = useState<Array<{
    type: string;
    name: string;
    organization: string;
    number: string;
    file: File | null;
  }>>([]);
  const { address: walletAddress } = useWallet();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSpecialization = () => {
    if (newSpecialization.trim() && !specializations.includes(newSpecialization.trim())) {
      setSpecializations([...specializations, newSpecialization.trim()]);
      setNewSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    setSpecializations(specializations.filter(s => s !== spec));
  };

  const addCredential = () => {
    setCredentials([...credentials, { type: "", name: "", organization: "", number: "", file: null }]);
  };

  const updateCredential = (index: number, field: string, value: any) => {
    const updated = [...credentials];
    updated[index] = { ...updated[index], [field]: value };
    setCredentials(updated);
  };

  const removeCredential = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to apply",
        variant: "destructive"
      });
      return;
    }

    if (!roleType || !displayName || specializations.length === 0) {
      toast({
        title: "Required Fields",
        description: "Please fill in role type, display name, and at least one specialization",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create specialist role
      const roleData = {
        walletAddress,
        roleType,
        displayName,
        bio: bio || null,
        specializations,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null
      };

      await apiRequest("POST", "/api/specialists/roles", roleData);

      // Upload credentials
      for (const cred of credentials) {
        if (cred.name && cred.organization) {
          let documentData = null;
          if (cred.file) {
            const reader = new FileReader();
            documentData = await new Promise<string>((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(cred.file!);
            });
          }

          await apiRequest("POST", "/api/specialists/credentials", {
            specialistAddress: walletAddress,
            credentialType: cred.type || "certification",
            credentialName: cred.name,
            issuingOrganization: cred.organization,
            credentialNumber: cred.number || null,
            documentName: cred.file?.name || null,
            documentType: cred.file?.type || null,
            documentSize: cred.file?.size || null,
            documentData
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/specialists/roles"] });

      toast({
        title: "Application Submitted",
        description: "Your specialist application has been submitted for review"
      });

      setOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRoleType("");
    setDisplayName("");
    setBio("");
    setYearsOfExperience("");
    setSpecializations([]);
    setNewSpecialization("");
    setCredentials([]);
  };

  const credentialTypes = [
    { value: "certification", label: "Professional Certification" },
    { value: "education", label: "Education Degree" },
    { value: "license", label: "Professional License" },
    { value: "professional_membership", label: "Professional Membership" }
  ];

  const specializationSuggestions = {
    trade_finance_specialist: [
      "URDG 758 Guarantees",
      "Letters of Credit",
      "Documentary Collections",
      "Trade Finance Law",
      "ICC Banking Rules",
      "Supply Chain Finance",
      "Export Credit Insurance"
    ],
    fraud_investigator: [
      "Document Verification",
      "KYC/AML Compliance",
      "Fraud Detection",
      "Risk Assessment",
      "Financial Forensics",
      "Due Diligence",
      "Blockchain Analysis"
    ]
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-become-specialist" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Become a Specialist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to Become a Specialist</DialogTitle>
          <DialogDescription>
            Join our network of verified trade finance and fraud investigation professionals
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role Type */}
          <div className="space-y-2">
            <Label htmlFor="roleType">Specialist Role *</Label>
            <Select value={roleType} onValueChange={setRoleType}>
              <SelectTrigger id="roleType" data-testid="select-role-type">
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trade_finance_specialist">Trade Finance Specialist</SelectItem>
                <SelectItem value="fraud_investigator">Fraud Investigator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              data-testid="input-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your professional name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              data-testid="input-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief overview of your experience and expertise"
              rows={4}
            />
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Input
              id="experience"
              data-testid="input-experience"
              type="number"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g., 10"
              min="0"
            />
          </div>

          {/* Specializations */}
          <div className="space-y-2">
            <Label>Specializations *</Label>
            <div className="flex gap-2">
              <Input
                data-testid="input-specialization"
                value={newSpecialization}
                onChange={(e) => setNewSpecialization(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialization())}
                placeholder="Add specialization"
              />
              <Button type="button" onClick={addSpecialization} data-testid="button-add-specialization">
                Add
              </Button>
            </div>
            {roleType && specializationSuggestions[roleType as keyof typeof specializationSuggestions] && (
              <div className="text-xs text-muted-foreground">
                Suggested: {specializationSuggestions[roleType as keyof typeof specializationSuggestions].join(", ")}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {specializations.map((spec, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1">
                  {spec}
                  <button
                    type="button"
                    onClick={() => removeSpecialization(spec)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Credentials */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Professional Credentials</Label>
              <Button type="button" size="sm" variant="outline" onClick={addCredential} data-testid="button-add-credential">
                <Upload className="w-4 h-4 mr-2" />
                Add Credential
              </Button>
            </div>
            {credentials.map((cred, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={cred.type}
                        onValueChange={(value) => updateCredential(idx, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {credentialTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={cred.name}
                        onChange={(e) => updateCredential(idx, "name", e.target.value)}
                        placeholder="e.g., CDCS Certification"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Issuing Organization</Label>
                      <Input
                        value={cred.organization}
                        onChange={(e) => updateCredential(idx, "organization", e.target.value)}
                        placeholder="e.g., ICC Academy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credential Number</Label>
                      <Input
                        value={cred.number}
                        onChange={(e) => updateCredential(idx, "number", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Upload Document (Optional)</Label>
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateCredential(idx, "file", e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCredential(idx)}
                  >
                    Remove Credential
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} data-testid="button-submit-application">
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delegate Votes Button Component
function DelegateVotesButton({ specialist }: { specialist: Specialist }) {
  const [open, setOpen] = useState(false);
  const [isDelegating, setIsDelegating] = useState(false);
  const { address: walletAddress } = useWallet();
  const { toast } = useToast();

  // Fetch user's staking info to check voting power
  const { data: stakerInfo } = useQuery<{
    stakedAmount: number;
    votingPower: number;
    delegatedVotingPower: number;
    totalVotingPower: number;
    isStaker: boolean;
  }>({
    queryKey: ["/api/trade-finance/staker-info", walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error("No wallet address");
      const res = await fetch(`/api/trade-finance/staker-info?walletAddress=${walletAddress}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch staker info");
      return await res.json();
    },
    enabled: !!walletAddress,
  });

  // Check if user already delegated to this specialist
  const { data: existingDelegations } = useQuery<Array<{
    delegatorAddress: string;
    delegateAddress: string;
    votingPower: number;
    delegatedAt: string;
  }>>({
    queryKey: ["/api/delegations/delegator", walletAddress],
    enabled: !!walletAddress,
  });

  const hasDelegated = existingDelegations?.some(
    d => d.delegateAddress.toLowerCase() === specialist.walletAddress.toLowerCase()
  );

  const handleDelegate = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate votes.",
        variant: "destructive",
      });
      return;
    }

    if (!stakerInfo?.isStaker || stakerInfo.votingPower === 0) {
      toast({
        title: "No Voting Power",
        description: "You need to stake USDC to delegate votes. Visit the Treasury Portal to stake.",
        variant: "destructive",
      });
      return;
    }

    setIsDelegating(true);
    try {
      await apiRequest("POST", "/api/delegations", {
        delegateAddress: specialist.walletAddress,
      });

      toast({
        title: "Votes Delegated",
        description: `You have successfully delegated ${stakerInfo.votingPower.toFixed(2)} votes to ${specialist.displayName}.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/delegations/delegator", walletAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/specialists/roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trade-finance/staker-info", walletAddress] });
      
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Delegation Failed",
        description: error.message || "Failed to delegate votes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDelegating(false);
    }
  };

  if (hasDelegated) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          You've delegated to this specialist
        </span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full gap-2" 
          variant="outline"
          data-testid={`button-delegate-${specialist.id}`}
        >
          <Vote className="w-4 h-4" />
          Delegate Votes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delegate Voting Power</DialogTitle>
          <DialogDescription>
            Delegate your voting power to {specialist.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Specialist Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Specialist</span>
              {specialist.isVerified && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="text-lg font-bold">{specialist.displayName}</div>
            <div className="text-xs text-muted-foreground">
              {specialist.walletAddress.slice(0, 10)}...{specialist.walletAddress.slice(-8)}
            </div>
            {specialist.specializations && specialist.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {specialist.specializations.slice(0, 3).map((spec, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {spec}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* User's Voting Power */}
          {stakerInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Your Voting Power
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stakerInfo.votingPower.toFixed(2)} votes
              </div>
              <div className="text-xs text-muted-foreground">
                Based on {stakerInfo.stakedAmount.toFixed(2)} USDC staked
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> You'll retain your staked USDC and continue earning 60% fee distributions. 
              The specialist will vote on your behalf using your voting power. You can revoke this delegation anytime.
            </div>
          </div>

          {!stakerInfo?.isStaker && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-700 dark:text-red-400">
                You need to stake USDC first to delegate votes. Visit the Treasury Portal to stake.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDelegating}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelegate} 
            disabled={isDelegating || !stakerInfo?.isStaker}
            data-testid="button-confirm-delegation"
          >
            {isDelegating ? "Delegating..." : "Confirm Delegation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Specialist Card Component
function SpecialistCard({ specialist }: { specialist: Specialist }) {
  const approvalRate = specialist.approvalRate ? parseFloat(specialist.approvalRate) : 0;
  
  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`specialist-card-${specialist.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {specialist.displayName}
              {specialist.isVerified && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {specialist.walletAddress.slice(0, 10)}...{specialist.walletAddress.slice(-8)}
            </CardDescription>
          </div>
          <Badge variant="outline">
            {specialist.roleType === "trade_finance_specialist" ? "Trade Finance" : "Fraud Investigation"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {specialist.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3">{specialist.bio}</p>
        )}

        {/* Experience */}
        {specialist.yearsOfExperience && (
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span>{specialist.yearsOfExperience} years of experience</span>
          </div>
        )}

        {/* Specializations */}
        {specialist.specializations && specialist.specializations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Specializations</div>
            <div className="flex flex-wrap gap-1">
              {specialist.specializations.slice(0, 3).map((spec, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {specialist.specializations.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{specialist.specializations.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Credentials */}
        {specialist.credentials && specialist.credentials.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Award className="w-4 h-4 text-muted-foreground" />
            <span>{specialist.credentials.length} credential{specialist.credentials.length !== 1 ? "s" : ""}</span>
            {specialist.credentials.filter(c => c.isVerified).length > 0 && (
              <Badge variant="outline" className="text-xs">
                {specialist.credentials.filter(c => c.isVerified).length} verified
              </Badge>
            )}
          </div>
        )}

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Reviews</div>
            <div className="text-lg font-semibold" data-testid={`text-reviews-${specialist.id}`}>
              {specialist.totalApplicationsReviewed + specialist.totalClaimsInvestigated}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Approval Rate</div>
            <div className="text-lg font-semibold text-green-600" data-testid={`text-approval-rate-${specialist.id}`}>
              {approvalRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Statistics */}
        {specialist.statistics && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>{specialist.statistics.votesFor} votes for</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>
                {specialist.averageReviewTime 
                  ? `${specialist.averageReviewTime}h avg`
                  : "No data"}
              </span>
            </div>
          </div>
        )}

        {/* Delegation Statistics */}
        {specialist.delegationStats && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">
              Voting Power Delegated
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Total Power</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid={`text-delegated-power-${specialist.id}`}>
                  {specialist.delegationStats.totalDelegatedPower.toFixed(2)} USDC
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Delegators</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid={`text-delegator-count-${specialist.id}`}>
                  {specialist.delegationStats.delegatorCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delegate Votes Button */}
        <DelegateVotesButton specialist={specialist} />
      </CardContent>
    </Card>
  );
}

export default function SpecialistDiscoveryPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: specialists, isLoading } = useQuery<Specialist[]>({
    queryKey: ["/api/specialists/roles"],
  });

  const tradeFinanceSpecialists = specialists?.filter(s => s.roleType === "trade_finance_specialist") || [];
  const fraudInvestigators = specialists?.filter(s => s.roleType === "fraud_investigator") || [];

  const filterSpecialists = (specialists: Specialist[]) => {
    return specialists.filter(specialist => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          specialist.displayName.toLowerCase().includes(query) ||
          specialist.bio?.toLowerCase().includes(query) ||
          specialist.specializations?.some(s => s.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Verified filter
      if (verifiedOnly && !specialist.isVerified) return false;

      // Specialization filter
      if (specializationFilter && specializationFilter !== "all" && !specialist.specializations?.includes(specializationFilter)) return false;

      return true;
    });
  };

  const filteredTradeFinance = filterSpecialists(tradeFinanceSpecialists);
  const filteredInvestigators = filterSpecialists(fraudInvestigators);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/treasury")}
              data-testid="button-back-to-treasury"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Discover Specialists
              </h1>
              <p className="text-muted-foreground mt-1">
                Connect with verified trade finance and fraud investigation professionals
              </p>
            </div>
          </div>
          <BecomeSpecialistModal />
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search specialists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-specialists"
                />
              </div>
              <div>
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger data-testid="select-specialization-filter">
                    <SelectValue placeholder="Filter by specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specializations</SelectItem>
                    <SelectItem value="URDG 758 Guarantees">URDG 758 Guarantees</SelectItem>
                    <SelectItem value="Letters of Credit">Letters of Credit</SelectItem>
                    <SelectItem value="Document Verification">Document Verification</SelectItem>
                    <SelectItem value="Fraud Detection">Fraud Detection</SelectItem>
                    <SelectItem value="KYC/AML Compliance">KYC/AML Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified-only"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-verified-only"
                />
                <Label htmlFor="verified-only" className="cursor-pointer">
                  Show verified only
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="trade-finance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="trade-finance" data-testid="tab-trade-finance">
              <FileCheck className="w-4 h-4 mr-2" />
              Trade Finance Specialists ({filteredTradeFinance.length})
            </TabsTrigger>
            <TabsTrigger value="investigators" data-testid="tab-investigators">
              <Shield className="w-4 h-4 mr-2" />
              Fraud Investigators ({filteredInvestigators.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trade-finance" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="mt-4 text-muted-foreground">Loading specialists...</p>
              </div>
            ) : filteredTradeFinance.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No trade finance specialists found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTradeFinance.map((specialist) => (
                  <SpecialistCard key={specialist.id} specialist={specialist} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="investigators" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="mt-4 text-muted-foreground">Loading specialists...</p>
              </div>
            ) : filteredInvestigators.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No fraud investigators found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInvestigators.map((specialist) => (
                  <SpecialistCard key={specialist.id} specialist={specialist} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
