import { useState, useRef, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { usePageContext } from "@/hooks/use-page-context";
import {
  Send, X, Loader2, ChevronRight,
  Mic, MicOff, Volume2, VolumeX, Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionData {
  type: string;
  data?: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickActions?: Array<{ label: string; action: string }>;
  photoUrl?: string;
  actions?: ActionData[];
  propertyData?: any;
  breakdown?: any;
  quoteCard?: any;
  bundleData?: any;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_DISABLED = "uptend-guide-disabled";
const LS_SESSION = "uptend-guide-session";
const LS_VOICE_OUT = "uptend-guide-voice-output";
const LS_GREETED = "uptend-guide-greeted";

const PRO_SIGNUP_PAGES = ["/pro/signup", "/pycker/signup", "/become-pro", "/pycker-signup", "/become-a-pycker"];
const NO_WIDGET_PAGES = ["/login", "/customer-login", "/customer-signup", "/pro-login", "/pro-signup", "/pro/login", "/pro/signup", "/pycker/login", "/pycker/signup", "/pycker-login", "/pycker-signup", "/register", "/admin", "/admin-login", "/forgot-password", "/book"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSessionId() {
  let sid = sessionStorage.getItem(LS_SESSION);
  if (!sid) {
    sid = `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(LS_SESSION, sid);
  }
  return sid;
}

function renderContent(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
  return DOMPurify.sanitize(html);
}

// ─── Page-Aware Welcome & Quick Actions ──────────────────────────────────────

function getPageContext(page: string, userRole: string, userName: string | null): {
  welcome: string;
  quickActions: Array<{ label: string; action: string }>;
} {
  const name = userName ? `, ${userName}` : "";

  if (PRO_SIGNUP_PAGES.some(p => page.startsWith(p))) {
    return {
      welcome: `Hey there 👋 I'm Bud. If you're thinking about joining UpTend as a Pro — you picked a good time. We don't charge lead fees. You keep what you earn. We handle the customers, the scheduling, the payments — you just do great work.\n\nI can answer anything — earnings, how jobs work, what makes this different from the other guys. Just type your question below 👇`,
      quickActions: [],
    };
  }

  if (page === "/book" || page.startsWith("/book")) {
    return {
      welcome: `Hey there! 😊 I'm Bud — welcome!\n\nYou're looking at a specific service — awesome! I'd love to help you figure out if it's the right fit. All our pros are verified, background-checked, and genuinely good at what they do.\n\nGot any questions? I'm here — fire away! 👇`,
      quickActions: [],
    };
  }

  if (page === "/services" || page.startsWith("/services/")) {
    return {
      welcome: `Hey! 😊 I'm Bud — glad you're checking out our services!\n\nWe've got everything from junk removal to pressure washing to full home scans — and every single one comes with verified, trusted pros. Not sure what you need? That's totally fine — just tell me what's going on and I'll point you in the right direction.\n\nAsk me anything! 👇`,
      quickActions: [],
    };
  }

  if (page === "/pricing") {
    return {
      welcome: `Hey! 😊 I'm Bud — thanks for checking us out!\n\nI see you're looking at pricing — great place to start! If you have any questions about what's included, how we match you with the right pro, or how any of this works — I'm right here.\n\nNo pressure at all, just ask whatever's on your mind 👇`,
      quickActions: [],
    };
  }

  if (page === "/emergency") {
    return {
      welcome: `I'm here — tell me what's happening and I'll get you help fast. Type below 👇`,
      quickActions: [],
    };
  }

  if (userRole === "hauler" || userRole === "pro") {
    return {
      welcome: `Hey${name}! 👋 I'm Bud — your UpTend assistant. Need help with jobs, earnings, scheduling, or growing your business? I've got your back.\n\nJust tell me what you need 👇`,
      quickActions: [],
    };
  }

  if (userRole === "customer") {
    return {
      welcome: `Hey${name}! 😊 So good to see you!\n\nI'm here whenever you need me — whether it's a question about a service, checking on something, or just figuring out what you need next. Happy to help with anything!\n\nWhat's up? 👇`,
      quickActions: [],
    };
  }

  // Default — guest on any page
  const isFirstVisit = !localStorage.getItem(LS_GREETED);
  if (isFirstVisit) {
    return {
      welcome: `Hey! 😊 I'm Bud — so glad you stopped by!\n\nWelcome to UpTend — on-demand home services with verified pros who care about doing things right. Whether it's junk removal, pressure washing, a deep clean, or something else entirely — we match you with trusted, background-checked professionals who show up on time and treat your home like their own. Oh, and we're sustainability-focused too 🌱 because taking care of your home shouldn't mean trashing the planet.\n\nI'm here if you have ANY questions — about what we do, how it works, what services might be right for you, anything at all. Seriously, no question is too small. I love chatting 😄\n\nWhat's on your mind? 👇`,
      quickActions: [],
    };
  }

  return {
    welcome: `Hey, welcome back! 😊 So happy to see you again.\n\nI'm right here if you need anything — questions about services, how something works, or just figuring out what you need. I'm all ears!\n\nWhat can I help with today? 👇`,
    quickActions: [],
  };
}

// ─── Voice Hooks ─────────────────────────────────────────────────────────────

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const result = Array.from(event.results as SpeechRecognitionResultList).map((r: any) => r[0].transcript).join("");
      setTranscript(result);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, transcript, isSupported, startListening, stopListening };
}

function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((text: string) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha")) || voices.find(v => v.lang === "en-US" && v.localService) || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }, []);

  return { isSpeaking, isSupported, speak, cancel };
}

// ─── Rich Card Components ────────────────────────────────────────────────────

function PropertyCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-amber-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs">🏠 Property Scan</div>
      <div className="grid grid-cols-2 gap-1">
        {data.homeValueEstimate && <div><span className="text-muted-foreground">Value:</span> ${data.homeValueEstimate?.toLocaleString()}</div>}
        {data.sqFootage && <div><span className="text-muted-foreground">Size:</span> {data.sqFootage?.toLocaleString()} sqft</div>}
        {data.bedrooms && <div><span className="text-muted-foreground">Beds/Bath:</span> {data.bedrooms}/{data.bathrooms}</div>}
        {data.yearBuilt && <div><span className="text-muted-foreground">Built:</span> {data.yearBuilt}</div>}
        {data.hasPool !== undefined && <div><span className="text-muted-foreground">Pool:</span> {data.hasPool === true ? "✅" : data.hasPool === "uncertain" ? "❓" : "❌"}</div>}
        {data.roofType && <div><span className="text-muted-foreground">Roof:</span> {data.roofType}</div>}
      </div>
    </div>
  );
}

function QuoteCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-green-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs">✨ Locked Quote</div>
      <div className="text-base font-bold text-green-700 dark:text-green-400">${data.price}</div>
      <div><span className="text-muted-foreground">Service:</span> {data.service}</div>
      {data.address && <div><span className="text-muted-foreground">Address:</span> {data.address}</div>}
      <div><span className="text-muted-foreground">Valid until:</span> {new Date(data.validUntil).toLocaleDateString()}</div>
    </div>
  );
}

function BundleCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-purple-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs">📦 Bundle Estimate</div>
      {data.breakdown?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between"><span>{item.service}</span><span>${item.rate}/{item.frequency}</span></div>
      ))}
      <div className="border-t border-purple-200/30 pt-1 space-y-0.5">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${data.subtotal}</span></div>
        <div className="flex justify-between text-green-600 font-medium"><span>Bundle Discount ({data.discountPercent || 10}%)</span><span>-${data.discount}</span></div>
        <div className="flex justify-between font-bold text-xs"><span>Total</span><span>${data.total}</span></div>
      </div>
    </div>
  );
}

function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-amber-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs">📊 Price Breakdown</div>
      {data.items && <div><span className="text-muted-foreground">Items:</span> {data.items.join(", ")}</div>}
      {data.volume && <div><span className="text-muted-foreground">Volume:</span> {data.volume}</div>}
      {data.laborHours && <div><span className="text-muted-foreground">Labor:</span> ~{data.laborHours} hours</div>}
      {data.baseRate && <div><span className="text-muted-foreground">Base rate:</span> ${data.baseRate}</div>}
    </div>
  );
}

// ─── Pulse Animation CSS ─────────────────────────────────────────────────────

const pulseKeyframes = `
@keyframes gentlePulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(245, 158, 11, 0.15); }
  50% { box-shadow: 0 2px 20px rgba(245, 158, 11, 0.35); }
}
`;

// ─── Main Component ──────────────────────────────────────────────────────────

export function UpTendGuide() {
  const [, navigate] = useLocation();
  const pageContext = usePageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(() => localStorage.getItem(LS_DISABLED) === "true");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => localStorage.getItem(LS_VOICE_OUT) === "true");
  const [isUploading, setIsUploading] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitRef = useRef(false);

  const speech = useSpeechRecognition();
  const synth = useSpeechSynthesis();

  const sendFeedback = useCallback(async (messageId: string, feedbackType: string) => {
    try {
      await fetch("/api/ai/guide/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId: getSessionId(), messageId, feedbackType }),
      });
    } catch { /* silent */ }
  }, []);

  // Auto-greet EVERY visit — open after a short delay so page loads first
  useEffect(() => {
    if (isDisabled) return;
    if (!hasInitRef.current) {
      const timer = setTimeout(() => {
        handleOpen();
        localStorage.setItem(LS_GREETED, "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gentle pulse every 30 seconds
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setShouldPulse(true);
      setTimeout(() => setShouldPulse(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Voice auto-send (uses ref to avoid hoisting issue)
  const sendMessageRef = useRef<(msg?: string) => void>();
  useEffect(() => {
    if (!speech.isListening && speech.transcript) sendMessageRef.current?.(speech.transcript);
  }, [speech.isListening, speech.transcript]);

  // ─── Open Handler ──────────────────────────────────────────────────────

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasInitRef.current && messages.length === 0) {
      const ctx = getPageContext(pageContext.page, pageContext.userRole, pageContext.userName);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: ctx.welcome,
        quickActions: ctx.quickActions,
      }]);
      hasInitRef.current = true;
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // ─── Action Handler ────────────────────────────────────────────────────

  const handleAction = useCallback((action: string) => {
    if (action.startsWith("navigate:")) {
      navigate(action.replace("navigate:", ""));
    } else if (action.startsWith("message:")) {
      const msg = action.replace("message:", "");
      setInput(msg);
      setTimeout(() => sendMessageRef.current?.(msg), 100);
    }
  }, [navigate]);

  // ─── Photo Upload ──────────────────────────────────────────────────────

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);
    hasInitRef.current = true;

    const photoPreviewUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: `user-photo-${Date.now()}`,
      role: "user",
      content: "📷 Sent a photo for analysis",
      photoUrl: photoPreviewUrl,
    }]);

    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const analyzeRes = await fetch("/api/ai/guide/photo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ photoUrl: dataUrl, sessionId: getSessionId(), serviceType: "junk_removal" }),
      });
      const analyzeData = await analyzeRes.json();

      const chatRes = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "I uploaded a photo for a quote.",
          sessionId: getSessionId(),
          photoAnalysis: analyzeData.analysis || {},
          context: { page: pageContext.page, userRole: pageContext.userRole, userName: pageContext.userName },
        }),
      });
      const chatData = await chatRes.json();

      const msg: Message = {
        id: `ai-photo-${Date.now()}`,
        role: "assistant",
        content: typeof chatData.reply === "string" ? chatData.reply : "I received your photo! Let me take a look.",
        quickActions: chatData.quickActions,
      };

      if (chatData.actions) {
        for (const action of chatData.actions) {
          if (action.type === "property_scan") msg.propertyData = action.data;
          if (action.type === "lock_quote") msg.quoteCard = action.data;
          if (action.type === "bundle") msg.bundleData = action.data;
          if (action.type === "breakdown") msg.breakdown = action.data;
        }
      }

      setMessages(prev => [...prev, msg]);
      if (voiceOutputEnabled && synth.isSupported) synth.speak(msg.content);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-photo-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't analyze that photo. Try again! 📷",
      }]);
    } finally {
      setIsUploading(false);
    }
  }, [pageContext, voiceOutputEnabled, synth]);

  // ─── Send Message ──────────────────────────────────────────────────────

  const sendMessage = useCallback(async (overrideMsg?: string) => {
    const msg = overrideMsg || input.trim();
    if (!msg || isLoading) return;

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: "user", content: msg }]);
    setInput("");
    setIsLoading(true);
    hasInitRef.current = true;

    try {
      const res = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          sessionId: getSessionId(),
          context: { page: pageContext.page, userRole: pageContext.userRole, userName: pageContext.userName },
        }),
      });

      const data = await res.json();
      const replyText = typeof data.reply === "string" ? data.reply : data.reply?.content || "Sorry, something went wrong!";

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        quickActions: data.quickActions,
      };

      if (data.actions) {
        for (const action of data.actions) {
          if (action.type === "property_scan") aiMsg.propertyData = action.data;
          if (action.type === "lock_quote") aiMsg.quoteCard = action.data;
          if (action.type === "bundle") aiMsg.bundleData = action.data;
          if (action.type === "breakdown") aiMsg.breakdown = action.data;
        }
      }

      setMessages(prev => [...prev, aiMsg]);
      if (voiceOutputEnabled && synth.isSupported) synth.speak(replyText);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Hmm, I couldn't connect. Check your internet and try again! 🔄",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, pageContext, voiceOutputEnabled, synth]);

  // Keep ref in sync for voice auto-send
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Don't show on login/signup pages or if disabled
  if (isDisabled) return null;
  if (NO_WIDGET_PAGES.some(p => pageContext.page.startsWith(p))) return null;

  return (
    <>
      <style>{pulseKeyframes}</style>

      {/* ─── Floating Pill (closed state) ────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5",
            "bg-amber-500/90 hover:bg-amber-500 text-white",
            "rounded-full shadow-lg hover:shadow-xl",
            "transition-all duration-300 ease-out",
            "backdrop-blur-sm",
            "text-[13px] font-medium",
          )}
          style={{
            animation: shouldPulse ? "gentlePulse 2s ease-in-out" : "none",
            maxWidth: "200px",
          }}
          aria-label="Chat with Bud"
        >
          <span className="text-base leading-none">🏠</span>
          <span>Need a hand from Bud? 👋</span>
        </button>
      )}

      {/* ─── Chat Card ───────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-50 flex flex-col transition-all duration-300 ease-out",
          // Glass effect
          "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl",
          "border border-white/40 dark:border-zinc-700/40",
          "shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
          // Desktop: compact card bottom-right
          "bottom-4 right-4 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl",
          "h-[min(560px,calc(100vh-2rem))]",
          // Mobile: bottom sheet
          "max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:w-full max-md:rounded-b-none max-md:rounded-t-2xl max-md:h-[60vh]",
          // Visibility
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
      >
        {/* Header — minimal */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/5 dark:border-white/5 shrink-0">
          <span className="font-semibold text-sm">Bud 🏠</span>
          <button
            onClick={() => { setIsOpen(false); synth.cancel(); }}
            className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex flex-col group", msg.role === "user" ? "items-end" : "items-start")}>
              <div className={cn("max-w-[88%] space-y-1.5")}>
                {msg.photoUrl && (
                  <div className="rounded-xl overflow-hidden border border-black/5">
                    <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-32 object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-[12px] leading-[1.5]",
                    msg.role === "user"
                      ? "bg-amber-500 text-white rounded-br-md"
                      : "bg-black/[0.04] dark:bg-white/[0.06] rounded-bl-md"
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.propertyData && <PropertyCard data={msg.propertyData} />}
                {msg.quoteCard && <QuoteCard data={msg.quoteCard} />}
                {msg.bundleData && <BundleCard data={msg.bundleData} />}
                {msg.breakdown && <BreakdownCard data={msg.breakdown} />}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {msg.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(qa.action)}
                        className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors border border-amber-200/40 dark:border-amber-700/30"
                      >
                        {qa.label}
                        <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" && msg.id !== "welcome" && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => sendFeedback(msg.id, "helpful")}
                      className="text-[11px] text-muted-foreground/50 hover:text-green-500 transition-colors p-0.5"
                      title="Helpful"
                    >👍</button>
                    <button
                      onClick={() => sendFeedback(msg.id, "not_helpful")}
                      className="text-[11px] text-muted-foreground/50 hover:text-red-400 transition-colors p-0.5"
                      title="Not helpful"
                    >👎</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator — subtle dots */}
          {(isLoading || isUploading) && (
            <div className="flex items-start">
              <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl rounded-bl-md px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-[3px]">
                    <div className="w-[5px] h-[5px] rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.8s" }} />
                    <div className="w-[5px] h-[5px] rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
                    <div className="w-[5px] h-[5px] rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
                  </div>
                  {isUploading && <span className="text-[10px] text-muted-foreground ml-1">Analyzing photo…</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-2.5 py-2 border-t border-black/5 dark:border-white/5 shrink-0">
          {speech.isListening && (
            <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-amber-600 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Listening… {speech.transcript || "speak now"}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); e.target.value = ""; }}
          />

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent text-[12px] h-7 px-2 rounded-full border border-black/10 dark:border-white/10 focus:outline-none focus:border-amber-400/50 transition-colors placeholder:text-muted-foreground/60"
              disabled={isLoading || speech.isListening || isUploading}
            />
            {speech.isSupported && (
              <button
                type="button"
                className={cn(
                  "shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  speech.isListening
                    ? "bg-red-500 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                )}
                onClick={speech.isListening ? speech.stopListening : speech.startListening}
                disabled={isLoading || isUploading}
                title={speech.isListening ? "Stop" : "Voice input"}
              >
                {speech.isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            )}
            {synth.isSupported && (
              <button
                type="button"
                className={cn(
                  "shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                  voiceOutputEnabled
                    ? "text-amber-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                )}
                onClick={() => { const next = !voiceOutputEnabled; setVoiceOutputEnabled(next); localStorage.setItem(LS_VOICE_OUT, String(next)); if (!next) synth.cancel(); }}
                title={voiceOutputEnabled ? "Mute voice" : "Enable voice"}
              >
                {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={!input.trim() || isLoading || isUploading}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Powered by */}
          <div className="text-center mt-1">
            <span className="text-[9px] text-muted-foreground/40">powered by UpTend</span>
          </div>
        </div>
      </div>
    </>
  );
}
