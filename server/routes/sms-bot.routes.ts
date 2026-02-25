/**
 * SMS Bot Routes (standalone)
 * 
 * Additional SMS endpoints: outbound send, conversation history.
 * The main /api/sms/incoming webhook is in server/routes/ai/sms-bot.routes.ts.
 */

import type { Express } from "express";
import { sendSMS } from "../services/sms-service";
import { storage } from "../storage";
import { db } from "../db";
import { smsConversations, smsMessages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerSmsBotStandaloneRoutes(app: Express): void {
  /**
   * POST /api/sms/send
   * Send an outbound SMS (requires auth)
   */
  app.post("/api/sms/send", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).json({ error: "Both 'to' and 'message' are required" });
      }

      const phone = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;
      const result = await sendSMS(phone, message);

      // Log outbound message
      try {
        const conversation = await storage.getOrCreateSmsConversation(phone);
        await storage.createSmsMessage({
          conversationId: conversation.id,
          direction: "outbound",
          messageBody: message,
          twilioMessageSid: result.messageSid || undefined,
          sentAt: new Date().toISOString(),
        });
      } catch (logErr: any) {
        console.error("[SMS] Failed to log outbound message:", logErr.message);
      }

      return res.json(result);
    } catch (error: any) {
      console.error("[SMS] Send error:", error);
      return res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  /**
   * GET /api/sms/conversations/:userId
   * Get SMS conversation history for a user
   */
  app.get("/api/sms/conversations/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { userId } = req.params;

      const conversations = await db.select().from(smsConversations)
        .where(eq(smsConversations.userId, userId))
        .orderBy(desc(smsConversations.lastMessageAt));

      if (!conversations.length) {
        return res.json({ conversations: [], messages: [] });
      }

      const allMessages: any[] = [];
      for (const conv of conversations) {
        const messages = await db.select().from(smsMessages)
          .where(eq(smsMessages.conversationId, conv.id))
          .orderBy(desc(smsMessages.createdAt))
          .limit(50);

        allMessages.push(
          ...messages.map((m) => ({
            id: m.id,
            conversationId: m.conversationId,
            direction: m.direction,
            body: m.messageBody,
            sentAt: m.sentAt,
            phone: conv.phoneNumber,
          }))
        );
      }

      allMessages.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

      return res.json({
        conversations: conversations.map((c) => ({
          id: c.id,
          phoneNumber: c.phoneNumber,
          messageCount: c.messageCount,
          lastMessageAt: c.lastMessageAt,
          isActive: c.isActive,
          optedOut: c.optedOut,
        })),
        messages: allMessages,
      });
    } catch (error: any) {
      console.error("[SMS] Conversations error:", error);
      return res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
}
