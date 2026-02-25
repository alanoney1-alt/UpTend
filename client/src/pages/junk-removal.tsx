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
    a: "Every item is sorted for donation, recycling, or responsible disposal. You receive a report showing exactly where everything went. Nothing just disappears into a landfill.",
  },
  {
    q: "How is pricing determined?",
    a: "Transparent, volume-based pricing with no hidden fees. You see the price before you book, based on load size and item types. Your price is locked at booking.",
  },
  {
    q: "What about liability for property damage?",
    a: "Every Pro carries $1M liability coverage. We document your space with photos before and after the job. Both you and the Pro are protected.",
  },
  {
    q: "Do you handle hazardous materials?",
    a: "Hazardous items are identified during booking through our safety screening. We coordinate specialized disposal for chemicals, electronics, and regulated materials.",
  },
  {
    q: "Can property managers use this for compliance reporting?",
    a: "Yes. Every job generates documentation including diversion rates, disposal records, and verified chain-of-custody data for ESG and compliance reporting.",
  },
];

export default function JunkRemoval() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-junk-removal">
      <Header />

      {/* HERO */}
      <section className="pt-28 pb-16 px-6 bg-muted/50 border-b border-border" data-testid="section-junk-hero">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6" data-testid="text-junk-headline">
            Junk Removal<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-[#F47C20]">
              Done Responsibly.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="text-junk-subhead">
            We clear your space, protect your property, and track where every item goes.
            92% of what we haul stays out of landfills. One price, locked before we arrive.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=junk_removal">
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg" data-testid="button-junk-book-hero">
                Get Your Free Quote <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="font-bold text-lg" data-testid="button-junk-learn">
                How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-6 bg-slate-900 border-t border-slate-800" data-testid="section-junk-trust-bar">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#F47C20]" />
              <span>$1M Liability Coverage</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F47C20]" />
              <span>Background-Checked Pros</span>
            </div>
            <div className="flex items-center gap-2">
              <Recycle className="w-4 h-4 text-green-400" />
              <span>92% Landfill Diversion</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#F47C20]" />
              <span>Price-Protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 max-w-5xl mx-auto px-6" id="how-it-works" data-testid="section-junk-how">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Junk Removal Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Book in under a minute. We handle the heavy lifting, sorting, and disposal.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8" data-testid="card-junk-step-1">
            <div className="w-12 h-12 bg-[#F47C20]/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="text-[#F47C20] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">1. Tell Us What You Have</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Describe the job or snap a photo. Get an instant price based on volume and item types. No guesswork.
            </p>
          </Card>

          <Card className="p-8" data-testid="card-junk-step-2">
            <div className="w-12 h-12 bg-[#F47C20]/10 rounded-xl flex items-center justify-center mb-4">
              <Truck className="text-[#F47C20] w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">2. We Show Up and Load</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your Pro arrives on time, documents the space with photos, and handles all the heavy lifting. You don't touch a thing.
            </p>
          </Card>

          <Card className="p-8" data-testid="card-junk-step-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
              <Leaf className="text-green-600 dark:text-green-400 w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">3. Sorted, Not Dumped</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every item is sorted for donation, recycling, or responsible disposal. You get a report showing where it all went.
            </p>
          </Card>
        </div>
      </section>

      {/* SUSTAINABILITY */}
      <section className="bg-slate-950 py-24 px-6 text-white overflow-hidden" id="impact" data-testid="section-junk-impact">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4 border-green-600 text-green-400">Sustainability</Badge>
            <h2 className="text-3xl font-black mb-6" data-testid="text-junk-sustainability-headline">
              We Track Where It Goes.
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Most junk removal companies dump everything in a landfill and call it a day.
              We sort, donate, and recycle. then give you the data to prove it.
              Property managers get audit-ready compliance documentation.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-l-2 border-green-500 pl-4">
                <p className="text-2xl font-black">92%</p>
                <p className="text-xs text-slate-500 uppercase font-bold">Diverted from Landfill</p>
              </div>
              <div className="border-l-2 border-[#F47C20] pl-4">
                <p className="text-2xl font-black">Verified</p>
                <p className="text-xs text-slate-500 uppercase font-bold">Disposal Tracking</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
              <div className="flex justify-between items-center gap-3 mb-6">
                <span className="text-xs font-bold text-green-400 uppercase">Job Summary</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Metal / Appliances</span>
                  <span className="text-white font-mono">140 lbs Recycled</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-1 w-full" />
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Furniture</span>
                  <span className="text-white font-mono">2 Pieces Donated</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#F47C20] h-1 w-[80%]" />
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-400">Electronics</span>
                  <span className="text-white font-mono">3 Devices Recycled</span>
                </div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-1 w-[60%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="py-24 bg-muted/50" data-testid="section-junk-included">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What's Included in Every Job</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Transparent pricing. Verified disposal. Full documentation from start to finish.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Truck, text: "All heavy lifting included. we do the work" },
              { icon: ShieldCheck, text: "$1M liability coverage on every job" },
              { icon: Recycle, text: "Items sorted for donation, recycling, or disposal" },
              { icon: Leaf, text: "Disposal report showing where everything went" },
              { icon: FileCheck, text: "Donation receipts for tax deductions" },
              { icon: Scale, text: "Before and after photo documentation" },
              { icon: Video, text: "Real-time job tracking from start to finish" },
              { icon: CheckCircle, text: "Compliance-ready documentation for property managers" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border"
                data-testid={`junk-include-${idx}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#F47C20]" />
                </div>
                <p className="text-sm font-medium pt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-6" data-testid="section-junk-faq">
        <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="p-6" data-testid={`junk-faq-${idx}`}>
              <h3 className="font-bold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-slate-900" data-testid="section-junk-final-cta">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" data-testid="text-junk-final-headline">
            Clear your space. Keep it out of landfills.
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            One price, locked before we arrive. Every item tracked and accounted for.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/book?service=junk_removal">
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg" data-testid="button-junk-book-bottom">
                Get Your Free Quote <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 font-bold text-lg" data-testid="button-junk-view-services">
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
