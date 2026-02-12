import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageContext } from "@/hooks/use-page-context";
import {
  Send, X, Minus, Loader2, Bot, User, ChevronRight,
  Mic, MicOff, Volume2, VolumeX, Paperclip, HelpCircle,
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

const PRO_SIGNUP_PAGES = ["/pro/signup", "/pycker/signup", "/become-pro", "/pycker-signup", "/become-a-pycker"];
const NO_WIDGET_PAGES = ["/customer-login", "/customer-signup", "/pro-login", "/pro-signup", "/register", "/admin"];

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
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ─── Page-Aware Welcome & Quick Actions ──────────────────────────────────────

function getPageContext(page: string, userRole: string, userName: string | null): {
  welcome: string;
  quickActions: Array<{ label: string; action: string }>;
} {
  const name = userName ? `, ${userName}` : "";

  if (PRO_SIGNUP_PAGES.some(p => page.startsWith(p))) {
    return {
      welcome: `Hey${name}! 👋 Thinking about joining UpTend? I can answer any questions — earnings, how it works, what makes us different.`,
      quickActions: [
        { label: "What do Pros earn?", action: "message:How much do pros earn on UpTend?" },
        { label: "Why no lead fees?", action: "message:Why doesn't UpTend charge lead fees?" },
        { label: "Sign me up", action: "message:Walk me through the signup process" },
      ],
    };
  }

  if (page === "/book" || page.startsWith("/book")) {
    return {
      welcome: `Need help picking the right service or figuring out pricing? I can give you an instant estimate from a photo too 📷`,
      quickActions: [
        { label: "📷 Photo quote", action: "message:I want to send a photo for a quote" },
        { label: "Help me choose", action: "message:I'm not sure which service I need" },
        { label: "How pricing works", action: "message:How does UpTend pricing work?" },
      ],
    };
  }

  if (page === "/services" || page.startsWith("/services/")) {
    return {
      welcome: `Browsing services? I can help you compare options or get a quick price estimate.`,
      quickActions: [
        { label: "What's best for me?", action: "message:Help me figure out which service I need" },
        { label: "Bundle & save", action: "message:Can I bundle multiple services for a discount?" },
        { label: "📷 Photo quote", action: "message:I want to send a photo for a quote" },
      ],
    };
  }

  if (page === "/pricing") {
    return {
      welcome: `These are starting prices — your final quote depends on your specific job. I can give you a personalized estimate!`,
      quickActions: [
        { label: "Get my exact price", action: "message:I need an exact price for my job" },
        { label: "📷 Photo quote", action: "message:Can I send a photo for an estimate?" },
        { label: "Price match?", action: "message:Do you price match other providers?" },
      ],
    };
  }

  if (page === "/emergency") {
    return {
      welcome: `Emergency? I can help you get a Pro dispatched ASAP. What's going on?`,
      quickActions: [
        { label: "Water damage", action: "message:I have water damage, need help now" },
        { label: "Broken pipe", action: "message:I have a broken pipe" },
        { label: "Storm damage", action: "message:Storm damage to my property" },
      ],
    };
  }

  if (userRole === "hauler" || userRole === "pro") {
    return {
      welcome: `Hey${name}! Need help with your dashboard, jobs, or earnings?`,
      quickActions: [
        { label: "My jobs", action: "navigate:/pro/dashboard" },
        { label: "Earnings", action: "navigate:/pro/earnings" },
        { label: "Grow my business", action: "message:How can I get more jobs?" },
      ],
    };
  }

  if (userRole === "customer") {
    return {
      welcome: `Hey${name}! 👋 I'm Bud — I can book services, get you quotes, or answer any questions.`,
      quickActions: [
        { label: "📷 Photo quote", action: "message:I want to send a photo for a quote" },
        { label: "Book a service", action: "navigate:/book" },
        { label: "My dashboard", action: "navigate:/dashboard" },
      ],
    };
  }

  // Default — guest on any page
  return {
    welcome: `Hey! 👋 I'm Bud, your UpTend assistant. I can help you find services, get quotes, or answer questions. What do you need?`,
    quickActions: [
      { label: "📷 Photo quote", action: "message:I want to send a photo for a quote" },
      { label: "Browse services", action: "navigate:/services" },
      { label: "How it works", action: "message:How does UpTend work?" },
    ],
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
    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-3 text-xs space-y-2 border border-blue-200/50">
      <div className="font-semibold text-sm">🏠 Property Scan</div>
      <div className="grid grid-cols-2 gap-1.5">
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
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-3 text-xs space-y-2 border border-green-200/50">
      <div className="font-semibold text-sm">💰 Locked Quote</div>
      <div className="text-lg font-bold text-green-700 dark:text-green-400">${data.price}</div>
      <div><span className="text-muted-foreground">Service:</span> {data.service}</div>
      {data.address && <div><span className="text-muted-foreground">Address:</span> {data.address}</div>}
      <div><span className="text-muted-foreground">Valid until:</span> {new Date(data.validUntil).toLocaleDateString()}</div>
    </div>
  );
}

function BundleCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-3 text-xs space-y-2 border border-purple-200/50">
      <div className="font-semibold text-sm">📦 Bundle Estimate</div>
      {data.breakdown?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between"><span>{item.service}</span><span>${item.rate}/{item.frequency}</span></div>
      ))}
      <div className="border-t border-purple-200/50 pt-1 space-y-0.5">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${data.subtotal}</span></div>
        <div className="flex justify-between text-green-600 font-medium"><span>Bundle Discount (10%)</span><span>-${data.discount}</span></div>
        <div className="flex justify-between font-bold text-sm"><span>Total</span><span>${data.total}</span></div>
      </div>
    </div>
  );
}

function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-3 text-xs space-y-2 border border-amber-200/50">
      <div className="font-semibold text-sm">📊 Price Breakdown</div>
      {data.items && <div><span className="text-muted-foreground">Items:</span> {data.items.join(", ")}</div>}
      {data.volume && <div><span className="text-muted-foreground">Volume:</span> {data.volume}</div>}
      {data.laborHours && <div><span className="text-muted-foreground">Labor:</span> ~{data.laborHours} hours</div>}
      {data.baseRate && <div><span className="text-muted-foreground">Base rate:</span> ${data.baseRate}</div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function UpTendGuide() {
  const [, navigate] = useLocation();
  const pageContext = usePageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(() => localStorage.getItem(LS_DISABLED) === "true");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => localStorage.getItem(LS_VOICE_OUT) === "true");
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitRef = useRef(false);

  const speech = useSpeechRecognition();
  const synth = useSpeechSynthesis();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Voice auto-send
  useEffect(() => {
    if (!speech.isListening && speech.transcript) sendMessage(speech.transcript);
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
      setIsOpen(false);
    } else if (action.startsWith("message:")) {
      const msg = action.replace("message:", "");
      setInput(msg);
      setTimeout(() => sendMessage(msg), 100);
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

  // ─── Disable ───────────────────────────────────────────────────────────

  const confirmDisable = () => {
    localStorage.setItem(LS_DISABLED, "true");
    setIsDisabled(true);
    setIsOpen(false);
    setShowDisableConfirm(false);
    synth.cancel();
  };

  // Don't show on login/signup pages or if disabled
  if (isDisabled) return null;
  if (NO_WIDGET_PAGES.some(p => pageContext.page.startsWith(p))) return null;

  return (
    <>
      {/* ─── Floating Button ─────────────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 group"
          aria-label="Chat with Bud"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm font-semibold">Need help?</span>
        </button>
      )}

      {/* ─── Chat Panel ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-50 bg-background border shadow-2xl flex flex-col transition-all duration-200 ease-out",
          // Desktop: floating window bottom-right
          "bottom-6 right-6 w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl",
          // Height
          "h-[min(540px,calc(100vh-6rem))]",
          // Mobile: full-width bottom sheet
          "max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:w-full max-md:rounded-b-none max-md:rounded-t-2xl max-md:h-[80vh]",
          // Visibility
          isOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">Bud</h3>
              <p className="text-[11px] text-muted-foreground leading-tight">UpTend Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {synth.isSupported && (
              <Button
                variant="ghost" size="icon"
                className={cn("h-8 w-8", voiceOutputEnabled && "text-primary")}
                onClick={() => { const next = !voiceOutputEnabled; setVoiceOutputEnabled(next); localStorage.setItem(LS_VOICE_OUT, String(next)); if (!next) synth.cancel(); }}
                title={voiceOutputEnabled ? "Mute voice" : "Enable voice"}
              >
                {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsOpen(false); synth.cancel(); }} title="Minimize">
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDisableConfirm(true)}
              title="Turn off Bud"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Disable confirmation */}
        {showDisableConfirm && (
          <div className="px-4 py-3 bg-destructive/5 border-b text-sm space-y-2 shrink-0">
            <p className="font-medium">Turn off Bud?</p>
            <p className="text-xs text-muted-foreground">You can re-enable from your profile settings anytime.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={confirmDisable}>Turn Off</Button>
              <Button size="sm" variant="outline" onClick={() => setShowDisableConfirm(false)}>Keep</Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              <div className={cn("max-w-[85%] space-y-2", msg.role === "user" ? "order-first" : "")}>
                {msg.photoUrl && (
                  <div className="rounded-xl overflow-hidden border">
                    <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-40 object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.propertyData && <PropertyCard data={msg.propertyData} />}
                {msg.quoteCard && <QuoteCard data={msg.quoteCard} />}
                {msg.bundleData && <BundleCard data={msg.bundleData} />}
                {msg.breakdown && <BreakdownCard data={msg.breakdown} />}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(qa.action)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {qa.label}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}

          {(isLoading || isUploading) && (
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  {isUploading && <span className="text-xs text-muted-foreground">Analyzing photo...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 border-t shrink-0">
          {speech.isListening && (
            <div className="flex items-center gap-2 mb-2 text-xs text-primary px-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening... {speech.transcript || "speak now"}
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

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-1.5">
            <Button
              type="button" size="icon" variant="ghost"
              className="rounded-full shrink-0 h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Upload photo"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 rounded-full text-sm h-9"
              disabled={isLoading || speech.isListening || isUploading}
            />
            {speech.isSupported && (
              <Button
                type="button" size="icon"
                variant={speech.isListening ? "destructive" : "ghost"}
                className="rounded-full shrink-0 h-9 w-9"
                onClick={speech.isListening ? speech.stopListening : speech.startListening}
                disabled={isLoading || isUploading}
                title={speech.isListening ? "Stop" : "Voice input"}
              >
                {speech.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Button type="submit" size="icon" className="rounded-full shrink-0 h-9 w-9" disabled={!input.trim() || isLoading || isUploading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
