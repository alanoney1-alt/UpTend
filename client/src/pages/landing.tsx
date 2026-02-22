import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSiteMode } from "@/contexts/site-mode-context";
import LandingClassic from "./landing-classic";
import DOMPurify from "dompurify";
import { ArrowUp, Camera, Mic, MicOff, ThumbsUp, ThumbsDown, ChevronDown, UserCircle, LogOut, Settings, Volume2, VolumeX, LayoutGrid, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { VideoPlayer, extractAllVideoIds } from "@/components/ai/video-player";
import { PropertyCard, QuoteCard, BundleCard, BreakdownCard, BookingCard, HomeScoreCard } from "@/components/george/RichCards";
import { CapabilityCard } from "@/components/george/CapabilityCard";

// ─── Sound system (Item 9) ──────────────────────────────────────────────────

const SOUNDS_ENABLED_KEY = "uptend-george-sounds";

function createSoundSystem() {
  let ctx: AudioContext | null = null;
  let enabled = typeof window !== "undefined" && localStorage.getItem(SOUNDS_ENABLED_KEY) !== "false";

  const getCtx = () => {
    if (!ctx) ctx = new AudioContext();
    return ctx;
  };

  const play = (type: "send" | "receive" | "lock") => {
    if (!enabled) return;
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);

      if (type === "send") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.12);
      } else if (type === "receive") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.06);
        gain.gain.setValueAtTime(0.05, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.1);
      } else if (type === "lock") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523, ac.currentTime);
        osc.frequency.setValueAtTime(659, ac.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.2);
      }
    } catch {
      // Silently fail if AudioContext blocked
    }
  };

  return {
    play,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      localStorage.setItem(SOUNDS_ENABLED_KEY, String(enabled));
      return enabled;
    },
  };
}

const georgeSound = createSoundSystem();
// Expose globally for RichCards sound integration
if (typeof window !== "undefined") {
  (window as any).__georgeSound = georgeSound;
}

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

  if (month >= 2 && month <= 4) {
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

// ─── YouTube URL patterns ─────────────────────────────────────────────────

const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}[^\s<>"]*/g;

// ─── Markdown renderer (ported from uptend-guide.tsx) ─────────────────────

function renderContent(text: string): string {
  let cleaned = text.replace(YT_URL_RE, "").replace(/\n{3,}/g, "\n\n");

  const linkSlots: string[] = [];
  cleaned = cleaned.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    const isProduct = /amazon\.com|homedepot\.com|lowes\.com|walmart\.com|harborfreight\.com|acehardware\.com|target\.com/.test(url);
    const icon = isProduct ? "\u{1F6D2} " : "";
    const tag = `<a href="${url}" target="_blank" rel="noopener" class="geo-link">${icon}${label}</a>`;
    linkSlots.push(tag);
    return `\x00LINK${linkSlots.length - 1}\x00`;
  });

  cleaned = cleaned.replace(/(https?:\/\/[^\s<>"]+)/g, (_m, url) => {
    const isProduct = /amazon\.com|homedepot\.com|lowes\.com|walmart\.com|harborfreight\.com|acehardware\.com|target\.com/.test(url);
    const label = isProduct ? "\u{1F6D2} View Product" : url.length > 40 ? url.substring(0, 40) + "\u2026" : url;
    const tag = `<a href="${url}" target="_blank" rel="noopener" class="geo-link">${label}</a>`;
    linkSlots.push(tag);
    return `\x00LINK${linkSlots.length - 1}\x00`;
  });

  let html = cleaned
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

  html = html.replace(/\x00LINK(\d+)\x00/g, (_m, idx) => linkSlots[parseInt(idx)]);

  return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
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

// ─── API call — uses guide/chat for rich responses ────────────────────────

async function fetchGeorgeResponse(userMsg: string, photoDataUrl?: string): Promise<GeorgeResponse> {
  try {
    let photoAnalysis: any = undefined;

    if (photoDataUrl) {
      try {
        const analyzeRes = await fetch("/api/ai/guide/photo-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoUrl: photoDataUrl,
            sessionId: getSessionId(),
            serviceType: "junk_removal",
          }),
        });
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          photoAnalysis = analyzeData.analysis || {};
        }
      } catch {
        // Photo analysis failed — continue with text only
      }
    }

    const res = await fetch("/api/ai/guide/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg || (photoDataUrl ? "I uploaded a photo for analysis." : ""),
        sessionId: getSessionId(),
        context: { page: "/", userRole: "visitor" },
        ...(photoAnalysis ? { photoAnalysis } : {}),
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();

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

// ─── George's Avatar SVG (Item 3) ─────────────────────────────────────────

function GeorgeOrb({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <radialGradient id="george-orb" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#92400E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#451A03" stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#george-orb)" />
      {/* House silhouette */}
      <path d="M20 12 L27 18 L27 27 L13 27 L13 18 Z" fill="rgba(255,255,255,0.15)" />
      <path d="M20 12 L27 18 L13 18 Z" fill="rgba(255,255,255,0.22)" />
      <rect x="17.5" y="22" width="5" height="5" rx="0.5" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
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
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundOn, setSoundOn] = useState(georgeSound.enabled);

  return (
    <div className="geo-root" data-testid="page-landing">
      {/* Close dropdowns on outside click */}
      {(showAuthMenu || showSettings) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowAuthMenu(false); setShowSettings(false); }} />
      )}

      {/* Top-right controls: auth + settings gear */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        {/* Auth button */}
        <div className="relative">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="geo-settings-btn" style={{ width: "auto", padding: "0 12px", gap: "6px", display: "flex", alignItems: "center" }}>
                <UserCircle className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">{user.firstName || "Account"}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="geo-settings-btn"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => { setShowAuthMenu(!showAuthMenu); setShowSettings(false); }}
                className="geo-settings-btn"
                aria-label="Sign in or sign up"
              >
                <UserCircle className="w-4 h-4" />
              </button>
              {showAuthMenu && (
                <div className="geo-settings-panel z-50">
                  <Link href="/login" onClick={() => setShowAuthMenu(false)}>
                    <div className="geo-settings-item">
                      <UserCircle className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="text-sm font-medium text-stone-200">Sign In</div>
                        <div className="text-xs text-stone-500">Welcome back</div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/signup" onClick={() => setShowAuthMenu(false)}>
                    <div className="geo-settings-item">
                      <UserCircle className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-stone-200">Create Account</div>
                        <div className="text-xs text-stone-500">Free, takes 30 seconds</div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Settings gear (Item 10) */}
        <div className="relative">
          <button
            onClick={() => { setShowSettings(!showSettings); setShowAuthMenu(false); }}
            className="geo-settings-btn"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {showSettings && (
            <div className="geo-settings-panel z-50">
              <button
                onClick={() => { toggle(); setShowSettings(false); }}
                className="geo-settings-item w-full"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Switch to Classic Site</span>
              </button>
              <button
                onClick={() => {
                  const newState = georgeSound.toggle();
                  setSoundOn(newState);
                }}
                className="geo-settings-item w-full"
              >
                {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>Sound Effects</span>
                <div className={`geo-settings-toggle ${soundOn ? "active" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>

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
  const [introReady, setIntroReady] = useState(false);
  const [showStarters, setShowStarters] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [cameraOverlay, setCameraOverlay] = useState(false);
  const [cameraPhoto, setCameraPhoto] = useState<string | null>(null);
  const [cameraAnalysis, setCameraAnalysis] = useState<string | null>(null);
  const [cameraAnalyzing, setCameraAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const { isListening, isSupported: voiceSupported, start: startVoice, stop: stopVoice } = useSpeechRecognition();

  // Seasonal starters
  const starters = useMemo(() => getSeasonalStarters(), []);

  // Cinematic intro: greeting appears immediately, subtitle + dock after 1.2s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIntroReady(true);
      setTimeout(() => setShowStarters(true), 400);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Detect if user scrolled up
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
    if ((!msg && !photoDataUrl) || isTyping) return;

    // Sound: whoosh on send
    georgeSound.play("send");

    const currentPhotoData = photoDataUrl;
    const photoAttached = !!currentPhotoData;
    setInput("");
    setPhotoPreview(null);
    setPhotoDataUrl(null);
    setShowStarters(false);

    const displayText = photoAttached ? (msg ? `${msg}\n\u{1F4F7} Photo attached` : "\u{1F4F7} Sent a photo for analysis") : msg;
    const userMsg: ChatMessage = { role: "user", text: displayText, id: msgId++ };
    setMessages((p) => {
      const updated = [...p, userMsg];
      setIsTyping(true);
      fetchGeorgeResponse(msg || "I uploaded a photo for analysis.", currentPhotoData || undefined).then((response) => {
        setIsTyping(false);
        // Sound: pop on receive
        georgeSound.play("receive");
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
  }, [input, isTyping, photoDataUrl]);

  const handleAction = useCallback((btn: { label: string; action: string }) => {
    if (btn.action.startsWith("navigate:")) {
      window.location.href = btn.action.replace("navigate:", "");
    } else if (btn.action.startsWith("message:")) {
      send(btn.action.replace("message:", ""));
    } else {
      send(btn.label);
    }
  }, [send]);

  // Photo from inline file input (fallback)
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setPhotoDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Photo from camera overlay (Item 5)
  const handleCameraPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCameraPhoto(dataUrl);
      setCameraAnalyzing(true);

      // Analyze the photo
      try {
        const analyzeRes = await fetch("/api/ai/guide/photo-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoUrl: dataUrl,
            sessionId: getSessionId(),
            serviceType: "junk_removal",
          }),
        });
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          const analysis = analyzeData.analysis;
          // Build a summary from the analysis
          let summaryParts: string[] = [];
          if (analysis?.description) summaryParts.push(analysis.description);
          if (analysis?.identified_items?.length) summaryParts.push(`Items: ${analysis.identified_items.join(", ")}`);
          if (analysis?.estimated_cost) summaryParts.push(`Estimated cost: ${analysis.estimated_cost}`);
          if (analysis?.recommendation) summaryParts.push(analysis.recommendation);
          setCameraAnalysis(summaryParts.join("\n") || "Photo received. Let me take a closer look...");
        } else {
          setCameraAnalysis("Photo received. Let me analyze this for you...");
        }
      } catch {
        setCameraAnalysis("Photo received. Let me take a closer look...");
      }
      setCameraAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const closeCameraOverlay = useCallback(() => {
    // If we have a photo and analysis, add them to chat
    if (cameraPhoto) {
      const userMsg: ChatMessage = {
        role: "user",
        text: "\u{1F4F7} Sent a photo for analysis",
        id: msgId++,
      };
      const georgeMsg: ChatMessage = {
        role: "george",
        text: cameraAnalysis || "Let me analyze this photo for you...",
        id: msgId++,
      };
      setMessages((p) => [...p, userMsg, georgeMsg]);
      setShowStarters(false);
    }
    setCameraOverlay(false);
    setCameraPhoto(null);
    setCameraAnalysis(null);
    setCameraAnalyzing(false);
  }, [cameraPhoto, cameraAnalysis]);

  const handleFeedback = useCallback((msgId: number, type: "up" | "down") => {
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, feedback: type } : m));
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
        setTimeout(() => send(text), 100);
      });
    }
  }, [isListening, startVoice, stopVoice, send]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="geo-conversation">
      {/* George's presence — iconic orb avatar */}
      <div className="geo-header">
        <div className={`geo-avatar-circle ${isTyping ? "geo-avatar-thinking" : ""}`}>
          <GeorgeOrb />
        </div>
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
        {/* Cinematic greeting (Item 2) — replaces old drip-feed intro */}
        <div className={`geo-intro-block ${hasMessages ? "geo-intro-collapsed" : ""}`}>
          <div className="geo-greeting">Your home, handled.</div>
          {introReady && (
            <div className="geo-subtitle">
              I'm George — your home's best friend. I cover everything in Orlando Metro, all upfront pricing, no surprises.
            </div>
          )}
        </div>

        {/* Conversation messages */}
        {messages.map((m) => (
          <div key={m.id} className={`geo-msg geo-msg-in ${m.role === "george" ? "geo-msg-ai" : "geo-msg-you"}`}>
            <div
              className={m.role === "george" ? "geo-txt-ai" : "geo-txt-you"}
              dangerouslySetInnerHTML={{ __html: renderContent(m.text) }}
            />

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

            {/* Quick actions */}
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
            {m.role === "george" && m.text && (
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
            <div className="geo-txt-ai geo-txt-thinking">
              <div className="geo-think-shimmer" />
            </div>
          </div>
        )}

        {/* Starters */}
        {showStarters && !hasMessages && (
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

      {/* Capability Dock — persistent below messages, above input (Item 4) */}
      {!hasMessages && introReady && (
        <div className="geo-capability-dock">
          <CapabilityCard onSelect={send} />
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhoto}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={cameraFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraPhoto}
        className="hidden"
        aria-hidden="true"
      />

      {/* Input dock — always at bottom (Item 7: morphing send) */}
      <div className="geo-input-dock">
        {photoPreview && (
          <div className="geo-photo-preview">
            <img src={photoPreview} alt="Attached" className="geo-photo-thumb" />
            <button onClick={() => { setPhotoPreview(null); setPhotoDataUrl(null); }} className="geo-photo-remove" aria-label="Remove photo">&times;</button>
          </div>
        )}
        <div className="geo-field">
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
            placeholder="Ask George anything..."
            className="geo-in"
          />
          <button
            onClick={() => {
              if (isTyping) return;
              if (!input.trim() && !photoPreview) {
                setCameraOverlay(true);
              } else {
                send();
              }
            }}
            disabled={isTyping}
            className="geo-send"
            aria-label={isTyping ? "Thinking..." : input.trim() || photoPreview ? "Send" : "Take photo"}
          >
            {isTyping ? (
              <span className="geo-send-spin" />
            ) : input.trim() || photoPreview ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Camera Overlay — full-screen photo experience (Item 5) */}
      {cameraOverlay && (
        <div className="geo-camera-overlay">
          <button onClick={closeCameraOverlay} className="geo-camera-close" aria-label="Close">
            <X className="w-5 h-5" />
          </button>

          {!cameraPhoto ? (
            <div className="geo-camera-inner">
              <div className="geo-camera-prompt">
                <Camera className="w-8 h-8 text-amber-500" />
                <div className="geo-greeting" style={{ fontSize: "24px" }}>Show George the problem</div>
                <div className="geo-subtitle" style={{ animation: "none", opacity: 1 }}>
                  Take a photo or choose from your library
                </div>
              </div>
              <button onClick={() => cameraFileRef.current?.click()} className="geo-camera-btn-main">
                <Camera className="w-5 h-5" />
                <span>Take Photo</span>
              </button>
            </div>
          ) : (
            <div className="geo-camera-inner">
              <div className="geo-camera-result">
                <img src={cameraPhoto} alt="Captured" />
                {cameraAnalyzing && (
                  <div className="geo-camera-analysis">
                    <div className="flex items-center gap-2">
                      <span className="geo-send-spin" />
                      <span className="text-stone-400 text-sm">George is analyzing...</span>
                    </div>
                  </div>
                )}
                {cameraAnalysis && !cameraAnalyzing && (
                  <div className="geo-camera-analysis">
                    <div className="text-sm leading-relaxed whitespace-pre-line">{cameraAnalysis}</div>
                    <button onClick={closeCameraOverlay} className="geo-camera-done">
                      Continue in chat
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
