/**
 * George Inline Prompt — lives in the hero section of the landing page.
 * Not a popup. Not a widget. Part of the page itself.
 * 
 * Types into it → opens the full chat with their message pre-filled.
 * Shows last conversation preview for returning visitors.
 */

import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

function GeorgeAvatar({ size = "h-9 w-9" }: { size?: string }) {
  return (
    <div className={`${size} rounded-full overflow-hidden shrink-0`}>
      <img src="/george-avatar.png" alt="George" className="w-full h-full object-cover" />
    </div>
  );
}

interface GeorgeInlinePromptProps {
  onSubmit: (message: string) => void;
  onTap: () => void;
}

export function GeorgeInlinePrompt({ onSubmit, onTap }: GeorgeInlinePromptProps) {
  const [message, setMessage] = useState("");
  const [lastConvo, setLastConvo] = useState<{ role: string; content: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for existing conversation
  useEffect(() => {
    try {
      const saved = localStorage.getItem("george_chat_secondary");
      if (saved) {
        const { messages } = JSON.parse(saved);
        if (Array.isArray(messages) && messages.length > 0) {
          // Find last George message
          const lastGeorge = [...messages].reverse().find((m: any) => m.role === "assistant");
          if (lastGeorge) {
            setLastConvo({ role: "assistant", content: lastGeorge.content });
          }
        }
      }
    } catch {}

    // Stagger animation
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
    }
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max).trim() + "..." : text;

  // Returning visitor — show last conversation preview
  const glowStyles = `
    @keyframes georgeBreath {
      0%, 100% { box-shadow: 0 0 15px rgba(244, 124, 32, 0.1), 0 0 30px rgba(244, 124, 32, 0.05), inset 0 0 15px rgba(244, 124, 32, 0.03); }
      50% { box-shadow: 0 0 25px rgba(244, 124, 32, 0.25), 0 0 50px rgba(244, 124, 32, 0.1), inset 0 0 20px rgba(244, 124, 32, 0.05); }
    }
    @keyframes avatarPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(244, 124, 32, 0.3); }
      50% { box-shadow: 0 0 0 6px rgba(244, 124, 32, 0); }
    }
  `;

  if (lastConvo) {
    return (
      <div
        onClick={onTap}
        className="max-w-lg mx-auto cursor-pointer group"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <style>{glowStyles}</style>
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-[#F47C20]/20 hover:border-[#F47C20]/40 hover:bg-white/[0.08] transition-all duration-300"
          style={{ animation: "georgeBreath 3s ease-in-out infinite" }}
        >
          <div className="relative shrink-0 mt-0.5">
            <GeorgeAvatar />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm leading-relaxed">
              {truncate(lastConvo.content, 120)}
            </p>
            <p className="text-[#F47C20] text-xs font-medium mt-1.5 group-hover:underline">
              Continue chatting with George
            </p>
          </div>
        </div>
      </div>
    );
  }

  // First-time visitor — show input prompt
  return (
    <div
      className="max-w-lg mx-auto"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{glowStyles}</style>
      <form onSubmit={handleSubmit} className="relative">
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-[#F47C20]/25 focus-within:border-[#F47C20]/50 transition-all duration-300"
          style={{ animation: "georgeBreath 3s ease-in-out infinite" }}
        >
          <div className="relative shrink-0">
            <div style={{ animation: "avatarPulse 3s ease-in-out infinite" }} className="rounded-full">
              <GeorgeAvatar />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-slate-900" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Need something done around the house?"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
          />
          {message.trim() ? (
            <button
              type="submit"
              className="shrink-0 h-8 w-8 rounded-full bg-[#F47C20] hover:bg-[#E06910] flex items-center justify-center transition-colors"
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </button>
          ) : (
            <span className="text-white/25 text-xs shrink-0 hidden sm:block">Ask George</span>
          )}
        </div>
      </form>
    </div>
  );
}
