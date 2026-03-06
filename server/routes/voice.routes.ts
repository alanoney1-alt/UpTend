/**
 * Voice AI Routes - George (Twilio Integration)
 *
 * Endpoints:
 * - POST /api/voice/incoming  - handles incoming call, greets with George's voice
 * - POST /api/voice/process   - receives speech transcription, generates AI response
 * - POST /api/voice/status    - call status callback
 */

import { Router, type Express } from "express";
import { VoiceResponse, GEORGE_GREETING, BUD_FALLBACK, BUD_GOODBYE, sendAppLink } from "../services/voice-service";
import { georgeVoiceChat, parseBookingSignal } from "../services/george-voice";
import { storage } from "../storage";

// Per-call conversation state tracking
interface ConversationState {
  callerPhone: string;
  callerName?: string;
  serviceType?: string; // mapped to database key like "junk_removal"
  address?: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  readyToBook: boolean;
}

// Map of CallSid -> ConversationState
const conversationStates = new Map<string, ConversationState>();

export function registerVoiceRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // POST /api/voice/incoming
  // Twilio webhook for incoming calls
  // ==========================================
  router.post("/incoming", async (req, res) => {
    try {
      const twiml = new VoiceResponse();

      // Greet the caller with George's voice
      const gather = twiml.gather({
        input: ["speech"],
        action: "/api/voice/process",
        method: "POST",
        speechTimeout: "auto",
        language: "en-US",
        hints: "book, booking, schedule, price, quote, lawn, cleaning, junk removal, pressure washing, gutter, pool, handyman, moving, carpet, demolition",
      });

      gather.say(
        { voice: "Polly.Matthew", language: "en-US" },
        GEORGE_GREETING
      );

      // If no speech input, repeat
      twiml.say(
        { voice: "Polly.Matthew" },
        "I didn't catch that. Let me know how I can help with your home!"
      );
      twiml.redirect("/api/voice/incoming");

      res.type("text/xml");
      res.send(twiml.toString());
    } catch (error: any) {
      console.error("Voice incoming error:", error);
      const twiml = new VoiceResponse();
      twiml.say("Sorry, we're experiencing technical difficulties. Please try again later.");
      twiml.hangup();
      res.type("text/xml");
      res.send(twiml.toString());
    }
  });

  // ==========================================
  // POST /api/voice/process
  // Receives speech transcription from Twilio <Gather>
  // Sends to George Voice AI, responds with TwiML <Say>
  // ==========================================
  router.post("/process", async (req, res) => {
    try {
      const speechResult = req.body.SpeechResult || "";
      const callerNumber = req.body.From || "";
      const callSid = req.body.CallSid || "";
      const confidence = parseFloat(req.body.Confidence || "0");

      console.log(`[Voice] CallSid: ${callSid}, Caller: ${callerNumber}, Speech: "${speechResult}", Confidence: ${confidence}`);

      if (!speechResult || confidence < 0.3) {
        const twiml = new VoiceResponse();
        const gather = twiml.gather({
          input: ["speech"],
          action: "/api/voice/process",
          method: "POST",
          speechTimeout: "auto",
          language: "en-US",
        });
        gather.say(
          { voice: "Polly.Matthew" },
          "Sorry, I didn't quite get that. Could you say that again?"
        );
        twiml.redirect("/api/voice/incoming");
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      // Get or create conversation state for this call
      let state = conversationStates.get(callSid);
      if (!state) {
        state = {
          callerPhone: callerNumber,
          conversationHistory: [],
          readyToBook: false,
        };
        conversationStates.set(callSid, state);
      }

      // Check if caller wants a text/link
      const wantsText = /text|sms|link|app|send me/i.test(speechResult);
      if (wantsText) {
        try {
          await sendAppLink(callerNumber);
          const twiml = new VoiceResponse();
          twiml.say(
            { voice: "Polly.Matthew" },
            "Done! I just sent you a text with a link to the UpTend app. You can book services, get quotes, and manage everything from there."
          );
          twiml.pause({ length: 1 });
          twiml.say({ voice: "Polly.Matthew" }, BUD_GOODBYE);
          twiml.hangup();
          res.type("text/xml");
          return res.send(twiml.toString());
        } catch {
          // Fall through to AI response if SMS fails
        }
      }

      // Check for goodbye/end call
      const wantsEnd = /\b(bye|goodbye|hang up|that's all|nothing|no thanks|done)\b/i.test(speechResult);
      if (wantsEnd) {
        const twiml = new VoiceResponse();
        twiml.say({ voice: "Polly.Matthew" }, BUD_GOODBYE);
        twiml.hangup();
        res.type("text/xml");
        return res.send(twiml.toString());
      }

      // Add user message to conversation history
      state.conversationHistory.push({ role: 'user', content: speechResult });

      // Send to George Voice Chat with full conversation context
      const partnerContext = `The caller's phone number is ${callerNumber}. This is in Orlando, FL.`;
      const aiResult = await georgeVoiceChat(speechResult, state.conversationHistory, partnerContext);

      let aiResponse = aiResult.response;

      // Parse for booking signals
      const bookingSignal = parseBookingSignal(aiResponse);
      if (bookingSignal) {
        const { serviceType, address, name } = bookingSignal;

        // Create the service request
        try {
          // Calculate a basic quote for the service
          const quote = await storage.calculateQuote({
            serviceType: serviceType as any,
            loadSize: "medium" as any,
            pickupLat: 28.5383, // Orlando default coords
            pickupLng: -81.3792,
          });

          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(9, 0, 0, 0);

          // Create service request
          const request = await storage.createServiceRequest({
            customerId: `voice-${Date.now()}`, // Temporary ID for voice bookings
            serviceType,
            status: "matching",
            pickupAddress: address,
            pickupCity: "Orlando",
            pickupZip: "32801",
            pickupLat: 28.5383,
            pickupLng: -81.3792,
            loadEstimate: "medium",
            description: `Voice booking from ${name || "customer"} at ${callerNumber}`,
            scheduledFor: tomorrow.toISOString(),
            priceEstimate: quote.totalPrice,
            livePrice: quote.totalPrice,
            surgeFactor: quote.surgeMultiplier,
            customerPhone: callerNumber,
            customerEmail: null,
            bookingSource: "voice",
            matchingStartedAt: new Date().toISOString(),
            matchingExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            needsManualMatch: false,
            createdAt: new Date().toISOString(),
          });

          console.log(`[Voice] Created service request ${request.id} for ${callerNumber}`);

          // Remove booking signal from AI response
          aiResponse = aiResponse.replace(/\[BOOK:.*?\]/, '').trim();

        } catch (error: any) {
          console.error("[Voice] Failed to create service request:", error);
          aiResponse = "I had trouble creating your booking. Let me send you a text with a link to book online instead.";

          try {
            await sendAppLink(callerNumber);
          } catch (smsError) {
            console.error("[Voice] SMS fallback failed:", smsError);
          }
        }
      }

      // Add AI response to conversation history
      state.conversationHistory.push({ role: 'assistant', content: aiResponse });

      // Keep response concise for voice (truncate at ~300 chars if needed)
      if (aiResponse.length > 400) {
        const sentences = aiResponse.split(/[.!?]+/).filter(Boolean);
        aiResponse = sentences.slice(0, 3).join(". ") + ".";
      }

      // Check if AI couldn't handle it - offer to text
      const cantHandle = /I('m| am) (not able|unable)|I can't|beyond my|I don't have access/i.test(aiResponse);

      const twiml = new VoiceResponse();

      if (cantHandle) {
        const gather = twiml.gather({
          input: ["speech"],
          action: "/api/voice/process",
          method: "POST",
          speechTimeout: "auto",
          language: "en-US",
        });
        gather.say({ voice: "Polly.Matthew" }, BUD_FALLBACK);
      } else {
        // Respond with AI answer and gather next input
        const gather = twiml.gather({
          input: ["speech"],
          action: "/api/voice/process",
          method: "POST",
          speechTimeout: "auto",
          language: "en-US",
        });
        gather.say({ voice: "Polly.Matthew" }, aiResponse);
        gather.pause({ length: 1 });
        gather.say({ voice: "Polly.Matthew" }, "Anything else I can help with?");
      }

      // If no response, say goodbye
      twiml.say({ voice: "Polly.Matthew" }, BUD_GOODBYE);
      twiml.hangup();

      res.type("text/xml");
      res.send(twiml.toString());
    } catch (error: any) {
      console.error("Voice process error:", error);
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: "Polly.Matthew" },
        "Sorry, I ran into an issue. Let me transfer you or you can call back in a moment."
      );
      twiml.hangup();
      res.type("text/xml");
      res.send(twiml.toString());
    }
  });

  // ==========================================
  // POST /api/voice/status
  // Call status callback from Twilio
  // ==========================================
  router.post("/status", async (req, res) => {
    try {
      const { CallSid, CallStatus, CallDuration, From, To } = req.body;
      console.log(`[Voice Status] SID: ${CallSid}, Status: ${CallStatus}, Duration: ${CallDuration}s, From: ${From}, To: ${To}`);

      // Clean up conversation state when call ends
      if (CallStatus === "completed" || CallStatus === "failed" || CallStatus === "canceled") {
        conversationStates.delete(CallSid);
        console.log(`[Voice] Cleaned up conversation state for ${CallSid}`);
      }

      res.sendStatus(200);
    } catch (error: any) {
      console.error("Voice status error:", error);
      res.sendStatus(200);
    }
  });

  app.use("/api/voice", router);
}
