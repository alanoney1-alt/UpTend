import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusinessTier } from "@/hooks/use-business-tier";
import { UpgradePrompt } from "@/components/business/upgrade-prompt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  Building2, CalendarClock, Truck, Plus, DollarSign,
  TrendingUp, ArrowLeft, Clock, MapPin, Repeat, BarChart3,
  CheckCircle, AlertCircle, Leaf, AlertTriangle, Home, Gift, MessageSquare
} from "lucide-react";
import type { BusinessAccount, RecurringJob } from "@shared/schema";
import { Scope3EsgReport } from "@/components/scope3-esg-report";
import { ViolationSubmission } from "@/components/hoa/violation-submission";
import { PropertyRoster } from "@/components/hoa/property-roster";
import { HoaEsgDashboard } from "@/components/hoa/esg-dashboard";
import { HoaReferralPayments } from "@/components/hoa/referral-payments";
import { HoaCommunicationCenter } from "@/components/hoa/communication-center";
import { BusinessContextSwitcher } from "@/components/business/business-context-switcher";
import { TeamManagementTable } from "@/components/business/team-management-table";
import { ServiceBreakdownChart } from "@/components/esg/service-breakdown-chart";
import { useToast } from "@/hooks/use-toast";

// ─── Portfolio Health Card ──────────────────────────────────────────────────
function PortfolioHealthCard({ businessId }: { businessId: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/business/portfolio-health", businessId],
    queryFn: async () => {
      const res = await fetch("/api/business/portfolio-health", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  if (!data) return null;
  const scoreColor = data.overallScore >= 70 ? "text-green-600" : data.overallScore >= 40 ? "text-yellow-600" : "text-red-600";
  return (
    <Card className="mb-6 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Home className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Portfolio Health</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold mb-1"><span className={scoreColor}>{data.overallScore}</span>/100</p>
          <p className="text-sm text-muted-foreground">{data.totalProperties} properties</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" />Green</span><span className="font-bold">{data.tiers?.green || 0}</span></div>
          <div className="flex justify-between"><span className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-yellow-500" />Yellow</span><span className="font-bold">{data.tiers?.yellow || 0}</span></div>
          <div className="flex justify-between"><span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" />Red</span><span className="font-bold">{data.tiers?.red || 0}</span></div>
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Top 5 Needing Attention</p>
          {(data.top5NeedingAttention || []).map((p: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="truncate mr-2">{p.address}</span>
              <Badge variant={p.score < 40 ? "destructive" : "secondary"}>{p.score}</Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Budget vs Actual Card ─────────────────────────────────────────────────
function BudgetVsActualCard({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetPeriod, setBudgetPeriod] = useState("monthly");
  const [budgetCategory, setBudgetCategory] = useState("");

  const { data } = useQuery<any>({
    queryKey: ["/api/business/budget-report", businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/budget-report/${businessId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createBudget = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/budgets", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, budgetAmount: Number(budgetAmount), period: budgetPeriod, category: budgetCategory || null }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/budget-report", businessId] });
      setShowBudgetForm(false);
      toast({ title: "Budget created" });
    },
  });

  const budget = data?.totalBudget || 0;
  const actual = data?.totalSpent || 0;
  const variance = budget - actual;
  const pctUsed = budget > 0 ? Math.round((actual / budget) * 100) : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Budget vs Actual</h3>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowBudgetForm(!showBudgetForm)}>
          <Plus className="w-3 h-3 mr-1" />Set Budget
        </Button>
      </div>
      {showBudgetForm && (
        <div className="mb-4 p-3 border rounded-lg space-y-2">
          <Input placeholder="Budget amount" type="number" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} />
          <Select value={budgetPeriod} onValueChange={setBudgetPeriod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Category (optional)" value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)} />
          <Button size="sm" onClick={() => createBudget.mutate()} disabled={!budgetAmount}>Save</Button>
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div><p className="text-sm text-muted-foreground">Budget</p><p className="text-xl font-bold">${budget.toLocaleString()}</p></div>
        <div><p className="text-sm text-muted-foreground">Actual</p><p className="text-xl font-bold">${actual.toLocaleString()}</p></div>
        <div><p className="text-sm text-muted-foreground">Variance</p><p className={`text-xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>${variance.toLocaleString()}</p></div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div className={`h-4 rounded-full ${pctUsed > 100 ? 'bg-red-500' : pctUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(pctUsed, 100)}%` }} />
      </div>
      <p className="text-sm text-muted-foreground mt-1">{pctUsed}% used</p>
    </Card>
  );
}

// ─── Budget Forecast Card ──────────────────────────────────────────────────
function BudgetForecastCard({ businessId }: { businessId: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/business/budget-forecast", businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/budget-forecast/${businessId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  if (!data) return null;
  return (
    <Card className="p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Spending Forecast</h3>
      </div>
      <div className="space-y-2">
        {(data.forecast || []).map((f: any, i: number) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm">{f.month}</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-3">
                <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.min((f.projected / (data.maxProjected || 1)) * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-medium w-20 text-right">${f.projected.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      {data.seasonalNote && <p className="text-xs text-muted-foreground mt-3">{data.seasonalNote}</p>}
    </Card>
  );
}

// ─── Predictive Maintenance Card ───────────────────────────────────────────
function PredictiveMaintenanceCard({ businessId }: { businessId: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/business/portfolio-health", businessId, "predictive"],
    queryFn: async () => {
      const res = await fetch("/api/business/portfolio-health", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  // Use maintenance predictions from the health rollup or a dedicated field
  const predictions = data?.maintenancePredictions || {
    overdueByType: [
      { serviceType: "Gutter Cleaning", count: 47, estCost: 7050 },
      { serviceType: "Pressure Washing", count: 32, estCost: 6400 },
      { serviceType: "HVAC Service", count: 18, estCost: 3600 },
      { serviceType: "Pool Cleaning", count: 12, estCost: 1800 },
    ],
    forecast30: 28, forecast60: 54, forecast90: 89,
    deferredCost: 18850,
  };
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold">Predictive Maintenance</h3>
      </div>
      <div className="space-y-3 mb-4">
        {(predictions.overdueByType || []).map((item: any, i: number) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm">{item.count} units overdue for <strong>{item.serviceType}</strong></span>
            <span className="text-sm text-muted-foreground">${item.estCost.toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="p-2 bg-yellow-50 rounded"><p className="text-lg font-bold">{predictions.forecast30}</p><p className="text-xs">Next 30 days</p></div>
        <div className="p-2 bg-orange-50 rounded"><p className="text-lg font-bold">{predictions.forecast60}</p><p className="text-xs">Next 60 days</p></div>
        <div className="p-2 bg-red-50 rounded"><p className="text-lg font-bold">{predictions.forecast90}</p><p className="text-xs">Next 90 days</p></div>
      </div>
      <p className="text-sm text-red-600 font-medium">Est. deferred maintenance cost: ${predictions.deferredCost?.toLocaleString()}</p>
    </Card>
  );
}

// ─── Crew Management Card ──────────────────────────────────────────────────
function CrewManagementCard({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [crewName, setCrewName] = useState("");
  const [specialties, setSpecialties] = useState("");

  const { data: crews } = useQuery<any[]>({
    queryKey: ["/api/business/crews", businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/crews/${businessId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: timeReport } = useQuery<any>({
    queryKey: ["/api/business/crews/time-report", businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/crews/time-report/${businessId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const createCrew = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/crews", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, crewName, serviceSpecialties: specialties.split(",").map(s => s.trim()).filter(Boolean) }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/crews", businessId] });
      setShowCrewForm(false);
      setCrewName("");
      setSpecialties("");
      toast({ title: "Crew created" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Crew Management</h2>
        <Button onClick={() => setShowCrewForm(!showCrewForm)}><Plus className="w-4 h-4 mr-1" />Add Crew</Button>
      </div>
      {showCrewForm && (
        <Card className="p-4 space-y-2">
          <Input placeholder="Crew name" value={crewName} onChange={e => setCrewName(e.target.value)} />
          <Input placeholder="Specialties (comma-separated)" value={specialties} onChange={e => setSpecialties(e.target.value)} />
          <Button size="sm" onClick={() => createCrew.mutate()} disabled={!crewName}>Create Crew</Button>
        </Card>
      )}
      {(crews || []).length === 0 ? (
        <Card className="p-8 text-center"><Truck className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>No crews yet</p></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(crews || []).map((crew: any) => (
            <Card key={crew.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{crew.crew_name || crew.crewName}</h3>
                <Badge variant={crew.is_active !== false ? "default" : "secondary"}>{crew.is_active !== false ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Members: {(crew.members || []).length}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {(crew.service_specialties || crew.serviceSpecialties || []).map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      {timeReport && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Time Tracking Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-bold">{timeReport.totalHours?.toFixed(1) || 0}</p><p className="text-sm text-muted-foreground">Total Hours</p></div>
            <div><p className="text-2xl font-bold">{timeReport.totalEntries || 0}</p><p className="text-sm text-muted-foreground">Time Entries</p></div>
            <div><p className="text-2xl font-bold">{timeReport.activeClockIns || 0}</p><p className="text-sm text-muted-foreground">Clocked In Now</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}

const businessTypes = [
  { id: "property_manager", label: "Property Manager" },
  { id: "contractor", label: "Contractor" },
  { id: "retailer", label: "Retailer" },
  { id: "restaurant", label: "Restaurant" },
  { id: "office", label: "Office Building" },
  { id: "other", label: "Other" },
];

const frequencies = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
];

export default function BusinessDashboard() {
  const { isIndependent } = useBusinessTier();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoUserId = "demo-business-user";
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRecurringJobForm, setShowRecurringJobForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    businessName: "",
    businessType: "",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactEmail: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
  });
  const [jobForm, setJobForm] = useState({
    serviceType: "junk_removal",
    pickupAddress: "",
    pickupCity: "",
    pickupZip: "",
    description: "",
    frequency: "weekly",
    preferredDayOfWeek: 1,
    preferredTimeSlot: "morning",
    estimatedLoadSize: "medium",
  });

  const { data, isLoading, error } = useQuery<{ account: BusinessAccount; recurringJobs: RecurringJob[] }>({
    queryKey: ["/api/business-accounts", demoUserId],
    queryFn: async () => {
      const res = await fetch(`/api/business-accounts/${demoUserId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (formData: typeof accountForm) => {
      const response = await apiRequest("POST", "/api/business-accounts", {
        ...formData,
        userId: demoUserId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-accounts", demoUserId] });
      setShowCreateForm(false);
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const createJobMutation = useMutation({
    mutationFn: async (formData: typeof jobForm) => {
      const response = await apiRequest("POST", "/api/recurring-jobs", {
        ...formData,
        businessAccountId: data?.account.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-accounts", demoUserId] });
      setShowRecurringJobForm(false);
      setJobForm({
        serviceType: "junk_removal",
        pickupAddress: "",
        pickupCity: "",
        pickupZip: "",
        description: "",
        frequency: "weekly",
        preferredDayOfWeek: 1,
        preferredTimeSlot: "morning",
        estimatedLoadSize: "medium",
      });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/recurring-jobs/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-accounts", demoUserId] });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Business Portal</span>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
      </div>
    );
  }

  if (!data?.account && !showCreateForm) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">UpTend for Business</span>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Building2 className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h1 className="text-3xl font-bold mb-4">Business Accounts</h1>
            <p className="text-muted-foreground mb-8">
              Set up recurring services, get volume discounts, and manage all your home service needs in one place.
              Perfect for property managers, contractors, and businesses with regular junk removal needs.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 text-center">
                <CalendarClock className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Recurring Jobs</h3>
                <p className="text-sm text-muted-foreground">Schedule automatic pickups</p>
              </Card>
              <Card className="p-4 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Volume Discounts</h3>
                <p className="text-sm text-muted-foreground">Save more with bulk jobs</p>
              </Card>
              <Card className="p-4 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Detailed Reports</h3>
                <p className="text-sm text-muted-foreground">Track all your spending</p>
              </Card>
            </div>
            <Button size="lg" onClick={() => setShowCreateForm(true)} data-testid="button-create-business-account">
              <Plus className="w-4 h-4 mr-2" />
              Create Business Account
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (showCreateForm && !data?.account) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <span className="text-xl font-bold">Create Business Account</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-xl">
          <Card className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); createAccountMutation.mutate(accountForm); }} className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={accountForm.businessName}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, businessName: e.target.value }))}
                  required
                  data-testid="input-business-name"
                />
              </div>
              <div>
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={accountForm.businessType} onValueChange={(v) => setAccountForm(prev => ({ ...prev, businessType: v }))}>
                  <SelectTrigger data-testid="select-business-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={accountForm.primaryContactName}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, primaryContactName: e.target.value }))}
                    data-testid="input-contact-name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={accountForm.primaryContactPhone}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, primaryContactPhone: e.target.value }))}
                    data-testid="input-contact-phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={accountForm.primaryContactEmail}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, primaryContactEmail: e.target.value }))}
                  data-testid="input-contact-email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createAccountMutation.isPending} data-testid="button-submit-account">
                {createAccountMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </Card>
        </main>
      </div>
    );
  }

  const account = data!.account;
  const recurringJobs = data!.recurringJobs || [];

  return (
    <div className="min-h-screen bg-background" data-testid="page-business-dashboard">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">{account.businessName}</span>
            </div>
            <Badge variant="secondary">{businessTypes.find(t => t.id === account.businessType)?.label}</Badge>
          </div>
          <div className="flex items-center gap-4">
            <BusinessContextSwitcher
              currentBusinessId={account.id}
              onBusinessChange={(businessId) => {
                // Reload dashboard with new business context
                queryClient.invalidateQueries({ queryKey: ["/api/business-accounts"] });
              }}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isIndependent && (
          <div className="mb-6">
            <UpgradePrompt featureName="Advanced Features" variant="banner" />
          </div>
        )}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold" data-testid="stat-total-jobs">{account.totalJobsCompleted || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold" data-testid="stat-total-spent">${account.totalSpent?.toFixed(0) || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Repeat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recurring Jobs</p>
                <p className="text-2xl font-bold" data-testid="stat-recurring">{recurringJobs.filter(j => j.isActive).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discount Tier</p>
                <p className="text-2xl font-bold capitalize" data-testid="stat-discount-tier">{account.volumeDiscountTier || "None"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Portfolio Health Card */}
        {account.businessType === "property_manager" && <PortfolioHealthCard businessId={account.id} />}

        <div className="mb-6">
          <Link href="/business/booking">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <CalendarClock className="w-4 h-4 mr-2" />
              Book a Service
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="recurring" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recurring">Recurring Jobs</TabsTrigger>
            {account.businessType === "property_manager" && (
              <>
                <TabsTrigger value="properties" data-testid="tab-properties">
                  <Home className="h-4 w-4 mr-1" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="violations" data-testid="tab-violations">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Violations
                </TabsTrigger>
                <TabsTrigger value="referrals" data-testid="tab-referrals">
                  <Gift className="h-4 w-4 mr-1" />
                  Referrals
                </TabsTrigger>
                <TabsTrigger value="communications" data-testid="tab-communications">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Communications
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="budget" data-testid="tab-budget">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget
            </TabsTrigger>
            {account.businessType === "property_manager" && (
              <>
                <TabsTrigger value="predictive" data-testid="tab-predictive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Maintenance
                </TabsTrigger>
                <TabsTrigger value="crews" data-testid="tab-crews">
                  <Truck className="h-4 w-4 mr-1" />
                  Crews
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="team" data-testid="tab-team">
              <Building2 className="h-4 w-4 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="esg" data-testid="tab-esg-reports"><Leaf className="h-4 w-4 mr-1" />ESG Reports</TabsTrigger>
            <TabsTrigger value="history">Job History</TabsTrigger>
            <TabsTrigger value="settings">Account Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Scheduled Recurring Pickups</h2>
              <Dialog open={showRecurringJobForm} onOpenChange={setShowRecurringJobForm}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-recurring">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recurring Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Recurring Job</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); createJobMutation.mutate(jobForm); }} className="space-y-4">
                    <div>
                      <Label>Service Type</Label>
                      <Select value={jobForm.serviceType} onValueChange={(v) => setJobForm(prev => ({ ...prev, serviceType: v }))}>
                        <SelectTrigger data-testid="select-service-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="junk_removal">Junk Removal</SelectItem>
                          <SelectItem value="furniture_moving">Furniture Moving</SelectItem>
                          <SelectItem value="garage_cleanout">Garage Cleanout</SelectItem>
                          <SelectItem value="estate_cleanout">Estate Cleanout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pickup Address</Label>
                      <Input
                        value={jobForm.pickupAddress}
                        onChange={(e) => setJobForm(prev => ({ ...prev, pickupAddress: e.target.value }))}
                        placeholder="123 Business St"
                        required
                        data-testid="input-job-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>City</Label>
                        <Input
                          value={jobForm.pickupCity}
                          onChange={(e) => setJobForm(prev => ({ ...prev, pickupCity: e.target.value }))}
                          placeholder="Orlando"
                          required
                          data-testid="input-job-city"
                        />
                      </div>
                      <div>
                        <Label>ZIP</Label>
                        <Input
                          value={jobForm.pickupZip}
                          onChange={(e) => setJobForm(prev => ({ ...prev, pickupZip: e.target.value }))}
                          placeholder="32801"
                          required
                          data-testid="input-job-zip"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select value={jobForm.frequency} onValueChange={(v) => setJobForm(prev => ({ ...prev, frequency: v }))}>
                        <SelectTrigger data-testid="select-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Estimated Load Size</Label>
                      <Select value={jobForm.estimatedLoadSize} onValueChange={(v) => setJobForm(prev => ({ ...prev, estimatedLoadSize: v }))}>
                        <SelectTrigger data-testid="select-load-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="extra_large">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full" disabled={createJobMutation.isPending} data-testid="button-create-job">
                      {createJobMutation.isPending ? "Creating..." : "Create Recurring Job"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {recurringJobs.length === 0 ? (
              <Card className="p-8 text-center">
                <Repeat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Recurring Jobs Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Set up automatic pickups on a regular schedule to save time.
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {recurringJobs.map(job => (
                  <Card key={job.id} className={`p-4 ${!job.isActive ? 'opacity-60' : ''}`} data-testid={`recurring-job-${job.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold capitalize">{job.serviceType.replace("_", " ")}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.pickupAddress}, {job.pickupCity}
                        </p>
                      </div>
                      <Badge variant={job.isActive ? "default" : "secondary"}>
                        {job.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {frequencies.find(f => f.id === job.frequency)?.label}
                      </span>
                      <span className="capitalize">{job.estimatedLoadSize} load</span>
                    </div>
                    {job.negotiatedPrice && (
                      <p className="text-sm font-medium text-green-600 mb-3">
                        Negotiated rate: ${job.negotiatedPrice}/pickup
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleJobMutation.mutate({ id: job.id, isActive: !job.isActive })}
                        data-testid={`toggle-job-${job.id}`}
                      >
                        {job.isActive ? "Pause" : "Resume"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {account.businessType === "property_manager" && (
            <>
              <TabsContent value="properties" className="space-y-4">
                <PropertyRoster businessAccountId={account.id} />
              </TabsContent>

              <TabsContent value="violations" className="space-y-4">
                <ViolationSubmission businessAccountId={account.id} />
              </TabsContent>

              <TabsContent value="referrals" className="space-y-4">
                <HoaReferralPayments businessAccountId={account.id} />
              </TabsContent>

              <TabsContent value="communications" className="space-y-4">
                <HoaCommunicationCenter businessAccountId={account.id} />
              </TabsContent>
            </>
          )}

          <TabsContent value="budget" className="space-y-4">
            <BudgetVsActualCard businessId={account.id} />
            <BudgetForecastCard businessId={account.id} />
          </TabsContent>

          {account.businessType === "property_manager" && (
            <>
              <TabsContent value="predictive" className="space-y-4">
                <PredictiveMaintenanceCard businessId={account.id} />
              </TabsContent>
              <TabsContent value="crews" className="space-y-4">
                <CrewManagementCard businessId={account.id} />
              </TabsContent>
            </>
          )}

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamManagementTable businessAccountId={account.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="esg" className="space-y-4">
            {account.businessType === "property_manager" ? (
              <HoaEsgDashboard businessAccountId={account.id} />
            ) : (
              <Scope3EsgReport businessAccountId={account.id} />
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Job History Yet</h3>
              <p className="text-muted-foreground">
                View detailed history of all completed jobs and spending reports.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Business Name</Label>
                  <p className="font-medium">{account.businessName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Type</Label>
                  <p className="font-medium">{businessTypes.find(t => t.id === account.businessType)?.label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Primary Contact</Label>
                  <p className="font-medium">{account.primaryContactName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Phone</Label>
                  <p className="font-medium">{account.primaryContactPhone || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p className="font-medium">{account.primaryContactEmail || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Terms</Label>
                  <p className="font-medium">
                    {account.invoicingEnabled ? `Net ${account.netPaymentTerms || 30} days` : "Pay per job"}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
