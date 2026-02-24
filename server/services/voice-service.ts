/**
 * Voice Service - Twilio Client Setup
 * 
 * Handles Twilio client initialization and TwiML generation helpers
 * for the George Voice AI feature.
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

export function getTwilioClient(): twilio.Twilio {
 if (!twilioClient) {
 if (!accountSid || !authToken) {
 throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set");
 }
 twilioClient = twilio(accountSid, authToken);
 }
 return twilioClient;
}

export function getTwilioPhoneNumber(): string {
 if (!phoneNumber) {
 throw new Error("TWILIO_PHONE_NUMBER must be set");
 }
 return phoneNumber;
}

export const VoiceResponse = twilio.twiml.VoiceResponse;

export const GEORGE_GREETING = "Hey there, this is Mr. George from UpTend! How can I help you with your home today?";

export const BUD_FALLBACK = "I'm not sure I can help with that over the phone. Let me text you a link to the UpTend app where you can get that sorted out. Is that okay?";

export const BUD_GOODBYE = "Thanks for calling UpTend! Have a great day, and remember, we've got your home covered.";

/**
 * Send an SMS with a link to the app
 */
export async function sendAppLink(toNumber: string): Promise<void> {
 const client = getTwilioClient();
 await client.messages.create({
 body: "Hey! Mr. George from UpTend here Here's your link to the app where you can book services, get quotes, and more: https://uptend.com",
 from: getTwilioPhoneNumber(),
 to: toNumber,
 });
}

// ─────────────────────────────────────────────
// Outbound Voice Calls (Mr. George calling customers)
// ─────────────────────────────────────────────

function escapeXml(str: string): string {
 return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function generateTwimlResponse(message: string): string {
 return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
 <Say voice="Polly.Matthew" language="en-US">${escapeXml(message)}</Say>
 <Pause length="1"/>
 <Say voice="Polly.Matthew" language="en-US">Thank you for choosing UpTend. Goodbye!</Say>
</Response>`;
}

export async function makeOutboundCall(
 to: string,
 message: string,
 callbackUrl?: string
): Promise<{ success: boolean; callSid?: string; error?: string }> {
 try {
 const client = getTwilioClient();
 const from = getTwilioPhoneNumber();

 const baseUrl = process.env.BASE_URL || (process.env.REPLIT_DEV_DOMAIN
 ? `https://${process.env.REPLIT_DEV_DOMAIN}`
 : 'https://uptend.app');

 const call = await client.calls.create({
 to,
 from,
 twiml: generateTwimlResponse(message),
 statusCallback: callbackUrl || `${baseUrl}/api/voice/status`,
 statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
 statusCallbackMethod: 'POST',
 });

 console.log(`[Voice] Outbound call to ${to} — SID: ${call.sid}`);
 return { success: true, callSid: call.sid };
 } catch (error: any) {
 console.error('[Voice] Outbound call error:', error.message);
 return { success: false, error: error.message };
 }
}

export async function getCallStatus(callSid: string): Promise<{ success: boolean; status?: string; duration?: string; error?: string }> {
 try {
 const client = getTwilioClient();
 const call = await client.calls(callSid).fetch();
 return { success: true, status: call.status, duration: call.duration };
 } catch (error: any) {
 console.error('[Voice] Status error:', error.message);
 return { success: false, error: error.message };
 }
}
