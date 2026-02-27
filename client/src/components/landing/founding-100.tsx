import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Wrench, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

export function Founding100() {
  const [counts, setCounts] = useState({ customer: 0, pro: 0 });
  const [activeTab, setActiveTab] = useState<"customer" | "pro">("customer");
  const [form, setForm] = useState({ name: "", email: "", phone: "", zipCode: "", serviceType: "", businessName: "", hasLlc: false, yearsExperience: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ spotNumber: number; type: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/founding-members/count")
      .then(r => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/founding-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          zipCode: form.zipCode || undefined,
          memberType: activeTab,
          serviceType: activeTab === "pro" ? form.serviceType || undefined : undefined,
          businessName: activeTab === "pro" ? form.businessName || undefined : undefined,
          hasLlc: activeTab === "pro" ? form.hasLlc : undefined,
          yearsExperience: activeTab === "pro" && form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess({ spotNumber: data.spotNumber, type: activeTab });
      setCounts(prev => ({
        ...prev,
        [activeTab]: data.spotNumber,
      }));
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const customerSpots = 100 - counts.customer;
  const proSpots = 100 - counts.pro;

  if (success) {
    return (
      <section className="py-20 bg-slate-950 text-white" id="founding-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            You're #{success.spotNumber}!
          </h2>
          <p className="text-slate-300 text-lg mb-2">
            Welcome to the Founding 100{success.type === "pro" ? " Pros" : ""}. Check your email for confirmation and your perks.
          </p>
          <p className="text-slate-500 text-sm">
            We'll be in touch soon with next steps.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-slate-950 text-white" id="founding-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/30 mb-4">
            Limited Early Access
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Join the Founding 100
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Be one of the first 100 customers or 100 pros on the platform. Founding members get exclusive perks locked in forever.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveTab("customer")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "customer"
                ? "bg-[#F47C20] text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            <Users className="w-5 h-5" /> I Need Services
          </button>
          <button
            onClick={() => setActiveTab("pro")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "pro"
                ? "bg-[#F47C20] text-white"
                : "bg-white/10 text-slate-300 hover:bg-white/15"
            }`}
          >
            <Wrench className="w-5 h-5" /> I'm a Pro
          </button>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Spot counter */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">
                {activeTab === "customer" ? "Customer" : "Pro"} spots claimed
              </span>
              <span className="text-[#F47C20] font-bold">
                {activeTab === "customer" ? counts.customer : counts.pro} / 100
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F47C20] to-orange-300 rounded-full transition-all duration-500"
                style={{ width: `${activeTab === "customer" ? counts.customer : counts.pro}%` }}
              />
            </div>
            <p className="text-slate-500 text-xs mt-2 text-right">
              {activeTab === "customer" ? customerSpots : proSpots} spots remaining
            </p>
          </div>

          {/* Perks */}
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-5">
              <h3 className="text-white font-bold mb-3">
                {activeTab === "customer" ? "Founding Member" : "Founding Pro"} Perks:
              </h3>
              {activeTab === "customer" ? (
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> 10% off your first 10 services</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> Priority booking access</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> Direct line to George, your home expert</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> "Founding Member" badge forever</li>
                </ul>
              ) : (
                <ul className="space-y-2 text-slate-300 text-sm">
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> 12% platform fee (instead of 15%) for Year 1</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> Priority placement in customer matching</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> "Founding Pro" badge on your profile</li>
                  <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> Direct input on platform features</li>
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">Full Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your name"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@email.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zip" className="text-slate-300">Zip Code</Label>
                <Input
                  id="zip"
                  value={form.zipCode}
                  onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))}
                  placeholder="32827"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
                />
              </div>
              {activeTab === "pro" && (
                <div>
                  <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 555-5555"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
                  />
                </div>
              )}
              {activeTab === "customer" && (
                <div>
                  <Label htmlFor="phone" className="text-slate-300">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(555) 555-5555"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
                  />
                </div>
              )}
            </div>
            {activeTab === "pro" && (
              <>
                <div>
                  <Label htmlFor="service" className="text-slate-300">Primary Service</Label>
                  <select
                    id="service"
                    value={form.serviceType}
                    onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                    className="w-full mt-1 rounded-md bg-white/10 border border-white/20 text-white px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-slate-800">Select your main service</option>
                    <option value="junk_removal" className="bg-slate-800">Junk Removal</option>
                    <option value="pressure_washing" className="bg-slate-800">Pressure Washing</option>
                    <option value="gutter_cleaning" className="bg-slate-800">Gutter Cleaning</option>
                    <option value="home_cleaning" className="bg-slate-800">Home Cleaning</option>
                    <option value="handyman" className="bg-slate-800">Handyman</option>
                    <option value="landscaping" className="bg-slate-800">Landscaping</option>
                    <option value="moving_labor" className="bg-slate-800">Moving Labor</option>
                    <option value="demolition" className="bg-slate-800">Light Demolition</option>
                    <option value="garage_cleanout" className="bg-slate-800">Garage Cleanout</option>
                    <option value="pool_cleaning" className="bg-slate-800">Pool Cleaning</option>
                    <option value="carpet_cleaning" className="bg-slate-800">Carpet Cleaning</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="bizName" className="text-slate-300">Business Name (optional)</Label>
                  <Input
                    id="bizName"
                    value={form.businessName}
                    onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    placeholder="Your company name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="years" className="text-slate-300">Years Experience</Label>
                    <Input
                      id="years"
                      type="number"
                      min="0"
                      value={form.yearsExperience}
                      onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))}
                      placeholder="e.g. 5"
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 mt-1"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.hasLlc}
                        onChange={e => setForm(f => ({ ...f, hasLlc: e.target.checked }))}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 accent-[#F47C20]"
                      />
                      <span className="text-slate-300 text-sm">I have an LLC</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full bg-[#F47C20] hover:bg-[#E06910] text-white text-lg h-14 rounded-xl"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Claiming Your Spot...</>
              ) : (
                <>Claim My Spot <ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
