import { useState, useRef, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle, Send, X, Plus, Loader2, Bot, User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { VideoPlayer, extractAllVideoIds } from "./video-player";

// ─── Types ──────────────────────────────────
interface QuickButton {
  text: string;
  action: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  buttons?: QuickButton[];
  bookingDraft?: any;
}

// ─── Helpers ────────────────────────────────
function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-2 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-2 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n/g, "<br/>");
  return DOMPurify.sanitize(html);
}

function isProPage(path: string) {
  return /^\/(pro|drive|become-pro)/.test(path);
}

// ─── Booking Card ───────────────────────────
function BookingDraftCard({ draft, onConfirm, onEdit }: { draft: any; onConfirm: () => void; onEdit: () => void }) {
  const q = draft.quote || {};
  return (
    <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl p-3.5 mt-2 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📋</span>
        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Your Quote</span>
      </div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
        {draft.serviceName} {q.breakdown?.[0]?.label ? `— ${q.breakdown[0].label}` : ""}
      </p>
      {q.priceFormatted && (
        <p className="text-lg font-bold text-[#F47C20] mt-1">{q.priceFormatted}</p>
      )}
      {draft.preferredDate && (
        <p className="text-xs text-gray-500 mt-0.5">📅 {draft.preferredDate}</p>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={onConfirm} className="flex-1 px-3 py-2 rounded-lg bg-[#F47C20] text-white text-sm font-medium hover:bg-[#e06d15] transition">
          Confirm & Book
        </button>
        <button onClick={onEdit} className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          Edit Details
        </button>
      </div>
    </div>
  );
}

// ─── Quick Reply Buttons ────────────────────
function QuickButtons({ buttons, onPress }: { buttons: QuickButton[]; onPress: (btn: QuickButton) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {buttons.map((btn) => (
        <button
          key={btn.text}
          onClick={() => onPress(btn)}
          className="px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition"
        >
          {btn.text}
        </button>
      ))}
    </div>
  );
}

// ─── Message Bubble ─────────────────────────
function MessageBubble({ msg, onButtonPress }: { msg: ChatMessage; onButtonPress: (btn: QuickButton) => void }) {
  const isUser = msg.role === "user";
  const videoIds = !isUser ? extractAllVideoIds(msg.content) : [];
  return (
    <div className={`flex gap-2 mb-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-7 w-7 shrink-0 mt-1">
        <AvatarFallback className={isUser ? "bg-gray-200 text-gray-600" : "bg-[#F47C20] text-white"}>
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-[#F47C20] text-white rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
          }`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />
        {videoIds.map((vid) => (
          <VideoPlayer key={vid} videoId={vid} />
        ))}
        {msg.bookingDraft && (
          <BookingDraftCard
            draft={msg.bookingDraft}
            onConfirm={() => onButtonPress({ text: "Confirm & Book", action: "action:confirmBooking" })}
            onEdit={() => onButtonPress({ text: "Edit Details", action: "reply:I'd like to change some details" })}
          />
        )}
        {msg.buttons && msg.buttons.length > 0 && (
          <QuickButtons buttons={msg.buttons} onPress={onButtonPress} />
        )}
        <p className={`text-[10px] text-gray-400 mt-0.5 px-1 ${isUser ? "text-right" : "text-left"}`}>
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Widget ────────────────────────────
export function AiChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Persist to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("george_chat", JSON.stringify({ messages, conversationId }));
      } catch {}
    }
  }, [messages, conversationId]);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("george_chat");
      if (saved) {
        const { messages: m, conversationId: c } = JSON.parse(saved);
        if (Array.isArray(m)) setMessages(m);
        if (c) setConversationId(c);
      }
    } catch {}
  }, []);

  const currentPage = typeof window !== "undefined" ? window.location.pathname : "/";

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await apiRequest("POST", "/api/ai/chat", {
        message: text,
        conversationId: conversationId ?? undefined,
        conversationType: "general",
        currentPage,
        conversationHistory: history,
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.response || data.message?.content || "Sorry, I couldn't process that.",
        createdAt: new Date().toISOString(),
        buttons: data.buttons || [],
        bookingDraft: data.bookingDraft || undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again.", createdAt: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationId, currentPage]);

  const handleQuickReply = useCallback((btn: QuickButton) => {
    if (btn.action.startsWith("navigate:")) {
      const path = btn.action.replace("navigate:", "");
      window.location.href = path;
    } else if (btn.action.startsWith("reply:")) {
      const replyText = btn.action.replace("reply:", "");
      sendMessage(replyText);
    } else if (btn.action.startsWith("action:")) {
      const action = btn.action.replace("action:", "");
      if (action === "startBooking" || action === "confirmBooking") {
        sendMessage(btn.text);
      }
    }
  }, [sendMessage]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || isLoading) return;
    setInput("");
    sendMessage(msg);
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    localStorage.removeItem("george_chat");
  };

  if (!isAuthenticated) return null;

  // Determine greeting
  const isPro = isProPage(currentPage);
  const greetingText = isPro
    ? `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 Interested in working with UpTend?`
    : `Hey${user?.firstName ? ` ${user.firstName}` : ""}! 👋 What can I help with?`;
  const greetingButtons: QuickButton[] = isPro
    ? [
        { text: "How It Works", action: "reply:How does working with UpTend work?" },
        { text: "Earnings Calculator", action: "navigate:/pro/earnings" },
        { text: "Apply Now", action: "navigate:/become-pro" },
      ]
    : [
        { text: "Book a Service", action: "reply:I'd like to book a service" },
        { text: "Get a Quote", action: "reply:I need a quote" },
        { text: "Check My Jobs", action: "reply:Show me my recent jobs" },
        { text: "Learn About UpTend", action: "reply:Tell me about UpTend" },
      ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 right-4 z-50 h-14 w-14 rounded-full bg-[#F47C20] text-white shadow-lg hover:bg-[#e06d15] transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[7.5rem] md:bottom-6 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] h-[340px] max-h-[50vh] md:h-[440px] md:max-h-[600px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-[#F47C20] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">George</h3>
            <p className="text-white/70 text-[11px]">Your home helper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20" onClick={newConversation} title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20" onClick={() => setIsOpen(false)} title="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
            <div className="h-16 w-16 rounded-full bg-[#F47C20]/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-[#F47C20]" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {greetingText}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-300 max-w-[260px] mb-1">
              {isPro ? "Learn about earning with UpTend" : "I'm just here to help! Need a pro for your home? Just ask."}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-400 max-w-[260px] mb-4">
              You can close me anytime using the ✕ above.
            </p>
            <QuickButtons buttons={greetingButtons} onPress={handleQuickReply} />
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} onButtonPress={handleQuickReply} />
        ))}
        {isLoading && (
          <div className="flex gap-2 mb-3">
            <Avatar className="h-7 w-7 shrink-0 mt-1">
              <AvatarFallback className="bg-[#F47C20] text-white">
                <Bot className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-full border-gray-300 text-sm h-10"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-full bg-[#F47C20] hover:bg-[#e06d15] shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">Powered by George AI</p>
        <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center mt-0.5">By continuing to chat, you agree to UpTend's <a href="/terms" className="underline hover:text-gray-600">Terms of Service</a>, <a href="/ai-terms" className="underline hover:text-gray-600">A.I. Terms</a>, and <a href="/privacy" className="underline hover:text-gray-600">Privacy Policy</a>.</p>
      </div>
    </div>
  );
}
