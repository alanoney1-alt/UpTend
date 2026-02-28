import { useState, useRef, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { usePageContext } from "@/hooks/use-page-context";
import {
  Send, X, Loader2, ChevronRight,
  Mic, MicOff, Volume2, VolumeX, Camera, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VideoPlayer, extractAllVideoIds } from "./video-player";

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
const SS_MESSAGES_PREFIX = "uptend-guide-msgs-"; // per-zone sessionStorage key

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
    // Markdown links: [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#F47C20] underline break-all">$1</a>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Bare URLs (not already inside an href). make clickable
    .replace(/(?<!href=")(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#F47C20] underline break-all">$1</a>')
    .replace(/\n/g, "<br/>");
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
}

// ─── Derive role from URL (zone-aware, overrides auth role for correct persona) ──

function getDerivedUserRole(page: string, authRole: string): "consumer" | "pro" | "business" | "admin" {
  if (page.startsWith("/business")) return "business";
  if (
    page.startsWith("/pro") ||
    page.startsWith("/become-pro") ||
    page.startsWith("/academy") ||
    page.startsWith("/drive") ||
    page.startsWith("/pycker")
  ) return "pro";
  if (authRole === "admin") return "admin";
  return "consumer";
}

// ─── Page-Aware Welcome & Quick Actions ──────────────────────────────────────

function getPageContext(page: string, userRole: string, userName: string | null): {
  welcome: string;
  quickActions: Array<{ label: string; action: string }>;
} {
  const name = userName ? `, ${userName}` : "";

  // B2B pages. professional George
  if (page === "/business" || page.startsWith("/business")) {
    // Don't show on authenticated dashboard pages (they have their own UI)
    if (page.startsWith("/business/dashboard") || page.startsWith("/business/billing") || page.startsWith("/business/compliance")) {
      return {
        welcome: `Hey${name}!  I'm George, your UpTend business assistant. Need help with your dashboard, billing, team management, or anything else? Just ask.\n\nWhat can I help with? `,
        quickActions: [],
      };
    }
    return {
      welcome: `Welcome!  I'm George, UpTend's business solutions assistant.\n\nIf you manage properties, run an HOA, or oversee construction, I can walk you through how UpTend replaces your entire vendor network with one platform.\n\n**What I can help with:**\n• Pricing for your portfolio size\n• How our dispatch and tracking works\n• Insurance and compliance requirements\n• Volume discounts and billing\n• Setting up a demo\n\nWhat would you like to know? `,
      quickActions: [],
    };
  }

  if (PRO_SIGNUP_PAGES.some(p => page.startsWith(p))) {
    return {
      welcome: `Hey there  I'm George. If you're thinking about joining UpTend as a Pro, you picked a good time. We don't charge lead fees. You keep what you earn. We handle the customers, the scheduling, the payments, you just do great work.\n\nI can answer anything: earnings, how jobs work, what makes this different from the other guys. Just type your question below `,
      quickActions: [],
    };
  }

  if (page.startsWith("/pro/") || page.startsWith("/pro") || page === "/drive" || page.startsWith("/drive") || page === "/academy" || page.startsWith("/academy")) {
    return {
      welcome: `Hey${name}!  I'm George. Looking for work opportunities or have questions about being an UpTend Pro? I'm here to help.\n\nWhether it's about earnings, how jobs work, route optimization, compliance, or growing your business, just ask!\n\nWhat can I help with? `,
      quickActions: [],
    };
  }

  if (page === "/book" || page.startsWith("/book")) {
    return {
      welcome: `Hey there!  I'm George, welcome!\n\nYou're looking at a specific service, awesome! I'd love to help you figure out if it's the right fit. All our pros are verified, background-checked, and genuinely good at what they do.\n\nGot any questions? I'm here, fire away! `,
      quickActions: [],
    };
  }

  if (page === "/services" || page.startsWith("/services/")) {
    return {
      welcome: `Hey!  I'm George, glad you're checking out our services!\n\nWe've got everything from junk removal to pressure washing to full Home DNA Scans, and every single one comes with verified, trusted pros. Not sure what you need? That's totally fine. Just tell me what's going on and I'll point you in the right direction.\n\nAsk me anything! `,
      quickActions: [],
    };
  }

  if (page === "/pricing") {
    return {
      welcome: `Hey!  I'm George, thanks for checking us out!\n\nI see you're looking at services and pricing, great place to start! If you have any questions about what's included, how we match you with the right pro, or how any of this works. I'm right here.\n\nNo pressure at all, just ask whatever's on your mind `,
      quickActions: [],
    };
  }

  if (page === "/emergency") {
    return {
      welcome: `I'm here. Tell me what's happening and I'll get you help fast. Type below `,
      quickActions: [],
    };
  }

  if (userRole === "hauler" || userRole === "pro") {
    return {
      welcome: `Hey${name}!  I'm George, your UpTend assistant. Need help with jobs, earnings, scheduling, or growing your business? I've got your back.\n\nJust tell me what you need `,
      quickActions: [],
    };
  }

  if (userRole === "customer") {
    return {
      welcome: `Hey${name}!  So good to see you!\n\nI'm here whenever you need me, whether it's a question about a service, checking on something, or just figuring out what you need next. Happy to help with anything!\n\nWhat's up? `,
      quickActions: [],
    };
  }

  // Default. guest on any page
  const isFirstVisit = !localStorage.getItem(LS_GREETED);
  if (isFirstVisit) {
    return {
      welcome: `Hey, I'm George. \n\nI know basically everything about home repair. Whether something's broken, you're trying to prevent a problem, or you just need a pro out there fast. I've got you.\n\nWhat's going on with your home?`,
      quickActions: [
        { label: " Need a Pro Now", action: "message:I need to book a professional service" },
        { label: " Check My Home's Health", action: "message:I want to check on my home's health" },
        { label: " Send a Photo", action: "message:I want to send a photo of an issue" },
        { label: " Fix It Myself", action: "message:I want to fix something myself" },
      ],
    };
  }

  return {
    welcome: `Hey. Glad you're back. \n\nSomething going on with your home? I'm ready to get it handled, whether that's booking a pro right now or walking you through it yourself.\n\nWhat do you need?`,
    quickActions: [
      { label: " Book Your Home Service", action: "message:I need to book a professional service" },
      { label: " Home Health Check", action: "message:How's my home doing?" },
      { label: " Photo Diagnosis", action: "message:I want to send a photo of an issue" },
      { label: " DIY Help", action: "message:I want to fix something myself" },
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
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-amber-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs"> Property Scan</div>
      <div className="grid grid-cols-2 gap-1">
        {data.homeValueEstimate && <div><span className="text-muted-foreground">Value:</span> ${data.homeValueEstimate?.toLocaleString()}</div>}
        {data.sqFootage && <div><span className="text-muted-foreground">Size:</span> {data.sqFootage?.toLocaleString()} sqft</div>}
        {data.bedrooms && <div><span className="text-muted-foreground">Beds/Bath:</span> {data.bedrooms}/{data.bathrooms}</div>}
        {data.yearBuilt && <div><span className="text-muted-foreground">Built:</span> {data.yearBuilt}</div>}
        {data.hasPool !== undefined && <div><span className="text-muted-foreground">Pool:</span> {data.hasPool === true ? "" : data.hasPool === "uncertain" ? "?" : ""}</div>}
        {data.roofType && <div><span className="text-muted-foreground">Roof:</span> {data.roofType}</div>}
      </div>
    </div>
  );
}

function QuoteCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-2.5 text-[11px] space-y-1.5 border border-green-200/40 backdrop-blur-sm">
      <div className="font-semibold text-xs"> Locked Quote</div>
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
      <div className="font-semibold text-xs"> Bundle Estimate</div>
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
      <div className="font-semibold text-xs"> Price Breakdown</div>
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
  const skipPersistRef = useRef(false); // flag to skip persisting on zone-change resets
  const [isLoading, setIsLoading] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => localStorage.getItem(LS_VOICE_OUT) === "true");
  const [isUploading, setIsUploading] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [showCallGeorge, setShowCallGeorge] = useState(false);
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

  // Should this page hide the widget entirely?
  const isHiddenPage = NO_WIDGET_PAGES.some(p => pageContext.page.startsWith(p));

  // George auto-opens for ALL visitors, every visit. Alan's rule
  // Detect which "zone" the user is in so we can reset George when they switch
  const getZone = (page: string): string => {
    if (page.startsWith("/business")) return "business";
    if (page.startsWith("/pro") || page.startsWith("/pycker") || page.startsWith("/become-pro") || page.startsWith("/academy") || page.startsWith("/drive") || page.startsWith("/career")) return "pro";
    return "consumer";
  };
  const currentZone = getZone(pageContext.page);
  const lastZoneRef = useRef(currentZone);

  // Load greeting on mount OR when zone changes (consumer ↔ pro ↔ business)
  // Restore conversation from sessionStorage if available
  useEffect(() => {
    const zoneChanged = lastZoneRef.current !== currentZone;
    if (zoneChanged) {
      // Save current zone's messages before switching
      if (messages.length > 0) {
        try {
          sessionStorage.setItem(SS_MESSAGES_PREFIX + lastZoneRef.current, JSON.stringify(messages));
        } catch { /* quota */ }
      }
      lastZoneRef.current = currentZone;
      hasInitRef.current = false;
    }
    if (!hasInitRef.current) {
      // Try restoring from sessionStorage first
      try {
        const saved = sessionStorage.getItem(SS_MESSAGES_PREFIX + currentZone);
        if (saved) {
          const parsed = JSON.parse(saved) as Message[];
          if (parsed.length > 0) {
            skipPersistRef.current = true;
            setMessages(parsed);
            hasInitRef.current = true;
            return;
          }
        }
      } catch { /* corrupt data, fall through */ }
      // No saved messages. show fresh greeting
      const ctx = getPageContext(pageContext.page, pageContext.userRole, pageContext.userName);
      skipPersistRef.current = true;
      setMessages([{
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: ctx.welcome,
        quickActions: ctx.quickActions,
      }]);
      hasInitRef.current = true;
      localStorage.setItem(LS_GREETED, "true");
    }
  }, [currentZone, pageContext.page, pageContext.userRole, pageContext.userName]);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(SS_MESSAGES_PREFIX + currentZone, JSON.stringify(messages));
      } catch { /* quota */ }
    }
  }, [messages, currentZone]);

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
      // Mark as greeted so next open shows "welcome back"
      localStorage.setItem(LS_GREETED, "true");
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // ─── Action Handler ────────────────────────────────────────────────────

  const handleAction = useCallback((action: string) => {
    if (action.startsWith("navigate:")) {
      navigate(action.replace("navigate:", ""));
    } else if (action.startsWith("message:") || action.startsWith("reply:")) {
      const msg = action.startsWith("reply:") ? action.replace("reply:", "") : action.replace("message:", "");
      setInput(msg);
      setTimeout(() => sendMessageRef.current?.(msg), 100);
    } else if (action.startsWith("action:")) {
      // Generic action passthrough. send as a message for George to handle
      sendMessageRef.current?.(action.replace("action:", ""));
    }
  }, [navigate]);

  // ─── Photo Upload ──────────────────────────────────────────────────────

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) return;
    setIsUploading(true);
    hasInitRef.current = true;

    // For videos, extract first frame as image
    let imageFile = file;
    if (isVideo) {
      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        await new Promise<void>((resolve) => { video.onloadeddata = () => resolve(); video.load(); });
        video.currentTime = 1; // grab frame at 1 second
        await new Promise<void>((resolve) => { video.onseeked = () => resolve(); });
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85));
        imageFile = new File([blob], "video-frame.jpg", { type: "image/jpeg" });
        URL.revokeObjectURL(videoUrl);
      } catch {
        // If frame extraction fails, show error
        setMessages(prev => [...prev, { id: `err-video-${Date.now()}`, role: "assistant", content: "I couldn't process that video. Try sending a photo instead. Snap a picture of the issue and I can analyze it." }]);
        setIsUploading(false);
        return;
      }
    }

    const photoPreviewUrl = URL.createObjectURL(imageFile);
    setMessages(prev => [...prev, {
      id: `user-photo-${Date.now()}`,
      role: "user",
      content: isVideo ? " Sent a video for analysis" : " Sent a photo for analysis",
      photoUrl: photoPreviewUrl,
    }]);

    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Send photo through George chat flow for contextual analysis
      const base64 = dataUrl.split(",")[1];
      const chatRes = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: "I just sent a photo for you to analyze. Please look at it and tell me what you see, what service I might need, and a price estimate.",
          sessionId: getSessionId(),
          context: {
            page: pageContext.page,
            userRole: getDerivedUserRole(pageContext.page, pageContext.userRole),
            userName: pageContext.userName,
          },
          photoBase64: base64,
        }),
      });
      const chatData = await chatRes.json();
      const replyText = typeof chatData.reply === "string" ? chatData.reply : chatData.reply?.content || "I had trouble analyzing that photo. Could you try again or describe the issue?";

      const msg: Message = {
        id: `ai-photo-${Date.now()}`,
        role: "assistant",
        content: replyText,
        quickActions: chatData.quickActions,
      };

      setMessages(prev => [...prev, msg]);
      if (voiceOutputEnabled && synth.isSupported) synth.speak(msg.content);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-photo-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't analyze that photo. Try again! ",
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
            userRole: getDerivedUserRole(pageContext.page, pageContext.userRole),
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
        content: "Hmm, I couldn't connect. Check your internet and try again! ",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, pageContext, voiceOutputEnabled, synth]);

  // Keep ref in sync for voice auto-send
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Listen for george:open events (e.g. from Home DNA Scan page)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsOpen(true);
      if (detail?.message) {
        setTimeout(() => sendMessageRef.current?.(detail.message), 300);
      }
    };
    window.addEventListener("george:open", handler);
    return () => window.removeEventListener("george:open", handler);
  }, []);

  // Don't show on login/signup pages or if disabled
  if (isDisabled) return null;
  if (isHiddenPage) return null;

  return (
    <>
      <style>{`
        ${pulseKeyframes}
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 124, 32, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(244, 124, 32, 0); }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ─── Floating George Button (closed state) ───────────────────── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 md:bottom-4 right-4 z-[60] h-14 w-14 rounded-full overflow-hidden border-2 border-[#F47C20]/60 hover:border-[#F47C20] transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{ animation: shouldPulse ? "fabPulse 2s ease-in-out" : "fabPulse 3s ease-in-out infinite" }}
          aria-label="Chat with George"
        >
          <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-slate-900" />
        </button>
      )}

      {/* ─── Chat Card (Dark, George's Space) ─────────────────────────── */}
      <div
        className={cn(
          "fixed z-[60] flex flex-col overflow-hidden",
          // Desktop: compact card bottom-right
          "bottom-4 right-4 w-[390px] max-w-[calc(100vw-2rem)] rounded-2xl",
          "h-[min(540px,calc(100vh-2rem))]",
          // Mobile: bottom sheet
          "max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:w-full max-md:rounded-b-none max-md:rounded-t-2xl max-md:h-[65vh]",
          // Visibility
          isOpen
            ? "pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
        style={{
          ...(isOpen ? { animation: "chatSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" } : {}),
          background: "linear-gradient(180deg, #0f172a 0%, #0a0e1a 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(244, 124, 32, 0.08)",
          border: "1px solid rgba(244, 124, 32, 0.15)",
        }}
      >
        {/* Header — George's face + name + status */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-[#F47C20]/30">
                <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-[#0f172a]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">George</h3>
              <p className="text-green-400/80 text-[11px]">Online now</p>
            </div>
          </div>
          <button
            onClick={() => { setIsOpen(false); synth.cancel(); }}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-1">
                  <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={cn("max-w-[82%] space-y-1.5")}>
                {msg.photoUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/[0.06]">
                    <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-32 object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.6] break-words overflow-hidden",
                    msg.role === "user"
                      ? "bg-[#F47C20] text-white rounded-br-sm"
                      : "bg-white/[0.06] text-slate-200 rounded-bl-sm border border-white/[0.04]"
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.role === "assistant" && extractAllVideoIds(msg.content).map((vid) => (
                  <VideoPlayer key={vid} videoId={vid} />
                ))}
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
                        className="inline-flex items-center gap-0.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200
                          bg-white/[0.04] border border-[#F47C20]/20 text-slate-300
                          hover:bg-[#F47C20]/10 hover:border-[#F47C20]/40 hover:text-white"
                      >
                        {qa.label}
                        <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" && msg.id !== "welcome" && !msg.id.startsWith("welcome-") && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => sendFeedback(msg.id, "helpful")}
                      className="text-[11px] text-slate-600 hover:text-green-400 transition-colors p-0.5"
                      title="Helpful"
                    >👍</button>
                    <button
                      onClick={() => sendFeedback(msg.id, "not_helpful")}
                      className="text-[11px] text-slate-600 hover:text-red-400 transition-colors p-0.5"
                      title="Not helpful"
                    >👎</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* George thinking — amber dots */}
          {(isLoading || isUploading) && (
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-1">
                <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
              </div>
              <div className="bg-white/[0.06] border border-white/[0.04] rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "200ms" }} />
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "400ms" }} />
                  </div>
                  {isUploading && <span className="text-[10px] text-slate-500 ml-1">Analyzing photo...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-3 py-3 border-t border-white/[0.06] shrink-0">
          {speech.isListening && (
            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-[#F47C20] px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Listening... {speech.transcript || "speak now"}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); e.target.value = ""; }}
          />

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-1.5">
            <button
              type="button"
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Send a photo"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            {speech.isSupported && (
              <button
                type="button"
                className={cn(
                  "shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                  speech.isListening
                    ? "bg-red-500 text-white"
                    : "text-slate-500 hover:text-white hover:bg-white/10"
                )}
                onClick={speech.isListening ? speech.stopListening : speech.startListening}
                disabled={isLoading || isUploading}
                title={speech.isListening ? "Stop" : "Voice input"}
              >
                {speech.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message George..."
              className="flex-1 h-10 px-4 rounded-full text-sm bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-slate-500 outline-none focus:border-[#F47C20]/40 focus:bg-white/[0.08] transition-all"
              disabled={isLoading || speech.isListening || isUploading}
            />
            <button
              type="submit"
              className="shrink-0 h-10 w-10 rounded-full bg-[#F47C20] hover:bg-[#E06910] flex items-center justify-center transition-all disabled:opacity-30"
              disabled={!input.trim() || isLoading || isUploading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </form>
        </div>

        {/* Call George Modal */}
        {showCallGeorge && (
          <div className="absolute inset-0 z-10 backdrop-blur-sm rounded-2xl max-md:rounded-b-none max-md:rounded-t-2xl flex flex-col items-center justify-center p-6 text-center" style={{ background: "rgba(10, 14, 26, 0.95)" }}>
            <button
              onClick={() => setShowCallGeorge(false)}
              className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#F47C20]/30 mb-4">
              <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Call George</h3>
            <a
              href="tel:+14073383342"
              className="text-2xl font-bold text-[#F47C20] hover:text-[#FF8C34] transition-colors mb-3"
            >
              (407) 338-3342
            </a>
            <p className="text-sm text-slate-400 mb-4">
              Available 24/7. George answers every call.
            </p>
            <a
              href="tel:+14073383342"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F47C20] text-white font-semibold hover:bg-[#E06910] transition-colors"
            >
              <Phone className="w-4 h-4" />
              Tap to Call
            </a>
          </div>
        )}
      </div>
    </>
  );
}
