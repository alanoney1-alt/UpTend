import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Shield, FileText, Upload, AlertTriangle,
  CheckCircle, Clock, XCircle, Search, Plus, Download,
  Bell, Calendar, Eye, RefreshCw, Building2, Users
} from "lucide-react";

// Demo data
const demoCertificates = [
  { id: 1, provider: "State Farm", policyNumber: "SF-2024-88721", coverageType: "General Liability", coverageAmount: 2000000, expiry: "2026-06-15", status: "active", verified: true },
  { id: 2, provider: "Hartford", policyNumber: "HF-2024-33109", coverageType: "Workers Comp", coverageAmount: 1000000, expiry: "2026-03-01", status: "expiring_soon", verified: true },
  { id: 3, provider: "Liberty Mutual", policyNumber: "LM-2024-55432", coverageType: "Commercial Auto", coverageAmount: 500000, expiry: "2025-12-31", status: "expired", verified: false },
  { id: 4, provider: "Zurich", policyNumber: "ZU-2024-77654", coverageType: "Professional Liability", coverageAmount: 3000000, expiry: "2026-09-20", status: "active", verified: true },
];

const demoDocuments = [
  { id: 1, docType: "W-9", proName: "Mike Johnson", uploadedAt: "2025-01-15", expiry: null, status: "verified" },
  { id: 2, docType: "OSHA 30 Certificate", proName: "Sarah Williams", uploadedAt: "2025-02-01", expiry: "2027-02-01", status: "verified" },
  { id: 3, docType: "State License", proName: "Tom Davis", uploadedAt: "2024-11-20", expiry: "2025-11-20", status: "pending_review" },
  { id: 4, docType: "EPA Lead-Safe Cert", proName: "Lisa Chen", uploadedAt: "2025-01-10", expiry: "2026-01-10", status: "verified" },
  { id: 5, docType: "W-9", proName: "James Brown", uploadedAt: "2024-12-05", expiry: null, status: "rejected" },
];

const demoBackgroundChecks = [
  { id: 1, proName: "Mike Johnson", provider: "Checkr", submittedAt: "2025-01-10", completedAt: "2025-01-12", result: "clear", expiry: "2026-01-12" },
  { id: 2, proName: "Sarah Williams", provider: "Checkr", submittedAt: "2025-02-05", completedAt: "2025-02-07", result: "clear", expiry: "2026-02-07" },
  { id: 3, proName: "Tom Davis", provider: "Checkr", submittedAt: "2025-02-10", completedAt: null, result: "pending", expiry: null },
  { id: 4, proName: "Lisa Chen", provider: "Checkr", submittedAt: "2024-06-15", completedAt: "2024-06-17", result: "clear", expiry: "2025-06-17" },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    active: { variant: "default", label: "Active" },
    verified: { variant: "default", label: "Verified" },
    clear: { variant: "default", label: "Clear" },
    expiring_soon: { variant: "outline", label: "Expiring Soon" },
    pending: { variant: "secondary", label: "Pending" },
    pending_review: { variant: "secondary", label: "Pending Review" },
    expired: { variant: "destructive", label: "Expired" },
    rejected: { variant: "destructive", label: "Rejected" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessCompliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({ provider: "", policyNumber: "", coverageType: "", coverageAmount: "", expiry: "" });

  const createCertificateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/compliance/certificates", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/certificates"] });
      setShowAddPolicy(false);
      setPolicyForm({ provider: "", policyNumber: "", coverageType: "", coverageAmount: "", expiry: "" });
      toast({ title: "Policy added successfully" });
    },
    onError: (err: Error) => { toast({ title: "Failed to add policy", description: err.message, variant: "destructive" }); },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/compliance/documents", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/documents"] });
      toast({ title: "Document uploaded successfully" });
    },
    onError: (err: Error) => { toast({ title: "Failed to upload document", description: err.message, variant: "destructive" }); },
  });

  const initiateCheckMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/compliance/background-checks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/background-checks"] });
      toast({ title: "Background check initiated" });
    },
    onError: (err: Error) => { toast({ title: "Failed to initiate check", description: err.message, variant: "destructive" }); },
  });

  const { data: certificates } = useQuery({
    queryKey: ["/api/compliance/certificates"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/compliance/certificates", { credentials: "include" });
        if (!res.ok) return demoCertificates;
        const data = await res.json();
        return data.length > 0 ? data : demoCertificates;
      } catch { return demoCertificates; }
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/compliance/documents"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/compliance/documents", { credentials: "include" });
        if (!res.ok) return demoDocuments;
        const data = await res.json();
        return data.length > 0 ? data : demoDocuments;
      } catch { return demoDocuments; }
    },
  });

  const { data: bgChecks } = useQuery({
    queryKey: ["/api/compliance/background-checks"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/compliance/background-checks", { credentials: "include" });
        if (!res.ok) return demoBackgroundChecks;
        const data = await res.json();
        return data.length > 0 ? data : demoBackgroundChecks;
      } catch { return demoBackgroundChecks; }
    },
  });

  const activeCerts = certificates?.filter(c => c.status === "active").length || 0;
  const expiringSoon = certificates?.filter(c => c.status === "expiring_soon").length || 0;
  const expiredCerts = certificates?.filter(c => c.status === "expired").length || 0;
  const complianceScore = certificates ? Math.round((activeCerts / certificates.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Compliance & Insurance</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" /> Alerts
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{complianceScore}%</p>
              </div>
            </div>
            <Progress value={complianceScore} className="mt-2" />
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Policies</p>
                <p className="text-2xl font-bold">{activeCerts}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringSoon}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{expiredCerts}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BG Checks</p>
                <p className="text-2xl font-bold">{bgChecks?.filter(b => b.result === "clear").length || 0}/{bgChecks?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="insurance" className="space-y-6">
          <TabsList className="flex overflow-x-auto whitespace-nowrap w-full">
            <TabsTrigger value="insurance">
              <Shield className="w-4 h-4 mr-2" /> Insurance Vault
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" /> Compliance Docs
            </TabsTrigger>
            <TabsTrigger value="background">
              <Users className="w-4 h-4 mr-2" /> Background Checks
            </TabsTrigger>
          </TabsList>

          {/* Insurance Vault */}
          <TabsContent value="insurance" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Certificate of Insurance (COI) Vault</h2>
                <p className="text-sm text-muted-foreground">Track all insurance policies with auto-renewal alerts</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" /> Add Policy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Insurance Certificate</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label>Insurance Provider</Label><Input placeholder="e.g., State Farm" value={policyForm.provider} onChange={e => setPolicyForm(f => ({ ...f, provider: e.target.value }))} /></div>
                    <div><Label>Policy Number</Label><Input placeholder="e.g., SF-2024-88721" value={policyForm.policyNumber} onChange={e => setPolicyForm(f => ({ ...f, policyNumber: e.target.value }))} /></div>
                    <div><Label>Coverage Type</Label>
                      <Select value={policyForm.coverageType} onValueChange={v => setPolicyForm(f => ({ ...f, coverageType: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General Liability">General Liability</SelectItem>
                          <SelectItem value="Workers Comp">Workers Comp</SelectItem>
                          <SelectItem value="Commercial Auto">Commercial Auto</SelectItem>
                          <SelectItem value="Professional Liability">Professional Liability</SelectItem>
                          <SelectItem value="Umbrella">Umbrella</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Coverage Amount</Label><Input type="number" placeholder="2000000" value={policyForm.coverageAmount} onChange={e => setPolicyForm(f => ({ ...f, coverageAmount: e.target.value }))} /></div>
                      <div><Label>Expiry Date</Label><Input type="date" value={policyForm.expiry} onChange={e => setPolicyForm(f => ({ ...f, expiry: e.target.value }))} /></div>
                    </div>
                    <div><Label>Upload COI (PDF)</Label><Input type="file" accept=".pdf,.jpg,.png" /></div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => createCertificateMutation.mutate({ ...policyForm, coverageAmount: Number(policyForm.coverageAmount) })} disabled={createCertificateMutation.isPending}>{createCertificateMutation.isPending ? "Saving..." : "Save Certificate"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map(cert => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.provider}</TableCell>
                      <TableCell className="font-mono text-sm">{cert.policyNumber}</TableCell>
                      <TableCell>{cert.coverageType}</TableCell>
                      <TableCell className="text-right">${(cert.coverageAmount / 1000000).toFixed(1)}M</TableCell>
                      <TableCell>{new Date(cert.expiry).toLocaleDateString()}</TableCell>
                      <TableCell><StatusBadge status={cert.status} /></TableCell>
                      <TableCell>
                        {cert.verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Compliance Documents */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Compliance Documents</h2>
                <p className="text-sm text-muted-foreground">W-9s, licenses, OSHA certs, and more</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search documents..." className="pl-9 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => uploadDocumentMutation.mutate({ docType: "General", proName: "New Upload" })}><Upload className="w-4 h-4 mr-2" /> Upload</Button>
              </div>
            </div>

            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Pro / Employee</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents?.filter(d => !searchTerm || d.proName.toLowerCase().includes(searchTerm.toLowerCase()) || d.docType.toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">{doc.docType}</span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.proName}</TableCell>
                      <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{doc.expiry ? new Date(doc.expiry).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell><StatusBadge status={doc.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </Card>
          </TabsContent>

          {/* Background Checks */}
          <TabsContent value="background" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Background Check Tracking</h2>
                <p className="text-sm text-muted-foreground">Checkr integration — track status and expiration</p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => initiateCheckMutation.mutate({ proName: "New Pro", provider: "Checkr" })} disabled={initiateCheckMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" /> {initiateCheckMutation.isPending ? "Initiating..." : "Initiate Check"}
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pro / Employee</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bgChecks?.map(check => (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.proName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{check.provider}</Badge>
                      </TableCell>
                      <TableCell>{new Date(check.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{check.completedAt ? new Date(check.completedAt).toLocaleDateString() : <Clock className="w-4 h-4 text-amber-500" />}</TableCell>
                      <TableCell><StatusBadge status={check.result} /></TableCell>
                      <TableCell>{check.expiry ? new Date(check.expiry).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
                      </TableCell>
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
