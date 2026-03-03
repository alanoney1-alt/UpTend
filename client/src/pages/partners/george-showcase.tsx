/**
 * George AI Capability Showcase for Partners
 * 
 * /partners/:slug/george - shows the partner owner what George does
 * This is a sales page, not a demo. It explains George's value.
 */

import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import {
  MessageCircle, Camera, Clock, Brain, Phone, Shield,
  BarChart3, Users, Wrench, Bell, FileText, Zap,
  ArrowRight, CheckCircle, Star, TrendingUp,
} from "lucide-react";

const PARTNER_NAMES: Record<string, string> = {
  "comfort-solutions-tech": "Comfort Solutions Tech LLC",
  "demo-hvac": "Orlando Air Pro",
  "demo-plumbing": "Sunshine Plumbing Co",
};

export default function GeorgeShowcase() {
  const params = useParams();
  const slug = (params as any).slug || "demo-hvac";
  const companyName = PARTNER_NAMES[slug] || "Your Company";

  const capabilities = [
    {
      icon: MessageCircle,
      title: "24/7 Customer Intake",
      desc: "George talks to your customers any time of day. No missed calls, no voicemail tag. He asks the right questions, collects the details, and gets you a clean scope before you even pick up the phone.",
      highlight: "Never miss a lead again",
    },
    {
      icon: Camera,
      title: "Photo Diagnostics",
      desc: "Customers snap a photo of their unit or issue. George identifies the brand, model, age estimate, and visible problems. You get a pre-diagnosis before the truck rolls.",
      highlight: "Know what you're walking into",
    },
    {
      icon: Brain,
      title: "Smart Scoping",
      desc: "George builds a scope of work based on the conversation and photos. He knows HVAC. compressor issues, refrigerant, ductwork, thermostat problems. Your team reviews and approves, not builds from scratch.",
      highlight: "Scopes in minutes, not hours",
    },
    {
      icon: Clock,
      title: "Instant Response Time",
      desc: "The average homeowner calls 3 companies and goes with whoever picks up first. George picks up instantly. Every time. Your response time goes from hours to seconds.",
      highlight: "Be the first to respond, every time",
    },
    {
      icon: FileText,
      title: "Parts & Procurement",
      desc: "George identifies likely parts needed from the diagnosis. He can pull pricing, check availability, and build a parts list before your tech is even dispatched.",
      highlight: "Faster job completion",
    },
    {
      icon: Users,
      title: "Lead Routing",
      desc: "Every conversation George has becomes a qualified lead with name, phone, address, issue description, and photos. routed directly to your team via email, text, or dashboard.",
      highlight: "Qualified leads, not tire kickers",
    },
    {
      icon: TrendingUp,
      title: "SEO Power",
      desc: "UpTend builds search-optimized pages for your brand across every Orlando neighborhood. When someone Googles 'AC repair Lake Nona,' your name shows up. powered by our SEO engine.",
      highlight: "Show up where customers are searching",
    },
    {
      icon: Bell,
      title: "Follow-Up Automation",
      desc: "George follows up with customers after service. He checks satisfaction, reminds them about maintenance schedules, and re-engages them when it's time for seasonal tune-ups.",
      highlight: "Recurring revenue on autopilot",
    },
    {
      icon: Shield,
      title: "Brand Trust",
      desc: "George represents your company by name. Customers see your brand, your services, your phone number. UpTend powers the tech. you own the relationship.",
      highlight: "Your brand, our intelligence",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      desc: "See how many conversations George is handling, conversion rates, common issues, peak times, and customer satisfaction. all in one dashboard.",
      highlight: "Data-driven decisions",
    },
  ];

  const stats = [
    { value: "< 5 sec", label: "Average response time" },
    { value: "24/7", label: "Availability" },
    { value: "8", label: "HVAC services covered" },
    { value: "Zero", label: "Missed leads" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo variant="icon" className="h-6" />
            <span className="text-sm text-muted-foreground">×</span>
            <span className="font-semibold text-sm">{companyName}</span>
          </div>
          <a href={`/partners/${slug}`} className="text-sm text-primary hover:underline">
            ← Back
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full overflow-hidden border-2 border-primary">
            <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Meet George
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Your AI Front Desk, Service Advisor & Lead Machine
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            George handles customer conversations, diagnoses HVAC issues from photos, builds scopes of work, and routes qualified leads to {companyName}. all before you lift a finger.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map(s => (
            <div key={s.label} className="text-center p-4 bg-card border border-border rounded-xl">
              <div className="text-2xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <h2 className="text-2xl font-bold text-center mb-8">What George Does for {companyName}</h2>
        <div className="space-y-4 mb-12">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{cap.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{cap.desc}</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {cap.highlight}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How It Works for Partners */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-center mb-8">How It Works for You</h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "We Build Your Page", desc: `${companyName} gets a branded landing page with George embedded. Your name, your services, your phone number.` },
              { step: "2", title: "George Handles Intake", desc: "Customers land on your page (from Google, ads, referrals, or your existing site). George talks to them, collects details, and scopes the job." },
              { step: "3", title: "You Get Qualified Leads", desc: "Every conversation becomes a clean lead with name, phone, address, issue details, photos, and a preliminary scope. sent straight to you." },
              { step: "4", title: "You Close & Service", desc: "Your team reviews the scope, confirms with the customer, and dispatches. The customer already trusts you because George handled them right." },
              { step: "5", title: "George Follows Up", desc: "After the job, George checks in with the customer, handles reviews, and schedules the next maintenance. Recurring revenue built in." },
            ].map(s => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-sell */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold text-center mb-4">Beyond HVAC</h2>
          <p className="text-center text-muted-foreground mb-6">
            When your customers need services outside HVAC, George doesn't send them away. he connects them with UpTend's network. You stay the trusted source, and every referral builds loyalty.
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-center">
            {[
              "Junk Removal", "Pressure Washing", "Gutter Cleaning", "Moving Labor",
              "Handyman", "Light Demolition", "Garage Cleanout", "Home Cleaning",
              "Pool Cleaning", "Landscaping", "Carpet Cleaning", "Painting",
            ].map(s => (
              <div key={s} className="text-xs p-2 bg-background rounded-lg border border-border">
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Ready to See George in Action?</h2>
          <p className="text-muted-foreground mb-6">Try the live demo on your partner page.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`/partners/${slug}`}>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <MessageCircle className="w-5 h-5" />
                Try George Live
              </Button>
            </a>
            <a href={`/partners/${slug}/seo-demo`}>
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                <TrendingUp className="w-5 h-5" />
                See SEO Demo
              </Button>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by <span className="font-semibold text-foreground">UpTend</span>. AI-powered home service intelligence</p>
        </div>
      </main>
    </div>
  );
}
