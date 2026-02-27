import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, HardHat, ClipboardList, FileText, Shield,
  Plus, CheckCircle, Clock, AlertTriangle, Camera,
  Download, Eye, XCircle, Pen, Building2, Search
} from "lucide-react";

const demoPunchLists = [
  { id: 1, project: "Oakwood Office Renovation", createdBy: "GC - BuildRight Inc", totalItems: 24, completed: 18, status: "in_progress", dueDate: "2025-03-01" },
  { id: 2, project: "Lake Nona Retail Buildout", createdBy: "GC - Premier Construction", totalItems: 16, completed: 16, status: "completed", dueDate: "2025-02-10" },
  { id: 3, project: "Downtown Condo Remodel", createdBy: "GC - CityBuild LLC", totalItems: 32, completed: 8, status: "in_progress", dueDate: "2025-03-15" },
];

const demoPunchItems = [
  { id: 1, listId: 1, description: "Touch up paint. lobby north wall", trade: "Painting", assignedPro: "ColorPro Painting", status: "completed", hasBefore: true, hasAfter: true },
  { id: 2, listId: 1, description: "Adjust door closer. Suite 200", trade: "Carpentry", assignedPro: "WoodWorks Inc", status: "completed", hasBefore: true, hasAfter: true },
  { id: 3, listId: 1, description: "Replace cracked floor tile. restroom", trade: "Tile", assignedPro: "TileMaster", status: "in_progress", hasBefore: true, hasAfter: false },
  { id: 4, listId: 1, description: "Fix HVAC duct rattle. 3rd floor", trade: "HVAC", assignedPro: "CoolAir HVAC", status: "open", hasBefore: false, hasAfter: false },
  { id: 5, listId: 1, description: "Caulk gap around window. Suite 301", trade: "General", assignedPro: null, status: "open", hasBefore: true, hasAfter: false },
];

const demoLienWaivers = [
  { id: 1, project: "Oakwood Office Renovation", proName: "ColorPro Painting", type: "Conditional Progress", amount: 12500, signed: true, signedAt: "2025-02-01" },
  { id: 2, project: "Oakwood Office Renovation", proName: "CoolAir HVAC", type: "Conditional Progress", amount: 28000, signed: true, signedAt: "2025-02-01" },
  { id: 3, project: "Oakwood Office Renovation", proName: "WoodWorks Inc", type: "Conditional Final", amount: 45000, signed: false, signedAt: null },
  { id: 4, project: "Lake Nona Retail Buildout", proName: "Premier Electrical", type: "Unconditional Final", amount: 67000, signed: true, signedAt: "2025-02-08" },
  { id: 5, project: "Downtown Condo Remodel", proName: "TileMaster", type: "Conditional Progress", amount: 8500, signed: false, signedAt: null },
];

const demoPermits = [
  { id: 1, project: "Oakwood Office Renovation", permitType: "Building Permit", applicationDate: "2024-10-15", status: "approved", inspectionDate: "2025-02-20", approved: true },
  { id: 2, project: "Oakwood Office Renovation", permitType: "Electrical Permit", applicationDate: "2024-10-20", status: "approved", inspectionDate: "2025-02-18", approved: true },
  { id: 3, project: "Downtown Condo Remodel", permitType: "Building Permit", applicationDate: "2025-01-05", status: "approved", inspectionDate: "2025-03-10", approved: false },
  { id: 4, project: "Downtown Condo Remodel", permitType: "Plumbing Permit", applicationDate: "2025-01-10", status: "under_review", inspectionDate: null, approved: false },
  { id: 5, project: "Lake Nona Retail Buildout", permitType: "Fire Alarm Permit", applicationDate: "2024-08-01", status: "final_approved", inspectionDate: "2025-02-05", approved: true },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    completed: { variant: "default", label: "Completed" },
    approved: { variant: "default", label: "Approved" },
    final_approved: { variant: "default", label: "Final Approved" },
    in_progress: { variant: "outline", label: "In Progress" },
    under_review: { variant: "secondary", label: "Under Review" },
    open: { variant: "secondary", label: "Open" },
    failed: { variant: "destructive", label: "Failed" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessConstruction() {
  const { toast } = useToast();

  const createPunchListMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/construction/punch-lists", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/construction/punch-lists"] });
      toast({ title: "Punch list created" });
    },
    onError: (err: Error) => { toast({ title: "Failed to create punch list", description: err.message, variant: "destructive" }); },
  });

  const createLienWaiverMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/construction/lien-waivers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/construction/lien-waivers"] });
      toast({ title: "Lien waiver requested" });
    },
    onError: (err: Error) => { toast({ title: "Failed to request waiver", description: err.message, variant: "destructive" }); },
  });

  const { data: punchLists = demoPunchLists } = useQuery({
    queryKey: ["/api/construction/punch-lists"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/construction/punch-lists", { credentials: "include" });
        if (!res.ok) return demoPunchLists;
        const data = await res.json();
        return data.length > 0 ? data : demoPunchLists;
      } catch { return demoPunchLists; }
    },
  });

  const { data: punchItems = demoPunchItems } = useQuery({
    queryKey: ["/api/construction/punch-list-items"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/construction/punch-list-items", { credentials: "include" });
        if (!res.ok) return demoPunchItems;
        const data = await res.json();
        return data.length > 0 ? data : demoPunchItems;
      } catch { return demoPunchItems; }
    },
  });

  const { data: lienWaivers = demoLienWaivers } = useQuery({
    queryKey: ["/api/construction/lien-waivers"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/construction/lien-waivers", { credentials: "include" });
        if (!res.ok) return demoLienWaivers;
        const data = await res.json();
        return data.length > 0 ? data : demoLienWaivers;
      } catch { return demoLienWaivers; }
    },
  });

  const { data: permits = demoPermits } = useQuery({
    queryKey: ["/api/construction/permits"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/construction/permits", { credentials: "include" });
        if (!res.ok) return demoPermits;
        const data = await res.json();
        return data.length > 0 ? data : demoPermits;
      } catch { return demoPermits; }
    },
  });

  const totalPunchItems = punchLists.reduce((s: number, p: any) => s + (p.totalItems || 0), 0);
  const completedPunchItems = punchLists.reduce((s: number, p: any) => s + (p.completed || 0), 0);
  const unsignedWaivers = lienWaivers.filter((l: any) => !l.signed).length;
  const pendingPermits = permits.filter((p: any) => p.status === "under_review").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <HardHat className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Construction Management</span>
            </div>
          </div>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => createPunchListMutation.mutate({ project: "New Project", totalItems: 0, completed: 0, status: "in_progress" })} disabled={createPunchListMutation.isPending}><Plus className="w-4 h-4 mr-2" /> {createPunchListMutation.isPending ? "Creating..." : "New Project"}</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg"><ClipboardList className="w-5 h-5 text-orange-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Punch Items</p>
                <p className="text-2xl font-bold">{completedPunchItems}/{totalPunchItems}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg"><FileText className="w-5 h-5 text-amber-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Unsigned Waivers</p>
                <p className="text-2xl font-bold">{unsignedWaivers}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Shield className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Permits</p>
                <p className="text-2xl font-bold">{pendingPermits}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><Building2 className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{punchLists.filter((p: any) => p.status === "in_progress").length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="punchlists" className="space-y-6">
          <TabsList>
            <TabsTrigger value="punchlists"><ClipboardList className="w-4 h-4 mr-1" /> Punch Lists</TabsTrigger>
            <TabsTrigger value="waivers"><FileText className="w-4 h-4 mr-1" /> Lien Waivers</TabsTrigger>
            <TabsTrigger value="permits"><Shield className="w-4 h-4 mr-1" /> Permits</TabsTrigger>
          </TabsList>

          {/* Punch Lists */}
          <TabsContent value="punchlists" className="space-y-6">
            <h2 className="text-xl font-semibold">Punch Lists</h2>
            {punchLists.map((pl: any) => (
              <Card key={pl.id} className="overflow-hidden">
                <div className="p-5 border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{pl.project || pl.projectName || (pl.id?.length > 8 ? `Project ${pl.id.slice(0,6).toUpperCase()}` : `Project #${pl.id}`)}</h3>
                      <p className="text-sm text-muted-foreground">{pl.createdBy || "-"} • Due {(() => { const d = new Date(pl.dueDate); return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(); })()}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={pl.status} />
                      <p className="text-sm font-medium mt-1">{pl.completed}/{pl.totalItems} items</p>
                    </div>
                  </div>
                  <Progress value={(pl.completed / pl.totalItems) * 100} />
                </div>
                {pl.id === 1 && (
                  <div className="overflow-x-auto"><Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Trade</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {punchItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell><Badge variant="outline">{item.trade}</Badge></TableCell>
                          <TableCell>{item.assignedPro || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.hasBefore && <Badge variant="secondary" className="text-xs">Before</Badge>}
                              {item.hasAfter && <Badge variant="secondary" className="text-xs">After</Badge>}
                              {!item.hasBefore && !item.hasAfter && <Camera className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </TableCell>
                          <TableCell><StatusBadge status={item.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></div>
                )}
              </Card>
            ))}
          </TabsContent>

          {/* Lien Waivers */}
          <TabsContent value="waivers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Lien Waiver Tracking</h2>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => createLienWaiverMutation.mutate({ project: "", proName: "", type: "Conditional Progress", amount: 0 })} disabled={createLienWaiverMutation.isPending}><Plus className="w-4 h-4 mr-2" /> {createLienWaiverMutation.isPending ? "Requesting..." : "Request Waiver"}</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Waiver Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lienWaivers.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.project}</TableCell>
                      <TableCell>{w.proName}</TableCell>
                      <TableCell><Badge variant="outline">{w.type}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">${w.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {w.signed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400" />}
                      </TableCell>
                      <TableCell>{w.signedAt ? new Date(w.signedAt).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        {w.signed ? (
                          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                        ) : (
                          <Button size="sm" variant="outline"><Pen className="w-4 h-4 mr-1" /> Sign</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Permits */}
          <TabsContent value="permits" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Permit Tracking</h2>
              <Button className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> New Permit</Button>
            </div>
            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Permit Type</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Inspection Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.project}</TableCell>
                      <TableCell>{p.permitType}</TableCell>
                      <TableCell>{(() => { const d = new Date(p.applicationDate); return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(); })()}</TableCell>
                      <TableCell>{p.inspectionDate ? new Date(p.inspectionDate).toLocaleDateString() : "TBD"}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
