/**
 * Partner Voice Service
 * 
 * Integrates George AI agent with Twilio voice calls for HVAC partners.
 * Each partner gets their own phone number with custom greeting.
 * Uses full George agent capabilities for booking, quoting, lead generation.
 */

import { pool } from '../db';
import { chat as georgeChat, type GeorgeContext } from './george-agent';
import { generateVoiceAudio, generateTwiMLWithAudio, generateTwiMLHangup, generateTwiMLGather } from './twilio-elevenlabs';
import { nanoid } from 'nanoid';

export interface PartnerInfo {
  slug: string;
  name: string;
  serviceTypes: string[];
  phoneNumber?: string;
  greeting?: string;
}

export interface CallContext {
  callSid: string;
  partnerSlug: string;
  callerNumber: string;
  calledNumber: string;
  conversationHistory: Array<{ role: 'caller' | 'george'; content: string }>;
}

/**
 * Handle incoming call - start conversation with partner-specific greeting
 */
export async function handleIncomingCall(
  callSid: string,
  callerNumber: string,
  calledNumber: string
): Promise<string> {
  try {
    // Look up partner by phone number
    const partnerResult = await pool.query(
      `SELECT partner_slug, greeting FROM partner_phone_numbers 
       WHERE twilio_phone_number = $1 AND active = true`,
      [calledNumber]
    );

    if (partnerResult.rows.length === 0) {
      console.error(`[Partner Voice] No partner found for number: ${calledNumber}`);
      return generateTwiMLHangup("Sorry, this number is not currently in service.");
    }

    const { partner_slug: partnerSlug, greeting } = partnerResult.rows[0];
    
    // Get partner details
    const partner = await getPartnerInfo(partnerSlug);
    if (!partner) {
      console.error(`[Partner Voice] Partner details not found: ${partnerSlug}`);
      return generateTwiMLHangup("Sorry, we're having technical difficulties.");
    }

    // Create call log
    await pool.query(
      `INSERT INTO voice_call_logs (call_sid, partner_slug, caller_number, called_number, status, created_at)
       VALUES ($1, $2, $3, $4, 'in_progress', NOW())`,
      [callSid, partnerSlug, callerNumber, calledNumber]
    );

    // Generate personalized greeting
    const personalizedGreeting = greeting.replace('[Partner Name]', partner.name);
    
    // Generate audio for greeting
    const audioResult = await generateVoiceAudio(personalizedGreeting);
    
    if (audioResult) {
      // Log George's greeting
      await logConversationTurn(callSid, 1, 'george', personalizedGreeting, audioResult.audioUrl);
      
      // Create TwiML with audio and next action
      const processUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`;
      return generateTwiMLWithAudio(audioResult.audioUrl, processUrl);
    } else {
      // Fallback to text-to-speech if ElevenLabs fails
      return generateTwiMLGather(
        personalizedGreeting,
        `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`
      );
    }
  } catch (error: any) {
    console.error('[Partner Voice] Error handling incoming call:', error);
    return generateTwiMLHangup("Sorry, we're experiencing technical difficulties. Please try again later.");
  }
}

/**
 * Process speech input and generate George's response
 */
export async function processVoiceInput(
  callSid: string,
  speechResult?: string,
  confidence?: number
): Promise<string> {
  try {
    // Get call context
    const callResult = await pool.query(
      `SELECT partner_slug, caller_number, called_number FROM voice_call_logs WHERE call_sid = $1`,
      [callSid]
    );

    if (callResult.rows.length === 0) {
      console.error(`[Partner Voice] Call not found: ${callSid}`);
      return generateTwiMLHangup("Sorry, we couldn't find your call session.");
    }

    const { partner_slug: partnerSlug, caller_number: callerNumber, called_number: calledNumber } = callResult.rows[0];

    // Handle no speech or low confidence
    if (!speechResult || (confidence !== undefined && confidence < 0.7)) {
      const clarificationPrompt = "I'm sorry, I didn't catch that. Could you please repeat what you said?";
      
      const audioResult = await generateVoiceAudio(clarificationPrompt);
      if (audioResult) {
        const processUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`;
        return generateTwiMLWithAudio(audioResult.audioUrl, processUrl);
      } else {
        return generateTwiMLGather(
          clarificationPrompt,
          `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`
        );
      }
    }

    // Get conversation history
    const conversationHistory = await getConversationHistory(callSid);
    
    // Get partner info for context
    const partner = await getPartnerInfo(partnerSlug);
    if (!partner) {
      return generateTwiMLHangup("Sorry, we're having technical difficulties.");
    }

    // Log caller's input
    const turnNumber = conversationHistory.length + 1;
    await logConversationTurn(callSid, turnNumber, 'caller', speechResult);

    // Build George context for partner voice
    const georgeContext: GeorgeContext = {
      userName: undefined, // We don't have caller's name yet
      currentPage: `/partner-voice/${partnerSlug}`,
      userRole: 'consumer', // Caller is a potential customer
      isAuthenticated: false,
      pendingPhotoBase64: undefined,
      conversationState: buildVoiceConversationState(partnerSlug, partner, callerNumber, conversationHistory)
    };

    // Format conversation history for George
    const georgeHistory = conversationHistory.map(turn => ({
      role: turn.role === 'caller' ? 'user' as const : 'assistant' as const,
      content: turn.content
    }));

    // Get George's response
    console.log(`[Partner Voice] Calling George for partner: ${partnerSlug}`);
    const georgeResult = await georgeChat(speechResult, georgeHistory, georgeContext);
    
    // Clean response for voice (George sometimes returns long responses)
    const cleanResponse = cleanResponseForVoice(georgeResult.response);
    
    // Log George's response
    await logConversationTurn(callSid, turnNumber + 1, 'george', cleanResponse);

    // Check if George wants to end the call
    if (shouldEndCall(cleanResponse, georgeResult.buttons)) {
      await updateCallStatus(callSid, 'completed');
      
      const audioResult = await generateVoiceAudio(cleanResponse);
      if (audioResult) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioResult.audioUrl}</Play>
  <Hangup/>
</Response>`;
      } else {
        return generateTwiMLHangup(cleanResponse);
      }
    }

    // Generate audio response and continue conversation
    const audioResult = await generateVoiceAudio(cleanResponse);
    
    if (audioResult) {
      // Update audio URL in conversation log
      await pool.query(
        `UPDATE voice_conversation_turns SET audio_url = $1 WHERE call_sid = $2 AND turn_number = $3`,
        [audioResult.audioUrl, callSid, turnNumber + 1]
      );
      
      const processUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`;
      return generateTwiMLWithAudio(audioResult.audioUrl, processUrl);
    } else {
      // Fallback without audio
      return generateTwiMLGather(
        cleanResponse,
        `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`
      );
    }
  } catch (error: any) {
    console.error('[Partner Voice] Error processing voice input:', error);
    return generateTwiMLGather(
      "I'm having trouble processing that. Could you try again?",
      `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/partner/process?callSid=${callSid}`
    );
  }
}

/**
 * Handle call status updates (completed, failed, etc.)
 */
export async function handleCallStatus(
  callSid: string,
  callStatus: string,
  callDuration?: number,
  recordingUrl?: string
): Promise<void> {
  try {
    await pool.query(
      `UPDATE voice_call_logs 
       SET status = $1, duration_seconds = $2, recording_url = $3, updated_at = NOW()
       WHERE call_sid = $4`,
      [callStatus, callDuration || null, recordingUrl || null, callSid]
    );

    console.log(`[Partner Voice] Call ${callSid} status updated: ${callStatus}`);
    
    // If call completed, analyze conversation for lead/job creation
    if (callStatus === 'completed') {
      await analyzeCompletedCall(callSid);
    }
  } catch (error: any) {
    console.error('[Partner Voice] Error updating call status:', error);
  }
}

/**
 * Get partner information
 */
async function getPartnerInfo(partnerSlug: string): Promise<PartnerInfo | null> {
  try {
    // Query actual partner database
    // For now, we'll use partner_slug as company name until we have proper partner lookup
    // TODO: Replace with actual partner database query when available
    
    // Check if partner has phone number configured (indicates they exist)
    const phoneResult = await pool.query(
      `SELECT partner_slug, greeting FROM partner_phone_numbers WHERE partner_slug = $1 AND active = true`,
      [partnerSlug]
    );

    if (phoneResult.rows.length === 0) {
      return null;
    }

    const { greeting } = phoneResult.rows[0];
    
    // Known partners with proper names
    const KNOWN_PARTNERS: Record<string, { name: string; serviceTypes: string[] }> = {
      'comfort-solutions-tech': { 
        name: 'Comfort Solutions Tech', 
        serviceTypes: ['hvac_repair', 'hvac_install', 'hvac_maintenance'] 
      },
      'uptend-main': { 
        name: 'UpTend', 
        serviceTypes: ['hvac_repair', 'plumbing', 'electrical', 'junk_removal', 'pressure_washing', 'home_cleaning', 'handyman', 'landscaping', 'painting', 'pool_cleaning', 'carpet_cleaning', 'gutter_cleaning', 'moving_labor'] 
      },
    };

    const known = KNOWN_PARTNERS[partnerSlug];
    const partnerName = known?.name || partnerSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      slug: partnerSlug,
      name: partnerName,
      serviceTypes: known?.serviceTypes || ['hvac_repair', 'hvac_install', 'hvac_maintenance'],
      greeting
    };
  } catch (error: any) {
    console.error('[Partner Voice] Error getting partner info:', error);
    return null;
  }
}

/**
 * Get conversation history for a call
 */
async function getConversationHistory(callSid: string): Promise<Array<{ role: 'caller' | 'george'; content: string }>> {
  try {
    const result = await pool.query(
      `SELECT role, content FROM voice_conversation_turns 
       WHERE call_sid = $1 ORDER BY turn_number ASC`,
      [callSid]
    );

    return result.rows;
  } catch (error: any) {
    console.error('[Partner Voice] Error getting conversation history:', error);
    return [];
  }
}

/**
 * Log a conversation turn
 */
async function logConversationTurn(
  callSid: string,
  turnNumber: number,
  role: 'caller' | 'george',
  content: string,
  audioUrl?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO voice_conversation_turns 
       (call_sid, turn_number, role, content, audio_url, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [callSid, turnNumber, role, content, audioUrl || null]
    );
  } catch (error: any) {
    console.error('[Partner Voice] Error logging conversation turn:', error);
  }
}

/**
 * Build conversation state for George
 */
function buildVoiceConversationState(
  partnerSlug: string,
  partner: PartnerInfo,
  callerNumber: string,
  history: Array<{ role: 'caller' | 'george'; content: string }>
): string {
  return `
VOICE CALL CONTEXT - PARTNER: ${partner.name.toUpperCase()}
- Partner: ${partner.name} (${partnerSlug})
- Services: ${partner.serviceTypes.join(', ')}
- Caller: ${callerNumber}
- Call turns: ${history.length}

VOICE OPTIMIZATION RULES:
1. Keep responses short (2-3 sentences max) - people don't like long voice responses
2. ALWAYS end with a clear question - voice conversations need direction
3. Speak naturally - avoid technical jargon, use conversational tone
4. Be patient with speech recognition errors
5. If you create a lead or book a job, mention the confirmation clearly
6. Use partner's name naturally: "I'll get ${partner.name} scheduled for you"

VOICE CONVERSATION FLOW:
- Greeting → Understanding need → Gathering details → Quoting/Scheduling → Confirmation
- Current conversation turns: ${history.length}

PARTNER CONTEXT: This caller reached out to ${partner.name} specifically.
- Assume they need HVAC services (${partner.serviceTypes.join(' or ')})
- You represent ${partner.name} - act as their voice assistant
- You can book appointments, create leads, and quote services for this partner
- Keep ${partner.name}'s brand and reputation in mind

CONVERSATION HISTORY SUMMARY:
${history.length > 0 ? history.map((turn, i) => `${i + 1}. ${turn.role}: ${turn.content.substring(0, 100)}...`).join('\n') : 'First interaction - greet and understand their need'}
`;
}

/**
 * Clean George's response for voice delivery
 */
function cleanResponseForVoice(response: string): string {
  return response
    // Remove buttons and formatting
    .replace(/BUTTONS:\s*\[[\s\S]*?\]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    
    // Limit length for voice
    .split('. ')
    .slice(0, 3) // Max 3 sentences
    .join('. ')
    
    // Ensure it ends with a question or clear direction
    .trim()
    + (response.includes('?') ? '' : ' What would you like to know?');
}

/**
 * Determine if call should end
 */
function shouldEndCall(response: string, buttons: any[]): boolean {
  const endPhrases = [
    'thank you for calling',
    'have a great day',
    'goodbye',
    'talk to you later',
    'is there anything else',
    'that takes care of everything'
  ];
  
  const lowerResponse = response.toLowerCase();
  return endPhrases.some(phrase => lowerResponse.includes(phrase));
}

/**
 * Update call status in database
 */
async function updateCallStatus(callSid: string, status: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE voice_call_logs SET status = $1, updated_at = NOW() WHERE call_sid = $2`,
      [status, callSid]
    );
  } catch (error: any) {
    console.error('[Partner Voice] Error updating call status:', error);
  }
}

/**
 * Analyze completed call for lead/job creation opportunities
 */
async function analyzeCompletedCall(callSid: string): Promise<void> {
  try {
    // Get full conversation
    const conversationResult = await pool.query(
      `SELECT content FROM voice_conversation_turns 
       WHERE call_sid = $1 AND role = 'caller' 
       ORDER BY turn_number ASC`,
      [callSid]
    );

    const callResult = await pool.query(
      `SELECT partner_slug, caller_number FROM voice_call_logs WHERE call_sid = $1`,
      [callSid]
    );

    if (conversationResult.rows.length === 0 || callResult.rows.length === 0) {
      return;
    }

    const callerInputs = conversationResult.rows.map(row => row.content).join(' ');
    const { partner_slug: partnerSlug, caller_number: callerNumber } = callResult.rows[0];

    // Simple lead detection - look for keywords indicating interest
    const leadIndicators = [
      'need', 'want', 'looking for', 'schedule', 'appointment',
      'repair', 'fix', 'broken', 'not working', 'install',
      'quote', 'estimate', 'price', 'cost'
    ];

    const hasLeadIndicators = leadIndicators.some(indicator => 
      callerInputs.toLowerCase().includes(indicator)
    );

    if (hasLeadIndicators) {
      // Create lead in partner system
      await createPartnerLead(partnerSlug, callerNumber, callerInputs, callSid);
      
      // Update call log
      await pool.query(
        `UPDATE voice_call_logs SET lead_created = true, updated_at = NOW() WHERE call_sid = $1`,
        [callSid]
      );

      console.log(`[Partner Voice] Lead created for partner ${partnerSlug} from call ${callSid}`);
    }
  } catch (error: any) {
    console.error('[Partner Voice] Error analyzing completed call:', error);
  }
}

/**
 * Create lead in partner system
 */
async function createPartnerLead(
  partnerSlug: string,
  phoneNumber: string,
  description: string,
  callSid: string
): Promise<void> {
  try {
    // This would integrate with your lead management system
    // For now, just log it
    console.log(`[Partner Voice] Creating lead for ${partnerSlug}:`, {
      phoneNumber,
      description: description.substring(0, 200),
      source: 'voice_call',
      callSid
    });
    
    // TODO: Implement actual lead creation in partner_leads table
  } catch (error: any) {
    console.error('[Partner Voice] Error creating partner lead:', error);
  }
}

/**
 * Get call statistics for a partner
 */
export async function getPartnerCallStats(partnerSlug: string, days = 30): Promise<any> {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_calls,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_calls,
        COUNT(*) FILTER (WHERE lead_created = true) as leads_created,
        COUNT(*) FILTER (WHERE job_created = true) as jobs_created,
        AVG(duration_seconds) as avg_duration,
        SUM(total_cost) as total_cost
       FROM voice_call_logs 
       WHERE partner_slug = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [partnerSlug]
    );

    return result.rows[0] || {
      total_calls: 0,
      completed_calls: 0,
      leads_created: 0,
      jobs_created: 0,
      avg_duration: 0,
      total_cost: 0
    };
  } catch (error: any) {
    console.error('[Partner Voice] Error getting call stats:', error);
    return {};
  }
}

/**
 * Get recent calls for a partner
 */
export async function getPartnerRecentCalls(partnerSlug: string, limit = 10): Promise<any[]> {
  try {
    const result = await pool.query(
      `SELECT 
        call_sid,
        caller_number,
        status,
        duration_seconds,
        lead_created,
        job_created,
        created_at
       FROM voice_call_logs 
       WHERE partner_slug = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [partnerSlug, limit]
    );

    return result.rows;
  } catch (error: any) {
    console.error('[Partner Voice] Error getting recent calls:', error);
    return [];
  }
}