import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, FileText, DollarSign, Plus, Download,
  Send, Search, CheckCircle, Clock, AlertTriangle,
  XCircle, Eye, CreditCard, TrendingUp, BarChart3,
  Mail, Printer, Copy
} from "lucide-react";

const demoInvoices = [
  { id: "INV-2025-001", client: "Sunrise Lakes HOA", amount: 12450, dueDate: "2025-02-28", issuedDate: "2025-02-01", status: "paid", paymentTerms: "Net 30", paidDate: "2025-02-15", items: 8 },
  { id: "INV-2025-002", client: "Palm Gardens Estates", amount: 8720, dueDate: "2025-03-03", issuedDate: "2025-02-03", status: "sent", paymentTerms: "Net 30", paidDate: null, items: 5 },
  { id: "INV-2025-003", client: "City of Orlando - Parks Dept", amount: 34500, dueDate: "2025-03-15", issuedDate: "2025-02-10", status: "sent", paymentTerms: "Net 45", paidDate: null, items: 12 },
  { id: "INV-2025-004", client: "Windermere Villas", amount: 5200, dueDate: "2025-02-15", issuedDate: "2025-01-15", status: "overdue", paymentTerms: "Net 30", paidDate: null, items: 3 },
  { id: "INV-2025-005", client: "Oak Ridge Apartments", amount: 15800, dueDate: "2025-03-10", issuedDate: "2025-02-10", status: "draft", paymentTerms: "Net 30", paidDate: null, items: 7 },
  { id: "INV-2025-006", client: "Seminole County Schools", amount: 22100, dueDate: "2025-02-20", issuedDate: "2025-01-20", status: "paid", paymentTerms: "Net 30", paidDate: "2025-02-18", items: 9 },
];

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    paid: { variant: "default", label: "Paid" },
    sent: { variant: "outline", label: "Sent" },
    draft: { variant: "secondary", label: "Draft" },
    overdue: { variant: "destructive", label: "Overdue" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };
  const c = config[status] || { variant: "secondary" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

export default function BusinessInvoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const totalOutstanding = demoInvoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const totalPaid = demoInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const overdueAmount = demoInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);
  const draftAmount = demoInvoices.filter(i => i.status === "draft").reduce((s, i) => s + i.amount, 0);

  const filteredInvoices = demoInvoices.filter(i => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (searchTerm && !i.client.toLowerCase().includes(searchTerm.toLowerCase()) && !i.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Dashboard</Button>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-500" />
              <span className="text-xl font-bold">Invoicing</span>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Client</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Sunrise Lakes HOA</SelectItem>
                      <SelectItem value="2">Palm Gardens Estates</SelectItem>
                      <SelectItem value="3">City of Orlando</SelectItem>
                      <SelectItem value="4">Windermere Villas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Payment Terms</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net15">Net 15</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                        <SelectItem value="net45">Net 45</SelectItem>
                        <SelectItem value="net60">Net 60</SelectItem>
                        <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Due Date</Label><Input type="date" /></div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm">Line Items</h4>
                  <div className="grid grid-cols-12 gap-2 text-sm">
                    <Input className="col-span-5" placeholder="Description" />
                    <Input className="col-span-2" placeholder="Qty" type="number" />
                    <Input className="col-span-3" placeholder="Rate" type="number" />
                    <div className="col-span-2 flex items-center justify-end font-medium">$0.00</div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full"><Plus className="w-4 h-4 mr-1" /> Add Line Item</Button>
                </div>

                <div><Label>Notes</Label><Textarea placeholder="Payment instructions, thank you message, etc." /></div>

                <div className="flex justify-between items-center border-t pt-4">
                  <span className="text-lg font-semibold">Total: $0.00</span>
                  <div className="flex gap-2">
                    <Button variant="outline">Save Draft</Button>
                    <Button className="bg-orange-500 hover:bg-orange-600"><Send className="w-4 h-4 mr-2" /> Send Invoice</Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-green-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Collected (MTD)</p>
                <p className="text-2xl font-bold">${(totalPaid / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Clock className="w-5 h-5 text-blue-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">${(totalOutstanding / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${(overdueAmount / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg"><FileText className="w-5 h-5 text-gray-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-2xl font-bold">${(draftAmount / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by client or invoice #..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>

        {/* Invoice Table */}
        <Card>
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-medium">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.client}</TableCell>
                  <TableCell>{inv.items} items</TableCell>
                  <TableCell className="text-right font-semibold">${inv.amount.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{inv.paymentTerms}</Badge></TableCell>
                  <TableCell>{new Date(inv.issuedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                      {inv.status === "draft" && <Button variant="ghost" size="sm"><Send className="w-4 h-4" /></Button>}
                      {inv.status === "overdue" && <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </Card>
      </main>
    </div>
  );
}
