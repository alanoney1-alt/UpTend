/**
 * SMS Bot API Routes
 *
 * Twilio webhook endpoint for SMS-based AI assistant
 * Handles inbound SMS, MMS photos, AI quotes, and conversation management
 */

import type { Express } from "express";
import twilio from "twilio";
import { storage } from "../../storage";
import { generateSmsResponse, type ChatMessage, type AIAnalysisResult } from "../../services/ai-assistant";
import { analyzePhotosForQuote } from "../../services/ai-analysis";
import { sendSms } from "../../services/notifications";

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const RATE_LIMIT_PER_HOUR = 20; // Max 20 messages per hour per phone number

/**
 * Register SMS bot routes
 */
export function registerSmsBotRoutes(app: Express): void {
  /**
   * POST /api/sms/incoming
   *
   * Twilio webhook for incoming SMS messages
   *
   * Twilio sends POST requests with:
   * - From: phone number (E.164 format)
   * - Body: message text
   * - NumMedia: number of media attachments
   * - MediaUrl0, MediaUrl1, etc: URLs of media files
   * - MediaContentType0, etc: MIME types
   */
  app.post("/api/sms/incoming", async (req, res) => {
    try {
      const {
        From: phoneNumber,
        Body: messageBody,
        NumMedia: numMediaStr,
        MessageSid: twilioMessageSid,
      } = req.body;

      if (!phoneNumber) {
        return res.status(400).send("<Response><Message>Error: No phone number</Message></Response>");
      }

      // Validate Twilio signature (security)
      const twilioSignature = req.headers['x-twilio-signature'];
      if (TWILIO_AUTH_TOKEN && twilioSignature) {
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        const isValid = twilio.validateRequest(
          TWILIO_AUTH_TOKEN,
          twilioSignature as string,
          url,
          req.body
        );

        if (!isValid) {
          console.error("Invalid Twilio signature");
          return res.status(403).send("<Response><Message>Forbidden</Message></Response>");
        }
      }

      const numMedia = parseInt(numMediaStr || "0", 10);
      const mediaUrls: string[] = [];
      const mediaContentTypes: string[] = [];

      // Collect media attachments
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const contentType = req.body[`MediaContentType${i}`];
        if (mediaUrl) {
          mediaUrls.push(mediaUrl);
          mediaContentTypes.push(contentType || "image/jpeg");
        }
      }

      // Handle STOP/UNSUBSCRIBE keywords (TCPA compliance)
      const normalizedBody = (messageBody || "").trim().toUpperCase();
      if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(normalizedBody)) {
        // Mark conversation as opted out
        const conversation = await storage.getOrCreateSmsConversation(phoneNumber);
        await storage.updateSmsConversation(conversation.id, {
          optedOut: true,
          optedOutAt: new Date().toISOString(),
          optOutReason: normalizedBody,
          isActive: false,
        });

        // Log opt-out message
        await storage.createSmsMessage({
          conversationId: conversation.id,
          direction: "inbound",
          messageBody,
          twilioMessageSid,
          sentAt: new Date().toISOString(),
        });

        // Twilio automatically handles STOP replies, but we acknowledge
        return res.status(200).send("<Response/>");
      }

      // Handle START keyword (re-subscribe)
      if (["START", "UNSTOP", "SUBSCRIBE", "YES"].includes(normalizedBody)) {
        const conversation = await storage.getOrCreateSmsConversation(phoneNumber);
        await storage.updateSmsConversation(conversation.id, {
          optedOut: false,
          optedOutAt: null,
          isActive: true,
        });

        await storage.createSmsMessage({
          conversationId: conversation.id,
          direction: "inbound",
          messageBody,
          twilioMessageSid,
          sentAt: new Date().toISOString(),
        });

        const welcomeMessage = "Welcome back to UpTend! How can I help you today? Reply HELP for options or send photos of items to remove for instant quotes.";
        await sendSms({ to: phoneNumber, message: welcomeMessage });

        return res.status(200).send("<Response/>");
      }

      // Handle HELP keyword
      if (normalizedBody === "HELP") {
        const helpMessage = "UpTend AI Assistant:\n• Send photos → get instant quotes\n• Ask about pricing, services, or booking\n• Reply STOP to unsubscribe\n\nCall: (407) 338-3342";
        await sendSms({ to: phoneNumber, message: helpMessage });
        return res.status(200).send("<Response/>");
      }

      // Get or create conversation
      const conversation = await storage.getOrCreateSmsConversation(phoneNumber);

      // Check if opted out
      if (conversation.optedOut) {
        // Don't respond to opted-out users
        return res.status(200).send("<Response/>");
      }

      // Rate limiting check
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const lastHourReset = conversation.lastHourResetAt ? new Date(conversation.lastHourResetAt) : new Date(0);

      let messagesLastHour = conversation.messagesLastHour || 0;
      if (lastHourReset < hourAgo) {
        // Reset counter
        messagesLastHour = 1;
        await storage.updateSmsConversation(conversation.id, {
          messagesLastHour: 1,
          lastHourResetAt: now.toISOString(),
          isRateLimited: false,
          rateLimitedUntil: null,
        });
      } else {
        messagesLastHour += 1;
        await storage.updateSmsConversation(conversation.id, {
          messagesLastHour,
        });

        if (messagesLastHour > RATE_LIMIT_PER_HOUR) {
          // Rate limited
          await storage.updateSmsConversation(conversation.id, {
            isRateLimited: true,
            rateLimitedUntil: new Date(lastHourReset.getTime() + 60 * 60 * 1000).toISOString(),
          });

          const rateLimitMessage = "You've reached the 20 messages/hour limit. Please try again in an hour or call (407) 338-3342 for immediate help.";
          await sendSms({ to: phoneNumber, message: rateLimitMessage });
          return res.status(200).send("<Response/>");
        }
      }

      // Save inbound message
      const inboundMessage = await storage.createSmsMessage({
        conversationId: conversation.id,
        direction: "inbound",
        messageBody: messageBody || "",
        twilioMessageSid,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
        mediaContentTypes: mediaContentTypes.length > 0 ? mediaContentTypes : null,
        sentAt: new Date().toISOString(),
      });

      // Build conversation history (last 10 messages)
      const recentMessages = await storage.getSmsMessagesByConversation(conversation.id, 10);
      const history: ChatMessage[] = recentMessages
        .slice(0, -1) // Exclude current message
        .reverse() // Oldest first
        .map((msg) => ({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.messageBody,
        }));

      // If photos are provided, analyze them
      let aiAnalysisResult: AIAnalysisResult | undefined;
      if (mediaUrls.length > 0) {
        try {
          // Download and analyze photos
          const analysisResult = await analyzePhotosForQuote(
            mediaUrls,
            'junk_removal' // Default to junk removal for SMS
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

          // Update message with AI analysis
          await storage.updateSmsMessage(inboundMessage.id, {
            aiAnalysisResult: aiAnalysisResult as any,
            quoteGenerated: true,
            quotedPrice: aiAnalysisResult?.suggestedPrice || 0,
          });
        } catch (error: any) {
          console.error("Photo analysis error in SMS bot:", error);
          // Continue without analysis - bot will explain error
        }
      }

      // Generate AI response
      const reply = await generateSmsResponse(
        messageBody || "[Photo received]",
        history,
        aiAnalysisResult
      );

      // Update conversation
      await storage.updateSmsConversation(conversation.id, {
        lastMessageAt: new Date().toISOString(),
        messageCount: (conversation.messageCount || 0) + 1,
      });

      // Save outbound message
      await storage.createSmsMessage({
        conversationId: conversation.id,
        direction: "outbound",
        messageBody: reply,
        sentAt: new Date().toISOString(),
      });

      // Send SMS response via Twilio
      await sendSms({ to: phoneNumber, message: reply });

      // Return TwiML response (empty, since we're using sendSms above)
      return res.status(200).send("<Response/>");
    } catch (error: any) {
      console.error("SMS bot error:", error);
      return res.status(500).send("<Response><Message>Sorry, error processing your message. Call (407) 338-3342 for help.</Message></Response>");
    }
  });

  /**
   * POST /api/sms/status
   *
   * Twilio status callback (delivery receipts)
   */
  app.post("/api/sms/status", async (req, res) => {
    try {
      const { MessageSid, MessageStatus } = req.body;

      if (!MessageSid || !MessageStatus) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Update message delivery status
      await storage.updateSmsMessageByTwilioSid(MessageSid, {
        deliveryStatus: MessageStatus,
        deliveredAt: MessageStatus === 'delivered' ? new Date().toISOString() : null,
      });

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("SMS status callback error:", error);
      return res.status(500).json({ error: "Failed to process status update" });
    }
  });
}
