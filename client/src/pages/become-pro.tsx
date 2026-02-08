import { Link } from "wouter";
import { Shield, Leaf, Heart, Globe, Video, DollarSign, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const pillars = [
  {
    icon: Leaf,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    title: "Verified Green Credentials",
    desc: "Every job you complete on UpTend automatically builds your verified sustainability record. This opens doors to high-value enterprise and property management contracts that require documented environmental impact.",
  },
  {
    icon: Video,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Video Evidence Protection",
    desc: "Our 360\u00B0 video scan protects YOU. No more \"he-said-she-said.\" We document the exact state of the job so you're never held liable for pre-existing damage.",
  },
  {
    icon: Globe,
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    title: "Bilingual by Design",
    desc: "Whether you prefer English or Spanish, our app speaks your language. We believe the best Pros deserve an interface that respects their native tongue.",
  },
  {
    icon: DollarSign,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    title: "Instant Payouts",
    desc: "No waiting two weeks for a check. Complete the job, get paid same-day via Stripe. Your earnings are yours the moment the customer approves.",
  },
  {
    icon: Shield,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    title: "$1M Insurance Coverage",
    desc: "We cover you with blanket liability insurance on every job. No need to carry your own expensive policy to get started.",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    title: "Career Growth Path",
    desc: "Start as an Independent Pro, earn your way to Verified Pro status with higher payouts. The UpTend Academy builds your skills, your income, and your verified impact record.",
  },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Takes 3 minutes." },
  { num: "02", title: "Background Check", desc: "Safety first. We pay for it." },
  { num: "03", title: "Sustainability Credentials", desc: "Learn the UpTend Standard and start building your verified impact record." },
  { num: "04", title: "Go Live", desc: "Claim your first job and start proving your impact." },
];

export default function BecomePro() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-become-pro">
      <Header />

      <section className="bg-slate-950 pt-28 pb-24 px-6 text-center" data-testid="section-pro-hero">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6" data-testid="text-pro-headline">
          Build a Verified <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
            Green Track Record.
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10" data-testid="text-pro-subhead">
          UpTend matches you with real jobs, pays you fairly, and automatically builds your verified green track record.
          Become the first choice for homeowners and property managers who care about sustainability.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/pycker/signup">
            <Button size="lg" className="font-bold text-lg" data-testid="button-apply-hero">
              Apply to Join
            </Button>
          </Link>
          <Link href="/academy">
            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 font-bold text-lg" data-testid="button-view-academy">
              View Credentials Program
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-green-50 dark:bg-green-950/20" data-testid="section-green-hook">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-green-hook-title">
            Your Verified Impact Portfolio
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
            Every job builds your transparent, verified impact record. Property managers and enterprise
            clients choose Pros with proven accountability and measurable sustainability credentials.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center" data-testid="card-green-diversion">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">70%</p>
              <p className="text-sm font-medium">Avg. Landfill Diversion</p>
              <p className="text-xs text-muted-foreground mt-1">Verified per job</p>
            </Card>
            <Card className="p-6 text-center" data-testid="card-green-carbon">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">CO2</p>
              <p className="text-sm font-medium">Carbon Impact Tracked</p>
              <p className="text-xs text-muted-foreground mt-1">Route optimization + offsets</p>
            </Card>
            <Card className="p-6 text-center" data-testid="card-green-certs">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">ESG</p>
              <p className="text-sm font-medium">Credentials Earned</p>
              <p className="text-xs text-muted-foreground mt-1">Shareable with clients</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-6" data-testid="section-pro-pillars" id="benefits">
        <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-pillars-title">The UpTend Pro Advantage</h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Transparent tools, verified protection, and a track record of real impact.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="space-y-4" data-testid={`pillar-${pillar.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className={`w-12 h-12 ${pillar.iconBg} rounded-xl flex items-center justify-center`}>
                <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold">{pillar.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-24 px-6" data-testid="section-alan-promise">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="shrink-0">
            <div className="w-32 h-32 bg-primary rounded-full border-4 border-background shadow-xl flex items-center justify-center">
              <span className="text-white font-black text-4xl">A</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-alan-quote-title">
              &ldquo;I built this because the system was broken for you.&rdquo;
            </h2>
            <p className="text-muted-foreground italic leading-relaxed mb-6" data-testid="text-alan-quote">
              &ldquo;I&rsquo;ve seen how hard it is for high-quality Pros to grow a business when apps keep squeezing them for fees.
              UpTend is about accountability and verified impact. We give you the tools to prove
              you&rsquo;re the best, build your verified green track record, and make sure you get paid fairly for it.&rdquo;
            </p>
            <p className="font-bold">&mdash; Alan, Founder of UpTend</p>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-5xl mx-auto px-6 text-center" data-testid="section-pro-steps">
        <h2 className="text-3xl font-bold mb-12" data-testid="text-steps-title">How to become a Verified Green Pro</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="p-6 bg-card border border-border rounded-xl" data-testid={`step-pro-${step.num}`}>
              <span className="text-primary dark:text-orange-400 font-black text-2xl">{step.num}</span>
              <p className="font-bold text-sm mt-2">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/pycker/signup">
            <Button size="lg" className="font-bold text-lg" data-testid="button-apply-bottom">
              Apply Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
