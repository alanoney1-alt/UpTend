/**
 * George Relationship Memory System
 * 
 * Builds a living, evolving understanding of each customer over time.
 * Not just home data — RELATIONSHIP data. Communication style, preferences,
 * emotional patterns, life context, history callbacks.
 * 
 * George remembers everything and brings it up naturally.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ─── Types ───

export interface RelationshipProfile {
  userId: string;
  
  // Communication style (learned over time)
  communicationStyle: {
    verbose: boolean;        // full sentences vs short/terse
    likesDetails: boolean;   // wants explanations vs just the answer
    usesHumor: boolean;      // jokes around vs stays focused
    preferredTone: "casual" | "professional" | "mixed";
    typicalResponseLength: "short" | "medium" | "long";
  };

  // Preferences (observed from behavior)
  preferences: {
    priceOrientation: "budget" | "mid" | "premium" | "unknown";
    diyVsPro: "diy-first" | "pro-first" | "balanced" | "unknown";
    decisionSpeed: "quick" | "deliberate" | "unknown";
    preferredContactMethod: "chat" | "sms" | "email" | "phone" | "unknown";
    preferredTimeOfDay: string | null;  // "morning" / "evening" / null
  };

  // Life context (mentioned in conversation)
  lifeContext: {
    familyMentions: string[];      // ["daughter heading to UF", "wife works from home"]
    petMentions: string[];         // ["golden retriever named Max"]
    workMentions: string[];        // ["works from home", "travels a lot"]
    movingPlans: boolean | null;   // mentioned selling/buying
    recentLifeEvents: string[];    // ["just moved in", "new baby", "renovating"]
  };

  // Emotional patterns
  emotionalPatterns: {
    stressAboutMoney: boolean;
    proudOfHome: boolean;
    anxiousAboutRepairs: boolean;
    frustratedWithContractors: boolean;
    generalMood: "positive" | "neutral" | "stressed" | "unknown";
  };

  // Relationship stats
  stats: {
    firstInteraction: string;       // ISO date
    totalConversations: number;
    totalJobsBooked: number;
    totalSpent: number;             // dollars
    totalSaved: number;             // dollars George has saved them
    lastInteraction: string;        // ISO date
    averageResponseTime: number;    // seconds (how fast they reply)
  };

  // History callbacks (things to reference later)
  callbacks: Array<{
    date: string;
    topic: string;
    detail: string;
    followUpDate?: string;  // when to bring it up again
    resolved: boolean;
  }>;

  // George's mistakes (own them, learn from them)
  mistakes: Array<{
    date: string;
    what: string;           // "recommended too-weak pressure washer"
    acknowledged: boolean;
  }>;

  // Seasonal/temporal patterns
  patterns: {
    busiestMonth: string | null;
    typicalBookingDay: string | null;  // "weekends" / "weekdays"
    seasonalIssuesHistory: string[];   // ["AC trouble every August", "gutter clogs in fall"]
  };

  updatedAt: string;
}

// ─── Default empty profile ───

function emptyProfile(userId: string): RelationshipProfile {
  return {
    userId,
    communicationStyle: {
      verbose: true,
      likesDetails: true,
      usesHumor: false,
      preferredTone: "mixed",
      typicalResponseLength: "medium",
    },
    preferences: {
      priceOrientation: "unknown",
      diyVsPro: "unknown",
      decisionSpeed: "unknown",
      preferredContactMethod: "unknown",
      preferredTimeOfDay: null,
    },
    lifeContext: {
      familyMentions: [],
      petMentions: [],
      workMentions: [],
      movingPlans: null,
      recentLifeEvents: [],
    },
    emotionalPatterns: {
      stressAboutMoney: false,
      proudOfHome: false,
      anxiousAboutRepairs: false,
      frustratedWithContractors: false,
      generalMood: "unknown",
    },
    stats: {
      firstInteraction: new Date().toISOString(),
      totalConversations: 0,
      totalJobsBooked: 0,
      totalSpent: 0,
      totalSaved: 0,
      lastInteraction: new Date().toISOString(),
      averageResponseTime: 0,
    },
    callbacks: [],
    mistakes: [],
    patterns: {
      busiestMonth: null,
      typicalBookingDay: null,
      seasonalIssuesHistory: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

// ─── Core Functions ───

/**
 * Get or create a relationship profile for a user
 */
export async function getRelationshipProfile(userId: string): Promise<RelationshipProfile> {
  try {
    const result = await db.execute(sql`
      SELECT profile_data FROM george_relationship_memory WHERE user_id = ${userId} LIMIT 1
    `);
    if (result.rows.length > 0) {
      return JSON.parse((result.rows[0] as any).profile_data);
    }
    // Create new profile
    const profile = emptyProfile(userId);
    await db.execute(sql`
      INSERT INTO george_relationship_memory (user_id, profile_data, created_at, updated_at)
      VALUES (${userId}, ${JSON.stringify(profile)}, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `);
    return profile;
  } catch (err) {
    console.error("[RelationshipMemory] Error getting profile:", err);
    return emptyProfile(userId);
  }
}

/**
 * Update a relationship profile (partial merge)
 */
export async function updateRelationshipProfile(
  userId: string,
  updates: Partial<RelationshipProfile>
): Promise<void> {
  try {
    const current = await getRelationshipProfile(userId);
    const merged = deepMerge(current, updates);
    merged.updatedAt = new Date().toISOString();

    await db.execute(sql`
      INSERT INTO george_relationship_memory (user_id, profile_data, created_at, updated_at)
      VALUES (${userId}, ${JSON.stringify(merged)}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        profile_data = ${JSON.stringify(merged)},
        updated_at = NOW()
    `);
  } catch (err) {
    console.error("[RelationshipMemory] Error updating profile:", err);
  }
}

/**
 * Add a callback (something George should bring up later)
 */
export async function addCallback(
  userId: string,
  topic: string,
  detail: string,
  followUpDate?: string
): Promise<void> {
  const profile = await getRelationshipProfile(userId);
  profile.callbacks.push({
    date: new Date().toISOString(),
    topic,
    detail,
    followUpDate,
    resolved: false,
  });
  // Keep last 50 callbacks
  if (profile.callbacks.length > 50) {
    profile.callbacks = profile.callbacks.slice(-50);
  }
  await updateRelationshipProfile(userId, { callbacks: profile.callbacks });
}

/**
 * Log a mistake George made (so he can own it later)
 */
export async function logMistake(userId: string, what: string): Promise<void> {
  const profile = await getRelationshipProfile(userId);
  profile.mistakes.push({
    date: new Date().toISOString(),
    what,
    acknowledged: false,
  });
  await updateRelationshipProfile(userId, { mistakes: profile.mistakes });
}

/**
 * Get pending callbacks for a user (things George should bring up)
 */
export async function getPendingCallbacks(userId: string): Promise<string[]> {
  const profile = await getRelationshipProfile(userId);
  const now = new Date();
  
  return profile.callbacks
    .filter(c => !c.resolved)
    .filter(c => {
      if (!c.followUpDate) return true; // no specific date = anytime
      return new Date(c.followUpDate) <= now;
    })
    .map(c => `[${c.topic}] ${c.detail} (from ${new Date(c.date).toLocaleDateString()})`);
}

/**
 * Build a relationship context string for George's system prompt
 * This gets injected into each conversation so George "remembers"
 */
export async function buildRelationshipContext(userId: string): Promise<string> {
  const profile = await getRelationshipProfile(userId);
  
  if (profile.stats.totalConversations === 0) {
    return "NEW CUSTOMER: This is their first interaction. Be warm, introduce yourself, prove your value.";
  }

  const lines: string[] = [];
  lines.push("=== RELATIONSHIP MEMORY (use naturally, NEVER dump all at once) ===");

  // Relationship stage
  const convos = profile.stats.totalConversations;
  if (convos < 5) {
    lines.push("STAGE: Early relationship. Still proving yourself. Be helpful and memorable.");
  } else if (convos < 20) {
    lines.push("STAGE: Building familiarity. You can be more casual now. Reference past interactions.");
  } else {
    lines.push("STAGE: Established relationship. You know each other well. Be natural, use callbacks.");
  }

  // Communication style
  const cs = profile.communicationStyle;
  if (cs.preferredTone === "casual") lines.push("STYLE: They prefer casual conversation. Match that energy.");
  if (!cs.verbose) lines.push("STYLE: They're concise. Keep your responses shorter.");
  if (cs.usesHumor) lines.push("STYLE: They joke around. Feel free to match.");
  if (!cs.likesDetails) lines.push("STYLE: They want the bottom line, not the explanation.");

  // Preferences
  const p = profile.preferences;
  if (p.priceOrientation === "budget") lines.push("PREFERENCE: Budget-conscious. Lead with affordable options.");
  if (p.priceOrientation === "premium") lines.push("PREFERENCE: Prefers quality/premium. Lead with the best option.");
  if (p.diyVsPro === "diy-first") lines.push("PREFERENCE: Likes to DIY when possible. Offer coaching first.");
  if (p.diyVsPro === "pro-first") lines.push("PREFERENCE: Prefers hiring pros. Skip DIY suggestions unless asked.");

  // Life context
  const lc = profile.lifeContext;
  if (lc.familyMentions.length > 0) lines.push(`FAMILY: ${lc.familyMentions.slice(-3).join(". ")}`);
  if (lc.petMentions.length > 0) lines.push(`PETS: ${lc.petMentions.join(", ")}`);
  if (lc.movingPlans) lines.push("CONTEXT: They mentioned selling/moving. Frame recommendations around resale value.");
  if (lc.recentLifeEvents.length > 0) lines.push(`LIFE: ${lc.recentLifeEvents.slice(-2).join(". ")}`);

  // Emotional patterns
  const ep = profile.emotionalPatterns;
  if (ep.stressAboutMoney) lines.push("EMOTIONAL: Stressed about money. Be sensitive about costs. Show value and savings.");
  if (ep.anxiousAboutRepairs) lines.push("EMOTIONAL: Gets anxious about repairs. Be reassuring. Break things into simple steps.");
  if (ep.frustratedWithContractors) lines.push("EMOTIONAL: Bad contractor experiences. Emphasize UpTend's vetting and guarantees.");

  // Stats
  lines.push(`HISTORY: ${profile.stats.totalConversations} conversations, ${profile.stats.totalJobsBooked} jobs booked, $${profile.stats.totalSaved.toFixed(0)} saved.`);

  // Pending callbacks (things to bring up)
  const callbacks = await getPendingCallbacks(userId);
  if (callbacks.length > 0) {
    lines.push("FOLLOW-UPS (bring one up naturally if relevant, don't force it):");
    callbacks.slice(0, 3).forEach(c => lines.push(`  - ${c}`));
  }

  // Unacknowledged mistakes
  const mistakes = profile.mistakes.filter(m => !m.acknowledged);
  if (mistakes.length > 0) {
    lines.push("YOUR MISTAKES (acknowledge if relevant, own it):");
    mistakes.slice(0, 2).forEach(m => lines.push(`  - ${m.what} (${new Date(m.date).toLocaleDateString()})`));
  }

  lines.push("RULES: Use this context GENTLY. Sprinkle in references naturally. NEVER say 'according to my records' or 'I remember from our last chat.' Just reference things the way a friend would. One callback per conversation max. Don't be creepy about it.");

  return lines.join("\n");
}

// ─── Conversation Analysis (call after each conversation) ───

/**
 * Analyze a conversation and update the relationship profile
 * Called after each George conversation with extracted insights
 */
export async function analyzeConversation(
  userId: string,
  insights: {
    customerMessages: string[];
    topics: string[];
    sentiment: "positive" | "neutral" | "negative";
    mentionedFamily?: string;
    mentionedPets?: string;
    mentionedWork?: string;
    mentionedMoving?: boolean;
    lifeEvent?: string;
    choseBudgetOption?: boolean;
    chosePremiumOption?: boolean;
    preferredDIY?: boolean;
    preferredPro?: boolean;
    callbackTopic?: string;
    callbackDetail?: string;
    callbackFollowUp?: string;
    mistakeMade?: string;
  }
): Promise<void> {
  const profile = await getRelationshipProfile(userId);

  // Update stats
  profile.stats.totalConversations++;
  profile.stats.lastInteraction = new Date().toISOString();

  // Analyze communication style from their messages
  if (insights.customerMessages.length > 0) {
    const avgLength = insights.customerMessages.reduce((a, m) => a + m.length, 0) / insights.customerMessages.length;
    if (avgLength < 30) {
      profile.communicationStyle.verbose = false;
      profile.communicationStyle.typicalResponseLength = "short";
    } else if (avgLength > 100) {
      profile.communicationStyle.verbose = true;
      profile.communicationStyle.typicalResponseLength = "long";
    }
    
    // Check for humor
    const hasHumor = insights.customerMessages.some(m => 
      /lol|haha|😂|🤣|joking|funny|lmao/i.test(m)
    );
    if (hasHumor) profile.communicationStyle.usesHumor = true;
  }

  // Update preferences
  if (insights.choseBudgetOption) profile.preferences.priceOrientation = "budget";
  if (insights.chosePremiumOption) profile.preferences.priceOrientation = "premium";
  if (insights.preferredDIY) profile.preferences.diyVsPro = "diy-first";
  if (insights.preferredPro) profile.preferences.diyVsPro = "pro-first";

  // Life context
  if (insights.mentionedFamily) {
    if (!profile.lifeContext.familyMentions.includes(insights.mentionedFamily)) {
      profile.lifeContext.familyMentions.push(insights.mentionedFamily);
    }
  }
  if (insights.mentionedPets) {
    if (!profile.lifeContext.petMentions.includes(insights.mentionedPets)) {
      profile.lifeContext.petMentions.push(insights.mentionedPets);
    }
  }
  if (insights.mentionedMoving) profile.lifeContext.movingPlans = true;
  if (insights.lifeEvent) {
    if (!profile.lifeContext.recentLifeEvents.includes(insights.lifeEvent)) {
      profile.lifeContext.recentLifeEvents.push(insights.lifeEvent);
    }
  }

  // Emotional patterns
  if (insights.sentiment === "negative") {
    // Check for money stress or contractor frustration from topics
    if (insights.topics.some(t => /price|cost|expensive|afford|budget/i.test(t))) {
      profile.emotionalPatterns.stressAboutMoney = true;
    }
    if (insights.topics.some(t => /contractor|ripped off|ghosted|no-show/i.test(t))) {
      profile.emotionalPatterns.frustratedWithContractors = true;
    }
  }

  // Callbacks
  if (insights.callbackTopic && insights.callbackDetail) {
    await addCallback(userId, insights.callbackTopic, insights.callbackDetail, insights.callbackFollowUp);
  }

  // Mistakes
  if (insights.mistakeMade) {
    await logMistake(userId, insights.mistakeMade);
  }

  await updateRelationshipProfile(userId, profile);
}

// ─── Helpers ───

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}
