import { useState } from "react";
import { useSEO } from "@/hooks/use-seo";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { openGeorge } from "@/components/george-inline-tip";
import {
  Thermometer, Phone, ShieldCheck, Clock, Star, CheckCircle,
  ArrowRight, Wrench, Wind, Snowflake, Flame, AlertTriangle,
  MessageSquare, Send, Loader2,
} from "lucide-react";

function ServiceRequestForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", issue: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.issue) return;
    
    setStatus("sending");
    try {
      const res = await fetch("/api/partners/comfort-solutions-tech/onboard-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          address: form.address,
          service_type: "hvac",
          notes: form.issue,
          source: "hvac_form",
        }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        // Fallback: try the general lead endpoint
        const res2 = await fetch("/api/leads/service-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            email: form.email,
            address: form.address,
            service: "hvac",
            issue: form.issue,
          }),
        });
        setStatus(res2.ok ? "sent" : "error");
      }
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
          A licensed HVAC tech will call you back within the hour.
          <br />Check your phone for a call from our team.
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
          placeholder="AC blowing warm air, weird noise from the unit, won't turn on..."
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
          <><Send className="mr-2 h-5 w-5" /> Get a Tech Out There</>
        )}
      </Button>
      {status === "error" && (
        <p className="text-red-500 text-sm text-center">Something went wrong. Try calling us at (855) 901-2072.</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        A licensed, insured HVAC tech will call you back within the hour. No obligation.
      </p>
    </form>
  );
}

export default function HVACServicePage() {
  useSEO({
    title: "HVAC Services — Orlando Metro | UpTend",
    description: "24/7 HVAC repair, maintenance, and installation in Orlando Metro. Vetted pros, transparent pricing. One Price. One Pro. Done.",
    path: "/services/hvac",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative py-20 px-6 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="bg-white/20 text-white border-0 text-sm mb-4">
            LIVE IN ORLANDO METRO
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AC Down? We've Got You.
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto">
            Get matched with a vetted HVAC pro in your area. Fill out the form, chat with George, or just call us. However you want to do it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#request-service">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              >
                Request Service <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="tel:+18559012072">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" /> (855) 901-2072
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Three Ways to Get Help */}
      <section className="py-16 px-6 bg-background" id="request-service">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Get Help Your Way</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Fill out the form and a tech calls you back. Or if you'd rather talk it through, chat with George or give us a call. Same result either way.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Option 1: Form (primary) */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-orange-500/30">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">1</div>
                    <div>
                      <h3 className="text-xl font-bold">Fill Out the Form</h3>
                      <p className="text-sm text-muted-foreground">Quickest way. A tech calls you back within the hour.</p>
                    </div>
                  </div>
                  <ServiceRequestForm />
                </CardContent>
              </Card>
            </div>

            {/* Options 2 & 3: Chat + Call */}
            <div className="flex flex-col gap-6">
              <Card className="border border-border hover:border-orange-500/50 transition-colors flex-1">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">2</div>
                    <h3 className="text-lg font-bold">Chat with George</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    George is our AI assistant. He'll ask a couple questions about your issue and get a tech lined up. Available 24/7.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => openGeorge?.()}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Chat Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-border hover:border-orange-500/50 transition-colors flex-1">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">3</div>
                    <h3 className="text-lg font-bold">Call Us</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    Talk to George on the phone. Tell him what's wrong and he'll have a tech call you back.
                  </p>
                  <a href="tel:+18559012072" className="w-full">
                    <Button className="w-full" variant="outline">
                      <Phone className="mr-2 h-4 w-4" /> (855) 901-2072
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Cover</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Snowflake, title: "AC Repair", desc: "Same-day emergency repair. Compressors, refrigerant, motors, thermostats.", price: "From $89" },
              { icon: Flame, title: "Heating Repair", desc: "Heat pumps, furnaces, and heating systems.", price: "From $89" },
              { icon: Wind, title: "Duct Cleaning", desc: "Full ductwork cleaning and inspection. Breathe easier.", price: "From $299" },
              { icon: Thermometer, title: "Maintenance Plans", desc: "Annual tune-ups keep your system running and warranty valid.", price: "From $149/yr" },
              { icon: Wrench, title: "New Installation", desc: "Full HVAC system replacement. We'll size it right.", price: "Free estimate" },
              { icon: AlertTriangle, title: "Emergency Service", desc: "24/7 after-hours emergency HVAC.", price: "From $149" },
            ].map((svc, i) => (
              <Card key={i} className="border border-border hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6">
                  <svc.icon className="h-8 w-8 text-orange-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{svc.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{svc.desc}</p>
                  <p className="text-orange-500 font-semibold text-sm">{svc.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Tell Us What's Wrong", desc: "Fill out the form, chat with George, or call us. Whatever's easiest." },
              { step: "2", title: "We Match You", desc: "We connect you with a vetted, licensed HVAC pro in your area." },
              { step: "3", title: "Get It Fixed", desc: "Your pro calls you back within the hour. One price. No surprises." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { icon: ShieldCheck, label: "Licensed & Insured" },
              { icon: Star, label: "Vetted Pros Only" },
              { icon: Clock, label: "Same-Day Service" },
              { icon: CheckCircle, label: "Satisfaction Guaranteed" },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <t.icon className="h-8 w-8 text-orange-500" />
                <span className="font-semibold text-sm">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 bg-orange-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Don't Sweat It</h2>
          <p className="text-xl opacity-90 mb-8">
            However you reach out — form, chat, or phone — a real HVAC tech calls you back within the hour.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#request-service">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              >
                Request Service
              </Button>
            </a>
            <a href="tel:+18559012072">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" /> (855) 901-2072
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
