import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, DollarSign, Shield, TrendingUp,
  CheckCircle, ArrowRight, BarChart3, Clock, Zap,
} from "lucide-react";

const BENEFITS = [
  { icon: Zap, title: "Turn your team into a lead engine", desc: "Pre-qualified, scope-verified jobs delivered directly to your employees. No cold calling, no bidding wars." },
  { icon: DollarSign, title: "Your team keeps 85%. No lead fees.", desc: "One flat 15% platform fee. No per-lead charges, no subscriptions, no hidden costs." },
  { icon: Users, title: "One dashboard for your entire team", desc: "See who is online, track jobs in real-time, manage rates, and view revenue analytics in one place." },
  { icon: Shield, title: "Insurance verified once for all employees", desc: "Your company insurance covers every employee. No individual verification needed." },
  { icon: TrendingUp, title: "Your employees earn on your time AND their own", desc: "Each employee gets their own profile, reviews, and rating. They can also work independently on their own time." },
  { icon: BarChart3, title: "QuickBooks. Gusto. Jobber. All synced.", desc: "Track gross revenue, platform fees, and net payout by employee and service type. Integrations coming soon." },
];

const COMPARISON = [
  { feature: "Lead fees", uptend: "None", traditional: "$15-75 per lead" },
  { feature: "Guaranteed payment", uptend: "Yes, always", traditional: "No" },
  { feature: "Scope-verified jobs", uptend: "Yes", traditional: "No" },
  { feature: "Employee dashboards", uptend: "Included", traditional: "Extra cost" },
  { feature: "Insurance handling", uptend: "Verified once", traditional: "Per employee" },
  { feature: "Bidding required", uptend: "No", traditional: "Yes" },
  { feature: "Price protection", uptend: "Guaranteed ceiling", traditional: "None" },
];

export default function BusinessPartnersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/site/hero-business.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-6 text-sm font-semibold">
            Business Partners
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Partner With UpTend
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Load your entire team, set company rates, and let verified jobs flow directly to your employees. No lead fees. No bidding. Guaranteed payment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/signup">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Why Partner With Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <Card key={i} className="border-slate-800 bg-slate-900/50 shadow-md">
                <CardContent className="p-6">
                  <b.icon className="w-10 h-10 text-orange-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-white">{b.title}</h3>
                  <p className="text-slate-400 text-sm">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Register Your Company", desc: "Sign up, verify insurance once, and add your team members." },
              { step: "2", title: "Set Rates and Go Online", desc: "Set company-wide rates or let employees set individual rates. Toggle online when ready." },
              { step: "3", title: "Receive Verified Jobs", desc: "Jobs are matched to your team automatically. Track everything from one dashboard." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-orange-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-8">UpTend vs Traditional Lead Gen</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left py-3 px-4 text-slate-400">Feature</th>
                  <th className="text-center py-3 px-4 text-orange-500 font-bold">UpTend</th>
                  <th className="text-center py-3 px-4 text-slate-500">Traditional</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-3 px-4 text-sm font-medium text-slate-300">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-sm">
                      <span className="text-green-400 font-medium">{row.uptend}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-500">{row.traditional}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-orange-500/10 border-t border-orange-500/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Grow Your Business?</h2>
          <p className="text-slate-300 mb-8">Join UpTend as a Business Partner and start receiving verified jobs for your team today.</p>
          <Link href="/business/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
