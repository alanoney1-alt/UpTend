import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowLeft, Loader2, Eye, EyeOff, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/ui/logo";
import { GoogleLoginButton, GoogleDivider } from "@/components/auth/google-login-button";

const registerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Please enter a valid phone number").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
  accountType: z.enum(["referral", "direct"], { required_error: "Please select an account type" }),
  propertyCount: z.string().min(1, "Please select a range"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function BusinessRegister() {
  usePageTitle("Register Your Business | UpTend for Business");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "", firstName: "", lastName: "", email: "",
      password: "", confirmPassword: "", phone: "", accountType: undefined, propertyCount: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, companyName, accountType, propertyCount, ...rest } = data;
      const response = await apiRequest("POST", "/api/customers/register", {
        ...rest,
        smsOptIn: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Business Account Created!", description: "Welcome to UpTend for Business." });
      setLocation("/business/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="p-4">
        <Link href="/business" className="inline-flex items-center gap-2 text-white hover:text-orange-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Business</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Logo className="w-10 h-10" textClassName="text-xl" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                <h1 className="text-2xl font-bold">Register Your Business</h1>
              </div>
              <p className="text-muted-foreground">Join UpTend for Business</p>
            </div>

            <GoogleLoginButton role="customer" />
            <GoogleDivider />

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="Acme Property Management" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl><Input placeholder="Jane" {...field} /></FormControl>
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
                        <FormControl><Input placeholder="Smith" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Email</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@acme.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input type="tel" placeholder="(407) 555-0199" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
                          <div className="flex items-start space-x-3 rounded-md border p-3">
                            <RadioGroupItem value="referral" id="referral" className="mt-0.5" />
                            <Label htmlFor="referral" className="font-normal cursor-pointer">
                              <span className="font-medium">Referral Partner</span>
                              <span className="block text-sm text-muted-foreground">Earn 5% per job. your customers pay</span>
                            </Label>
                          </div>
                          <div className="flex items-start space-x-3 rounded-md border p-3">
                            <RadioGroupItem value="direct" id="direct" className="mt-0.5" />
                            <Label htmlFor="direct" className="font-normal cursor-pointer">
                              <span className="font-medium">Direct Account</span>
                              <span className="block text-sm text-muted-foreground">Volume discounts. you pay, consolidated invoicing</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Properties Managed</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-10">1–10</SelectItem>
                          <SelectItem value="11-50">11–50</SelectItem>
                          <SelectItem value="51-200">51–200</SelectItem>
                          <SelectItem value="200+">200+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="At least 8 characters" {...field} />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
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
                        <Input type={showPassword ? "text" : "password"} placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                  ) : "Create Business Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/business/login" className="text-orange-500 hover:underline">Sign in</Link>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
