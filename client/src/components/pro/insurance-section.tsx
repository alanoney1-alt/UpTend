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
import {
  Shield, Upload, FileText, Calendar, AlertTriangle, CheckCircle,
  DollarSign, Clock, Eye, ExternalLink, Plus
} from "lucide-react";
import { format } from "date-fns";

interface InsurancePolicy {
  id: string;
  policy_type: string;
  carrier_name: string;
  policy_number: string;
  coverage_amount: number;
  expiry_date: string;
  document_url: string;
  verified: boolean;
  verified_at?: string;
  is_expired: boolean;
  expires_soon: boolean;
  coverage_amount_formatted: string;
  created_at: string;
}

interface LiabilityClaim {
  id: string;
  service_request_id?: string;
  claim_type: string;
  description: string;
  estimated_damage: number;
  platform_liability_cap: number;
  platform_payout: number;
  escalated_to_insurer: boolean;
  status: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
  customer_name: string;
  customer_email: string;
}

export function ProInsuranceSection({ proId }: { proId: string }) {
  const [activeTab, setActiveTab] = useState("policies");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch insurance policies
  const { data: policies, isLoading: policiesLoading } = useQuery<{ policies: InsurancePolicy[] }>({
    queryKey: ["insurance-policies", proId],
    queryFn: () => apiRequest("/api/insurance/my-policies").then(r => r.json()),
  });

  // Fetch claims
  const { data: claims, isLoading: claimsLoading } = useQuery<{ claims: LiabilityClaim[] }>({
    queryKey: ["liability-claims", proId],
    queryFn: () => apiRequest("/api/claims/my-claims").then(r => r.json()),
  });

  // Upload policy mutation
  const uploadPolicyMutation = useMutation({
    mutationFn: (data: {
      policy_type: string;
      carrier_name: string;
      policy_number: string;
      coverage_amount: number;
      expiry_date: string;
      document_url: string;
    }) => apiRequest("/api/insurance/upload-policy", { method: "POST", body: data }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurance-policies"] });
      setShowUploadDialog(false);
      toast({
        title: "Success",
        description: "Insurance policy uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload policy",
        variant: "destructive",
      });
    },
  });

  const handleUploadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    uploadPolicyMutation.mutate({
      policy_type: formData.get("policy_type") as string,
      carrier_name: formData.get("carrier_name") as string,
      policy_number: formData.get("policy_number") as string,
      coverage_amount: Number(formData.get("coverage_amount")),
      expiry_date: formData.get("expiry_date") as string,
      document_url: formData.get("document_url") as string,
    });
  };

  const getStatusBadge = (policy: InsurancePolicy) => {
    if (policy.is_expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (!policy.verified) {
      return <Badge variant="secondary">Pending Verification</Badge>;
    }
    if (policy.expires_soon) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Expires Soon</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insurance & Claims</h1>
          <p className="text-gray-600 mt-1">
            Manage your insurance policies and liability protection
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Upload Policy
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="policies">Insurance Policies</TabsTrigger>
          <TabsTrigger value="claims">Liability Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          {/* Liability Cap Information */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Shield className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-blue-900">Liability Protection</h3>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>LLC Pros with verified $1M+ GL insurance:</strong> Platform covers up to $25,000 per incident<br />
                  <strong>Non-LLC Pros:</strong> Platform covers up to $10,000 per incident<br />
                  <strong>Bodily injury claims:</strong> $5,000 platform cap, escalated to your insurer
                </p>
              </div>
            </div>
          </Card>

          {/* Insurance Policies */}
          <div className="space-y-4">
            {policiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="mx-auto mb-2" size={24} />
                  <p>Loading policies...</p>
                </div>
              </div>
            ) : policies?.policies.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium mb-2">No Insurance Policies</h3>
                <p className="text-gray-600 mb-4">
                  Upload your General Liability insurance policy to increase your liability coverage cap.
                </p>
                <Button onClick={() => setShowUploadDialog(true)}>
                  Upload Policy
                </Button>
              </Card>
            ) : (
              policies?.policies.map((policy) => (
                <Card key={policy.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{policy.carrier_name}</h3>
                        {getStatusBadge(policy)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Policy Number:</span> {policy.policy_number}
                        </div>
                        <div>
                          <span className="font-medium">Coverage:</span> {policy.coverage_amount_formatted}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span className="font-medium">Expires:</span>{" "}
                          {format(new Date(policy.expiry_date), "MMM dd, yyyy")}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> General Liability
                        </div>
                      </div>
                      {policy.verified && policy.verified_at && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                          <CheckCircle size={14} />
                          Verified on {format(new Date(policy.verified_at), "MMM dd, yyyy")}
                        </div>
                      )}
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
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-4">
          {claimsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="mx-auto mb-2" size={24} />
                <p>Loading claims...</p>
              </div>
            </div>
          ) : claims?.claims.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg font-medium mb-2">No Liability Claims</h3>
              <p className="text-gray-600">
                All liability claims filed against you will appear here.
              </p>
            </Card>
          ) : (
            claims?.claims.map((claim) => (
              <Card key={claim.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold capitalize">
                        {claim.claim_type.replace("_", " ")} Claim
                      </h3>
                      {getClaimStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Filed by {claim.customer_name} on{" "}
                      {format(new Date(claim.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    {claim.estimated_damage > 0 && (
                      <p className="text-sm font-medium">
                        Estimated: ${claim.estimated_damage.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Cap: ${claim.platform_liability_cap.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{claim.description}</p>
                
                {claim.platform_payout > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
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
                        Escalated to your insurance company
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
        </TabsContent>
      </Tabs>

      {/* Upload Policy Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Insurance Policy</DialogTitle>
            <DialogDescription>
              Upload your General Liability insurance policy to increase your liability coverage.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <Label htmlFor="carrier_name">Insurance Carrier</Label>
              <Input id="carrier_name" name="carrier_name" required />
            </div>
            
            <div>
              <Label htmlFor="policy_number">Policy Number</Label>
              <Input id="policy_number" name="policy_number" required />
            </div>
            
            <div>
              <Label htmlFor="coverage_amount">Coverage Amount ($)</Label>
              <Input 
                id="coverage_amount" 
                name="coverage_amount" 
                type="number" 
                min="1000000" 
                defaultValue="1000000"
                required 
              />
              <p className="text-xs text-gray-500 mt-1">Minimum $1,000,000 required</p>
            </div>
            
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input id="expiry_date" name="expiry_date" type="date" required />
            </div>
            
            <div>
              <Label htmlFor="document_url">Document URL</Label>
              <Input 
                id="document_url" 
                name="document_url" 
                type="url" 
                placeholder="https://example.com/policy.pdf"
                required 
              />
              <p className="text-xs text-gray-500 mt-1">Upload your policy document and paste the URL here</p>
            </div>
            
            <input type="hidden" name="policy_type" value="gl" />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadPolicyMutation.isPending}>
                {uploadPolicyMutation.isPending ? "Uploading..." : "Upload Policy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}