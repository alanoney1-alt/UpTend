import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Plus, DollarSign, AlertTriangle, CheckCircle2, Clock,
  Building2, Shield, TrendingUp, BarChart3
} from "lucide-react";

function cents(amount: number) {
  return `$${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  awarded: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  completed: "bg-amber-100 text-amber-800",
  closeout: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function ContractDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["/api/government/contracts"],
  });

  const { data: expiringDocs = [] } = useQuery({
    queryKey: ["/api/government/compliance/expiring"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/government/contracts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/government/contracts"] });
      setShowCreate(false);
      toast({ title: "Contract created" });
    },
  });

  const activeContracts = (contracts as any[]).filter((c: any) => c.status === "active" || c.status === "awarded");
  const totalValue = (contracts as any[]).reduce((s: number, c: any) => s + (c.totalValue || 0), 0);
  const totalFunded = (contracts as any[]).reduce((s: number, c: any) => s + (c.fundedAmount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-amber-600" />
              Government Contracts
            </h1>
            <p className="text-gray-500 mt-1">Contract management, compliance & audit-ready documentation</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" /> New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Government Contract</DialogTitle></DialogHeader>
              <CreateContractForm onSubmit={(data: any) => createMutation.mutate(data)} loading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Contracts</p>
                  <p className="text-2xl font-bold text-amber-600">{activeContracts.length}</p>
                </div>
                <FileText className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">{cents(totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Funded</p>
                  <p className="text-2xl font-bold text-blue-600">{cents(totalFunded)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expiring Docs</p>
                  <p className="text-2xl font-bold text-red-600">{(expiringDocs as any[]).length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Docs Alert */}
        {(expiringDocs as any[]).length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Compliance Documents Expiring Soon</h3>
              </div>
              <div className="space-y-1">
                {(expiringDocs as any[]).slice(0, 5).map((doc: any) => (
                  <p key={doc.id} className="text-sm text-red-700">
                    {doc.docType.replace(/_/g, " ")} — {doc.fileName} — Expires: {doc.expirationDate}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-600" />
              All Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-gray-500">Loading contracts...</p>
            ) : (contracts as any[]).length === 0 ? (
              <p className="text-gray-500">No contracts yet. Create your first government contract.</p>
            ) : (
              <div className="space-y-3">
                {(contracts as any[]).map((contract: any) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/government/contracts/${contract.id}`)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">{contract.contractNumber}</span>
                        <Badge className={STATUS_COLORS[contract.status] || "bg-gray-100"}>{contract.status}</Badge>
                        {contract.sdvosbSetAside && <Badge className="bg-amber-100 text-amber-800">SDVOSB</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {contract.agencyName} • {contract.contractType?.replace(/_/g, " ")} • NAICS {contract.naicsCode || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {contract.startDate || "TBD"} → {contract.endDate || "TBD"} • {contract.performanceLocation || ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg text-amber-700">{cents(contract.totalValue)}</p>
                      <p className="text-sm text-gray-500">Funded: {cents(contract.fundedAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CreateContractForm({ onSubmit, loading }: { onSubmit: (data: any) => void; loading: boolean }) {
  const [form, setForm] = useState({
    contractNumber: "",
    contractType: "firm_fixed_price",
    totalValue: "",
    fundedAmount: "",
    agencyName: "",
    agencyCode: "",
    naicsCode: "",
    startDate: "",
    endDate: "",
    performanceLocation: "",
    contractingOfficer: "",
    contractingOfficerEmail: "",
    sdvosbSetAside: false,
    smallBusinessSetAside: false,
    prevailingWageDetermination: "",
    bondRequired: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      totalValue: Math.round(parseFloat(form.totalValue || "0") * 100),
      fundedAmount: Math.round(parseFloat(form.fundedAmount || "0") * 100),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contract Number *</Label>
          <Input value={form.contractNumber} onChange={e => setForm({ ...form, contractNumber: e.target.value })} required />
        </div>
        <div>
          <Label>Contract Type</Label>
          <Select value={form.contractType} onValueChange={v => setForm({ ...form, contractType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="firm_fixed_price">Firm Fixed Price</SelectItem>
              <SelectItem value="time_and_materials">Time & Materials</SelectItem>
              <SelectItem value="cost_plus">Cost Plus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Total Value ($)</Label>
          <Input type="number" step="0.01" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: e.target.value })} />
        </div>
        <div>
          <Label>Funded Amount ($)</Label>
          <Input type="number" step="0.01" value={form.fundedAmount} onChange={e => setForm({ ...form, fundedAmount: e.target.value })} />
        </div>
        <div>
          <Label>Agency Name</Label>
          <Input value={form.agencyName} onChange={e => setForm({ ...form, agencyName: e.target.value })} />
        </div>
        <div>
          <Label>NAICS Code</Label>
          <Input value={form.naicsCode} onChange={e => setForm({ ...form, naicsCode: e.target.value })} />
        </div>
        <div>
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <Label>End Date</Label>
          <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Performance Location</Label>
        <Input value={form.performanceLocation} onChange={e => setForm({ ...form, performanceLocation: e.target.value })} />
      </div>
      <div>
        <Label>Contracting Officer</Label>
        <Input value={form.contractingOfficer} onChange={e => setForm({ ...form, contractingOfficer: e.target.value })} />
      </div>
      <div>
        <Label>Prevailing Wage Determination #</Label>
        <Input value={form.prevailingWageDetermination} onChange={e => setForm({ ...form, prevailingWageDetermination: e.target.value })} placeholder="e.g. FL20240001" />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.sdvosbSetAside} onChange={e => setForm({ ...form, sdvosbSetAside: e.target.checked })} />
          <span className="text-sm">SDVOSB Set-Aside</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.bondRequired} onChange={e => setForm({ ...form, bondRequired: e.target.checked })} />
          <span className="text-sm">Bond Required</span>
        </label>
      </div>
      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
        {loading ? "Creating..." : "Create Contract"}
      </Button>
    </form>
  );
}
