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
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
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
  Loader2, AlertTriangle, Building2, Plus, X, Lock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { PhotoUpload, MultiPhotoUpload } from "@/components/photo-upload";

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
  // General Liability Insurance (optional - 25% commission without)
  generalLiabilityProvider: z.string().optional(),
  generalLiabilityPolicyNumber: z.string().optional(),
  generalLiabilityExpiration: z.string().optional(),
  // Vehicle Insurance (optional - 25% commission without)
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
  { id: 1, title: "Create Account", icon: Lock },
  { id: 2, title: "Personal Info", icon: User },
  { id: 3, title: "Vehicle Details", icon: Car },
  { id: 4, title: "Verification", icon: Shield },
  { id: 5, title: "Complete", icon: CheckCircle },
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

export default function PyckerSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<VehicleData[]>([{ ...defaultVehicle }]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [driversLicensePhotoUrl, setDriversLicensePhotoUrl] = useState<string | null>(null);
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string | null>(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(null);
  const [generalLiabilityDocUrl, setGeneralLiabilityDocUrl] = useState<string | null>(null);
  const [vehicleInsuranceDocUrl, setVehicleInsuranceDocUrl] = useState<string | null>(null);
  
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
      const response = await fetch("/api/haulers/send-verification", {
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
      
      // In development, show the code in the toast for easier testing
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
      const response = await fetch("/api/haulers/verify-email", {
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

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      // Include vehicles array and photo URLs in the payload
      const payload = {
        ...data,
        vehicles: vehicles.filter(v => v.vehicleType), // Only include vehicles with a type selected
        profilePhotoUrl: profilePhotoUrl || undefined,
        driversLicensePhotoUrl: driversLicensePhotoUrl || undefined,
      };
      const response = await fetch("/api/haulers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(5);
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 24-48 hours.",
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof SignupForm)[] = [];
    
    if (currentStep === 1) {
      // Step 1: Create Account - validate password and email
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
      fieldsToValidate = ["vehicleType"];
      
      // Check if primary vehicle has required info
      const primaryVehicle = vehicles[0];
      if (!primaryVehicle || !primaryVehicle.vehicleType) {
        toast({
          title: "Vehicle Info Required",
          description: "Please select a vehicle type for your primary vehicle",
          variant: "destructive",
        });
        return false;
      }
      
      // Check if at least one vehicle has photos
      const hasVehiclePhotos = vehicles.some(v => v.photoUrls && v.photoUrls.length > 0);
      if (!hasVehiclePhotos) {
        toast({
          title: "Vehicle Photos Required",
          description: "Please upload at least one photo of your vehicle (exterior or cargo area)",
          variant: "destructive",
        });
        return false;
      }
    } else if (currentStep === 4) {
      fieldsToValidate = [
        "driversLicense", 
        "agreeTerms", 
        "agreeBackgroundCheck"
      ];
      
      // Check if required photos are uploaded (selfie and ID are mandatory)
      if (!selfiePhotoUrl || !idPhotoUrl) {
        toast({
          title: "Photos Required",
          description: "Please upload both your selfie and government-issued ID photos",
          variant: "destructive",
        });
        return false;
      }
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      nextStep();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">UpTend</span>
          </Link>
          <Link href="/drive">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drive
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Become a Pro</h1>
          <p className="text-muted-foreground">Join our verified network of Pros and start building your impact record</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep > step.id 
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${currentStep > step.id ? "bg-green-500" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {currentStep === 1 && (
              <Card className="p-6" data-testid="card-step-account">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Create Your Account
                </h2>
                <p className="text-muted-foreground mb-6">
                  First, let's set up your Pro account with your email and password.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min 8 characters" {...field} data-testid="input-password" />
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
                          <Input type="password" placeholder="Confirm password" {...field} data-testid="input-confirm-password" />
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
                              placeholder="john@example.com" 
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

            {currentStep === 2 && (
              <Card className="p-6" data-testid="card-step-personal">
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
                        <Input type="tel" placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
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
                        <Input placeholder="Smith Hauling LLC" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                    Continue to Vehicle Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-6" data-testid="card-step-vehicle">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Your Vehicle & Equipment
                  </h2>
                  <Badge variant="default" className="bg-primary">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  List all vehicles and equipment you use for jobs. When you go online, you'll select which vehicle you're using that day.
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
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-3">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} data-testid="button-next-step-3">
                    Continue to Verification
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="p-6" data-testid="card-step-verification">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Verification & Background Check
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

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <PhotoUpload
                    label="Profile Photo"
                    description="Professional photo for your Pro profile"
                    onUploadComplete={(url) => setProfilePhotoUrl(url)}
                    testId="upload-profile-photo"
                  />
                  <PhotoUpload
                    label="Driver's License Photo"
                    description="Front of your driver's license"
                    onUploadComplete={(url) => setDriversLicensePhotoUrl(url)}
                    testId="upload-drivers-license-photo"
                  />
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
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-700 dark:text-amber-400">Insurance is Optional</h3>
                      <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                        You can skip the insurance section, but <strong>without insurance documentation, you'll have a 25% commission</strong> on each job. 
                        Pros with verified insurance get a lower 20% commission rate.
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
                  <Button type="button" variant="outline" onClick={prevStep} data-testid="button-prev-step-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" disabled={signupMutation.isPending} data-testid="button-submit-application">
                    {signupMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 5 && (
              <Card className="p-8 text-center" data-testid="card-step-complete">
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

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/">
                    <Button variant="outline">
                      Return Home
                    </Button>
                  </Link>
                  <Link href="/drive">
                    <Button>
                      Learn More About Driving
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </form>
        </Form>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Keep 80% of Every Job</h3>
            <p className="text-sm text-muted-foreground">With proper licenses, insurance & business validation</p>
            <p className="text-xs text-muted-foreground mt-1">75% without • Plus 100% of tips</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">Instant Payouts</h3>
            <p className="text-sm text-muted-foreground">Get paid same day</p>
          </Card>
          <Card className="p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
            <h3 className="font-medium">No Lead Fees</h3>
            <p className="text-sm text-muted-foreground">Unlike competitors</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
