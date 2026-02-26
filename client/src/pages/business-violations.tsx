import { useState } from "react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Bell, AlertTriangle, CheckCircle, Clock,
  Filter, Upload, Search
} from "lucide-react";

interface Violation {
  id: number;
  unit: string;
  type: string;
  description: string;
  status: "open" | "notified" | "resolved";
  date: string;
  dueDate: string;
  photo?: string;
}

const demoViolations: Violation[] = [
  { id: 1, unit: "101", type: "Landscaping", description: "Overgrown front yard, grass exceeds 8 inches", status: "open", date: "2026-02-20", dueDate: "2026-03-05" },
  { id: 2, unit: "204", type: "Parking", description: "Unauthorized vehicle in reserved spot B12", status: "notified", date: "2026-02-18", dueDate: "2026-02-28" },
  { id: 3, unit: "307", type: "Exterior", description: "Unapproved paint color on front door", status: "open", date: "2026-02-15", dueDate: "2026-03-01" },
  { id: 4, unit: "112", type: "Noise", description: "Repeated noise complaints from neighbors after 10pm", status: "resolved", date: "2026-02-10", dueDate: "2026-02-20" },
  { id: 5, unit: "503", type: "Trash", description: "Bins left at curb beyond collection day", status: "notified", date: "2026-02-12", dueDate: "2026-02-22" },
  { id: 6, unit: "215", type: "Pets", description: "Unleashed dog in common area, multiple reports", status: "open", date: "2026-02-22", dueDate: "2026-03-08" },
];

const violationTypes = ["Landscaping", "Parking", "Exterior", "Noise", "Trash", "Pets", "Structural", "Other"];

function statusBadge(status: Violation["status"]) {
  switch (status) {
    case "open":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Open</Badge>;
    case "notified":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Notified</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resolved</Badge>;
  }
}

export default function BusinessViolations() {
  const { toast } = useToast();
  const [violations, setViolations] = useState<Violation[]>(demoViolations);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newViolation, setNewViolation] = useState({
    unit: "",
    type: "",
    description: "",
    dueDate: "",
  });

  const filtered = violations.filter((v) => {
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      v.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleNotify = (id: number) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "notified" as const } : v))
    );
    toast({ title: "Notification sent", description: "Resident has been notified of the violation." });
  };

  const handleAdd = () => {
    if (!newViolation.unit || !newViolation.type || !newViolation.description) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const v: Violation = {
      id: Date.now(),
      unit: newViolation.unit,
      type: newViolation.type,
      description: newViolation.description,
      status: "open",
      date: new Date().toISOString().split("T")[0],
      dueDate: newViolation.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    };
    setViolations((prev) => [v, ...prev]);
    setNewViolation({ unit: "", type: "", description: "", dueDate: "" });
    setShowAddDialog(false);
    toast({ title: "Violation added", description: `Violation for unit ${v.unit} has been recorded.` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 to-white">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Violation Management</h1>
              <p className="text-sm text-slate-500">Track and manage community violations</p>
            </div>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700"><Plus className="h-4 w-4 mr-2" />Add Violation</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Violation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Unit Number</Label>
                  <Input placeholder="e.g. 101" value={newViolation.unit} onChange={(e) => setNewViolation((p) => ({ ...p, unit: e.target.value }))} />
                </div>
                <div>
                  <Label>Violation Type</Label>
                  <Select value={newViolation.type} onValueChange={(v) => setNewViolation((p) => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {violationTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the violation" value={newViolation.description} onChange={(e) => setNewViolation((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <Label>Photo Upload</Label>
                  <Input type="file" accept="image/*" />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={newViolation.dueDate} onChange={(e) => setNewViolation((p) => ({ ...p, dueDate: e.target.value }))} />
                </div>
                <Button onClick={handleAdd} className="w-full bg-amber-600 hover:bg-amber-700">Submit Violation</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{violations.filter((v) => v.status === "open").length}</p>
                <p className="text-sm text-slate-500">Open Violations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{violations.filter((v) => v.status === "notified").length}</p>
                <p className="text-sm text-slate-500">Notified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{violations.filter((v) => v.status === "resolved").length}</p>
                <p className="text-sm text-slate-500">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search by unit or description" className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Violations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Violations ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.unit}</TableCell>
                      <TableCell>{v.type}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">{v.description}</TableCell>
                      <TableCell>{statusBadge(v.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{v.date}</TableCell>
                      <TableCell className="hidden sm:table-cell">{v.dueDate}</TableCell>
                      <TableCell>
                        {v.status === "open" && (
                          <Button size="sm" variant="outline" onClick={() => handleNotify(v.id)}>
                            <Bell className="h-3.5 w-3.5 mr-1" />Notify
                          </Button>
                        )}
                        {v.status === "notified" && (
                          <Button size="sm" variant="outline" onClick={() => setViolations((prev) => prev.map((x) => x.id === v.id ? { ...x, status: "resolved" } : x))}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />Resolve
                          </Button>
                        )}
                        {v.status === "resolved" && (
                          <span className="text-sm text-slate-400">Closed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">No violations found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
