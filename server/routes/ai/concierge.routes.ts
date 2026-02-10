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
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";

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
  });

  router.post("/chat", requireAuth, async (req, res) => {
    try {
      const validated = chatSchema.parse(req.body);
      const userId = req.user!.id;

      // Get or create conversation
      let conversation;
      if (validated.conversationId) {
        conversation = await storage.getAiConversation(validated.conversationId);
        if (!conversation || conversation.userId !== userId) {
          return res.status(404).json({ error: "Conversation not found" });
        }
      } else {
        // Create new conversation
        conversation = await storage.createAiConversation({
          id: nanoid(),
          userId,
          sessionId: validated.sessionId || nanoid(),
          conversationType: validated.conversationType,
          contextData: validated.contextData ? JSON.stringify(validated.contextData) : null,
          startedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          isActive: true,
          rating: null,
          feedbackText: null,
        });
      }

      // Save user message
      await storage.createAiConversationMessage({
        id: nanoid(),
        conversationId: conversation.id,
        role: "user",
        content: validated.message,
        functionCall: null,
        functionResponse: null,
        createdAt: new Date().toISOString(),
      });

      // TODO: Call AI service to get response
      // For now, return a placeholder response
      const aiResponse = `I received your message: "${validated.message}". AI integration is ready to be connected!`;

      // Save AI response
      const aiMessage = await storage.createAiConversationMessage({
        id: nanoid(),
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
        functionCall: null,
        functionResponse: null,
        createdAt: new Date().toISOString(),
      });

      // Update conversation last message time
      await storage.updateAiConversation(conversation.id, {
        lastMessageAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        conversationId: conversation.id,
        message: {
          id: aiMessage.id,
          role: aiMessage.role,
          content: aiMessage.content,
          createdAt: aiMessage.createdAt,
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
      const userId = req.user!.id;
      const conversations = await storage.getActiveAiConversationsByUser(userId);

      res.json({
        success: true,
        conversations: conversations.map((conv) => ({
          ...conv,
          contextData: conv.contextData ? JSON.parse(conv.contextData) : null,
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
      const userId = req.user!.id;

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = await storage.getAiMessagesByConversation(id);

      res.json({
        success: true,
        conversation: {
          ...conversation,
          contextData: conversation.contextData ? JSON.parse(conversation.contextData) : null,
        },
        messages: messages.map((msg) => ({
          ...msg,
          functionCall: msg.functionCall ? JSON.parse(msg.functionCall) : null,
          functionResponse: msg.functionResponse ? JSON.parse(msg.functionResponse) : null,
        })),
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
      const userId = req.user!.id;
      const validated = ratingSchema.parse(req.body);

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await storage.updateAiConversation(id, {
        rating: validated.rating,
        feedbackText: validated.feedbackText || null,
        isActive: false,
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
      const userId = req.user!.id;

      const conversation = await storage.getAiConversation(id);
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      await storage.updateAiConversation(id, { isActive: false });

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
