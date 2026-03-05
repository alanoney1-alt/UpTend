/**
 * Partner Voice Routes
 * 
 * Handles Twilio webhooks and partner phone management for George AI voice calls.
 * Each partner gets their own phone number with custom greeting.
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { pool } from "../db";
import { requireFeature } from "../services/tier-gates";
import {
  handleIncomingCall,
  processVoiceInput,
  handleCallStatus,
  getPartnerCallStats,
  getPartnerRecentCalls
} from "../services/partner-voice";
import twilio from 'twilio';
import { nanoid } from 'nanoid';

const router = Router();

// Rate limiting for Twilio webhooks (higher limits)
const twilioWebhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute (Twilio can send many webhooks per call)
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: "Too many webhook requests" },
});

// Rate limiting for partner management
const partnerManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ═══════════════════════════════════════════════════════════════════════════════
// TWILIO WEBHOOKS (for incoming calls and status updates)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle incoming calls - Twilio webhook
 */
router.post("/voice/partner/incoming", twilioWebhookLimiter, async (req, res) => {
  try {
    const {
      CallSid: callSid,
      From: callerNumber,
      To: calledNumber,
      CallStatus: callStatus
    } = req.body;

    if (!callSid || !callerNumber || !calledNumber) {
      return res.status(400).type('text/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid request</Say><Hangup/></Response>'
      );
    }

    console.log(`[Partner Voice] Incoming call: ${callSid} from ${callerNumber} to ${calledNumber}`);

    // Generate TwiML response
    const twiml = await handleIncomingCall(callSid, callerNumber, calledNumber);
    
    res.type('text/xml').send(twiml);
  } catch (error: any) {
    console.error('[Partner Voice] Error in incoming webhook:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, we're having technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;
    
    res.type('text/xml').send(errorTwiml);
  }
});

/**
 * Process speech input - Twilio webhook
 */
router.post("/voice/partner/process", twilioWebhookLimiter, async (req, res) => {
  try {
    const {
      CallSid: callSid,
      SpeechResult: speechResult,
      Confidence: confidenceStr,
      Digits: digits
    } = req.body;

    // If caller pressed keypad digits, treat them as speech input
    // e.g., they typed their phone number or address number
    const finalSpeechResult = speechResult || (digits ? `Pressed digits: ${digits}` : undefined);

    if (!callSid) {
      return res.status(400).type('text/xml').send(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid request</Say><Hangup/></Response>'
      );
    }

    const confidence = confidenceStr ? parseFloat(confidenceStr) : undefined;

    console.log(`[Partner Voice] Processing input for call ${callSid}: speech="${speechResult}" digits="${digits}" (confidence: ${confidence})`);

    // Generate TwiML response with George's reply
    const twiml = await processVoiceInput(callSid, finalSpeechResult, confidence);
    
    res.type('text/xml').send(twiml);
  } catch (error: any) {
    console.error('[Partner Voice] Error in process webhook:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" timeout="5" speechTimeout="2">
    <Say>I'm having trouble processing that. Could you try again?</Say>
  </Gather>
  <Say>Sorry, we're experiencing technical difficulties. Goodbye.</Say>
  <Hangup/>
</Response>`;
    
    res.type('text/xml').send(errorTwiml);
  }
});

/**
 * Handle call status updates - Twilio webhook
 */
router.post("/voice/partner/status", twilioWebhookLimiter, async (req, res) => {
  try {
    const {
      CallSid: callSid,
      CallStatus: callStatus,
      CallDuration: callDurationStr
    } = req.body;

    if (!callSid || !callStatus) {
      return res.sendStatus(400);
    }

    const callDuration = callDurationStr ? parseInt(callDurationStr) : undefined;

    console.log(`[Partner Voice] Call status update: ${callSid} = ${callStatus} (duration: ${callDuration}s)`);

    await handleCallStatus(callSid, callStatus, callDuration);
    
    res.sendStatus(200);
  } catch (error: any) {
    console.error('[Partner Voice] Error in status webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * Handle recording webhook - Twilio callback for call recordings
 */
router.post("/voice/partner/recording", twilioWebhookLimiter, async (req, res) => {
  try {
    const {
      CallSid: callSid,
      RecordingUrl: recordingUrl,
      RecordingDuration: durationStr
    } = req.body;

    if (!callSid || !recordingUrl) {
      return res.sendStatus(400);
    }

    console.log(`[Partner Voice] Recording ready for call ${callSid}: ${recordingUrl}`);

    // Update call log with recording URL
    await pool.query(
      `UPDATE voice_call_logs 
       SET recording_url = $1, updated_at = NOW() 
       WHERE call_sid = $2`,
      [recordingUrl, callSid]
    );
    
    res.sendStatus(200);
  } catch (error: any) {
    console.error('[Partner Voice] Error in recording webhook:', error);
    res.sendStatus(500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTNER MANAGEMENT (for dashboard and admin functions)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get partner's phone number and call stats
 */
router.get("/partners/:slug/phone", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get partner's phone number
    const phoneResult = await pool.query(
      `SELECT 
        twilio_phone_number, 
        twilio_phone_sid, 
        greeting, 
        active, 
        created_at
       FROM partner_phone_numbers 
       WHERE partner_slug = $1`,
      [slug]
    );

    const phoneData = phoneResult.rows[0] || null;

    // Get call statistics
    const stats = await getPartnerCallStats(slug, 30);
    const recentCalls = await getPartnerRecentCalls(slug, 5);

    res.json({
      phoneNumber: phoneData,
      stats,
      recentCalls
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error getting partner phone:', error);
    res.status(500).json({ error: "Failed to get partner phone information" });
  }
});

/**
 * Provision a new Twilio phone number for a partner
 */
router.post("/partners/:slug/phone/provision", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    const { slug } = req.params;
    const { areaCode, greeting } = req.body;

    // Check if partner already has a phone number
    const existingResult = await pool.query(
      `SELECT twilio_phone_number FROM partner_phone_numbers WHERE partner_slug = $1`,
      [slug]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        error: "Partner already has a phone number",
        existingNumber: existingResult.rows[0].twilio_phone_number
      });
    }

    // Purchase a phone number from Twilio
    console.log(`[Partner Voice] Provisioning number for partner: ${slug}`);
    
    const availableNumbers = await twilioClient.availablePhoneNumbers('US')
      .local
      .list({
        areaCode: areaCode || '407', // Default to Orlando area code
        voiceEnabled: true,
        limit: 5
      });

    if (availableNumbers.length === 0) {
      return res.status(400).json({ 
        error: "No phone numbers available in the requested area code" 
      });
    }

    const selectedNumber = availableNumbers[0];
    
    // Purchase the phone number
    const purchasedNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: selectedNumber.phoneNumber,
      voiceUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/incoming`,
      voiceMethod: 'POST',
      statusCallback: `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/status`,
      statusCallbackMethod: 'POST'
    });

    // Store in database
    const defaultGreeting = greeting || `Hey, thanks for calling [Partner Name]. This is George, how can I help you today?`;
    
    await pool.query(
      `INSERT INTO partner_phone_numbers 
       (partner_slug, twilio_phone_number, twilio_phone_sid, greeting, active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())`,
      [slug, purchasedNumber.phoneNumber, purchasedNumber.sid, defaultGreeting]
    );

    console.log(`[Partner Voice] Provisioned number ${purchasedNumber.phoneNumber} for partner ${slug}`);

    res.json({
      success: true,
      phoneNumber: purchasedNumber.phoneNumber,
      phoneSid: purchasedNumber.sid,
      greeting: defaultGreeting
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error provisioning phone number:', error);
    res.status(500).json({ 
      error: "Failed to provision phone number",
      details: error.message
    });
  }
});

/**
 * Update partner's custom greeting
 */
router.put("/partners/:slug/phone/greeting", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    const { slug } = req.params;
    const { greeting } = req.body;

    if (!greeting || typeof greeting !== 'string' || greeting.trim().length === 0) {
      return res.status(400).json({ error: "Greeting is required" });
    }

    if (greeting.length > 500) {
      return res.status(400).json({ error: "Greeting must be less than 500 characters" });
    }

    // Update greeting in database
    const result = await pool.query(
      `UPDATE partner_phone_numbers 
       SET greeting = $1, updated_at = NOW()
       WHERE partner_slug = $2
       RETURNING twilio_phone_number`,
      [greeting.trim(), slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Partner phone number not found" });
    }

    console.log(`[Partner Voice] Updated greeting for partner ${slug}`);

    res.json({
      success: true,
      greeting: greeting.trim(),
      phoneNumber: result.rows[0].twilio_phone_number
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error updating greeting:', error);
    res.status(500).json({ error: "Failed to update greeting" });
  }
});

/**
 * Get call history with transcripts for a partner
 */
router.get("/partners/:slug/phone/calls", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get call history
    const callsResult = await pool.query(
      `SELECT 
        call_sid,
        caller_number,
        status,
        duration_seconds,
        lead_created,
        job_created,
        recording_url,
        created_at
       FROM voice_call_logs 
       WHERE partner_slug = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [slug, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get conversation turns for each call
    const callsWithTranscripts = await Promise.all(
      callsResult.rows.map(async (call) => {
        const transcriptResult = await pool.query(
          `SELECT role, content, created_at 
           FROM voice_conversation_turns 
           WHERE call_sid = $1 
           ORDER BY turn_number ASC`,
          [call.call_sid]
        );

        return {
          ...call,
          transcript: transcriptResult.rows,
          transcriptPreview: transcriptResult.rows
            .map(turn => `${turn.role}: ${turn.content}`)
            .join(' | ')
            .substring(0, 200)
        };
      })
    );

    res.json({
      calls: callsWithTranscripts,
      hasMore: callsResult.rows.length === parseInt(limit as string)
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error getting call history:', error);
    res.status(500).json({ error: "Failed to get call history" });
  }
});

/**
 * Get detailed call information and full transcript
 */
router.get("/partners/:slug/phone/calls/:callSid", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    const { slug, callSid } = req.params;

    // Get call information
    const callResult = await pool.query(
      `SELECT 
        call_sid,
        partner_slug,
        caller_number,
        called_number,
        status,
        duration_seconds,
        transcript,
        lead_created,
        lead_id,
        job_created,
        job_id,
        recording_url,
        total_cost,
        created_at,
        updated_at
       FROM voice_call_logs 
       WHERE call_sid = $1 AND partner_slug = $2`,
      [callSid, slug]
    );

    if (callResult.rows.length === 0) {
      return res.status(404).json({ error: "Call not found" });
    }

    // Get full conversation
    const conversationResult = await pool.query(
      `SELECT 
        turn_number,
        role,
        content,
        audio_url,
        created_at
       FROM voice_conversation_turns 
       WHERE call_sid = $1 
       ORDER BY turn_number ASC`,
      [callSid]
    );

    const callData = callResult.rows[0];
    
    res.json({
      call: callData,
      conversation: conversationResult.rows,
      summary: {
        totalTurns: conversationResult.rows.length,
        callerTurns: conversationResult.rows.filter(t => t.role === 'caller').length,
        georgeTurns: conversationResult.rows.filter(t => t.role === 'george').length,
        durationFormatted: callData.duration_seconds 
          ? `${Math.floor(callData.duration_seconds / 60)}:${(callData.duration_seconds % 60).toString().padStart(2, '0')}` 
          : 'Unknown'
      }
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error getting call details:', error);
    res.status(500).json({ error: "Failed to get call details" });
  }
});

/**
 * Test voice system - generate a test call for development
 */
router.post("/partners/:slug/phone/test", partnerManagementLimiter, requireFeature('george_voice' as any), async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Test calls not allowed in production" });
    }

    const { slug } = req.params;
    const { testPhrase = "Hello, I need HVAC repair" } = req.body;

    // Create mock call
    const mockCallSid = `CA_test_${nanoid(10)}`;
    const mockCallerNumber = "+15551234567";
    const mockCalledNumber = "+14075551234";

    console.log(`[Partner Voice] Creating test call for partner: ${slug}`);

    // Simulate incoming call
    const twiml = await handleIncomingCall(mockCallSid, mockCallerNumber, mockCalledNumber);
    
    // Simulate speech input
    const responseTwiml = await processVoiceInput(mockCallSid, testPhrase);

    res.json({
      success: true,
      testCallSid: mockCallSid,
      initialTwiML: twiml,
      responseTwiML: responseTwiml,
      message: "Test call created successfully"
    });
  } catch (error: any) {
    console.error('[Partner Voice] Error creating test call:', error);
    res.status(500).json({ error: "Failed to create test call" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO SERVING (serve generated ElevenLabs audio files)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Serve voice audio files generated by ElevenLabs
 */
router.get("/voice/audio/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check - only allow specific file patterns
    if (!/^[a-zA-Z0-9_-]+\.(wav|mp3|ulaw)$/.test(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    // Try in-memory buffer first (works on Railway's ephemeral filesystem)
    const { getAudioBuffer } = await import("../services/twilio-elevenlabs");
    const memBuffer = getAudioBuffer(filename);
    if (memBuffer) {
      const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : filename.endsWith('.wav') ? 'audio/wav' : 'audio/basic';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(memBuffer);
    }

    // Fallback to filesystem (local dev)
    const filePath = require('path').join(process.cwd(), 'public', 'audio', 'voice', filename);
    if (require('fs').existsSync(filePath)) {
      const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.sendFile(filePath);
    }

    res.status(404).json({ error: "Audio file not found" });
  } catch (error: any) {
    console.error('[Partner Voice] Error serving audio file:', error);
    res.status(500).json({ error: "Failed to serve audio file" });
  }
});

export default router;