import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const { data: authStatus, isLoading: checkingAuth } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest("POST", "/api/admin/login", { password });
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel.",
      });
      // Use window.location for hard redirect to ensure session cookie is sent
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      // Parse error message from API response
      let errorMessage = "Invalid password. Please try again.";
      if (error?.message) {
        try {
          // Error format is "status: {json}" - extract the JSON part
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
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter the admin password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(password);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  if (authStatus?.isAdmin) {
    setLocation("/admin");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Enter the admin password to access the management panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  autoComplete="current-password"
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-admin-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
