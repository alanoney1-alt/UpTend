import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSiteMode } from "@/contexts/site-mode-context";
import LandingClassic from "./landing-classic";
import { ArrowUp, LayoutGrid, Camera } from "lucide-react";

const STARTERS = [
  "What can you help me with?",
  "My garbage disposal is making weird noises",
  "I need my gutters cleaned before rainy season",
  "Help me get rid of old furniture",
  "What should I be doing to maintain my home?",
  "How much does pressure washing cost?",
  "I need a handyman for a few hours",
  "Can you help me with moving labor?",
  "I need light demolition for a bathroom remodel",
  "How do I book a home cleaning?",
  "What are your pool cleaning plans?",
  "My lawn needs serious help — landscaping options?",
  "I need my carpets deep cleaned — pets and all",
  "My garage is a disaster, help me clean it out",
  "Tell me about the AI Home Scan",
];

interface GeorgeResponse {
  text: string;
  buttons?: Array<{ label: string; action: string; style?: string }>;
  bookingDraft?: any;
}

interface ChatMessage {
  role: "george" | "user";
  text: string;
  id: number;
  buttons?: Array<{ label: string; action: string; style?: string }>;
  bookingDraft?: any;
}

let msgId = 0;

const GEORGE_INTRO = [
  "Hey — I'm George. Think of me as your home's best friend.",
  "I've spent years learning everything there is to know about homes — what breaks, what to maintain, when to call a pro, and when you can handle it yourself.",
  "I can book vetted pros for you at guaranteed prices, walk you through DIY fixes step by step, find the right products, pull up how-to videos, even scan your home and tell you what needs attention.",
  "I cover 12 services across Orlando — junk removal, pressure washing, gutters, handyman work, cleaning, landscaping, pool care, and more. All with upfront pricing, no surprises.",
  "So — what's going on with your place?",
];

async function fetchGeorgeResponse(
  userMsg: string,
  history: ChatMessage[],
): Promise<GeorgeResponse> {
  try {
    const conversationHistory = history
      .filter((m) => !m.text.startsWith("Hey — I'm George")) // skip intro from API context
      .map((m) => ({
        role: m.role === "george" ? ("assistant" as const) : ("user" as const),
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
    return {
      text: data.response || "Tell me more about what's going on and I'll point you in the right direction.",
      buttons: data.buttons,
      bookingDraft: data.bookingDraft,
    };
  } catch {
    return { text: "Tell me more about what's going on and I'll point you in the right direction." };
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
      <button onClick={toggle} className="geo-mode-toggle" aria-label="Switch to classic view">
        <LayoutGrid className="w-4 h-4" />
        <span>View Classic Site</span>
      </button>

      <nav className="geo-nav">
        <a href="/book" className="geo-nav-link">Book</a>
        <a href="/services" className="geo-nav-link">Services</a>
        <a href="/pricing" className="geo-nav-link">Pricing</a>
        <a href="/ai/home-scan" className="geo-nav-link">Home Scan</a>
        <a href="/dashboard" className="geo-nav-link">Dashboard</a>
      </nav>

      <div className="geo-ambient" aria-hidden="true">
        <div className="geo-grad geo-grad-1" />
        <div className="geo-grad geo-grad-2" />
        <div className="geo-grad geo-grad-3" />
      </div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Conversation />
      </div>
    </div>
  );
}

/* ─── Full-screen Conversation ─── */
function Conversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [introStep, setIntroStep] = useState(0);
  const [showStarters, setShowStarters] = useState(false);
  const [starterIdx, setStarterIdx] = useState(0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // George introduces himself message by message
  useEffect(() => {
    if (introStep < GEORGE_INTRO.length) {
      const delay = introStep === 0 ? 600 : 800 + GEORGE_INTRO[introStep - 1].length * 8;
      const timer = setTimeout(() => {
        setMessages((p) => [...p, { role: "george", text: GEORGE_INTRO[introStep], id: msgId++ }]);
        setIntroStep((s) => s + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Show starters after intro finishes
      setTimeout(() => setShowStarters(true), 400);
    }
  }, [introStep]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Rotate placeholder
  useEffect(() => {
    const t = setInterval(() => setStarterIdx((i) => (i + 1) % STARTERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const send = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;
    const photoAttached = photoPreview;
    setInput("");
    setPhotoPreview(null);
    setShowStarters(false);
    const displayText = photoAttached ? `${msg}\n[Photo attached]` : msg;
    const userMsg: ChatMessage = { role: "user", text: displayText, id: msgId++ };
    setMessages((p) => {
      const updated = [...p, userMsg];
      setIsTyping(true);
      fetchGeorgeResponse(msg, updated).then((response) => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          role: "george",
          text: response.text,
          id: msgId++,
          buttons: response.buttons,
          bookingDraft: response.bookingDraft,
        }]);
      });
      return updated;
    });
    inputRef.current?.focus();
  }, [input, isTyping, photoPreview]);

  const handleAction = useCallback((btn: { label: string; action: string }) => {
    if (btn.action.startsWith("navigate:")) {
      window.location.href = btn.action.replace("navigate:", "");
    } else if (btn.action.startsWith("message:")) {
      send(btn.action.replace("message:", ""));
    } else {
      send(btn.label);
    }
  }, [send]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="geo-conversation">
      {/* George's presence — subtle, not flashy */}
      <div className="geo-header">
        <div className="geo-avatar-circle" />
        <div>
          <div className="geo-header-name">George</div>
          <div className="geo-header-status">
            <span className="geo-status-dot" />
            Online now
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="geo-messages">
        {messages.map((m) => (
          <div key={m.id} className={`geo-msg geo-msg-in ${m.role === "george" ? "geo-msg-ai" : "geo-msg-you"}`}>
            <div className={m.role === "george" ? "geo-txt-ai" : "geo-txt-you"}>{m.text}</div>
            {m.buttons && m.buttons.length > 0 && (
              <div className="geo-actions">
                {m.buttons.map((btn, i) => (
                  <button key={i} onClick={() => handleAction(btn)} className="geo-action-btn">
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            {m.bookingDraft && (
              <div className="geo-booking-card">
                <div className="geo-booking-title">{m.bookingDraft.serviceName}</div>
                <div className="geo-booking-price">
                  ${m.bookingDraft.quote?.totalPrice || m.bookingDraft.quote?.estimatedTotal}
                </div>
                {m.bookingDraft.address && (
                  <div className="geo-booking-detail">{m.bookingDraft.address}</div>
                )}
                <a
                  href={`/book?service=${m.bookingDraft.serviceId}&draft=${m.bookingDraft.draftId}`}
                  className="geo-action-btn"
                  style={{ marginTop: '8px', display: 'inline-block' }}
                >
                  Confirm & Book &rarr;
                </a>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="geo-msg geo-msg-ai geo-msg-in">
            <div className="geo-txt-ai">
              <span className="geo-think"><i /><i /><i /></span>
            </div>
          </div>
        )}
        {/* Typing indicator during intro */}
        {introStep > 0 && introStep < GEORGE_INTRO.length && (
          <div className="geo-msg geo-msg-ai geo-msg-in">
            <div className="geo-txt-ai">
              <span className="geo-think"><i /><i /><i /></span>
            </div>
          </div>
        )}

        {/* Starters — just natural suggestions, not buttons */}
        {showStarters && (
          <div className="geo-starters">
            <div className="geo-starters-label">People usually ask things like:</div>
            {STARTERS.map((s, i) => (
              <button key={s} onClick={() => send(s)} className="geo-pill" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input — always at bottom */}
      <div className="geo-input-dock">
        {photoPreview && (
          <div className="geo-photo-preview">
            <img src={photoPreview} alt="Attached" className="geo-photo-thumb" />
            <button onClick={() => setPhotoPreview(null)} className="geo-photo-remove" aria-label="Remove photo">&times;</button>
          </div>
        )}
        <div className="geo-field">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
            aria-hidden="true"
          />
          <button onClick={() => fileRef.current?.click()} className="geo-photo-btn" aria-label="Attach photo">
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={STARTERS[starterIdx]}
            className="geo-in"
          />
          <button onClick={() => send()} disabled={(!input.trim() && !photoPreview) || isTyping} className="geo-send" aria-label="Send">
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
