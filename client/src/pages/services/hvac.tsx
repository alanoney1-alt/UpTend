import { useSEO } from "@/hooks/use-seo";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { openGeorge } from "@/components/george-inline-tip";
import {
  Thermometer, Phone, ShieldCheck, Clock, Star, CheckCircle,
  ArrowRight, Wrench, Wind, Snowflake, Flame, AlertTriangle,
} from "lucide-react";

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
            Talk to George, our AI assistant. He'll connect you with a vetted HVAC pro
            in your area. No waiting on hold. No runaround.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              onClick={() => openGeorge?.()}
            >
              Chat with George <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href="tel:+18559012072">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" /> Call (855) 901-2072
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Cover</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Snowflake, title: "AC Repair", desc: "Same-day emergency repair. Compressors, refrigerant, motors, thermostats.", price: "From $89" },
              { icon: Flame, title: "Heating Repair", desc: "Heat pumps, furnaces, and heating systems. Don't freeze.", price: "From $89" },
              { icon: Wind, title: "Duct Cleaning", desc: "Full ductwork cleaning and inspection. Breathe easier.", price: "From $299" },
              { icon: Thermometer, title: "Maintenance Plans", desc: "Annual tune-ups keep your system running and your warranty valid.", price: "From $149/yr" },
              { icon: Wrench, title: "New Installation", desc: "Full HVAC system replacement. We'll size it right.", price: "Free estimate" },
              { icon: AlertTriangle, title: "Emergency Service", desc: "24/7 after-hours emergency HVAC. We answer when others don't.", price: "From $149" },
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
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Tell George What's Wrong", desc: "Chat or call. George asks a few quick questions to understand your issue." },
              { step: "2", title: "Get Matched", desc: "George connects you with a vetted, licensed HVAC pro in your area." },
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
      <section className="py-16 px-6 bg-background">
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

      {/* CTA */}
      <section className="py-16 px-6 bg-orange-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Don't Sweat It</h2>
          <p className="text-xl opacity-90 mb-8">
            George is available 24/7. Tell him what's going on and he'll handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full font-semibold"
              onClick={() => openGeorge?.()}
            >
              Talk to George
            </Button>
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
