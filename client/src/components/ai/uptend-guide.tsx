import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePageContext } from "@/hooks/use-page-context";
import {
  MessageCircle, Send, X, Minus, Loader2, Bot, User, ChevronRight,
  Mic, MicOff, Volume2, VolumeX, Paperclip, Image, MapPin, DollarSign,
  Calendar, Share2, FileText,
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
const LS_VISITED = "uptend-guide-visited";
const LS_SESSION = "uptend-guide-session";
const LS_VOICE_OUT = "uptend-guide-voice-output";

const PRO_SIGNUP_PAGES = ["/pro/signup", "/pycker/signup", "/become-pro", "/pycker-signup", "/become-a-pycker"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSessionId() {
  let sid = sessionStorage.getItem(LS_SESSION);
  if (!sid) {
    sid = `guide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(LS_SESSION, sid);
  }
  return sid;
}

function isProSignupPage(page: string): boolean {
  return PRO_SIGNUP_PAGES.some(p => page.startsWith(p));
}

function renderContent(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
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

// ─── Welcome Messages ────────────────────────────────────────────────────────

function getWelcomeMessage(page: string, userRole: string, userName: string | null): Message {
  if (isProSignupPage(page)) {
    return {
      id: "welcome", role: "assistant",
      content: "Hey! 👋 Welcome to UpTend Pro signup. I'm here to help you get set up and answer any questions.\n\nNo lead fees, verified profiles, ESG impact tracking, and AI-powered tools to grow your business.",
      quickActions: [
        { label: "Why UpTend?", action: "message:What makes UpTend different?" },
        { label: "How much can I earn?", action: "message:How much do pros earn?" },
        { label: "Just sign me up!", action: "message:Walk me through signup." },
      ],
    };
  }

  if (userRole === "pro") {
    return {
      id: "welcome", role: "assistant",
      content: `Hey${userName ? `, ${userName}` : ""}! 👋 I'm your UpTend business advisor. Need help with anything?`,
      quickActions: [
        { label: "My Dashboard", action: "navigate:/pro/dashboard" },
        { label: "View Earnings", action: "navigate:/pro/earnings" },
        { label: "Grow my business", action: "message:How can I increase my earnings?" },
      ],
    };
  }

  if (userRole === "customer") {
    return {
      id: "welcome", role: "assistant",
      content: `Hey${userName ? `, ${userName}` : ""}! 👋 I'm your UpTend Guide. I can help you get quotes, book services, or answer questions.\n\nWhat's your home address? I'll personalize my recommendations for you! 🏠`,
      quickActions: [
        { label: "📷 Photo Quote", action: "message:I want to send a photo for a quote" },
        { label: "Book a Service", action: "navigate:/book" },
        { label: "Just Browsing", action: "message:I'm just looking around. What do you offer?" },
      ],
    };
  }

  return {
    id: "welcome", role: "assistant",
    content: "Hey! 👋 Welcome to UpTend. I'm your guide — here to help you find the right service, get a quote, or answer questions.\n\nWhat brings you here today?",
    quickActions: [
      { label: "Book a Service", action: "navigate:/book" },
      { label: "Get a Quote", action: "navigate:/quote" },
      { label: "I'm a Pro", action: "navigate:/pros" },
      { label: "Just Browsing", action: "message:What services do you offer?" },
    ],
  };
}

// ─── Property Card Component ─────────────────────────────────────────────────

function PropertyCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/30 dark:to-green-950/30 rounded-xl p-3 text-xs space-y-2 border border-blue-200/50 dark:border-blue-800/50">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <MapPin className="w-3.5 h-3.5 text-blue-600" />
        Property Scan
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div><span className="text-muted-foreground">Value:</span> ${data.homeValueEstimate?.toLocaleString()}</div>
        <div><span className="text-muted-foreground">Size:</span> {data.sqFootage?.toLocaleString()} sqft</div>
        <div><span className="text-muted-foreground">Beds/Bath:</span> {data.bedrooms}/{data.bathrooms}</div>
        <div><span className="text-muted-foreground">Built:</span> {data.yearBuilt}</div>
        <div><span className="text-muted-foreground">Lot:</span> {data.lotSizeAcres} acres</div>
        <div><span className="text-muted-foreground">Roof:</span> {data.roofType}</div>
        <div><span className="text-muted-foreground">Pool:</span> {data.hasPool === true ? "✅ Yes" : data.hasPool === "uncertain" ? "❓ Uncertain" : "❌ No"}</div>
        <div><span className="text-muted-foreground">Garage:</span> {data.hasGarage ? data.garageSize : "None"}</div>
      </div>
    </div>
  );
}

// ─── Quote Card Component ────────────────────────────────────────────────────

function QuoteCard({ data }: { data: any }) {
  const copyShareLink = () => {
    const url = `${window.location.origin}${data.shareUrl || `/quote/shared/${data.shareToken}`}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-3 text-xs space-y-2 border border-green-200/50 dark:border-green-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-sm">
          <DollarSign className="w-3.5 h-3.5 text-green-600" />
          Locked Quote
        </div>
        <button onClick={copyShareLink} className="text-green-600 hover:text-green-700 p-1" title="Copy share link">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-bold text-green-700 dark:text-green-400">${data.price}</div>
        <div><span className="text-muted-foreground">Service:</span> {data.service}</div>
        {data.address && <div><span className="text-muted-foreground">Address:</span> {data.address}</div>}
        <div><span className="text-muted-foreground">Valid until:</span> {new Date(data.validUntil).toLocaleDateString()}</div>
      </div>
    </div>
  );
}

// ─── Bundle Card Component ───────────────────────────────────────────────────

function BundleCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-3 text-xs space-y-2 border border-purple-200/50 dark:border-purple-800/50">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <FileText className="w-3.5 h-3.5 text-purple-600" />
        Bundle Estimate
      </div>
      {data.breakdown?.map((item: any, i: number) => (
        <div key={i} className="flex justify-between">
          <span>{item.service}</span>
          <span>${item.rate}/{item.frequency}</span>
        </div>
      ))}
      <div className="border-t border-purple-200/50 pt-1 space-y-0.5">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${data.subtotal}</span></div>
        <div className="flex justify-between text-green-600 font-medium"><span>Bundle Discount (10%)</span><span>-${data.discount}</span></div>
        <div className="flex justify-between font-bold text-sm"><span>Total</span><span>${data.total}</span></div>
      </div>
    </div>
  );
}

// ─── Breakdown Card Component ────────────────────────────────────────────────

function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-3 text-xs space-y-2 border border-amber-200/50 dark:border-amber-800/50">
      <div className="flex items-center gap-1.5 font-semibold text-sm">
        <FileText className="w-3.5 h-3.5 text-amber-600" />
        Price Breakdown
      </div>
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
  const lastPageRef = useRef(pageContext.page);
  const hasInitRef = useRef(false);

  const speech = useSpeechRecognition();
  const synth = useSpeechSynthesis();

  const toggleVoiceOutput = () => {
    const next = !voiceOutputEnabled;
    setVoiceOutputEnabled(next);
    localStorage.setItem(LS_VOICE_OUT, String(next));
    if (!next) synth.cancel();
  };

  // Auto-open on first visit or pro signup pages
  useEffect(() => {
    if (isDisabled) return;
    if (isProSignupPage(pageContext.page)) {
      if (!isOpen) {
        setIsOpen(true);
        if (!hasInitRef.current) {
          setMessages([getWelcomeMessage(pageContext.page, pageContext.userRole, pageContext.userName)]);
          hasInitRef.current = true;
        }
      }
      return;
    }
    const visited = localStorage.getItem(LS_VISITED);
    if (!visited) {
      localStorage.setItem(LS_VISITED, "true");
      setIsOpen(true);
      setMessages([getWelcomeMessage(pageContext.page, pageContext.userRole, pageContext.userName)]);
      hasInitRef.current = true;
    }
  }, [isDisabled, pageContext.page]);

  // Page change context
  useEffect(() => {
    if (!isOpen || isDisabled || !hasInitRef.current) return;
    if (lastPageRef.current === pageContext.page) return;
    lastPageRef.current = pageContext.page;
  }, [pageContext.page, isOpen, isDisabled]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Voice auto-send
  useEffect(() => {
    if (!speech.isListening && speech.transcript) sendMessage(speech.transcript);
  }, [speech.isListening, speech.transcript]);

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

  // ─── Photo Upload Handler ──────────────────────────────────────────────

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    setIsUploading(true);
    hasInitRef.current = true;

    // Show photo in chat immediately
    const photoPreviewUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: `user-photo-${Date.now()}`,
      role: "user",
      content: "📷 Uploaded a photo for analysis",
      photoUrl: photoPreviewUrl,
    }]);

    try {
      // Convert to base64 data URL for the AI
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // First analyze the photo
      const analyzeRes = await fetch("/api/ai/guide/photo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          photoUrl: dataUrl,
          sessionId: getSessionId(),
          serviceType: "junk_removal",
        }),
      });

      const analyzeData = await analyzeRes.json();
      const analysis = analyzeData.analysis || {};

      // Now send to chat with the analysis context
      const chatRes = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "I uploaded a photo for a quote.",
          sessionId: getSessionId(),
          photoAnalysis: analysis,
          context: {
            page: pageContext.page,
            userRole: pageContext.userRole,
            userName: pageContext.userName,
          },
        }),
      });

      const chatData = await chatRes.json();
      const replyText = typeof chatData.reply === "string" ? chatData.reply : "I received your photo! Let me analyze it.";

      const msg: Message = {
        id: `ai-photo-${Date.now()}`,
        role: "assistant",
        content: replyText,
        quickActions: chatData.quickActions,
      };

      // Attach action data
      if (chatData.actions) {
        for (const action of chatData.actions) {
          if (action.type === "property_scan") msg.propertyData = action.data;
          if (action.type === "lock_quote") msg.quoteCard = action.data;
          if (action.type === "bundle") msg.bundleData = action.data;
          if (action.type === "breakdown") msg.breakdown = action.data;
        }
      }

      setMessages(prev => [...prev, msg]);

      if (voiceOutputEnabled && synth.isSupported) synth.speak(replyText);
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
          context: {
            page: pageContext.page,
            userRole: pageContext.userRole,
            userName: pageContext.userName,
          },
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

      // Process action results into rich cards
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

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasInitRef.current && messages.length === 0) {
      setMessages([getWelcomeMessage(pageContext.page, pageContext.userRole, pageContext.userName)]);
      hasInitRef.current = true;
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const confirmDisable = () => {
    localStorage.setItem(LS_DISABLED, "true");
    setIsDisabled(true);
    setIsOpen(false);
    setShowDisableConfirm(false);
    synth.cancel();
  };

  if (isDisabled) return null;

  return (
    <>
      {/* Minimized pill */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-primary text-primary-foreground px-3 py-4 rounded-l-xl shadow-lg hover:pr-5 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          aria-label="Open UpTend Guide"
        >
          <MessageCircle className="w-4 h-4 rotate-90" />
          <span>UpTend Guide</span>
        </button>
      )}

      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 bg-background border-l shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          "md:top-0 md:right-0 md:h-full md:w-[380px]",
          "top-auto bottom-0 left-0 right-0 h-[85vh] md:h-full rounded-t-2xl md:rounded-none",
          isOpen ? "translate-x-0 md:translate-x-0 translate-y-0" : "translate-x-full md:translate-x-full translate-y-full md:translate-y-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">UpTend Guide</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {synth.isSupported && (
              <Button
                variant="ghost" size="icon"
                className={cn("h-7 w-7", voiceOutputEnabled && "text-primary")}
                onClick={toggleVoiceOutput}
                title={voiceOutputEnabled ? "Mute voice" : "Enable voice"}
              >
                {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsOpen(false); synth.cancel(); }} title="Minimize">
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDisableConfirm(true)}
              title="Disable Guide"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Disable confirmation */}
        {showDisableConfirm && (
          <div className="px-4 py-3 bg-destructive/5 border-b text-sm space-y-2 shrink-0">
            <p>Turn off the UpTend Guide?</p>
            <p className="text-xs text-muted-foreground">Re-enable anytime from profile settings.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={confirmDisable}>Turn Off</Button>
              <Button size="sm" variant="outline" onClick={() => setShowDisableConfirm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={cn("max-w-[85%] space-y-2", msg.role === "user" ? "order-first" : "")}>
                {/* Photo preview for user messages */}
                {msg.photoUrl && (
                  <div className="rounded-xl overflow-hidden border">
                    <img src={msg.photoUrl} alt="Uploaded photo" className="w-full max-h-48 object-cover" />
                  </div>
                )}

                {/* Text bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />

                {/* Rich cards */}
                {msg.propertyData && <PropertyCard data={msg.propertyData} />}
                {msg.quoteCard && <QuoteCard data={msg.quoteCard} />}
                {msg.bundleData && <BundleCard data={msg.bundleData} />}
                {msg.breakdown && <BreakdownCard data={msg.breakdown} />}

                {/* Quick actions */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(qa.action)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {qa.label}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {(isLoading || isUploading) && (
            <div className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  {isUploading && <span className="text-xs text-muted-foreground">Analyzing photo...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t shrink-0">
          {/* Voice listening indicator */}
          {speech.isListening && (
            <div className="flex items-center gap-2 mb-2 text-xs text-primary">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Listening... {speech.transcript || "speak now"}</span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
              e.target.value = "";
            }}
          />

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            {/* Photo upload button */}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="rounded-full shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Upload photo for quote"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 rounded-full text-sm"
              disabled={isLoading || speech.isListening || isUploading}
            />

            {/* Mic button */}
            {speech.isSupported && (
              <Button
                type="button"
                size="icon"
                variant={speech.isListening ? "destructive" : "outline"}
                className="rounded-full shrink-0"
                onClick={speech.isListening ? speech.stopListening : speech.startListening}
                disabled={isLoading || isUploading}
                title={speech.isListening ? "Stop" : "Voice input"}
              >
                {speech.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              className="rounded-full shrink-0"
              disabled={!input.trim() || isLoading || isUploading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
