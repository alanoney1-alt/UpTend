import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/landing/footer";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Truck, TreePine, Droplets, Wrench, Sparkles, Home,
  Scissors, Waves, HardHat, Hammer, ScanLine,
  Send, ArrowRight, ChevronDown, Zap, Shield, Clock,
  MapPin,
} from "lucide-react";

/* ─── Our REAL 12 Services ─── */
const SERVICES = [
  { icon: Truck, name: "Junk Removal", from: "$99" },
  { icon: Droplets, name: "Pressure Washing", from: "$120" },
  { icon: Home, name: "Gutter Cleaning", from: "$150" },
  { icon: Wrench, name: "Handyman", from: "$75/hr" },
  { icon: HardHat, name: "Moving Labor", from: "$65/hr" },
  { icon: Hammer, name: "Light Demolition", from: "$199" },
  { icon: Sparkles, name: "Home Cleaning", from: "$99" },
  { icon: Waves, name: "Pool Cleaning", from: "$120/mo" },
  { icon: TreePine, name: "Landscaping", from: "$49" },
  { icon: Scissors, name: "Carpet Cleaning", from: "$50/room" },
  { icon: Home, name: "Garage Cleanout", from: "$150" },
  { icon: ScanLine, name: "AI Home Scan", from: "$99" },
] as const;

const CONVERSATION_STARTERS = [
  "🛠️ My garbage disposal is making weird noises",
  "🏡 I need my gutters cleaned before rainy season",
  "🚛 Help me get rid of old furniture",
  "💧 My driveway looks terrible — pressure wash?",
  "🏠 What should I be maintaining in my home?",
];

interface ChatMessage {
  role: "george" | "user";
  text: string;
  id: number;
}

let msgId = 0;

/* ─── George Personality Responses ─── */
const GEORGE_INTROS = [
  "Hey there! 👋 I'm George — your home's new best friend. I've helped thousands of Orlando homeowners keep their places in top shape. What's going on with yours?",
];

function getGeorgeResponse(userMsg: string): string {
  const lower = userMsg.toLowerCase();
  if (lower.includes("gutter")) return "Smart timing — clogged gutters are the #1 cause of water damage in Florida homes. Our crews handle 1-story ($150) and 2-story ($225) homes. Want me to get you on the schedule?";
  if (lower.includes("junk") || lower.includes("furniture") || lower.includes("get rid")) return "I've got a crew for that! Junk removal starts at $99 depending on volume. They'll haul everything — furniture, appliances, yard waste, you name it. Want a quote?";
  if (lower.includes("pressure") || lower.includes("driveway")) return "Oh, a good pressure wash is SO satisfying. Driveways, patios, pool decks — starting at $120. Your neighbors are going to be jealous. Ready to book?";
  if (lower.includes("handyman") || lower.includes("fix")) return "Our handyman pros handle it all — $75/hr, and they come with tools and know-how. From leaky faucets to shelf mounting to door repairs. What needs fixing?";
  if (lower.includes("pool")) return "Crystal clear pools are my specialty! Monthly pool service starts at $120/mo for basic, $165 for standard, or $210 for the full treatment. Which sounds right for your pool?";
  if (lower.includes("clean")) return "A clean home is a happy home! Our cleaning crews start at $99 for standard service. We do deep cleans, move-out cleans, and recurring service too. What are you looking for?";
  if (lower.includes("landscap") || lower.includes("lawn") || lower.includes("yard")) return "Let's get that yard looking 🔥! Landscaping starts at just $49 for basic maintenance. We do mowing, edging, hedge trimming, mulching — the works. What does your yard need?";
  if (lower.includes("maintain") || lower.includes("check") || lower.includes("scan")) return "Great question! Every Orlando home should get checked seasonally. Our AI Home Scan ($99) gives you a full health report — we check everything from roof to foundation. Want to schedule one?";
  if (lower.includes("demo") || lower.includes("tear")) return "Demo day! 💪 Light demolition starts at $199. We handle shed removal, deck teardown, interior demo — safely and with proper disposal. What are we tearing down?";
  if (lower.includes("moving") || lower.includes("move")) return "Moving is stressful enough — let us handle the heavy lifting! Our moving labor crew is $65/hr and they're fast. Loading, unloading, rearranging — what do you need?";
  if (lower.includes("carpet")) return "Nothing beats fresh, clean carpets! Standard cleaning is $50/room, deep clean $75/room, and if you've got pets we do a special treatment at $89/room. How many rooms?";
  if (lower.includes("garage")) return "Garage cleanouts are one of our most popular services! Starting at $150, we'll organize, haul away junk, and leave you with a garage you can actually park in. Sound good?";
  return "I can definitely help with that! We've got 12 service categories covering just about everything your home needs — from junk removal to handyman work to AI-powered home scans. Want me to find the right pro for you?";
}

/* ─── Main Landing ─── */
export default function Landing() {
  usePageTitle("UpTend — Your Home, Handled.");

  return (
    <div className="landing-root min-h-screen relative overflow-hidden" data-testid="page-landing">
      {/* Ambient background */}
      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      <div className="relative z-10">
        <GeorgeHero />
        <ValueProps />
        <ServicesShowcase />
        <GeorgeCTA />
        <Footer />
      </div>
    </div>
  );
}

/* ─── George Hero: Immersive Conversational Interface ─── */
function GeorgeHero() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "george", text: GEORGE_INTROS[0], id: msgId++ },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [starterIdx, setStarterIdx] = useState(0);
  const [showStarters, setShowStarters] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Rotate placeholder starters
  useEffect(() => {
    const timer = setInterval(() => {
      setStarterIdx((i) => (i + 1) % CONVERSATION_STARTERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSend = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    setInput("");
    setShowStarters(false);
    const userMsg: ChatMessage = { role: "user", text: msg, id: msgId++ };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // George responds inline — NO popup handoff
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      setIsTyping(false);
      const georgeReply = getGeorgeResponse(msg);
      setMessages((prev) => [...prev, { role: "george", text: georgeReply, id: msgId++ }]);
    }, delay);
  }, [input, isTyping]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="relative flex flex-col items-center px-4 pt-12 pb-8" style={{ minHeight: "100svh" }}>
      {/* George's visual presence */}
      <div className="george-presence landing-fade-up">
        <div className="george-ring">
          <div className="george-avatar">
            <div className="george-face">
              <div className="george-eyes">
                <div className="george-eye george-eye-left" />
                <div className="george-eye george-eye-right" />
              </div>
              <div className="george-mouth" />
            </div>
          </div>
        </div>
        <div className="george-status">
          <span className="george-status-dot" />
          Online
        </div>
      </div>

      <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100 landing-fade-up">
        Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">George</span>
      </h1>
      <p className="text-base md:text-lg mt-2 text-stone-500 dark:text-stone-400 landing-fade-up max-w-md text-center" style={{ animationDelay: "0.1s" }}>
        Your AI home expert. He knows your home better than you do.
      </p>

      {/* Conversation area */}
      <div className="george-chat-container mt-6 w-full max-w-xl landing-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="george-chat-scroll">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`george-bubble george-bubble-appear ${
                msg.role === "george" ? "george-bubble-ai" : "george-bubble-human"
              }`}
            >
              {msg.role === "george" && (
                <div className="george-bubble-avatar">G</div>
              )}
              <div className={`george-bubble-content ${msg.role === "george" ? "george-bubble-content-ai" : "george-bubble-content-human"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="george-bubble george-bubble-ai george-bubble-appear">
              <div className="george-bubble-avatar">G</div>
              <div className="george-bubble-content george-bubble-content-ai">
                <span className="george-thinking">
                  <span className="george-thinking-dot" />
                  <span className="george-thinking-dot" />
                  <span className="george-thinking-dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Conversation starters */}
        {showStarters && messages.length <= 1 && (
          <div className="george-starters">
            {CONVERSATION_STARTERS.map((starter, i) => (
              <button
                key={starter}
                onClick={() => handleSend(starter)}
                className="george-starter-pill"
                style={{ animationDelay: `${0.3 + i * 0.08}s` }}
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="george-input-area">
          <div className="george-input-glass">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={CONVERSATION_STARTERS[starterIdx]}
              className="george-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="george-send"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center mt-2">
            George can book pros, give DIY advice, find products &amp; videos — try him out
          </p>
        </div>
      </div>

      {/* Scroll hint */}
      <button
        onClick={() => document.getElementById("value-props")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-6 text-stone-400 hover:text-amber-500 transition-colors"
        aria-label="Scroll down"
      >
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </button>
    </section>
  );
}

/* ─── Value Props ─── */
function ValueProps() {
  const props = [
    { icon: Shield, title: "Guaranteed Pricing", desc: "Price locked at booking. No surprises, no hidden fees, ever." },
    { icon: Zap, title: "Book in 60 Seconds", desc: "Tell George what you need. He finds the right pro and handles the rest." },
    { icon: Clock, title: "Same-Day Available", desc: "Many services available same-day or next-day in the Orlando metro area." },
    { icon: MapPin, title: "Orlando Metro", desc: "Serving Lake Nona, Winter Park, Dr. Phillips, Kissimmee, and beyond." },
  ];

  return (
    <section id="value-props" className="py-20 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {props.map((p, i) => (
          <div key={i} className="landing-glass-card rounded-2xl p-6 text-center george-scroll-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <p.icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">{p.title}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Services Showcase ─── */
function ServicesShowcase() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-900 dark:text-stone-100 mb-3">
          12 Services. One Conversation.
        </h2>
        <p className="text-center text-stone-500 dark:text-stone-400 mb-10 max-w-lg mx-auto">
          Just tell George what your home needs — he'll match you with a vetted pro at a guaranteed price.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SERVICES.map(({ icon: Icon, name, from }, i) => (
            <button
              key={name}
              onClick={() => window.dispatchEvent(new CustomEvent("george:open", { detail: { message: `I need help with ${name}` } }))}
              className="landing-glass-card rounded-xl p-4 text-left group cursor-pointer george-scroll-reveal"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center mb-3 group-hover:from-amber-400/30 group-hover:to-orange-500/30 transition-colors">
                <Icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-medium text-sm text-stone-900 dark:text-stone-100">{name}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">from {from}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Bottom CTA ─── */
function GeorgeCTA() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="george-avatar-sm mx-auto mb-4">G</div>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3">
          Your home deserves better.
        </h2>
        <p className="text-stone-500 dark:text-stone-400 mb-6">
          Stop Googling contractors. Stop comparing quotes. Just tell George what you need.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Talk to George <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-stone-400 mt-3">Free to use • No account needed • Orlando Metro</p>
      </div>
    </section>
  );
}
