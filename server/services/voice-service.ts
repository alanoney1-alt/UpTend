/**
 * Voice Service - Twilio Client Setup
 * 
 * Handles Twilio client initialization and TwiML generation helpers
 * for the Bud Voice AI feature.
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

export const BUD_GREETING = "Hey there, this is Bud from UpTend! How can I help you with your home today?";

export const BUD_FALLBACK = "I'm not sure I can help with that over the phone. Let me text you a link to the UpTend app where you can get that sorted out. Is that okay?";

export const BUD_GOODBYE = "Thanks for calling UpTend! Have a great day, and remember, we've got your home covered.";

/**
 * Send an SMS with a link to the app
 */
export async function sendAppLink(toNumber: string): Promise<void> {
  const client = getTwilioClient();
  await client.messages.create({
    body: "Hey! Bud from UpTend here 🏠 Here's your link to the app where you can book services, get quotes, and more: https://uptend.com",
    from: getTwilioPhoneNumber(),
    to: toNumber,
  });
}
