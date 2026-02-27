/**
 * AI Concierge & Chat Assistant API Routes
 *
 * Endpoints:
 * - POST /api/ai/chat - Start or continue a conversation
 * - GET /api/ai/conversations - Get user's conversations
 * - GET /api/ai/conversations/:id - Get conversation with messages
 * - POST /api/ai/conversations/:id/rate - Rate a conversation
 * - DELETE /api/ai/conversations/:id - Delete a conversation
 */

import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { generateConciergeResponse } from "../../services/ai/concierge-service";
import { chat as georgeChat, type GeorgeContext } from "../../services/george-agent";

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

export function createConciergeRoutes(storage: DatabaseStorage) {
  const router = Router();

  // ==========================================
  // POST /api/ai/chat
  // Send a message and get AI response
  // ==========================================
  const chatSchema = z.object({
    message: z.string().min(1),
    conversationId: z.string().optional(),
    sessionId: z.string().optional(),
    conversationType: z.enum(["general", "booking", "support", "onboarding"]).default("general"),
    contextData: z.record(z.any()).optional(),
    currentPage: z.string().optional(),
    conversationHistory: z.array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })).optional(),
  });

  router.post("/chat", aiChatLimiter, async (req, res) => {
    // Enforce 10KB payload limit
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 10240) {
      return res.status(413).json({ error: "Payload too large. Maximum 10KB allowed." });
    }
    try {
      const validated = chatSchema.parse(req.body);
      const userId = (req.user as any)?.userId || (req.user as any)?.id || null;
      const isAuthenticated = !!userId;

      // Get or create conversation (only for authenticated users)
      let conversation: any = null;
      if (isAuthenticated) {
        if (validated.conversationId) {
          conversation = await storage.getAiConversation(validated.conversationId);
          if (!conversation || conversation.userId !== userId) {
            return res.status(404).json({ error: "Conversation not found" });
          }
        } else {
          // Create new conversation
          conversation = await storage.createAiConversation({
            userId,
            title: validated.message.slice(0, 100),
            channel: "in_app",
            status: "active",
            contextType: validated.conversationType || "general",
            messageCount: 0,
            aiModelUsed: "claude-sonnet",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any);
        }

        // Save user message
        await storage.createAiConversationMessage({
          conversationId: conversation.id,
          role: "user",
          content: validated.message,
          createdAt: new Date().toISOString(),
        } as any);
      }

      // Build conversation history - prefer client-sent history, fall back to DB
      let conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
      if (validated.conversationHistory && validated.conversationHistory.length > 0) {
        conversationHistory = validated.conversationHistory as Array<{ role: "user" | "assistant"; content: string }>;
      } else if (conversation?.id) {
        const existingMessages = await storage.getAiMessagesByConversation(conversation.id);
        conversationHistory = existingMessages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      } else {
        conversationHistory = [];
      }

      // Get user info for context (if authenticated)
      const user = isAuthenticated ? await storage.getUser(userId) : null;

      // Build George context
      const georgeContext: GeorgeContext = {
        userId: userId ? String(userId) : "anonymous",
        userName: user?.firstName || user?.username || undefined,
        currentPage: validated.currentPage || undefined,
        isAuthenticated,
        storage,
      };

      // Call George agent with function calling
      const georgeResult = await georgeChat(
        validated.message,
        conversationHistory,
        georgeContext
      );

      // Save AI response (only for authenticated users with a conversation)
      let aiMessage: any = null;
      if (conversation) {
        aiMessage = await storage.createAiConversationMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: georgeResult.response,
          suggestedActions: georgeResult.buttons.length > 0 ? JSON.stringify(georgeResult.buttons) : null,
          createdAt: new Date().toISOString(),
        } as any);

        // Update conversation
        await storage.updateAiConversation(conversation.id, {
          updatedAt: new Date().toISOString(),
          messageCount: (conversation.messageCount || 0) + 2,
        });
      }

      res.json({
        success: true,
        conversationId: conversation?.id || null,
        response: georgeResult.response,
        buttons: georgeResult.buttons,
        bookingDraft: georgeResult.bookingDraft || null,
        message: aiMessage ? {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          createdAt: aiMessage.createdAt,
        } : {
          role: "assistant",
          content: georgeResult.response,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      res.status(400).json({
        error: error.message || "Failed to process chat message",
      });
    }
  });

  // ==========================================
  // GET /api/ai/conversations
  // Get all active conversations for user
  // ==========================================
  router.get("/conversations", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const conversations = await storage.getActiveAiConversationsByUser(userId);

      res.json({
        success: true,
        conversations: conversations.map((conv) => ({
          ...conv,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch conversations",
      });
    }
  });

  // ==========================================
  // GET /api/ai/conversations/:id
  // Get conversation with all messages
  // ==========================================
  router.get("/conversations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = ((req.user as any).userId || (req.user as any).id);

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getAiMessagesByConversation(id);

      res.json({
        success: true,
        conversation: {
          ...conversation,
        },
        messages,
      });
    } catch (error: any) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({
        error: error.message || "Failed to fetch conversation",
      });
    }
  });

  // ==========================================
  // POST /api/ai/conversations/:id/rate
  // Rate a conversation
  // ==========================================
  const ratingSchema = z.object({
    rating: z.number().min(1).max(5),
    feedbackText: z.string().optional(),
  });

  router.post("/conversations/:id/rate", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = ((req.user as any).userId || (req.user as any).id);
      const validated = ratingSchema.parse(req.body);

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await storage.updateAiConversation(id, {
        customerRating: validated.rating,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error rating conversation:", error);
      res.status(400).json({
        error: error.message || "Failed to rate conversation",
      });
    }
  });

  // ==========================================
  // DELETE /api/ai/conversations/:id
  // Delete a conversation
  // ==========================================
  router.delete("/conversations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = ((req.user as any).userId || (req.user as any).id);

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await storage.updateAiConversation(id, { status: "archived" });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({
        error: error.message || "Failed to delete conversation",
      });
    }
  });

  return router;
}

export default createConciergeRoutes;
