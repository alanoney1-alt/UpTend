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
import { Building2, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface WarrantyEntry {
  applianceName: string;
  brand: string;
  expirationDate: string;
  warrantyProvider: string;
}

export default function BuilderHandoff() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    address: "", homeownerEmail: "", homeownerName: "", closingDate: "", builderCompany: "",
  });
  const [warranties, setWarranties] = useState<WarrantyEntry[]>([]);
  const [newWarranty, setNewWarranty] = useState<WarrantyEntry>({ applianceName: "", brand: "", expirationDate: "", warrantyProvider: "" });

  const { data: handoffsData } = useQuery({
    queryKey: ["/api/builder/handoffs"],
    queryFn: () => apiRequest("GET", "/api/builder/handoffs").then(r => r.json()),
  });

  const handoffMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/builder/handoff", { ...formData, warranties }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/builder/handoffs"] });
      setSubmitted(true);
      toast({ title: "Handoff registered" });
    },
  });

  const addWarranty = () => {
    if (!newWarranty.applianceName) return;
    setWarranties([...warranties, newWarranty]);
    setNewWarranty({ applianceName: "", brand: "", expirationDate: "", warrantyProvider: "" });
  };

  const handoffs = handoffsData?.handoffs || [];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">George will take it from here.</h1>
          <p className="text-gray-600 mb-2">
            The homeowner has been registered and all warranty information has been loaded into their account.
          </p>
          <p className="text-gray-500 mb-8">
            George will reach out to {formData.homeownerName || "the homeowner"} to introduce himself and walk them through their new home coverage.
          </p>
          <Button onClick={() => { setSubmitted(false); setFormData({ address: "", homeownerEmail: "", homeownerName: "", closingDate: "", builderCompany: "" }); setWarranties([]); }} className="bg-amber-600 hover:bg-amber-700">
            Register Another Closing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Builder Handoff</h1>
          <p className="text-gray-600 mt-1">Register a new home closing and let George take over warranty management for the homeowner.</p>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Closing Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Property Address *</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St, Orlando, FL" />
              </div>
              <div>
                <Label>Builder / Company</Label>
                <Input value={formData.builderCompany} onChange={(e) => setFormData({ ...formData, builderCompany: e.target.value })} />
              </div>
              <div>
                <Label>Homeowner Email *</Label>
                <Input type="email" value={formData.homeownerEmail} onChange={(e) => setFormData({ ...formData, homeownerEmail: e.target.value })} />
              </div>
              <div>
                <Label>Homeowner Name</Label>
                <Input value={formData.homeownerName} onChange={(e) => setFormData({ ...formData, homeownerName: e.target.value })} />
              </div>
              <div>
                <Label>Closing Date</Label>
                <Input type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Builder Warranties</CardTitle></CardHeader>
          <CardContent>
            {warranties.length > 0 && (
              <div className="space-y-2 mb-4">
                {warranties.map((w, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{w.applianceName} {w.brand ? `(${w.brand})` : ""}</span>
                    <Button size="sm" variant="ghost" onClick={() => setWarranties(warranties.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Appliance name" value={newWarranty.applianceName} onChange={(e) => setNewWarranty({ ...newWarranty, applianceName: e.target.value })} />
              <Input placeholder="Brand" value={newWarranty.brand} onChange={(e) => setNewWarranty({ ...newWarranty, brand: e.target.value })} />
              <Input type="date" placeholder="Expiration" value={newWarranty.expirationDate} onChange={(e) => setNewWarranty({ ...newWarranty, expirationDate: e.target.value })} />
              <Button variant="outline" onClick={addWarranty} disabled={!newWarranty.applianceName}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-amber-600 hover:bg-amber-700 text-lg py-6"
          onClick={() => handoffMutation.mutate()}
          disabled={!formData.address || !formData.homeownerEmail || handoffMutation.isPending}
        >
          {handoffMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Building2 className="w-5 h-5 mr-2" />}
          Complete Handoff
        </Button>

        {/* Previous Handoffs */}
        {handoffs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Previous Handoffs</h2>
            <div className="space-y-3">
              {handoffs.map((h: any) => (
                <Card key={h.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{h.address}</p>
                      <p className="text-sm text-gray-500">{h.homeowner_name || h.homeowner_email} / {h.closing_date || "No date"}</p>
                    </div>
                    <Badge variant="secondary">{h.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
