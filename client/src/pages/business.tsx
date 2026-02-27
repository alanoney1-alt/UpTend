import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Building2, Users, Home, HardHat, Landmark, ArrowRight, Shield,
  TrendingUp, Clock, Eye, DollarSign, CheckCircle, Zap,
  BarChart3, Leaf, Bot, FileText, Truck, AlertTriangle,
  Calculator, ChevronRight
} from "lucide-react";

const segments = [
  { id: "pm", label: "Property Management", icon: Building2 },
  { id: "hoa", label: "HOA", icon: Users },
  { id: "construction", label: "Construction", icon: HardHat },
  { id: "government", label: "Government", icon: Landmark },
] as const;

type Segment = typeof segments[number]["id"];

const segmentData: Record<Segment, {
  headline: string;
  sub: string;
  tiers: { name: string; price: string; unit: string; features: string[] }[];
  stats: { value: string; label: string }[];
}> = {
  pm: {
    headline: "Manage Every Property. One Platform.",
    sub: "Replace 15 vendor relationships with one dashboard. AI-dispatched pros, real-time tracking, weekly invoicing.",
    tiers: [
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 50 doors", "AI dispatch", "Weekly invoicing", "Basic reporting"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 200 doors", "Priority scheduling", "Compliance reports", "Dedicated account manager"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Unlimited doors", "White-label portal", "API access", "SLA guarantees", "Custom integrations"] },
    ],
    stats: [
      { value: "~375", label: "PM companies in Orlando" },
      { value: "30%", label: "Average cost savings" },
      { value: "< 2hr", label: "Average dispatch time" },
    ],
  },
  hoa: {
    headline: "Your Entire Community. One Vendor.",
    sub: "Common areas, unit turns, emergency repairs. all through one platform with full board reporting.",
    tiers: [
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 100 units", "Common area services", "Board reports", "Resident portal"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 500 units", "Priority dispatch", "ESG tracking", "Violation management"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Unlimited units", "White-label portal", "Custom SLAs", "Dedicated team", "API access"] },
    ],
    stats: [
      { value: "7,500+", label: "HOAs in Orlando" },
      { value: "48hr", label: "Guaranteed response" },
      { value: "100%", label: "Insured & verified pros" },
    ],
  },
  construction: {
    headline: "Subcontractor Management. Simplified.",
    sub: "Certified pros for finish work, cleanup, and maintenance. Insurance verified. Compliance tracked.",
    tiers: [
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 5 active sites", "Pro dispatch", "Insurance verification", "Photo documentation"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 20 sites", "Prevailing wage compliance", "Materials tracking", "Priority dispatch"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Unlimited sites", "Custom workflows", "API integration", "Dedicated PM", "SLA guarantees"] },
    ],
    stats: [
      { value: "$12B", label: "FL construction market" },
      { value: "24hr", label: "Pro deployment" },
      { value: "0", label: "Compliance headaches" },
    ],
  },
  government: {
    headline: "Government-Ready. Veteran-Powered.",
    sub: "SDVOSB-certified subsidiary. Prevailing wage compliance. Full audit trails. FEMA-ready.",
    tiers: [
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 50 properties", "Prevailing wage", "Audit trails", "Quarterly reporting"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Up to 200 properties", "FEMA response", "Bond compliance", "Dedicated team"] },
      { name: "Custom Plan", price: "Custom", unit: "", features: ["Unlimited scope", "Multi-county ops", "Custom compliance", "Executive reporting", "Emergency response"] },
    ],
    stats: [
      { value: "SDVOSB", label: "Certified subsidiary" },
      { value: "SAM.gov", label: "Registered" },
      { value: "100%", label: "Audit compliant" },
    ],
  },
};

export default function Business() {
  usePageTitle("UpTend for Business | Property Services Platform");
  const [activeSegment, setActiveSegment] = useState<Segment>("pm");
  const data = segmentData[activeSegment];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/site/hero-business.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/80 to-slate-950" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-6 text-sm font-semibold">
            UpTend for Business
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight leading-[1.1]">
            One Platform.<br />
            Every Property.<br />
            <span className="text-orange-500">Zero Headaches.</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            Property managers, HOAs, and construction companies use UpTend to replace dozens of vendor relationships 
            with one platform. Fully insured pros, real-time tracking, weekly billing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 text-lg">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#pricing">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg">
                See Pricing
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Sound Familiar?</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Every property manager has these problems. We built UpTend to solve all three.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: AlertTriangle,
                pain: "Managing 15 different vendors?",
                solve: "One platform, one invoice, one dashboard. AI matches the right pro to every job automatically.",
                color: "text-red-400",
              },
              {
                icon: Eye,
                pain: "Chasing contractors for updates?",
                solve: "Real-time GPS tracking, photo documentation at every stage, automated status reports to your inbox.",
                color: "text-yellow-400",
              },
              {
                icon: DollarSign,
                pain: "Surprise invoices and scope creep?",
                solve: "Guaranteed pricing ceiling locked at booking. AI scoping. Transparent weekly billing. No surprises.",
                color: "text-orange-400",
              },
            ].map((item) => (
              <Card key={item.pain} className="bg-slate-800/50 border-slate-700 hover:border-orange-500/40 transition-colors">
                <CardContent className="p-8">
                  <item.icon className={`w-10 h-10 ${item.color} mb-4`} />
                  <h3 className="text-xl font-bold text-white mb-3">{item.pain}</h3>
                  <p className="text-slate-300 leading-relaxed">{item.solve}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Segment Pricing */}
      <section id="pricing" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Pricing Built for Your Business</h2>
          <p className="text-slate-400 text-center mb-8">Custom pricing for every business. Schedule a call to get started.</p>

          {/* Segment Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${
                  activeSegment === seg.id
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <seg.icon className="w-4 h-4" />
                {seg.label}
              </button>
            ))}
          </div>

          {/* Segment Header */}
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">{data.headline}</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">{data.sub}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12">
            {data.stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-orange-400">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {data.tiers.map((tier, i) => (
              <Card
                key={tier.name}
                className={`border overflow-hidden ${
                  i === 1
                    ? "bg-slate-800/80 border-orange-500/50 ring-1 ring-orange-500/30"
                    : "bg-slate-800/50 border-slate-700"
                }`}
              >
                {i === 1 && (
                  <div className="bg-orange-500 text-center py-1.5 text-sm font-bold text-white">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h4 className="text-lg font-bold text-white mb-2">{tier.name}</h4>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-slate-400 text-sm">{tier.unit}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/business/onboarding" asChild>
                    <Button
                      className={`w-full font-semibold ${
                        i === 1
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                    >
                      Get Started <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            All plans include Net Weekly invoicing · Volume discounts applied automatically · Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Run Operations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "Smart Dispatch", desc: "Automatic pro matching based on skills, location, ratings, and availability" },
              { icon: Shield, title: "Insurance Verified", desc: "Every pro's GL insurance verified. Expired = blocked from your jobs" },
              { icon: Eye, title: "Real-Time Tracking", desc: "GPS tracking, photo documentation, live status updates to your dashboard" },
              { icon: FileText, title: "Weekly Billing", desc: "Net Weekly invoices with line-item detail. No surprises, no chasing" },
              { icon: Leaf, title: "ESG Reporting", desc: "Carbon tracking, sustainability metrics, and impact reports for your board" },
              { icon: Zap, title: "Emergency Response", desc: "24/7 urgent dispatch for after-hours emergencies. Auto-escalation" },
              { icon: TrendingUp, title: "Compliance & Audits", desc: "Full audit trails, prevailing wage compliance, insurance certificates on file" },
              { icon: Truck, title: "Certified Pro Network", desc: "Background-checked, trained, and certified pros with career accountability" },
            ].map((f) => (
              <Card key={f.title} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <f.icon className="w-8 h-8 text-orange-400 mb-3" />
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <Calculator className="w-12 h-12 text-orange-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">The Math Is Simple</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
            Property managers spend 8-12 hours per week managing vendors. UpTend cuts that to under 1 hour.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { value: "30%", label: "Average cost reduction", sub: "vs. managing vendors directly" },
              { value: "90%", label: "Less time on vendor management", sub: "8-12 hrs/week → under 1 hour" },
              { value: "< 2hr", label: "Average dispatch time", sub: "AI matches the right pro instantly" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black text-orange-400 mb-2">{s.value}</div>
                <div className="text-white font-semibold mb-1">{s.label}</div>
                <div className="text-sm text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Veteran/Government Badge */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700 overflow-hidden">
            <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="shrink-0">
                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Landmark className="w-10 h-10 text-orange-400" />
                </div>
              </div>
              <div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-3">Government Ready</Badge>
                <h3 className="text-2xl font-bold text-white mb-3">Veteran-Owned. Government-Certified.</h3>
                <p className="text-slate-300 leading-relaxed">
                  UpTend's service subsidiary is veteran-owned and pursuing SDVOSB, MBE, SBA 8(a), and DBE certifications. 
                  We're built for government contracts. prevailing wage compliance, full audit trails, FEMA emergency response capability.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Simplify Your Property Services?</h2>
          <p className="text-slate-400 text-lg mb-8">Join property managers across Orlando who are switching to UpTend.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login" asChild>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
