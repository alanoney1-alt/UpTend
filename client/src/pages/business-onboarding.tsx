import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Home,
  HardHat,
  Landmark,
  Check,
  Upload,
  Download,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Users,
  Settings,
  FileText,
  Sparkles,
  Star,
  ChevronRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────

type Segment = "property_management" | "hoa" | "construction" | "government";

interface BusinessInfo {
  segment: Segment | "";
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  taxId: string;
  unitCount: string;
  referralSource: string;
}

interface PlanOption {
  tier: "independent" | "starter" | "pro" | "enterprise";
  name: string;
  price: string;
  priceNote: string;
  features: string[];
  popular?: boolean;
  highlight?: boolean;
}

interface ServiceConfig {
  enabledServices: string[];
  emergencyResponseTime: string;
  standardResponseTime: string;
  afterHoursPolicy: string;
  autoApprovalThreshold: string;
  requirePhotos: boolean;
}

interface PropertyEntry {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  units: string;
  type: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  validRows: number;
  errors: string[];
}

// ─── Constants ─────────────────────────────────────────────────────

const SEGMENTS: { key: Segment; label: string; icon: React.ReactNode; description: string }[] = [
  { key: "property_management", label: "Property Management", icon: <Building2 className="h-6 w-6" />, description: "Manage residential & commercial properties" },
  { key: "hoa", label: "HOA / Community", icon: <Home className="h-6 w-6" />, description: "Homeowner associations & communities" },
  { key: "construction", label: "Construction", icon: <HardHat className="h-6 w-6" />, description: "General contractors & builders" },
  { key: "government", label: "Government", icon: <Landmark className="h-6 w-6" />, description: "Municipal & government agencies" },
];

const UNIT_LABELS: Record<Segment, string> = {
  property_management: "Number of Doors",
  hoa: "Number of Units",
  construction: "Active Projects",
  government: "Facilities",
};

const PLANS: Record<Segment, PlanOption[]> = {
  property_management: [
    { tier: "independent", name: "Independent", price: "$0", priceNote: "/mo", highlight: true, features: ["1–10 properties", "Book vetted pros", "Track jobs", "Basic notifications", "7% transaction fee only"] },
    { tier: "starter", name: "Starter", price: "$3", priceNote: "/door/mo", features: ["11–50 doors", "Basic work order management", "Email support", "Standard response times", "Monthly reporting"] },
    { tier: "pro", name: "Pro", price: "$5", priceNote: "/door/mo", popular: true, features: ["51–200 doors", "Priority pro matching", "Phone & email support", "Custom SLAs", "Real-time tracking", "Weekly reporting", "API access"] },
    { tier: "enterprise", name: "Enterprise", price: "$8", priceNote: "/door/mo", features: ["200+ doors", "Dedicated account manager", "24/7 priority support", "Custom SLAs & workflows", "Real-time tracking", "Custom reporting", "API access", "White-label options"] },
  ],
  hoa: [
    { tier: "starter", name: "Starter", price: "$3", priceNote: "/unit/mo", features: ["Up to 100 units", "Basic work order management", "Email support", "Community portal", "Monthly reporting"] },
    { tier: "pro", name: "Pro", price: "$5", priceNote: "/unit/mo", popular: true, features: ["Up to 300 units", "Priority pro matching", "Phone & email support", "Violation tracking", "Real-time tracking", "Weekly reporting", "Resident portal"] },
    { tier: "enterprise", name: "Enterprise", price: "$8", priceNote: "/unit/mo", features: ["Unlimited units", "Dedicated account manager", "24/7 priority support", "Custom workflows", "Board reporting dashboard", "API access", "White-label portal"] },
  ],
  construction: [
    { tier: "starter", name: "Starter", price: "$299", priceNote: "/mo", features: ["Up to 5 active projects", "Basic scheduling", "Email support", "Standard response times", "Monthly reporting"] },
    { tier: "pro", name: "Pro", price: "$599", priceNote: "/mo", popular: true, features: ["Up to 20 active projects", "Priority scheduling", "Phone & email support", "Material tracking", "Real-time updates", "Weekly reporting"] },
    { tier: "enterprise", name: "Enterprise", price: "$999", priceNote: "/mo", features: ["Unlimited projects", "Dedicated account manager", "24/7 support", "Full material tracking", "Custom integrations", "API access", "Compliance tools"] },
  ],
  government: [
    { tier: "starter", name: "Starter", price: "$15K", priceNote: "/yr", features: ["Up to 10 facilities", "Basic work management", "Email support", "Compliance tracking", "Quarterly reporting"] },
    { tier: "pro", name: "Pro", price: "$35K", priceNote: "/yr", popular: true, features: ["Up to 50 facilities", "Priority response", "Phone & email support", "Full compliance suite", "Real-time tracking", "Monthly reporting", "Audit trail"] },
    { tier: "enterprise", name: "Enterprise", price: "$75K", priceNote: "/yr", features: ["Unlimited facilities", "Dedicated team", "24/7 support", "Custom compliance", "Integrations", "API access", "On-site training"] },
  ],
};

const ALL_SERVICES = [
  { key: "junk_removal", label: "Junk Removal & Hauling", priceRange: "$89–$499" },
  { key: "landscaping", label: "Landscaping & Lawn Care", priceRange: "$59–$299" },
  { key: "pool_cleaning", label: "Pool Cleaning & Maintenance", priceRange: "$99–$249" },
  { key: "pressure_washing", label: "Pressure Washing", priceRange: "$149–$449" },
  { key: "plumbing", label: "Plumbing", priceRange: "$99–$599" },
  { key: "electrical", label: "Electrical", priceRange: "$89–$499" },
  { key: "hvac", label: "HVAC", priceRange: "$99–$699" },
  { key: "painting", label: "Painting", priceRange: "$199–$2,999" },
  { key: "cleaning", label: "Cleaning", priceRange: "$79–$299" },
  { key: "handyman", label: "Handyman", priceRange: "$69–$399" },
  { key: "pest_control", label: "Pest Control", priceRange: "$99–$349" },
  { key: "roofing", label: "Roofing", priceRange: "$299–$9,999" },
];

const STEPS = [
  { label: "Business Info", icon: <Building2 className="h-4 w-4" /> },
  { label: "Plan", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Services", icon: <Settings className="h-4 w-4" /> },
  { label: "Properties", icon: <Home className="h-4 w-4" /> },
  { label: "Team", icon: <Users className="h-4 w-4" /> },
  { label: "Review", icon: <FileText className="h-4 w-4" /> },
  { label: "Welcome", icon: <Sparkles className="h-4 w-4" /> },
];

const INTEGRATIONS = [
  { key: "appfolio", name: "AppFolio" },
  { key: "buildium", name: "Buildium" },
  { key: "yardi", name: "Yardi" },
];

// ─── Helpers ───────────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyProperty(): PropertyEntry {
  return { id: makeId(), address: "", city: "", state: "", zip: "", units: "1", type: "residential", tenantName: "", tenantEmail: "", tenantPhone: "" };
}

function emptyTeamMember(): TeamMember {
  return { id: makeId(), name: "", email: "", role: "coordinator" };
}

// ─── Component ─────────────────────────────────────────────────────

export default function BusinessOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [info, setInfo] = useState<BusinessInfo>({
    segment: "", companyName: "", address: "", city: "", state: "", zip: "",
    phone: "", email: "", website: "", contactName: "", contactTitle: "",
    contactEmail: "", contactPhone: "", taxId: "", unitCount: "", referralSource: "",
  });

  // Step 2
  const urlPlan = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : null;
  const [selectedPlan, setSelectedPlan] = useState<"independent" | "starter" | "pro" | "enterprise" | "">(
    urlPlan === "independent" ? "independent" : ""
  );

  // Step 3
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    enabledServices: [],
    emergencyResponseTime: "2hr",
    standardResponseTime: "24hr",
    afterHoursPolicy: "emergency_only",
    autoApprovalThreshold: "500",
    requirePhotos: true,
  });

  // Step 4
  const [importMode, setImportMode] = useState<"manual" | "csv" | "integration">("manual");
  const [properties, setProperties] = useState<PropertyEntry[]>([emptyProperty()]);
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [integrationKeys, setIntegrationKeys] = useState<Record<string, string>>({});

  // Step 5
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([emptyTeamMember()]);

  // Step 6
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/business/onboard", data);
      return res.json();
    },
    onSuccess: () => setStep(6),
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const parseCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/business/onboard/parse-csv", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Failed to parse CSV");
      return res.json();
    },
    onSuccess: (data: CsvPreview) => setCsvPreview(data),
    onError: (err: Error) => toast({ title: "CSV Error", description: err.message, variant: "destructive" }),
  });

  const propertyCount = importMode === "csv" && csvPreview ? csvPreview.validRows
    : importMode === "manual" ? properties.filter(p => p.address.trim()).length
    : 0;

  const totalUnits = importMode === "csv" && csvPreview
    ? csvPreview.rows.reduce((s, r) => s + (parseInt(r.units) || 1), 0)
    : properties.reduce((s, p) => s + (parseInt(p.units) || 1), 0);

  // ─── Cost calculation ────────────────────────────────────────────
  const calcMonthlyCost = useCallback(() => {
    if (!info.segment || !selectedPlan) return null;
    const seg = info.segment as Segment;
    const plan = PLANS[seg].find(p => p.tier === selectedPlan);
    if (!plan) return null;
    const units = parseInt(info.unitCount) || totalUnits || 0;
    if (seg === "construction") {
      return { amount: parseInt(plan.price.replace(/[^0-9]/g, "")) || 0, label: plan.price + plan.priceNote };
    }
    if (seg === "government") {
      const yearly = parseInt(plan.price.replace(/[^0-9]/g, "")) * 1000;
      return { amount: Math.round(yearly / 12), label: plan.price + plan.priceNote };
    }
    const perUnit = parseInt(plan.price.replace(/[^0-9]/g, "")) || 0;
    return { amount: perUnit * units, label: `$${(perUnit * units).toLocaleString()}${plan.priceNote.replace(/\/.*\//, "/")}` };
  }, [info.segment, selectedPlan, info.unitCount, totalUnits]);

  // ─── Navigation ──────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 0) return info.segment && info.companyName && info.email && info.contactName && info.contactEmail;
    if (step === 1) return !!selectedPlan;
    if (step === 2) return serviceConfig.enabledServices.length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return agreedToTerms;
    return true;
  };

  const handleNext = () => {
    if (step === 5) {
      // Submit
      onboardMutation.mutate({
        businessInfo: info,
        plan: selectedPlan,
        serviceConfig,
        properties: importMode === "manual" ? properties.filter(p => p.address.trim()) : [],
        csvData: importMode === "csv" && csvPreview ? csvPreview.rows : [],
        integrations: importMode === "integration" ? integrationKeys : {},
        importMode,
        teamMembers: teamMembers.filter(m => m.email.trim()),
      });
    } else {
      setStep(s => Math.min(s + 1, 6));
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const updateInfo = (field: keyof BusinessInfo, value: string) => setInfo(prev => ({ ...prev, [field]: value }));

  const toggleService = (key: string) => {
    setServiceConfig(prev => ({
      ...prev,
      enabledServices: prev.enabledServices.includes(key)
        ? prev.enabledServices.filter(s => s !== key)
        : [...prev.enabledServices, key],
    }));
  };

  const updateProperty = (id: string, field: keyof PropertyEntry, value: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // ─── Render helpers ──────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">What type of business are you?</h2>
        <p className="text-muted-foreground">Select your business segment to get started.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SEGMENTS.map(seg => (
          <Card
            key={seg.key}
            className={`cursor-pointer transition-all hover:shadow-md ${info.segment === seg.key ? "ring-2 ring-orange-500 border-orange-500" : "hover:border-orange-300"}`}
            onClick={() => updateInfo("segment", seg.key)}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg ${info.segment === seg.key ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"}`}>
                {seg.icon}
              </div>
              <div>
                <p className="font-semibold">{seg.label}</p>
                <p className="text-sm text-muted-foreground">{seg.description}</p>
              </div>
              {info.segment === seg.key && <Check className="h-5 w-5 text-orange-500 ml-auto" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {info.segment && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={info.companyName} onChange={e => updateInfo("companyName", e.target.value)} placeholder="Acme Property Management" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={info.address} onChange={e => updateInfo("address", e.target.value)} placeholder="123 Main St" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={info.city} onChange={e => updateInfo("city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={info.state} onChange={e => updateInfo("state", e.target.value)} maxLength={2} />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP</Label>
                  <Input id="zip" value={info.zip} onChange={e => updateInfo("zip", e.target.value)} maxLength={10} />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={info.phone} onChange={e => updateInfo("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={info.email} onChange={e => updateInfo("email", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={info.website} onChange={e => updateInfo("website", e.target.value)} placeholder="https://" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Name *</Label>
                <Input id="contactName" value={info.contactName} onChange={e => updateInfo("contactName", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactTitle">Title</Label>
                <Input id="contactTitle" value={info.contactTitle} onChange={e => updateInfo("contactTitle", e.target.value)} placeholder="Property Manager" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email *</Label>
                <Input id="contactEmail" type="email" value={info.contactEmail} onChange={e => updateInfo("contactEmail", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone</Label>
                <Input id="contactPhone" type="tel" value={info.contactPhone} onChange={e => updateInfo("contactPhone", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="taxId">Tax ID / EIN (optional)</Label>
              <Input id="taxId" value={info.taxId} onChange={e => updateInfo("taxId", e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
            <div>
              <Label htmlFor="unitCount">{UNIT_LABELS[info.segment as Segment] || "Units"}</Label>
              <Input id="unitCount" type="number" min="1" value={info.unitCount} onChange={e => updateInfo("unitCount", e.target.value)} placeholder="e.g. 50" />
            </div>
            <div>
              <Label htmlFor="referral">How did you hear about us?</Label>
              <Select value={info.referralSource} onValueChange={v => updateInfo("referralSource", v)}>
                <SelectTrigger id="referral"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Search</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="conference">Conference / Event</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => {
    const segment = info.segment as Segment;
    const plans = PLANS[segment] || [];
    const unitCount = parseInt(info.unitCount) || 0;
    const suggestIndependent = segment === "property_management" && unitCount > 0 && unitCount <= 10;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
          <p className="text-muted-foreground">
            {segment === "property_management" ? "Start free with up to 10 properties, or pick a paid plan for more." : "All plans include a 14-day free trial. Cancel anytime."}
          </p>
        </div>
        {suggestIndependent && selectedPlan !== "independent" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-sm">
            <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-amber-800">
              With {unitCount} {unitCount === 1 ? "property" : "properties"}, the <strong>Independent plan (Free)</strong> is a great fit!
            </span>
            <Button size="sm" variant="outline" className="ml-auto border-amber-400 text-amber-700" onClick={() => setSelectedPlan("independent")}>
              Select Free Plan
            </Button>
          </div>
        )}
        <div className={`grid grid-cols-1 gap-6 ${plans.length > 3 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {plans.map(plan => (
            <Card
              key={plan.tier}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${selectedPlan === plan.tier ? "ring-2 ring-orange-500 border-orange-500" : "hover:border-orange-300"} ${plan.popular ? "md:-mt-4 md:mb-4" : ""} ${plan.highlight ? "border-orange-300 bg-orange-50/50" : ""}`}
              onClick={() => setSelectedPlan(plan.tier)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500 text-white"><Star className="h-3 w-3 mr-1" />Most Popular</Badge>
                </div>
              )}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500 text-white">Free Forever</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceNote}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${selectedPlan === plan.tier ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  variant={selectedPlan === plan.tier ? "default" : "outline"}
                >
                  {selectedPlan === plan.tier ? "Selected" : plan.tier === "independent" ? "Get Started Free" : "Select Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">All plans include a transaction fee on completed work orders.</p>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configure Services</h2>
        <p className="text-muted-foreground">Choose which services to enable for your properties.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_SERVICES.map(svc => {
          const enabled = serviceConfig.enabledServices.includes(svc.key);
          return (
            <Card
              key={svc.key}
              className={`cursor-pointer transition-all ${enabled ? "ring-1 ring-orange-500 border-orange-500 bg-orange-50 dark:bg-orange-950/20" : "hover:border-orange-300"}`}
              onClick={() => toggleService(svc.key)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{svc.label}</p>
                  {enabled && <p className="text-xs text-muted-foreground mt-1">{svc.priceRange}</p>}
                </div>
                <Checkbox checked={enabled} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SLA Configuration</CardTitle>
          <CardDescription>Set response time expectations for your service requests.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Emergency Response Time</Label>
            <Select value={serviceConfig.emergencyResponseTime} onValueChange={v => setServiceConfig(p => ({ ...p, emergencyResponseTime: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1hr">1 Hour</SelectItem>
                <SelectItem value="2hr">2 Hours</SelectItem>
                <SelectItem value="4hr">4 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Standard Response Time</Label>
            <Select value={serviceConfig.standardResponseTime} onValueChange={v => setServiceConfig(p => ({ ...p, standardResponseTime: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24hr">24 Hours</SelectItem>
                <SelectItem value="48hr">48 Hours</SelectItem>
                <SelectItem value="72hr">72 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>After-Hours Policy</Label>
            <Select value={serviceConfig.afterHoursPolicy} onValueChange={v => setServiceConfig(p => ({ ...p, afterHoursPolicy: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency_only">Emergency Only</SelectItem>
                <SelectItem value="all_requests">All Requests</SelectItem>
                <SelectItem value="business_hours">Business Hours Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Auto-Approval Threshold ($)</Label>
            <Input
              type="number"
              min="0"
              value={serviceConfig.autoApprovalThreshold}
              onChange={e => setServiceConfig(p => ({ ...p, autoApprovalThreshold: e.target.value }))}
              placeholder="500"
            />
            <p className="text-xs text-muted-foreground mt-1">Jobs under this amount auto-approve</p>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              checked={serviceConfig.requirePhotos}
              onCheckedChange={v => setServiceConfig(p => ({ ...p, requirePhotos: v }))}
            />
            <Label>Require photos for all work orders</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Import Properties</h2>
        <p className="text-muted-foreground">Add your properties so we can start serving them right away.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["manual", "csv", "integration"] as const).map(mode => (
          <Button
            key={mode}
            variant={importMode === mode ? "default" : "outline"}
            className={importMode === mode ? "bg-orange-500 hover:bg-orange-600" : ""}
            onClick={() => setImportMode(mode)}
          >
            {mode === "manual" && "Manual Entry"}
            {mode === "csv" && "CSV Upload"}
            {mode === "integration" && "Connect Software"}
          </Button>
        ))}
      </div>

      {importMode === "manual" && (
        <div className="space-y-4">
          {properties.map((prop, idx) => (
            <Card key={prop.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Property {idx + 1}</p>
                  {properties.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setProperties(prev => prev.filter(p => p.id !== prop.id))}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-2">
                    <Label>Address</Label>
                    <Input value={prop.address} onChange={e => updateProperty(prop.id, "address", e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input value={prop.city} onChange={e => updateProperty(prop.id, "city", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>State</Label>
                      <Input value={prop.state} onChange={e => updateProperty(prop.id, "state", e.target.value)} maxLength={2} />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input value={prop.zip} onChange={e => updateProperty(prop.id, "zip", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Units</Label>
                    <Input type="number" min="1" value={prop.units} onChange={e => updateProperty(prop.id, "units", e.target.value)} />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={prop.type} onValueChange={v => updateProperty(prop.id, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="mixed">Mixed Use</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tenant Name</Label>
                    <Input value={prop.tenantName} onChange={e => updateProperty(prop.id, "tenantName", e.target.value)} />
                  </div>
                  <div>
                    <Label>Tenant Email</Label>
                    <Input type="email" value={prop.tenantEmail} onChange={e => updateProperty(prop.id, "tenantEmail", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={() => setProperties(prev => [...prev, emptyProperty()])}>
            <Plus className="h-4 w-4 mr-2" />Add Another Property
          </Button>
        </div>
      )}

      {importMode === "csv" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <a href="/api/business/onboard/csv-template" download>
                <Download className="h-4 w-4 mr-2" />Download CSV Template
              </a>
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />Upload CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) parseCsvMutation.mutate(file);
              }}
            />
          </div>
          {parseCsvMutation.isPending && <p className="text-sm text-muted-foreground">Parsing CSV...</p>}
          {csvPreview && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Badge className="bg-green-100 text-green-800">{csvPreview.validRows} valid</Badge>
                  {csvPreview.errors.length > 0 && <Badge variant="destructive">{csvPreview.errors.length} errors</Badge>}
                  <span className="text-sm text-muted-foreground">{csvPreview.totalRows} total rows</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {csvPreview.headers.map(h => <th key={h} className="text-left p-2 font-medium">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b">
                          {csvPreview.headers.map(h => <td key={h} className="p-2">{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.rows.length > 5 && <p className="text-sm text-muted-foreground mt-2">...and {csvPreview.rows.length - 5} more</p>}
                </div>
                {csvPreview.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded text-sm text-red-700">
                    {csvPreview.errors.slice(0, 3).map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {importMode === "integration" && (
        <div className="space-y-4">
          {INTEGRATIONS.map(integ => (
            <Card key={integ.key}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center font-bold text-orange-600 text-xs">
                  {integ.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{integ.name}</p>
                  <Input
                    className="mt-2"
                    placeholder="Enter your API key or webhook URL"
                    value={integrationKeys[integ.key] || ""}
                    onChange={e => setIntegrationKeys(prev => ({ ...prev, [integ.key]: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-sm text-muted-foreground">We'll sync your properties automatically once connected.</p>
        </div>
      )}

      {propertyCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
          <Check className="h-5 w-5 text-orange-500" />
          <span className="font-medium">{propertyCount} properties ready to import</span>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Invite Your Team</h2>
        <p className="text-muted-foreground">Add team members who will help manage your account.</p>
      </div>
      <div className="space-y-4">
        {teamMembers.map((member, idx) => (
          <Card key={member.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm">Team Member {idx + 1}</p>
                {teamMembers.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setTeamMembers(prev => prev.filter(m => m.id !== member.id))}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={member.name} onChange={e => updateTeamMember(member.id, "name", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={member.email} onChange={e => updateTeamMember(member.id, "email", e.target.value)} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={member.role} onValueChange={v => updateTeamMember(member.id, "role", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="coordinator">Coordinator</SelectItem>
                      <SelectItem value="viewer">View Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={() => setTeamMembers(prev => [...prev, emptyTeamMember()])}>
          <Plus className="h-4 w-4 mr-2" />Add Another
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">Team members will receive an email invitation to join your account.</p>
    </div>
  );

  const renderStep5 = () => {
    const cost = calcMonthlyCost();
    const segment = info.segment as Segment;
    const plan = PLANS[segment]?.find(p => p.tier === selectedPlan);
    const enabledSvcNames = ALL_SERVICES.filter(s => serviceConfig.enabledServices.includes(s.key)).map(s => s.label);
    const validTeam = teamMembers.filter(m => m.email.trim());
    const isIndependent = selectedPlan === "independent";

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Review & Activate</h2>
          <p className="text-muted-foreground">Review your configuration before activating your account.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Company</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{info.companyName}</p>
              <p className="text-muted-foreground">{SEGMENTS.find(s => s.key === segment)?.label}</p>
              <p className="text-muted-foreground">{info.contactName}. {info.contactEmail}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Plan</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              {isIndependent ? (
                <>
                  <p className="font-medium">Independent. Free</p>
                  <p className="text-muted-foreground">$0/month. Transaction fees only (7%)</p>
                  <p className="text-muted-foreground">Up to 10 properties</p>
                </>
              ) : (
                <>
                  <p className="font-medium">{plan?.name}. {plan?.price}{plan?.priceNote}</p>
                  {cost && <p className="text-muted-foreground">Est. monthly: ${cost.amount.toLocaleString()}</p>}
                  <p className="text-muted-foreground">{info.unitCount || totalUnits} {UNIT_LABELS[segment]?.toLowerCase() || "units"}</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Services ({enabledSvcNames.length})</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">{enabledSvcNames.join(", ") || "None selected"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Properties & Team</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-muted-foreground">{propertyCount} properties to import</p>
              <p className="text-muted-foreground">{validTeam.length} team invitations</p>
            </CardContent>
          </Card>
        </div>

        {isIndependent ? (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
              <p className="text-3xl font-bold text-green-600">$0</p>
              <p className="text-sm text-muted-foreground mt-1">7% transaction fee on booked services only</p>
            </CardContent>
          </Card>
        ) : cost ? (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Cost</p>
              <p className="text-3xl font-bold text-orange-600">${cost.amount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">+ 5–8% transaction fee on completed work orders</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} id="terms" />
          <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
            I agree to the <a href="/terms" className="text-orange-600 underline" target="_blank">Terms of Service</a> and{" "}
            <a href="/privacy" className="text-orange-600 underline" target="_blank">Privacy Policy</a>.
          </Label>
        </div>

        {isIndependent ? (
          <p className="text-sm text-center text-muted-foreground">No credit card required. Start managing your properties immediately.</p>
        ) : (
          <p className="text-sm text-center text-muted-foreground">14-day free trial. Cancel anytime.</p>
        )}
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="text-center py-12 space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100">
        <Sparkles className="h-10 w-10 text-orange-500" />
      </div>
      <h2 className="text-3xl font-bold">You're All Set! </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Your UpTend business account has been created. We're ready to start serving your properties.
      </p>
      {selectedPlan === "independent" && (
        <Card className="max-w-md mx-auto border-green-200 bg-green-50">
          <CardContent className="p-4 text-sm">
            <p className="font-medium"> You're on the Independent plan (Free)</p>
            <p className="text-muted-foreground">No monthly fees. you only pay a 7% fee when you book a pro. Upgrade anytime to unlock advanced features.</p>
          </CardContent>
        </Card>
      )}
      {selectedPlan === "enterprise" && (
        <Card className="max-w-md mx-auto border-orange-200">
          <CardContent className="p-4 text-sm">
            <p className="font-medium"> Enterprise Support</p>
            <p className="text-muted-foreground">Your dedicated account manager will reach out within 24 hours.</p>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => navigate("/business/dashboard")}>
          Go to Dashboard <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button variant="outline" onClick={() => navigate("/book")}>
          Submit First Work Order
        </Button>
        <Button variant="outline" onClick={() => navigate("/business/dashboard")}>
          Invite More Team Members
        </Button>
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-orange-500">UpTend</span> for Business
          </h1>
          <p className="text-muted-foreground mt-1">Set up your account in minutes</p>
        </div>

        {/* Progress */}
        {step < 6 && (
          <div className="mb-8">
            <Progress value={((step + 1) / 7) * 100} className="h-2 mb-4" />
            <div className="hidden md:flex justify-between">
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    i === step ? "text-orange-600" : i < step ? "text-orange-400" : "text-muted-foreground"
                  }`}
                  onClick={() => i < step && setStep(i)}
                  disabled={i >= step}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    i === step ? "bg-orange-500 text-white" : i < step ? "bg-orange-200 text-orange-700" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className="hidden lg:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        {step < 6 && (
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleNext}
              disabled={!canAdvance() || onboardMutation.isPending}
            >
              {onboardMutation.isPending ? "Creating Account..." : step === 5 ? (selectedPlan === "independent" ? "Create Free Account" : "Start Free Trial") : "Continue"}
              {step < 5 && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
