import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProBackgroundCheck() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    legalFirstName: "",
    legalLastName: "",
    dateOfBirth: "",
    ssnLast4: "",
    streetAddress: "",
    city: "",
    state: "FL",
    zipCode: "",
    driversLicense: "",
    dlState: "FL",
    consent: false,
  });

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit =
    form.legalFirstName &&
    form.legalLastName &&
    form.dateOfBirth &&
    form.ssnLast4.length === 4 &&
    form.streetAddress &&
    form.city &&
    form.state &&
    form.zipCode &&
    form.consent;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pro/background-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
        toast({ title: "Background check information submitted", description: "We'll review and verify your details." });
      } else {
        toast({ title: "Error submitting", description: "Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error submitting", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Information Submitted</h1>
            <p className="text-muted-foreground mb-6">
              Your background check details are under review. We'll notify you once verification is complete, typically within 2-3 business days.
            </p>
            <Button onClick={() => setLocation("/pro/dashboard")} className="bg-amber-600 hover:bg-amber-700 text-white">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4 py-8">
        <button
          onClick={() => setLocation("/pro/dashboard")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold">Background Check</h1>
            <p className="text-muted-foreground text-sm">Required before your first job</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              We run a standard background screening on all pros to keep our customers safe.
              Your information is encrypted and only used for verification purposes.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="legalFirstName">Legal First Name</Label>
                <Input
                  id="legalFirstName"
                  value={form.legalFirstName}
                  onChange={(e) => update("legalFirstName", e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="legalLastName">Legal Last Name</Label>
                <Input
                  id="legalLastName"
                  value={form.legalLastName}
                  onChange={(e) => update("legalLastName", e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update("dateOfBirth", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ssnLast4">SSN (Last 4 digits)</Label>
                <Input
                  id="ssnLast4"
                  maxLength={4}
                  value={form.ssnLast4}
                  onChange={(e) => update("ssnLast4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={form.streetAddress}
                onChange={(e) => update("streetAddress", e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Orlando"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="FL"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => update("zipCode", e.target.value)}
                  placeholder="32827"
                  maxLength={5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driversLicense">Driver's License # (optional)</Label>
                <Input
                  id="driversLicense"
                  value={form.driversLicense}
                  onChange={(e) => update("driversLicense", e.target.value)}
                  placeholder="License number"
                />
              </div>
              <div>
                <Label htmlFor="dlState">DL State</Label>
                <Input
                  id="dlState"
                  value={form.dlState}
                  onChange={(e) => update("dlState", e.target.value)}
                  placeholder="FL"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-muted-foreground">
                  I authorize UpTend and its designated consumer reporting agency to obtain a
                  background report including criminal history, identity verification, and driving
                  record for the purpose of evaluating my application. I understand this is required
                  before I can accept jobs on the platform.
                </span>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? "Submitting..." : "Submit for Verification"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your data is encrypted with AES-256 and only used for verification.
              We never share your SSN or personal details with third parties except our background check provider.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
