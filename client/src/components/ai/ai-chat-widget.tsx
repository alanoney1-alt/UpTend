/**
 * AI Chat Widget Component (Secondary)
 *
 * Floating chat widget with George AI agent. quick replies, context, booking drafts.
 * Used on pages where the primary chat-widget.tsx is not mounted.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Send, Loader2 } from "lucide-react";
import { VideoPlayer, extractAllVideoIds } from "./video-player";

function GeorgeAvatarSmall({ className = "h-full w-full" }: { className?: string }) {
  return <img src="/george-avatar.png" alt="George" className={`${className} object-cover rounded-full`} />;
}

// ─── Types ──────────────────────────────────
interface QuickButton {
  text: string;
  action: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  buttons?: QuickButton[];
  bookingDraft?: any;
}

// ─── Helpers ────────────────────────────────
function isProPage(path: string) {
  return /^\/(pro|drive|become-pro)/.test(path);
}

// ─── Quick Buttons ──────────────────────────
function QuickButtons({ buttons, onPress }: { buttons: QuickButton[]; onPress: (btn: QuickButton) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {buttons.map((btn) => (
        <button
          key={btn.text}
          onClick={() => onPress(btn)}
          className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm hover:bg-orange-200 transition"
        >
          {btn.text}
        </button>
      ))}
    </div>
  );
}

// ─── Booking Draft Card ─────────────────────
function BookingDraftCard({ draft, onAction }: { draft: any; onAction: (btn: QuickButton) => void }) {
  const q = draft.quote || {};
  return (
    <div className="bg-white border border-orange-200 rounded-xl p-3 mt-2 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base"></span>
        <span className="font-semibold text-sm">Your Quote</span>
      </div>
      <p className="text-sm font-medium">{draft.serviceName}</p>
      {q.priceFormatted && <p className="text-lg font-bold text-orange-600 mt-1">{q.priceFormatted}</p>}
      {draft.preferredDate && <p className="text-xs text-gray-500"> {draft.preferredDate}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={() => onAction({ text: "Confirm & Book", action: "action:confirmBooking" })} className="flex-1 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
          Confirm & Book
        </button>
        <button onClick={() => onAction({ text: "Edit", action: "reply:I'd like to change some details" })} className="flex-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">
          Edit Details
        </button>
      </div>
    </div>
  );
}

// ─── Main Widget ────────────────────────────
export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);

  const currentPage = typeof window !== "undefined" ? window.location.pathname : "/";

  // Listen for george:open events (from inline prompt, "Ask George" buttons, etc.)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setIsOpen(true);
      if (detail?.message) {
        // Queue the message to send after opening
        pendingMessageRef.current = detail.message;
      }
    };
    window.addEventListener("george:open", handler);
    return () => window.removeEventListener("george:open", handler);
  }, []);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("george_chat_secondary");
      if (saved) {
        const { messages: m, conversationId: c } = JSON.parse(saved);
        if (Array.isArray(m)) setMessages(m);
        if (c) setConversationId(c);
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("george_chat_secondary", JSON.stringify({ messages, conversationId }));
      } catch {}
    }
  }, [messages, conversationId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
          conversationType: "general",
          currentPage,
          conversationHistory: history,
        }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.conversationId) setConversationId(data.conversationId);
      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: data.response || data.message?.content || "Sorry, I couldn't process that.",
        createdAt: new Date().toISOString(),
        buttons: data.buttons || [],
        bookingDraft: data.bookingDraft || undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: (err: Error) => { console.error(err); },
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback((text?: string) => {
    const msg = (text || message).trim();
    if (!msg || sendMessageMutation.isPending) return;
    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content: msg, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    sendMessageMutation.mutate(msg);
  }, [message, sendMessageMutation]);

  const handleQuickReply = useCallback((btn: QuickButton) => {
    if (btn.action.startsWith("navigate:")) {
      window.location.href = btn.action.replace("navigate:", "");
    } else if (btn.action.startsWith("reply:")) {
      handleSend(btn.action.replace("reply:", ""));
    } else if (btn.action.startsWith("action:")) {
      handleSend(btn.text);
    }
  }, [handleSend]);

  // Send pending message from inline prompt after widget opens
  useEffect(() => {
    if (isOpen && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      // Small delay so the widget renders first
      setTimeout(() => handleSend(msg), 100);
    }
  }, [isOpen, handleSend]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPro = isProPage(currentPage);
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

  return (
    <>
      <style>{`
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
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

      {/* Floating George Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 h-14 w-14 rounded-full z-40 p-0 overflow-hidden border-2 border-[#F47C20]/60 hover:border-[#F47C20] transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{ animation: "fabPulse 3s ease-in-out infinite" }}
        >
          <GeorgeAvatarSmall />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 bg-green-400 rounded-full border-2 border-slate-900" />
        </button>
      )}

      {/* Chat Widget — dark, smooth, George's space */}
      {isOpen && (
        <div
          className="fixed bottom-[7.5rem] md:bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[60vh] md:max-h-[520px] z-40 flex flex-col rounded-2xl overflow-hidden"
          style={{
            animation: "chatSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            background: "linear-gradient(180deg, #0f172a 0%, #0a0e1a 100%)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(244, 124, 32, 0.08)",
            border: "1px solid rgba(244, 124, 32, 0.15)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-[#F47C20]/30">
                  <GeorgeAvatarSmall />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-[#0f172a]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">George</h3>
                <p className="text-green-400/80 text-[11px]">Online now</p>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); localStorage.setItem('george_dismissed', 'true'); }}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-[#F47C20]/20 mb-4">
                  <GeorgeAvatarSmall />
                </div>
                <p className="text-white font-semibold text-base mb-1">
                  {isPro ? "Thinking about joining UpTend?" : "Need something done around the house?"}
                </p>
                <p className="text-slate-400 text-xs mb-5 leading-relaxed max-w-[260px]">
                  {isPro ? "I can walk you through everything." : "I'll get you a fair price and the right pro. Fast."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {greetingButtons.map((btn) => (
                    <button
                      key={btn.text}
                      onClick={() => handleQuickReply(btn)}
                      className="px-3.5 py-2 rounded-full text-xs font-medium border transition-all duration-200
                        bg-white/[0.04] border-[#F47C20]/20 text-slate-300
                        hover:bg-[#F47C20]/10 hover:border-[#F47C20]/40 hover:text-white"
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-1">
                      <GeorgeAvatarSmall />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#F47C20] text-white rounded-br-sm"
                        : "bg-white/[0.06] text-slate-200 rounded-bl-sm border border-white/[0.04]"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "assistant" && extractAllVideoIds(msg.content).map((vid) => (
                      <VideoPlayer key={vid} videoId={vid} />
                    ))}
                    {msg.bookingDraft && <BookingDraftCard draft={msg.bookingDraft} onAction={handleQuickReply} />}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.buttons.map((btn) => (
                          <button
                            key={btn.text}
                            onClick={() => handleQuickReply(btn)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                              bg-white/[0.04] border-[#F47C20]/20 text-slate-300
                              hover:bg-[#F47C20]/10 hover:border-[#F47C20]/40 hover:text-white"
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className={`text-[10px] text-slate-600 mt-1 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {/* George thinking */}
            {sendMessageMutation.isPending && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-1">
                  <GeorgeAvatarSmall />
                </div>
                <div className="bg-white/[0.06] border border-white/[0.04] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "200ms" }} />
                    <span className="h-2 w-2 bg-[#F47C20] rounded-full" style={{ animation: "dotPulse 1.4s ease-in-out infinite", animationDelay: "400ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex gap-2 items-center">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message George..."
                disabled={sendMessageMutation.isPending}
                className="flex-1 h-10 px-4 rounded-full text-sm bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-slate-500 outline-none focus:border-[#F47C20]/40 focus:bg-white/[0.08] transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="h-10 w-10 rounded-full bg-[#F47C20] hover:bg-[#E06910] flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:hover:bg-[#F47C20]"
              >
                {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
