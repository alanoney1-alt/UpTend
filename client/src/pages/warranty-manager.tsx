import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/landing/header";
import {
  ShieldCheck, Plus, AlertTriangle, Trash2, FileText, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

interface Warranty {
  id: number;
  appliance_name: string;
  brand: string | null;
  model: string | null;
  purchase_date: string | null;
  expiration_date: string | null;
  warranty_provider: string | null;
  policy_number: string | null;
  coverage_details: string | null;
  receipt_url: string | null;
}

function getStatus(expirationDate: string | null): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (!expirationDate) return { label: "Unknown", variant: "secondary" };
  const exp = new Date(expirationDate);
  const now = new Date();
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", variant: "destructive" };
  if (diffDays <= 90) return { label: "Expiring Soon", variant: "default" };
  return { label: "Active", variant: "secondary" };
}

export default function WarrantyManager() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [claimWarrantyId, setClaimWarrantyId] = useState<number | null>(null);
  const [claimDescription, setClaimDescription] = useState("");
  const [formData, setFormData] = useState({
    applianceName: "", brand: "", model: "", purchaseDate: "", expirationDate: "",
    warrantyProvider: "", policyNumber: "", coverageDetails: "",
  });

  const { data: warrantyData, isLoading } = useQuery({
    queryKey: ["/api/warranty"],
    queryFn: () => apiRequest("GET", "/api/warranty").then(r => r.json()),
  });

  const { data: expiringData } = useQuery({
    queryKey: ["/api/warranty/expiring"],
    queryFn: () => apiRequest("GET", "/api/warranty/expiring").then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/warranty", formData).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranty"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warranty/expiring"] });
      setShowForm(false);
      setFormData({ applianceName: "", brand: "", model: "", purchaseDate: "", expirationDate: "", warrantyProvider: "", policyNumber: "", coverageDetails: "" });
      toast({ title: "Warranty added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/warranty/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warranty"] });
      toast({ title: "Warranty removed" });
    },
  });

  const claimMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/warranty/${id}/claim`, { description: claimDescription }).then(r => r.json()),
    onSuccess: () => {
      setClaimWarrantyId(null);
      setClaimDescription("");
      toast({ title: "Claim submitted" });
    },
  });

  const warranties: Warranty[] = warrantyData?.warranties || [];
  const expiring: Warranty[] = expiringData?.warranties || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warranty Manager</h1>
            <p className="text-gray-600 mt-1">Track and manage all your home warranties in one place.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" /> Add Warranty
          </Button>
        </div>

        {/* Expiring Soon Section */}
        {expiring.length > 0 && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expiring.map((w) => (
                  <div key={w.id} className="flex justify-between items-center p-2 bg-white rounded border border-amber-200">
                    <span className="font-medium">{w.appliance_name} {w.brand ? `(${w.brand})` : ""}</span>
                    <span className="text-sm text-amber-700">Expires {w.expiration_date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Warranty Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Add New Warranty</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Appliance Name *</Label>
                  <Input value={formData.applianceName} onChange={(e) => setFormData({ ...formData, applianceName: e.target.value })} placeholder="e.g. HVAC System" />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="e.g. Carrier" />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} />
                </div>
                <div>
                  <Label>Expiration Date</Label>
                  <Input type="date" value={formData.expirationDate} onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} />
                </div>
                <div>
                  <Label>Warranty Provider</Label>
                  <Input value={formData.warrantyProvider} onChange={(e) => setFormData({ ...formData, warrantyProvider: e.target.value })} />
                </div>
                <div>
                  <Label>Policy Number</Label>
                  <Input value={formData.policyNumber} onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Coverage Details</Label>
                  <Textarea value={formData.coverageDetails} onChange={(e) => setFormData({ ...formData, coverageDetails: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => addMutation.mutate()} disabled={!formData.applianceName || addMutation.isPending} className="bg-amber-600 hover:bg-amber-700">
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Warranty
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warranty Cards */}
        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" /></div>
        ) : warranties.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShieldCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No warranties tracked yet</h3>
              <p className="text-gray-500 mt-1">Add your first warranty to start tracking coverage and expiration dates.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map((w) => {
              const status = getStatus(w.expiration_date);
              return (
                <Card key={w.id}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{w.appliance_name}</h3>
                        {w.brand && <p className="text-sm text-gray-500">{w.brand} {w.model ? `/ ${w.model}` : ""}</p>}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    {w.expiration_date && <p className="text-sm text-gray-600 mb-1">Expires: {w.expiration_date}</p>}
                    {w.warranty_provider && <p className="text-sm text-gray-600 mb-1">Provider: {w.warranty_provider}</p>}
                    {w.policy_number && <p className="text-sm text-gray-600 mb-1">Policy: {w.policy_number}</p>}
                    {w.coverage_details && <p className="text-sm text-gray-500 mt-2">{w.coverage_details}</p>}

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={() => setClaimWarrantyId(claimWarrantyId === w.id ? null : w.id)}>
                        <FileText className="w-3 h-3 mr-1" /> File Claim
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMutation.mutate(w.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    </div>

                    {claimWarrantyId === w.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <Label>Describe the issue</Label>
                        <Textarea value={claimDescription} onChange={(e) => setClaimDescription(e.target.value)} placeholder="What happened?" className="mt-1" />
                        <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700" onClick={() => claimMutation.mutate(w.id)} disabled={!claimDescription || claimMutation.isPending}>
                          Submit Claim
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
