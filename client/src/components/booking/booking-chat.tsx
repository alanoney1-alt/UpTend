import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Mic, MicOff, Paperclip, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface BookingChatProps {
  serviceType: string;
  serviceLabel: string;
  onQuoteLocked: (quoteData: any) => void;
  onBookAction: (bookData: any) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ─── Rich Cards (reused from guide) ─────────────────────────────────────────

function PropertyCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-3 text-sm space-y-2 border border-amber-200/40">
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
    <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-3 text-sm space-y-2 border border-green-200/40">
      <div className="font-semibold">✨ Your Quote</div>
      <div className="text-2xl font-bold text-green-700 dark:text-green-400">${data.price}</div>
      <div className="text-xs"><span className="text-muted-foreground">Service:</span> {data.service}</div>
      {data.address && <div className="text-xs"><span className="text-muted-foreground">Address:</span> {data.address}</div>}
      <div className="text-xs"><span className="text-muted-foreground">Valid until:</span> {new Date(data.validUntil).toLocaleDateString()}</div>
    </div>
  );
}

function BreakdownCard({ data }: { data: any }) {
  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-3 text-sm space-y-2 border border-amber-200/40">
      <div className="font-semibold">📊 Price Breakdown</div>
      {data.items && <div className="text-xs"><span className="text-muted-foreground">Items:</span> {data.items.join(", ")}</div>}
      {data.volume && <div className="text-xs"><span className="text-muted-foreground">Volume:</span> {data.volume}</div>}
      {data.laborHours && <div className="text-xs"><span className="text-muted-foreground">Labor:</span> ~{data.laborHours} hours</div>}
      {data.baseRate && <div className="text-xs"><span className="text-muted-foreground">Base rate:</span> ${data.baseRate}</div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BookingChat({ serviceType, serviceLabel, onQuoteLocked, onBookAction }: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSent = useRef(false);

  // Auto-send initial message
  useEffect(() => {
    if (hasAutoSent.current) return;
    hasAutoSent.current = true;
    resetSession();
    const initialMsg = `I'd like to book ${serviceLabel}. Can you help me figure out what I need and get a price?`;
    sendMessage(initialMsg, true);
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
      if (action.type === "lock_quote" && action.data) {
        onQuoteLocked(action.data);
      }
      if (action.type === "book" && action.data) {
        onBookAction(action.data);
      }
    }
  }, [onQuoteLocked, onBookAction]);

  const sendMessage = useCallback(async (overrideMsg?: string, isAutoSend?: boolean) => {
    const msg = overrideMsg || input.trim();
    if (!msg || isLoading) return;

    if (!isAutoSend) {
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: "user", content: msg }]);
    }
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
          context: { page: "/book", serviceType, userRole: "customer" },
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
  }, [input, isLoading, serviceType, processActions]);

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsUploading(true);

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
        body: JSON.stringify({ photoUrl: dataUrl, sessionId: getSessionId(), serviceType }),
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
          context: { page: "/book", serviceType, userRole: "customer" },
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
  }, [serviceType, processActions]);

  const handleAction = useCallback((action: string) => {
    if (action.startsWith("message:")) {
      const msg = action.replace("message:", "");
      setInput(msg);
      setTimeout(() => sendMessage(msg), 100);
    }
  }, [sendMessage]);

  return (
    <div className="flex flex-col h-[500px] md:h-[550px] bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
            <div className="max-w-[85%] space-y-2">
              {msg.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-black/5">
                  <img src={msg.photoUrl} alt="Uploaded" className="w-full max-h-48 object-cover" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-amber-500 text-white rounded-br-md"
                    : "bg-black/[0.04] dark:bg-white/[0.06] rounded-bl-md"
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors border border-amber-200/40"
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
            <div className="bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-black/5 dark:border-white/5 shrink-0">
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
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || isUploading}
            title="Upload photo"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you need…"
            className="flex-1 bg-transparent text-sm h-9 px-3 rounded-full border border-black/10 dark:border-white/10 focus:outline-none focus:border-amber-400/50 transition-colors placeholder:text-muted-foreground/60"
            disabled={isLoading || isUploading}
          />
          <button
            type="submit"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-30"
            disabled={!input.trim() || isLoading || isUploading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
