/**
 * AI Voice Booking API Routes (#24)
 *
 * Phone-based AI agent — speech-to-text + pricing engine + TTS.
 *
 * Endpoints:
 * - POST /api/ai/voice/inbound - Webhook: incoming call handler
 * - GET /api/ai/voice/sessions - List voice sessions
 * - GET /api/ai/voice/sessions/:id - Get session details
 * - POST /api/ai/voice/sessions/:id/escalate - Transfer to human
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { createChatCompletion } from "../../services/ai/anthropic-client";

const VOICE_SYSTEM_PROMPT = `You are UpTend's AI phone booking agent for Orlando Metro home services.

Services: Junk Removal ($99+), Pressure Washing ($120+), Gutter Cleaning ($150+), 
Pool Cleaning (Basic $120/mo, Standard $165/mo, Full Service $210/mo, One-Time Deep Clean $249), Home Cleaning ($99+), 
Landscaping (one-time mow from $49, recurring from $99/mo), Handyman ($75/hr+), 
Moving Labor ($80+), Carpet Cleaning (from $50/room, $100 minimum), Light Demolition ($199+), 
AI Home Scan ($99 standard / $249 aerial).

Your job: collect service type, address, preferred time, and any special needs.
Be warm, concise, and conversational. Ask one question at a time.
If urgent or complex, say "Let me connect you with a specialist."

Output JSON: { "response": "what to say", "intent": "booking|inquiry|escalate", 
"collectedData": { serviceType?, address?, preferredTime?, notes? }, 
"readyToBook": boolean }`;

export function createVoiceBookingRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/voice/inbound - Webhook for incoming calls
  const inboundSchema = z.object({
    callerPhone: z.string(),
    transcriptText: z.string().optional(),
    callDirection: z.enum(["inbound", "outbound"]).default("inbound"),
  });

  router.post("/voice/inbound", async (req, res) => {
    try {
      const validated = inboundSchema.parse(req.body);

      // Look up user by phone (search through users — future: add phone index)
      // TODO: add getUserByPhone to storage
      const user = null as ({ id: string } | null);

      const session = await storage.createVoiceBookingSession({
        id: nanoid(),
        callerPhone: validated.callerPhone,
        userId: user?.id ?? null,
        propertyId: null,
        callDirection: validated.callDirection,
        callDurationSeconds: null,
        callStartedAt: new Date().toISOString(),
        callEndedAt: null,
        transcriptUrl: null,
        transcriptText: validated.transcriptText || null,
        detectedLanguage: "en",
        detectedIntent: null,
        detectedService: null,
        sttProvider: "openai_whisper",
        ttsProvider: "elevenlabs",
        aiModelUsed: "claude-sonnet-4-20250514",
        status: "in_progress",
        outcome: null,
        serviceRequestId: null,
        quotedPrice: null,
        scheduledDate: null,
        escalatedToHuman: false,
        escalationReason: null,
        humanAgentId: null,
        customerSatisfaction: null,
        sttCostCents: null,
        ttsCostCents: null,
        aiCostCents: null,
        telephonyCostCents: null,
        totalCostCents: null,
        createdAt: new Date().toISOString(),
      });

      // Generate initial greeting
      let aiResponse;
      try {
        const result = await createChatCompletion({
          messages: [{ role: "user", content: validated.transcriptText || "Hello" }],
          systemPrompt: VOICE_SYSTEM_PROMPT,
          maxTokens: 256,
          temperature: 0.7,
        });
        aiResponse = result.content;
      } catch {
        aiResponse = JSON.stringify({
          response: "Hi! Thanks for calling UpTend. I can help you book a home service today. What do you need help with?",
          intent: "greeting",
          readyToBook: false,
        });
      }

      res.json({
        success: true,
        sessionId: session.id,
        aiResponse,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/ai/voice/sessions/:id/message - Continue conversation
  const messageSchema = z.object({
    transcriptText: z.string(),
  });

  router.post("/voice/sessions/:id/message", async (req, res) => {
    try {
      const validated = messageSchema.parse(req.body);
      const session = await storage.getVoiceBookingSession(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      // Append to transcript
      const existingTranscript = session.transcriptText || "";
      const updatedTranscript = existingTranscript + `\nCaller: ${validated.transcriptText}`;

      let aiResponse;
      try {
        const result = await createChatCompletion({
          messages: [{ role: "user", content: updatedTranscript }],
          systemPrompt: VOICE_SYSTEM_PROMPT,
          maxTokens: 256,
          temperature: 0.7,
        });
        aiResponse = result.content;
      } catch {
        aiResponse = JSON.stringify({
          response: "I'm sorry, I'm having trouble. Let me connect you with a team member.",
          intent: "escalate",
          readyToBook: false,
        });
      }

      await storage.updateVoiceBookingSession(session.id, {
        transcriptText: updatedTranscript + `\nAgent: ${aiResponse}`,
      });

      res.json({ success: true, aiResponse });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/ai/voice/sessions
  router.get("/voice/sessions", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const sessions = await storage.getVoiceBookingSessionsByUser(userId);
      res.json({ success: true, sessions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/voice/sessions/:id/escalate
  router.post("/voice/sessions/:id/escalate", async (req, res) => {
    try {
      const session = await storage.getVoiceBookingSession(req.params.id);
      if (!session) return res.status(404).json({ error: "Session not found" });

      await storage.updateVoiceBookingSession(session.id, {
        status: "escalated_to_human",
        escalatedToHuman: true,
        escalationReason: req.body.reason || "Customer requested human agent",
      });

      res.json({ success: true, message: "Escalated to human agent" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export default createVoiceBookingRoutes;
