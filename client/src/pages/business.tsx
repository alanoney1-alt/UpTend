import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Home, Store, Leaf, BarChart3,
  Link2, DollarSign, Calendar, Bot, Code, CheckCircle,
  ArrowRight, Shield, TrendingUp, FileText
} from "lucide-react";

const sharedFeatures = [
  { icon: BarChart3, text: "Dedicated business dashboard" },
  { icon: Leaf, text: "ESG compliance reporting (brandable with company logo)" },
  { icon: Calendar, text: "Priority scheduling for all jobs" },
  { icon: Home, text: "Bulk AI Home Scan pricing ($79/unit at 10+, $59/unit at 25+)" },
  { icon: Bot, text: "George AI assistant for your team" },
  { icon: Code, text: "API access for property management software integration" },
];

const audiences = [
  {
    icon: Building2,
    title: "Property Managers",
    desc: "Manage maintenance across your entire portfolio from one dashboard",
  },
  {
    icon: Users,
    title: "HOAs & Communities",
    desc: "Community-wide services with resident self-booking or board-managed scheduling",
  },
  {
    icon: Home,
    title: "Real Estate Professionals",
    desc: "Pre-listing prep, post-sale services, and referral income on every deal",
  },
  {
    icon: Store,
    title: "Commercial Properties",
    desc: "Offices, retail, restaurants — recurring maintenance on autopilot",
  },
];

export default function Business() {
  usePageTitle("UpTend for Business | B2B Property Services Platform");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mb-6 text-sm">
            For Business
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            UpTend for <span className="text-orange-500">Business</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            One platform for every property. Whether you're referring customers or managing maintenance across your portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business/register">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 text-lg">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/business/login">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 text-lg">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Two Business Models */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Two Ways to Partner</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">Choose the model that fits your business</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Referral Partner */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 p-6 border-b border-slate-700">
                <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/40 mb-3">Referral Partner</Badge>
                <h3 className="text-2xl font-bold text-white">Your Customers Pay</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Earn <strong className="text-white">5% revenue share</strong> on every completed job</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Your customers pay normal UpTend pricing</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Monthly payouts via direct deposit</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">Real estate agents</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">HOAs (resident booking)</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">Insurance adjusters</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">Features:</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><Link2 className="w-4 h-4 text-orange-400" /> Referral tracking dashboard</li>
                    <li className="flex items-center gap-2"><Link2 className="w-4 h-4 text-orange-400" /> Branded referral links</li>
                    <li className="flex items-center gap-2"><FileText className="w-4 h-4 text-orange-400" /> Monthly payout reports</li>
                    <li className="flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-400" /> ESG reports for your clients</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Direct Account */}
            <Card className="bg-slate-800/50 border-orange-500/50 overflow-hidden ring-1 ring-orange-500/30">
              <div className="bg-gradient-to-r from-orange-500/30 to-orange-600/20 p-6 border-b border-slate-700">
                <Badge className="bg-orange-500 text-white mb-3">Most Popular</Badge>
                <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/40 mb-3 ml-2">Direct Account</Badge>
                <h3 className="text-2xl font-bold text-white">You Pay, You Save</h3>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                    <div className="text-slate-300">
                      <strong className="text-white">Volume discounts:</strong>
                      <ul className="mt-1 space-y-1 text-sm">
                        <li>10+ jobs/mo = 10% off</li>
                        <li>25+ jobs/mo = 15% off</li>
                        <li>50+ jobs/mo = 20% off</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300">Net-30 consolidated invoicing</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2 font-medium">Perfect for:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">Property managers</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">Commercial properties</Badge>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300">HOAs (from dues)</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">Features:</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-400" /> Multi-property dashboard</li>
                    <li className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-400" /> Bulk booking</li>
                    <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-orange-400" /> Priority scheduling</li>
                    <li className="flex items-center gap-2"><Leaf className="w-4 h-4 text-orange-400" /> Branded ESG compliance reports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Both Models Include */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Both Models Include</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedFeatures.map((f) => (
              <div key={f.text} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <f.icon className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Who It's For</h2>
          <p className="text-slate-400 text-center mb-12">Built for businesses that manage properties at scale</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a) => (
              <Card key={a.title} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <a.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
                  <p className="text-sm text-slate-400">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ESG Differentiator */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Leaf className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The only home services platform with verified ESG compliance reporting
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Institutional investors and property companies increasingly require sustainability documentation. UpTend delivers it automatically.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm">Every job generates a verified impact report</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5">
              <BarChart3 className="w-6 h-6 text-green-400 mx-auto mb-3" />
              <p className="text-slate-300 text-sm">Portfolio-wide ESG dashboard with exportable reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to scale your property services?</h2>
          <Link href="/business/register">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-10 text-lg">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
