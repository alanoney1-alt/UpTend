import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/landing/header";
import {
  Shield, FileText, Calendar, AlertTriangle, CheckCircle, Clock, 
  DollarSign, Eye, ExternalLink, User, Building, X
} from "lucide-react";
import { format } from "date-fns";

interface InsurancePolicy {
  id: string;
  pro_id: string;
  pro_name: string;
  pro_email: string;
  company_name?: string;
  policy_type: string;
  carrier_name: string;
  policy_number: string;
  coverage_amount: number;
  expiry_date: string;
  document_url: string;
  verified: boolean;
  verified_at?: string;
  created_at: string;
}

interface LiabilityClaim {
  id: string;
  service_request_id?: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  pro_id: string;
  pro_name: string;
  company_name?: string;
  claim_type: string;
  description: string;
  estimated_damage: number;
  platform_liability_cap: number;
  platform_payout: number;
  escalated_to_insurer: boolean;
  insurer_claim_reference?: string;
  status: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export default function AdminInsuranceClaims() {
  const [activeTab, setActiveTab] = useState("claims");
  const [selectedClaim, setSelectedClaim] = useState<LiabilityClaim | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [claimFilter, setClaimFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all claims
  const { data: claimsData, isLoading: claimsLoading } = useQuery<{
    claims: LiabilityClaim[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ["admin-claims", claimFilter],
    queryFn: () => apiRequest(`/api/admin/claims?status=${claimFilter !== "all" ? claimFilter : ""}&limit=100`),
  });

  // Fetch expiring policies
  const { data: expiringData, isLoading: expiringLoading } = useQuery<{
    expiring_policies: InsurancePolicy[];
  }>({
    queryKey: ["admin-expiring-policies"],
    queryFn: () => apiRequest("/api/admin/insurance/expiring"),
  });

  // Review claim mutation
  const reviewClaimMutation = useMutation({
    mutationFn: ({ claimId, ...data }: {
      claimId: string;
      status: string;
      platform_payout?: number;
      escalated_to_insurer?: boolean;
      insurer_claim_reference?: string;
      resolution_notes?: string;
    }) => apiRequest(`/api/claims/${claimId}/review`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
      setShowReviewDialog(false);
      setSelectedClaim(null);
      toast({
        title: "Success",
        description: "Claim reviewed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review claim",
        variant: "destructive",
      });
    },
  });

  // Verify policy mutation
  const verifyPolicyMutation = useMutation({
    mutationFn: ({ policyId, verified }: { policyId: string; verified: boolean }) =>
      apiRequest(`/api/insurance/verify/${policyId}`, { method: "PATCH", body: { verified } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expiring-policies"] });
      toast({
        title: "Success",
        description: "Policy verification updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification",
        variant: "destructive",
      });
    },
  });

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClaim) return;

    const formData = new FormData(e.currentTarget);
    reviewClaimMutation.mutate({
      claimId: selectedClaim.id,
      status: formData.get("status") as string,
      platform_payout: formData.get("platform_payout") ? Number(formData.get("platform_payout")) : undefined,
      escalated_to_insurer: formData.get("escalated_to_insurer") === "true",
      insurer_claim_reference: formData.get("insurer_claim_reference") as string || undefined,
      resolution_notes: formData.get("resolution_notes") as string || undefined,
    });
  };

  const getClaimStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewing: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      denied: "bg-red-100 text-red-800",
      escalated: "bg-purple-100 text-purple-800",
      resolved: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getClaimTypeIcon = (type: string) => {
    switch (type) {
      case "property_damage":
        return <AlertTriangle className="text-orange-600" size={20} />;
      case "structural":
        return <AlertTriangle className="text-red-600" size={20} />;
      case "bodily_injury":
        return <Shield className="text-red-600" size={20} />;
      case "theft":
        return <Shield className="text-purple-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-6 mt-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Insurance & Claims Management</h1>
          <p className="text-gray-600 mt-2">Manage liability claims and insurance policies</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="claims">Liability Claims</TabsTrigger>
            <TabsTrigger value="policies">Insurance Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="claim-filter">Filter by status:</Label>
                <Select value={claimFilter} onValueChange={setClaimFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Claims</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Claims List */}
            <div className="space-y-4">
              {claimsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Clock className="mx-auto mb-2" size={24} />
                    <p>Loading claims...</p>
                  </div>
                </div>
              ) : claimsData?.claims.length === 0 ? (
                <Card className="p-8 text-center">
                  <Shield className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium mb-2">No Claims Found</h3>
                  <p className="text-gray-600">
                    {claimFilter !== "all" ? `No ${claimFilter} claims found.` : "No liability claims have been filed yet."}
                  </p>
                </Card>
              ) : (
                claimsData?.claims.map((claim) => (
                  <Card key={claim.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {getClaimTypeIcon(claim.claim_type)}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold capitalize">
                              {claim.claim_type.replace("_", " ")} Claim
                            </h3>
                            {getClaimStatusBadge(claim.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Filed by {claim.customer_name} against {claim.pro_name}
                            {claim.company_name && ` (${claim.company_name})`}
                            • {format(new Date(claim.created_at), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-gray-700">{claim.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        {claim.estimated_damage > 0 && (
                          <p className="text-sm font-medium">
                            Estimated: ${claim.estimated_damage.toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Cap: ${claim.platform_liability_cap.toLocaleString()}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedClaim(claim);
                            setShowReviewDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>

                    {claim.platform_payout > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Platform Payout: ${claim.platform_payout.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {claim.escalated_to_insurer && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <ExternalLink size={16} className="text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            Escalated to insurer
                            {claim.insurer_claim_reference && ` (Ref: ${claim.insurer_claim_reference})`}
                          </span>
                        </div>
                      </div>
                    )}

                    {claim.resolution_notes && (
                      <div className="bg-gray-50 border rounded p-3">
                        <h4 className="text-sm font-medium mb-1">Resolution Notes:</h4>
                        <p className="text-sm text-gray-700">{claim.resolution_notes}</p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            {claimsData && claimsData.total > claimsData.claims.length && (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Showing {claimsData.claims.length} of {claimsData.total} claims
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Expiring Insurance Policies (Next 30 Days)</h2>
              
              {expiringLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Clock className="mx-auto mb-2" size={24} />
                    <p>Loading policies...</p>
                  </div>
                </div>
              ) : expiringData?.expiring_policies.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="mx-auto mb-4 text-green-400" size={48} />
                  <h3 className="text-lg font-medium mb-2">No Expiring Policies</h3>
                  <p className="text-gray-600">All insurance policies are current.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {expiringData?.expiring_policies.map((policy) => (
                    <Card key={policy.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{policy.pro_name}</h3>
                            {policy.company_name && (
                              <Badge variant="outline">{policy.company_name}</Badge>
                            )}
                            <Badge 
                              variant={new Date(policy.expiry_date) < new Date() ? "destructive" : "outline"}
                              className={new Date(policy.expiry_date) < new Date() ? "" : "border-orange-500 text-orange-600"}
                            >
                              {new Date(policy.expiry_date) < new Date() ? "Expired" : "Expires Soon"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">Carrier:</span> {policy.carrier_name}
                            </div>
                            <div>
                              <span className="font-medium">Policy:</span> {policy.policy_number}
                            </div>
                            <div>
                              <span className="font-medium">Coverage:</span> ${policy.coverage_amount.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span className="font-medium">Expires:</span>{" "}
                              {format(new Date(policy.expiry_date), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            <User size={14} className="inline mr-1" />
                            {policy.pro_email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {policy.document_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(policy.document_url, "_blank")}
                            >
                              <Eye size={14} className="mr-1" />
                              View
                            </Button>
                          )}
                          <Button
                            variant={policy.verified ? "outline" : "default"}
                            size="sm"
                            onClick={() => verifyPolicyMutation.mutate({
                              policyId: policy.id,
                              verified: !policy.verified
                            })}
                            disabled={verifyPolicyMutation.isPending}
                          >
                            {policy.verified ? "Unverify" : "Verify"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Claim Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Liability Claim</DialogTitle>
              <DialogDescription>
                Review and update the status of this liability claim.
              </DialogDescription>
            </DialogHeader>

            {selectedClaim && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded p-4">
                  <h4 className="font-medium mb-2">Claim Details</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Type:</strong> {selectedClaim.claim_type.replace("_", " ")}</div>
                    <div><strong>Customer:</strong> {selectedClaim.customer_name} ({selectedClaim.customer_email})</div>
                    <div><strong>Pro:</strong> {selectedClaim.pro_name} {selectedClaim.company_name && `(${selectedClaim.company_name})`}</div>
                    <div><strong>Platform Cap:</strong> ${selectedClaim.platform_liability_cap.toLocaleString()}</div>
                    {selectedClaim.estimated_damage > 0 && (
                      <div><strong>Estimated Damage:</strong> ${selectedClaim.estimated_damage.toLocaleString()}</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <strong>Description:</strong>
                    <p className="mt-1">{selectedClaim.description}</p>
                  </div>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={selectedClaim.status} required>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="platform_payout">Platform Payout ($)</Label>
                    <Input 
                      id="platform_payout" 
                      name="platform_payout" 
                      type="number" 
                      min="0" 
                      max={selectedClaim.platform_liability_cap}
                      defaultValue={selectedClaim.platform_payout || ""}
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: ${selectedClaim.platform_liability_cap.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="escalated_to_insurer"
                      name="escalated_to_insurer"
                      value="true"
                      defaultChecked={selectedClaim.escalated_to_insurer}
                    />
                    <Label htmlFor="escalated_to_insurer">Escalated to pro's insurer</Label>
                  </div>

                  {selectedClaim.escalated_to_insurer && (
                    <div>
                      <Label htmlFor="insurer_claim_reference">Insurer Claim Reference</Label>
                      <Input 
                        id="insurer_claim_reference" 
                        name="insurer_claim_reference" 
                        defaultValue={selectedClaim.insurer_claim_reference || ""}
                        placeholder="Insurance company claim number/reference"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="resolution_notes">Resolution Notes</Label>
                    <Textarea 
                      id="resolution_notes" 
                      name="resolution_notes" 
                      defaultValue={selectedClaim.resolution_notes || ""}
                      rows={4}
                      placeholder="Add notes about the resolution or decision..."
                    />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowReviewDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={reviewClaimMutation.isPending}>
                      {reviewClaimMutation.isPending ? "Updating..." : "Update Claim"}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}