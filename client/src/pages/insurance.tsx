import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Shield, ShieldCheck, Plus, Trash2, Calendar, FileText,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function InsurancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [form, setForm] = useState({ insurancePartnerId: "", policyNumber: "", coverageType: "standard", expiresAt: "" });

  const { data: partners } = useQuery({
    queryKey: ["/api/insurance/partners"],
    queryFn: async () => {
      const res = await fetch("/api/insurance/partners");
      return res.json();
    },
  });

  const { data: myPolicies, isLoading } = useQuery({
    queryKey: ["/api/insurance/my-policies"],
    queryFn: async () => {
      const res = await fetch("/api/insurance/my-policies", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/insurance/link", form);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/my-policies"] });
      setShowLinkForm(false);
      setForm({ insurancePartnerId: "", policyNumber: "", coverageType: "standard", expiresAt: "" });
      toast({ title: "Insurance Linked!", description: "You'll now see coverage badges on eligible services." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link insurance.", variant: "destructive" });
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/insurance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/insurance/my-policies"] });
      toast({ title: "Removed", description: "Insurance policy unlinked." });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Insurance & Warranty</h1>
          <p className="text-slate-400">Link your home insurance or warranty to see covered services and save.</p>
        </div>

        {/* My Policies */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Policies</h2>
            <Button onClick={() => setShowLinkForm(!showLinkForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Link Insurance
            </Button>
          </div>

          {/* Link Form */}
          {showLinkForm && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader><CardTitle className="text-white text-lg">Link Insurance or Warranty</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Select value={form.insurancePartnerId} onValueChange={v => setForm(f => ({ ...f, insurancePartnerId: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {(partners || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.type.replace(/_/g, " ")})
                        {p.discountPercent > 0 && ` — ${p.discountPercent}% off`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Policy number" value={form.policyNumber} onChange={e => setForm(f => ({ ...f, policyNumber: e.target.value }))} className="bg-slate-900 border-slate-700" />
                <Select value={form.coverageType} onValueChange={v => setForm(f => ({ ...f, coverageType: v }))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Coverage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" placeholder="Expires" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="bg-slate-900 border-slate-700" />
                <Button onClick={() => linkMutation.mutate()} disabled={!form.insurancePartnerId || !form.policyNumber || linkMutation.isPending}>
                  Link Policy
                </Button>
              </CardContent>
            </Card>
          )}

          {isLoading && <p className="text-slate-500">Loading...</p>}

          {myPolicies?.length === 0 && !isLoading && (
            <Card className="bg-slate-800/30 border-slate-700 border-dashed">
              <CardContent className="p-8 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500">No insurance or warranty linked yet.</p>
                <p className="text-slate-600 text-sm mt-1">Link your policy to unlock coverage badges and discounts.</p>
              </CardContent>
            </Card>
          )}

          {(myPolicies || []).map((policy: any) => (
            <Card key={policy.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-8 h-8 ${policy.isExpired ? "text-slate-600" : "text-green-400"}`} />
                    <div>
                      <p className="font-semibold text-white">{policy.partnerName}</p>
                      <p className="text-sm text-slate-400 capitalize">{policy.partnerType?.replace(/_/g, " ")} • {policy.coverageType}</p>
                      <p className="text-xs text-slate-500 mt-1">Policy: {policy.policyNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {policy.discountPercent > 0 && (
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                        {policy.discountPercent}% off
                      </Badge>
                    )}
                    {policy.isExpired && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                    {policy.expiresAt && !policy.isExpired && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(policy.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkMutation.mutate(policy.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
