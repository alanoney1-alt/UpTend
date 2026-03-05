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
  LineChart, UserCheck, Wrench, FileText, Target, Eye
} from "lucide-react";

export default function BusinessLanding() {
  usePageTitle("UpTend for Business | Marketing, AI & Operations for Home Service Companies");

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
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 text-sm font-medium">AI-Powered Business Growth Platform</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Stop Losing Leads.<br />
            <span className="text-orange-400">Start Growing Your Business.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-4">
            We handle your marketing, answer your calls 24/7, generate leads, and run your back office.
            You focus on the work.
          </p>
          <p className="text-slate-400 mb-10">
            Trusted by HVAC companies, HOA communities, property managers, and government agencies across Central Florida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/onboarding" asChild>
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg h-14">
                Schedule a Free Consultation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login" asChild>
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg h-14">
                Partner Dashboard Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "230", label: "George AI Tools" },
            { value: "24/7", label: "Lead Capture" },
            { value: "$499", label: "Starting Monthly" },
            { value: "13", label: "Service Verticals" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-orange-400">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What We Do — The Big Picture */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">What We Actually Do For You</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Most home service companies are juggling 4-6 vendors, missing calls after 5 PM, and have no idea which marketing is working. We fix all of that.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Bot, title: "George AI — Your 24/7 Employee",
                items: [
                  "Answers every call and chat — nights, weekends, holidays",
                  "Qualifies leads and captures full job details",
                  "Books appointments on your calendar",
                  "Follows up with customers who didn't book",
                  "Sends review requests after every completed job",
                  "Speaks English and Spanish",
                ],
              },
              {
                icon: TrendingUp, title: "Marketing & Lead Generation",
                items: [
                  "SEO pages that rank for your service + your neighborhoods",
                  "Daily blog posts building your search presence",
                  "Social media content created and posted for you",
                  "Lead scraping — we find people looking for your service online",
                  "Google Business Profile management",
                  "All content reviewed by a real CMO (human in the loop)",
                ],
              },
              {
                icon: BarChart3, title: "Operations & Dashboard",
                items: [
                  "One dashboard: leads, jobs, revenue, reviews",
                  "AI photo quotes — customers send photos, you quote by phone",
                  "Job scheduling and tech dispatch",
                  "Invoicing and payment collection",
                  "ROI tracking: every dollar traced from impression to deposit",
                  "Competitive analysis — know what your rivals are doing",
                ],
              },
            ].map(col => (
              <Card key={col.title} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <col.icon className="w-10 h-10 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold mb-4">{col.title}</h3>
                  <ul className="space-y-3">
                    {col.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Segments — What We Do For EACH Type */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Built For Your Business</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Every partnership is custom. We sit down, identify your pain points, and build the right stack.
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
                    <p className="text-orange-400 text-sm font-medium">Our #1 Partnership</p>
                  </div>
                </div>
                <p className="text-slate-300 text-lg mb-6">
                  You're great at fixing things. You're too busy to market yourself. We handle everything else so you can focus on the work.
                </p>
                <div className="grid md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <h4 className="font-bold text-orange-400 mb-3">What We Solve</h4>
                    <ul className="space-y-2">
                      {[
                        "Missed calls after hours (30-40% of leads lost)",
                        "No time to post on social media or manage SEO",
                        "Wasting gas driving to give quotes that don't close",
                        "Paying $6,000-$14,000/mo across 4-6 different vendors",
                        "No idea which marketing is actually generating revenue",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Target className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-400 mb-3">What You Get</h4>
                    <ul className="space-y-2">
                      {[
                        "George answers every call and chat 24/7 — zero missed leads",
                        "AI photo quotes: customer sends a pic, you quote by phone",
                        "SEO pages ranking for your service in your neighborhoods",
                        "Social media posted daily with a real CMO overseeing it",
                        "ROI dashboard: 'You spent $499. You made $24,000. You saved $43,000/year.'",
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
                    <span className="text-slate-400 ml-2">+ $1,000 setup</span>
                  </div>
                  <Link href="/business/onboarding" asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6">
                      Get Your Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Other Segments Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* HOA */}
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-6">
                <Users className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">HOA Communities</h3>
                <p className="text-orange-400 text-sm font-semibold mb-3">Cite. Enforce. Cure.</p>
                <p className="text-slate-400 text-sm mb-4">
                  We automate your entire violation lifecycle. Property manager snaps a photo, AI identifies the violation, notice goes out automatically. Homeowner gets a cure option with a transparent cost estimate and a matched pro who can fix it.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "AI violation detection from photos",
                    "Automated notice distribution",
                    "Cure option with transparent pricing",
                    "Matched pro for every violation fix",
                    "Security QR passes for gated access",
                    "Board-ready compliance reports",
                    "Payment processing in the app",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="text-orange-400 font-semibold text-sm mb-4">Custom pricing per community</div>
                <Link href="/business?segment=hoa" asChild>
                  <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800">
                    Learn More <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Property Management */}
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-6">
                <Building2 className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Property Management</h3>
                <p className="text-orange-400 text-sm font-semibold mb-3">One vendor. Every property.</p>
                <p className="text-slate-400 text-sm mb-4">
                  Manage maintenance requests, dispatch pros, track jobs, and generate reports across your entire portfolio. George handles tenant communication so your team handles the properties.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "AI-prioritized maintenance dispatch",
                    "Tenant request portal",
                    "George handles tenant calls 24/7",
                    "Automated invoicing and payment tracking",
                    "Vendor credential verification",
                    "Multi-property dashboard",
                    "Compliance and spend reporting",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="text-orange-400 font-semibold text-sm mb-4">Custom pricing per portfolio</div>
                <Link href="/business?segment=pm" asChild>
                  <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800">
                    Learn More <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Government */}
            <Card className="bg-slate-900 border-slate-800 hover:border-orange-500/50 transition-all">
              <CardContent className="p-6">
                <Landmark className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Government Contracts</h3>
                <p className="text-orange-400 text-sm font-semibold mb-3">SDVOSB certified. Ready to perform.</p>
                <p className="text-slate-400 text-sm mb-4">
                  UpTend Services LLC is a certified minority-owned, disabled veteran-owned small business. We qualify for federal, state, and local set-aside contracts up to $5M sole-source.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "SDVOSB certified",
                    "SAM.gov registered",
                    "Sole-source up to $5M threshold",
                    "10+ NAICS codes (561210, 561720+)",
                    "Full compliance documentation",
                    "Facility maintenance at scale",
                    "Vetted, insured workforce",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="text-orange-400 font-semibold text-sm mb-4">Contract-based pricing</div>
                <Link href="/business?segment=government" asChild>
                  <Button variant="outline" size="sm" className="w-full border-slate-700 text-slate-200 hover:bg-slate-800">
                    Learn More <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* The Math — Replace Your Vendors */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Replace 4-6 Vendors With One Platform</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            The average Orlando home service company spends $6,000-$14,000/month across separate tools for CRM, marketing, answering service, reviews, and dispatch. Here's what that looks like on UpTend.
          </p>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Without UpTend */}
                  <div>
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Without UpTend
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { vendor: "ServiceTitan / CRM", cost: "$2,450-$3,980/mo" },
                        { vendor: "SEO Agency", cost: "$1,000-$5,000/mo" },
                        { vendor: "Answering Service", cost: "$200-$500/mo" },
                        { vendor: "Review Software", cost: "$299-$399/mo" },
                        { vendor: "Call Tracking", cost: "$45-$145/mo" },
                        { vendor: "GPS / Fleet Tracking", cost: "$250-$450/mo" },
                        { vendor: "Social Media Manager", cost: "$500-$2,000/mo" },
                      ].map(item => (
                        <li key={item.vendor} className="flex justify-between text-sm">
                          <span className="text-slate-400">{item.vendor}</span>
                          <span className="text-red-400 font-mono">{item.cost}</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-sm pt-3 border-t border-slate-700">
                        <span className="text-white font-bold">Total (6-7 vendors, 6-7 logins)</span>
                        <span className="text-red-400 font-bold font-mono">$4,744-$12,474/mo</span>
                      </li>
                    </ul>
                  </div>
                  {/* With UpTend */}
                  <div>
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> With UpTend
                    </h3>
                    <ul className="space-y-3">
                      {[
                        { feature: "George AI (calls, chat, SMS)", cost: "Included" },
                        { feature: "SEO Neighborhood Pages", cost: "Included" },
                        { feature: "Social Media Management", cost: "Included" },
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
                        <span className="text-white font-bold">Total (1 platform, 1 login)</span>
                        <span className="text-green-400 font-bold font-mono">Starting at $499/mo</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                  <p className="text-green-400 text-3xl font-bold mb-1">Save $35,000 - $160,000 / year</p>
                  <p className="text-slate-400">While getting more leads, more reviews, and zero missed calls.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1", icon: MessageCircle, title: "Free Consultation",
                desc: "We sit down and identify your specific pain points. No generic pitch. We figure out what you actually need."
              },
              {
                step: "2", icon: Wrench, title: "We Build Your Stack",
                desc: "George gets configured for your business. Landing page goes live. SEO pages start building. Social content starts posting."
              },
              {
                step: "3", icon: Zap, title: "Live in 7 Days",
                desc: "Within one week: George is answering calls, your pages are ranking, reviews are automated, and leads are flowing to your dashboard."
              },
              {
                step: "4", icon: LineChart, title: "Track Every Dollar",
                desc: "Your dashboard shows exactly what we generated: impressions, leads, jobs, revenue. Plus what you saved vs. your old vendors."
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

      {/* What Makes Us Different */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Partners Stay</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            This isn't another SaaS tool. It's a partnership.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: UserCheck, title: "Human in the Loop", desc: "Every piece of content is reviewed by a real CMO. Your marketing doesn't sound like ChatGPT. It sounds like your brand." },
              { icon: Eye, title: "Full Funnel Visibility", desc: "From Google impression to cash in your account — every step tracked. You always know your ROI down to the penny." },
              { icon: DollarSign, title: "No Tiers. No Boxes.", desc: "Every partnership is consultative. We build the right package based on what you need and what your budget allows. Add services as you grow." },
              { icon: Search, title: "SEO That Locks In", desc: "Your neighborhood pages live on UpTend and rank on Google. The longer you're with us, the stronger your rankings get. Your SEO compounds over time." },
              { icon: Bot, title: "230 AI Tools", desc: "George isn't a chatbot. He's an AI agent with 230 specialized tools: scheduling, quoting, dispatching, following up, requesting reviews — all autonomous." },
              { icon: Shield, title: "Veteran-Owned. Minority-Owned.", desc: "UpTend Services LLC is SDVOSB certified. Government-ready. Every pro is background-checked and insured." },
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

      {/* Government Callout */}
      <section className="py-16 bg-gradient-to-r from-orange-600/10 via-slate-900 to-orange-600/10 border-y border-orange-500/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Award className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Government-Ready</h2>
          <p className="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">
            SDVOSB certified. SAM.gov registered. 10+ NAICS codes. Sole-source threshold up to $5M.
            Federal, state, and local facility maintenance contracts.
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-t from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Stop Leaving Money on the Table?</h2>
          <p className="text-slate-400 text-lg mb-3">
            Every missed call is $500-$2,000 in lost revenue.
          </p>
          <p className="text-slate-400 text-lg mb-8">
            George catches every one.
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
