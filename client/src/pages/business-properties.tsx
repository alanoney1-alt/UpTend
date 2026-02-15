import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Building2, Home, Wrench, Clock, Plus,
  Search, CheckCircle, AlertTriangle, DollarSign, Users,
  Eye, MapPin, ArrowUpDown, Timer, TrendingUp, Key,
  ClipboardList, BarChart3, XCircle
} from "lucide-react";

const demoPortfolio = { name: "Central FL Portfolio", totalProperties: 12, totalUnits: 847, occupancyRate: 94.2, monthlyRevenue: 1245000 };

const demoProperties = [
  { id: 1, name: "Sunview Apartments", address: "2400 E Colonial Dr, Orlando, FL", units: 120, type: "Multi-Family", occupancy: 96, monthlyRent: 156000 },
  { id: 2, name: "Oak Ridge Townhomes", address: "1800 Oak Ridge Rd, Orlando, FL", units: 48, type: "Townhome", occupancy: 92, monthlyRent: 72000 },
  { id: 3, name: "Lake Nona Residences", address: "9500 Narcoossee Rd, Orlando, FL", units: 200, type: "Multi-Family", occupancy: 98, monthlyRent: 340000 },
  { id: 4, name: "Winter Park Commons", address: "450 N Orlando Ave, Winter Park, FL", units: 36, type: "Mixed-Use", occupancy: 89, monthlyRent: 64800 },
];

const demoWorkOrders = [
  { id: "WO-1001", unit: "Sunview #204", tenant: "John Smith", description: "AC not cooling properly", priority: "urgent", status: "in_progress", created: "2025-02-13", slaDeadline: "2025-02-14 18:00", assignedPro: "CoolAir HVAC" },
  { id: "WO-1002", unit: "Oak Ridge #12B", tenant: "Maria Garcia", description: "Leaking kitchen faucet", priority: "normal", status: "assigned", created: "2025-02-14", slaDeadline: "2025-02-17 18:00", assignedPro: "QuickFix Plumbing" },
  { id: "WO-1003", unit: "Lake Nona #415", tenant: "David Lee", description: "Broken window blind", priority: "low", status: "open", created: "2025-02-14", slaDeadline: "2025-02-21 18:00", assignedPro: null },
  { id: "WO-1004", unit: "Sunview #118", tenant: "Ashley Brown", description: "Smoke detector beeping", priority: "urgent", status: "completed", created: "2025-02-12", slaDeadline: "2025-02-13 18:00", assignedPro: "SafeHome Electric" },
  { id: "WO-1005", unit: "Winter Park #8A", tenant: "James Wilson", description: "Garbage disposal jammed", priority: "normal", status: "in_progress", created: "2025-02-13", slaDeadline: "2025-02-16 18:00", assignedPro: "QuickFix Plumbing" },
];

const demoTurnovers = [
  { id: 1, unit: "Sunview #307", moveOut: "2025-02-28", targetReady: "2025-03-10", tasks: 12, completed: 3, status: "in_progress" },
  { id: 2, unit: "Oak Ridge #5A", moveOut: "2025-03-15", targetReady: "2025-03-25", tasks: 10, completed: 0, status: "scheduled" },
  { id: 3, unit: "Lake Nona #102", moveOut: "2025-02-01", targetReady: "2025-02-12", tasks: 14, completed: 14, status: "completed" },
];

const demoSlaConfigs = [
  { id: 1, priority: "Emergency", responseHours: 1, resolutionHours: 4, currentCompliance: 98 },
  { id: 2, priority: "Urgent", responseHours: 4, resolutionHours: 24, currentCompliance: 95 },
  { id: 3, priority: "Normal", responseHours: 24, resolutionHours: 72, currentCompliance: 91 },
  { id: 4, priority: "Low", responseHours: 48, resolutionHours: 168, currentCompliance: 88 },
];

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = { emergency: "bg-red-600 text-white", urgent: "bg-orange-500 text-white", normal: "bg-blue-500 text-white", low: "bg-gray-400 text-white" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config[priority] || config.normal}`}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    completed: { variant: "default", label: "Completed" },
    in_progress: { variant: "outline", label: "In Progress" },
    assigned: { variant: "outline", label: "Assigned" },
    open: { variant: "secondary", label: "Open" },
    scheduled: { variant: "secondary", label: "Scheduled" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessProperties() {
  const [woFilter, setWoFilter] = useState("all");
  const { toast } = useToast();

  const addPropertyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pm/properties", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pm/properties"] });
      toast({ title: "Property added successfully" });
    },
    onError: (err: Error) => { toast({ title: "Failed to add property", description: err.message, variant: "destructive" }); },
  });

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pm/work-orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pm/work-orders"] });
      toast({ title: "Work order created" });
    },
    onError: (err: Error) => { toast({ title: "Failed to create work order", description: err.message, variant: "destructive" }); },
  });

  const { data: portfolio = demoPortfolio } = useQuery({
    queryKey: ["/api/pm/portfolios"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pm/portfolios", { credentials: "include" });
        if (!res.ok) return demoPortfolio;
        const data = await res.json();
        return data.length > 0 ? data[0] : demoPortfolio;
      } catch { return demoPortfolio; }
    },
  });

  const { data: properties = demoProperties } = useQuery({
    queryKey: ["/api/pm/properties"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pm/properties", { credentials: "include" });
        if (!res.ok) return demoProperties;
        const data = await res.json();
        return data.length > 0 ? data : demoProperties;
      } catch { return demoProperties; }
    },
  });

  const { data: workOrders = demoWorkOrders } = useQuery({
    queryKey: ["/api/pm/work-orders"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pm/work-orders", { credentials: "include" });
        if (!res.ok) return demoWorkOrders;
        const data = await res.json();
        return data.length > 0 ? data : demoWorkOrders;
      } catch { return demoWorkOrders; }
    },
  });

  const { data: turnovers = demoTurnovers } = useQuery({
    queryKey: ["/api/pm/turnovers"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pm/turnovers", { credentials: "include" });
        if (!res.ok) return demoTurnovers;
        const data = await res.json();
        return data.length > 0 ? data : demoTurnovers;
      } catch { return demoTurnovers; }
    },
  });

  const { data: slaConfigs = demoSlaConfigs } = useQuery({
    queryKey: ["/api/pm/sla-configs"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/pm/sla-configs", { credentials: "include" });
        if (!res.ok) return demoSlaConfigs;
        const data = await res.json();
        return data.length > 0 ? data : demoSlaConfigs;
      } catch { return demoSlaConfigs; }
    },
  });

  const openWOs = workOrders.filter((w: any) => w.status !== "completed").length;
  const urgentWOs = workOrders.filter((w: any) => w.priority === "urgent" && w.status !== "completed").length;
  const avgSlaCompliance = Math.round(slaConfigs.reduce((s: number, c: any) => s + (c.currentCompliance || 0), 0) / slaConfigs.length);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Property Management</span>
            </div>
          </div>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => addPropertyMutation.mutate({ name: "New Property", address: "", units: 0, type: "Multi-Family" })} disabled={addPropertyMutation.isPending}><Plus className="w-4 h-4 mr-2" /> {addPropertyMutation.isPending ? "Adding..." : "Add Property"}</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg"><Building2 className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Properties</p>
                <p className="text-2xl font-bold">{portfolio.totalProperties}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Key className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{portfolio.totalUnits}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="text-2xl font-bold">{portfolio.occupancyRate}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Wrench className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Open Work Orders</p>
                <p className="text-2xl font-bold">{openWOs}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg"><Timer className="w-5 h-5 text-purple-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold">{avgSlaCompliance}%</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="properties"><Building2 className="w-4 h-4 mr-1" /> Properties</TabsTrigger>
            <TabsTrigger value="workorders"><Wrench className="w-4 h-4 mr-1" /> Work Orders</TabsTrigger>
            <TabsTrigger value="turnovers"><Key className="w-4 h-4 mr-1" /> Turnovers</TabsTrigger>
            <TabsTrigger value="sla"><Timer className="w-4 h-4 mr-1" /> SLA Tracking</TabsTrigger>
          </TabsList>

          {/* Properties */}
          <TabsContent value="properties" className="space-y-4">
            <h2 className="text-xl font-semibold">{portfolio.name}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {properties.map(p => (
                <Card key={p.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <Badge variant="outline">{p.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" /> {p.address}</p>
                  <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                    <div><p className="text-muted-foreground">Units</p><p className="font-bold text-lg">{p.units}</p></div>
                    <div><p className="text-muted-foreground">Occupancy</p><p className="font-bold text-lg">{p.occupancy}%</p></div>
                    <div><p className="text-muted-foreground">Monthly Rev</p><p className="font-bold text-lg">${(p.monthlyRent / 1000).toFixed(0)}K</p></div>
                  </div>
                  <Progress value={p.occupancy} className="mb-3" />
                  <Button variant="outline" size="sm" className="w-full"><Eye className="w-4 h-4 mr-1" /> View Units & Details</Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Work Orders */}
          <TabsContent value="workorders" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-xl font-semibold">Work Orders {urgentWOs > 0 && <Badge variant="destructive" className="ml-2">{urgentWOs} Urgent</Badge>}</h2>
              <div className="flex gap-2">
                <Select value={woFilter} onValueChange={setWoFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => createWorkOrderMutation.mutate({ unit: "", description: "", priority: "normal", status: "open" })} disabled={createWorkOrderMutation.isPending}><Plus className="w-4 h-4 mr-2" /> {createWorkOrderMutation.isPending ? "Creating..." : "New Work Order"}</Button>
              </div>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>SLA Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.filter(w => woFilter === "all" || w.status === woFilter).map(wo => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono text-sm">{wo.id}</TableCell>
                      <TableCell className="font-medium">{wo.unit}</TableCell>
                      <TableCell>{wo.tenant}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{wo.description}</TableCell>
                      <TableCell><PriorityBadge priority={wo.priority} /></TableCell>
                      <TableCell>{wo.assignedPro || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell className="text-sm">{(() => { const d = new Date(wo.slaDeadline); return isNaN(d.getTime()) ? "—" : d.toLocaleString(); })()}</TableCell>
                      <TableCell><StatusBadge status={wo.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Turnovers */}
          <TabsContent value="turnovers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Unit Turnover / Make-Ready</h2>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> New Turnover</Button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {turnovers.map(t => (
                <Card key={t.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{t.unit}</h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Move-out:</span><span>{(() => { const d = new Date(t.moveOut); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Target Ready:</span><span>{(() => { const d = new Date(t.targetReady); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</span></div>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tasks</span><span>{t.completed}/{t.tasks}</span>
                    </div>
                    <Progress value={(t.completed / t.tasks) * 100} />
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2"><ClipboardList className="w-4 h-4 mr-1" /> View Checklist</Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SLA */}
          <TabsContent value="sla" className="space-y-4">
            <h2 className="text-xl font-semibold">SLA Configuration & Compliance</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {slaConfigs.map(sla => (
                <Card key={sla.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{sla.priority} Priority</h3>
                    <span className={`text-2xl font-bold ${sla.currentCompliance >= 95 ? "text-green-600" : sla.currentCompliance >= 90 ? "text-amber-600" : "text-red-600"}`}>
                      {sla.currentCompliance}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="bg-blue-500/5 p-3 rounded-lg">
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-bold">{sla.responseHours}h</p>
                    </div>
                    <div className="bg-orange-500/5 p-3 rounded-lg">
                      <p className="text-muted-foreground">Resolution Time</p>
                      <p className="font-bold">{sla.resolutionHours}h</p>
                    </div>
                  </div>
                  <Progress value={sla.currentCompliance} />
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
