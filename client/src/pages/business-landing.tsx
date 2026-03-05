import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Users, HardHat, Landmark, ArrowRight, Shield,
  TrendingUp, Clock, CheckCircle, Zap, BarChart3, Bot,
  Phone, ChevronRight, Star, Camera, Search, Share2,
  Award, DollarSign, MessageCircle, Megaphone, Globe,
  LineChart, UserCheck, Wrench, FileText, Target, Eye,
  Brain, Timer, PiggyBank, Workflow, Cpu, ScanLine,
  ClipboardCheck, Truck, BadgeCheck, Scale
} from "lucide-react";

export default function BusinessLanding() {
  usePageTitle("UpTend for Business | AI-Powered Efficiency for Every Industry");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Hero — Universal AI Message */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/site/hero-business.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/85" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-orange-950/20" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <Brain className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">AI-Powered Business Solutions</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            We Solve Problems<br />
            <span className="text-orange-400">With Artificial Intelligence.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4">
            Your business has bottlenecks. Manual processes eating hours. Money leaking through cracks you can't see.
            We identify those problems and deploy AI to eliminate them.
          </p>
          <p className="text-slate-400 mb-10">
            Saving time. Cutting costs. Creating efficiency. Across every industry we touch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg h-14">
                Schedule a Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login" asChild>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg h-14">
                Partner Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Universal Value Props — What AI Does For ANY Business */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-4">What AI Changes For Your Business</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            It doesn't matter what industry you're in. These problems are universal. Our AI solves them.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Timer, title: "Eliminate Wasted Time",
                desc: "Every manual process that eats your day — scheduling, quoting, follow-ups, reporting — gets automated. Your team focuses on the work that actually makes money.",
                stat: "40+ hrs/mo saved",
              },
              {
                icon: PiggyBank, title: "Cut Costs Immediately",
                desc: "Replace 4-6 separate vendors and tools with one platform. Stop paying for things that don't produce measurable results.",
                stat: "$35K-$160K/yr saved",
              },
              {
                icon: Cpu, title: "AI That Works 24/7",
                desc: "Our AI agent George never sleeps. Nights, weekends, holidays — he's handling tasks, capturing data, and making sure nothing falls through the cracks.",
                stat: "230 AI tools",
              },
              {
                icon: LineChart, title: "See Your ROI In Real Time",
                desc: "Every dollar tracked from first impression to final deposit. No guessing what's working. Your dashboard tells you exactly where your money is going and what it's producing.",
                stat: "Full funnel tracking",
              },
            ].map(item => (
              <Card key={item.title} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <item.icon className="w-10 h-10 text-orange-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{item.desc}</p>
                  <div className="text-orange-400 font-bold text-sm">{item.stat}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work — Universal Process */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Our Process</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            We don't sell you a box of features. We diagnose your problems and build the solution.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1", icon: MessageCircle, title: "Consultation",
                desc: "We sit down and map your operations. Where are you losing time? Where's money leaking? What's the one thing that keeps you up at night?"
              },
              {
                step: "2", icon: Workflow, title: "Custom Build",
                desc: "We configure our AI platform to solve your specific problems. No generic setup. Every dashboard, every automation, every tool is tailored to your business."
              },
              {
                step: "3", icon: Zap, title: "Live in 7-10 Days",
                desc: "We don't take months. Your system goes live, your team gets trained, and you start seeing results within the first two weeks."
              },
              {
                step: "4", icon: LineChart, title: "Measure Everything",
                desc: "Your dashboard shows the impact. Time saved, money saved, revenue generated. We prove our value every single month."
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-orange-400" />
                </div>
                <div className="text-orange-400 text-sm font-bold mb-2">STEP {item.step}</div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Segments — Specific Problems, Specific Solutions */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Solutions By Industry</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Same AI backbone. Different problems solved. Here's exactly what we do for each industry.
          </p>

          {/* HVAC / Home Service Companies */}
          <div className="mb-8">
            <Card className="bg-slate-900 border-orange-500/30 border-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Wrench className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">HVAC & Home Service Companies</h3>
                    <p className="text-orange-400 text-sm font-medium">Marketing + AI + Operations</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  You're great at fixing things. You don't have time to market yourself, manage your online presence, or answer calls at 9 PM. We do all of it.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">Your Problems</h4>
                    <ul className="space-y-2">
                      {[
                        "Missing 30-40% of calls after hours — each one worth $500-$2,000",
                        "No time to post on social media or manage your website",
                        "Driving across town to give quotes that don't close",
                        "Paying $6,000-$14,000/mo across 4-6 separate vendors",
                        "No clue which marketing actually brings in revenue",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">Our AI Solution</h4>
                    <ul className="space-y-2">
                      {[
                        "George AI answers every call, chat, and text 24/7 — zero missed leads",
                        "AI photo quotes: customer sends a pic, you quote over the phone. No truck roll.",
                        "SEO pages ranking for your service in your specific neighborhoods",
                        "Social media content created, reviewed by a real CMO, and posted daily",
                        "ROI dashboard: every impression, lead, and dollar tracked to the source",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-2xl font-bold text-orange-400">Starting at $499/mo</span>
                    <span className="text-slate-400 ml-2">+ $1,000 setup. Every partnership is custom.</span>
                  </div>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* HOA Communities */}
          <div className="mb-8">
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">HOA Communities</h3>
                    <p className="text-orange-400 text-sm font-medium">Cite. Enforce. Cure.</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  Violation management is broken. Notices go out late, enforcement is inconsistent, homeowners have no easy path to fix the problem. We automate the entire lifecycle.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">Your Problems</h4>
                    <ul className="space-y-2">
                      {[
                        "Violation notices are manual, inconsistent, and slow",
                        "No efficient way to track enforcement from citation to cure",
                        "Homeowners don't know how to fix violations or what it should cost",
                        "Uncollected fines and unresolved violations pile up",
                        "Board members want reports you don't have time to create",
                        "No way to verify who's entering the community for service work",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">Our AI Solution</h4>
                    <ul className="space-y-2">
                      {[
                        "AI violation detection: snap a photo, AI identifies the issue and auto-generates the notice",
                        "Full enforcement tracking from citation through cure with automated escalation",
                        "Homeowner gets a cure option with transparent cost estimate and a matched, vetted pro",
                        "Payment processing and fine tracking built into the platform",
                        "Board-ready compliance reports generated automatically",
                        "QR code guest passes for verified pros entering the community",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-slate-400">Custom pricing per community. We build around your specific pain points.</span>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Management */}
          <div className="mb-8">
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Property Management</h3>
                    <p className="text-orange-400 text-sm font-medium">AI-powered maintenance operations</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  Managing maintenance across a portfolio of properties is a logistics nightmare. Tenant requests, vendor coordination, invoicing, compliance — it's all manual and it's all slow. We fix that.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">Your Problems</h4>
                    <ul className="space-y-2">
                      {[
                        "Tenant maintenance requests get lost or delayed",
                        "Coordinating vendors across multiple properties is chaos",
                        "No real-time visibility into job status or vendor location",
                        "Invoicing is manual, slow, and full of errors",
                        "Compliance documentation is scattered across email and spreadsheets",
                        "You're spending too much on vendors who don't perform",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">Our AI Solution</h4>
                    <ul className="space-y-2">
                      {[
                        "AI-prioritized dispatch: requests triaged and routed to the right vendor automatically",
                        "Tenant portal: requests submitted, tracked, and updated without calling your office",
                        "Real-time GPS tracking and job status for every service call",
                        "Automated invoicing from job completion to payment collection",
                        "Compliance dashboard: insurance, workers comp, and vendor credentials verified automatically",
                        "Spend analytics: see exactly where your maintenance budget goes and what's overpriced",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-slate-400">Custom pricing per portfolio. Scales with your property count.</span>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Construction */}
          <div className="mb-8">
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <HardHat className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Construction & Development</h3>
                    <p className="text-orange-400 text-sm font-medium">Workforce management meets AI</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  Construction runs on crews, schedules, and subcontractors — and it all breaks down when communication is manual. We bring AI-powered coordination to your jobsites.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">Your Problems</h4>
                    <ul className="space-y-2">
                      {[
                        "Subcontractor scheduling is phone calls, texts, and chaos",
                        "Punch lists and closeout items fall through the cracks",
                        "No centralized view of who's on which site and when",
                        "Compliance docs (insurance, OSHA, certifications) are scattered",
                        "Revenue is lumpy — no pipeline visibility for upcoming work",
                        "Site cleanup and post-construction services are hard to staff",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">Our AI Solution</h4>
                    <ul className="space-y-2">
                      {[
                        "AI-managed scheduling: subs assigned by proximity, skill, and availability",
                        "Digital punch lists with photo documentation and automated follow-up",
                        "Multi-site dashboard: see every crew, every job, every status in real time",
                        "Automated compliance tracking: insurance expiry alerts, cert verification, OSHA logs",
                        "Pipeline forecasting: AI analyzes your job flow and predicts revenue and labor needs",
                        "On-demand workforce: tap into our vetted pro network for cleanup, labor, and specialty work",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-slate-400">Custom pricing based on crew size and site count.</span>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Government */}
          <div>
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Landmark className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Government & Municipal</h3>
                    <p className="text-orange-400 text-sm font-medium">SDVOSB certified. Mission-ready.</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  Government facility maintenance is held back by paperwork, slow procurement, and outdated systems. We bring AI efficiency to public sector operations while meeting every compliance requirement.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">The Challenges</h4>
                    <ul className="space-y-2">
                      {[
                        "Procurement cycles are slow and vendor management is manual",
                        "Code enforcement and violation tracking is paper-based",
                        "No real-time visibility into maintenance operations",
                        "Compliance reporting requires hours of manual compilation",
                        "Facility maintenance costs keep climbing with no efficiency gains",
                        "Small business set-aside goals are hard to meet with qualified vendors",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">Our AI Solution</h4>
                    <ul className="space-y-2">
                      {[
                        "AI-powered code enforcement: photo-based violation detection and automated notice generation",
                        "Same cite/enforce/cure system proven in HOA communities, scaled to city level",
                        "Real-time facility maintenance dashboard with GPS tracking and automated dispatch",
                        "Compliance reports generated automatically — audit-ready at all times",
                        "AI-optimized routing and scheduling reduces maintenance costs 20-40%",
                        "SDVOSB certified, SAM.gov registered, sole-source up to $5M",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { value: "SDVOSB", label: "Veteran-Owned" },
                      { value: "8(a)", label: "Minority Business" },
                      { value: "$5M", label: "Sole-Source Threshold" },
                      { value: "10+", label: "NAICS Codes" },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="text-lg font-bold text-orange-400">{s.value}</div>
                        <div className="text-xs text-slate-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Link href="/business/onboarding" asChild>
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                        Government Contracting <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Cost Comparison — HVAC Specific */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">The Math: Home Service Companies</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            The average home service company in Orlando is paying $6,000-$14,000/month across 4-6 separate tools. Here's what that same coverage looks like on UpTend.
          </p>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Without UpTend
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { vendor: "CRM + Dispatch (ServiceTitan)", cost: "$2,450-$3,980" },
                        { vendor: "Website + SEO Agency", cost: "$1,000-$5,000" },
                        { vendor: "Answering Service", cost: "$200-$500" },
                        { vendor: "Review Software", cost: "$299-$399" },
                        { vendor: "Call Tracking", cost: "$45-$145" },
                        { vendor: "GPS / Fleet Tracking", cost: "$250-$450" },
                        { vendor: "Social Media", cost: "$500-$2,000" },
                      ].map(item => (
                        <li key={item.vendor} className="flex justify-between text-sm">
                          <span className="text-slate-400">{item.vendor}</span>
                          <span className="text-red-400 font-mono">{item.cost}/mo</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm pt-3 border-t border-slate-700">
                        <span className="text-white font-bold">6-7 vendors. 6-7 logins. 6-7 bills.</span>
                        <span className="text-red-400 font-bold font-mono">$4,744-$12,474</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> With UpTend
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { feature: "George AI (calls, chat, SMS, 24/7)", cost: "Included" },
                        { feature: "SEO Neighborhood Pages", cost: "Included" },
                        { feature: "Social Media + CMO Oversight", cost: "Included" },
                        { feature: "Review Generation", cost: "Included" },
                        { feature: "Partner Dashboard + CRM", cost: "Included" },
                        { feature: "Job Scheduling + Dispatch", cost: "Included" },
                        { feature: "AI Photo Quotes", cost: "Included" },
                      ].map(item => (
                        <li key={item.feature} className="flex justify-between text-sm">
                          <span className="text-slate-300">{item.feature}</span>
                          <span className="text-green-400 font-mono">{item.cost}</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm pt-3 border-t border-slate-700">
                        <span className="text-white font-bold">1 platform. 1 login. 1 bill.</span>
                        <span className="text-green-400 font-bold font-mono">Starting $499/mo</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                  <p className="text-green-400 text-3xl font-bold mb-1">Save $35,000 - $160,000 / year</p>
                  <p className="text-slate-400">More leads. More reviews. Zero missed calls. Less money out the door.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Businesses Choose UpTend</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            We're not another SaaS tool. We're a partner that deploys AI to solve your actual problems.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UserCheck, title: "Human in the Loop", desc: "AI does the heavy lifting. Humans provide oversight, nuance, and quality control. Your brand never sounds like a robot." },
              { icon: Scale, title: "Consultative, Not Cookie-Cutter", desc: "No tiers. No boxes. We diagnose your problems and build the right solution. Every partnership is different." },
              { icon: Eye, title: "Full Transparency", desc: "You see every number. Every impression, every lead, every dollar. We prove our value on your dashboard, every month." },
              { icon: Zap, title: "Fast Deployment", desc: "We don't take 6 months to implement. Your custom system goes live in 7-10 days. You see results immediately." },
              { icon: BadgeCheck, title: "Veteran-Owned", desc: "SDVOSB and minority-owned. Government-ready. We built this company to serve — in business the same way we served in uniform." },
              { icon: TrendingUp, title: "Compounds Over Time", desc: "SEO builds. Reviews accumulate. Data sharpens the AI. The longer you're with us, the more valuable the platform becomes." },
            ].map(item => (
              <Card key={item.title} className="bg-slate-900/50 border-slate-800">
                <CardContent className="p-5">
                  <item.icon className="w-6 h-6 text-orange-400 mb-3" />
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-t from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Your Business Has Problems.</h2>
          <h2 className="text-4xl font-bold text-orange-400 mb-6">We Have AI.</h2>
          <p className="text-slate-400 text-lg mb-8">
            Every hour wasted on manual work is money left on the table.
            Let's find your bottlenecks and eliminate them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg h-14">
                Schedule Your Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
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
