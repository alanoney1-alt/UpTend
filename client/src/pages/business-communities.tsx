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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Home, Users, AlertTriangle, Calendar,
  DollarSign, Plus, Search, CheckCircle, Clock,
  XCircle, Eye, Building2, MapPin, FileText,
  ThumbsUp, ThumbsDown, BarChart3, Wrench
} from "lucide-react";

const demoCommunities = [
  { id: 1, name: "Sunrise Lakes HOA", address: "1200 Sunrise Blvd, Orlando, FL", units: 342, boardContact: "Karen Miller", status: "active", monthlyDues: 285 },
  { id: 2, name: "Palm Gardens Estates", address: "4500 Palm Dr, Kissimmee, FL", units: 186, boardContact: "Robert Chen", status: "active", monthlyDues: 350 },
  { id: 3, name: "Windermere Villas", address: "890 Windermere Rd, Windermere, FL", units: 124, boardContact: "Patricia Jones", status: "active", monthlyDues: 425 },
];

const demoViolations = [
  { id: 1, community: "Sunrise Lakes HOA", property: "1240 Sunrise Blvd, Unit 12B", type: "Lawn Maintenance", description: "Overgrown grass exceeding 6 inches", status: "open", reportedAt: "2025-02-10", deadline: "2025-02-24" },
  { id: 2, community: "Palm Gardens Estates", property: "4520 Palm Dr, Unit 8A", type: "Exterior Paint", description: "Peeling paint on front door", status: "in_progress", reportedAt: "2025-02-05", deadline: "2025-03-05" },
  { id: 3, community: "Sunrise Lakes HOA", property: "1260 Sunrise Blvd, Unit 3C", type: "Parking", description: "Unauthorized vehicle in assigned spot", status: "resolved", reportedAt: "2025-01-28", deadline: "2025-02-11" },
  { id: 4, community: "Windermere Villas", property: "910 Windermere Rd, Unit 5", type: "Noise", description: "Repeated noise complaints after 10 PM", status: "escalated", reportedAt: "2025-02-08", deadline: "2025-02-22" },
];

const demoApprovals = [
  { id: 1, community: "Sunrise Lakes HOA", requestedBy: "Unit 15A Owner", description: "Roof replacement - tile to shingle", amount: 18500, status: "pending", votesFor: 3, votesAgainst: 1, deadline: "2025-02-28" },
  { id: 2, community: "Palm Gardens Estates", requestedBy: "Unit 22B Owner", description: "Pool screen enclosure installation", amount: 8200, status: "approved", votesFor: 5, votesAgainst: 0, deadline: "2025-02-15" },
  { id: 3, community: "Windermere Villas", requestedBy: "Management", description: "Common area landscaping overhaul", amount: 45000, status: "voting", votesFor: 2, votesAgainst: 1, deadline: "2025-03-10" },
];

const demoCalendar = [
  { id: 1, community: "Sunrise Lakes HOA", serviceType: "Lawn Mowing", frequency: "Weekly", nextDate: "2025-02-17", assignedPro: "Green Thumb Landscaping" },
  { id: 2, community: "Sunrise Lakes HOA", serviceType: "Pool Cleaning", frequency: "Bi-Weekly", nextDate: "2025-02-19", assignedPro: "AquaClear Services" },
  { id: 3, community: "Palm Gardens Estates", serviceType: "Pest Control", frequency: "Monthly", nextDate: "2025-03-01", assignedPro: "BugShield Pro" },
  { id: 4, community: "Windermere Villas", serviceType: "Pressure Washing", frequency: "Quarterly", nextDate: "2025-04-01", assignedPro: "CleanForce LLC" },
];

const demoReserves = [
  { id: 1, community: "Sunrise Lakes HOA", fiscalYear: "2025", totalReserves: 1250000, allocated: 890000, spent: 312000, categories: [
    { name: "Roof Replacement", allocated: 350000, spent: 0 },
    { name: "Pool Renovation", allocated: 180000, spent: 45000 },
    { name: "Parking Resurfacing", allocated: 220000, spent: 220000 },
    { name: "Landscaping", allocated: 140000, spent: 47000 },
  ]},
  { id: 2, community: "Palm Gardens Estates", fiscalYear: "2025", totalReserves: 680000, allocated: 520000, spent: 185000, categories: [
    { name: "Clubhouse Renovation", allocated: 250000, spent: 120000 },
    { name: "Gate System", allocated: 80000, spent: 0 },
    { name: "Common Area Lighting", allocated: 190000, spent: 65000 },
  ]},
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    approved: { variant: "default", label: "Approved" },
    resolved: { variant: "default", label: "Resolved" },
    open: { variant: "destructive", label: "Open" },
    escalated: { variant: "destructive", label: "Escalated" },
    in_progress: { variant: "outline", label: "In Progress" },
    pending: { variant: "secondary", label: "Pending" },
    voting: { variant: "outline", label: "Voting" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessCommunities() {
  const [selectedCommunity, setSelectedCommunity] = useState("all");
  const { toast } = useToast();

  const addCommunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/communities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      toast({ title: "Community added successfully" });
    },
    onError: (err: Error) => { toast({ title: "Failed to add community", description: err.message, variant: "destructive" }); },
  });

  const voteApprovalMutation = useMutation({
    mutationFn: async ({ id, vote }: { id: number; vote: "approve" | "deny" }) => {
      const res = await apiRequest("PUT", `/api/communities/board-approvals/${id}`, { vote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities/board-approvals"] });
      toast({ title: "Vote recorded" });
    },
    onError: (err: Error) => { toast({ title: "Failed to record vote", description: err.message, variant: "destructive" }); },
  });

  const { data: communities = demoCommunities } = useQuery({
    queryKey: ["/api/communities"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/communities", { credentials: "include" });
        if (!res.ok) return demoCommunities;
        const data = await res.json();
        return data.length > 0 ? data : demoCommunities;
      } catch { return demoCommunities; }
    },
  });

  const { data: communityProperties = demoViolations } = useQuery({
    queryKey: ["/api/communities/properties"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/communities/properties", { credentials: "include" });
        if (!res.ok) return demoViolations;
        const data = await res.json();
        return data.length > 0 ? data : demoViolations;
      } catch { return demoViolations; }
    },
  });

  const { data: boardApprovals = demoApprovals } = useQuery({
    queryKey: ["/api/communities/board-approvals"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/communities/board-approvals", { credentials: "include" });
        if (!res.ok) return demoApprovals;
        const data = await res.json();
        return data.length > 0 ? data : demoApprovals;
      } catch { return demoApprovals; }
    },
  });

  const { data: maintenanceCalendars = demoCalendar } = useQuery({
    queryKey: ["/api/communities/maintenance-calendars"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/communities/maintenance-calendars", { credentials: "include" });
        if (!res.ok) return demoCalendar;
        const data = await res.json();
        return data.length > 0 ? data : demoCalendar;
      } catch { return demoCalendar; }
    },
  });

  const { data: reserveStudies = demoReserves } = useQuery({
    queryKey: ["/api/communities/reserve-studies"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/communities/reserve-studies", { credentials: "include" });
        if (!res.ok) return demoReserves;
        const data = await res.json();
        return data.length > 0 ? data : demoReserves;
      } catch { return demoReserves; }
    },
  });

  const totalUnits = communities.reduce((s: number, c: any) => s + (c.units || 0), 0);
  const openViolations = communityProperties.filter((v: any) => v.status === "open" || v.status === "escalated").length;
  const pendingApprovals = boardApprovals.filter((a: any) => a.status === "pending" || a.status === "voting").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">HOA Management</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Communities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Communities</SelectItem>
                {communities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => addCommunityMutation.mutate({ name: "New Community", address: "", units: 0, status: "active" })} disabled={addCommunityMutation.isPending}><Plus className="w-4 h-4 mr-2" /> {addCommunityMutation.isPending ? "Adding..." : "Add Community"}</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg"><Building2 className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Communities</p>
                <p className="text-2xl font-bold">{communities.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Home className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{totalUnits}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Open Violations</p>
                <p className="text-2xl font-bold">{openViolations}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><Clock className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{pendingApprovals}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reserves</p>
                <p className="text-2xl font-bold">$1.9M</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="communities" className="space-y-6">
          <TabsList className="flex overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="communities"><Building2 className="w-4 h-4 mr-1" /> Communities</TabsTrigger>
            <TabsTrigger value="violations"><AlertTriangle className="w-4 h-4 mr-1" /> Violations</TabsTrigger>
            <TabsTrigger value="approvals"><FileText className="w-4 h-4 mr-1" /> Board Approvals</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-1" /> Maintenance Calendar</TabsTrigger>
            <TabsTrigger value="reserves"><DollarSign className="w-4 h-4 mr-1" /> Reserve Studies</TabsTrigger>
          </TabsList>

          {/* Communities */}
          <TabsContent value="communities" className="space-y-4">
            <h2 className="text-xl font-semibold">Community Portfolio</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {communities.map(c => (
                <Card key={c.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{c.name}</h3>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" /> {c.address}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Units:</span> <span className="font-medium">{c.units || c.unitsCount || "—"}</span></div>
                    <div><span className="text-muted-foreground">Dues:</span> <span className="font-medium">{c.monthlyDues ? `$${c.monthlyDues}/mo` : "—"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Board Contact:</span> <span className="font-medium">{c.boardContact}</span></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1"><Eye className="w-4 h-4 mr-1" /> Details</Button>
                    <Button variant="outline" size="sm" className="flex-1"><Wrench className="w-4 h-4 mr-1" /> Services</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Violations */}
          <TabsContent value="violations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Violation Tracking</h2>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Report Violation</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communityProperties.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.community}</TableCell>
                      <TableCell className="text-sm">{v.property}</TableCell>
                      <TableCell><Badge variant="outline">{v.type}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{v.description}</TableCell>
                      <TableCell>{(() => { const d = new Date(v.deadline); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Board Approvals */}
          <TabsContent value="approvals" className="space-y-4">
            <h2 className="text-xl font-semibold">Board Approval Workflows</h2>
            <div className="space-y-4">
              {boardApprovals.map(a => (
                <Card key={a.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{a.description}</h3>
                      <p className="text-sm text-muted-foreground">{a.community} • Requested by {a.requestedBy}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status} />
                      <p className="text-lg font-bold text-orange-600 mt-1">${a.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-green-500" /> {a.votesFor} For</span>
                    <span className="flex items-center gap-1"><ThumbsDown className="w-4 h-4 text-red-500" /> {a.votesAgainst} Against</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-muted-foreground" /> Deadline: {(() => { const d = new Date(a.deadline); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</span>
                  </div>
                  {(a.status === "pending" || a.status === "voting") && (
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => voteApprovalMutation.mutate({ id: a.id, vote: "approve" })} disabled={voteApprovalMutation.isPending}><ThumbsUp className="w-4 h-4 mr-1" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => voteApprovalMutation.mutate({ id: a.id, vote: "deny" })} disabled={voteApprovalMutation.isPending}><ThumbsDown className="w-4 h-4 mr-1" /> Deny</Button>
                      <Button size="sm" variant="outline">Request Info</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Maintenance Calendar */}
          <TabsContent value="calendar" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recurring Maintenance Schedule</h2>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> Schedule Service</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Next Date</TableHead>
                    <TableHead>Assigned Pro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceCalendars.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.community}</TableCell>
                      <TableCell>{s.serviceType}</TableCell>
                      <TableCell><Badge variant="outline">{s.frequency}</Badge></TableCell>
                      <TableCell>{(() => { const d = new Date(s.nextDate); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(); })()}</TableCell>
                      <TableCell>{s.assignedPro}</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Reserve Studies */}
          <TabsContent value="reserves" className="space-y-6">
            <h2 className="text-xl font-semibold">Reserve Fund Studies</h2>
            {reserveStudies.map(r => (
              <Card key={r.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{r.community}</h3>
                    <p className="text-sm text-muted-foreground">Fiscal Year {r.fiscalYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Reserves</p>
                    <p className="text-2xl font-bold text-orange-600">${(r.totalReserves / 1000000).toFixed(2)}M</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="bg-blue-500/5 p-3 rounded-lg">
                    <p className="text-muted-foreground">Allocated</p>
                    <p className="font-bold">${(r.allocated / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-orange-500/5 p-3 rounded-lg">
                    <p className="text-muted-foreground">Spent</p>
                    <p className="font-bold">${(r.spent / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-green-500/5 p-3 rounded-lg">
                    <p className="text-muted-foreground">Remaining</p>
                    <p className="font-bold">${((r.totalReserves - r.spent) / 1000).toFixed(0)}K</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {r.categories.map(cat => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{cat.name}</span>
                        <span className="text-muted-foreground">${(cat.spent / 1000).toFixed(0)}K / ${(cat.allocated / 1000).toFixed(0)}K</span>
                      </div>
                      <Progress value={cat.allocated > 0 ? (cat.spent / cat.allocated) * 100 : 0} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
