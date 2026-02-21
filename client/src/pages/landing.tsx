import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/landing/footer";
import {
  MessageCircle, Droplets, Zap, Truck, TreePine, Bug,
  Paintbrush, Wind, Flame, Home, Wrench, Sparkles, Shield,
  ChevronDown, Send, Star,
} from "lucide-react";

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFBF5",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#1E293B",
  textMuted: "#64748B",
  card: "#FFFFFF",
};

/* ─── Services Data ─── */
const SERVICES = [
  { icon: Droplets, name: "Plumbing" },
  { icon: Zap, name: "Electrical" },
  { icon: Wind, name: "HVAC" },
  { icon: Paintbrush, name: "Painting" },
  { icon: Truck, name: "Junk Removal" },
  { icon: TreePine, name: "Lawn Care" },
  { icon: Bug, name: "Pest Control" },
  { icon: Home, name: "Roofing" },
  { icon: Flame, name: "Appliance Repair" },
  { icon: Wrench, name: "Handyman" },
  { icon: Sparkles, name: "Cleaning" },
  { icon: Shield, name: "Security" },
] as const;

const CHIPS = ["Book a Pro", "DIY Help", "Get a Quote", "What services do you offer?"];

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

/* ─── Main Landing ─── */
export default function Landing() {
  usePageTitle("UpTend | Home Services, Finally Done Right");

  return (
    <div style={{ background: T.bg }} className="min-h-screen" data-testid="page-landing">
      <HeroChat />
      <HowItWorks />
      <TrustBar />
      <ServicesGrid />
      <SocialProof />
      <Footer />
    </div>
  );
}

/* ─── Hero: Full-screen George Chat ─── */
function HeroChat() {
  return (
    <section
      className="relative flex flex-col items-center justify-center px-4 pt-16 pb-8"
      style={{ minHeight: "100svh", color: T.text }}
    >
      {/* Avatar */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
        style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
      >
        G
      </div>
      <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight">Mr. George</h1>
      <p style={{ color: T.textMuted }} className="text-sm md:text-base mt-1">
        Your Home Health Expert
      </p>

      {/* Greeting bubble */}
      <div
        className="mt-8 max-w-md w-full rounded-2xl px-5 py-4 text-base md:text-lg leading-relaxed shadow-sm"
        style={{ background: T.card, color: T.text }}
      >
        Hey! I'm George. I know everything about homes — what's going on with yours today?
      </div>

      {/* Chat input */}
      <div className="mt-8 max-w-md w-full">
        <button
          onClick={() => openGeorge()}
          className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left text-base shadow-sm hover:shadow-md transition-shadow cursor-text"
          style={{ color: T.textMuted }}
        >
          <span className="flex-1">Tell me what your home needs...</span>
          <Send className="w-5 h-5 shrink-0" style={{ color: T.primary }} />
        </button>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => openGeorge(chip)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:border-amber-300 hover:bg-amber-50 transition-colors"
              style={{ color: T.text }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <button
        onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 animate-bounce"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-6 h-6" style={{ color: T.textMuted }} />
      </button>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { emoji: "💬", title: "Tell George", desc: "Describe what your home needs — anything from a leaky faucet to a full renovation." },
    { emoji: "⚡", title: "He Handles It", desc: "George finds the right vetted pro, gets you a guaranteed price, and books it." },
    { emoji: "🏠", title: "Your Home Wins", desc: "Sit back. Quality work, fair price, no surprises. Every time." },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4" style={{ color: T.text }}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How George Works</h2>
      <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl mb-3">{s.emoji}</div>
            <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
            <p style={{ color: T.textMuted }} className="text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Trust Bar ─── */
function TrustBar() {
  return (
    <div
      className="py-4 text-center text-sm md:text-base font-medium tracking-wide"
      style={{ background: T.primary, color: "white" }}
    >
      12 Services &bull; Vetted Pros &bull; Guaranteed Prices &bull; Orlando Metro
    </div>
  );
}

/* ─── Services Grid ─── */
function ServicesGrid() {
  return (
    <section className="py-16 px-4" style={{ color: T.text }}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Can George Help With?</h2>
      <div className="max-w-3xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {SERVICES.map(({ icon: Icon, name }) => (
          <button
            key={name}
            onClick={() => openGeorge(`I need help with ${name}`)}
            className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <Icon className="w-7 h-7" style={{ color: T.primary }} />
            <span className="text-xs font-medium text-center leading-tight">{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Social Proof ─── */
function SocialProof() {
  const reviews = [
    { name: "Maria S.", text: "George found me a plumber in 10 minutes. Best price I've gotten." },
    { name: "James T.", text: "I just told George what was wrong and he handled everything. Amazing." },
    { name: "Linda R.", text: "Finally, home services that don't make me anxious. Love this." },
  ];

  return (
    <section className="py-16 px-4" style={{ background: "#FFF9F0", color: T.text }}>
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Homeowners Say</h2>
      <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-3" style={{ color: T.textMuted }}>"{r.text}"</p>
            <p className="text-sm font-semibold">{r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
