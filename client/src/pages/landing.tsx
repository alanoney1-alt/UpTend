import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/landing/footer";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSiteMode } from "@/contexts/site-mode-context";
import LandingClassic from "./landing-classic";
import {
  Truck, TreePine, Droplets, Wrench, Sparkles, CloudRain,
  Scissors, Waves, HardHat, Hammer, ScanLine, Warehouse,
  ArrowUp, ArrowRight, ChevronDown, Shield, Clock,
  MapPin, Zap, LayoutGrid,
} from "lucide-react";

/* ─── Real Services ─── */
const SERVICES = [
  { icon: Truck, name: "Junk Removal", from: "$99" },
  { icon: Droplets, name: "Pressure Washing", from: "$120" },
  { icon: CloudRain, name: "Gutter Cleaning", from: "$150" },
  { icon: Wrench, name: "Handyman", from: "$75/hr" },
  { icon: HardHat, name: "Moving Labor", from: "$65/hr" },
  { icon: Hammer, name: "Light Demolition", from: "$199" },
  { icon: Sparkles, name: "Home Cleaning", from: "$99" },
  { icon: Waves, name: "Pool Cleaning", from: "$120/mo" },
  { icon: TreePine, name: "Landscaping", from: "$49" },
  { icon: Scissors, name: "Carpet Cleaning", from: "$50/room" },
  { icon: Warehouse, name: "Garage Cleanout", from: "$150" },
  { icon: ScanLine, name: "AI Home Scan", from: "$99" },
] as const;

const STARTERS = [
  "My garbage disposal is making weird noises",
  "I need my gutters cleaned before rainy season",
  "Help me get rid of old furniture",
  "My driveway looks terrible — pressure wash?",
  "What should I be maintaining in my home?",
];

interface ChatMessage {
  role: "george" | "user";
  text: string;
  id: number;
}

let msgId = 0;

async function fetchGeorgeResponse(
  userMsg: string,
  history: ChatMessage[],
): Promise<string> {
  try {
    const conversationHistory = history.map((m) => ({
      role: m.role === "george" ? "assistant" as const : "user" as const,
      content: m.text,
    }));
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        conversationType: "general",
        currentPage: "/",
        conversationHistory,
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.response || "I can help with that. Want me to find the right pro for you?";
  } catch {
    return "I can help with that. We cover 12 service categories — from junk removal to handyman work to AI-powered home scans. Want me to find the right pro for you?";
  }
}

/* ─── Main ─── */
export default function Landing() {
  const { mode } = useSiteMode();
  if (mode === "classic") return <LandingClassic />;
  return <GeorgeLanding />;
}

function GeorgeLanding() {
  usePageTitle("UpTend — Your Home, Handled.");
  const { toggle } = useSiteMode();

  return (
    <div className="geo-root" data-testid="page-landing">
      {/* Mode toggle */}
      <button onClick={toggle} className="geo-mode-toggle" aria-label="Switch to classic view">
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Classic View</span>
      </button>

      <div className="geo-ambient" aria-hidden="true">
        <div className="geo-grad geo-grad-1" />
        <div className="geo-grad geo-grad-2" />
        <div className="geo-grad geo-grad-3" />
      </div>
      <div className="relative z-10">
        <Hero />
        <Props />
        <Services />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}

/* ─── Hero ─── */
function Hero() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "george", text: "I'm George. I know everything about homes — what's going on with yours?", id: msgId++ },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [starterIdx, setStarterIdx] = useState(0);
  const [showStarters, setShowStarters] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const t = setInterval(() => setStarterIdx((i) => (i + 1) % STARTERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const send = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    setInput("");
    setShowStarters(false);
    const userMsg: ChatMessage = { role: "user", text: msg, id: msgId++ };
    setMessages((p) => {
      const updated = [...p, userMsg];
      setIsTyping(true);
      fetchGeorgeResponse(msg, updated).then((response) => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { role: "george", text: response, id: msgId++ }]);
      });
      return updated;
    });
  }, [input, isTyping]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <section className="geo-hero">
      {/* Identity */}
      <div className="geo-id">
        <div className="geo-ring">
          <div className="geo-orb">
            <div className="geo-pulse" />
          </div>
        </div>
        <div className="geo-name">George</div>
        <div className="geo-sub">Home Intelligence</div>
      </div>

      {/* Conversation */}
      <div className="geo-conv">
        <div className="geo-scroll">
          {messages.map((m) => (
            <div key={m.id} className={`geo-msg geo-msg-in ${m.role === "george" ? "geo-msg-ai" : "geo-msg-you"}`}>
              {m.role === "george" && <div className="geo-dot" />}
              <div className={m.role === "george" ? "geo-txt-ai" : "geo-txt-you"}>{m.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="geo-msg geo-msg-ai geo-msg-in">
              <div className="geo-dot" />
              <div className="geo-txt-ai">
                <span className="geo-think"><i /><i /><i /></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Starters */}
        {showStarters && messages.length <= 1 && (
          <div className="geo-starters">
            {STARTERS.map((s, i) => (
              <button key={s} onClick={() => send(s)} className="geo-pill" style={{ animationDelay: `${0.2 + i * 0.06}s` }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="geo-bar">
          <div className="geo-field">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={STARTERS[starterIdx]}
              className="geo-in"
            />
            <button onClick={() => send()} disabled={!input.trim() || isTyping} className="geo-send" aria-label="Send">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="geo-hint">George books pros, gives DIY advice, and finds products — try asking anything</p>
        </div>
      </div>

      <button onClick={() => document.getElementById("props")?.scrollIntoView({ behavior: "smooth" })} className="geo-down" aria-label="Scroll">
        <ChevronDown className="w-5 h-5" />
      </button>
    </section>
  );
}

/* ─── Value Props ─── */
function Props() {
  const items = [
    { icon: Shield, title: "Guaranteed Pricing", desc: "Price locked at booking. No surprises." },
    { icon: Zap, title: "Book in 60 Seconds", desc: "Tell George. He handles the rest." },
    { icon: Clock, title: "Same-Day Available", desc: "Many services available today." },
    { icon: MapPin, title: "Orlando Metro", desc: "Lake Nona to Winter Park and beyond." },
  ];
  return (
    <section id="props" className="geo-section">
      <div className="geo-grid-4">
        {items.map((p, i) => (
          <div key={i} className="geo-card geo-card-sm geo-reveal" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="geo-icon-wrap"><p.icon className="w-5 h-5" /></div>
            <h3 className="geo-card-title">{p.title}</h3>
            <p className="geo-card-desc">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Services ─── */
function Services() {
  return (
    <section className="geo-section">
      <div className="geo-section-inner">
        <h2 className="geo-h2">12 Services. One Conversation.</h2>
        <p className="geo-p">Tell George what your home needs — he matches you with a vetted pro at a guaranteed price.</p>
        <div className="geo-grid-services">
          {SERVICES.map(({ icon: Icon, name, from }, i) => (
            <div key={name} className="geo-card geo-card-service geo-reveal" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="geo-icon-wrap"><Icon className="w-5 h-5" /></div>
              <div>
                <p className="geo-card-title">{name}</p>
                <p className="geo-card-price">from {from}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="geo-section geo-cta">
      <h2 className="geo-h2">Your home deserves better.</h2>
      <p className="geo-p">Stop Googling contractors. Stop comparing quotes. Just talk to George.</p>
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="geo-btn">
        Talk to George <ArrowRight className="w-4 h-4" />
      </button>
      <p className="geo-fine">Free to use · No account needed · Orlando Metro</p>
    </section>
  );
}
