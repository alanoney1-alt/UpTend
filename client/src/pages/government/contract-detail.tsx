import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, DollarSign, Milestone, Briefcase, FileText, Shield,
  ClipboardList, History, AlertTriangle, CheckCircle2, Clock,
  Plus, Send, Calendar
} from "lucide-react";

function cents(amount: number | null | undefined) {
  return `$${((amount || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  current: "bg-green-100 text-green-800",
  expiring_soon: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  missing: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
  approved: "bg-green-100 text-green-800",
  disputed: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  posted: "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  assigned: "bg-green-100 text-green-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-teal-100 text-teal-800",
  verified: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery({ queryKey: [`/api/government/contracts/${id}`] });
  const { data: financials } = useQuery({ queryKey: [`/api/government/contracts/${id}/financials`] });
  const { data: milestones = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/milestones`] });
  const { data: workOrders = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/work-orders`] });
  const { data: workLogs = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/work-logs`] });
  const { data: payrollReports = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/payroll`] });
  const { data: invoices = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/invoices`] });
  const { data: compliance } = useQuery({ queryKey: [`/api/government/contracts/${id}/compliance`] });
  const { data: dailyLogs = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/daily-logs`] });
  const { data: modifications = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/modifications`] });
  const { data: auditTrail = [] } = useQuery({ queryKey: [`/api/government/contracts/${id}/audit-trail`] });

  if (isLoading) return <div className="p-6 text-gray-500">Loading contract...</div>;
  if (!dashboard) return <div className="p-6 text-red-500">Contract not found</div>;

  const contract = (dashboard as any).contract;
  const summary = (dashboard as any).summary;
  const fin = financials as any;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/government/contracts")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{contract.contractNumber}</h1>
            <p className="text-gray-500">{contract.agencyName} • {contract.contractType?.replace(/_/g, " ")}</p>
          </div>
          <Badge className={STATUS_COLORS[contract.status] || "bg-gray-100"}>{contract.status}</Badge>
          {contract.sdvosbSetAside && <Badge className="bg-amber-100 text-amber-800">SDVOSB</Badge>}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-4">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-lg font-bold text-amber-700">{cents(contract.totalValue)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-gray-500">Funded</p>
            <p className="text-lg font-bold text-blue-700">{cents(contract.fundedAmount)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-gray-500">Work Orders</p>
            <p className="text-lg font-bold text-green-700">{summary?.workOrdersCompleted || 0}/{summary?.workOrdersTotal || 0}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-gray-500">Burn Rate</p>
            <p className="text-lg font-bold text-orange-700">{summary?.burnRate || 0}%</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <p className="text-xs text-gray-500">Compliance</p>
            <p className={`text-lg font-bold ${summary?.complianceIssues ? "text-red-700" : "text-green-700"}`}>
              {summary?.complianceIssues ? `${summary.complianceIssues} issues` : " OK"}
            </p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
            <TabsTrigger value="work-logs">Work Logs</TabsTrigger>
            <TabsTrigger value="payroll">WH-347 Reports</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="daily-logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="modifications">Mods</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardContent className="pt-6 grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Contract #:</span> <strong>{contract.contractNumber}</strong></div>
                <div><span className="text-gray-500">Agency:</span> <strong>{contract.agencyName}</strong> ({contract.agencyCode})</div>
                <div><span className="text-gray-500">Type:</span> <strong>{contract.contractType?.replace(/_/g, " ")}</strong></div>
                <div><span className="text-gray-500">NAICS:</span> <strong>{contract.naicsCode || "N/A"}</strong></div>
                <div><span className="text-gray-500">Start:</span> <strong>{contract.startDate || "TBD"}</strong></div>
                <div><span className="text-gray-500">End:</span> <strong>{contract.endDate || "TBD"}</strong></div>
                <div><span className="text-gray-500">Location:</span> <strong>{contract.performanceLocation || "N/A"}</strong></div>
                <div><span className="text-gray-500">CO:</span> <strong>{contract.contractingOfficer || "N/A"}</strong></div>
                <div><span className="text-gray-500">CO Email:</span> <strong>{contract.contractingOfficerEmail || "N/A"}</strong></div>
                <div><span className="text-gray-500">Bond Required:</span> <strong>{contract.bondRequired ? `Yes (${cents(contract.bondAmount)})` : "No"}</strong></div>
                <div><span className="text-gray-500">Security Clearance:</span> <strong>{contract.securityClearanceRequired ? "Yes" : "No"}</strong></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-600" /> Budget vs Actual</CardTitle></CardHeader>
              <CardContent>
                {fin ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 border rounded"><p className="text-xs text-gray-500">Budget</p><p className="text-lg font-bold">{cents(fin.budget)}</p></div>
                      <div className="p-3 border rounded"><p className="text-xs text-gray-500">Funded</p><p className="text-lg font-bold">{cents(fin.funded)}</p></div>
                      <div className="p-3 border rounded"><p className="text-xs text-gray-500">Invoiced</p><p className="text-lg font-bold">{cents(fin.totalInvoiced)}</p></div>
                      <div className="p-3 border rounded"><p className="text-xs text-gray-500">Remaining</p><p className="text-lg font-bold text-green-700">{cents(fin.remaining)}</p></div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Spending by Category</h4>
                      {["workOrders", "materials", "equipment", "subcontractor"].map(cat => (
                        <div key={cat} className="flex items-center gap-4">
                          <span className="w-28 text-sm text-gray-500 capitalize">{cat === "workOrders" ? "Work Orders" : cat}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-amber-500 rounded-full h-4"
                              style={{ width: `${fin.budget > 0 ? Math.min(100, ((fin.spent[cat] || 0) / fin.budget) * 100) : 0}%` }} />
                          </div>
                          <span className="text-sm font-medium w-24 text-right">{cents(fin.spent[cat] || 0)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">Daily burn rate: {cents(fin.dailyBurnRate)} • {fin.percentComplete}% complete</p>
                  </div>
                ) : <p className="text-gray-500">Loading financials...</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones"><MilestonesSection contractId={id!} milestones={milestones as any[]} /></TabsContent>
          <TabsContent value="work-orders"><WorkOrdersSection contractId={id!} workOrders={workOrders as any[]} milestones={milestones as any[]} /></TabsContent>
          <TabsContent value="work-logs"><WorkLogsSection contractId={id!} logs={workLogs as any[]} /></TabsContent>
          <TabsContent value="payroll"><PayrollSection contractId={id!} reports={payrollReports as any[]} /></TabsContent>
          <TabsContent value="invoices"><InvoicesSection contractId={id!} invoices={invoices as any[]} /></TabsContent>
          <TabsContent value="compliance"><ComplianceSection contractId={id!} compliance={compliance as any} /></TabsContent>
          <TabsContent value="daily-logs"><DailyLogsSection contractId={id!} logs={dailyLogs as any[]} /></TabsContent>
          <TabsContent value="modifications"><ModificationsSection contractId={id!} modifications={modifications as any[]} /></TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-amber-600" /> Audit Trail (Immutable)</CardTitle></CardHeader>
              <CardContent>
                {(auditTrail as any[]).length === 0 ? <p className="text-gray-500">No audit entries yet.</p> : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(auditTrail as any[]).map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 p-2 border-b text-sm">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">{log.action}</span>
                          <span className="text-gray-500"> on {log.entityType}</span>
                          {log.userId && <span className="text-gray-400"> by {log.userId.slice(0, 8)}...</span>}
                          <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                          {log.details && <pre className="text-xs text-gray-500 mt-1">{JSON.stringify(log.details, null, 2)}</pre>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==========================================
// Sub-sections
// ==========================================

function MilestonesSection({ contractId, milestones }: { contractId: string; milestones: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ milestoneNumber: 1, title: "", description: "", dueDate: "", paymentAmount: "" });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/milestones`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/milestones`] }); setShowAdd(false); toast({ title: "Milestone added" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Milestone className="h-5 w-5 text-amber-600" /> Milestones</CardTitle>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate({ ...form, paymentAmount: Math.round(parseFloat(form.paymentAmount || "0") * 100) }); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Number</Label><Input type="number" value={form.milestoneNumber} onChange={e => setForm({ ...form, milestoneNumber: parseInt(e.target.value) })} /></div>
                <div><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
              </div>
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Payment Amount ($)</Label><Input type="number" step="0.01" value={form.paymentAmount} onChange={e => setForm({ ...form, paymentAmount: e.target.value })} /></div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Add Milestone</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {milestones.length === 0 ? <p className="text-gray-500">No milestones.</p> : (
          <div className="space-y-3">
            {milestones.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{m.milestoneNumber} {m.title}</span>
                    <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
                    <Badge className={STATUS_COLORS[m.paymentStatus]}>{m.paymentStatus}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{m.description || ""} {m.dueDate && `• Due: ${m.dueDate}`}</p>
                </div>
                <span className="font-semibold text-amber-700">{cents(m.paymentAmount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkOrdersSection({ contractId, workOrders, milestones }: { contractId: string; workOrders: any[]; milestones: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", scopeOfWork: "", serviceType: "", deliverables: "",
    location: "", deadline: "", milestoneId: "", budgetAmount: "", status: "draft",
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/work-orders`, data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/work-orders`] });
      setShowAdd(false);
      if (data?._warning) {
        toast({ title: "Work order created", description: data._warning, variant: "destructive" });
      } else {
        toast({ title: "Work order created" });
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (woId: string) => apiRequest("PUT", `/api/government/work-orders/${woId}/verify`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/work-orders`] });
      toast({ title: "Work order verified" });
    },
  });

  const totalQuoted = workOrders.filter(wo => wo.acceptedQuoteAmount).reduce((s, wo) => s + (wo.acceptedQuoteAmount || 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-amber-600" /> Work Orders</CardTitle>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Create</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Work Order</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate({
              ...form,
              budgetAmount: form.budgetAmount ? Math.round(parseFloat(form.budgetAmount) * 100) : undefined,
              milestoneId: form.milestoneId || undefined,
            }); }} className="space-y-3 max-h-[70vh] overflow-y-auto">
              <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Scope of Work</Label><Textarea value={form.scopeOfWork} onChange={e => setForm({ ...form, scopeOfWork: e.target.value })} /></div>
              <div><Label>Deliverables (what defines "done")</Label><Textarea value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Service Type</Label><Input value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                <div>
                  <Label>Milestone</Label>
                  <Select value={form.milestoneId} onValueChange={v => setForm({ ...form, milestoneId: v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      {milestones.map((m: any) => <SelectItem key={m.id} value={m.id}>#{m.milestoneNumber} {m.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Internal Budget ($) — not shown to pros</Label><Input type="number" step="0.01" value={form.budgetAmount} onChange={e => setForm({ ...form, budgetAmount: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted (visible to pros)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Create Work Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-500">Total: <strong>{workOrders.length}</strong></span>
          <span className="text-gray-500">Accepted Quotes: <strong>{cents(totalQuoted)}</strong></span>
          <span className="text-gray-500">Verified: <strong>{workOrders.filter(wo => wo.status === "verified").length}</strong></span>
        </div>
        {workOrders.length === 0 ? <p className="text-gray-500">No work orders.</p> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {workOrders.map((wo: any) => (
              <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{wo.title}</span>
                    <Badge className={STATUS_COLORS[wo.status]}>{wo.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {wo.serviceType && `${wo.serviceType} • `}
                    {wo.location && `${wo.location} • `}
                    {wo.deadline && `Due: ${wo.deadline}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {wo.acceptedQuoteAmount > 0 && <span className="font-medium text-amber-700">{cents(wo.acceptedQuoteAmount)}</span>}
                  {wo.status === "completed" && (
                    <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate(wo.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WorkLogsSection({ contractId, logs }: { contractId: string; logs: any[] }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const approveMutation = useMutation({
    mutationFn: (logId: string) => apiRequest("PUT", `/api/government/work-logs/${logId}/approve`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/work-logs`] }); toast({ title: "Work log approved" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-amber-600" /> Work Logs</CardTitle>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => navigate(`/government/contracts/${contractId}/labor`)}>
          <Plus className="h-4 w-4 mr-1" /> Add Log
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 text-sm">
          <span className="text-gray-500">Total Logs: <strong>{logs.length}</strong></span>
          <span className="text-gray-500">Approved: <strong>{logs.filter(l => l.status === "approved").length}</strong></span>
        </div>
        {logs.length === 0 ? <p className="text-gray-500">No work logs.</p> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.workDate}</span>
                    <Badge className={STATUS_COLORS[log.status]}>{log.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500">{log.description}</p>
                </div>
                {log.status === "pending" && (
                  <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(log.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PayrollSection({ contractId, reports }: { contractId: string; reports: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [weekDate, setWeekDate] = useState("");

  const generateMutation = useMutation({
    mutationFn: (weekEndingDate: string) => apiRequest("POST", `/api/government/contracts/${contractId}/payroll/generate`, { weekEndingDate }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/payroll`] }); toast({ title: "WH-347 compliance report generated" }); setWeekDate(""); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-amber-600" /> WH-347 Compliance Reports</CardTitle>
        <div className="flex items-center gap-2">
          <Input type="date" value={weekDate} onChange={e => setWeekDate(e.target.value)} className="w-40" />
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => weekDate && generateMutation.mutate(weekDate)} disabled={!weekDate}>
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-400 mb-3 italic">Internal compliance reports only — generated from work order data for government reporting requirements.</p>
        {reports.length === 0 ? <p className="text-gray-500">No reports.</p> : (
          <div className="space-y-2">
            {reports.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg text-sm cursor-pointer hover:bg-amber-50"
                onClick={() => navigate(`/government/contracts/${contractId}/payroll/${r.id}`)}>
                <div>
                  <span className="font-medium">Report #{r.reportNumber}</span>
                  <span className="text-gray-500 ml-2">Week ending: {r.weekEndingDate}</span>
                  <Badge className={`ml-2 ${STATUS_COLORS[r.status]}`}>{r.status}</Badge>
                </div>
                <span className="font-medium">{cents(r.totalGrossWages)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvoicesSection({ contractId, invoices }: { contractId: string; invoices: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showGen, setShowGen] = useState(false);
  const [period, setPeriod] = useState({ start: "", end: "" });

  const genMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/invoices`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/invoices`] }); setShowGen(false); toast({ title: "Invoice generated" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-600" /> Invoices</CardTitle>
        <Dialog open={showGen} onOpenChange={setShowGen}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Generate</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate Invoice</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); genMutation.mutate({ periodStart: period.start, periodEnd: period.end }); }} className="space-y-3">
              <div><Label>Period Start</Label><Input type="date" value={period.start} onChange={e => setPeriod({ ...period, start: e.target.value })} required /></div>
              <div><Label>Period End</Label><Input type="date" value={period.end} onChange={e => setPeriod({ ...period, end: e.target.value })} required /></div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Generate Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? <p className="text-gray-500">No invoices.</p> : (
          <div className="space-y-2">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <span className="font-medium">{inv.invoiceNumber}</span>
                  <Badge className={`ml-2 ${STATUS_COLORS[inv.status]}`}>{inv.status}</Badge>
                  <span className="text-gray-500 ml-2">{inv.invoicePeriodStart} → {inv.invoicePeriodEnd}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{cents(inv.totalAmount)}</p>
                  {inv.dueDate && <p className="text-xs text-gray-400">Due: {inv.dueDate}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceSection({ contractId, compliance }: { contractId: string; compliance: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showUpload, setShowUpload] = useState(false);
  const [docForm, setDocForm] = useState({ docType: "insurance_cert", fileName: "", fileUrl: "", expirationDate: "" });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/compliance/docs`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/compliance`] }); setShowUpload(false); toast({ title: "Document uploaded" }); },
  });

  const docTypeLabels: Record<string, string> = {
    insurance_cert: "Insurance Certificate", bond: "Performance Bond", sdvosb_cert: "SDVOSB Certification",
    sam_registration: "SAM Registration", w9: "W-9 Form", eeo_poster: "EEO Poster",
    drug_free_workplace: "Drug-Free Workplace",
  };

  const statusIcon = (status: string) => {
    if (status === "current") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "expiring_soon") return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" /> Compliance
          {compliance && (
            <Badge className={compliance.compliant ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
              {compliance.compliant ? "Compliant" : `${compliance.issues} Issues`}
            </Badge>
          )}
        </CardTitle>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Upload Doc</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Compliance Document</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); uploadMutation.mutate(docForm); }} className="space-y-3">
              <div>
                <Label>Document Type</Label>
                <Select value={docForm.docType} onValueChange={v => setDocForm({ ...docForm, docType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>File Name</Label><Input value={docForm.fileName} onChange={e => setDocForm({ ...docForm, fileName: e.target.value })} /></div>
              <div><Label>File URL</Label><Input value={docForm.fileUrl} onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })} /></div>
              <div><Label>Expiration Date</Label><Input type="date" value={docForm.expirationDate} onChange={e => setDocForm({ ...docForm, expirationDate: e.target.value })} /></div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Upload</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!compliance ? <p className="text-gray-500">Loading...</p> : (
          <div className="space-y-2">
            {compliance.checklist?.map((item: any) => (
              <div key={item.docType} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {statusIcon(item.status)}
                  <span className="font-medium">{docTypeLabels[item.docType] || item.docType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[item.status]}>{item.status.replace(/_/g, " ")}</Badge>
                  {item.doc?.expirationDate && <span className="text-xs text-gray-400">Exp: {item.doc.expirationDate}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyLogsSection({ contractId, logs }: { contractId: string; logs: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ logDate: "", weather: "", temperature: "", workPerformed: "", materialsUsed: "", safetyIncidents: "", delayReasons: "" });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/daily-logs`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/daily-logs`] }); setShowAdd(false); toast({ title: "Daily log created" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-amber-600" /> Daily Logs</CardTitle>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Add Log</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Daily Log</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(form); }} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Date *</Label><Input type="date" value={form.logDate} onChange={e => setForm({ ...form, logDate: e.target.value })} required /></div>
                <div><Label>Weather</Label><Input value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })} /></div>
                <div><Label>Temp</Label><Input value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} /></div>
              </div>
              <div><Label>Work Performed</Label><Textarea value={form.workPerformed} onChange={e => setForm({ ...form, workPerformed: e.target.value })} /></div>
              <div><Label>Materials Used</Label><Textarea value={form.materialsUsed} onChange={e => setForm({ ...form, materialsUsed: e.target.value })} /></div>
              <div><Label>Safety Incidents</Label><Textarea value={form.safetyIncidents} onChange={e => setForm({ ...form, safetyIncidents: e.target.value })} /></div>
              <div><Label>Delay Reasons</Label><Textarea value={form.delayReasons} onChange={e => setForm({ ...form, delayReasons: e.target.value })} /></div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Create Log</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? <p className="text-gray-500">No daily logs.</p> : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="p-3 border rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{log.logDate}</span>
                  {log.weather && <span className="text-gray-500">{log.weather} {log.temperature}</span>}
                </div>
                {log.workPerformed && <p className="text-gray-700">{log.workPerformed}</p>}
                {log.safetyIncidents && <p className="text-red-600 text-xs mt-1"> Safety: {log.safetyIncidents}</p>}
                {log.delayReasons && <p className="text-yellow-600 text-xs mt-1"> Delay: {log.delayReasons}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModificationsSection({ contractId, modifications }: { contractId: string; modifications: any[] }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ modNumber: "", modType: "administrative", description: "", previousValue: "", newValue: "", effectiveDate: "" });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/government/contracts/${contractId}/modifications`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [`/api/government/contracts/${contractId}/modifications`] }); setShowAdd(false); toast({ title: "Modification added" }); },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-amber-600" /> Contract Modifications</CardTitle>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-1" /> Add Mod</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contract Modification</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate({ ...form, previousValue: form.previousValue ? Math.round(parseFloat(form.previousValue) * 100) : undefined, newValue: form.newValue ? Math.round(parseFloat(form.newValue) * 100) : undefined }); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Mod Number *</Label><Input value={form.modNumber} onChange={e => setForm({ ...form, modNumber: e.target.value })} required /></div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.modType} onValueChange={v => setForm({ ...form, modType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="scope_change">Scope Change</SelectItem>
                      <SelectItem value="funding">Funding</SelectItem>
                      <SelectItem value="time_extension">Time Extension</SelectItem>
                      <SelectItem value="termination">Termination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Previous Value ($)</Label><Input type="number" step="0.01" value={form.previousValue} onChange={e => setForm({ ...form, previousValue: e.target.value })} /></div>
                <div><Label>New Value ($)</Label><Input type="number" step="0.01" value={form.newValue} onChange={e => setForm({ ...form, newValue: e.target.value })} /></div>
              </div>
              <div><Label>Effective Date</Label><Input type="date" value={form.effectiveDate} onChange={e => setForm({ ...form, effectiveDate: e.target.value })} /></div>
              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700">Add Modification</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {modifications.length === 0 ? <p className="text-gray-500">No modifications.</p> : (
          <div className="space-y-2">
            {modifications.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <span className="font-medium">Mod {m.modNumber}</span>
                  <Badge className="ml-2">{m.modType?.replace(/_/g, " ")}</Badge>
                  <Badge className={`ml-2 ${STATUS_COLORS[m.status]}`}>{m.status}</Badge>
                  <p className="text-gray-500 text-xs mt-1">{m.description}</p>
                </div>
                {m.newValue && <span className="font-medium">{cents(m.newValue)}</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
