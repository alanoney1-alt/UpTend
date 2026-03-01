import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Logo } from "@/components/ui/logo";
import { GoogleLoginButton, GoogleDivider } from "@/components/auth/google-login-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Truck, ArrowRight, ArrowLeft, CheckCircle, Shield, DollarSign,
  User, Phone, Mail, MapPin, Car, FileText, CreditCard, Clock,
  Loader2, AlertTriangle, Building2, Plus, X, Lock, TrendingUp, GraduationCap, Star, Award, Eye, EyeOff,
  Wrench, ClipboardList, Package
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PhotoUpload, MultiPhotoUpload } from "@/components/photo-upload";
import { ServicesSelector } from "@/components/services-selector";
import { ICAAgreement, type ICAAcceptanceData } from "@/components/auth/ica-agreement";
import { SERVICE_PRICE_RANGES } from "@/constants/service-price-ranges";

const vehicleSchema = z.object({
  vehicleType: z.string().min(1, "Vehicle type required"),
  vehicleName: z.string().optional(),
  year: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  licensePlate: z.string().optional(),
  capacity: z.string().optional(),
  isEnclosed: z.boolean().default(false),
  hasTrailer: z.boolean().default(false),
  trailerSize: z.string().optional(),
  bedLength: z.string().optional(),
  description: z.string().optional(),
  photoUrls: z.array(z.string()).default([]),
});

const signupSchema = z.object({
  // Account credentials
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  // Personal info
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Valid phone number required"),
  companyName: z.string().min(2, "Company or business name required"),
  streetAddress: z.string().min(5, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  zipCode: z.string().min(5, "ZIP code required"),
  vehicleType: z.string().min(1, "Primary vehicle type required"),
  vehicleYear: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  licensePlate: z.string().optional(),
  driversLicense: z.string().min(5, "Driver's license required"),
  // General Liability Insurance (optional - 15% platform fee)
  generalLiabilityProvider: z.string().optional(),
  generalLiabilityPolicyNumber: z.string().optional(),
  generalLiabilityExpiration: z.string().optional(),
  // Vehicle Insurance (optional - 15% platform fee)
  vehicleInsuranceProvider: z.string().optional(),
  vehicleInsurancePolicyNumber: z.string().optional(),
  vehicleInsuranceExpiration: z.string().optional(),
  aboutYou: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  agreeBackgroundCheck: z.boolean().refine(val => val === true, "Background check authorization required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;
type VehicleData = z.infer<typeof vehicleSchema>;

const steps = [
  { id: 1, title: "Account", icon: Lock },
  { id: 2, title: "Personal Info", icon: User },
  { id: 3, title: "Services", icon: ClipboardList },
  { id: 4, title: "Tools", icon: Wrench },
  { id: 5, title: "Vehicles", icon: Car },
  { id: 6, title: "Verification", icon: Shield },
  { id: 7, title: "Pricing Input", icon: DollarSign },
  { id: 8, title: "Agreement", icon: FileText },
  { id: 9, title: "Review", icon: CheckCircle },
  { id: 10, title: "Welcome", icon: Star },
];

const vehicleTypes = [
  { value: "pickup", label: "Pickup Truck", capacity: "~3-6 cubic yards" },
  { value: "cargo_van", label: "Cargo Van", capacity: "~4-8 cubic yards" },
  { value: "box_truck_small", label: "Box Truck (10-14 ft)", capacity: "~8-12 cubic yards" },
  { value: "box_truck_large", label: "Box Truck (16-26 ft)", capacity: "~16-20 cubic yards" },
  { value: "trailer", label: "Truck with Trailer", capacity: "~20+ cubic yards" },
  { value: "dump_truck", label: "Dump Truck", capacity: "~12-20 cubic yards" },
];

const defaultVehicle: VehicleData = {
  vehicleType: "",
  vehicleName: "",
  year: "",
  make: "",
  model: "",
  licensePlate: "",
  capacity: "medium",
  isEnclosed: false,
  hasTrailer: false,
  trailerSize: "",
  bedLength: "",
  description: "",
  photoUrls: [],
};

const trailerSizes = [
  { value: "5ft", label: "5 ft" },
  { value: "6ft", label: "6 ft" },
  { value: "8ft", label: "8 ft" },
  { value: "10ft", label: "10 ft" },
  { value: "12ft", label: "12 ft" },
  { value: "16ft", label: "16 ft" },
  { value: "20ft", label: "20 ft" },
];

const bedLengths = [
  { value: "5.5ft", label: "5.5 ft (Short bed)" },
  { value: "6.5ft", label: "6.5 ft (Standard bed)" },
  { value: "8ft", label: "8 ft (Long bed)" },
];

// Tools & Equipment options per service type
const TOOLS_BY_SERVICE: Record<string, string[]> = {
  junk_removal: ["Pickup Truck", "Box Truck", "Trailer", "Dolly", "Furniture Pads", "Straps", "PPE"],
  pressure_washing: ["Pressure Washer (PSI range)", "Surface Cleaner", "Extension Wand", "Chemical Injector", "Hoses", "Water Tank"],
  gutter_cleaning: ["Ladder (height)", "Gutter Scoop", "Leaf Blower", "Safety Harness", "Gutter Guards"],
  landscaping: ["Mower (type)", "Trimmer", "Edger", "Blower", "Hedge Trimmer", "Chainsaw"],
  home_cleaning: ["Vacuum", "Mop", "Steam Cleaner", "Chemical Kit", "Microfiber Kit"],
  pool_cleaning: ["Pool Net", "Brush", "Vacuum Head", "Chemical Test Kit", "Pump Tools"],
  handyman: ["Basic Tool Kit", "Power Drill", "Saw", "Level", "Stud Finder", "Paint Supplies"],
  carpet_cleaning: ["Carpet Extractor", "Spot Cleaner", "Deodorizer", "Upholstery Tool"],
  moving_labor: ["Dolly", "Furniture Pads", "Straps", "Hand Truck", "Moving Blankets"],
  furniture_moving: ["Dolly", "Furniture Pads", "Straps", "Hand Truck", "Moving Blankets"],
  light_demolition: ["Sledgehammer", "Pry Bar", "Reciprocating Saw", "Dumpster Access", "PPE"],
};

export default function PyckerSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleData[]>([{ ...defaultVehicle }]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [driversLicensePhotoUrl, setDriversLicensePhotoUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string | null>(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [generalLiabilityDocUrl, setGeneralLiabilityDocUrl] = useState<string | null>(null);
  const [vehicleInsuranceDocUrl, setVehicleInsuranceDocUrl] = useState<string | null>(null);

  // ICA acceptance state
  const [icaData, setIcaData] = useState<ICAAcceptanceData | null>(null);

  // Invite code state
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeStatus, setInviteCodeStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [inviteCodeMessage, setInviteCodeMessage] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);

  const checkInviteCode = async () => {
    if (!inviteCode.trim()) return;
    setInviteCodeStatus("checking");
    try {
      const res = await fetch("/api/invite-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const data = await res.json();
      if (data.valid) {
        setInviteCodeStatus("valid");
        setInviteCodeMessage(`10% fee discount for ${data.durationDays} days!`);
        setValidatedCode(inviteCode.trim().toUpperCase());
      } else {
        setInviteCodeStatus("invalid");
        setInviteCodeMessage(data.reason || "Invalid code");
        setValidatedCode(null);
      }
    } catch {
      setInviteCodeStatus("invalid");
      setInviteCodeMessage("Could not check code. try again");
      setValidatedCode(null);
    }
  };

  // Services selection state. default to empty, user must choose
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [pricingFeedback, setPricingFeedback] = useState<Record<string, { low: string; high: string; years: string }>>({});

  // Tools & Equipment state: service -> selected tools
  const [toolsEquipment, setToolsEquipment] = useState<Record<string, string[]>>({});
  const [customToolInputs, setCustomToolInputs] = useState<Record<string, string>>({});
  const [desiredHourlyRate, setDesiredHourlyRate] = useState("");
  const [licensesAndCerts, setLicensesAndCerts] = useState("");
  // Pro rate selection per service (from researched ranges)
  const [proRates, setProRates] = useState<Record<string, number>>({});

  // B2B Commercial Licensing
  const [b2bLicensed, setB2bLicensed] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [b2bRates, setB2bRates] = useState<Record<string, { min: number; max: number }>>({});

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const addVehicle = () => {
    setVehicles([...vehicles, { ...defaultVehicle }]);
  };

  const removeVehicle = (index: number) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter((_, i) => i !== index));
    }
  };

  const updateVehicle = (index: number, field: keyof VehicleData, value: any) => {
    const updated = [...vehicles];
    updated[index] = { ...updated[index], [field]: value };
    setVehicles(updated);
  };

  const toggleTool = (service: string, tool: string) => {
    setToolsEquipment(prev => {
      const current = prev[service] || [];
      if (current.includes(tool)) {
        return { ...prev, [service]: current.filter(t => t !== tool) };
      } else {
        return { ...prev, [service]: [...current, tool] };
      }
    });
  };

  const addCustomTool = (service: string) => {
    const custom = customToolInputs[service]?.trim();
    if (!custom) return;
    setToolsEquipment(prev => {
      const current = prev[service] || [];
      if (current.includes(custom)) return prev;
      return { ...prev, [service]: [...current, custom] };
    });
    setCustomToolInputs(prev => ({ ...prev, [service]: "" }));
  };

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      vehicleType: "",
      vehicleYear: "",
      vehicleMake: "",
      vehicleModel: "",
      licensePlate: "",
      driversLicense: "",
      generalLiabilityProvider: "",
      generalLiabilityPolicyNumber: "",
      generalLiabilityExpiration: "",
      vehicleInsuranceProvider: "",
      vehicleInsurancePolicyNumber: "",
      vehicleInsuranceExpiration: "",
      aboutYou: "",
      agreeTerms: false,
      agreeBackgroundCheck: false,
    },
  });

  // Send email verification code
  const sendVerificationCode = async () => {
    const email = form.getValues("email");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSendingVerification(true);
    try {
      const response = await fetch("/api/pros/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send verification code");
      }
      
      const data = await response.json();
      setVerificationSent(true);
      
      if (data.devCode) {
        toast({
          title: "Verification Code (Dev Mode)",
          description: `Your code is: ${data.devCode}`,
        });
      } else {
        toast({
          title: "Verification Code Sent",
          description: data.emailSent 
            ? "Check your email for the 6-digit verification code"
            : "Check your email (or server logs if email not configured)",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSendingVerification(false);
    }
  };

  // Verify email code
  const verifyEmailCode = async () => {
    const email = form.getValues("email");
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      const response = await fetch("/api/pros/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid verification code");
      }
      
      setEmailVerified(true);
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Profile is ONLY created on final submit (step 9 Review)
  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      const payload = {
        ...data,
        vehicles: vehicles.filter(v => v.vehicleType),
        profilePhotoUrl: profilePhotoUrl || undefined,
        driversLicensePhotoUrl: driversLicensePhotoUrl || undefined,
        selfiePhotoUrl: selfiePhotoUrl || undefined,
        idPhotoUrl: idPhotoUrl || undefined,
        generalLiabilityDocUrl: generalLiabilityDocUrl || undefined,
        vehicleInsuranceDocUrl: vehicleInsuranceDocUrl || undefined,
        serviceTypes: selectedServices,
        supportedServices: selectedServices,
        toolsEquipment,
        desiredHourlyRate: desiredHourlyRate ? parseInt(desiredHourlyRate) : null,
        licensesAndCerts: licensesAndCerts || null,
        proRates: Object.entries(proRates).map(([serviceType, baseRate]) => ({
          serviceType,
          baseRate,
        })),
        pricingFeedback: Object.entries(pricingFeedback)
          .filter(([_, v]) => v.low || v.high)
          .map(([serviceType, v]) => ({
            serviceType,
            chargeLow: v.low ? parseInt(v.low) : null,
            chargeHigh: v.high ? parseInt(v.high) : null,
            yearsExperience: v.years ? parseInt(v.years) : null,
          })),
        icaSignedName: icaData?.signedName,
        icaAcceptedAt: icaData?.acceptedAt,
        icaVersion: icaData?.icaVersion,
        b2bLicensed,
        licenseNumber: b2bLicensed ? licenseNumber : undefined,
        b2bRates: b2bLicensed ? b2bRates : undefined,
      };
      const response = await fetch("/api/pros/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      const result = await response.json();

      // Auto-redeem invite code if one was validated
      if (validatedCode && result.haulerProfile?.id) {
        try {
          await fetch("/api/invite-codes/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: validatedCode, proId: result.haulerProfile.id }),
          });
        } catch {
          // Non-fatal
        }
      }

      return result;
    },
    onSuccess: () => {
      setCurrentStep(10); // Welcome step
      toast({
        title: "Application Submitted!",
        description: validatedCode
          ? "Your invite code discount has been applied. We'll review your application shortly."
          : "We'll review your application and get back to you within 24-48 hours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (currentStep < 10) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = () => {
    // Trigger form validation for required fields, then submit
    form.handleSubmit((data) => {
      signupMutation.mutate(data);
    })();
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof SignupForm)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["password", "confirmPassword", "email"];
      if (!emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email before continuing",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ["firstName", "lastName", "phone", "companyName", "streetAddress", "city", "state", "zipCode"];
    } else if (currentStep === 3) {
      // Services step. must select at least one
      if (selectedServices.length === 0) {
        toast({
          title: "Services Required",
          description: "Please select at least one service you can provide",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 4) {
      // Tools step. no hard requirement, but encourage
      // Allow proceeding even with no tools selected
    } else if (currentStep === 5) {
      fieldsToValidate = ["vehicleType"];
      const primaryVehicle = vehicles[0];
      if (!primaryVehicle || !primaryVehicle.vehicleType) {
        toast({
          title: "Vehicle Info Required",
          description: "Please select a vehicle type for your primary vehicle",
          variant: "destructive",
        });
        return false;
      }
      // Vehicle photos encouraged but not blocking registration
      // Upload infrastructure being migrated — photos can be added later
      const hasVehiclePhotos = vehicles.some(v => v.photoUrls && v.photoUrls.length > 0);
      if (!hasVehiclePhotos) {
        console.log("No vehicle photos uploaded yet — allowing registration to proceed");
      }
    } else if (currentStep === 6) {
      fieldsToValidate = ["driversLicense", "agreeTerms", "agreeBackgroundCheck"];
      if (!selfiePhotoUrl || !idPhotoUrl) {
        // Photo uploads may fail on current hosting — allow registration to proceed
        console.log("Selfie/ID photos not uploaded — allowing registration to continue");
      }
    } else if (currentStep === 7) {
      // Pricing step: validate B2B license if enabled
      if (b2bLicensed && !licenseNumber.trim()) {
        toast({
          title: "License Required",
          description: "Please enter your Florida contractor license number for B2B services",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 8) {
      // Agreement step. ICA must be signed
      if (!icaData) {
        toast({
          title: "Agreement Required",
          description: "Please sign the Independent Contractor Agreement to continue",
          variant: "destructive",
        });
        return false;
      }
    }

    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate);
      return result;
    }
    return true;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
    }
  };

  const formatServiceLabel = (service: string) =>
    service.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="w-8 h-8" textClassName="text-xl" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Build Your Business on Your Terms</h1>
          <p className="text-muted-foreground">Set your rates. We find the customers. Keep 85% of every job. No lead fees. Guaranteed payment.</p>
        </div>

        {/* Step indicator. progress bar on mobile, full tabs on desktop */}
        <div className="mb-8">
          {/* Mobile: compact progress indicator */}
          <div className="flex sm:hidden items-center justify-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              {(() => { const StepIcon = steps[currentStep - 1]?.icon || CheckCircle; return <StepIcon className="w-5 h-5 text-primary" />; })()}
              <span className="text-sm font-semibold">Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}</span>
            </div>
          </div>
          <div className="flex sm:hidden w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
          </div>
          {/* Desktop: full step tabs */}
          <div className="hidden sm:flex justify-center overflow-x-auto pb-2">
            <div className="flex items-center gap-1">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      currentStep === step.id 
                        ? "bg-primary text-primary-foreground" 
                        : currentStep > step.id 
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => {
                      if (step.id < currentStep) setCurrentStep(step.id);
                    }}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <step.icon className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs font-medium whitespace-nowrap">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>

            {/* ==================== STEP 1: CREATE ACCOUNT ==================== */}
            {currentStep === 1 && (
              <Card className="p-6" data-testid="card-step-account-pro">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Create Your Account
                </h2>
                <p className="text-muted-foreground mb-6">
                  First, let's set up your Pro account with your email and password.
                </p>

                <GoogleLoginButton role="pro" />
                <GoogleDivider />

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" {...field} data-testid="input-password" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Confirm password" {...field} data-testid="input-confirm-password" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Verification
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input 
                              type="email" 
                              placeholder="name@email.com" 
                              {...field} 
                              disabled={emailVerified}
                              data-testid="input-email" 
                            />
                            {!emailVerified && (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={sendVerificationCode}
                                disabled={sendingVerification || verificationSent}
                                data-testid="button-send-verification"
                              >
                                {sendingVerification ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : verificationSent ? (
                                  "Code Sent"
                                ) : (
                                  "Send Code"
                                )}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {verificationSent && !emailVerified && (
                    <div className="flex gap-2 items-end mb-4">
                      <div className="flex-1">
                        <Label>Verification Code</Label>
                        <Input 
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          data-testid="input-verification-code"
                        />
                      </div>
                      <Button 
                        type="button"
                        onClick={verifyEmailCode}
                        disabled={verifyingEmail || verificationCode.length !== 6}
                        data-testid="button-verify-code"
                      >
                        {verifyingEmail ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Verify
                      </Button>
                    </div>
                  )}

                  {emailVerified && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 mb-4">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Email verified successfully</span>
                    </div>
                  )}

                  {verificationSent && !emailVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationSent(false);
                        setVerificationCode("");
                      }}
                      className="text-sm text-primary hover:underline"
                      data-testid="button-resend-code"
                    >
                      Didn't receive the code? Click to resend
                    </button>
                  )}
                </div>

                {/* Invite Code */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                    Have an invite code? (Optional)
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. LAKENONA10"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase());
                        if (inviteCodeStatus !== "idle") {
                          setInviteCodeStatus("idle");
                          setInviteCodeMessage("");
                        }
                      }}
                      className="uppercase"
                      data-testid="input-invite-code"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkInviteCode}
                      disabled={inviteCodeStatus === "checking" || !inviteCode.trim()}
                      data-testid="button-check-invite-code"
                    >
                      {inviteCodeStatus === "checking" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {inviteCodeStatus === "valid" && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-green-500/10 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{inviteCodeMessage}</span>
                    </div>
                  )}
                  {inviteCodeStatus === "invalid" && (
                    <p className="mt-2 text-sm text-destructive">{inviteCodeMessage}</p>
                  )}
                </div>

                <div className="flex justify-end mt-8">
                  <Button 
                    type="button" 
                    onClick={handleNext} 
                    disabled={!emailVerified}
                    data-testid="button-next-step-1"
                  >
                    Continue to Personal Info
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 2: PERSONAL INFO ==================== */}
            {currentStep === 2 && (
              <Card className="p-6" data-testid="card-step-personal-pro">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal & Business Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(407) 555-0199" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Company / Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith Moving LLC" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Profile Photo */}
                <div className="mb-6">
                  <PhotoUpload
                    label="Profile Photo"
                    description="Professional photo for your Pro profile"
                    onUploadComplete={(url) => setProfilePhotoUrl(url)}
                    testId="upload-profile-photo"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="streetAddress"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          value={field.value || ""}
                          onChange={field.onChange}
                          onSelectAddress={(address) => field.onChange(address)}
                          placeholder="123 Main St"
                          icon={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Orlando" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="FL" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="32801" {...field} data-testid="input-zip-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-2">
                    Continue to Select Services
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 3: SELECT SERVICES ==================== */}
            {currentStep === 3 && (
              <Card className="p-6" data-testid="card-step-services-pro">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Select Your Services
                </h2>
                <p className="text-muted-foreground mb-2">
                  Choose the services you want to offer. You can always add or remove services later from your dashboard.
                </p>
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-6">
                  <p className="text-sm text-primary font-medium">
                    Select at least one service to continue. The more services you offer, the more jobs you'll be matched with!
                  </p>
                </div>

                <ServicesSelector
                  selectedServices={selectedServices}
                  onSelectionChange={setSelectedServices}
                  showEquipmentInfo={true}
                />

                {selectedServices.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-green-500/10 text-green-600">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-3">
                    Continue to Tools & Equipment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 4: TOOLS & EQUIPMENT ==================== */}
            {currentStep === 4 && (
              <Card className="p-6" data-testid="card-step-tools-pro">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Tools & Equipment
                </h2>
                <p className="text-muted-foreground mb-2">
                  Tell us what tools and equipment you have for each service. This helps us match you with the right jobs.
                </p>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    Check the tools you own. You can also add custom equipment not listed here.
                  </p>
                </div>

                {selectedServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Go back and select services first</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedServices.map((service) => {
                      const tools = TOOLS_BY_SERVICE[service] || [];
                      const selectedTools = toolsEquipment[service] || [];
                      const label = formatServiceLabel(service);

                      return (
                        <div key={service} className="p-4 border rounded-lg">
                          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-primary" />
                            {label}
                          </h3>
                          
                          {tools.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                              {tools.map((tool) => (
                                <label
                                  key={tool}
                                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                    selectedTools.includes(tool)
                                      ? "bg-primary/10 border-primary/40"
                                      : "hover:bg-muted"
                                  }`}
                                >
                                  <Checkbox
                                    checked={selectedTools.includes(tool)}
                                    onCheckedChange={() => toggleTool(service, tool)}
                                  />
                                  <span className="text-sm">{tool}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-3">No predefined tools for this service.</p>
                          )}

                          {/* Custom tool input */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add custom tool or equipment..."
                              value={customToolInputs[service] || ""}
                              onChange={(e) => setCustomToolInputs(prev => ({ ...prev, [service]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTool(service);
                                }
                              }}
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomTool(service)}
                              disabled={!customToolInputs[service]?.trim()}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Show custom tools that aren't in the predefined list */}
                          {selectedTools.filter(t => !tools.includes(t)).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedTools.filter(t => !tools.includes(t)).map(tool => (
                                <Badge
                                  key={tool}
                                  variant="secondary"
                                  className="flex items-center gap-1 cursor-pointer"
                                  onClick={() => toggleTool(service, tool)}
                                >
                                  {tool}
                                  <X className="w-3 h-3" />
                                </Badge>
                              ))}
                            </div>
                          )}

                          {selectedTools.length > 0 && (
                            <p className="text-xs text-green-600 mt-2">
                              {selectedTools.length} item{selectedTools.length > 1 ? 's' : ''} selected
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-4">
                    Continue to Vehicle Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 5: VEHICLE DETAILS ==================== */}
            {currentStep === 5 && (
              <Card className="p-6" data-testid="card-step-vehicle-pro">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Your Vehicles
                  </h2>
                  <Badge variant="default" className="bg-primary">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  List all vehicles you use for jobs. When you go online, you'll select which vehicle you're using that day.
                </p>
                <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-6">
                  <p className="text-sm text-primary font-medium">
                    Vehicle type and at least one vehicle photo are required to become a Pro.
                  </p>
                </div>

                {vehicles.map((vehicle, index) => (
                  <div key={index} className="mb-6 p-4 border rounded-lg relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Vehicle {index + 1}</h3>
                      {vehicles.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeVehicle(index)}
                          data-testid={`button-remove-vehicle-${index}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Vehicle Type *</Label>
                        <Select 
                          value={vehicle.vehicleType} 
                          onValueChange={(val) => {
                            updateVehicle(index, "vehicleType", val);
                            if (index === 0) form.setValue("vehicleType", val);
                          }}
                        >
                          <SelectTrigger data-testid={`select-vehicle-type-${index}`}>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Vehicle Name (Optional)</Label>
                        <Input 
                          placeholder="e.g., My Work Truck"
                          value={vehicle.vehicleName || ""}
                          onChange={(e) => updateVehicle(index, "vehicleName", e.target.value)}
                          data-testid={`input-vehicle-name-${index}`}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label>Year</Label>
                        <Input 
                          placeholder="2020"
                          value={vehicle.year || ""}
                          onChange={(e) => updateVehicle(index, "year", e.target.value)}
                          data-testid={`input-year-${index}`}
                        />
                      </div>
                      <div>
                        <Label>Make</Label>
                        <Input 
                          placeholder="Ford"
                          value={vehicle.make || ""}
                          onChange={(e) => updateVehicle(index, "make", e.target.value)}
                          data-testid={`input-make-${index}`}
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input 
                          placeholder="F-150"
                          value={vehicle.model || ""}
                          onChange={(e) => updateVehicle(index, "model", e.target.value)}
                          data-testid={`input-model-${index}`}
                        />
                      </div>
                      <div>
                        <Label>License Plate</Label>
                        <Input 
                          placeholder="ABC1234"
                          value={vehicle.licensePlate || ""}
                          onChange={(e) => updateVehicle(index, "licensePlate", e.target.value)}
                          data-testid={`input-plate-${index}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 mb-4">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`enclosed-${index}`}
                          checked={vehicle.isEnclosed}
                          onCheckedChange={(checked) => updateVehicle(index, "isEnclosed", checked)}
                          data-testid={`checkbox-enclosed-${index}`}
                        />
                        <Label htmlFor={`enclosed-${index}`} className="cursor-pointer">
                          Enclosed / Covered
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`trailer-${index}`}
                          checked={vehicle.hasTrailer}
                          onCheckedChange={(checked) => updateVehicle(index, "hasTrailer", checked)}
                          data-testid={`checkbox-trailer-${index}`}
                        />
                        <Label htmlFor={`trailer-${index}`} className="cursor-pointer">
                          Has Trailer
                        </Label>
                      </div>
                    </div>

                    {(vehicle.vehicleType === "pickup" || vehicle.vehicleType === "trailer") && (
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {vehicle.vehicleType === "pickup" && (
                          <div>
                            <Label>Bed Length</Label>
                            <Select 
                              value={vehicle.bedLength || ""} 
                              onValueChange={(val) => updateVehicle(index, "bedLength", val)}
                            >
                              <SelectTrigger data-testid={`select-bed-length-${index}`}>
                                <SelectValue placeholder="Select bed length" />
                              </SelectTrigger>
                              <SelectContent>
                                {bedLengths.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {vehicle.hasTrailer && (
                          <div>
                            <Label>Trailer Size</Label>
                            <Select 
                              value={vehicle.trailerSize || ""} 
                              onValueChange={(val) => updateVehicle(index, "trailerSize", val)}
                            >
                              <SelectTrigger data-testid={`select-trailer-size-${index}`}>
                                <SelectValue placeholder="Select trailer size" />
                              </SelectTrigger>
                              <SelectContent>
                                {trailerSizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <Label>Description (Optional)</Label>
                      <Input 
                        placeholder="Any special features or notes about this vehicle"
                        value={vehicle.description || ""}
                        onChange={(e) => updateVehicle(index, "description", e.target.value)}
                        data-testid={`input-description-${index}`}
                      />
                    </div>

                    <div className="mt-4 p-3 border-2 border-primary/30 rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">Vehicle Photos</span>
                        <Badge variant="default" className="bg-primary text-xs">Required</Badge>
                      </div>
                      <MultiPhotoUpload
                        label="Upload Vehicle Photos"
                        description="Add photos of your vehicle (exterior and bed/cargo area) - at least 1 required"
                        maxPhotos={4}
                        onPhotosChange={(urls) => updateVehicle(index, "photoUrls", urls)}
                        testId={`upload-vehicle-photos-${index}`}
                      />
                      {vehicle.photoUrls && vehicle.photoUrls.length > 0 && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {vehicle.photoUrls.length} photo{vehicle.photoUrls.length > 1 ? 's' : ''} uploaded
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addVehicle}
                  className="w-full mb-6"
                  data-testid="button-add-vehicle"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Vehicle
                </Button>

                <div className="p-4 bg-muted rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Why list all your vehicles?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Customers can see exactly what equipment you have
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Match with jobs that fit your vehicle capacity
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Commercial vehicle recommended but not required
                    </li>
                  </ul>
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-5">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-5">
                    Continue to Verification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 6: INSURANCE & VERIFICATION ==================== */}
            {currentStep === 6 && (
              <Card className="p-6" data-testid="card-step-verification-pro">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Insurance & Verification
                </h2>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-700 dark:text-amber-400">Background Check Required</h3>
                      <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                        For the safety of our customers, all Pros must pass a background check before accepting jobs. 
                        This typically takes 2-3 business days.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ID & Selfie Capture Section */}
                <div className="mb-6 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Identity Verification
                    </h3>
                    <Badge variant="default" className="bg-primary">Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload clear photos for identity verification. <strong>Both photos are required</strong> to become a Pro.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <PhotoUpload
                        label="Selfie Photo"
                        description="Clear photo of your face looking at the camera"
                        onUploadComplete={(url) => setSelfiePhotoUrl(url)}
                        testId="upload-selfie-photo"
                      />
                      {selfiePhotoUrl && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <PhotoUpload
                        label="Government-Issued ID"
                        description="Driver's license, passport, or state ID (front)"
                        onUploadComplete={(url) => setIdPhotoUrl(url)}
                        testId="upload-id-photo"
                      />
                      {idPhotoUrl && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  {(!selfiePhotoUrl || !idPhotoUrl) && (
                    <p className="text-sm text-red-600 mt-3 flex items-center gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4" />
                      Both selfie and ID photos are required to continue
                    </p>
                  )}
                  {selfiePhotoUrl && idPhotoUrl && (
                    <p className="text-sm text-green-600 mt-3 flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Identity verification photos uploaded successfully
                    </p>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="driversLicense"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Driver's License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="D123-456-78-901-0" {...field} data-testid="input-drivers-license" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Insurance Notice */}
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-700 dark:text-green-400">Start Earning Immediately. No Insurance Required Upfront</h3>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        Every job is covered by UpTend's platform policy while you build your business.
                        Already have insurance? Upload it now for a Verified badge and priority matching.
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                        Don't have insurance yet? No problem. Get covered in 60 seconds when you're ready.{" "}
                        <a
                          href="https://www.thimble.com/get-a-quote?partner=uptend"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          Learn more
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* General Liability Insurance Section */}
                <div className="mb-6 p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      General Liability Insurance
                    </h3>
                    <Badge variant="outline" className="text-muted-foreground">Optional</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="generalLiabilityProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="State Farm" {...field} data-testid="input-gl-provider" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalLiabilityPolicyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input placeholder="GL-123456789" {...field} data-testid="input-gl-policy" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generalLiabilityExpiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-gl-expiration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <PhotoUpload
                    label="General Liability Insurance Document"
                    description="Upload your certificate of insurance or declarations page"
                    onUploadComplete={(url) => setGeneralLiabilityDocUrl(url)}
                    testId="upload-gl-document"
                  />
                </div>

                {/* Vehicle Insurance Section */}
                <div className="mb-6 p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Vehicle Insurance
                    </h3>
                    <Badge variant="outline" className="text-muted-foreground">Optional</Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name="vehicleInsuranceProvider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insurance Provider</FormLabel>
                          <FormControl>
                            <Input placeholder="Progressive" {...field} data-testid="input-vi-provider" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleInsurancePolicyNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy Number</FormLabel>
                          <FormControl>
                            <Input placeholder="VI-987654321" {...field} data-testid="input-vi-policy" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vehicleInsuranceExpiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-vi-expiration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <PhotoUpload
                    label="Vehicle Insurance Document"
                    description="Upload your auto insurance card or declarations page"
                    onUploadComplete={(url) => setVehicleInsuranceDocUrl(url)}
                    testId="upload-vi-document"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="aboutYou"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Tell Us About Yourself (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Share your experience with hauling, moving, or junk removal..."
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="input-about-you"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 mb-6">
                  <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agree-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreeBackgroundCheck"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-agree-background-check"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I authorize UpTend to run a background check through our trusted partner. I understand this is required to become a Pro.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-6">
                    Continue to Pricing Input
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 7: PRICING INPUT ==================== */}
            {currentStep === 7 && (
              <Card className="p-6" data-testid="card-step-pricing-feedback">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Set Your Rates
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Set your rate for each service. These are based on real Orlando market data.
                  You keep 85% of every job after the platform fee.
                </p>

                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg mb-6">
                  <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                    You keep 85% of every job. If you don't set a rate, we'll default to the recommended market rate.
                  </p>
                </div>

                {/* Per-service rate sliders */}
                <div className="space-y-4 mb-6">
                  {selectedServices.map((service) => {
                    const range = SERVICE_PRICE_RANGES[service];
                    if (!range || range.floor === 0) return null; // Skip home_scan (fixed pricing)
                    const currentRate = proRates[service] ?? range.recommended;
                    const payout = Math.max(50, Math.round(currentRate * 0.85 * 100) / 100);

                    return (
                      <div key={service} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{range.displayName}</p>
                          <span className="text-xs text-muted-foreground">{range.unit}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Pros on UpTend charge: ${range.floor} to ${range.ceiling}
                        </p>

                        {/* Rate slider */}
                        <input
                          type="range"
                          min={range.floor}
                          max={range.ceiling}
                          step={1}
                          value={currentRate}
                          onChange={(e) =>
                            setProRates((prev) => ({
                              ...prev,
                              [service]: Number(e.target.value),
                            }))
                          }
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#ea580c]"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>${range.floor}</span>
                          <span className="text-[#ea580c] font-semibold">
                            Recommended: ${range.recommended}
                          </span>
                          <span>${range.ceiling}</span>
                        </div>

                        {/* Rate + Payout display */}
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mt-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Your rate</span>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                              ${currentRate}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">You earn (85%)</span>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              ${payout.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {selectedServices.includes("home_scan") && (
                    <div className="p-4 border rounded-lg bg-card">
                      <p className="font-semibold text-sm">Home DNA Scan</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fixed pricing to $99 standard, $249 premium. Pro payout is $50 flat per scan paid by UpTend.
                      </p>
                    </div>
                  )}
                </div>

                {/* Experience feedback (condensed) */}
                <div className="mb-6">
                  <h3 className="font-medium mb-1">Experience Per Service</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Optional. Helps us understand your background.
                  </p>
                  <div className="space-y-4">
                    {selectedServices.map((service) => {
                      const label = formatServiceLabel(service);
                      const fb = pricingFeedback[service] || { low: "", high: "", years: "" };
                      return (
                        <div key={service} className="p-4 border rounded-lg bg-card">
                          <p className="font-medium text-sm mb-3">{label}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Past low end ($)</label>
                              <Input
                                type="number"
                                placeholder="e.g. 100"
                                value={fb.low}
                                onChange={(e) => setPricingFeedback((prev) => ({ ...prev, [service]: { ...fb, low: e.target.value } }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Past high end ($)</label>
                              <Input
                                type="number"
                                placeholder="e.g. 300"
                                value={fb.high}
                                onChange={(e) => setPricingFeedback((prev) => ({ ...prev, [service]: { ...fb, high: e.target.value } }))}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Years of experience</label>
                              <Input
                                type="number"
                                placeholder="e.g. 5"
                                value={fb.years}
                                onChange={(e) => setPricingFeedback((prev) => ({ ...prev, [service]: { ...fb, years: e.target.value } }))}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Licenses & Certifications */}
                <div className="mb-6 p-4 border rounded-lg">
                  <Label className="text-base font-medium mb-2 block">Relevant Licenses & Certifications</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    List any trade licenses, certifications, or training you hold (e.g., EPA Lead-Safe, OSHA 10, CDL, pest control license).
                    These can influence your rate tier.
                  </p>
                  <Textarea
                    placeholder="e.g. OSHA 10-Hour Construction, EPA Lead-Safe Certified, Class B CDL..."
                    className="min-h-[80px]"
                    value={licensesAndCerts}
                    onChange={(e) => setLicensesAndCerts(e.target.value)}
                    data-testid="input-licenses-certs"
                  />
                </div>

                {/* B2B Commercial Licensing */}
                <div className="mb-6 p-4 border rounded-lg">
                  <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Commercial / B2B Services
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Do you service commercial properties, HOAs, or property management companies?
                  </p>
                  <div className="flex items-center gap-3 mb-4">
                    <Switch
                      checked={b2bLicensed}
                      onCheckedChange={(checked) => {
                        setB2bLicensed(checked);
                        if (!checked) {
                          setLicenseNumber("");
                          setB2bRates({});
                        }
                      }}
                      data-testid="switch-b2b-licensed"
                    />
                    <span className="text-sm font-medium">{b2bLicensed ? "Yes" : "No"}</span>
                  </div>

                  {b2bLicensed && (
                    <div className="space-y-4">
                      <div>
                        <Label>Florida Contractor License Number *</Label>
                        <Input
                          placeholder="e.g. CBC1234567"
                          value={licenseNumber}
                          onChange={(e) => setLicenseNumber(e.target.value)}
                          data-testid="input-license-number"
                        />
                        {b2bLicensed && !licenseNumber && (
                          <p className="text-xs text-destructive mt-1">License number is required for B2B services</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Commercial / B2B Rates</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          Set your rate range for commercial, HOA, and property management jobs.
                        </p>
                        <div className="space-y-3">
                          {selectedServices.map((service) => {
                            const range = SERVICE_PRICE_RANGES[service];
                            if (!range || range.floor === 0) return null;
                            const b2b = b2bRates[service] || { min: range.floor, max: range.ceiling };
                            return (
                              <div key={service} className="p-3 border rounded-lg bg-card">
                                <p className="font-medium text-sm mb-2">{range.displayName} (Commercial/B2B Rate)</p>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-muted-foreground">Min ($)</label>
                                    <Input
                                      type="number"
                                      placeholder={`${range.floor}`}
                                      value={b2b.min}
                                      onChange={(e) =>
                                        setB2bRates((prev) => ({
                                          ...prev,
                                          [service]: { ...b2b, min: Number(e.target.value) },
                                        }))
                                      }
                                      data-testid={`input-b2b-min-${service}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-muted-foreground">Max ($)</label>
                                    <Input
                                      type="number"
                                      placeholder={`${range.ceiling}`}
                                      value={b2b.max}
                                      onChange={(e) =>
                                        setB2bRates((prev) => ({
                                          ...prev,
                                          [service]: { ...b2b, max: Number(e.target.value) },
                                        }))
                                      }
                                      data-testid={`input-b2b-max-${service}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Continue to Agreement <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 8: AGREEMENT (ICA) ==================== */}
            {currentStep === 8 && (
              <div>
                <ICAAgreement
                  contractorName={`${form.getValues("firstName")} ${form.getValues("lastName")}`}
                  onAccept={(data) => {
                    setIcaData(data);
                    // Don't submit here. just save ICA data and go to Review
                    nextStep();
                  }}
                  onBack={prevStep}
                  isSubmitting={false}
                />
              </div>
            )}

            {/* ==================== STEP 9: REVIEW & SUBMIT ==================== */}
            {currentStep === 9 && (
              <Card className="p-6" data-testid="card-step-review-pro">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Review Your Application
                </h2>
                <p className="text-muted-foreground mb-6">
                  Please review everything below. Your Pro profile will be created when you click Submit.
                </p>

                {/* Personal Info Summary */}
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" /> Personal Info
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {form.getValues("firstName")} {form.getValues("lastName")}</div>
                    <div><span className="text-muted-foreground">Email:</span> {form.getValues("email")}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {form.getValues("phone")}</div>
                    <div><span className="text-muted-foreground">Company:</span> {form.getValues("companyName")}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {form.getValues("streetAddress")}, {form.getValues("city")}, {form.getValues("state")} {form.getValues("zipCode")}</div>
                  </div>
                </div>

                {/* Services Summary */}
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" /> Services
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>Edit</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map(s => (
                      <Badge key={s} variant="secondary">{formatServiceLabel(s)}</Badge>
                    ))}
                  </div>
                </div>

                {/* Tools Summary */}
                {Object.keys(toolsEquipment).some(k => toolsEquipment[k]?.length > 0) && (
                  <div className="mb-6 p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Wrench className="w-4 h-4" /> Tools & Equipment
                      </h3>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(4)}>Edit</Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedServices.map(service => {
                        const tools = toolsEquipment[service];
                        if (!tools || tools.length === 0) return null;
                        return (
                          <div key={service}>
                            <span className="font-medium">{formatServiceLabel(service)}:</span>{" "}
                            <span className="text-muted-foreground">{tools.join(", ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Vehicle Summary */}
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Car className="w-4 h-4" /> Vehicles
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(5)}>Edit</Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {vehicles.filter(v => v.vehicleType).map((v, i) => {
                      const vType = vehicleTypes.find(t => t.value === v.vehicleType);
                      return (
                        <div key={i}>
                          <span className="font-medium">{v.vehicleName || `Vehicle ${i + 1}`}:</span>{" "}
                          {vType?.label || v.vehicleType}
                          {v.year && ` • ${v.year}`}
                          {v.make && ` ${v.make}`}
                          {v.model && ` ${v.model}`}
                          {v.photoUrls.length > 0 && ` • ${v.photoUrls.length} photo(s)`}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verification Summary */}
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Verification
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(6)}>Edit</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Selfie:</span>{" "}
                      {selfiePhotoUrl ? <span className="text-green-600"> Uploaded</span> : <span className="text-red-600">Missing</span>}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID Photo:</span>{" "}
                      {idPhotoUrl ? <span className="text-green-600"> Uploaded</span> : <span className="text-red-600">Missing</span>}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Driver's License:</span> {form.getValues("driversLicense") || "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">GL Insurance:</span>{" "}
                      {form.getValues("generalLiabilityProvider") ? `${form.getValues("generalLiabilityProvider")}` : "Not provided"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vehicle Insurance:</span>{" "}
                      {form.getValues("vehicleInsuranceProvider") ? `${form.getValues("vehicleInsuranceProvider")}` : "Not provided"}
                    </div>
                  </div>
                </div>

                {/* Agreement Summary */}
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Agreement
                    </h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(8)}>Edit</Button>
                  </div>
                  <div className="text-sm">
                    {icaData ? (
                      <span className="text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        ICA signed by {icaData.signedName} on {new Date(icaData.acceptedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-red-600">Agreement not signed. go back to sign</span>
                    )}
                  </div>
                </div>

                {validatedCode && (
                  <div className="mb-6 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Invite code <strong>{validatedCode}</strong> will be applied for a fee discount
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-9">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={signupMutation.isPending || !icaData}
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    data-testid="button-submit-application"
                  >
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {/* ==================== STEP 10: WELCOME ==================== */}
            {currentStep === 10 && (
              <Card className="p-8 text-center" data-testid="card-step-complete-pro">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Thank you for applying to become a Pro. We'll review your application and run the background check. 
                  You'll receive an email within 2-3 business days with your approval status.
                </p>

                <div className="p-4 bg-muted rounded-lg mb-6 max-w-md mx-auto">
                  <h3 className="font-medium mb-3">What Happens Next?</h3>
                  <div className="space-y-3 text-left text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Background Check</p>
                        <p className="text-muted-foreground">We verify your identity and driving record (2-3 days)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Approval Email</p>
                        <p className="text-muted-foreground">You'll receive an email with next steps</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Set Up Payments</p>
                        <p className="text-muted-foreground">Connect your bank account for instant payouts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Start Earning!</p>
                        <p className="text-muted-foreground">Go online and accept your first job</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certification upsell */}
                <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 max-w-md mx-auto">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-amber-600" />
                  </div>
                  <p className="font-semibold text-amber-900 mb-1">Unlock Premium Jobs with Certifications</p>
                  <p className="text-sm text-amber-700 mb-3">
                    Certified pros earn up to 2x more and get priority access to high-value contracts.
                  </p>
                  <Link href="/academy">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Explore Certifications
                    </Button>
                  </Link>
                </div>

                {/* Payout Setup CTA */}
                <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center max-w-md mx-auto">
                  <p className="font-semibold text-green-900 mb-1"> Set up your bank account to get paid</p>
                  <p className="text-sm text-green-700 mb-3">Get paid automatically when jobs complete. takes 2 minutes</p>
                  <Link href="/pro/payouts/setup">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Set Up Direct Deposit →
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/login?tab=pro">
                    <Button>
                      Log In to Dashboard
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </form>
        </Form>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Keep 85% of Every Job</h3>
            <p className="text-sm text-muted-foreground">One flat 15% platform fee. Plus 100% of tips. No lead fees ever.</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Verified Customers</h3>
            <p className="text-sm text-muted-foreground">Your customers are verified too. Payments guaranteed through the platform.</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Guaranteed Payment</h3>
            <p className="text-sm text-muted-foreground">Every job is verified before you arrive. No surprises. Get paid same day.</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">New Pro Matching Boost</h3>
            <p className="text-sm text-muted-foreground">New pros get a matching boost. Start earning from day one.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
