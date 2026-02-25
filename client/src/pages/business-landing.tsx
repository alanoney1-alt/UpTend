import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Users, HardHat, Landmark, ArrowRight, Shield,
  TrendingUp, Clock, CheckCircle, Zap, BarChart3, Bot,
  FileText, Phone, ChevronRight, Star, Lock, Globe,
  Briefcase, Award, DollarSign, Layers
} from "lucide-react";

export default function BusinessLanding() {
  usePageTitle("UpTend for Business | Home Services for Enterprise");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950/20" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">AI-Powered Workforce Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            One Platform.<br />
            <span className="text-orange-400">Every Property. Every Service.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4">
            Replace dozens of vendor relationships with one AI-dispatched workforce.
            Background-checked pros, real-time tracking, automated invoicing.
          </p>
          <p className="text-slate-400 mb-10">
            Trusted by property managers, HOAs, construction companies, and government agencies across Central Florida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg h-14">
                Schedule a Demo <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login" asChild>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg h-14">
                Log In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "12", label: "Service Verticals" },
            { value: "100%", label: "Background Checked" },
            { value: "< 2hr", label: "Average Dispatch" },
            { value: "15%", label: "Platform Fee, Flat" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-orange-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Built for Your Industry</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            One platform, configured for your specific needs. Choose your segment.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Building2, title: "Property Management",
                desc: "Manage maintenance across your entire portfolio. AI dispatch, tenant portals, automated invoicing.",
                price: "From $4/door/mo",
                href: "/business?segment=pm",
                features: ["AI-prioritized dispatch", "Tenant request portal", "Weekly consolidated invoicing", "Compliance reporting"]
              },
              {
                icon: Users, title: "HOA Communities",
                desc: "Common areas, unit turns, seasonal maintenance. Full board reporting and ESG tracking.",
                price: "From $3/unit/mo",
                href: "/business?segment=hoa",
                features: ["Common area management", "Board-ready reports", "Violation tracking", "ESG sustainability metrics"]
              },
              {
                icon: HardHat, title: "Construction",
                desc: "Site cleanup, punch lists, post-construction services. Integrated with your project timeline.",
                price: "From $299/mo",
                href: "/business?segment=construction",
                features: ["Site cleanup crews", "Punch list management", "OSHA compliance", "Multi-site dashboard"]
              },
              {
                icon: Landmark, title: "Government",
                desc: "SDVOSB and minority-owned. Federal, state, and local facility maintenance contracts.",
                price: "Custom pricing",
                href: "/business?segment=government",
                features: ["SDVOSB certified", "SAM.gov registered", "Compliance documentation", "NAICS: 561720, 561730+"]
              },
            ].map(seg => (
              <Card key={seg.title} className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all group">
                <CardContent className="p-6">
                  <seg.icon className="w-10 h-10 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{seg.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{seg.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {seg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="text-orange-400 font-semibold text-sm mb-4">{seg.price}</div>
                  <Link href={seg.href} asChild>
                    <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800 group-hover:border-orange-500/50">
                      Learn More <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1", icon: FileText, title: "Submit a Request",
                desc: "Describe what you need through your dashboard, George AI, or API. Attach photos for instant AI estimates."
              },
              {
                step: "2", icon: Bot, title: "George Matches Your Pro",
                desc: "Our AI matches the best available pro based on proximity, skill, rating, and your budget. Background-checked and insured."
              },
              {
                step: "3", icon: BarChart3, title: "Track, Pay, Report",
                desc: "Real-time GPS tracking, before/after photos, automated invoicing, and compliance reports delivered to your dashboard."
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-orange-400" />
                </div>
                <div className="text-orange-400 text-sm font-bold mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Capabilities */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Enterprise-Grade Platform</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Everything you need to manage home services at scale.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: "George AI Assistant", desc: "162 tools. Handles dispatch, quoting, scheduling, and customer communication autonomously." },
              { icon: Shield, title: "Background Checked Pros", desc: "Every pro is verified, insured, and background-checked before their first job." },
              { icon: TrendingUp, title: "Real-Time Tracking", desc: "Live GPS tracking, ETA updates, and job status notifications for every service call." },
              { icon: Clock, title: "Same-Day Dispatch", desc: "AI-optimized routing gets a pro to your property in under 2 hours on average." },
              { icon: DollarSign, title: "Transparent Pricing", desc: "Flat 15% platform fee. No hidden costs, no markups. Pros set competitive rates." },
              { icon: BarChart3, title: "Consolidated Reporting", desc: "Weekly invoicing, spend analytics, compliance reports, and board-ready summaries." },
              { icon: Layers, title: "12 Service Verticals", desc: "Junk removal, cleaning, landscaping, pressure washing, handyman, pool, gutters, carpet, moving, demolition, and more." },
              { icon: Globe, title: "API + Integrations", desc: "Connect to Jobber, ServiceTitan, QuickBooks, Gusto, AppFolio, Buildium, and more." },
              { icon: Lock, title: "Compliance Built In", desc: "Insurance verification, workers comp tracking, OSHA compliance, and ESG sustainability metrics." },
            ].map(cap => (
              <Card key={cap.title} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-5">
                  <cap.icon className="w-6 h-6 text-orange-400 mb-3" />
                  <h3 className="font-bold mb-1">{cap.title}</h3>
                  <p className="text-slate-400 text-sm">{cap.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Government Contracts Callout */}
      <section className="py-16 bg-gradient-to-r from-orange-600/10 via-slate-900 to-orange-600/10 border-y border-orange-500/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Award className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Minority-Owned. Veteran-Owned. Government-Ready.</h2>
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            UpTend Services LLC is a certified minority-owned, disabled veteran-owned small business (SDVOSB).
            We qualify for federal, state, and local government set-aside contracts.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {[
              { value: "SDVOSB", label: "Veteran-Owned" },
              { value: "8(a)", label: "Minority Business" },
              { value: "$5M", label: "Sole-Source Threshold" },
              { value: "10+", label: "NAICS Codes" },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-orange-400">{s.value}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/business?segment=government" asChild>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8">
              Government Contracting <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Small Business Tools */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Tools for Small Business Owners</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            George is not just for customers. He teaches you how to run and scale your home services business.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, title: "Business Plan Builder", desc: "George walks you through creating a complete business plan, step by step. Financial projections, startup costs, market analysis." },
              { icon: DollarSign, title: "Bookkeeping Coach", desc: "Chart of accounts, tax strategy, QuickBooks setup, S-Corp election guidance, deduction tracking." },
              { icon: Users, title: "Hiring Guide", desc: "W-2 vs 1099, job descriptions, Orlando pay rates, onboarding checklists, FL labor law compliance." },
              { icon: TrendingUp, title: "Pricing Strategy", desc: "Cost-plus formulas, market rate research, when to raise prices, minimum job charges, emergency pricing." },
              { icon: Star, title: "Marketing Playbook", desc: "Google Business Profile optimization, Local SEO, Google Ads, referral programs, review generation." },
              { icon: Shield, title: "Licensing + Insurance", desc: "FL DBPR licensing by trade, general liability, workers comp requirements, bonding, permits." },
            ].map(tool => (
              <Card key={tool.title} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-5">
                  <tool.icon className="w-6 h-6 text-orange-400 mb-3" />
                  <h3 className="font-bold mb-1">{tool.title}</h3>
                  <p className="text-slate-400 text-sm">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-t from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Simplify Your Operations?</h2>
          <p className="text-slate-400 text-lg mb-8">
            One platform. One vendor. Every property covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg h-14">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:+14073383342">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg h-14">
                <Phone className="mr-2 w-5 h-5" /> (407) 338-3342
              </Button>
            </a>
          </div>
          <p className="text-slate-500 text-sm">
            Or chat with George. He knows everything about the platform.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
