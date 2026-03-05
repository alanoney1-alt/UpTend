import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Users, ArrowRight, Shield,
  TrendingUp, Clock, CheckCircle, Zap, BarChart3,
  Phone, ChevronRight, Star, Camera, Search, Share2,
  Award, DollarSign, MessageCircle, Megaphone, Globe,
  LineChart, UserCheck, Wrench, FileText, Target, Eye,
  Timer, PiggyBank, Workflow, Scale,
  BadgeCheck, ScanLine, ClipboardCheck, Truck
} from "lucide-react";

export default function BusinessLanding() {
  usePageTitle("UpTend for Business | One Platform. Problems Solved.");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/site/hero-business.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/85" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-orange-950/20" />
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            One platform.<br />
            <span className="text-orange-400">Problems solved.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            Whether you need more customers, fewer headaches, or both — we build the system around your business and have you live in 10 days.
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

      {/* Three Truths */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">More revenue.</h3>
              <p className="text-slate-400">
                We connect your business to the customers already looking for you. Every lead captured. Every call answered. Your phone rings more.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
                <PiggyBank className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Less waste.</h3>
              <p className="text-slate-400">
                One platform replaces the 4-6 tools bleeding your budget. One login. One bill. One team that actually knows your business.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto mb-5">
                <Eye className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Full visibility.</h3>
              <p className="text-slate-400">
                Every dollar tracked from first impression to final payment. Your dashboard tells the truth. No vanity metrics. No guessing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Live in 10 Days</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            We don't sell you a box of features. We diagnose your problems and build the solution.
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1", icon: MessageCircle, title: "Consultation",
                desc: "We sit down and map your operations. Where are you losing time? Where's money leaking? What keeps you up at night?"
              },
              {
                step: "2", icon: Workflow, title: "Custom Build",
                desc: "We build your platform to solve your specific problems. No generic setup. Every dashboard, every automation, every tool is tailored to your business."
              },
              {
                step: "3", icon: Zap, title: "Go Live",
                desc: "Your system goes live, your team gets trained, and you start seeing results within the first two weeks."
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

      {/* Industry Segments */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Built for your industry. Tailored to your problems.</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Same platform. Different problems solved. Here's exactly what we do for you.
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
                    <p className="text-orange-400 text-sm font-medium">Fill your schedule. Stop chasing leads.</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  You're great at the work. You don't have time to market yourself, manage your online presence, or answer calls at 9 PM. We do all of it.
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
                    <h4 className="font-bold text-green-400 mb-3">How We Fix It</h4>
                    <ul className="space-y-2">
                      {[
                        "Every call, chat, and text answered 24/7 — zero missed leads",
                        "Photo quotes: customer sends a pic, you quote over the phone. No truck roll.",
                        "SEO pages ranking for your service in your specific neighborhoods",
                        "Social media content created, reviewed by a real CMO, and posted daily",
                        "Partner dashboard: every lead, every impression, every dollar tracked",
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

          {/* HOA & Property Management — Combined */}
          <div>
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">HOA & Property Management</h3>
                    <p className="text-orange-400 text-sm font-medium">Enforce faster. Resolve smarter. Residents stop complaining.</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  Violation management is broken. Maintenance requests get lost. Reports take forever. We automate the entire lifecycle — from the first photo to the final resolution.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-red-400 mb-3">Your Problems</h4>
                    <ul className="space-y-2">
                      {[
                        "Violation notices are manual, inconsistent, and slow",
                        "No efficient way to track enforcement from citation to cure",
                        "Tenant and homeowner requests get lost or delayed",
                        "Coordinating vendors across multiple properties is chaos",
                        "Board members and owners want reports you don't have time to create",
                        "Uncollected fines and unresolved violations pile up",
                        "No way to verify who's entering the community for service work",
                        "Compliance documentation is scattered across email and spreadsheets",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400 mb-3">How We Fix It</h4>
                    <ul className="space-y-2">
                      {[
                        "Snap a photo → violation identified, notice auto-generated, homeowner notified",
                        "Full enforcement tracking from citation through cure with automated escalation",
                        "Homeowner gets a cure option with transparent cost estimate and a matched, vetted pro",
                        "Tenant portal: requests submitted, tracked, and updated without calling your office",
                        "Automated dispatch: requests triaged and routed to the right vendor automatically",
                        "Board-ready compliance reports and spend analytics generated automatically",
                        "Payment processing and fine tracking built into the platform",
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
                  <span className="text-slate-400">Custom pricing per community or portfolio. We build around your specific pain points.</span>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
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
            The average home service company in Orlando pays $6,000-$14,000/month across 4-6 separate tools. Here's what that same coverage looks like on UpTend.
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
                        { vendor: "Website + SEO Agency", cost: "$1,000-$5,000" },
                        { vendor: "Answering Service", cost: "$200-$500" },
                        { vendor: "Review Software", cost: "$299-$399" },
                        { vendor: "Call Tracking", cost: "$45-$145" },
                        { vendor: "Social Media Management", cost: "$500-$2,000" },
                        { vendor: "CRM / Lead Tracking", cost: "$100-$400" },
                      ].map(item => (
                        <li key={item.vendor} className="flex justify-between text-sm">
                          <span className="text-slate-400">{item.vendor}</span>
                          <span className="text-red-400 font-mono">{item.cost}/mo</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm pt-3 border-t border-slate-700">
                        <span className="text-white font-bold">Multiple vendors. Multiple logins. Multiple bills.</span>
                        <span className="text-red-400 font-bold font-mono">It adds up.</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> With UpTend
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { feature: "24/7 Lead Capture (calls, chat, SMS)", cost: "Included" },
                        { feature: "SEO Neighborhood Pages", cost: "Included" },
                        { feature: "Social Media + CMO Oversight", cost: "Included" },
                        { feature: "Review Generation", cost: "Included" },
                        { feature: "Partner Dashboard + CRM", cost: "Included" },
                        { feature: "Photo Quotes", cost: "Included" },
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
            We're not another software tool. We're a partner that solves your actual problems.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UserCheck, title: "Human in the Loop", desc: "Technology does the heavy lifting. Humans provide oversight, nuance, and quality control. Your brand never sounds like a robot." },
              { icon: Scale, title: "Consultative, Not Cookie-Cutter", desc: "No tiers. No boxes. We diagnose your problems and build the right solution. Every partnership is different." },
              { icon: Eye, title: "Full Transparency", desc: "You see every number. Every impression, every lead, every dollar. We prove our value on your dashboard, every month." },
              { icon: Zap, title: "Fast Deployment", desc: "We don't take 6 months to implement. Your custom system goes live in 7-10 days. You see results immediately." },
              { icon: BadgeCheck, title: "Veteran-Owned", desc: "SDVOSB and minority-owned. Built to serve — in business the same way we served in uniform." },
              { icon: TrendingUp, title: "Compounds Over Time", desc: "SEO builds. Reviews accumulate. Data gets sharper. The longer you're with us, the more valuable the platform becomes." },
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
          <h2 className="text-4xl font-bold mb-4">Your business has problems.</h2>
          <h2 className="text-4xl font-bold text-orange-400 mb-6">We solve them.</h2>
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
