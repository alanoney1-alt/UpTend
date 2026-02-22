import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSiteMode } from "@/contexts/site-mode-context";
import LandingClassic from "./landing-classic";
import DOMPurify from "dompurify";
import { ArrowUp, LayoutGrid, Camera, Mic, MicOff, ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { VideoPlayer, extractAllVideoIds } from "@/components/ai/video-player";
import { PropertyCard, QuoteCard, BundleCard, BreakdownCard, BookingCard, HomeScoreCard } from "@/components/george/RichCards";
import { CapabilityCard } from "@/components/george/CapabilityCard";

// ─── Starters — categorized, seasonal ─────────────────────────────────────

const STARTER_CATEGORIES = {
  booking: [
    "How much does pressure washing cost?",
    "I need my gutters cleaned before rainy season",
    "I need a handyman for a few hours",
    "How do I book a home cleaning?",
  ],
  diy: [
    "My garbage disposal is making weird noises",
    "How do I fix a running toilet?",
    "My AC isn't cooling — what should I check?",
    "Walk me through replacing a light switch",
  ],
  homeHealth: [
    "What should I be maintaining this month?",
    "Tell me about the Home Health Score",
    "Run a home health check on my property",
    "When should I replace my air filters?",
  ],
  photo: [
    "Can you diagnose something from a picture?",
    "I want to send a photo of a problem",
    "Can you give me a quote from a photo?",
  ],
  explore: [
    "Tell me about the AI Home Scan",
    "What can you help me with?",
    "How does the Pro Academy work?",
    "How do you vet your Pros?",
  ],
};

function getSeasonalStarters(): string[] {
  const month = new Date().getMonth();
  const picks: string[] = [];
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // One from each category, with seasonal weighting
  if (month >= 5 && month <= 7) {
    // Jun-Aug: Hurricane season
    picks.push("I need my gutters cleaned before hurricane season");
  } else if (month >= 2 && month <= 4) {
    // Mar-May: Spring
    picks.push("How much does pressure washing cost?");
  } else {
    picks.push(pick(STARTER_CATEGORIES.booking));
  }
  picks.push(pick(STARTER_CATEGORIES.diy));
  picks.push(pick(STARTER_CATEGORIES.homeHealth));
  picks.push(pick(STARTER_CATEGORIES.photo));
  picks.push(pick(STARTER_CATEGORIES.explore));
  return picks;
}

// ─── All starters for placeholder rotation ────────────────────────────────

const ALL_STARTERS = Object.values(STARTER_CATEGORIES).flat();

// ─── YouTube URL patterns ─────────────────────────────────────────────────

const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}[^\s<>"]*/g;

// ─── Markdown renderer (ported from uptend-guide.tsx) ─────────────────────

function renderContent(text: string): string {
  let cleaned = text.replace(YT_URL_RE, "").replace(/\n{3,}/g, "\n\n");

  // Step 1: Extract markdown links [text](url) → placeholders to avoid double-processing
  const linkSlots: string[] = [];
  cleaned = cleaned.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    const isProduct = /amazon\.com|homedepot\.com|lowes\.com|walmart\.com|harborfreight\.com|acehardware\.com|target\.com/.test(url);
    const icon = isProduct ? "\u{1F6D2} " : "";
    const tag = `<a href="${url}" target="_blank" rel="noopener" class="geo-link">${icon}${label}</a>`;
    linkSlots.push(tag);
    return `\x00LINK${linkSlots.length - 1}\x00`;
  });

  // Step 2: Convert bare URLs (not already in a placeholder) → placeholders
  cleaned = cleaned.replace(/(https?:\/\/[^\s<>"]+)/g, (_m, url) => {
    const isProduct = /amazon\.com|homedepot\.com|lowes\.com|walmart\.com|harborfreight\.com|acehardware\.com|target\.com/.test(url);
    const label = isProduct ? "\u{1F6D2} View Product" : url.length > 40 ? url.substring(0, 40) + "\u2026" : url;
    const tag = `<a href="${url}" target="_blank" rel="noopener" class="geo-link">${label}</a>`;
    linkSlots.push(tag);
    return `\x00LINK${linkSlots.length - 1}\x00`;
  });

  // Step 3: Bold (**text** and __text__), italic (*text*)
  let html = cleaned
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

  // Step 4: Restore link placeholders
  html = html.replace(/\x00LINK(\d+)\x00/g, (_m, idx) => linkSlots[parseInt(idx)]);

  return DOMPurify.sanitize(html);
}

// ─── Session management ───────────────────────────────────────────────────

const SESSION_KEY = "uptend-george-session";

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `george-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// ─── Types ────────────────────────────────────────────────────────────────

interface GeorgeResponse {
  text: string;
  buttons?: Array<{ label: string; action: string; style?: string }>;
  quickActions?: Array<{ label: string; action: string }>;
  propertyData?: any;
  quoteCard?: any;
  bundleData?: any;
  breakdown?: any;
  bookingData?: any;
  homeScore?: any;
}

interface ChatMessage {
  role: "george" | "user";
  text: string;
  id: number;
  isCapabilityCard?: boolean;
  buttons?: Array<{ label: string; action: string; style?: string }>;
  quickActions?: Array<{ label: string; action: string }>;
  propertyData?: any;
  quoteCard?: any;
  bundleData?: any;
  breakdown?: any;
  bookingData?: any;
  homeScore?: any;
  videoIds?: string[];
  feedback?: "up" | "down" | null;
}

let msgId = 0;

// ─── Intro sequence ───────────────────────────────────────────────────────

const GEORGE_INTRO: Array<{ text: string; isCapabilityCard?: boolean }> = [
  { text: "Hey \u2014 I'm George. Think of me as your home's best friend." },
  { text: "", isCapabilityCard: true },
  { text: "I cover everything in Orlando Metro \u2014 all upfront pricing, no surprises." },
  { text: "So \u2014 what's going on with your place?" },
];

// ─── API call — uses guide/chat for rich responses ────────────────────────

async function fetchGeorgeResponse(userMsg: string): Promise<GeorgeResponse> {
  try {
    const res = await fetch("/api/ai/guide/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        sessionId: getSessionId(),
        context: { page: "/", userRole: "visitor" },
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

    // Parse actions array into typed card data
    const result: GeorgeResponse = {
      text: data.reply || data.response || "Tell me more about what's going on and I'll point you in the right direction.",
      buttons: data.buttons,
      quickActions: data.quickActions,
    };

    if (data.actions && Array.isArray(data.actions)) {
      for (const action of data.actions) {
        switch (action.type) {
          case "property_scan":
            result.propertyData = action.data;
            break;
          case "lock_quote":
            result.quoteCard = action.data;
            break;
          case "bundle":
            result.bundleData = action.data;
            break;
          case "show_breakdown":
          case "breakdown":
            result.breakdown = action.data;
            break;
          case "booking":
          case "book":
            result.bookingData = action.data;
            break;
          case "home_score":
            result.homeScore = action.data;
            break;
        }
      }
    }

    // Also handle legacy bookingDraft format
    if (data.bookingDraft) result.bookingData = data.bookingDraft;

    return result;
  } catch {
    return { text: "Tell me more about what's going on and I'll point you in the right direction." };
  }
}

// ─── Voice input hook ─────────────────────────────────────────────────────

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback((onResult: (text: string) => void) => {
    if (!isSupported) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript;
      if (text) onResult(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, start, stop };
}

/* ─── Main ─── */
export default function Landing() {
  const { mode } = useSiteMode();
  if (mode === "classic") return <LandingClassic />;
  return <GeorgeLanding />;
}

function GeorgeLanding() {
  usePageTitle("UpTend \u2014 Your Home, Handled.");
  const { toggle } = useSiteMode();

  return (
    <div className="geo-root" data-testid="page-landing">
      <button onClick={toggle} className="geo-mode-toggle" aria-label="Switch to classic view">
        <LayoutGrid className="w-4 h-4" />
        <span>View Classic Site</span>
      </button>



      <div className="geo-ambient" aria-hidden="true">
        <div className="geo-grad geo-grad-1" />
        <div className="geo-grad geo-grad-2" />
        <div className="geo-grad geo-grad-3" />
      </div>
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
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
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported: voiceSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition();

  // Seasonal starters — computed once per page load
  const starters = useMemo(() => getSeasonalStarters(), []);

  // George introduces himself message by message
  useEffect(() => {
    if (introStep < GEORGE_INTRO.length) {
      const intro = GEORGE_INTRO[introStep];
      const prevLen = introStep > 0 ? (GEORGE_INTRO[introStep - 1].text?.length || 40) : 0;
      const delay = introStep === 0 ? 600 : intro.isCapabilityCard ? 400 : 600 + prevLen * 6;
      const timer = setTimeout(() => {
        setMessages((p) => [...p, {
          role: "george",
          text: intro.text,
          id: msgId++,
          isCapabilityCard: intro.isCapabilityCard,
        }]);
        setIntroStep((s) => s + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => setShowStarters(true), 400);
    }
  }, [introStep]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Rotate placeholder
  useEffect(() => {
    const t = setInterval(() => setStarterIdx((i) => (i + 1) % ALL_STARTERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Detect if user scrolled up (show scroll-to-bottom button)
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const handleScroll = () => {
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollBtn(!isNearBottom);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
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
      fetchGeorgeResponse(msg).then((response) => {
        setIsTyping(false);
        // Extract video IDs from response text
        const videoIds = extractAllVideoIds(response.text);
        setMessages((prev) => [...prev, {
          role: "george",
          text: response.text,
          id: msgId++,
          buttons: response.buttons,
          quickActions: response.quickActions,
          propertyData: response.propertyData,
          quoteCard: response.quoteCard,
          bundleData: response.bundleData,
          breakdown: response.breakdown,
          bookingData: response.bookingData,
          homeScore: response.homeScore,
          videoIds: videoIds.length > 0 ? videoIds : undefined,
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

  const handleFeedback = useCallback((msgId: number, type: "up" | "down") => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, feedback: type } : m));
    // Fire and forget — send to API
    fetch("/api/ai/guide/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId(), messageId: String(msgId), feedbackType: type === "up" ? "positive" : "negative" }),
    }).catch(() => {});
  }, []);

  const handleVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
    } else {
      startVoice((text) => {
        setInput(text);
        // Auto-send after voice recognition
        setTimeout(() => send(text), 100);
      });
    }
  }, [isListening, startVoice, stopVoice, send]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="geo-conversation">
      {/* George's presence */}
      <div className="geo-header">
        <div className={`geo-avatar-circle ${isTyping ? "geo-avatar-thinking" : ""}`} />
        <div>
          <div className="geo-header-name">George</div>
          <div className="geo-header-status">
            <span className={`geo-status-dot ${isTyping ? "geo-status-thinking" : ""}`} />
            {isTyping ? "Thinking..." : "Online now"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="geo-messages" ref={messagesRef}>
        {messages.map((m) => (
          <div key={m.id} className={`geo-msg geo-msg-in ${m.role === "george" ? "geo-msg-ai" : "geo-msg-you"}`}>
            {/* Capability card (intro only) */}
            {m.isCapabilityCard ? (
              <CapabilityCard onSelect={send} />
            ) : (
              <div
                className={m.role === "george" ? "geo-txt-ai" : "geo-txt-you"}
                dangerouslySetInnerHTML={{ __html: renderContent(m.text) }}
              />
            )}

            {/* Rich cards */}
            {m.videoIds && m.videoIds.map((vid) => (
              <div key={vid} className="geo-card-in mt-2">
                <VideoPlayer videoId={vid} />
              </div>
            ))}
            {m.propertyData && <PropertyCard data={m.propertyData} />}
            {m.quoteCard && <QuoteCard data={m.quoteCard} />}
            {m.bundleData && <BundleCard data={m.bundleData} />}
            {m.breakdown && <BreakdownCard data={m.breakdown} />}
            {m.bookingData && <BookingCard data={m.bookingData} />}
            {m.homeScore && <HomeScoreCard data={m.homeScore} />}

            {/* Action buttons */}
            {m.buttons && m.buttons.length > 0 && (
              <div className="geo-actions">
                {m.buttons.map((btn, i) => (
                  <button key={i} onClick={() => handleAction(btn)} className="geo-action-btn">
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick actions (contextual follow-ups from API) */}
            {m.quickActions && m.quickActions.length > 0 && (
              <div className="geo-quick-actions">
                {m.quickActions.map((qa, i) => (
                  <button key={i} onClick={() => handleAction(qa)} className="geo-pill geo-pill-sm">
                    {qa.label}
                  </button>
                ))}
              </div>
            )}

            {/* Feedback buttons (George messages only, after API responses) */}
            {m.role === "george" && !m.isCapabilityCard && m.text && !GEORGE_INTRO.some(g => g.text === m.text) && (
              <div className={`geo-feedback ${m.feedback ? "geo-feedback-done" : ""}`}>
                <button
                  onClick={() => handleFeedback(m.id, "up")}
                  className={`geo-feedback-btn ${m.feedback === "up" ? "geo-feedback-active" : ""}`}
                  aria-label="Good response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleFeedback(m.id, "down")}
                  className={`geo-feedback-btn ${m.feedback === "down" ? "geo-feedback-active" : ""}`}
                  aria-label="Poor response"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
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

        {/* Starters */}
        {showStarters && (
          <div className="geo-starters">
            <div className="geo-starters-label">People usually ask things like:</div>
            {starters.map((s, i) => (
              <button key={s} onClick={() => send(s)} className="geo-pill" style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Scroll-to-bottom indicator */}
      {showScrollBtn && (
        <button onClick={scrollToBottom} className="geo-scroll-btn" aria-label="Scroll to bottom">
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

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
          {voiceSupported && (
            <button onClick={handleVoice} className={`geo-photo-btn ${isListening ? "geo-voice-active" : ""}`} aria-label={isListening ? "Stop listening" : "Voice input"}>
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={ALL_STARTERS[starterIdx]}
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
