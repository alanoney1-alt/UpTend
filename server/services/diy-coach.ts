/**
 * DIY Coaching Service
 *
 * Handles disclaimer consent flow for DIY repair coaching sessions.
 * George must show and get acknowledgment before any coaching begins.
 */

import { db } from "../db.js";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// Conversational disclaimer George shows users
// ─────────────────────────────────────────────
const DIY_DISCLAIMER_TEXT = `Before we start — quick heads up: I'm an AI assistant sharing repair tips, not a licensed contractor. Think of me like a really helpful YouTube video that can answer your questions. 🔧

You're choosing to do this yourself, and you're responsible for your safety. I'll warn you if something's dangerous and recommend a pro when needed.

If at ANY point you're uncomfortable, just say "get me a pro" and I'll have someone there fast.

Sound good? Let's fix this! 💪`;

const DIY_DISCLAIMER_BUTTONS = [
  { text: "Sounds good, let's go!", action: "reply:Yes, I understand. Let's go!" },
  { text: "Get me a pro instead", action: "reply:Get me a pro" },
];

/**
 * Returns the DIY disclaimer text and buttons that George shows
 * BEFORE starting any coaching session.
 */
export function getDIYDisclaimerConsent(): {
  disclaimerText: string;
  buttons: Array<{ text: string; action: string }>;
  legalTermsUrl: string;
} {
  return {
    disclaimerText: DIY_DISCLAIMER_TEXT,
    buttons: DIY_DISCLAIMER_BUTTONS,
    legalTermsUrl: "/legal/diy-coaching-terms",
  };
}

/**
 * Check if a user has already acknowledged the DIY disclaimer
 * in the current session/conversation.
 */
export async function hasUserAcknowledgedDIYDisclaimer(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT 1 FROM diy_coaching_consents
          WHERE user_id = ${userId}
            AND conversation_id = ${conversationId}
            AND acknowledged_at IS NOT NULL
          LIMIT 1`
    );
    return (result as any).rows?.length > 0;
  } catch {
    // Table may not exist yet — return false to show disclaimer
    return false;
  }
}

/**
 * Record that the user acknowledged the DIY disclaimer.
 */
export async function recordDIYDisclaimerAcknowledgment(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    await db.execute(
      sql`INSERT INTO diy_coaching_consents (user_id, conversation_id, acknowledged_at, disclaimer_version)
          VALUES (${userId}, ${conversationId}, NOW(), '2026-02-17')
          ON CONFLICT (user_id, conversation_id) DO UPDATE SET acknowledged_at = NOW()`
    );
  } catch (error) {
    console.error("Failed to record DIY disclaimer acknowledgment:", error);
    // Non-blocking — don't prevent coaching if consent table isn't set up yet
  }
}

/**
 * Determine if a user message constitutes affirmative acknowledgment
 * of the DIY disclaimer.
 */
export function isAffirmativeAcknowledgment(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const affirmatives = [
    "yes", "yeah", "yep", "yup", "sure", "ok", "okay", "sounds good",
    "let's go", "lets go", "let's do it", "lets do it", "i understand",
    "i agree", "got it", "go ahead", "ready", "👍", "💪",
  ];
  return affirmatives.some((a) => lower.includes(a));
}

/**
 * Check if user wants a pro instead of DIY.
 */
export function wantsProInstead(message: string): boolean {
  const lower = message.toLowerCase().trim();
  const proRequests = [
    "get me a pro", "send a pro", "hire a pro", "book a pro",
    "i want a professional", "pro instead", "not comfortable",
    "rather have a pro", "send someone",
  ];
  return proRequests.some((p) => lower.includes(p));
}
