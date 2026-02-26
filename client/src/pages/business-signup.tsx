import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Logo } from "@/components/ui/logo";
import { SERVICE_PRICE_RANGES } from "@/constants/service-price-ranges";
import {
  ArrowLeft, ArrowRight, Building2, User, Shield,
  DollarSign, Users, CheckCircle, Loader2, Plus, X,
} from "lucide-react";

const STEPS = [
  "Company Info",
  "Owner Info",
  "Services",
  "Insurance",
  "Company Rates",
  "Add Employees",
  "Confirmation",
];

const SERVICE_OPTIONS = [
  { key: "junk_removal", label: "Junk Removal" },
  { key: "pressure_washing", label: "Pressure Washing" },
  { key: "gutter_cleaning", label: "Gutter Cleaning" },
  { key: "moving_labor", label: "Moving Labor" },
  { key: "light_demolition", label: "Light Demolition" },
  { key: "home_cleaning", label: "Home Cleaning" },
  { key: "carpet_cleaning", label: "Carpet Cleaning" },
  { key: "landscaping", label: "Landscaping" },
  { key: "pool_cleaning", label: "Pool Cleaning" },
  { key: "handyman", label: "Handyman Services" },
  { key: "garage_cleanout", label: "Garage Cleanout" },
  { key: "home_scan", label: "Home DNA Scan" },
];

interface EmployeeEntry {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceTypes: string[];
}

export default function BusinessSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  // Step 2: Owner
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 3: Services
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  // Step 4: Insurance
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceExpiration, setInsuranceExpiration] = useState("");

  // Step 5: Rates
  const [rates, setRates] = useState<Record<string, number>>({});

  // Step 6: Employees
  const [employees, setEmployees] = useState<EmployeeEntry[]>([
    { firstName: "", lastName: "", email: "", phone: "", serviceTypes: [] },
  ]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/business-partner/register", {
        companyName,
        ownerName,
        email,
        phone,
        password,
        yearsInBusiness: parseInt(yearsInBusiness) || 1,
        serviceArea,
        serviceTypes,
        insuranceProvider,
        insurancePolicyNumber,
        insuranceExpiration,
      });
      return res.json();
    },
    onSuccess: async (data) => {
      // Set rates
      const rateEntries = Object.entries(rates).map(([serviceType, baseRate]) => ({ serviceType, baseRate }));
      if (rateEntries.length > 0) {
        try {
          await apiRequest("POST", "/api/business-partner/rates", { rates: rateEntries });
        } catch {}
      }

      // Add employees
      for (const emp of employees) {
        if (emp.firstName && emp.email) {
          try {
            await apiRequest("POST", "/api/business-partner/employees", emp);
          } catch {}
        }
      }

      toast({ title: "Welcome to UpTend!", description: "Your business partner account has been created." });
      navigate("/login");
    },
    onError: (err: any) => {
      toast({ title: "Registration failed", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  const toggleService = (key: string) => {
    setServiceTypes(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const updateEmployee = (index: number, field: keyof EmployeeEntry, value: any) => {
    setEmployees(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const addEmployee = () => {
    setEmployees(prev => [...prev, { firstName: "", lastName: "", email: "", phone: "", serviceTypes: [] }]);
  };

  const removeEmployee = (index: number) => {
    setEmployees(prev => prev.filter((_, i) => i !== index));
  };

  const canNext = () => {
    switch (step) {
      case 0: return companyName.length >= 2;
      case 1: return ownerName.length >= 2 && email.includes("@") && password.length >= 8;
      case 2: return serviceTypes.length > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" className="w-8 h-8" textClassName="text-xl" />
          </Link>
          <span className="text-sm text-slate-400">Business Partner Signup</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        </div>

        {/* Hero (step 0 only) */}
        {step === 0 && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">Grow Your Business with UpTend</h1>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-sm text-slate-300">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">We bring you booked, AI-scoped jobs</div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">Your team keeps 85% of every job</div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">No lead fees. No bidding. Guaranteed payment.</div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">Employees can also work independently</div>
            </div>
          </div>
        )}

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            {/* Step 0: Company Info */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold text-white">Company Information</h2>
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company name" />
                </div>
                <div>
                  <Label>Years in Business</Label>
                  <Input type="number" value={yearsInBusiness} onChange={e => setYearsInBusiness(e.target.value)} placeholder="5" />
                </div>
                <div>
                  <Label>Service Area (ZIP or City)</Label>
                  <Input value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="Orlando, FL or 32832" />
                </div>
              </div>
            )}

            {/* Step 1: Owner Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold">Owner Information</h2>
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="John Smith" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(407) 555-0100" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
                </div>
              </div>
            )}

            {/* Step 2: Services */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold">Services You Offer</h2>
                </div>
                <p className="text-sm text-slate-400">Select all services your team can perform.</p>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_OPTIONS.filter(s => s.key !== "home_scan").map(svc => (
                    <label key={svc.key} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${serviceTypes.includes(svc.key) ? "bg-orange-500/10 border-orange-500" : "bg-slate-900/50 border-slate-700 hover:bg-slate-800"}`}>
                      <Checkbox checked={serviceTypes.includes(svc.key)} onCheckedChange={() => toggleService(svc.key)} />
                      <span className="text-sm">{svc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Insurance */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold">Insurance Verification</h2>
                </div>
                <p className="text-sm text-slate-400">Your insurance covers all employees. They are auto-verified when added.</p>
                <div>
                  <Label>Insurance Provider</Label>
                  <Input value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)} placeholder="State Farm, Allstate, etc." />
                </div>
                <div>
                  <Label>Policy Number</Label>
                  <Input value={insurancePolicyNumber} onChange={e => setInsurancePolicyNumber(e.target.value)} placeholder="POL-123456" />
                </div>
                <div>
                  <Label>Expiration Date</Label>
                  <Input type="date" value={insuranceExpiration} onChange={e => setInsuranceExpiration(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 4: Company Rates */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold">Set Company Rates</h2>
                </div>
                <p className="text-sm text-slate-400">Set rates for your selected services. Your team keeps 85%.</p>
                {serviceTypes.map(st => {
                  const range = SERVICE_PRICE_RANGES[st];
                  if (!range) return null;
                  const current = rates[st] || range.recommended;
                  return (
                    <div key={st} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{range.displayName}</span>
                        <span className="font-bold text-[#ea580c]">${current} <span className="text-xs text-slate-400 font-normal">{range.unit}</span></span>
                      </div>
                      <Slider
                        value={[current]}
                        min={range.floor}
                        max={range.ceiling}
                        step={1}
                        onValueChange={([v]) => setRates(prev => ({ ...prev, [st]: v }))}
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>${range.floor}</span>
                        <span>${range.ceiling}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 5: Add Employees */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[#ea580c]" />
                  <h2 className="text-lg font-bold">Add Your Team</h2>
                </div>
                <p className="text-sm text-slate-400">Add employees now or later from your dashboard. They will receive login credentials by email.</p>
                {employees.map((emp, i) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3 relative">
                    {employees.length > 1 && (
                      <button onClick={() => removeEmployee(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">First Name</Label>
                        <Input value={emp.firstName} onChange={e => updateEmployee(i, "firstName", e.target.value)} placeholder="First" />
                      </div>
                      <div>
                        <Label className="text-xs">Last Name</Label>
                        <Input value={emp.lastName} onChange={e => updateEmployee(i, "lastName", e.target.value)} placeholder="Last" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={emp.email} onChange={e => updateEmployee(i, "email", e.target.value)} placeholder="email@example.com" />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input type="tel" value={emp.phone} onChange={e => updateEmployee(i, "phone", e.target.value)} placeholder="(407) 555-0100" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addEmployee} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Another Employee
                </Button>
              </div>
            )}

            {/* Step 6: Confirmation */}
            {step === 6 && (
              <div className="space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                <h2 className="text-xl font-bold">Ready to Go</h2>
                <p className="text-slate-300">
                  Your account for <strong>{companyName}</strong> is ready to be created with{" "}
                  {employees.filter(e => e.firstName && e.email).length} employee(s).
                </p>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 text-sm text-left space-y-2">
                  <p>-- Your employees will receive login credentials by email</p>
                  <p>-- They are auto-verified under your company insurance</p>
                  <p>-- You can manage rates, employees, and view analytics from your dashboard</p>
                  <p>-- Employees can also work independently and keep those earnings</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
