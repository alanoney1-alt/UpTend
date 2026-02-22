import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { BusinessHeader } from "@/components/business/business-header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Building2, Users, HardHat, ArrowRight, Shield,
  TrendingUp, Clock, Eye, DollarSign, CheckCircle, Zap,
  BarChart3, Bot, FileText, Truck, AlertTriangle,
  Calculator, ChevronRight, Plug, BadgeCheck, ShieldCheck,
  Handshake, LayoutDashboard, RefreshCw, Bell, Camera,
  Wrench, ClipboardList, HardDrive, FileSpreadsheet
} from "lucide-react";

const segments = [
  { id: "pm", label: "Property Management", icon: Building2 },
  { id: "hoa", label: "HOA / Community", icon: Users },
  { id: "construction", label: "Construction", icon: HardHat },
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
      { name: "Starter", price: "$4", unit: "/door/mo", features: ["Up to 50 doors", "AI dispatch", "Weekly invoicing", "Basic reporting"] },
      { name: "Pro", price: "$6", unit: "/door/mo", features: ["Up to 200 doors", "Priority scheduling", "Compliance reports", "Dedicated account manager"] },
      { name: "Enterprise", price: "$10", unit: "/door/mo", features: ["Unlimited doors", "White-label portal", "API access", "SLA guarantees", "Custom integrations"] },
    ],
    stats: [
      { value: "~375", label: "PM companies in Orlando" },
      { value: "30%", label: "Average cost savings" },
      { value: "< 2hr", label: "Average dispatch time" },
    ],
  },
  hoa: {
    headline: "Your Entire Community. One Vendor.",
    sub: "Common areas, unit turns, emergency repairs — all through one platform with full board reporting.",
    tiers: [
      { name: "Starter", price: "$3", unit: "/unit/mo", features: ["Up to 100 units", "Common area services", "Board reports", "Resident portal"] },
      { name: "Pro", price: "$5", unit: "/unit/mo", features: ["Up to 500 units", "Priority dispatch", "Violation tracking", "Weekly reporting"] },
      { name: "Enterprise", price: "$8", unit: "/unit/mo", features: ["Unlimited units", "White-label portal", "Custom SLAs", "Dedicated team", "API access"] },
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
      { name: "Starter", price: "$299", unit: "/mo", features: ["Up to 5 active sites", "Pro dispatch", "Insurance verification", "Photo documentation"] },
      { name: "Pro", price: "$599", unit: "/mo", features: ["Up to 20 sites", "Prevailing wage compliance", "Materials tracking", "Priority dispatch"] },
      { name: "Enterprise", price: "$999", unit: "/mo", features: ["Unlimited sites", "Custom workflows", "API integration", "Dedicated PM", "SLA guarantees"] },
    ],
    stats: [
      { value: "$12B", label: "FL construction market" },
      { value: "24hr", label: "Pro deployment" },
      { value: "0", label: "Compliance headaches" },
    ],
  },
};

// ─── Segment-Specific Content ───────────────────────────────────────────
const segmentContent: Record<Segment, {
  features: { icon: React.ElementType; title: string; desc: string }[];
  integrations: string[];
  useCases: { title: string; desc: string }[];
}> = {
  pm: {
    features: [
      { icon: LayoutDashboard, title: "Multi-Property Dashboard", desc: "Monitor every property from one view — open work orders, scheduled services, spend-to-date, and pro performance." },
      { icon: RefreshCw, title: "Unit-Turn Coordination", desc: "Automate the full turn cycle: cleaning, painting, repairs, landscaping — all dispatched and tracked in sequence." },
      { icon: Bell, title: "Tenant Communication Portal", desc: "Tenants submit requests directly. You approve, we dispatch. No phone tag, no lost emails." },
      { icon: FileText, title: "Consolidated Weekly Invoicing", desc: "One invoice per week across all properties. Line-item detail by property, service type, and pro." },
    ],
    integrations: ["AppFolio", "Buildium", "Yardi", "Excel/CSV", "QuickBooks", "Salesforce"],
    useCases: [
      { title: "Portfolio-Wide Maintenance", desc: "Schedule recurring services across all properties — landscaping, pool cleaning, pressure washing — with volume pricing." },
      { title: "Emergency Dispatch", desc: "After-hours pipe burst? Our AI matches the nearest available pro and dispatches within 2 hours, with real-time updates to your phone." },
      { title: "Unit Turn Automation", desc: "Tenant moves out Friday, new tenant moves in Monday. UpTend coordinates cleaning, painting, and handyman work to hit your deadline." },
    ],
  },
  hoa: {
    features: [
      { icon: BarChart3, title: "Board Reporting Dashboard", desc: "Auto-generated reports for your board meetings — spending by category, vendor performance, compliance status." },
      { icon: Wrench, title: "Common Area Management", desc: "Pool decks, clubhouses, walking trails, parking lots — schedule and track every common area service." },
      { icon: ClipboardList, title: "Violation Tracking", desc: "Flag properties that need remediation. Auto-dispatch approved vendors to handle violations with photo proof of completion." },
      { icon: Bell, title: "Resident Portal", desc: "Residents submit maintenance requests through a branded portal. Track status in real-time without calling the management office." },
    ],
    integrations: ["Excel/CSV", "QuickBooks", "HubSpot", "Buildium"],
    useCases: [
      { title: "Seasonal Common Area Refresh", desc: "Spring landscaping, fall gutter cleaning, holiday pressure washing — schedule seasonal services for the entire community in one click." },
      { title: "Violation Remediation", desc: "Board approves a violation notice? We dispatch the right pro, document the fix with photos, and close the ticket automatically." },
      { title: "Storm Response", desc: "After a hurricane, submit one emergency request. We deploy crews for tree removal, pressure washing, and debris cleanup across the entire community." },
    ],
  },
  construction: {
    features: [
      { icon: Users, title: "Subcontractor Management", desc: "Find, vet, and dispatch specialty subs for finish work — drywall, painting, cleaning, landscaping. All insurance-verified." },
      { icon: HardDrive, title: "Project-Based Tracking", desc: "Organize work orders by project and site. Track progress, spending, and sub performance across all active builds." },
      { icon: Shield, title: "Compliance Built In", desc: "Prevailing wage tracking, insurance certificate management, OSHA compliance documentation — all automated." },
      { icon: FileSpreadsheet, title: "Change Order Management", desc: "Scope changes flow through UpTend. Updated pricing, new dispatch, documentation — no more handshake deals." },
    ],
    integrations: ["Procore", "Monday.com", "Excel/CSV", "QuickBooks", "Salesforce"],
    useCases: [
      { title: "Finish Work Coordination", desc: "Drywall done? UpTend auto-sequences painting, cleaning, and final landscaping. Each sub is dispatched as the previous one completes." },
      { title: "Multi-Site Cleanup", desc: "Managing 10 active builds? Schedule post-construction cleanup across all sites with one request. We handle the logistics." },
      { title: "Warranty Service Dispatch", desc: "Homeowner warranty call comes in? Route it through UpTend for documentation, dispatch, and close-out. Full audit trail for your records." },
    ],
  },
};

// ─── All Integration Platforms ──────────────────────────────────────────
const ALL_INTEGRATIONS = [
  "AppFolio", "Buildium", "Yardi", "Salesforce", "HubSpot",
  "QuickBooks", "Procore", "Monday.com", "Excel/CSV",
  "ServiceTitan", "Jobber", "Housecall Pro",
];

export default function Business() {
  usePageTitle("UpTend for Business | Property Services Platform");
  const [activeSegment, setActiveSegment] = useState<Segment>("pm");
  const data = segmentData[activeSegment];
  const content = segmentContent[activeSegment];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BusinessHeader />

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto text-center">
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
            with one AI-powered platform. Fully insured pros, real-time tracking, weekly billing.
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
          <p className="text-slate-400 text-center mb-8">Plus transaction fees on completed services. Volume discounts: 2.5% (10+ jobs) · 5% (25+) · 7.5% (50+)</p>

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

      {/* Segment-Specific Features & Use Cases */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-4">
              Built for {segments.find(s => s.id === activeSegment)?.label}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Features That Fit Your Workflow</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every segment gets tailored tools. Here's what {segments.find(s => s.id === activeSegment)?.label} teams use most.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 gap-6 mb-16">
            {content.features.map((f) => (
              <Card key={f.title} className="bg-slate-800/50 border-slate-700 hover:border-orange-500/30 transition-colors">
                <CardContent className="p-6 flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integrations for this segment */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-center mb-6">
              Integrates with your {segments.find(s => s.id === activeSegment)?.label?.toLowerCase()} stack
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {content.integrations.map((name) => (
                <Badge key={name} className="bg-slate-800 text-slate-200 border-slate-600 px-4 py-2 text-sm font-medium">
                  <Plug className="w-3.5 h-3.5 mr-2 text-orange-400" />
                  {name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="text-xl font-bold text-center mb-8">Real-World Use Cases</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {content.useCases.map((uc) => (
                <Card key={uc.title} className="bg-slate-800/30 border-slate-700/50">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-orange-400 mb-3">{uc.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{uc.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Works With Your Tools */}
      <section id="integrations" className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <Plug className="w-12 h-12 text-orange-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Works With Your Tools</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">
            We plug into your existing workflow — no system replacement needed. Keep your CRM, your accounting software, and your spreadsheets.
            UpTend syncs with all of them.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {ALL_INTEGRATIONS.map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-5 py-2.5 text-sm font-medium text-slate-200 hover:border-orange-500/40 transition-colors"
              >
                <Plug className="w-4 h-4 text-orange-400" />
                {name}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Don't see your platform? We support custom API integrations and CSV import/export for any system.
          </p>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Run Operations</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: "AI-Powered Dispatch", desc: "Automatic pro matching based on skills, location, ratings, and availability" },
              { icon: Shield, title: "Insurance Verified", desc: "Every pro's GL insurance verified. Expired = blocked from your jobs" },
              { icon: Eye, title: "Real-Time Tracking", desc: "GPS tracking, photo documentation, live status updates to your dashboard" },
              { icon: FileText, title: "Weekly Billing", desc: "Net Weekly invoices with line-item detail. No surprises, no chasing" },
              { icon: Camera, title: "Photo Documentation", desc: "Before & after photos on every job. Full visual audit trail for your records" },
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

      {/* Value / Safety / Trust Pillars */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built on Value, Safety & Trust</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BadgeCheck,
                pillar: "VALUE",
                title: "Transparent Pricing",
                desc: "AI-powered quoting means no guessing and no haggling. Guaranteed ceiling prices locked at booking. Weekly invoicing with line-item detail.",
                color: "text-orange-400",
                bg: "bg-orange-500/15",
              },
              {
                icon: ShieldCheck,
                pillar: "SAFETY",
                title: "Fully Verified Pros",
                desc: "Every pro is background-checked, GL insured up to $1M, and tracked in real-time. Expired insurance = automatically blocked from your jobs.",
                color: "text-blue-400",
                bg: "bg-blue-500/15",
              },
              {
                icon: Handshake,
                pillar: "TRUST",
                title: "Fair for Everyone",
                desc: "We treat pros like professionals — fair pay, instant payouts, no lead fees. Happy pros deliver better work for your properties.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/15",
              },
            ].map((p) => (
              <Card key={p.pillar} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className={`w-14 h-14 rounded-lg ${p.bg} flex items-center justify-center mx-auto mb-4`}>
                    <p.icon className={`w-7 h-7 ${p.color}`} />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest ${p.color}`}>{p.pillar}</span>
                  <h3 className="text-xl font-bold text-white mt-2 mb-3">{p.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
