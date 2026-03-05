import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Send, Loader2 } from "lucide-react";

interface ServiceRequestFormProps {
  partnerSlug?: string;
  serviceType?: string;
  companyName?: string;
}

export function ServiceRequestForm({ partnerSlug = "uptend-main", serviceType = "hvac", companyName }: ServiceRequestFormProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", issue: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.issue) return;
    
    setStatus("sending");
    try {
      const res = await fetch("/api/leads/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          service: serviceType,
          issue: form.issue,
          partner_slug: partnerSlug,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">We Got You</h3>
        <p className="text-muted-foreground text-lg">
          {companyName ? `${companyName} will` : "A licensed HVAC tech will"} call you back within the hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Your Name *</label>
          <Input
            placeholder="John Smith"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Phone Number *</label>
          <Input
            placeholder="(407) 555-1234"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <Input
            placeholder="john@email.com"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Address</label>
          <Input
            placeholder="123 Oak St, Orlando FL"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">What's Going On? *</label>
        <Textarea
          placeholder="AC blowing warm air, weird noise, won't turn on..."
          rows={3}
          value={form.issue}
          onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
          required
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
        disabled={status === "sending"}
      >
        {status === "sending" ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
        ) : (
          <><Send className="mr-2 h-5 w-5" /> Request Service</>
        )}
      </Button>
      {status === "error" && (
        <p className="text-red-500 text-sm text-center">Something went wrong. Try calling us directly.</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        {companyName || "A licensed tech"} will call you back within the hour. No obligation.
      </p>
    </form>
  );
}
