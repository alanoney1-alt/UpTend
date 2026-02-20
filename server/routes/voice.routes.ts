/**
 * Voice AI Routes - George (Twilio Integration)
 *
 * Endpoints:
 * - POST /api/voice/incoming  — handles incoming call, greets with Mr. George's voice
 * - POST /api/voice/process   — receives speech transcription, generates AI response
 * - POST /api/voice/status    — call status callback
 */

import { Router, type Express } from "express";
import { VoiceResponse, GEORGE_GREETING, BUD_FALLBACK, BUD_GOODBYE, sendAppLink } from "../services/voice-service";
import { generateConciergeResponse } from "../services/ai/concierge-service";

export function registerVoiceRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // POST /api/voice/incoming
  // Twilio webhook for incoming calls
  // ==========================================
  router.post("/incoming", async (req, res) => {
    try {
      const twiml = new VoiceResponse();

      // Greet the caller with Mr. George's voice
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
  // Sends to AI concierge, responds with TwiML <Say>
  // ==========================================
  router.post("/process", async (req, res) => {
    try {
      const speechResult = req.body.SpeechResult || "";
      const callerNumber = req.body.From || "";
      const confidence = parseFloat(req.body.Confidence || "0");

      console.log(`[Voice] Caller: ${callerNumber}, Speech: "${speechResult}", Confidence: ${confidence}`);

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

      // Send speech to AI concierge
      const aiResult = await generateConciergeResponse({
        userMessage: speechResult,
        conversationHistory: [],
        context: {
          conversationType: "booking",
          userId: "voice-caller",
          userName: undefined,
          userLocation: "Orlando",
        },
      });

      let aiResponse = aiResult.response;

      // Keep response concise for voice (truncate at ~300 chars if needed)
      if (aiResponse.length > 400) {
        const sentences = aiResponse.split(/[.!?]+/).filter(Boolean);
        aiResponse = sentences.slice(0, 3).join(". ") + ".";
      }

      // Check if AI couldn't handle it — offer to text
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
      res.sendStatus(200);
    } catch (error: any) {
      console.error("Voice status error:", error);
      res.sendStatus(200);
    }
  });

  app.use("/api/voice", router);
}
