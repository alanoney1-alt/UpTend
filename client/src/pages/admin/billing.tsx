import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Ban, Loader2, Play, FileText, Search, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdminBillingRun {
  id: string;
  businessAccountId: string;
  businessName: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  totalAmount: number;
  jobCount: number;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

function statusBadge(status: string) {
  switch (status) {
    case "charged":
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Charged</Badge>;
    case "failed":
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    case "void":
      return <Badge className="bg-gray-100 text-gray-800"><Ban className="w-3 h-3 mr-1" /> Void</Badge>;
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800"><Loader2 className="w-3 h-3 mr-1" /> Pending</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" /> {status}</Badge>;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatWeek(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  e.setDate(e.getDate() - 1);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function AdminBilling() {
  const [tab, setTab] = useState("runs");
  const [statusFilter, setStatusFilter] = useState("");
  const [voidRunId, setVoidRunId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const queryClient = useQueryClient();

  const { data: runs, isLoading } = useQuery<AdminBillingRun[]>({
    queryKey: ["/api/admin/billing/runs", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      return fetch(`/api/admin/billing/runs?${params}`, { credentials: "include" }).then((r) => r.json());
    },
  });

  const { data: reconciliation } = useQuery({
    queryKey: ["/api/admin/billing/reconciliation"],
    queryFn: () => fetch("/api/admin/billing/reconciliation", { credentials: "include" }).then((r) => r.json()),
    enabled: tab === "reconciliation",
  });

  const processAll = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/billing/process-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/runs"] }),
  });

  const voidRun = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest("POST", `/api/admin/billing/void/${id}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/runs"] });
      setVoidRunId(null);
      setVoidReason("");
    },
  });

  const failedRuns = runs?.filter((r) => r.status === "failed") || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">B2B Billing Admin</h1>
            <p className="text-gray-500">Weekly billing oversight & management</p>
          </div>
          <Button
            onClick={() => processAll.mutate()}
            disabled={processAll.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {processAll.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Process All Weekly Billing
          </Button>
        </div>

        {/* Failed charges alert */}
        {failedRuns.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                <AlertTriangle className="w-5 h-5" /> {failedRuns.length} Failed Charge{failedRuns.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-1 text-sm">
                {failedRuns.slice(0, 5).map((r) => (
                  <div key={r.id}>
                    {r.businessName}. ${r.totalAmount.toFixed(2)}. {r.errorMessage}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="runs">All Runs</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          </TabsList>

          <TabsContent value="runs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Billing Runs</CardTitle>
                <div className="flex gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="charged">Charged</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                    <option value="void">Void</option>
                    <option value="draft">Draft</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/runs"] })}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-gray-500 p-4">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : !runs || runs.length === 0 ? (
                  <p className="text-gray-500 p-4">No billing runs found.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="p-2">Business</th>
                        <th className="p-2">Week</th>
                        <th className="p-2">Jobs</th>
                        <th className="p-2 text-right">Amount</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => (
                        <tr key={run.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{run.businessName}</td>
                          <td className="p-2">{formatWeek(run.weekStartDate, run.weekEndDate)}</td>
                          <td className="p-2">{run.jobCount}</td>
                          <td className="p-2 text-right">${run.totalAmount.toFixed(2)}</td>
                          <td className="p-2">{statusBadge(run.status)}</td>
                          <td className="p-2">
                            {run.status !== "void" && (
                              voidRunId === run.id ? (
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Reason"
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    className="h-7 text-xs w-32"
                                  />
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    disabled={!voidReason || voidRun.isPending}
                                    onClick={() => voidRun.mutate({ id: run.id, reason: voidReason })}
                                  >
                                    Void
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => { setVoidRunId(null); setVoidReason(""); }}
                                  >
                                    
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-red-600"
                                  onClick={() => setVoidRunId(run.id)}
                                >
                                  Void
                                </Button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reconciliation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" /> Reconciliation Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!reconciliation ? (
                  <p className="text-gray-500">Loading reconciliation data...</p>
                ) : reconciliation.length === 0 ? (
                  <p className="text-gray-500">No data to reconcile.</p>
                ) : (
                  <div className="space-y-4">
                    {reconciliation.map((run: any) => (
                      <div key={run.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="font-medium">{run.businessName}</span>
                            <span className="text-gray-500 ml-2">{formatWeek(run.weekStartDate, run.weekEndDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">${run.totalAmount.toFixed(2)}</span>
                            {statusBadge(run.status)}
                          </div>
                        </div>
                        {run.lineItems?.length > 0 && (
                          <table className="w-full text-xs mt-2">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="p-1">Job ID</th>
                                <th className="p-1">Property</th>
                                <th className="p-1">Service</th>
                                <th className="p-1">Completed</th>
                                <th className="p-1">Signoff</th>
                                <th className="p-1 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {run.lineItems.map((li: any) => (
                                <tr key={li.id} className="border-t">
                                  <td className="p-1 font-mono text-xs">{li.jobId?.slice(0, 8)}...</td>
                                  <td className="p-1">{li.propertyAddress}</td>
                                  <td className="p-1">{li.serviceType?.replace(/_/g, " ")}</td>
                                  <td className="p-1">{li.completedAt ? formatDate(li.completedAt) : "-"}</td>
                                  <td className="p-1">{li.customerSignoffAt ? "" : ""}</td>
                                  <td className="p-1 text-right">${li.totalCharge?.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
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
