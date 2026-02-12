import { useState, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

export interface Conversation {
  id: number;
  title?: string;
  createdAt: string;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (message: string) => {
    const userMsg: ChatMessage = { role: "user", content: message, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/chat", {
        message,
        conversationId: conversationId ?? undefined,
        conversationType: "general",
      });
      const data = await res.json();
      
      if (data.conversationId) setConversationId(data.conversationId);
      
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.response || data.message || "Sorry, I couldn't process that.",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "/api/ai/conversations");
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    try {
      const res = await apiRequest("GET", `/api/ai/conversations/${id}`);
      const data = await res.json();
      setConversationId(id);
      setMessages(
        (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    } catch {}
  }, []);

  const newConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
  }, []);

  return {
    messages,
    conversationId,
    isLoading,
    conversations,
    sendMessage,
    loadConversations,
    loadConversation,
    newConversation,
  };
}
