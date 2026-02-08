import { Link } from "wouter";
import {
  Leaf, Recycle, ShieldCheck, Zap, Users,
  ArrowRight, Video, FileCheck, CheckCircle,
  Shield, Lock, Scale, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const faqs = [
  {
    q: "What happens to my items after pickup?",
    a: "Every item is tracked with full accountability. We sort for donation, recycling, and responsible disposal. You receive a verified Impact Report showing exactly where everything went.",
  },
  {
    q: "How is pricing determined?",
    a: "Transparent, volume-based pricing with no hidden fees. You see the price before you book, based on load size and item types. No guesstimates.",
  },
  {
    q: "What about liability for property damage?",
    a: "Every job starts with a 360\u00B0 Video Manifest documenting your space before we touch anything. All Pros carry $1M liability coverage, and the video record protects both parties.",
  },
  {
    q: "Do you handle hazardous materials?",
    a: "Hazardous items are identified during booking through our safety screening. We coordinate specialized disposal for chemicals, electronics, and regulated materials with full compliance documentation.",
  },
  {
    q: "Can property managers use this for ESG reporting?",
    a: "Absolutely. Every recovery generates audit-ready ESG compliance documentation including material diversion rates, carbon offset data, and verified disposal chain records.",
  },
];

export default function JunkRemoval() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-material-recovery">
      <Header />

      {/* BRAND-ALIGNED HERO */}
      <section className="pt-28 pb-16 px-6 bg-muted/50 border-b border-border" data-testid="section-recovery-hero">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-green-600 dark:text-green-400 font-bold tracking-widest text-xs uppercase mb-4 block">
            Home Intelligence \u2022 Sustain
          </span>
          <h1 className="text-4xl md:text-6xl font-black mb-6" data-testid="text-recovery-headline">
            Space Rejuvenation & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-primary">
              Verified Material Recovery.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-10 leading-relaxed" data-testid="text-recovery-subhead">
            Don&rsquo;t just throw it away. On UpTend, every haul is an act of
            <strong className="text-foreground"> built-in accountability</strong>. We recover your space, protect your property,
            and verify the environmental impact of every item we remove.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=junk_removal">
              <Button size="lg" className="font-bold text-lg" data-testid="button-recovery-book-hero">
                Schedule Recovery <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#impact">
              <Button size="lg" variant="outline" className="font-bold text-lg" data-testid="button-recovery-impact">
                See the Impact
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-6 bg-slate-900 dark:bg-slate-950 border-t border-slate-800" data-testid="section-recovery-trust-bar">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>$1M Liability Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-green-400" />
              <span>360\u00B0 Video Manifest</span>
            </div>
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-green-400" />
              <span>92% Landfill Diversion</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span>ESG Compliance Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE THREE PILLARS OF RECOVERY */}
      <section className="py-24 max-w-7xl mx-auto px-6" data-testid="section-recovery-pillars">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Three Pillars. One Recovery.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every material recovery job protects your property, connects you with verified Pros, and sustains the environment with documented accountability.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 hover-elevate" data-testid="card-pillar-protect-space">
            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-md flex items-center justify-center mb-4">
              <ShieldCheck className="text-primary dark:text-orange-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Protect Your Space</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Clutter devalues your home. Our Pros perform a <strong className="text-foreground">360\u00B0 Video Manifest</strong> before
              touching a single item, ensuring your walls and floors are shielded from liability.
            </p>
          </Card>

          <Card className="p-8 hover-elevate" data-testid="card-pillar-instant-connect">
            <div className="w-12 h-12 bg-secondary/10 dark:bg-secondary/20 rounded-md flex items-center justify-center mb-4">
              <Zap className="text-secondary dark:text-purple-300 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Connection</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              On-demand access to vetted local Pros. No waiting for quotes. Transparent,
              up-front pricing based on volume, not guesstimates.
            </p>
          </Card>

          <Card className="p-8 hover-elevate" data-testid="card-pillar-verified-sustainability">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center mb-4">
              <Leaf className="text-green-600 dark:text-green-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Sustainability</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We track the lifecycle of your materials. Every haul generates an <strong className="text-foreground">Impact Report</strong>
              showing exactly how much was diverted from landfills into the circular economy.
            </p>
          </Card>
        </div>
      </section>

      {/* SUSTAINABILITY IN ACTION: THE IMPACT LOG */}
      <section className="bg-slate-950 py-24 px-6 text-white overflow-hidden" id="impact" data-testid="section-recovery-impact">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4 border-green-600 text-green-400">Sustain</Badge>
            <h2 className="text-3xl font-black mb-6 uppercase tracking-tight" data-testid="text-recovery-sustainability-headline">Proven Sustainability.</h2>
            <p className="text-slate-400 mb-8 text-lg">
              We don&rsquo;t just &ldquo;talk green.&rdquo; We verify it. UpTend&rsquo;s <strong className="text-white">ESG Tracking</strong>
              provides homeowners and property managers with audit-ready compliance reporting.
              When your items leave, they don&rsquo;t disappear &mdash; they are accounted for.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-l-2 border-green-500 pl-4">
                <p className="text-2xl font-black">92%</p>
                <p className="text-xs text-slate-500 uppercase font-bold">Landfill Diversion Rate</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="text-2xl font-black">Verified</p>
                <p className="text-xs text-slate-500 uppercase font-bold">ESG Reporting</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center gap-3 mb-6">
                <span className="text-xs font-bold text-green-400 uppercase">Live Recovery Log</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Metal Scrap</span>
                  <span className="text-white font-mono">140 lbs Recycled</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-1 w-full" />
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Furniture</span>
                  <span className="text-white font-mono">2 Units Donated</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-1 w-[80%]" />
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Electronics</span>
                  <span className="text-white font-mono">3 Devices Recycled</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-1 w-[60%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="py-24 bg-muted/50" data-testid="section-recovery-included">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Every Recovery Includes</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Transparent pricing. Verified disposal. Documented accountability from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Video, text: "360\u00B0 Video Manifest before loading begins" },
              { icon: Truck, text: "Heavy lifting included \u2014 we do all the work" },
              { icon: Recycle, text: "Circular economy sorting: donate, recycle, dispose" },
              { icon: Leaf, text: "Verified Impact Report with material diversion data" },
              { icon: FileCheck, text: "Donation receipts for tax deductions" },
              { icon: ShieldCheck, text: "$1M liability coverage on every job" },
              { icon: Scale, text: "Before/After photo documentation" },
              { icon: CheckCircle, text: "ESG compliance documentation for property managers" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-background rounded-md border border-border"
                data-testid={`recovery-include-${idx}`}
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium pt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRO EMPOWERMENT */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center" data-testid="section-recovery-pro-empowerment">
        <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
        <h2 className="text-3xl font-black mb-6" data-testid="text-recovery-pro-headline">Pro Empowerment</h2>
        <p className="text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
          UpTend Pros aren&rsquo;t just haulers; they are <strong className="text-foreground">Certified Material Technicians</strong>.
          By using our platform, they build verified green credentials that allow them to bid
          on major enterprise and property management contracts. We provide the tools; they provide the impact.
        </p>
        <Link href="/become-pro">
          <Button variant="outline" data-testid="button-join-pro-network">
            Join the Pro Network
          </Button>
        </Link>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-6" data-testid="section-recovery-faq">
        <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="p-6" data-testid={`recovery-faq-${idx}`}>
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-slate-950" data-testid="section-recovery-final-cta">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-recovery-final-headline">
            Your unwanted items are resources.
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            We recover your space while protecting the planet. Every item tracked. Every impact verified. Full accountability.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=junk_removal">
              <Button size="lg" className="font-bold text-lg" data-testid="button-recovery-book-bottom">
                Schedule Material Recovery <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 font-bold text-lg" data-testid="button-recovery-view-services">
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
