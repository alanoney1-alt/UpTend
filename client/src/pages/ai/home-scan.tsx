import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useTranslation } from "react-i18next";
import {
  Shield, DollarSign, TrendingUp, Clock, AlertTriangle,
  Home, Camera, Cpu, CheckCircle, ArrowRight,
  Thermometer, Droplets, Zap, Wind, Wrench, Gauge,
  ChevronDown, FileText, BarChart3, Eye,
} from "lucide-react";
import { useState } from "react";

function openGeorgeWithScan() {
  window.dispatchEvent(new CustomEvent("george:open", { detail: { message: "I want a Home DNA Scan" } }));
}

export default function HomeScanPage() {
  usePageTitle("Home DNA Scan. The Carfax Report for Your Home | UpTend");

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <WhatsIncludedSection />
        <HowItWorksSection />
        <PricingSection />
        <SampleReportSection />
        <CTASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

/* ================================================================
   1. HERO
   ================================================================ */
function HeroSection() {
  return (
    <section className="relative pt-32 md:pt-40 pb-24 md:pb-32 overflow-hidden">
      {/* Background image + gradient */}
      <div className="absolute inset-0">
        <img src="/images/site/hero-home-dna-scan.webp" alt="" className="w-full h-full object-cover" loading="eager" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/80 via-[#2a1a0a]/80 to-[#1a1a1a]" />
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#F47C20]/8 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#F47C20]/5 rounded-full blur-[150px]" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <p className="text-[#F47C20] font-semibold tracking-widest uppercase text-sm mb-6">
          Introducing Home DNA
        </p>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 tracking-tight leading-[1.05]">
          Your Home Has DNA.<br />
          <span className="text-[#F47C20]">Do You Know What It Says?</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          A comprehensive digital profile of your home. Every system documented.
          Every risk identified. Every dollar of value protected.
          Think Carfax, but for your house.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            size="lg"
            onClick={openGeorgeWithScan}
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-[#F47C20]/20 w-full sm:w-auto"
          >
            Start Your Home Scan <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <a href="#how-it-works">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 font-semibold text-lg px-8 py-7 rounded-xl w-full sm:w-auto"
            >
              See How It Works
            </Button>
          </a>
        </div>

        {/* Social proof line */}
        <p className="text-gray-500 text-sm mt-10">
          Trusted by homeowners across Central Florida. $1M liability coverage on every scan.
        </p>
      </div>
    </section>
  );
}

/* ================================================================
   2. PROBLEM
   ================================================================ */
function ProblemSection() {
  return (
    <section className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
            You know more about your car's history<br className="hidden md:block" /> than your home's health.
          </h2>
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Your car has a Carfax. Your body gets an annual physical.
            Your home. the single largest investment you will ever make. has nothing.
            Until now.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              stat: "$3,000-5,000",
              label: "Average annual cost of preventable home repairs",
              sub: "Caught early, most cost under $200 to fix.",
            },
            {
              stat: "72%",
              label: "Of homeowners can't name their water heater's age",
              sub: "The average water heater fails at year 12. Do you know yours?",
            },
            {
              stat: "3-5%",
              label: "Higher sale price for documented homes",
              sub: "Buyers pay a premium for proof. Home DNA builds that proof.",
            },
          ].map((item) => (
            <div key={item.stat} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-[#F47C20] mb-3">{item.stat}</p>
              <p className="font-semibold text-gray-900 mb-2">{item.label}</p>
              <p className="text-sm text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   3. WHAT'S INCLUDED
   ================================================================ */
function WhatsIncludedSection() {
  const systems = [
    { icon: Wind, name: "HVAC Systems", desc: "Age, condition, filter status, efficiency rating" },
    { icon: Droplets, name: "Plumbing", desc: "Pipe material, water heater age, fixture condition" },
    { icon: Zap, name: "Electrical", desc: "Panel capacity, wiring type, safety compliance" },
    { icon: Home, name: "Roof & Structure", desc: "Age, material, visible damage, estimated remaining life" },
    { icon: Thermometer, name: "Appliances", desc: "Make, model, serial number, warranty status" },
    { icon: Shield, name: "Foundation", desc: "Visible cracks, settling signs, moisture indicators" },
    { icon: Gauge, name: "Insulation & Efficiency", desc: "Attic insulation depth, window seal integrity" },
    { icon: Wrench, name: "Exterior Systems", desc: "Siding, gutters, drainage, landscape grading" },
  ];

  return (
    <section className="py-24 bg-[#FAF8F4]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#F47C20] font-semibold tracking-widest uppercase text-sm mb-4">
            What Gets Scanned
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
            Every system. Every component.<br className="hidden md:block" /> Nothing overlooked.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Your Home DNA documents the complete anatomy of your property,
            from the roof down to the foundation.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {systems.map((s) => (
            <Card key={s.name} className="bg-white border-gray-200 hover:border-[#F47C20]/40 transition-all hover:shadow-md group">
              <CardContent className="p-6">
                <div className="w-11 h-11 rounded-lg bg-[#F47C20]/10 flex items-center justify-center mb-4 group-hover:bg-[#F47C20]/20 transition-colors">
                  <s.icon className="w-5 h-5 text-[#F47C20]" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   4. HOW IT WORKS
   ================================================================ */
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: Camera,
      title: "Photo Scan",
      desc: "Take photos of every room, appliance, and system. Our AI identifies make, model, age, and condition from a single image.",
    },
    {
      num: "02",
      icon: Cpu,
      title: "Property Intelligence",
      desc: "We pull public records. square footage, year built, lot size, previous sales. and cross-reference with your scan data.",
    },
    {
      num: "03",
      icon: BarChart3,
      title: "Risk Analysis",
      desc: "AI compares your systems against failure rate databases. A 15-year-old water heater in Florida? That gets flagged immediately.",
    },
    {
      num: "04",
      icon: Eye,
      title: "Ongoing Monitoring",
      desc: "Your Home DNA updates every time a pro visits, every time you report an issue, every time you scan again. It gets smarter over time.",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#F47C20] font-semibold tracking-widest uppercase text-sm mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
            Four steps to knowing<br className="hidden md:block" /> everything about your home.
          </h2>
        </div>

        <div className="space-y-12">
          {steps.map((s, i) => (
            <div key={s.num} className={`flex flex-col md:flex-row items-start gap-8 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-[#F47C20]/10 flex items-center justify-center">
                  <s.icon className="w-9 h-9 text-[#F47C20]" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[#F47C20] font-bold text-sm mb-2">{s.num}</p>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed max-w-lg">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   5. PRICING
   ================================================================ */
function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-[#FAF8F4]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#F47C20] font-semibold tracking-widest uppercase text-sm mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
            Simple pricing. No surprises.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Choose the level of detail your home deserves.
            Both include a full digital report within 24 hours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Standard */}
          <Card className="bg-white border-gray-200 hover:border-[#F47C20]/40 transition-all hover:shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-8 pb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Standard Home DNA Scan</h3>
                <p className="text-gray-500 text-sm mb-6">Interior systems and appliances</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-gray-900">Free</span>
                  <span className="text-gray-400 text-sm"></span>
                </div>
                <Button onClick={openGeorgeWithScan} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl text-base">
                  Start Free Scan
                </Button>
              </div>
              <div className="border-t border-gray-100 p-8 pt-6 space-y-3">
                {[
                  "George-guided room-by-room walkthrough",
                  "Every interior system documented",
                  "Appliance identification (make, model, age)",
                  "Condition scoring for each system",
                  "AI-generated maintenance timeline",
                  "Digital report within 24 hours",
                  "$25 credit toward your next booking",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-[#F47C20] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium */}
          <Card className="bg-white border-[#F47C20] ring-2 ring-[#F47C20]/20 hover:shadow-lg transition-all overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#F47C20]" />
            <CardContent className="p-0">
              <div className="p-8 pb-6">
                <Badge className="bg-[#F47C20] text-white border-0 mb-3 text-xs font-bold tracking-wide">
                  RECOMMENDED
                </Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Premium Home DNA Scan</h3>
                <p className="text-gray-500 text-sm mb-6">Interior + exterior + aerial assessment</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-gray-900">Free</span>
                  <span className="text-gray-400 text-sm"></span>
                </div>
                <Button onClick={openGeorgeWithScan} className="w-full bg-[#F47C20] hover:bg-[#e06910] text-white font-bold py-6 rounded-xl text-base">
                  Start Premium Scan
                </Button>
              </div>
              <div className="border-t border-gray-100 p-8 pt-6 space-y-3">
                {[
                  "Everything in Standard, plus:",
                  "Full exterior and yard walkthrough",
                  "Roof and gutter photo assessment",
                  "Utility and HVAC system documentation",
                  "Foundation and drainage evaluation",
                  "Comprehensive risk analysis report",
                  "$25 credit toward your first booking",
                ].map((f, i) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${i === 0 ? "text-gray-400" : "text-[#F47C20]"}`} />
                    <span className={`text-sm ${i === 0 ? "font-semibold text-gray-900" : "text-gray-600"}`}>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-gray-400 text-sm mt-8">
          Both tiers are completely free and include a $25 credit toward your next booking.
        </p>
      </div>
    </section>
  );
}

/* ================================================================
   6. SAMPLE REPORT
   ================================================================ */
function SampleReportSection() {
  return (
    <section className="py-24 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#F47C20] font-semibold tracking-widest uppercase text-sm mb-4">
            What You'll Get
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
            A living record of your home.
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Your Home DNA report is not a static PDF. It is a living digital profile
            that updates with every scan, every service visit, every change.
          </p>
        </div>

        {/* Report preview mockup */}
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gray-50 border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {/* Report header */}
              <div className="bg-gray-900 p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#F47C20] text-xs font-bold tracking-widest uppercase mb-1">Home DNA Report</p>
                    <p className="text-white font-bold text-lg">1847 Magnolia Drive, Orlando FL</p>
                    <p className="text-gray-400 text-sm">Scanned February 24, 2026</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Overall Health</p>
                    <p className="text-3xl font-black text-green-400">82</p>
                    <p className="text-green-400 text-xs font-semibold">Good</p>
                  </div>
                </div>
              </div>

              {/* System scores */}
              <div className="p-6 md:p-8 space-y-4">
                {[
                  { name: "HVAC System", score: "Good", age: "6 years", color: "text-green-600 bg-green-50", next: "Filter change in 2 months" },
                  { name: "Water Heater", score: "Fair", age: "11 years", color: "text-yellow-600 bg-yellow-50", next: "Approaching end of life. Budget for replacement." },
                  { name: "Roof", score: "Good", age: "8 years", color: "text-green-600 bg-green-50", next: "Next inspection recommended in 2 years" },
                  { name: "Electrical Panel", score: "Excellent", age: "6 years", color: "text-green-600 bg-green-50", next: "No action needed" },
                  { name: "Plumbing", score: "Critical", age: "22 years", color: "text-red-600 bg-red-50", next: "Polybutylene pipes detected. Replacement recommended." },
                ].map((sys) => (
                  <div key={sys.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-white border border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-gray-900 text-sm">{sys.name}</h4>
                        <Badge className={`${sys.color} border-0 text-xs font-semibold`}>{sys.score}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">Age: {sys.age}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 sm:mt-0 sm:text-right max-w-xs">{sys.next}</p>
                  </div>
                ))}
              </div>

              {/* Bottom bar */}
              <div className="bg-[#F47C20]/5 border-t border-[#F47C20]/10 p-4 text-center">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">14 systems documented</span> with 47 photos and AI analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   7. CTA
   ================================================================ */
function CTASection() {
  return (
    <section className="py-24 bg-gray-900">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
          Stop guessing.<br />Start knowing.
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Your home is your largest investment. Give it the documentation it deserves.
          Start your free Home DNA Scan now.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            size="lg"
            onClick={openGeorgeWithScan}
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-[#F47C20]/20 w-full sm:w-auto"
          >
            Start Your Home Scan <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   8. FAQ
   ================================================================ */
function FAQSection() {
  const faqs = [
    {
      q: "What exactly is a Home DNA Scan?",
      a: "A Home DNA Scan is a comprehensive digital profile of your home. A certified UpTend inspector documents every system, appliance, and component with photos and detailed notes. Our AI then analyzes this data to assess condition, estimate remaining lifespan, and create a prioritized maintenance timeline. Think of it as a Carfax report for your house.",
    },
    {
      q: "Is this the same as a home inspection?",
      a: "No. A Home DNA Scan is an informational assessment tool, not a licensed home inspection. It is designed for ongoing home health monitoring, insurance documentation, and preventive maintenance planning. For real estate transactions, we recommend a licensed home inspector in addition to your Home DNA profile.",
    },
    {
      q: "How long does the scan take?",
      a: "A Standard scan typically takes 45-90 minutes depending on home size. A Premium scan with aerial assessment takes 90-120 minutes. You will receive your digital report within 24 hours.",
    },
    {
      q: "What happens after my scan?",
      a: "You receive a detailed digital report with condition scores for every system, a prioritized maintenance timeline, and specific recommendations. Your Home DNA profile then updates over time as you book services, report issues, or schedule follow-up scans. George, our AI assistant, uses your Home DNA data to provide personalized maintenance reminders and recommendations.",
    },
    {
      q: "How does the $25 credit work?",
      a: "After completing your free Home DNA Scan, you receive a $25 credit that applies automatically to your next booking. There is no expiration date. The credit covers any service we offer, from handyman work to pressure washing.",
    },
    {
      q: "Can I do a scan myself?",
      a: "Yes. We offer a free self-serve scan through George, our AI assistant. You walk through your home taking photos, and our AI identifies and documents everything. You also earn credits for each item scanned. For the most thorough results, we recommend a professional scan.",
    },
    {
      q: "Is my data secure?",
      a: "Your data belongs to you. All photos and reports are encrypted, stored securely, and never sold to third parties. You can request deletion at any time. We are fully CCPA and GDPR compliant.",
    },
    {
      q: "What areas do you serve?",
      a: "Home DNA Scans are currently available throughout the Greater Orlando metro area, including Orange, Seminole, Osceola, and Lake counties. We are expanding to additional Florida markets soon.",
    },
  ];

  return (
    <section className="py-24 bg-[#FAF8F4]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          <p className="text-gray-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
