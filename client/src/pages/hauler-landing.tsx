import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Droplets, Shield, Package, Calendar,
  ArrowRight, DollarSign, Clock, Zap, Star,
  Gift, UserCheck, Home, Building2,
  HardHat, Smartphone, TrendingUp,
} from "lucide-react";
import { CareerLadder } from "@/components/marketing/career-ladder";
import { Footer } from "@/components/landing/footer";
import { Logo } from "@/components/ui/logo";

const perks = [
  { icon: DollarSign, title: "Instant Payouts", description: "Upload the 'After' photo, get paid instantly. No waiting 2 weeks." },
  { icon: Shield, title: "$1M Insurance", description: "We cover your liability on every job. You work safe, we handle the risk." },
  { icon: Truck, title: "Fill the Gaps", description: "Already have a route? Pick up a quick job on your way home. Zero marketing cost." },
];

const safetyPromises = [
  { icon: Shield, title: "Fully Insured", text: "Every job backed by $1,000,000 Liability Policy." },
  { icon: UserCheck, title: "Background Verified", text: "Strict multi-state criminal background check." },
  { icon: Home, title: "Property Protection", text: "Equipment safe for all surfaces and landscapes." },
  { icon: Building2, title: "HOA Compliant", text: "Meets Central Florida HOA standards." },
];

export default function HaulerLanding() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-pro-landing">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="w-10 h-10" textClassName="text-xl" />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/pro/login">
                <Button variant="ghost" data-testid="button-pro-login">
                  Log In
                </Button>
              </Link>
              <Link href="/pro/signup">
                <Button data-testid="button-pro-signup-header">
                  Apply Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-slate-900 dark:bg-slate-950 text-white pt-24 pb-32" data-testid="section-pro-hero">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="text-pro-headline">
              Real Jobs. Fair Pay. <br />Verified Impact.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-4" data-testid="text-pro-subheadline">
              UpTend matches you with real jobs, pays you fairly, and automatically builds your verified track record.
              11 service verticals. One transparent platform.
            </p>
            <p className="text-sm font-semibold text-orange-400 mb-10" data-testid="text-pro-hook">
              Avg. Orlando Pro Earns $1,200/Week.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
              <Link href="/pro/signup">
                <Button
                  size="lg"
                  className="gap-2 text-lg bg-green-500 border-green-500 text-slate-900 font-bold"
                  data-testid="button-pro-apply"
                >
                  Start Earning (Apply) <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-900 dark:bg-slate-950 text-white overflow-hidden relative" data-testid="section-copilot">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />

          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 text-orange-400 font-mono text-sm mb-6" data-testid="badge-built-for-earners">
                  <HardHat className="w-4 h-4" />
                  <span>BUILT FOR EARNERS</span>
                </div>
                <h2 className="text-4xl font-bold mb-6" data-testid="text-copilot-headline">
                  Your Business. <br />
                  <span className="text-slate-400">Backed by Verified Data.</span>
                </h2>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  UpTend Pro is more than an app. It&rsquo;s a transparent system that handles your marketing, logistics, and back-office with full accountability.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <Smartphone className="w-6 h-6 text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white" data-testid="text-upselling-title">Automated Upselling</h4>
                      <p className="text-sm text-slate-400 mt-1" data-testid="text-upselling-desc">
                        Our app detects opportunities (like a dirty driveway) and sells them to the customer for you. You just click &ldquo;Accept&rdquo; and earn more.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <TrendingUp className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white" data-testid="text-career-title">Algorithmic Career Path</h4>
                      <p className="text-sm text-slate-400 mt-1" data-testid="text-career-desc">
                        Start as a Rookie. Our data tracks your reliability, not just ratings. Unlock higher tiers, better pay, and lower fees automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <Link href="/pro/signup">
                    <Button
                      className="bg-white border-white text-slate-900 font-bold gap-2"
                      size="lg"
                      data-testid="button-copilot-apply"
                    >
                      Download the OS <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-[100px] opacity-20 rounded-full" />
                <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl" data-testid="card-copilot-preview">
                  <div className="font-mono text-xs text-green-400 mb-4 bg-slate-900 p-4 rounded-lg border border-slate-700">
                    &gt; System.scan(property_id: 1024) <br />
                    &gt; Opportunity_Detected: Driveway_Clean <br />
                    &gt; Est_Revenue: $150.00 <br />
                    &gt; Status: <strong>APPROVED</strong>
                  </div>

                  <div className="bg-slate-700 rounded-lg p-6 mb-4 border border-slate-600">
                    <div className="flex justify-between items-center gap-4 mb-2 flex-wrap">
                      <span className="text-white font-bold">New Job Alert</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        98% Match
                      </Badge>
                    </div>
                    <p className="text-slate-300 text-sm">Pressure Washing - 2.1 miles away</p>
                    <div className="mt-4 flex gap-2">
                      <div className="h-2 w-full bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end gap-4 flex-wrap">
                    <div>
                      <p className="text-slate-400 text-xs">Projected Wk Earnings</p>
                      <p className="text-3xl font-bold text-white" data-testid="text-copilot-earnings">$1,450.00</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 -mt-16" data-testid="section-roles-table">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            <Card className="shadow-2xl overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-3xl font-bold text-center mb-8" data-testid="text-roles-headline">
                  Find Your Perfect Role
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" data-testid="table-roles">
                    <thead>
                      <tr className="border-b-2 border-muted">
                        <th className="p-4 text-muted-foreground font-medium">Role</th>
                        <th className="p-4 text-muted-foreground font-medium">Tools Required</th>
                        <th className="p-4 text-muted-foreground font-medium">Avg. Pay (Orlando)</th>
                        <th className="p-4 text-muted-foreground font-medium">Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      <tr data-testid="row-role-pro">
                        <td className="p-4 font-bold">
                          <span className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-primary" /> Junk Removal Pro
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">Pickup Truck / Trailer</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">$150 - $400 / job</td>
                        <td className="p-4"><Badge variant="secondary">Medium</Badge></td>
                      </tr>
                      <tr data-testid="row-role-cleaning">
                        <td className="p-4 font-bold">
                          <span className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-primary" /> Cleaning Pro
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">Pressure Washer (3000 PSI)</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">$99 - $250 / job</td>
                        <td className="p-4"><Badge variant="secondary">Easy</Badge></td>
                      </tr>
                      <tr data-testid="row-role-mover">
                        <td className="p-4 font-bold">
                          <span className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-purple-500" /> Labor / Mover
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">Strong Back (No Truck)</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">$45 / hour</td>
                        <td className="p-4"><Badge variant="destructive">Hard</Badge></td>
                      </tr>
                      <tr data-testid="row-role-gutter">
                        <td className="p-4 font-bold">
                          <span className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-500" /> Gutter Pro
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">20ft Ladder + Safety Gear</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">$150 - $250 / job</td>
                        <td className="p-4"><Badge variant="destructive">Hard</Badge></td>
                      </tr>
                      <tr className="bg-primary/5" data-testid="row-role-consultant">
                        <td className="p-4 font-bold">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-500" /> Consultant (Lvl 3)
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">Smartphone + Certification</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">$99 / visit + Commission</td>
                        <td className="p-4"><Badge variant="secondary">Easy</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-20 text-center" data-testid="section-pro-perks">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-10">Why Pros Choose UpTend</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {perks.map((perk) => (
                <div key={perk.title} className="p-6" data-testid={`card-perk-${perk.title.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <perk.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">{perk.title}</h3>
                  <p className="text-muted-foreground">{perk.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link href="/academy">
                <Button variant="outline" size="lg" data-testid="button-view-academy">
                  View the UpTend Academy Curriculum
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <CareerLadder />

        <section className="py-16 md:py-24 bg-muted/30" data-testid="section-pro-safety">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The UpTend Safety Promise
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We invest in your safety so you can focus on earning.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {safetyPromises.map((p) => (
                <Card key={p.title} className="p-6 text-center" data-testid={`card-safety-${p.title.toLowerCase().replace(/\s/g, "-")}`}>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                    <p.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-primary text-primary-foreground" data-testid="section-pro-referral">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Refer Friends, Earn $50 Each</h2>
            <p className="text-lg opacity-90 mb-8">
              Know someone who&rsquo;d be a great Pro? Refer them and you both earn $50
              after they complete their first job.
            </p>
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-pro-refer">
              <Gift className="w-4 h-4" /> Start Referring
            </Button>
          </div>
        </section>

        <section className="py-20" data-testid="section-pro-final-cta">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-8">
              Join the growing community of verified UpTend Pros in Orlando. Fair pay, proven impact, full accountability.
            </p>
            <Link href="/pro/signup">
              <Button size="lg" className="gap-2" data-testid="button-pro-apply-bottom">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
