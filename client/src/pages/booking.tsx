import { usePageTitle } from "@/hooks/use-page-title";
import { useSearch, useLocation } from "wouter";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useSiteMode } from "@/contexts/site-mode-context";
import BookingClassicPage from "./booking-classic";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { PaymentForm } from "@/components/payment-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Send, Loader2, Paperclip, ChevronRight, Bot, ClipboardList,
} from "lucide-react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

/* ─── Step Progress (conversational) ─── */
const CONV_STEPS = [
  { label: "Service", num: 1 },
  { label: "Details", num: 2 },
  { label: "Address", num: 3 },
  { label: "Schedule", num: 4 },
  { label: "Review", num: 5 },
] as const;

function StepProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="sticky top-16 z-30 bg-[#FFFBF5]/90 backdrop-blur-md border-b border-black/5 py-3 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {CONV_STEPS.map((step, i) => {
          const isCompleted = activeStep > step.num;
          const isActive = activeStep === step.num;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-[#F47C20] text-white ring-4 ring-[#F47C20]/20"
                        : "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isCompleted ? "text-green-600" : isActive ? "text-[#F47C20]" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < CONV_STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2 mt-[-12px]", activeStep > step.num ? "bg-green-500" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mr. George Tips ─── */
const GEORGE_TIPS: Record<string, string> = {
  pressure_washing: "Pressure washing? Most Orlando homes need it twice a year due to humidity and mildew.",
  "pressure-washing": "Pressure washing? Most Orlando homes need it twice a year due to humidity and mildew.",
  moving_labor: "Moving? Our pros bring all equipment — just point and direct!",
  "moving-labor": "Moving? Our pros bring all equipment — just point and direct!",
  junk_removal: "Pro tip: Group similar items together before pickup day to save time and money.",
  "junk-removal": "Pro tip: Group similar items together before pickup day to save time and money.",
  handyman: "Not sure what's wrong? Our handymen can diagnose and fix in one visit.",
  home_cleaning: "First-time deep clean usually takes 2-3x longer than maintenance cleans.",
  "home-cleaning": "First-time deep clean usually takes 2-3x longer than maintenance cleans.",
  landscaping: "Florida lawns grow year-round — monthly maintenance keeps things sharp.",
  gutter_cleaning: "Clogged gutters cause 90% of Florida roof leaks. Clean them twice a year!",
  "gutter-cleaning": "Clogged gutters cause 90% of Florida roof leaks. Clean them twice a year!",
  pool_cleaning: "Pool chemistry changes fast in Florida heat — weekly service prevents algae.",
  "pool-cleaning": "Pool chemistry changes fast in Florida heat — weekly service prevents algae.",
  carpet_cleaning: "For best results, vacuum thoroughly before our pros arrive.",
  "carpet-cleaning": "For best results, vacuum thoroughly before our pros arrive.",
  garage_cleanout: "Take photos of everything first — you'll be surprised what you want to keep!",
  "garage-cleanout": "Take photos of everything first — you'll be surprised what you want to keep!",
  light_demolition: "Our demo crews handle permits when needed. Just tell us what's coming down.",
  "light-demolition": "Our demo crews handle permits when needed. Just tell us what's coming down.",
};

function GeorgeTip({ service }: { service: string | null }) {
  const tip = service ? GEORGE_TIPS[service] : null;
  const defaultTip = "All our pros are background-checked, insured, and rated by real Orlando homeowners.";
  return (
    <div className="max-w-2xl mx-auto mb-3">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-3">
        <span className="text-lg leading-none mt-0.5">💡</span>
        <div>
          <span className="text-xs font-bold text-amber-700">Mr. George tip</span>
          <p className="text-sm text-amber-900 mt-0.5">{tip || defaultTip}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Chat helpers ─── */

interface ActionData { type: string; data?: any; }

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickActions?: Array<{ label: string; action: string }>;
  photoUrl?: string;
  propertyData?: any;
  breakdown?: any;
  quoteCard?: any;
}

const LS_SESSION = "uptend-booking-session";

function getSessionId() {
  let sid = sessionStorage.getItem(LS_SESSION);
  if (!sid) {
    sid = `book-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(LS_SESSION, sid);
  }
  return sid;
}

function resetSession() {
  sessionStorage.removeItem(LS_SESSION);
}

function renderContent(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
  return DOMPurify.sanitize(html);
}

/* ─── Rich Cards ─── */

function PropertyCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-xl p-3 text-sm space-y-2 border border-amber-200/40">
      <div className="font-semibold">🏠 Property Info</div>
      <div className="grid grid-cols-2 gap-1 text-xs">
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
    <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-xl p-4 text-sm space-y-2 border border-green-200/40">
      <div className="font-semibold text-base">✨ Your Quote</div>
      <div className="text-3xl font-bold text-green-700">${data.price}</div>
      <div className="text-xs"><span className="text-muted-foreground">Service:</span> {data.service}</div>
      {data.address && <div className="text-xs"><span className="text-muted-foreground">Address:</span> {data.address}</div>}
      <div className="text-xs"><span className="text-muted-foreground">Valid until:</span> {new Date(data.validUntil).toLocaleDateString()}</div>
    </div>
  );
}

function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 rounded-xl p-3 text-sm space-y-2 border border-amber-200/40">
      <div className="font-semibold">📊 Price Breakdown</div>
      {data.items && <div className="text-xs"><span className="text-muted-foreground">Items:</span> {data.items.join(", ")}</div>}
      {data.volume && <div className="text-xs"><span className="text-muted-foreground">Volume:</span> {data.volume}</div>}
      {data.laborHours && <div className="text-xs"><span className="text-muted-foreground">Labor:</span> ~{data.laborHours} hours</div>}
      {data.baseRate && <div className="text-xs"><span className="text-muted-foreground">Base rate:</span> ${data.baseRate}</div>}
    </div>
  );
}

/* ─── Conversational step detection (heuristic from messages) ─── */
function detectConversationalStep(messages: Message[]): number {
  const assistantMsgs = messages.filter(m => m.role === "assistant").map(m => m.content.toLowerCase());
  const allText = assistantMsgs.join(" ");
  // Check in reverse order — highest step wins
  if (messages.some(m => m.quoteCard)) return 5;
  if (allText.includes("date") || allText.includes("time") || allText.includes("schedule") || allText.includes("when")) return 4;
  if (allText.includes("address") || allText.includes("where") || allText.includes("location")) return 3;
  if (allText.includes("describe") || allText.includes("tell me more") || allText.includes("details") || allText.includes("what do you need")) return 2;
  if (messages.length > 1) return 2;
  return 1;
}

/* ─── George Avatar ─── */
function GeorgeAvatar({ size = "lg" }: { size?: "sm" | "lg" }) {
  const s = size === "lg" ? "w-16 h-16" : "w-8 h-8";
  const icon = size === "lg" ? "w-8 h-8" : "w-4 h-4";
  return (
    <div className={cn(s, "rounded-full bg-[#F47C20] flex items-center justify-center shadow-lg")}>
      <Bot className={cn(icon, "text-white")} />
    </div>
  );
}

/* ─── Full-screen Booking Chat ─── */
function BookingConversation({
  preselectedService,
  onPayment,
}: {
  preselectedService: string | null;
  onPayment: (jobId: string, amount: number) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSent = useRef(false);

  const serviceLabel = preselectedService
    ? preselectedService.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;

  // Auto-send opening
  useEffect(() => {
    if (hasAutoSent.current) return;
    hasAutoSent.current = true;
    resetSession();

    if (serviceLabel) {
      // George already knows the service
      const initMsg: Message = {
        id: `ai-init-${Date.now()}`,
        role: "assistant",
        content: `${serviceLabel}, great choice! Let me get you set up. 🏠\n\nCan you tell me a bit about the job? What needs to be done?`,
        quickActions: [
          { label: "Just a standard job", action: "message:Just a standard " + serviceLabel.toLowerCase() + " job" },
          { label: "I'll send photos", action: "message:Let me send some photos" },
        ],
      };
      setMessages([initMsg]);
    } else {
      const initMsg: Message = {
        id: `ai-init-${Date.now()}`,
        role: "assistant",
        content: "Let's get your home taken care of! What service do you need? 🏠",
        quickActions: [
          { label: "🧹 Pressure Washing", action: "message:I need pressure washing" },
          { label: "🚚 Junk Removal", action: "message:I need junk removal" },
          { label: "🔧 Handyman", action: "message:I need a handyman" },
          { label: "🏡 Landscaping", action: "message:I need landscaping" },
          { label: "🧹 Home Cleaning", action: "message:I need home cleaning" },
          { label: "📦 Moving Help", action: "message:I need moving labor" },
        ],
      };
      setMessages([initMsg]);
    }
  }, [serviceLabel]);

  // Scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // Focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const processActions = useCallback((actions: ActionData[]) => {
    for (const action of actions) {
      if (action.type === "redirect_payment" && action.data) {
        onPayment(action.data.jobId, action.data.amount);
      }
    }
  }, [onPayment]);

  const sendMessage = useCallback(async (overrideMsg?: string) => {
    const msg = overrideMsg || input.trim();
    if (!msg || isLoading) return;

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: "user", content: msg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: msg,
          sessionId: getSessionId(),
          context: {
            page: "/book",
            serviceType: preselectedService || undefined,
            userRole: "customer",
            bookingFlow: true,
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
          if (action.type === "breakdown") aiMsg.breakdown = action.data;
        }
        processActions(data.actions);
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Hmm, I couldn't connect. Check your internet and try again! 🔄",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, preselectedService, processActions]);

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);

    const photoPreviewUrl = URL.createObjectURL(file);
    setMessages(prev => [...prev, {
      id: `user-photo-${Date.now()}`,
      role: "user",
      content: "📷 Sent a photo",
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
        body: JSON.stringify({ photoUrl: dataUrl, sessionId: getSessionId(), serviceType: preselectedService }),
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
          context: { page: "/book", serviceType: preselectedService, userRole: "customer", bookingFlow: true },
        }),
      });
      const chatData = await chatRes.json();

      const aiMsg: Message = {
        id: `ai-photo-${Date.now()}`,
        role: "assistant",
        content: typeof chatData.reply === "string" ? chatData.reply : "I received your photo! Let me take a look.",
        quickActions: chatData.quickActions,
      };

      if (chatData.actions) {
        for (const action of chatData.actions) {
          if (action.type === "property_scan") aiMsg.propertyData = action.data;
          if (action.type === "lock_quote") aiMsg.quoteCard = action.data;
          if (action.type === "breakdown") aiMsg.breakdown = action.data;
        }
        processActions(chatData.actions);
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-photo-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't analyze that photo. Try again! 📷",
      }]);
    } finally {
      setIsUploading(false);
    }
  }, [preselectedService, processActions]);

  const handleAction = useCallback((action: string) => {
    if (action.startsWith("message:")) {
      const msg = action.replace("message:", "");
      sendMessage(msg);
    }
  }, [sendMessage]);

  const convStep = useMemo(() => detectConversationalStep(messages), [messages]);

  return (
    <>
      <StepProgressBar activeStep={convStep} />

      <main className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-4 pt-4 pb-4">
        {/* George header */}
        <div className="flex flex-col items-center mb-4 shrink-0">
          <GeorgeAvatar size="lg" />
          <h2 className="text-lg font-bold text-slate-900 mt-2">Mr. George</h2>
          <p className="text-xs text-slate-500">Your booking assistant</p>
        </div>

        <GeorgeTip service={preselectedService} />

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-2">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="shrink-0 mr-2 mt-1">
                  <GeorgeAvatar size="sm" />
                </div>
              )}
              <div className="max-w-[80%] space-y-2">
                {msg.photoUrl && (
                  <div className="rounded-xl overflow-hidden border border-black/5">
                    <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-48 object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-[#F47C20] text-white rounded-br-md"
                      : "bg-white border border-black/5 shadow-sm rounded-bl-md"
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
                {msg.propertyData && <PropertyCard data={msg.propertyData} />}
                {msg.quoteCard && <QuoteCard data={msg.quoteCard} />}
                {msg.breakdown && <BreakdownCard data={msg.breakdown} />}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickActions.map((qa, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(qa.action)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200/40"
                      >
                        {qa.label}
                        <ChevronRight className="w-3 h-3 opacity-50" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {(isLoading || isUploading) && (
            <div className="flex items-start">
              <div className="shrink-0 mr-2 mt-1"><GeorgeAvatar size="sm" /></div>
              <div className="bg-white border border-black/5 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "0.8s" }} />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "0.8s" }} />
                    <div className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "0.8s" }} />
                  </div>
                  {isUploading && <span className="text-xs text-muted-foreground">Analyzing photo…</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 pt-3 border-t border-black/5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); e.target.value = ""; }}
          />
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
            <button
              type="button"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-black/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              title="Upload photo"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell George what you need…"
              className="flex-1 bg-white text-sm h-11 px-4 rounded-full border border-black/10 focus:outline-none focus:border-[#F47C20]/50 focus:ring-2 focus:ring-[#F47C20]/10 transition-all placeholder:text-slate-400"
              disabled={isLoading || isUploading}
            />
            <button
              type="submit"
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-[#F47C20] text-white hover:bg-[#e06d15] transition-colors disabled:opacity-30"
              disabled={!input.trim() || isLoading || isUploading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            By continuing, you agree to UpTend's{" "}
            <a href="/terms" className="underline hover:text-slate-600">Terms</a>,{" "}
            <a href="/ai-terms" className="underline hover:text-slate-600">AI Terms</a>, and{" "}
            <a href="/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </div>
      </main>
    </>
  );
}

/* ─── Map internal estimator step to display step ─── */
const FORM_STEPS = [
  { label: "Service", num: 1 },
  { label: "Details", num: 2 },
  { label: "Schedule", num: 3 },
  { label: "Review", num: 4 },
  { label: "Payment", num: 5 },
] as const;

function FormStepProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-black/5 py-3 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {FORM_STEPS.map((step, i) => {
          const isCompleted = activeStep > step.num;
          const isActive = activeStep === step.num;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-[#F47C20] text-white ring-4 ring-[#F47C20]/20"
                        : "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isCompleted ? "text-green-600" : isActive ? "text-[#F47C20]" : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < FORM_STEPS.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2 mt-[-12px]", activeStep > step.num ? "bg-green-500" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function mapToDisplayStep(internalStep: number | string): number {
  if (internalStep === 1) return 1;
  if (internalStep === 2 || internalStep === "choose-pro") return 2;
  if (internalStep === 3 || internalStep === 4 || internalStep === 5) return 3;
  if (internalStep === 6) return 4;
  if (internalStep === 7) return 5;
  return 1;
}

/* ─── Main Page ─── */
export default function BookingPage() {
  const { mode } = useSiteMode();
  if (mode === "classic") return <BookingClassicPage />;
  return <BookingGeorgePage />;
}

function BookingGeorgePage() {
  usePageTitle("Book a Service | UpTend");
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");
  const preselectedTiming = params.get("timing");

  // Mode: "chat" (default) or "form"
  const [mode, setMode] = useState<"chat" | "form">("chat");

  // Form mode step tracking
  const [estimatorStep, setEstimatorStep] = useState<number | string>(1);
  const displayStep = useMemo(() => mapToDisplayStep(estimatorStep), [estimatorStep]);

  // Direct payment step — used when Mr. George AI creates a booking draft and redirects here
  const directJobId = params.get("jobId");
  const directAmount = params.get("amount");
  const directStep = params.get("step");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handlePayment = useCallback((jobId: string, amount: number) => {
    navigate(`/book?step=payment&jobId=${jobId}&amount=${amount}`);
  }, [navigate]);

  // Direct payment step: ?step=payment&jobId=xxx&amount=yyy
  if (directStep === "payment" && directJobId && directAmount) {
    const amount = parseFloat(directAmount);
    const customerId = (user as any)?.userId || (user as any)?.id || "";
    return (
      <div className="min-h-screen bg-[#FFFBF5]">
        <Header />
        <FormStepProgressBar activeStep={5} />
        <main className="container mx-auto px-4 pt-6 pb-24 md:pb-12">
          <GeorgeTip service={null} />
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                Complete Payment
              </h2>
              <p className="text-base text-slate-600">
                Authorize payment to confirm your booking
              </p>
            </div>
            <PaymentForm
              amount={amount}
              jobId={directJobId}
              customerId={customerId}
              onSuccess={() => {
                toast({
                  title: "Payment authorized!",
                  description: "Your booking is confirmed. A verified Pro will be dispatched soon.",
                });
                navigate("/booking-success");
              }}
              onError={(error) => {
                toast({
                  title: "Payment failed",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // Form mode (escape hatch)
  if (mode === "form") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
        <Header />
        <FormStepProgressBar activeStep={displayStep} />
        <main className="container mx-auto px-4 pt-6 pb-24 md:pb-12">
          <div className="max-w-2xl mx-auto mb-4">
            <button
              onClick={() => setMode("chat")}
              className="inline-flex items-center gap-1.5 text-sm text-[#F47C20] hover:text-[#e06d15] font-medium transition-colors"
            >
              <Bot className="w-4 h-4" />
              ← Back to chatting with George
            </button>
          </div>
          <GeorgeTip service={preselectedService} />
          <FloridaEstimator
            preselectedService={preselectedService ?? undefined}
            preselectedTiming={preselectedTiming ?? undefined}
            onStepChange={setEstimatorStep}
          />
        </main>
      </div>
    );
  }

  // Conversational mode (default)
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Header />
      {/* Escape hatch */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <button
          onClick={() => setMode("form")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Prefer to fill out the form yourself?
        </button>
      </div>

      <BookingConversation
        preselectedService={preselectedService}
        onPayment={handlePayment}
      />
    </div>
  );
}
