import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Home, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/landing/header";
import { GoogleLoginButton, GoogleDivider } from "@/components/auth/google-login-button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type UserType = "homeowner" | "pro";

const TAB_CONFIG: Record<UserType, {
  headline: string;
  subtext: string;
  icon: typeof Home;
  signupLink: string;
  signupLabel: string;
  endpoint: string;
}> = {
  homeowner: {
    headline: "Put Your Home on Autopilot.",
    subtext: "We handle the chores. You handle the living.",
    icon: Home,
    signupLink: "/customer-signup",
    signupLabel: "Create a free account",
    endpoint: "/api/customers/login",
  },
  pro: {
    headline: "Mission Control.",
    subtext: "Turn on availability, accept jobs, and get paid instantly.",
    icon: Truck,
    signupLink: "/pro-signup",
    signupLabel: "Apply to become a Pro",
    endpoint: "/api/pros/login",
  },
};

export default function AuthPage() {
  usePageTitle("Sign In | UpTend");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect authenticated users to dashboard
  const { data: existingUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
  const [showPassword, setShowPassword] = useState(false);
  const isProRoute = location.includes("pycker") || location.includes("pro");
  const [activeTab, setActiveTab] = useState<UserType>(isProRoute ? "pro" : "homeowner");

  // Read URL parameters for redirect and address persistence
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get("redirect");
  const addressParam = urlParams.get("address");
  const bundleParam = urlParams.get("bundle");
  const serviceParam = urlParams.get("service");
  const quoteIdParam = urlParams.get("quoteId");
  const photosParam = urlParams.get("photos");
  const manualEstimateParam = urlParams.get("manualEstimate");
  const schedulingDataParam = urlParams.get("schedulingData");

  const config = TAB_CONFIG[activeTab];
  const Icon = config.icon;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", config.endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: activeTab === "homeowner" ? "Welcome Home!" : "Welcome Back, Pro!",
        description: "Redirecting...",
      });

      // Homeowner login - check for redirect parameters
      if (activeTab === "homeowner") {
        // If there's a redirect parameter (e.g., from property search), preserve address and bundle params
        if (redirectParam && redirectParam === "booking") {
          const params = new URLSearchParams();
          if (addressParam) params.set("address", addressParam);
          if (bundleParam) params.set("bundle", bundleParam);
          if (serviceParam) params.set("service", serviceParam);
          if (quoteIdParam) params.set("quoteId", quoteIdParam);
          if (photosParam) params.set("photos", photosParam);
          if (manualEstimateParam) params.set("manualEstimate", manualEstimateParam);
          if (schedulingDataParam) params.set("schedulingData", schedulingDataParam);
          setLocation(`/book?${params.toString()}`);
        } else if (!data.hasPaymentMethod) {
          setLocation("/payment-setup");
        } else {
          setLocation("/dashboard");
        }
      } else {
        setLocation("/pro/dashboard");
      }
    },
    onError: (error: any) => {
      let errorMessage = "Invalid email or password";
      if (error?.message) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || errorMessage;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as UserType);
    form.reset();
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="page-auth">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" data-testid="tabs-user-type">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="homeowner" className="gap-2" data-testid="tab-homeowner">
                <Home className="w-4 h-4" />
                Homeowner
              </TabsTrigger>
              <TabsTrigger value="pro" className="gap-2" data-testid="tab-pro">
                <Truck className="w-4 h-4" />
                Pro
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Quote Preview - Show if coming from quote flow */}
          {quoteIdParam && activeTab === "homeowner" && (
            <Card className="p-4 bg-primary/5 border-primary mb-4" data-testid="card-quote-preview">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Your quote is ready
                </p>
                <p className="text-lg font-bold text-primary">
                  Sign in to book this job with a verified UpTend Pro
                </p>
              </div>
            </Card>
          )}

          <Card className="p-8" data-testid="card-auth-form">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2" data-testid="text-auth-headline">
                {config.headline}
              </h1>
              <p className="text-muted-foreground text-sm" data-testid="text-auth-subtext">
                {config.subtext}
              </p>
            </div>

            <GoogleLoginButton role={activeTab === "pro" ? "pro" : "customer"} />
            <GoogleDivider />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
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
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                Forgot your password?
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href={config.signupLink} className="text-primary hover:underline" data-testid="link-signup">
                  {config.signupLabel}
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
