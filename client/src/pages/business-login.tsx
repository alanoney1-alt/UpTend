import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { ArrowLeft, Loader2, Eye, EyeOff, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/ui/logo";
import { GoogleLoginButton, GoogleDivider } from "@/components/auth/google-login-button";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function BusinessLogin() {
  usePageTitle("Business Login | UpTend for Business");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/customers/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Welcome Back!", description: "Redirecting to your dashboard..." });
      setLocation("/business/dashboard");
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
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive", duration: 6000 });
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
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo className="w-10 h-10" textClassName="text-xl" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              <h1 className="text-2xl font-bold">UpTend for Business</h1>
            </div>
            <p className="text-muted-foreground">Sign in to your business account</p>
          </div>

          <GoogleLoginButton role="customer" />
          <GoogleDivider />

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
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
                        <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
                ) : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-orange-500 hover:underline">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/business/register" className="text-orange-500 hover:underline">
                Register your business
              </Link>
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
