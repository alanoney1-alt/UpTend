import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle, Send, X, Minimize2, Plus, Loader2, Bot, User,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAiChat, type ChatMessage } from "@/hooks/use-ai-chat";

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMarkdown(text: string) {
  // Simple markdown: bold, headers, lists
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-2 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-2 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-2 mb-1">$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n/g, "<br/>");
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 mb-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="h-7 w-7 shrink-0 mt-1">
        <AvatarFallback
          className={isUser ? "bg-gray-200 text-gray-600" : "bg-[#F47C20] text-white"}
        >
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
        <p className={`text-[10px] text-gray-400 mt-0.5 px-1 ${isUser ? "text-right" : "text-left"}`}>
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chat = useAiChat();

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [chat.messages, chat.isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || chat.isLoading) return;
    setInput("");
    chat.sendMessage(msg);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-50 h-14 w-14 rounded-full bg-[#F47C20] text-white shadow-lg hover:bg-[#e06d15] transition-all hover:scale-105 flex items-center justify-center group"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-[340px] h-[440px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-[#F47C20] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Bud</h3>
            <p className="text-white/70 text-[11px]">Your home helper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => chat.newConversation()}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-3" ref={scrollRef}>
        {chat.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="h-16 w-16 rounded-full bg-[#F47C20]/10 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-[#F47C20]" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Hey{user?.firstName ? ` ${user.firstName}` : ""}! I'm Bud 👋
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px]">
              Need a pro for your home? I can get you a quote, book a service, or answer any questions. Just ask!
            </p>
          </div>
        )}
        {chat.messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {chat.isLoading && (
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
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 rounded-full border-gray-300 text-sm h-10"
            disabled={chat.isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || chat.isLoading}
            className="h-10 w-10 rounded-full bg-[#F47C20] hover:bg-[#e06d15] shrink-0"
          >
            {chat.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">Powered by Bud AI</p>
      </div>
    </div>
  );
}
