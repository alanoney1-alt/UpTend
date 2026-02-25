import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Building2, Users, DollarSign, Zap, Shield, TrendingUp } from "lucide-react";

export default function PartnersLanding() {
  const benefits = [
    { icon: DollarSign, title: "10% Bulk Discount", desc: "Save on every booking with partner pricing on all 11+ services." },
    { icon: Zap, title: "API Access", desc: "Integrate UpTend services directly into your property management workflow." },
    { icon: Users, title: "Dedicated Support", desc: "Priority support line and dedicated partner success manager." },
    { icon: Shield, title: "Vetted Pros", desc: "Background-checked, insured professionals for every job." },
    { icon: TrendingUp, title: "Analytics Dashboard", desc: "Track spend, bookings, and savings across your entire portfolio." },
    { icon: Building2, title: "Multi-Property", desc: "Manage services for hundreds of properties from one dashboard." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Partner Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Scale Your Property Services with UpTend
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Whether you manage 5 properties or 500, UpTend's partner program gives you bulk pricing,
            API access, and a single platform for all your home service needs.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/partners/register">
              <Button size="lg" className="text-lg px-8">Become a Partner</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8">Talk to Sales</Button>
            </Link>
          </div>
        </div>

        {/* Partner Types */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Built for Property Professionals</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Property Managers", desc: "Streamline maintenance across your portfolio" },
              { title: "Airbnb Hosts", desc: "Quick turnovers and reliable cleaning between guests" },
              { title: "Real Estate Agents", desc: "Pre-listing prep and move-in ready services" },
              { title: "HOAs & Communities", desc: "Community-wide maintenance programs" },
            ].map((type) => (
              <Card key={type.title} className="text-center">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Partner with UpTend?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <Card key={b.title}>
                <CardContent className="pt-6">
                  <b.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                  <p className="text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary/5 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Join hundreds of property professionals already using UpTend to manage their home services.
          </p>
          <Link href="/partners/register">
            <Button size="lg">Apply Now. It's Free</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
