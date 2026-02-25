/**
 * SMS Service
 * 
 * Handles outbound SMS via Twilio and incoming message processing.
 * Gracefully degrades when Twilio credentials are not set.
 */

import twilio from "twilio";
import { generateSmsResponse, type ChatMessage } from "./ai-assistant";
import { storage } from "../storage";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+18559012072";

const twilioClient =
  TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET && TWILIO_ACCOUNT_SID
    ? twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID })
    : TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
      ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
      : null;

const SMS_MAX_LENGTH = 160;

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  if (!twilioClient) {
    console.warn("[SMS] Twilio not configured — message not sent to", to);
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    // Split long messages if needed
    const messages = splitMessage(message);

    let lastSid = "";
    for (const msg of messages) {
      const result = await twilioClient.messages.create({
        body: msg,
        to,
        from: TWILIO_PHONE_NUMBER,
      });
      lastSid = result.sid;
    }

    return { success: true, messageSid: lastSid };
  } catch (error: any) {
    console.error("[SMS] Send error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handle an incoming SMS message — route to George AI and return response
 */
export async function handleIncoming(
  from: string,
  body: string
): Promise<string> {
  try {
    // Get or create conversation for history
    const conversation = await storage.getOrCreateSmsConversation(from);

    // Build conversation history (last 10 messages)
    const recentMessages = await storage.getSmsMessagesByConversation(conversation.id, 10);
    const history: ChatMessage[] = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.direction === "inbound" ? "user" as const : "assistant" as const,
        content: msg.messageBody,
      }));

    // Generate AI response
    const response = await generateSmsResponse(body, history);

    // Condense if too long for SMS
    return condenseSmsResponse(response);
  } catch (error: any) {
    console.error("[SMS] Handle incoming error:", error.message);
    return "Sorry, I had trouble processing your message. Call (407) 338-3342 for help.";
  }
}

/**
 * Split long messages into SMS-sized chunks
 */
function splitMessage(message: string): string[] {
  if (message.length <= SMS_MAX_LENGTH) return [message];

  const chunks: string[] = [];
  let remaining = message;

  while (remaining.length > 0) {
    if (remaining.length <= SMS_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point (sentence end, space, etc.)
    let splitAt = SMS_MAX_LENGTH;
    const lastPeriod = remaining.lastIndexOf(".", SMS_MAX_LENGTH);
    const lastSpace = remaining.lastIndexOf(" ", SMS_MAX_LENGTH);

    if (lastPeriod > SMS_MAX_LENGTH * 0.5) {
      splitAt = lastPeriod + 1;
    } else if (lastSpace > SMS_MAX_LENGTH * 0.5) {
      splitAt = lastSpace;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}

/**
 * Condense AI response to be SMS-friendly (prefer ≤160 chars)
 */
function condenseSmsResponse(response: string): string {
  // Already short enough
  if (response.length <= SMS_MAX_LENGTH) return response;

  // Try to truncate at sentence boundary
  const sentences = response.split(/(?<=[.!?])\s+/);
  let condensed = "";
  for (const sentence of sentences) {
    if ((condensed + " " + sentence).trim().length <= SMS_MAX_LENGTH) {
      condensed = (condensed + " " + sentence).trim();
    } else {
      break;
    }
  }

  // If we got at least one sentence, use it
  if (condensed.length > 20) return condensed;

  // Otherwise just return full response (will be split by sendSMS)
  return response;
}
