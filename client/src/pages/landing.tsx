import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/landing/footer";
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Droplets, Zap, Truck, TreePine, Bug,
  Paintbrush, Wind, Flame, Home, Wrench, Sparkles, Shield,
  ChevronDown, Send, Star, ArrowUp,
} from "lucide-react";

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

interface ChatMessage {
  role: "george" | "user";
  text: string;
}

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

/* ─── Main Landing ─── */
export default function Landing() {
  usePageTitle("UpTend | Home Services, Finally Done Right");

  return (
    <div className="landing-root min-h-screen relative overflow-hidden" data-testid="page-landing">
      {/* Ambient background */}
      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      <div className="relative z-10">
        <HeroChat />
        <HowItWorks />
        <TrustBar />
        <ServicesGrid />
        <SocialProof />
        <Footer />
      </div>
    </div>
  );
}

/* ─── Hero: Full-screen George Chat ─── */
function HeroChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "george", text: "Hey! I'm George. I know everything about homes — what's going on with yours today?" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setIsTyping(true);

    // Simulate George responding then hand off to full guide
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "george", text: "Let me help you with that! Opening up my full toolkit..." },
      ]);
      setTimeout(() => openGeorge(msg), 800);
    }, 1200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section
      className="relative flex flex-col items-center justify-center px-4 pt-16 pb-8"
      style={{ minHeight: "100svh" }}
    >
      {/* Avatar with glow */}
      <div className="landing-avatar-glow">
        <div className="landing-avatar">
          G
        </div>
      </div>
      <h1 className="mt-5 text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 landing-fade-up">
        Mr. George
      </h1>
      <p className="text-sm md:text-base mt-1 text-stone-500 dark:text-stone-400 landing-fade-up" style={{ animationDelay: "0.1s" }}>
        Your Home Health Expert
      </p>

      {/* Chat area */}
      <div className="mt-8 max-w-lg w-full flex flex-col gap-3 landing-fade-up" style={{ animationDelay: "0.2s" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`landing-msg landing-msg-appear ${
              msg.role === "george" ? "landing-msg-george" : "landing-msg-user"
            }`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="landing-msg landing-msg-george landing-msg-appear">
            <span className="landing-typing-dots">
              <span /><span /><span />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input — premium glass */}
      <div className="mt-6 max-w-lg w-full landing-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="landing-input-wrap">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what your home needs..."
            className="landing-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="landing-send-btn"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Floating pill chips */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {CHIPS.map((chip, i) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="landing-chip landing-fade-up"
              style={{ animationDelay: `${0.4 + i * 0.06}s` }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <button
        onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 animate-bounce text-stone-400"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-6 h-6" />
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
    <section id="how-it-works" className="py-20 px-4 text-stone-900 dark:text-stone-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How George Works</h2>
      <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="landing-glass-card text-center p-8 rounded-2xl">
            <div className="text-4xl mb-3">{s.emoji}</div>
            <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Trust Bar ─── */
function TrustBar() {
  return (
    <div className="landing-trust-bar py-4 text-center text-sm md:text-base font-medium tracking-wide text-white">
      12 Services &bull; Vetted Pros &bull; Guaranteed Prices &bull; Orlando Metro
    </div>
  );
}

/* ─── Services Grid ─── */
function ServicesGrid() {
  return (
    <section className="py-16 px-4 text-stone-900 dark:text-stone-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Can George Help With?</h2>
      <div className="max-w-3xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {SERVICES.map(({ icon: Icon, name }) => (
          <button
            key={name}
            onClick={() => handleServiceClick(name)}
            className="landing-glass-card flex flex-col items-center gap-2 rounded-xl p-4 landing-service-btn"
          >
            <Icon className="w-7 h-7 text-amber-500" />
            <span className="text-xs font-medium text-center leading-tight">{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function handleServiceClick(name: string) {
  openGeorge(`I need help with ${name}`);
}

/* ─── Social Proof ─── */
function SocialProof() {
  const reviews = [
    { name: "Maria S.", text: "George found me a plumber in 10 minutes. Best price I've gotten." },
    { name: "James T.", text: "I just told George what was wrong and he handled everything. Amazing." },
    { name: "Linda R.", text: "Finally, home services that don't make me anxious. Love this." },
  ];

  return (
    <section className="py-16 px-4 text-stone-900 dark:text-stone-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What Homeowners Say</h2>
      <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <div key={i} className="landing-glass-card rounded-xl p-5">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-3 text-stone-500 dark:text-stone-400">"{r.text}"</p>
            <p className="text-sm font-semibold">{r.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
