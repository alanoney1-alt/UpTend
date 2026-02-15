import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/landing/header";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, CheckCircle } from "lucide-react";

export default function PartnerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    type: "property_manager" as string,
  });
  const [registered, setRegistered] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/partners/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setRegistered(true);
      setApiKey(data.partner?.apiKey || "");
      toast({ title: "Welcome aboard!", description: data.message });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (registered) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-lg">
          <Card>
            <CardContent className="pt-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-6">
                Your partner account is pending review. We'll activate it within 24 hours.
              </p>
              {apiKey && (
                <div className="bg-muted p-4 rounded-lg text-left mb-6">
                  <p className="text-sm font-medium mb-1">Your API Key:</p>
                  <code className="text-xs break-all">{apiKey}</code>
                  <p className="text-xs text-muted-foreground mt-2">Save this — you'll need it for API access once activated.</p>
                </div>
              )}
              <Link href="/partners/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-lg">
        <Link href="/partners">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Partner Program
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Partner Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Property Management" />
            </div>
            <div>
              <Label>Contact Name</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@acmepm.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(407) 555-0199" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 8 characters" />
            </div>
            <div>
              <Label>Partner Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                  <SelectItem value="airbnb_host">Airbnb Host</SelectItem>
                  <SelectItem value="real_estate">Real Estate Agent</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending || !form.companyName || !form.email || !form.password}
            >
              {registerMutation.isPending ? "Submitting..." : "Apply to Partner Program"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Already a partner? <Link href="/partners/dashboard" className="text-primary underline">Go to dashboard</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
