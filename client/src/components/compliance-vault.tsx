import { safeFetchJson } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { apiRequest } from "@/lib/queryClient";
import { Receipt, Car, Calculator, DollarSign, FileText, TrendingUp, Plus, Calendar } from "lucide-react";

interface ComplianceReceipt {
  id: string;
  receiptType: string;
  vendorName: string;
  amount: number;
  receiptDate: string;
  taxDeductible: boolean;
  category: string;
}

interface MileageLog {
  id: string;
  startAddress: string;
  endAddress: string;
  distanceMiles: number;
  purpose: string;
  tripDate: string;
  deductionAmount: number;
}

interface TaxSummary {
  year: number;
  totalExpenses: number;
  totalDeductibleExpenses: number;
  expensesByCategory: Record<string, number>;
  totalMiles: number;
  businessMiles: number;
  mileageDeduction: number;
  totalDeductions: number;
  irsStandardRate: string;
  estimatedTaxSavings: number;
}

interface ComplianceVaultProps {
  proId: string;
}

const receiptTypes = [
  { value: "fuel", label: "Fuel / Gas" },
  { value: "disposal", label: "Dump / Disposal Fees" },
  { value: "equipment", label: "Tools / Equipment" },
  { value: "insurance", label: "Insurance" },
  { value: "license", label: "License / Permits" },
  { value: "other", label: "Other" },
];

export function ComplianceVault({ proId }: ComplianceVaultProps) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [showMileageForm, setShowMileageForm] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    receiptType: "fuel",
    vendorName: "",
    amount: "",
    receiptDate: new Date().toISOString().split("T")[0],
  });
  const [mileageForm, setMileageForm] = useState({
    startAddress: "",
    endAddress: "",
    distanceMiles: "",
    purpose: "business",
    tripDate: new Date().toISOString().split("T")[0],
  });

  const { data: receipts = [], isLoading: loadingReceipts } = useQuery<ComplianceReceipt[]>({
    queryKey: ["/api/compliance/receipts", proId],
    queryFn: () => safeFetchJson(`/api/compliance/receipts/${proId}`),
  });

  const { data: mileageLogs = [], isLoading: loadingMileage } = useQuery<MileageLog[]>({
    queryKey: ["/api/compliance/mileage", proId],
    queryFn: () => safeFetchJson(`/api/compliance/mileage/${proId}`),
  });

  const { data: taxSummary } = useQuery<TaxSummary>({
    queryKey: ["/api/compliance/tax-summary", proId, currentYear],
    queryFn: () => safeFetchJson(`/api/compliance/tax-summary/${proId}?year=${currentYear}`),
  });

  const addReceiptMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/compliance/receipts", {
        proId,
        receiptType: receiptForm.receiptType,
        vendorName: receiptForm.vendorName,
        amount: parseFloat(receiptForm.amount),
        receiptDate: receiptForm.receiptDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/receipts", proId] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/tax-summary", proId] });
      setShowReceiptForm(false);
      setReceiptForm({ receiptType: "fuel", vendorName: "", amount: "", receiptDate: new Date().toISOString().split("T")[0] });
    },
  });

  const addMileageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/compliance/mileage", {
        proId,
        startAddress: mileageForm.startAddress,
        endAddress: mileageForm.endAddress,
        distanceMiles: parseFloat(mileageForm.distanceMiles),
        purpose: mileageForm.purpose,
        tripDate: mileageForm.tripDate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/mileage", proId] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance/tax-summary", proId] });
      setShowMileageForm(false);
      setMileageForm({ startAddress: "", endAddress: "", distanceMiles: "", purpose: "business", tripDate: new Date().toISOString().split("T")[0] });
    },
  });

  if (loadingReceipts || loadingMileage) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Tax & Compliance Vault</h3>
      </div>

      {taxSummary && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              {currentYear} Tax Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-primary" data-testid="text-total-deductions">${taxSummary.totalDeductions.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Deductions</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-400" data-testid="text-tax-savings">${taxSummary.estimatedTaxSavings.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Est. Tax Savings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" data-testid="text-business-miles">{taxSummary.businessMiles.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Business Miles</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" data-testid="text-mileage-deduction">${taxSummary.mileageDeduction.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Mileage Deduction</p>
              </div>
            </div>
            {Object.keys(taxSummary.expensesByCategory || {}).length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Expenses by Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(taxSummary.expensesByCategory).map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{cat.replace(/_/g, " ")}</span>
                      <span className="font-medium">${(amt as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="receipts">
        <TabsList className="w-full">
          <TabsTrigger value="receipts" className="flex-1" data-testid="tab-receipts">
            <Receipt className="h-4 w-4 mr-1" /> Receipts ({receipts.length})
          </TabsTrigger>
          <TabsTrigger value="mileage" className="flex-1" data-testid="tab-mileage">
            <Car className="h-4 w-4 mr-1" /> Mileage ({mileageLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-3 mt-3">
          <Button size="sm" onClick={() => setShowReceiptForm(!showReceiptForm)} data-testid="button-add-receipt">
            <Plus className="h-4 w-4 mr-1" /> Add Receipt
          </Button>

          {showReceiptForm && (
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={receiptForm.receiptType} onValueChange={(v) => setReceiptForm({ ...receiptForm, receiptType: v })}>
                    <SelectTrigger data-testid="select-receipt-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {receiptTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Vendor</Label>
                  <Input placeholder="Store name" value={receiptForm.vendorName} onChange={(e) => setReceiptForm({ ...receiptForm, vendorName: e.target.value })} data-testid="input-vendor" />
                </div>
                <div className="space-y-1">
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={receiptForm.amount} onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })} data-testid="input-receipt-amount" />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={receiptForm.receiptDate} onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })} data-testid="input-receipt-date" />
                </div>
              </div>
              <Button onClick={() => addReceiptMutation.mutate()} disabled={addReceiptMutation.isPending || !receiptForm.amount} className="w-full" data-testid="button-save-receipt">
                {addReceiptMutation.isPending ? "Saving..." : "Save Receipt"}
              </Button>
            </Card>
          )}

          {receipts.map((r) => (
            <Card key={r.id} className="p-3" data-testid={`card-receipt-${r.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Receipt className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.vendorName || r.receiptType}</p>
                    <p className="text-xs text-muted-foreground">{r.receiptDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">${r.amount.toFixed(2)}</span>
                  {r.taxDeductible && <Badge variant="outline" className="text-green-400 border-green-500/30">Deductible</Badge>}
                  <Badge variant="secondary">{r.receiptType}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="mileage" className="space-y-3 mt-3">
          <Button size="sm" onClick={() => setShowMileageForm(!showMileageForm)} data-testid="button-add-mileage">
            <Plus className="h-4 w-4 mr-1" /> Log Trip
          </Button>

          {showMileageForm && (
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>From</Label>
                  <AddressAutocomplete
                    value={mileageForm.startAddress}
                    onChange={(value) => setMileageForm({ ...mileageForm, startAddress: value })}
                    onSelectAddress={(address) => setMileageForm({ ...mileageForm, startAddress: address })}
                    placeholder="Start address"
                    icon={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label>To</Label>
                  <AddressAutocomplete
                    value={mileageForm.endAddress}
                    onChange={(value) => setMileageForm({ ...mileageForm, endAddress: value })}
                    onSelectAddress={(address) => setMileageForm({ ...mileageForm, endAddress: address })}
                    placeholder="End address"
                    icon={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Miles</Label>
                  <Input type="number" step="0.1" placeholder="0.0" value={mileageForm.distanceMiles} onChange={(e) => setMileageForm({ ...mileageForm, distanceMiles: e.target.value })} data-testid="input-miles" />
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={mileageForm.tripDate} onChange={(e) => setMileageForm({ ...mileageForm, tripDate: e.target.value })} data-testid="input-trip-date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Purpose</Label>
                <Select value={mileageForm.purpose} onValueChange={(v) => setMileageForm({ ...mileageForm, purpose: v })}>
                  <SelectTrigger data-testid="select-purpose"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addMileageMutation.mutate()} disabled={addMileageMutation.isPending || !mileageForm.distanceMiles} className="w-full" data-testid="button-save-mileage">
                {addMileageMutation.isPending ? "Saving..." : "Log Trip"}
              </Button>
            </Card>
          )}

          {mileageLogs.map((m) => (
            <Card key={m.id} className="p-3" data-testid={`card-mileage-${m.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Car className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.distanceMiles.toFixed(1)} miles</p>
                    <p className="text-xs text-muted-foreground">{m.startAddress || "Start"} → {m.endAddress || "End"} / {m.tripDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-green-400">${m.deductionAmount.toFixed(2)}</span>
                  <Badge variant={m.purpose === "business" ? "default" : "secondary"}>
                    {m.purpose}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
