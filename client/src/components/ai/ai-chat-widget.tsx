/**
 * AI Chat Widget Component (Secondary)
 *
 * Floating chat widget with Mr. George AI agent. quick replies, context, booking drafts.
 * Used on pages where the primary chat-widget.tsx is not mounted.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VideoPlayer, extractAllVideoIds } from "./video-player";

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
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open for first-time visitors, then remember their choice
    const hasVisited = localStorage.getItem('george_dismissed');
    return !hasVisited;
  });
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentPage = typeof window !== "undefined" ? window.location.pathname : "/";

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
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 md:bottom-8 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-[#F47C20] hover:bg-[#e06d15]"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
        </Button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Card className="fixed bottom-[7.5rem] md:bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] max-h-[55vh] md:max-h-[500px] shadow-xl z-40 flex flex-col">
          <CardHeader className="pb-3 border-b bg-[#F47C20] rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-white">Mr. George</CardTitle>
                  <p className="text-white/70 text-xs">Your home helper</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setIsOpen(false); localStorage.setItem('george_dismissed', 'true'); }} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <Bot className="h-7 w-7 text-[#F47C20]" />
                </div>
                <p className="font-semibold text-sm mb-1">
                  {isPro ? "Hey!  Interested in working with UpTend?" : "Hey!  What can I help with?"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {isPro ? "Learn about earning with UpTend" : "Ask me anything about our services!"}
                </p>
                <QuickButtons buttons={greetingButtons} onPress={handleQuickReply} />
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-7 w-7 shrink-0 mt-1">
                    <AvatarFallback className={msg.role === "user" ? "bg-gray-200 text-gray-600" : "bg-[#F47C20] text-white"}>
                      {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%]">
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-[#F47C20] text-white rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "assistant" && extractAllVideoIds(msg.content).map((vid) => (
                      <VideoPlayer key={vid} videoId={vid} />
                    ))}
                    {msg.bookingDraft && <BookingDraftCard draft={msg.bookingDraft} onAction={handleQuickReply} />}
                    {msg.buttons && msg.buttons.length > 0 && <QuickButtons buttons={msg.buttons} onPress={handleQuickReply} />}
                    <p className={`text-[10px] text-gray-400 mt-0.5 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {sendMessageMutation.isPending && (
              <div className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0 mt-1">
                  <AvatarFallback className="bg-[#F47C20] text-white"><Bot className="h-3.5 w-3.5" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                disabled={sendMessageMutation.isPending}
                className="rounded-full text-sm h-10"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-10 w-10 rounded-full bg-[#F47C20] hover:bg-[#e06d15] shrink-0"
              >
                {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">Powered by Mr. George AI</p>
          </div>
        </Card>
      )}
    </>
  );
}
