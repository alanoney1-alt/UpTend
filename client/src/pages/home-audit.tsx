import { Link } from "wouter";
import {
  ShieldCheck, Video, FileCheck, Leaf, ArrowRight,
  Shield, Camera, ClipboardCheck, Home, Lock,
  Scale, Zap, DollarSign, FileText, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const included = [
  { icon: Camera, text: "AI-powered room-by-room photo inventory" },
  { icon: Video, text: "360\u00B0 video walkthrough with timestamp verification" },
  { icon: ClipboardCheck, text: "Exterior scan: roof, gutters, siding, foundation" },
  { icon: Shield, text: "Safety check: smoke detectors, CO monitors, vents" },
  { icon: Home, text: "Digital asset catalog with estimated valuations" },
  { icon: FileText, text: "Treatment plan with transparent pricing for any issues found" },
  { icon: Leaf, text: "Sustainability baseline assessment" },
  { icon: DollarSign, text: "$49 back on your next booking" },
];

const faqs = [
  {
    q: "Do I need to prepare anything?",
    a: "No preparation needed. Just ensure access to all rooms. The Pro handles everything with their own equipment.",
  },
  {
    q: "Do I really get a credit when I book a service?",
    a: "Yes! You get a $49 credit toward any follow-up service you book within 90 days of your Home Scan.",
  },
  {
    q: "What happens to my data?",
    a: "Your inventory and report are encrypted, stored securely, and belong to you. You control who sees it \u2014 share it with insurers, buyers, or keep it private.",
  },
  {
    q: "How is this different from a home inspection?",
    a: "A home inspection is a one-time pass/fail. The UpTend Home Scan creates a living, data-backed asset record that grows with every service. It\u2019s Intelligence, not just an inspection.",
  },
  {
    q: "Can I transfer my report to a new owner?",
    a: "Absolutely. Your property\u2019s verified maintenance history is fully transferable at sale \u2014 adding documented value and accountability to your listing.",
  },
  {
    q: "Is this useful for renters?",
    a: "Yes. Renters use the Verified Asset Audit as protection for security deposits, documenting condition at move-in and move-out with timestamped proof.",
  },
];

export default function HomeAudit() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-home-audit">
      <Header />

      {/* BRAND-ALIGNED HERO */}
      <section className="pt-28 pb-16 px-6 bg-muted/50 border-b border-border" data-testid="section-audit-hero">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-primary dark:text-orange-400 font-bold tracking-widest text-xs uppercase mb-4 block">
            Home Intelligence \u2022 Protect
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6" data-testid="text-audit-headline">
            The Insurance Shield & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
              Verified Asset Audit.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-10 leading-relaxed" data-testid="text-audit-subhead">
            Every job on UpTend is tracked, every Pro is valued, and every impact is measured. Our Home Scan provides
            <strong className="text-foreground"> built-in accountability</strong> for your wallet, your home, and the environment.
          </p>
          <p className="text-sm font-semibold text-primary dark:text-orange-400 mb-10" data-testid="text-audit-price-hook">
            $99 flat &middot; $49 back on your next booking
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=home_consultation">
              <Button size="lg" className="font-bold text-lg" data-testid="button-audit-book-hero">
                Schedule Your Audit <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="font-bold text-lg" data-testid="button-audit-learn-more">
                How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-6 bg-slate-900 dark:bg-slate-950 border-t border-slate-800" data-testid="section-audit-trust-bar">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              <span>Your Data, Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <span>$1M Liability Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-orange-400" />
              <span>Verified & Accountable</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <span>Report in 24 Hours</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE INSURANCE SHIELD SECTION */}
      <section className="py-24 pb-32 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center" data-testid="section-insurance-shield">
        <div>
          <Badge variant="outline" className="mb-4" data-testid="badge-value-insurance-shield">Insurance Shield</Badge>
          <h2 className="text-3xl font-black mb-6" data-testid="text-shield-headline">Never settle for less than your home is worth.</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Insurance companies rely on generic estimates. UpTend Pros provide <strong className="text-foreground">Verified Intelligence</strong>.
            By documenting your home&rsquo;s condition and assets <em>before</em> an incident, we create an
            indisputable record that shields you during claims.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg h-fit">
                <Video className="text-primary dark:text-orange-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold" data-testid="text-feature-video-manifest">360° Home Scan</h4>
                <p className="text-sm text-muted-foreground">A high-definition visual record of every room, serial number, and finish.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg h-fit">
                <FileCheck className="text-green-600 dark:text-green-400 w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold" data-testid="text-feature-audit-compliance">Audit-Ready Compliance</h4>
                <p className="text-sm text-muted-foreground">Organized digital logs ready for insurers, property managers, or buyers.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">360\u00B0</p>
                <p className="text-xs text-muted-foreground mt-1">Photo documentation</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">AI</p>
                <p className="text-xs text-muted-foreground mt-1">Item recognition</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">$</p>
                <p className="text-xs text-muted-foreground mt-1">Valuations attached</p>
              </div>
            </div>
          </Card>
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl max-w-xs md:ml-8">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-2">Claim Success Rate</p>
            <p className="text-2xl font-black">+40%</p>
            <p className="text-[10px] text-slate-400 mt-1">Users with UpTend Audits recover significantly more in insurance disputes.</p>
          </div>
        </div>
      </section>

      {/* RESALE PROOF SECTION */}
      <section className="py-24 bg-muted/50 px-6" data-testid="section-resale-proof">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <Card className="p-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">100%</p>
                  <p className="text-xs text-muted-foreground mt-1">Transferable record</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">+</p>
                  <p className="text-xs text-muted-foreground mt-1">Home Score points</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary dark:text-orange-400">PDF</p>
                  <p className="text-xs text-muted-foreground mt-1">Shareable report</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="order-1 md:order-2">
            <Badge variant="outline" className="mb-4" data-testid="badge-value-resale-proof">Resale Proof</Badge>
            <h2 className="text-3xl font-black mb-6">Your Home&rsquo;s Maintenance Record. Verified.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Every audit creates a permanent, transferable data point in your property&rsquo;s history.
              When you sell, buyers see a verified maintenance record with full accountability &mdash; not a blank page.
              Your Home Score increases with every documented service, building equity through transparency.
            </p>
          </div>
        </div>
      </section>

      {/* SUSTAINABILITY AS ACTION */}
      <section className="bg-slate-950 py-24 px-6 text-white overflow-hidden" data-testid="section-sustainability">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-6">
                <Leaf className="text-green-400 w-6 h-6" />
                <span className="font-bold">Verified Green Record</span>
              </div>
              <div className="space-y-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-full w-[65%]" />
                </div>
                <p className="text-sm text-slate-400">Your Audit identifies 12 energy-efficiency opportunities to lower your footprint.</p>
                <div className="grid grid-cols-3 gap-4 text-center pt-4">
                  <div>
                    <p className="text-lg font-bold text-green-400">ESG</p>
                    <p className="text-[10px] text-slate-500 uppercase">Baseline</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">CO\u2082</p>
                    <p className="text-[10px] text-slate-500 uppercase">Mapped</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">Score</p>
                    <p className="text-[10px] text-slate-500 uppercase">Tracked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Badge variant="outline" className="mb-4 border-green-600 text-green-400" data-testid="badge-value-sustainability-baseline">Sustainability Baseline</Badge>
            <h2 className="text-3xl font-black mb-6 uppercase">Proven Sustainability.</h2>
            <p className="text-slate-400 mb-8">
              We don&rsquo;t just talk green. We track it. Our Home Scan identifies efficiency leaks and disposal
              opportunities, turning your residence into a verified participant in the circular economy.
              Pros build their <strong className="text-white">sustainability credentials</strong> while you build equity.
            </p>
            <ul className="space-y-4 text-sm font-semibold">
              <li className="flex items-center gap-3"><ShieldCheck className="text-green-400 w-5 h-5" /> ESG Compliance Reporting</li>
              <li className="flex items-center gap-3"><ShieldCheck className="text-green-400 w-5 h-5" /> Verified Material Diversion</li>
              <li className="flex items-center gap-3"><ShieldCheck className="text-green-400 w-5 h-5" /> Pro-Led Green Audits</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="py-24 bg-muted/50" data-testid="section-audit-included">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" data-testid="text-included-title">
              What&rsquo;s Included in Every Audit
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              $99 flat fee. No upsells during the visit. Just verified data and transparent recommendations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {included.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-background rounded-md border border-border"
                data-testid={`audit-include-${idx}`}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary dark:text-orange-400" />
                </div>
                <p className="text-sm font-medium pt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 max-w-5xl mx-auto px-6" id="how-it-works" data-testid="section-audit-how-it-works">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From booking to report, full accountability at every step.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { num: "01", title: "Book Your Audit", desc: "Schedule online in under 2 minutes. Pick a time that works for you." },
            { num: "02", title: "Meet Your Verified Pro", desc: "A background-checked, academy-trained Level 3 Consultant arrives on-site with full documentation equipment." },
            { num: "03", title: "30-Minute Intelligence Scan", desc: "Room-by-room AI photo inventory, 360\u00B0 video walkthrough, exterior assessment, and safety check." },
            { num: "04", title: "Receive Your Report", desc: "A digital asset inventory, treatment plan with transparent pricing, and your first Home Score \u2014 all within 24 hours." },
          ].map((step) => (
            <div key={step.num} className="relative" data-testid={`audit-step-${step.num}`}>
              <Card className="p-6 h-full">
                <span className="text-primary dark:text-orange-400 font-black text-3xl">{step.num}</span>
                <h3 className="font-bold mt-3 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* PRO EMPOWERMENT */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center" data-testid="section-pro-empowerment">
        <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
        <h3 className="text-2xl font-black mb-4" data-testid="text-pro-empowerment-headline">Empowering the people who care for your home.</h3>
        <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
          UpTend Pros aren&rsquo;t just contractors; they are <strong className="text-foreground">Certified Home Technicians</strong>.
          We provide them with the tools to perform complex audits, ensuring they are paid fairly
          for their intelligence, not just their labor.
        </p>
        <Link href="/become-pro">
          <Button variant="outline" data-testid="button-meet-pros">Meet the Pros</Button>
        </Link>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-6" data-testid="section-audit-faq">
        <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="p-6" data-testid={`audit-faq-${idx}`}>
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-slate-950" data-testid="section-audit-final-cta">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-final-cta-headline">
            Get the Intelligence Today.
          </h2>
          <p className="text-slate-400 text-lg mb-4">
            30 minutes. $99. Full accountability. Your home becomes a verified, data-backed asset.
          </p>
          <p className="text-sm text-orange-400 font-semibold mb-10">
            $49 back on your next booking within 90 days.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=home_consultation">
              <Button size="lg" className="font-bold text-lg" data-testid="button-audit-book-bottom">
                Book Your Home Scan <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 font-bold text-lg" data-testid="button-audit-view-services">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
