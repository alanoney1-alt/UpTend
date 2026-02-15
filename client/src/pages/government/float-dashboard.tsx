import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, AlertTriangle, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, Settings, Download, RefreshCw,
  CheckCircle2, XCircle, Clock, AlertCircle
} from "lucide-react";

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getExposureColor(current: number, threshold: number): string {
  const pct = threshold > 0 ? current / threshold : 0;
  if (pct < 0.5) return "text-green-600";
  if (pct < 0.8) return "text-amber-500";
  return "text-red-600";
}

function getExposureBg(current: number, threshold: number): string {
  const pct = threshold > 0 ? current / threshold : 0;
  if (pct < 0.5) return "bg-green-50 border-green-200";
  if (pct < 0.8) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export default function FloatDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ledgerPage, setLedgerPage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ contractId: "", invoiceId: "", amount: "", checkOrEftNumber: "" });
  const [settingsForm, setSettingsForm] = useState({ maxFloatExposure: "", autoHoldThreshold: "", alertEmail: "", alertSms: "" });

  const { data: exposure, isLoading: exposureLoading } = useQuery({
    queryKey: ["/api/government/float/exposure"],
    queryFn: () => apiRequest("GET", "/api/government/float/exposure").then(r => r.json()),
  });

  const { data: ledger } = useQuery({
    queryKey: ["/api/government/float/ledger", ledgerPage],
    queryFn: () => apiRequest("GET", `/api/government/float/ledger?page=${ledgerPage}&limit=20`).then(r => r.json()),
  });

  const { data: forecast } = useQuery({
    queryKey: ["/api/government/float/forecast"],
    queryFn: () => apiRequest("GET", "/api/government/float/forecast?days=30").then(r => r.json()),
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/government/float/alerts"],
    queryFn: () => apiRequest("GET", "/api/government/float/alerts").then(r => r.json()),
  });

  const { data: settings } = useQuery({
    queryKey: ["/api/government/float/settings"],
    queryFn: () => apiRequest("GET", "/api/government/float/settings").then(r => r.json()),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/government/float/payment-received", data).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/government/float"] });
      setPaymentOpen(false);
      setPaymentForm({ contractId: "", invoiceId: "", amount: "", checkOrEftNumber: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/government/float/settings", data).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Settings updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/government/float/settings"] });
      setSettingsOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const exportCsv = () => {
    if (!ledger?.entries) return;
    const rows = [["Date", "Type", "Amount", "Balance After", "Description", "Stripe Transfer ID"].join(",")];
    for (const entry of ledger.entries) {
      rows.push([
        new Date(entry.createdAt).toISOString(),
        entry.entryType,
        (entry.amount / 100).toFixed(2),
        (entry.balanceAfter / 100).toFixed(2),
        `"${(entry.description || "").replace(/"/g, '""')}"`,
        entry.stripeTransferId || "",
      ].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `float-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (exposureLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const maxThreshold = settings?.maxFloatExposure || 50000000;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Float Dashboard</h1>
            <p className="text-gray-500 text-sm">Government contract cash flow management</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700">
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Government Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Contract ID</Label>
                    <Input value={paymentForm.contractId} onChange={e => setPaymentForm(p => ({ ...p, contractId: e.target.value }))} placeholder="Contract ID" />
                  </div>
                  <div>
                    <Label>Invoice ID</Label>
                    <Input value={paymentForm.invoiceId} onChange={e => setPaymentForm(p => ({ ...p, invoiceId: e.target.value }))} placeholder="Invoice ID" />
                  </div>
                  <div>
                    <Label>Amount ($)</Label>
                    <Input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Check/EFT Number</Label>
                    <Input value={paymentForm.checkOrEftNumber} onChange={e => setPaymentForm(p => ({ ...p, checkOrEftNumber: e.target.value }))} placeholder="Check #12345 or EFT-67890" />
                  </div>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={recordPaymentMutation.isPending}
                    onClick={() => recordPaymentMutation.mutate({
                      contractId: paymentForm.contractId,
                      invoiceId: paymentForm.invoiceId,
                      amount: Math.round(parseFloat(paymentForm.amount) * 100),
                      checkOrEftNumber: paymentForm.checkOrEftNumber,
                    })}
                  >
                    {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={settingsOpen} onOpenChange={(open) => {
              setSettingsOpen(open);
              if (open && settings) {
                setSettingsForm({
                  maxFloatExposure: (settings.maxFloatExposure / 100).toString(),
                  autoHoldThreshold: (settings.autoHoldThreshold / 100).toString(),
                  alertEmail: settings.alertEmail || "",
                  alertSms: settings.alertSms || "",
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Float Threshold Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Alert Threshold ($)</Label>
                    <Input type="number" step="1" value={settingsForm.maxFloatExposure} onChange={e => setSettingsForm(p => ({ ...p, maxFloatExposure: e.target.value }))} />
                    <p className="text-xs text-gray-500 mt-1">Send alert when float exposure exceeds this amount</p>
                  </div>
                  <div>
                    <Label>Auto-Hold Threshold ($)</Label>
                    <Input type="number" step="1" value={settingsForm.autoHoldThreshold} onChange={e => setSettingsForm(p => ({ ...p, autoHoldThreshold: e.target.value }))} />
                    <p className="text-xs text-gray-500 mt-1">Stop posting new work orders above this amount</p>
                  </div>
                  <div>
                    <Label>Alert Email</Label>
                    <Input type="email" value={settingsForm.alertEmail} onChange={e => setSettingsForm(p => ({ ...p, alertEmail: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Alert SMS</Label>
                    <Input type="tel" value={settingsForm.alertSms} onChange={e => setSettingsForm(p => ({ ...p, alertSms: e.target.value }))} />
                  </div>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={updateSettingsMutation.isPending}
                    onClick={() => updateSettingsMutation.mutate({
                      maxFloatExposure: Math.round(parseFloat(settingsForm.maxFloatExposure) * 100),
                      autoHoldThreshold: Math.round(parseFloat(settingsForm.autoHoldThreshold) * 100),
                      alertEmail: settingsForm.alertEmail || null,
                      alertSms: settingsForm.alertSms || null,
                    })}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${alert.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                {alert.severity === "critical" ? <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
                <span className={`text-sm ${alert.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Cash Committed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatDollars(exposure?.totalCommitted || 0)}</div>
              <p className="text-xs text-gray-500 mt-1">Active work order quotes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Cash Paid Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{formatDollars(exposure?.totalPaidOut || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Upfront + completion transfers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Government Payments Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{formatDollars(exposure?.totalReceived || 0)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Checks/EFT received</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getExposureBg(exposure?.currentExposure || 0, maxThreshold)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Current Float Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getExposureColor(exposure?.currentExposure || 0, maxThreshold)}`}>
                {formatDollars(exposure?.currentExposure || 0)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">{exposure?.activeWorkOrders || 0} active WOs</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{exposure?.pendingInvoices || 0} pending invoices</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Flow Forecast */}
        {forecast && forecast.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">30-Day Cash Flow Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end gap-0.5">
                {forecast.map((day: any, i: number) => {
                  const maxExposure = Math.max(...forecast.map((d: any) => Math.abs(d.projectedExposure)), 1);
                  const height = Math.max(4, Math.round((Math.abs(day.projectedExposure) / maxExposure) * 100));
                  const pct = maxThreshold > 0 ? day.projectedExposure / maxThreshold : 0;
                  const barColor = pct < 0.5 ? "bg-green-400" : pct < 0.8 ? "bg-amber-400" : "bg-red-400";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${day.date}: ${formatDollars(day.projectedExposure)}`}>
                      <div className={`w-full rounded-t ${barColor}`} style={{ height: `${height}%` }} />
                      {i % 7 === 0 && <span className="text-[9px] text-gray-400 mt-1">{day.date.slice(5)}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Today</span>
                <span>+30 days</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Float Ledger */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Float Ledger</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {ledger?.entries && ledger.entries.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4 text-right">Amount</th>
                        <th className="pb-2 pr-4 text-right">Balance</th>
                        <th className="pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.entries.map((entry: any) => (
                        <tr key={entry.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className={entry.amount > 0 ? "border-red-200 text-red-700" : "border-green-200 text-green-700"}>
                              {entry.entryType.replace(/_/g, " ")}
                            </Badge>
                          </td>
                          <td className={`py-2 pr-4 text-right font-mono ${entry.amount > 0 ? "text-red-600" : "text-green-600"}`}>
                            {entry.amount > 0 ? "+" : ""}{formatDollars(entry.amount)}
                          </td>
                          <td className="py-2 pr-4 text-right font-mono text-gray-700">
                            {formatDollars(entry.balanceAfter)}
                          </td>
                          <td className="py-2 text-gray-600 truncate max-w-xs" title={entry.description}>
                            {entry.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {ledger.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={ledgerPage <= 1} onClick={() => setLedgerPage(p => p - 1)}>Previous</Button>
                    <span className="text-sm text-gray-500 self-center">Page {ledger.page} of {ledger.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={ledgerPage >= ledger.totalPages} onClick={() => setLedgerPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No float ledger entries yet</p>
                <p className="text-xs mt-1">Entries will appear when payments are processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
