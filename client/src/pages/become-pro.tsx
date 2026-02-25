import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Shield, Leaf, Heart, Globe, Video, DollarSign, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const pillars = [
  {
    icon: DollarSign,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    title: "Keep 85% of Every Job",
    desc: "One flat 15% platform fee. No exceptions, no tiers, no games. Plus 100% of tips. Same-day payouts.",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    title: "We Pay for Your Marketing",
    desc: "Zero lead fees. We spend the money to bring customers to you. Your job is to show up, do great work, and build your reputation. We handle the rest.",
  },
  {
    icon: Shield,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Insurance? We've Got You.",
    desc: "Start earning immediately with zero insurance costs. As you grow, we help you get affordable coverage through our insurance partners.",
  },
  {
    icon: Video,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Photo Evidence Protection",
    desc: "We document the exact state of every job so you're never held liable for pre-existing damage. No more \"he-said-she-said.\"",
  },
  {
    icon: Globe,
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    title: "Bilingual by Design",
    desc: "English and Spanish. Our platform speaks your language. The best Pros deserve an interface that respects their native tongue.",
  },
  {
    icon: Leaf,
    iconBg: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    title: "Verified Track Record",
    desc: "Every completed job builds your verified record. This opens doors to high-value enterprise and property management contracts.",
  },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Takes 3 minutes. Pick your services, set your availability." },
  { num: "02", title: "Background Check", desc: "We cover the cost. Once cleared, you're verified on the platform." },
  { num: "03", title: "Set Up Your Profile", desc: "Add your experience, service areas, and certifications. Customers see this when they book." },
  { num: "04", title: "Start Earning", desc: "Get matched with real, pre-paid jobs. Keep 85% of every dollar. Same-day payouts." },
];

export default function BecomePro() {
  const { t } = useTranslation();
  usePageTitle("Become a Pro | UpTend");
  return (
    <div className="min-h-screen bg-background" data-testid="page-become-pro">
      <Header />

      <main id="main-content">
      <section className="bg-slate-950 pt-28 pb-24 px-4 md:px-6 text-center" data-testid="section-pro-hero">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6" data-testid="text-pro-headline">
          {t("become_pro.hero_line1")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
            {t("become_pro.hero_line2")}
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10" data-testid="text-pro-subhead">
          {t("become_pro.hero_desc")}
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/pro/signup">
            <Button size="lg" className="font-bold text-lg" data-testid="button-apply-hero">
              {t("become_pro.apply_join")}
            </Button>
          </Link>
          <Link href="/academy">
            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 font-bold text-lg" data-testid="button-view-academy">
              {t("become_pro.view_credentials")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-orange-50 dark:bg-orange-950/10" data-testid="section-earning-hook">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#F47C20]/10 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-[#F47C20]" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4" data-testid="text-earning-hook-title">
            Your Earning Potential
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
            Real numbers. Real pros. Real income.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#F47C20] mb-2">85%</p>
              <p className="text-sm font-medium">You Keep Per Job</p>
              <p className="text-xs text-muted-foreground mt-1">Flat 15% fee. No hidden costs.</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#F47C20] mb-2">$0</p>
              <p className="text-sm font-medium">Lead Fees</p>
              <p className="text-xs text-muted-foreground mt-1">We pay for your marketing.</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-[#F47C20] mb-2">Same Day</p>
              <p className="text-sm font-medium">Payouts Available</p>
              <p className="text-xs text-muted-foreground mt-1">Finish the job, get paid.</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6" data-testid="section-pro-pillars" id="benefits">
        <h2 className="text-3xl font-bold text-center mb-4" data-testid="text-pillars-title">{t("become_pro.advantage_title")}</h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          {t("become_pro.advantage_desc")}
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

      <section className="bg-muted/50 py-16 md:py-24 px-4 md:px-6" data-testid="section-alan-promise">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="shrink-0">
            <div className="w-32 h-32 bg-primary rounded-full border-4 border-background shadow-xl flex items-center justify-center">
              <span className="text-white font-black text-4xl">A</span>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-alan-quote-title">
              &ldquo;{t("become_pro.alan_quote_title")}&rdquo;
            </h2>
            <p className="text-muted-foreground italic leading-relaxed mb-6" data-testid="text-alan-quote">
              &ldquo;I&rsquo;ve seen how hard it is for high-quality Pros to grow a business when apps keep squeezing them for fees.
              UpTend is about accountability and verified impact. We give you the tools to prove
              you&rsquo;re the best, build your verified track record, and make sure you get paid fairly for it.&rdquo;
            </p>
            <p className="font-bold">&mdash; Alan, Founder of UpTend</p>
          </div>
        </div>
      </section>

      {/* Pro Testimonials */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 px-4 md:px-6" data-testid="section-pro-testimonials">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">{t("become_pro.testimonials_title")}</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t("become_pro.testimonials_desc")}
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <p className="text-muted-foreground italic leading-relaxed mb-4">
                "I switched from Thumbtack. No more paying $40 per lead just to compete with 5 other guys. I keep 85% and get matched with real customers."
              </p>
              <p className="font-bold">Carlos M.</p>
              <p className="text-sm text-muted-foreground">Junk Removal Pro</p>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground italic leading-relaxed mb-4">
                "The certification program helped me stand out. My customers trust me before I even show up because they can verify my credentials."
              </p>
              <p className="font-bold">Maria R.</p>
              <p className="text-sm text-muted-foreground">Home Cleaning Pro</p>
            </Card>
            <Card className="p-6">
              <p className="text-muted-foreground italic leading-relaxed mb-4">
                "I was doing everything through Craigslist. Now I have a real business profile, insurance coverage, and steady bookings."
              </p>
              <p className="font-bold">James W.</p>
              <p className="text-sm text-muted-foreground">Pressure Washing Pro</p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 md:px-6 text-center" data-testid="section-pro-steps">
        <h2 className="text-3xl font-bold mb-12" data-testid="text-steps-title">{t("become_pro.steps_title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="p-6 bg-card border border-border rounded-xl" data-testid={`step-pro-${step.num}`}>
              <span className="text-primary dark:text-orange-400 font-black text-2xl">{step.num}</span>
              <p className="font-bold text-sm mt-2">{step.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Link href="/pro/signup">
            <Button size="lg" className="font-bold text-lg" data-testid="button-apply-bottom">
              {t("become_pro.apply_now")}
            </Button>
          </Link>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
