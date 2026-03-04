import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Send, Ban, CreditCard, Bell, FileDown,
  DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2,
  Search, ChevronRight, X, Trash2
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: number;
  partnerSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "void";
  paymentLink: string | null;
  notes: string;
  dueDate: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceStats {
  totalOutstanding: number;
  totalCollected: number;
  avgDaysToPay: number;
  overdueCount: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:   "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  sent:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  viewed:  "bg-purple-500/15 text-purple-400 border-purple-500/30",
  paid:    "bg-green-500/15 text-green-400 border-green-500/30",
  overdue: "bg-red-500/15 text-red-400 border-red-500/30",
  void:    "bg-zinc-700/30 text-zinc-500 border-zinc-700/30",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", sent: "Sent", viewed: "Viewed",
  paid: "Paid", overdue: "Overdue", void: "Void",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Create Invoice Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  slug: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateInvoiceModal({ slug, open, onClose, onCreated }: CreateModalProps) {
  const { toast } = useToast();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0.07");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map((item, idx) =>
      idx === i ? { ...item, [field]: field === "description" ? value : parseFloat(value as string) || 0 } : item
    ));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * parseFloat(taxRate || "0");
  const total = subtotal + tax;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData: { name: customerName, email: customerEmail, phone: customerPhone },
          items,
          notes,
          dueDate: dueDate || null,
          taxRate: parseFloat(taxRate) || 0.07,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice created" });
      onCreated();
      onClose();
      setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setNotes(""); setDueDate("");
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-[#111118] border-white/10 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">New Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-3 font-semibold">Customer</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-zinc-400 text-xs">Name *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1" placeholder="John Smith" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Email</Label>
                <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1" placeholder="john@example.com" type="email" />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs">Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1" placeholder="(407) 555-0100" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Line Items</p>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-blue-400 hover:text-blue-300 h-7 px-2">
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="col-span-6 bg-white/5 border-white/10 text-white text-sm" placeholder="Service description" />
                  <Input value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    className="col-span-2 bg-white/5 border-white/10 text-white text-sm text-center" type="number" min="0.01" step="0.01" />
                  <Input value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    className="col-span-3 bg-white/5 border-white/10 text-white text-sm text-right" type="number" min="0" step="0.01" />
                  <button onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-zinc-600 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white/5 rounded-lg p-4 space-y-1 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <div className="flex items-center gap-2">
                <span>Tax Rate</span>
                <Input value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                  className="w-20 h-6 bg-white/5 border-white/10 text-white text-xs" type="number" min="0" max="1" step="0.001" />
              </div>
              <span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-2 mt-2">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 text-xs">Due Date</Label>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1" type="date" />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={2} placeholder="Payment terms, notes..." />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400">Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={!customerName || mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700">
            {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invoice Detail Panel ─────────────────────────────────────────────────────

interface DetailPanelProps {
  slug: string;
  invoiceId: number;
  onClose: () => void;
  onRefresh: () => void;
}

function InvoiceDetailPanel({ slug, invoiceId, onClose, onRefresh }: DetailPanelProps) {
  const { toast } = useToast();
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [showPayForm, setShowPayForm] = useState(false);

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/${invoiceId}`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/${invoiceId}/send`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: (d) => {
      toast({ title: "Invoice sent!", description: d.paymentLink ? `Payment link: ${d.paymentLink}` : undefined });
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const voidMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/${invoiceId}/void`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
    },
    onSuccess: () => { toast({ title: "Invoice voided" }); onRefresh(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const reminderMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/${invoiceId}/reminder`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => toast({ title: "Reminder sent!" }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/${invoiceId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(payAmount), method: payMethod }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payment recorded" });
      setShowPayForm(false);
      setPayAmount("");
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
    </div>
  );

  if (!invoice) return null;

  const canSend = invoice.status === "draft";
  const canVoid = !["void", "paid"].includes(invoice.status);
  const canPay  = !["paid", "void"].includes(invoice.status);
  const canRemind = ["sent", "viewed", "overdue"].includes(invoice.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f0f1a] border-l border-white/10 h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Invoice #{invoice.id}</p>
            <h2 className="text-xl font-bold text-white">{invoice.customerName}</h2>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={invoice.status} />
            <button onClick={onClose} className="text-zinc-400 hover:text-white ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-5">
          {/* Customer Info */}
          <div className="bg-white/5 rounded-lg p-4 space-y-1 text-sm">
            {invoice.customerEmail && (
              <p className="text-zinc-300">{invoice.customerEmail}</p>
            )}
            {invoice.customerPhone && (
              <p className="text-zinc-400">{invoice.customerPhone}</p>
            )}
            <div className="flex gap-4 pt-1 text-xs text-zinc-500">
              <span>Created {fmtDate(invoice.createdAt)}</span>
              {invoice.dueDate && <span>Due {fmtDate(invoice.dueDate)}</span>}
              {invoice.paidAt && <span>Paid {fmtDate(invoice.paidAt)}</span>}
            </div>
          </div>

          {/* Line Items */}
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Line Items</p>
            <div className="space-y-1">
              {invoice.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between text-sm py-2 border-b border-white/5">
                  <div className="flex-1">
                    <p className="text-white">{item.description}</p>
                    <p className="text-zinc-500 text-xs">{item.quantity} × {fmt(item.unitPrice)}</p>
                  </div>
                  <p className="text-white font-medium ml-4">{fmt(item.quantity * item.unitPrice)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 mt-3 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%)</span><span>{fmt(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-base border-t border-white/10 pt-2">
                <span>Total</span><span>{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Notes</p>
              <p className="text-sm text-zinc-300 bg-white/5 rounded p-3">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Link */}
          {invoice.paymentLink && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1 font-semibold">Payment Link</p>
              <a href={invoice.paymentLink} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline break-all">
                {invoice.paymentLink}
              </a>
            </div>
          )}

          {/* Record Payment Form */}
          {showPayForm && (
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-white">Record Payment</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-400 text-xs">Amount</Label>
                  <Input value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder={invoice.total.toString()} />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs">Method</Label>
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111118] border-white/10 text-white">
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPayForm(false)} className="text-zinc-400">Cancel</Button>
                <Button size="sm" onClick={() => payMutation.mutate()} disabled={!payAmount || payMutation.isPending}
                  className="bg-green-600 hover:bg-green-700">
                  {payMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Record"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-white/10 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {canSend && (
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 col-span-2">
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invoice
              </Button>
            )}
            {canRemind && (
              <Button variant="outline" onClick={() => reminderMutation.mutate()} disabled={reminderMutation.isPending}
                className="border-white/10 text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                Remind
              </Button>
            )}
            {canPay && !showPayForm && (
              <Button variant="outline" onClick={() => setShowPayForm(true)}
                className="border-white/10 text-white hover:bg-white/10">
                <CreditCard className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            )}
            <a href={`/api/partners/${slug}/invoices/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </a>
            {canVoid && (
              <Button variant="ghost" onClick={() => { if (confirm("Void this invoice?")) voidMutation.mutate(); }}
                disabled={voidMutation.isPending}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <Ban className="w-4 h-4 mr-2" />
                Void
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerInvoicesPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["partner-invoices", slug] });
    qc.invalidateQueries({ queryKey: ["invoice-stats", slug] });
    if (selectedId) qc.invalidateQueries({ queryKey: ["invoice-detail", selectedId] });
  };

  const { data: stats } = useQuery<InvoiceStats>({
    queryKey: ["invoice-stats", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/invoices/stats`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["partner-invoices", slug, statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/partners/${slug}/invoices${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const filtered = invoices.filter((inv) =>
    !search || inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const statuses = ["all", "draft", "sent", "viewed", "paid", "overdue", "void"];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/partners/${slug}/dashboard`}>
              <button className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Invoices</h1>
              <p className="text-xs text-zinc-500">{slug}</p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#111118] border-white/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Outstanding</p>
                  <p className="text-lg font-bold text-white">{stats ? fmt(stats.totalOutstanding) : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111118] border-white/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Collected</p>
                  <p className="text-lg font-bold text-white">{stats ? fmt(stats.totalCollected) : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111118] border-white/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Overdue</p>
                  <p className="text-lg font-bold text-white">{stats ? stats.overdueCount : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#111118] border-white/10">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Avg Days to Pay</p>
                  <p className="text-lg font-bold text-white">{stats ? `${stats.avgDaysToPay}d` : "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or email..."
              className="bg-[#111118] border-white/10 text-white pl-10"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        <Card className="bg-[#111118] border-white/10">
          {isLoading ? (
            <CardContent className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </CardContent>
          ) : filtered.length === 0 ? (
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500">No invoices found</p>
              <Button onClick={() => setCreateOpen(true)} variant="ghost" className="text-blue-400 mt-3">
                <Plus className="w-4 h-4 mr-1" /> Create your first invoice
              </Button>
            </CardContent>
          ) : (
            <div>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/10 text-xs text-zinc-500 uppercase tracking-wider font-medium">
                <span className="col-span-3">Customer</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Amount</span>
                <span className="col-span-2">Created</span>
                <span className="col-span-2">Due</span>
                <span className="col-span-1" />
              </div>

              {filtered.map((inv, i) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`w-full text-left px-5 py-4 hover:bg-white/5 transition-colors ${
                    i < filtered.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-medium">{inv.customerName}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{inv.customerEmail || inv.customerPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{fmt(inv.total)}</p>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <p className="text-white font-medium truncate">{inv.customerName}</p>
                      <p className="text-xs text-zinc-500 truncate">{inv.customerEmail}</p>
                    </div>
                    <div className="col-span-2"><StatusBadge status={inv.status} /></div>
                    <div className="col-span-2 text-white font-medium">{fmt(inv.total)}</div>
                    <div className="col-span-2 text-zinc-400 text-sm">{fmtDate(inv.createdAt)}</div>
                    <div className="col-span-2 text-zinc-400 text-sm">{fmtDate(inv.dueDate)}</div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        slug={slug!}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refresh}
      />

      {selectedId !== null && (
        <InvoiceDetailPanel
          slug={slug!}
          invoiceId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
