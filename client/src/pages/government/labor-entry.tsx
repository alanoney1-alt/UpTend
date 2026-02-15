import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, CheckCircle2, Users } from "lucide-react";

function cents(amount: number) {
  return `$${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const JOB_CLASSIFICATIONS = [
  "Laborer", "Carpenter", "Electrician", "Plumber", "Pipefitter",
  "HVAC Mechanic", "Painter", "Roofer", "Iron Worker", "Mason",
  "Equipment Operator", "Truck Driver", "Cement Mason", "Drywall Installer",
  "Insulation Worker", "Sheet Metal Worker", "Welder", "Foreman", "Supervisor",
];

export default function LaborEntry() {
  const { id: contractId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard } = useQuery({
    queryKey: [`/api/government/contracts/${contractId}`],
  });

  const contract = (dashboard as any)?.contract;
  const wageDetermination = contract?.prevailingWageDetermination;

  const { data: wageRates = [] } = useQuery({
    queryKey: [`/api/government/prevailing-wages/rates/${wageDetermination}`],
    enabled: !!wageDetermination,
  });

  const [form, setForm] = useState({
    proId: "",
    workDate: new Date().toISOString().split("T")[0],
    hoursWorked: "",
    hourlyRate: "",
    fringeBenefits: "",
    overtimeHours: "",
    overtimeRate: "",
    jobClassification: "",
    description: "",
    milestoneId: "",
  });

  const [wageWarning, setWageWarning] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/labor`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/labor`] });
      toast({ title: "Labor entry logged" });
      navigate(`/government/contracts/${contractId}`);
    },
    onError: (error: any) => {
      const msg = error?.message || "Failed to log labor entry";
      if (msg.includes("Prevailing wage")) {
        toast({ title: "Prevailing Wage Violation", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    },
  });

  const handleClassificationChange = (classification: string) => {
    setForm({ ...form, jobClassification: classification });

    // Auto-fill rate from prevailing wage
    const matchingRate = (wageRates as any[]).find((r: any) =>
      r.classification.toLowerCase() === classification.toLowerCase()
    );
    if (matchingRate) {
      setForm(f => ({
        ...f,
        jobClassification: classification,
        hourlyRate: (matchingRate.baseRate / 100).toString(),
        fringeBenefits: (matchingRate.fringeBenefits / 100).toString(),
        overtimeRate: ((matchingRate.overtimeRate || matchingRate.baseRate * 1.5) / 100).toString(),
      }));
      setWageWarning(null);
    }
  };

  const handleRateChange = (rate: string) => {
    setForm({ ...form, hourlyRate: rate });
    const rateInCents = Math.round(parseFloat(rate || "0") * 100);
    const fringeInCents = Math.round(parseFloat(form.fringeBenefits || "0") * 100);
    const totalRate = rateInCents + fringeInCents;

    const matchingRate = (wageRates as any[]).find((r: any) =>
      r.classification.toLowerCase() === form.jobClassification.toLowerCase()
    );
    if (matchingRate && totalRate < matchingRate.totalRate) {
      setWageWarning(`Rate ${cents(totalRate)} is below prevailing wage ${cents(matchingRate.totalRate)} for ${form.jobClassification}. Entry will be BLOCKED.`);
    } else {
      setWageWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      proId: form.proId,
      workDate: form.workDate,
      hoursWorked: parseFloat(form.hoursWorked || "0"),
      hourlyRate: Math.round(parseFloat(form.hourlyRate || "0") * 100),
      fringeBenefits: Math.round(parseFloat(form.fringeBenefits || "0") * 100),
      overtimeHours: parseFloat(form.overtimeHours || "0"),
      overtimeRate: Math.round(parseFloat(form.overtimeRate || "0") * 100),
      jobClassification: form.jobClassification,
      description: form.description,
      milestoneId: form.milestoneId || undefined,
    });
  };

  const grossPay = Math.round(parseFloat(form.hoursWorked || "0") * parseFloat(form.hourlyRate || "0") * 100)
    + Math.round(parseFloat(form.overtimeHours || "0") * parseFloat(form.overtimeRate || "0") * 100);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/government/contracts/${contractId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Contract
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" /> Log Labor Entry
          </h1>
        </div>

        {contract && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
            <strong>{contract.contractNumber}</strong> — {contract.agencyName}
            {wageDetermination && <span className="ml-2 text-amber-700">• Prevailing Wage: {wageDetermination}</span>}
          </div>
        )}

        {wageWarning && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{wageWarning}</p>
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pro ID *</Label>
                  <Input value={form.proId} onChange={e => setForm({ ...form, proId: e.target.value })} placeholder="Worker ID" required />
                </div>
                <div>
                  <Label>Work Date *</Label>
                  <Input type="date" value={form.workDate} onChange={e => setForm({ ...form, workDate: e.target.value })} required />
                </div>
              </div>

              <div>
                <Label>Job Classification *</Label>
                <Select value={form.jobClassification} onValueChange={handleClassificationChange}>
                  <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                  <SelectContent>
                    {JOB_CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Prevailing wage reference */}
              {(wageRates as any[]).length > 0 && form.jobClassification && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                  <strong>Prevailing Wage Reference:</strong>
                  {(wageRates as any[]).filter((r: any) => r.classification.toLowerCase() === form.jobClassification.toLowerCase()).map((r: any) => (
                    <span key={r.id} className="ml-2">
                      Base: {cents(r.baseRate)} | Fringe: {cents(r.fringeBenefits)} | Total: {cents(r.totalRate)}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Hours Worked *</Label>
                  <Input type="number" step="0.25" value={form.hoursWorked} onChange={e => setForm({ ...form, hoursWorked: e.target.value })} required />
                </div>
                <div>
                  <Label>Hourly Rate ($) *</Label>
                  <Input type="number" step="0.01" value={form.hourlyRate} onChange={e => handleRateChange(e.target.value)} required />
                </div>
                <div>
                  <Label>Fringe Benefits ($)</Label>
                  <Input type="number" step="0.01" value={form.fringeBenefits} onChange={e => setForm({ ...form, fringeBenefits: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overtime Hours</Label>
                  <Input type="number" step="0.25" value={form.overtimeHours} onChange={e => setForm({ ...form, overtimeHours: e.target.value })} />
                </div>
                <div>
                  <Label>Overtime Rate ($)</Label>
                  <Input type="number" step="0.01" value={form.overtimeRate} onChange={e => setForm({ ...form, overtimeRate: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Description of Work</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              {/* Gross Pay Calculator */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estimated Gross Pay:</span>
                  <span className="text-xl font-bold text-amber-700">{cents(grossPay)}</span>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending || !!wageWarning}>
                {createMutation.isPending ? "Saving..." : "Log Labor Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
