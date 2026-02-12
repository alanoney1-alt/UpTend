import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Zap, Leaf, Quote, ArrowRight,
  Shield, DollarSign, Heart, Users, CheckCircle,
  Target,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import founderPhoto from "@assets/stock_images/professional_male_wo_4cd11950.jpg";

const values = [
  {
    icon: Shield,
    title: "Accountability First",
    description: "Every job is logged, every Pro is verified, and every impact is measured. We believe transparency builds trust, and trust builds value.",
  },
  {
    icon: Heart,
    title: "Pro Empowerment",
    description: "We never charge lead fees. Our Pros keep more of what they earn, build verified green credentials, and access a career ladder that rewards quality.",
  },
  {
    icon: DollarSign,
    title: "Honest Pricing",
    description: "No hidden fees, no surge pricing, no surprises. What you see is what you pay. Our AI-powered quotes remove guesswork from both sides.",
  },
  {
    icon: Leaf,
    title: "Sustainability as Action",
    description: "We don\u2019t just talk about the environment. We divert 70% of items from landfills, generate verifiable impact certificates, and build every Pro\u2019s green track record.",
  },
];

const milestones = [
  { year: "2024", event: "UpTend founded in Orlando, Florida" },
  { year: "2024", event: "First 100 Verified Pros join the network" },
  { year: "2025", event: "Expanded to serve all of Central Florida" },
  { year: "2025", event: "Launched AI-powered visual quoting" },
  { year: "2025", event: "10,000+ jobs completed with full impact tracking" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-about">
      <Header />

      {/* PERSONAL HERO SECTION */}
      <section className="pt-28 pb-16 px-6" data-testid="section-about-hero">
        <div className="max-w-4xl mx-auto">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block" data-testid="text-our-story-label">Our Story</span>
          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight" data-testid="text-about-headline">
            I built UpTend because the <br className="hidden md:block" />
            <span className="text-muted-foreground underline decoration-primary decoration-4 underline-offset-8 italic">system was broken.</span>
          </h1>

          <div className="flex flex-col md:flex-row gap-12 items-start mt-12">
            <div className="w-full md:w-1/3 shrink-0">
              <div className="sticky top-24 z-10">
                <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden shadow-2xl border-4 border-background">
                  <img
                    src={founderPhoto}
                    alt="Alan, Founder of UpTend"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-6 text-center font-bold" data-testid="text-founder-name">Alan</p>
                <p className="text-center text-xs text-muted-foreground uppercase tracking-widest" data-testid="text-founder-title">Founder, UpTend</p>
              </div>
            </div>

            <div className="flex-1 space-y-6 text-lg text-muted-foreground leading-relaxed text-left">
              <p>
                I still remember the moment everything clicked. I was helping a friend move out of his apartment—he'd hired a junk removal company to clear out his garage. The Pro who showed up was incredible: careful, professional, genuinely cared about doing good work. But when it came time to settle up, the price was double what my friend expected. No itemized breakdown. No proof of where anything went. Just a bill and a "trust me."
              </p>
              <p>
                My friend lost part of his security deposit because there was no documentation. The Pro got squeezed by his platform, barely making minimum wage after fees. And all that "junk"? Nobody knew if it was recycled, donated, or just dumped in a landfill.
              </p>
              <p>
                <strong className="text-foreground">Everybody lost. And I couldn't stop thinking about it.</strong>
              </p>
              <p>
                That's when I realized: <em>your home is your biggest asset, but it has the worst paper trail.</em> There's no Carfax for houses. No verified service history. Homeowners can't prove what they've maintained, renters can't protect themselves from bogus charges, and Pros—the people actually doing the work—get treated like disposable labor.
              </p>
              <p className="font-bold text-foreground">
                So I built UpTend. Not as another app. As a different system entirely—one built on verifiable truth, not trust-me promises. A system where every job creates a record, every Pro builds a real reputation, and every customer gets proof of what actually happened.
              </p>
              <p className="text-foreground">
                That's how our Three Pillars were born. Not from a business plan, but from watching good people get burned by a broken system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* THE THREE PILLARS ORIGIN STORY */}
      <section className="py-24 bg-muted/50 px-6" data-testid="section-pillars-origin">
        <div className="max-w-5xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-protect">
            <div className="w-16 h-16 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-protect">01. PROTECT</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your home is probably your biggest investment. You should have proof of everything that's ever been done to it. That's why we built the <strong className="text-foreground">360\u00B0 Video Documentation</strong> and the <strong className="text-foreground">Home Scan</strong>—to give you an actual record. Not for us. For you. For your insurance company. For your next landlord or mortgage broker. Every job gets documented, timestamped, and verified. You never have to say "trust me" again. You have proof.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-connect">
            <div className="w-16 h-16 bg-secondary rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
              <Zap className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-connect">02. CONNECT</h3>
              <p className="text-muted-foreground leading-relaxed">
                I got tired of watching skilled Pros get squeezed. Paying $50 for a "lead" that turns out to be a tire-kicker. Waiting weeks for a payout. Getting a one-star review because the platform's pricing was deceptive. That's garbage. We connect you directly with <strong className="text-foreground">Verified Pros</strong> who get paid instantly and keep more of what they earn. No lead fees. No mysterious "platform charges." Just fair matches and honest work.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-sustain">
            <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
              <Leaf className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-sustain">03. SUSTAIN</h3>
              <p className="text-muted-foreground leading-relaxed">
                Here's the truth: most "eco-friendly" junk removal is marketing. Nobody verifies where stuff actually goes. We do. Every single item is categorized: recycle, donate, e-waste, or (as a last resort) landfill. We track the weight, the destination, the impact. Then we give you a certificate that proves it. Not because it sounds nice, but because <strong className="text-foreground">you deserve to know your stuff didn't just get dumped.</strong> And frankly, the planet does too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="py-24 max-w-5xl mx-auto px-6" data-testid="section-about-values">
        <h2 className="text-2xl font-bold mb-8 text-center" data-testid="text-values-heading">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value) => (
            <Card key={value.title} className="p-6" data-testid={`card-value-${value.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="py-24 bg-muted/50 px-6" data-testid="section-about-mission">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="p-8 bg-primary/5 border-primary/20" data-testid="card-mission">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-semibold">Our Mission</h3>
              </div>
              <p className="text-lg text-muted-foreground">
                To give every homeowner a verified record of their home&rsquo;s health, connect them with
                accountable Pros, and ensure every service makes a measurable impact on their property
                value and the environment.
              </p>
            </Card>
            <div>
              <h2 className="text-2xl font-bold mb-4">About UpTend</h2>
              <p className="text-muted-foreground mb-4">
                Founded in Orlando, Florida, UpTend is a registered trade name of UpTend LLC. The name reflects
                our mission: to help homeowners <strong className="text-foreground">tend to</strong> their most important asset with intelligence,
                accountability, and verified impact.
              </p>
              <p className="text-muted-foreground">
                We built the first home intelligence platform where every job is tracked, every Pro is
                valued, and every impact is measured. Whether we&rsquo;re recovering materials or auditing a property,
                we provide a digital paper trail that protects your home&rsquo;s value and verifies your green footprint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <section className="py-24 max-w-5xl mx-auto px-6" data-testid="section-about-journey">
        <h2 className="text-2xl font-bold mb-8 text-center" data-testid="text-journey-heading">Our Journey</h2>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className={`relative flex items-center gap-4 flex-wrap ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`} data-testid={`milestone-${index}`}>
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"} hidden md:block`}>
                  <Card className="p-4 inline-block">
                    <p className="font-medium">{milestone.event}</p>
                  </Card>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary">{milestone.year}</span>
                  <Card className="p-4 mt-1 md:hidden">
                    <p className="font-medium">{milestone.event}</p>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVEN IMPACT STATS */}
      <section className="py-24 bg-muted/50 px-6" data-testid="section-about-stats">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 text-center bg-primary/5 border-primary/20" data-testid="card-stats">
            <h2 className="text-2xl font-bold mb-4">Proven Impact</h2>
            <div className="grid md:grid-cols-4 gap-6 mt-8">
              <div data-testid="stat-jobs">
                <div className="text-3xl font-bold text-primary mb-1">10K+</div>
                <p className="text-sm text-muted-foreground">Jobs Completed</p>
              </div>
              <div data-testid="stat-pros">
                <div className="text-3xl font-bold text-primary mb-1">500+</div>
                <p className="text-sm text-muted-foreground">Verified Pros</p>
              </div>
              <div data-testid="stat-rating">
                <div className="text-3xl font-bold text-primary mb-1">4.9</div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
              <div data-testid="stat-diverted">
                <div className="text-3xl font-bold text-primary mb-1">70%</div>
                <p className="text-sm text-muted-foreground">Landfill Diversion Rate</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FINAL MANTRA */}
      <section className="py-24 text-center px-6" data-testid="section-about-mantra">
        <Quote className="w-12 h-12 text-muted-foreground/20 mx-auto mb-8" />
        <h2 className="text-3xl font-black mb-6" data-testid="text-about-mantra">This is just the beginning.</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
          We're building something bigger than an app. We're building a system where your home has a verified history, where skilled Pros get paid what they're worth, and where sustainability isn't a buzzword—it's a tracked, provable fact. If that resonates with you, we'd love to have you with us. Whether you're booking a job or joining as a Pro, you're helping build something better.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/book">
            <Button size="lg" data-testid="button-about-book">
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/become-pro">
            <Button variant="outline" size="lg" data-testid="button-about-join">
              Join as a Pro
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
