/**
 * Chatbot API Routes
 *
 * Web-based chat assistant for customer inquiries, AI quotes, and booking guidance
 */

import type { Express } from "express";
import rateLimit from "express-rate-limit";
import { storage } from "../../storage";
import { generateChatResponse, type ChatMessage, type AIAnalysisResult } from "../../services/ai-assistant";
import { analyzePhotosForQuote } from "../../services/ai-analysis";

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // 60 messages per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many chat requests, please try again later" },
});

/**
 * Register chatbot routes
 */
export function registerChatbotRoutes(app: Express): void {
  /**
   * POST /api/chatbot/message
   *
   * Process chat message and return AI response
   *
   * Body:
   * - message: string (user's message)
   * - context?: { history: Array<{ role: string, content: string }> }
   * - photoUrls?: string[] (optional photo uploads for AI analysis)
   * - serviceType?: string (if photo analysis is requested)
   */
  app.post("/api/chatbot/message", chatLimiter, async (req, res) => {
    try {
      const { message, context, photoUrls, serviceType } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Build conversation history
      const history: ChatMessage[] = [];
      if (context?.history && Array.isArray(context.history)) {
        for (const msg of context.history) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            history.push({
              role: msg.role,
              content: msg.content,
            });
          }
        }
      }

      // If photos are provided, analyze them first
      let aiAnalysisResult: AIAnalysisResult | undefined;
      if (photoUrls && Array.isArray(photoUrls) && photoUrls.length > 0) {
        try {
          const analysisResult = await analyzePhotosForQuote(
            photoUrls,
            serviceType || 'junk_removal'
          );

          aiAnalysisResult = {
            identifiedItems: analysisResult.identifiedItems,
            estimatedVolumeCubicFt: analysisResult.estimatedVolumeCubicFt,
            recommendedLoadSize: analysisResult.recommendedLoadSize,
            suggestedPrice: analysisResult.suggestedPrice || 0,
            suggestedPriceMin: analysisResult.suggestedPriceMin || 0,
            suggestedPriceMax: analysisResult.suggestedPriceMax || 0,
            confidence: analysisResult.confidence,
            reasoning: analysisResult.reasoning,
          };
        } catch (error: any) {
          console.error("Photo analysis error in chatbot:", error);
          // Continue without analysis result - bot will explain the error
        }
      }

      // Generate AI response
      const reply = await generateChatResponse(message, history, aiAnalysisResult);

      // Store conversation for analytics (optional - implement storage if needed)
      // await storage.createChatConversationMessage(...)

      return res.status(200).json({
        reply,
        role: 'assistant',
        aiAnalysis: aiAnalysisResult,
      });
    } catch (error: any) {
      console.error("Chatbot error:", error);
      return res.status(500).json({
        error: "Failed to process message",
        message: error.message,
      });
    }
  });

  /**
   * POST /api/chatbot/callback-request
   *
   * User requests a callback from UpTend team
   *
   * Body:
   * - name: string
   * - phone: string
   * - message?: string (optional context)
   */
  app.post("/api/chatbot/callback-request", async (req, res) => {
    try {
      const { name, phone, message } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: "Name and phone are required" });
      }

      // TODO: Store callback request in database
      // TODO: Send notification to admin/sales team

      // For now, log it
      console.log("CALLBACK REQUEST:", { name, phone, message });

      // Send admin notification (if configured)
      // await sendAdminNotification({ name, phone, message });

      return res.status(200).json({
        success: true,
        message: "Callback request received. We'll contact you within 15 minutes!",
      });
    } catch (error: any) {
      console.error("Callback request error:", error);
      return res.status(500).json({
        error: "Failed to process callback request",
        message: error.message,
      });
    }
  });
}
