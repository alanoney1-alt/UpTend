import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBusinessTier } from "@/hooks/use-business-tier";
import { UpgradePrompt } from "@/components/business/upgrade-prompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, BarChart3, FileText, Plus, Download,
  Calendar, Clock, Play, Pause, Trash2, Eye,
  Filter, Settings, Mail, TrendingUp, PieChart,
  DollarSign, Users, Wrench, Building2
} from "lucide-react";

const demoReports = [
  { id: 1, name: "Monthly Revenue Summary", type: "financial", schedule: "Monthly", lastRun: "2025-02-01", status: "active", recipients: 3 },
  { id: 2, name: "Work Order SLA Compliance", type: "operations", schedule: "Weekly", lastRun: "2025-02-10", status: "active", recipients: 5 },
  { id: 3, name: "Vendor Performance Scorecard", type: "vendor", schedule: "Quarterly", lastRun: "2025-01-01", status: "active", recipients: 2 },
  { id: 4, name: "Occupancy Trends by Property", type: "property", schedule: "Monthly", lastRun: "2025-02-01", status: "paused", recipients: 4 },
  { id: 5, name: "ESG Impact Report", type: "esg", schedule: "Quarterly", lastRun: "2025-01-01", status: "active", recipients: 6 },
  { id: 6, name: "Insurance Expiry Alerts", type: "compliance", schedule: "Weekly", lastRun: "2025-02-10", status: "active", recipients: 2 },
];

const reportTemplates = [
  { id: "financial", name: "Financial Summary", icon: DollarSign, desc: "Revenue, expenses, profit margins by period" },
  { id: "operations", name: "Operations & SLA", icon: Wrench, desc: "Work orders, response times, SLA compliance" },
  { id: "vendor", name: "Vendor Scorecard", icon: Users, desc: "On-time %, quality ratings, job completion" },
  { id: "property", name: "Property Analytics", icon: Building2, desc: "Occupancy, turnover rates, maintenance costs" },
  { id: "esg", name: "ESG & Sustainability", icon: TrendingUp, desc: "Carbon offset, diversion rates, green metrics" },
  { id: "compliance", name: "Compliance Status", icon: FileText, desc: "Insurance, licenses, background check status" },
];

const availableColumns = [
  "Date", "Property", "Unit", "Tenant", "Service Type", "Pro/Vendor",
  "Amount", "Status", "Priority", "Response Time", "Resolution Time",
  "SLA Met", "Rating", "Category", "Revenue", "Expenses", "Net Profit",
];

export default function BusinessReports() {
  const { isIndependent } = useBusinessTier();
  const { toast } = useToast();

  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/enterprise/custom-reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enterprise/custom-reports"] });
      toast({ title: "Report created successfully" });
    },
    onError: (err: Error) => { toast({ title: "Failed to create report", description: err.message, variant: "destructive" }); },
  });

  const { data: reports = demoReports } = useQuery({
    queryKey: ["/api/enterprise/custom-reports"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/enterprise/custom-reports", { credentials: "include" });
        if (!res.ok) return demoReports;
        const data = await res.json();
        return data.length > 0 ? data : demoReports;
      } catch { return demoReports; }
    },
  });

  const [builderStep, setBuilderStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["Date", "Property", "Service Type", "Amount", "Status"]);
  const [reportName, setReportName] = useState("");
  const [schedule, setSchedule] = useState("none");
  const [dateRange, setDateRange] = useState("last_30");

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  if (isIndependent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <UpgradePrompt featureName="Reports & Analytics" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Custom Reports</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        <Tabs defaultValue="saved" className="space-y-6">
          <TabsList>
            <TabsTrigger value="saved"><FileText className="w-4 h-4 mr-1" /> Saved Reports</TabsTrigger>
            <TabsTrigger value="builder"><Plus className="w-4 h-4 mr-1" /> Report Builder</TabsTrigger>
          </TabsList>

          {/* Saved Reports */}
          <TabsContent value="saved" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Reports</h2>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setBuilderStep(0)}><Plus className="w-4 h-4 mr-2" /> New Report</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                      <TableCell>{r.schedule}</TableCell>
                      <TableCell>{(() => { const d = new Date(r.lastRun); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {r.recipients}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"}>
                          {r.status === "active" ? "Active" : "Paused"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm"><Play className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Report Builder */}
          <TabsContent value="builder" className="space-y-6">
            <h2 className="text-xl font-semibold">Build a Custom Report</h2>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-6">
              {["Template", "Columns", "Filters", "Schedule"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <button
                    onClick={() => setBuilderStep(i)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i === builderStep ? "bg-orange-500 text-white" : i < builderStep ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >{i + 1}</button>
                  <span className={`text-sm ${i === builderStep ? "font-semibold" : "text-muted-foreground"}`}>{step}</span>
                  {i < 3 && <div className="w-8 h-0.5 bg-muted mx-1" />}
                </div>
              ))}
            </div>

            {/* Step 1: Template */}
            {builderStep === 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportTemplates.map(t => (
                  <Card
                    key={t.id}
                    className={`p-5 cursor-pointer transition-all hover:shadow-md ${selectedTemplate === t.id ? "ring-2 ring-orange-500 border-orange-500" : ""}`}
                    onClick={() => { setSelectedTemplate(t.id); setBuilderStep(1); }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                      <t.icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <h3 className="font-semibold mb-1">{t.name}</h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 2: Columns */}
            {builderStep === 1 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Select Columns</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableColumns.map(col => (
                    <label key={col} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
                      <Checkbox checked={selectedColumns.includes(col)} onCheckedChange={() => toggleColumn(col)} />
                      <span className="text-sm">{col}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setBuilderStep(0)}>Back</Button>
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setBuilderStep(2)}>Next: Filters</Button>
                </div>
              </Card>
            )}

            {/* Step 3: Filters */}
            {builderStep === 2 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Apply Filters</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_7">Last 7 Days</SelectItem>
                        <SelectItem value="last_30">Last 30 Days</SelectItem>
                        <SelectItem value="last_90">Last 90 Days</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Property</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="All Properties" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <SelectItem value="1">Sunview Apartments</SelectItem>
                        <SelectItem value="2">Oak Ridge Townhomes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vendor / Pro</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="All Vendors" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        <SelectItem value="1">CoolAir HVAC</SelectItem>
                        <SelectItem value="2">QuickFix Plumbing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" onClick={() => setBuilderStep(1)}>Back</Button>
                  <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setBuilderStep(3)}>Next: Schedule</Button>
                </div>
              </Card>
            )}

            {/* Step 4: Schedule */}
            {builderStep === 3 && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Name & Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Report Name</Label>
                    <Input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="My Custom Report" />
                  </div>
                  <div>
                    <Label>Auto-Schedule</Label>
                    <Select value={schedule} onValueChange={setSchedule}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Run Manually</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email Recipients (comma-separated)</Label>
                    <Input placeholder="admin@company.com, manager@company.com" />
                  </div>

                  {/* Preview */}
                  <Card className="bg-muted/50 p-4">
                    <h4 className="font-medium mb-2">Report Preview</h4>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Template:</span> {reportTemplates.find(t => t.id === selectedTemplate)?.name || "—"}</p>
                      <p><span className="text-muted-foreground">Columns:</span> {selectedColumns.join(", ")}</p>
                      <p><span className="text-muted-foreground">Date Range:</span> {dateRange.replace("_", " ")}</p>
                      <p><span className="text-muted-foreground">Schedule:</span> {schedule === "none" ? "Manual" : schedule}</p>
                    </div>
                  </Card>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBuilderStep(2)}>Back</Button>
                    <Button className="bg-orange-500 hover:bg-orange-600" disabled={createReportMutation.isPending} onClick={() => createReportMutation.mutate({ name: reportName || "Untitled Report", type: selectedTemplate, columns: selectedColumns, dateRange, schedule, runImmediately: true })}><Play className="w-4 h-4 mr-2" /> {createReportMutation.isPending ? "Creating..." : "Run Now"}</Button>
                    <Button variant="outline" disabled={createReportMutation.isPending} onClick={() => createReportMutation.mutate({ name: reportName || "Untitled Report", type: selectedTemplate, columns: selectedColumns, dateRange, schedule })}><Download className="w-4 h-4 mr-2" /> Save Report</Button>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
