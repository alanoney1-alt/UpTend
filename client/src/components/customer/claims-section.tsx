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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Shield, AlertTriangle, FileText, Calendar, DollarSign, 
  Clock, ExternalLink, Plus, Upload, Eye, X
} from "lucide-react";
import { format } from "date-fns";

interface ServiceRequest {
  id: string;
  service_type: string;
  service_address: string;
  hauler_name?: string;
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
  pro_name: string;
  company_name?: string;
}

export function CustomerClaimsSection({ customerId }: { customerId: string }) {
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent service requests
  const { data: serviceRequests } = useQuery<ServiceRequest[]>({
    queryKey: ["recent-services", customerId],
    queryFn: () => apiRequest("/api/customer/recent-services").then(r => r.json()),
  });

  // Fetch claims
  const { data: claims, isLoading: claimsLoading } = useQuery<{ claims: LiabilityClaim[] }>({
    queryKey: ["my-claims", customerId],
    queryFn: () => apiRequest("/api/claims/my-claims").then(r => r.json()),
  });

  // File claim mutation
  const fileClaimMutation = useMutation({
    mutationFn: (data: {
      service_request_id?: string;
      pro_id: string;
      claim_type: string;
      description: string;
      estimated_damage?: number;
      photo_urls?: string[];
    }) => apiRequest("/api/claims/file", { method: "POST", body: data }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      setShowClaimDialog(false);
      setPhotoUrls([]);
      toast({
        title: "Claim Filed Successfully",
        description: "Your liability claim has been submitted for review. We'll review it within 48 hours.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Filing Claim",
        description: error.message || "Failed to file claim",
        variant: "destructive",
      });
    },
  });

  const handleClaimSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    fileClaimMutation.mutate({
      service_request_id: formData.get("service_request_id") as string || undefined,
      pro_id: formData.get("pro_id") as string,
      claim_type: formData.get("claim_type") as string,
      description: formData.get("description") as string,
      estimated_damage: formData.get("estimated_damage") ? Number(formData.get("estimated_damage")) : undefined,
      photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
    });
  };

  const addPhotoUrl = () => {
    const url = prompt("Enter photo URL:");
    if (url && url.startsWith("http")) {
      setPhotoUrls(prev => [...prev, url]);
    }
  };

  const removePhotoUrl = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const getClaimStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      reviewing: "bg-blue-500/20 text-blue-400",
      approved: "bg-green-500/20 text-green-400",
      denied: "bg-red-500/20 text-red-400",
      escalated: "bg-purple-500/20 text-purple-400",
      resolved: "bg-muted text-gray-800",
    };

    return (
      <Badge className={statusStyles[status] || "bg-muted text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getClaimTypeIcon = (type: string) => {
    switch (type) {
      case "property_damage":
        return <AlertTriangle className="text-orange-500" size={20} />;
      case "structural":
        return <AlertTriangle className="text-red-500" size={20} />;
      case "bodily_injury":
        return <Shield className="text-red-500" size={20} />;
      case "theft":
        return <Shield className="text-purple-500" size={20} />;
      default:
        return <FileText className="text-muted-foreground" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Liability Claims</h2>
          <p className="text-muted-foreground mt-1">
            File and track claims for damages or issues with your services
          </p>
        </div>
        <Button onClick={() => setShowClaimDialog(true)} className="flex items-center gap-2">
          <Plus size={16} />
          File Claim
        </Button>
      </div>

      {/* Claims Process Info */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="text-primary mt-1" size={20} />
          <div>
            <h3 className="font-semibold">How Claims Work</h3>
            <p className="text-sm text-muted-foreground mt-1">
              If something goes wrong during a service, UpTend helps resolve it:<br />
              • <strong>File a claim</strong> — describe the issue with photos and we review within 48 hours<br />
              • <strong>Pro's insurance</strong> — verified pros carry their own liability coverage. We coordinate directly with their insurer on your behalf.<br />
              • <strong>Resolution support</strong> — we mediate between you and the pro to reach a fair outcome. If needed, claims are escalated to the pro's insurance carrier.
            </p>
          </div>
        </div>
      </Card>

      {/* Claims List */}
      <div className="space-y-4">
        {claimsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Clock className="mx-auto mb-2" size={24} />
              <p>Loading claims...</p>
            </div>
          </div>
        ) : claims?.claims.length === 0 ? (
          <Card className="p-8 text-center">
            <Shield className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-medium mb-2">No Claims Filed</h3>
            <p className="text-muted-foreground mb-4">
              You haven't filed any liability claims yet. If you experience damage or issues during service, you can file a claim here.
            </p>
            <Button onClick={() => setShowClaimDialog(true)}>
              File Your First Claim
            </Button>
          </Card>
        ) : (
          claims?.claims.map((claim) => (
            <Card key={claim.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {getClaimTypeIcon(claim.claim_type)}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold capitalize">
                        {claim.claim_type.replace("_", " ")} Claim
                      </h3>
                      {getClaimStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Against {claim.pro_name} {claim.company_name && `(${claim.company_name})`} 
                      • Filed {format(new Date(claim.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {claim.estimated_damage > 0 && (
                    <p className="text-sm font-medium">
                      Estimated: ${claim.estimated_damage.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Coverage: ${claim.platform_liability_cap.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{claim.description}</p>
              
              {claim.status === "approved" && claim.platform_payout > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-green-400">
                      Approved: ${claim.platform_payout.toLocaleString()} payout
                    </span>
                  </div>
                </div>
              )}
              
              {claim.status === "denied" && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <X size={16} className="text-red-500" />
                    <span className="text-sm font-medium text-red-400">
                      Claim denied
                    </span>
                  </div>
                </div>
              )}
              
              {claim.escalated_to_insurer && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink size={16} className="text-purple-500" />
                    <span className="text-sm font-medium text-purple-400">
                      Escalated to pro's insurance company
                    </span>
                  </div>
                </div>
              )}
              
              {claim.resolution_notes && (
                <div className="bg-muted border rounded p-3">
                  <h4 className="text-sm font-medium mb-1">Resolution:</h4>
                  <p className="text-sm text-muted-foreground">{claim.resolution_notes}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* File Claim Dialog */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>File Liability Claim</DialogTitle>
            <DialogDescription>
              Report damage, injury, or other issues that occurred during your service.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div>
              <Label htmlFor="service_request_id">Related Service (Optional)</Label>
              <Select name="service_request_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select service if applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific service</SelectItem>
                  {serviceRequests?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.service_type} - {service.service_address} 
                      ({format(new Date(service.created_at), "MMM dd")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pro_id">Pro ID *</Label>
              <Input 
                id="pro_id" 
                name="pro_id" 
                placeholder="Enter the Pro's ID"
                required 
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can find this in your service confirmation or receipt
              </p>
            </div>
            
            <div>
              <Label htmlFor="claim_type">Claim Type *</Label>
              <Select name="claim_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select claim type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_damage">Property Damage</SelectItem>
                  <SelectItem value="structural">Structural Damage</SelectItem>
                  <SelectItem value="bodily_injury">Bodily Injury</SelectItem>
                  <SelectItem value="theft">Theft or Missing Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe what happened, when it occurred, and the extent of damage or injury"
                rows={4}
                required 
              />
            </div>
            
            <div>
              <Label htmlFor="estimated_damage">Estimated Damage Amount ($)</Label>
              <Input 
                id="estimated_damage" 
                name="estimated_damage" 
                type="number" 
                min="0" 
                step="0.01"
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Estimate the cost to repair or replace
              </p>
            </div>
            
            <div>
              <Label>Evidence Photos (Optional)</Label>
              <div className="space-y-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Eye size={16} />
                    <span className="text-sm truncate flex-1">{url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhotoUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhotoUrl}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Photo URL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload photos elsewhere and paste the URLs here
              </p>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowClaimDialog(false);
                setPhotoUrls([]);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={fileClaimMutation.isPending}>
                {fileClaimMutation.isPending ? "Filing..." : "File Claim"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}