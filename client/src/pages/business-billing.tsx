import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, DollarSign, FileText, Settings, AlertTriangle, CheckCircle, XCircle, Ban, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface BillingRun {
  id: string;
  businessAccountId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  totalAmount: number;
  jobCount: number;
  dryRun: boolean;
  createdAt: string;
  processedAt: string | null;
  stripePaymentIntentId: string | null;
  errorMessage: string | null;
  lineItems?: LineItem[];
}

interface LineItem {
  id: string;
  serviceRequestId: string;
  propertyAddress: string;
  serviceType: string;
  completedAt: string;
  customerSignoffAt: string | null;
  proName: string | null;
  laborCost: number;
  partsCost: number;
  platformFee: number;
  totalCharge: number;
}

interface BillingPreview {
  weekStart: string;
  weekEnd: string;
  jobCount: number;
  totalAmount: number;
  jobs: Array<{
    id: string;
    propertyAddress: string;
    serviceType: string;
    completedAt: string;
    customerSignoffAt: string | null;
    totalCharge: number;
    proName: string | null;
  }>;
}

interface BillingSettings {
  billingFrequency: string;
  autoBillingEnabled: boolean;
  billingContactEmail: string | null;
  billingDayOfWeek: number;
  hasPaymentMethod: boolean;
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
      return <Badge className="bg-amber-100 text-amber-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Pending</Badge>;
    case "draft":
      return <Badge className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatWeek(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  e.setDate(e.getDate() - 1);
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatServiceType(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BusinessBilling() {
  const [, navigate] = useLocation();
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [tab, setTab] = useState("upcoming");
  const queryClient = useQueryClient();

  // Queries
  const { data: preview, isLoading: previewLoading } = useQuery<BillingPreview>({
    queryKey: ["/api/business/billing/preview"],
  });

  const { data: runs, isLoading: runsLoading } = useQuery<BillingRun[]>({
    queryKey: ["/api/business/billing/runs"],
  });

  const { data: runDetail } = useQuery<BillingRun>({
    queryKey: ["/api/business/billing/runs", selectedRun],
    queryFn: () => fetch(`/api/business/billing/runs/${selectedRun}`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!selectedRun,
  });

  const { data: settings } = useQuery<BillingSettings>({
    queryKey: ["/api/business/billing/settings"],
  });

  const updateSettings = useMutation({
    mutationFn: (data: Partial<BillingSettings>) =>
      apiRequest("PUT", "/api/business/billing/settings", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/business/billing/settings"] }),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/business/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
            <p className="text-gray-500">Weekly billing for completed jobs</p>
          </div>
        </div>

        {/* Run Detail Modal */}
        {selectedRun && runDetail && (
          <Card className="mb-6 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Billing Run. {formatWeek(runDetail.weekStartDate, runDetail.weekEndDate)}
              </CardTitle>
              <div className="flex items-center gap-3">
                {statusBadge(runDetail.status)}
                <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)}></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div><span className="text-gray-500">Jobs:</span> {runDetail.jobCount}</div>
                <div><span className="text-gray-500">Total:</span> ${runDetail.totalAmount.toFixed(2)}</div>
                <div><span className="text-gray-500">Processed:</span> {runDetail.processedAt ? formatDate(runDetail.processedAt) : "-"}</div>
              </div>
              {runDetail.errorMessage && (
                <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {runDetail.errorMessage}
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 text-left">
                    <th className="p-2">Property</th>
                    <th className="p-2">Service</th>
                    <th className="p-2">Pro</th>
                    <th className="p-2">Completed</th>
                    <th className="p-2">Signoff</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(runDetail.lineItems || []).map((li) => (
                    <tr key={li.id} className="border-b">
                      <td className="p-2">{li.propertyAddress}</td>
                      <td className="p-2">{formatServiceType(li.serviceType)}</td>
                      <td className="p-2">{li.proName || "-"}</td>
                      <td className="p-2">{formatDate(li.completedAt)}</td>
                      <td className="p-2">{li.customerSignoffAt ? " Signed" : " Auto"}</td>
                      <td className="p-2 text-right font-medium">${li.totalCharge.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-4">
                Something wrong? <a href="mailto:support@uptend.com" className="text-amber-600 underline">Dispute this charge</a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming"><Calendar className="w-4 h-4 mr-1" /> Upcoming</TabsTrigger>
            <TabsTrigger value="history"><FileText className="w-4 h-4 mr-1" /> History</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Settings</TabsTrigger>
          </TabsList>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  This is what you'll be charged Monday
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading preview...
                  </div>
                ) : !preview || preview.jobCount === 0 ? (
                  <p className="text-gray-500">No eligible jobs for billing this week.</p>
                ) : (
                  <>
                    <div className="mb-4 p-3 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-700">${preview.totalAmount.toFixed(2)}</div>
                      <div className="text-sm text-amber-600">{preview.jobCount} completed job{preview.jobCount !== 1 ? "s" : ""} this week</div>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="p-2">Property</th>
                          <th className="p-2">Service</th>
                          <th className="p-2">Pro</th>
                          <th className="p-2">Completed</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.jobs.map((j) => (
                          <tr key={j.id} className="border-b">
                            <td className="p-2">{j.propertyAddress}</td>
                            <td className="p-2">{formatServiceType(j.serviceType)}</td>
                            <td className="p-2">{j.proName || "-"}</td>
                            <td className="p-2">{formatDate(j.completedAt)}</td>
                            <td className="p-2 text-right font-medium">${j.totalCharge.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                {runsLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : !runs || runs.length === 0 ? (
                  <p className="text-gray-500">No billing history yet.</p>
                ) : (
                  <div className="space-y-3">
                    {runs.filter((r) => !r.dryRun).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRun(run.id)}
                      >
                        <div>
                          <div className="font-medium">{formatWeek(run.weekStartDate, run.weekEndDate)}</div>
                          <div className="text-sm text-gray-500">{run.jobCount} job{run.jobCount !== 1 ? "s" : ""}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">${run.totalAmount.toFixed(2)}</span>
                          {statusBadge(run.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-Billing</Label>
                        <p className="text-sm text-gray-500">Automatically charge for completed jobs every week</p>
                      </div>
                      <Switch
                        checked={settings.autoBillingEnabled}
                        onCheckedChange={(checked) => updateSettings.mutate({ autoBillingEnabled: checked })}
                      />
                    </div>

                    <div>
                      <Label>Billing Contact Email</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          defaultValue={settings.billingContactEmail || ""}
                          placeholder="billing@company.com"
                          onBlur={(e) => {
                            if (e.target.value !== settings.billingContactEmail) {
                              updateSettings.mutate({ billingContactEmail: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <Label className="text-base">Payment Method</Label>
                      {settings.hasPaymentMethod ? (
                        <p className="text-sm text-green-600 mt-1"> Card on file</p>
                      ) : (
                        <div className="mt-2">
                          <p className="text-sm text-amber-600 mb-2"> No payment method on file. Add one to enable auto-billing.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Would trigger Stripe setup intent flow
                              fetch("/api/business/billing/payment-method", {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                              });
                            }}
                          >
                            Add Payment Method
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
