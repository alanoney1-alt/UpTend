import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3, FileText, Receipt,
  Download, Plus, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";

const AMBER = "#f59e0b";
const AMBER_LIGHT = "#fbbf24";
const AMBER_DARK = "#d97706";
const COLORS = ["#f59e0b", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#78350f"];

function formatCurrency(n: number | null | undefined): string {
  return `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ title, value, icon: Icon, trend, color }: {
  title: string; value: string; icon: any; trend?: string; color?: string;
}) {
  return (
    <Card className="border-amber-200/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold" style={{ color: color || AMBER }}>{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <Icon className="h-8 w-8 text-amber-500/40" />
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Tab
function DashboardTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/reports/dashboard"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>;

  const d = data as any || {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Revenue Today" value={formatCurrency(d.revenueToday)} icon={DollarSign} />
        <StatCard title="Revenue This Week" value={formatCurrency(d.revenueWeek)} icon={TrendingUp} />
        <StatCard title="Revenue This Month" value={formatCurrency(d.revenueMonth)} icon={BarChart3} />
        <StatCard title="Payouts This Month" value={formatCurrency(d.payoutsMonth)} icon={ArrowDownRight} color="#ef4444" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Gross Margin" value={`${d.grossMargin || 0}%`} icon={TrendingUp} />
        <StatCard title="MRR (B2B)" value={formatCurrency(d.mrr)} icon={RefreshCw} />
        <StatCard title="Burn Rate" value={formatCurrency(d.burnRate)} icon={TrendingDown} color="#ef4444" />
        <StatCard title="Runway" value={d.runway === Infinity ? "∞" : `${(d.runway || 0).toFixed(1)} mo`} icon={Wallet} />
      </div>
      <Card className="border-amber-200/50">
        <CardHeader><CardTitle className="text-amber-600">Cash Balance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-amber-500">{formatCurrency(d.cashBalance)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Ledger Tab
function LedgerTab() {
  const [page, setPage] = useState(1);
  const [refType, setRefType] = useState("");
  const { data: accountsData } = useQuery({ queryKey: ["/api/accounting/accounts"] });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/ledger", page, refType],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (refType) params.set("referenceType", refType);
      const res = await fetch(`/api/accounting/ledger?${params}`, { credentials: "include" });
      return res.json();
    },
  });

  const accounts = (accountsData as any[]) || [];
  const accountMap = new Map(accounts.map((a: any) => [a.id, a.name]));
  const entries = (data as any)?.entries || [];
  const total = (data as any)?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <select
          className="border rounded px-3 py-1.5 text-sm bg-background"
          value={refType}
          onChange={(e) => { setRefType(e.target.value); setPage(1); }}
        >
          <option value="">All Types</option>
          {["job", "subscription", "refund", "dispute", "payout", "manual", "expense"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{total} entries</span>
        <a
          href={`/api/accounting/reports/export?format=csv`}
          className="ml-auto"
        >
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </a>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Date</th>
                <th className="pb-2">Account</th>
                <th className="pb-2 text-right">Debit</th>
                <th className="pb-2 text-right">Credit</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-amber-50/30">
                  <td className="py-2 pr-3 whitespace-nowrap">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""}</td>
                  <td className="py-2 pr-3">{accountMap.get(e.accountId) || e.accountId}</td>
                  <td className="py-2 pr-3 text-right font-mono">{e.debit > 0 ? formatCurrency(e.debit) : ""}</td>
                  <td className="py-2 pr-3 text-right font-mono">{e.credit > 0 ? formatCurrency(e.credit) : ""}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate">{e.description}</td>
                  <td className="py-2"><Badge variant="outline" className="text-xs">{e.referenceType}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
        <span className="text-sm py-1">Page {page}</span>
        <Button variant="outline" size="sm" disabled={entries.length < 50} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

// P&L Tab
function ProfitLossTab() {
  const now = new Date();
  const [start, setStart] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
  const [end, setEnd] = useState(now.toISOString().split("T")[0]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/profit-loss", start, end],
    queryFn: async () => {
      const res = await fetch(`/api/accounting/profit-loss?start=${start}&end=${end}`, { credentials: "include" });
      return res.json();
    },
  });

  const d = data as any;
  const revenueItems = d?.revenue?.items || [];
  const expenseItems = d?.expenses?.items || [];

  const chartData = [
    ...revenueItems.map((r: any) => ({ name: r.name.replace(/Revenue|Fees/gi, "").trim(), amount: r.amount, type: "revenue" })),
    ...expenseItems.map((e: any) => ({ name: e.name.replace(/Costs|Expenses/gi, "").trim(), amount: e.amount, type: "expense" })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
        <span>to</span>
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading P&L...</div>
      ) : d ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-green-200/50">
            <CardHeader><CardTitle className="text-green-600">Revenue. {formatCurrency(d.revenue?.total)}</CardTitle></CardHeader>
            <CardContent>
              {revenueItems.map((r: any) => (
                <div key={r.name} className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-sm">{r.name}</span>
                  <span className="text-sm font-mono">{formatCurrency(r.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-red-200/50">
            <CardHeader><CardTitle className="text-red-600">Expenses. {formatCurrency(d.expenses?.total)}</CardTitle></CardHeader>
            <CardContent>
              {expenseItems.map((e: any) => (
                <div key={e.name} className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-sm">{e.name}</span>
                  <span className="text-sm font-mono">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="md:col-span-2 border-amber-200/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Net Income</span>
                <span className={`text-2xl font-bold ${(d.netIncome || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(d.netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
          {chartData.length > 0 && (
            <Card className="md:col-span-2 border-amber-200/50">
              <CardHeader><CardTitle className="text-amber-600">Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="amount" fill={AMBER}>
                      {chartData.map((_: any, i: number) => (
                        <Cell key={i} fill={chartData[i].type === "revenue" ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Invoices Tab
function InvoicesTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ businessAccountId: "", notes: "", dueDate: "", lineItems: [{ description: "", amount: 0 }] });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/invoices"],
    queryFn: async () => {
      const res = await fetch("/api/accounting/invoices", { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/accounting/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/accounting/invoices"] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: any) => {
      const res = await fetch(`/api/accounting/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/accounting/invoices"] }),
  });

  const invoicesList = (data as any)?.invoices || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Invoices</h3>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-1" /> New Invoice
        </Button>
      </div>

      {showCreate && (
        <Card className="border-amber-200">
          <CardContent className="pt-4 space-y-3">
            <Input placeholder="Business Account ID" value={newInvoice.businessAccountId} onChange={(e) => setNewInvoice({ ...newInvoice, businessAccountId: e.target.value })} />
            <Input type="date" placeholder="Due Date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
            {newInvoice.lineItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Description" value={item.description} onChange={(e) => {
                  const items = [...newInvoice.lineItems];
                  items[i] = { ...items[i], description: e.target.value };
                  setNewInvoice({ ...newInvoice, lineItems: items });
                }} />
                <Input type="number" placeholder="Amount" className="w-32" value={item.amount || ""} onChange={(e) => {
                  const items = [...newInvoice.lineItems];
                  items[i] = { ...items[i], amount: parseFloat(e.target.value) || 0 };
                  setNewInvoice({ ...newInvoice, lineItems: items });
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setNewInvoice({ ...newInvoice, lineItems: [...newInvoice.lineItems, { description: "", amount: 0 }] })}>
              + Line Item
            </Button>
            <Input placeholder="Notes" value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => createMutation.mutate(newInvoice)}>
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">#</th>
                <th className="pb-2">Business</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Total</th>
                <th className="pb-2">Due</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicesList.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50">
                  <td className="py-2">{inv.invoiceNumber}</td>
                  <td className="py-2">{inv.businessAccountId?.substring(0, 8)}...</td>
                  <td className="py-2">
                    <Badge variant={inv.status === "paid" ? "default" : inv.status === "overdue" ? "destructive" : "outline"}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right font-mono">{formatCurrency(inv.total)}</td>
                  <td className="py-2">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                  <td className="py-2">
                    {inv.status !== "paid" && inv.status !== "void" && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: inv.id, status: "paid", paidVia: "manual" })}>
                          Mark Paid
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: inv.id, status: "void" })}>
                          Void
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Expenses Tab
function ExpensesTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newExpense, setNewExpense] = useState({ accountId: "", amount: "", vendor: "", description: "", category: "infrastructure", expenseDate: new Date().toISOString().split("T")[0] });

  const { data: accountsData } = useQuery({ queryKey: ["/api/accounting/accounts"] });
  const expenseAccounts = ((accountsData as any[]) || []).filter((a: any) => a.type === "expense");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/accounting/expenses", { credentials: "include" });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/accounting/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...body, amount: parseFloat(body.amount) }) });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/accounting/expenses"] }); setShowCreate(false); },
  });

  const expenses = (data as any)?.expenses || [];
  const categories = ["infrastructure", "legal", "marketing", "payroll", "insurance", "office", "other"];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Manual Expenses</h3>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="h-4 w-4 mr-1" /> Add Expense
        </Button>
      </div>

      {showCreate && (
        <Card className="border-amber-200">
          <CardContent className="pt-4 space-y-3">
            <select className="w-full border rounded px-3 py-2 bg-background" value={newExpense.accountId} onChange={(e) => setNewExpense({ ...newExpense, accountId: e.target.value })}>
              <option value="">Select Account</option>
              {expenseAccounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <select className="w-full border rounded px-3 py-2 bg-background" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input type="number" step="0.01" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
            <Input placeholder="Vendor" value={newExpense.vendor} onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })} />
            <Input placeholder="Description" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            <Input type="date" value={newExpense.expenseDate} onChange={(e) => setNewExpense({ ...newExpense, expenseDate: e.target.value })} />
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => createMutation.mutate(newExpense)} disabled={!newExpense.accountId || !newExpense.amount}>
              Save Expense
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Date</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Vendor</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-2">{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString() : ""}</td>
                  <td className="py-2"><Badge variant="outline">{e.category}</Badge></td>
                  <td className="py-2">{e.vendor || "-"}</td>
                  <td className="py-2 max-w-[200px] truncate">{e.description || "-"}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 1099 Tax Tab
function TaxTab() {
  const year = new Date().getFullYear();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/accounting/tax/1099-summary", year],
    queryFn: async () => {
      const res = await fetch(`/api/accounting/tax/1099-summary?year=${year}`, { credentials: "include" });
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/accounting/tax/1099-generate?year=${year}`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/accounting/tax/1099-summary"] }),
  });

  const d = data as any;
  const records = d?.records || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">1099 Summary. {year}</h3>
          <p className="text-sm text-muted-foreground">
            {d?.needsFiling || 0} pros need 1099s (≥$600) · {d?.filed || 0} filed
          </p>
        </div>
        <Button size="sm" onClick={() => generateMutation.mutate()} className="bg-amber-500 hover:bg-amber-600">
          <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">Pro ID</th>
                <th className="pb-2">Legal Name</th>
                <th className="pb-2 text-right">YTD Earnings</th>
                <th className="pb-2 text-right">Jobs</th>
                <th className="pb-2">W-9</th>
                <th className="pb-2">1099 Filed</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r: any) => (
                <tr key={r.id} className={`border-b border-border/50 ${r.totalEarnings >= 600 && !r.form1099Filed ? "bg-amber-50/30" : ""}`}>
                  <td className="py-2 font-mono text-xs">{r.proId?.substring(0, 8)}...</td>
                  <td className="py-2">{r.legalName || "-"}</td>
                  <td className="py-2 text-right font-mono">{formatCurrency(r.totalEarnings)}</td>
                  <td className="py-2 text-right">{r.totalJobs}</td>
                  <td className="py-2">{r.w9OnFile ? <Badge className="bg-green-500">Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                  <td className="py-2">{r.form1099Filed ? <Badge className="bg-green-500">Filed</Badge> : r.totalEarnings >= 600 ? <Badge variant="destructive">Needed</Badge> : <Badge variant="outline">N/A</Badge>}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No tax records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Main Accounting Page
export default function AccountingPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-600">UpTend Accounting</h1>
        <p className="text-muted-foreground">UPYCK, Inc. (Delaware C-Corp) d/b/a UpTend</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="pl">P&L</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="tax">1099 / Tax</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="ledger"><LedgerTab /></TabsContent>
        <TabsContent value="pl"><ProfitLossTab /></TabsContent>
        <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        <TabsContent value="expenses"><ExpensesTab /></TabsContent>
        <TabsContent value="tax"><TaxTab /></TabsContent>
      </Tabs>
    </div>
  );
}
