/**
 * Post-Booking Intelligence Service
 * Generates contextual follow-up questions after jobs and prompts for pros during jobs.
 * Feeds the passive data pipeline to build home profiles.
 */

import { db } from "../db.js";
import { postBookingQuestions, proJobPrompts } from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

// Question templates by service type — each returns a question + data extraction hints
const POST_BOOKING_TEMPLATES: Record<string, Array<{ question: string; dataKeys: string[] }>> = {
  gutter_cleaning: [
    { question: "How old is your roof? I can track when it'll need replacement.", dataKeys: ["roof_age", "roof_replacement_year"] },
    { question: "Do you have gutter guards? They can reduce how often you need cleaning.", dataKeys: ["has_gutter_guards"] },
    { question: "Have you noticed any water stains on your ceilings or walls?", dataKeys: ["potential_leak", "water_damage"] },
  ],
  junk_removal: [
    { question: "Have you been thinking about a garage cleanout? We can schedule a full one.", dataKeys: ["garage_cleanout_interest"] },
    { question: "Are you doing a renovation or just decluttering?", dataKeys: ["renovation_status", "declutter_reason"] },
    { question: "Do you have any large appliances that need hauling soon?", dataKeys: ["upcoming_appliance_removal"] },
  ],
  pressure_washing: [
    { question: "When was your house last painted? I can remind you when it's time.", dataKeys: ["last_paint_year", "paint_reminder"] },
    { question: "Do you have a pool or patio that could use a wash too?", dataKeys: ["has_pool", "has_patio"] },
  ],
  hvac: [
    { question: "How old is your AC unit? Units over 10 years often need more frequent service.", dataKeys: ["ac_age", "ac_brand"] },
    { question: "Do you have a smart thermostat? It can save 10-15% on energy bills.", dataKeys: ["has_smart_thermostat"] },
  ],
  plumbing: [
    { question: "How old is your water heater? They typically last 8-12 years.", dataKeys: ["water_heater_age", "water_heater_type"] },
    { question: "Have you noticed any changes in your water pressure lately?", dataKeys: ["water_pressure_issues"] },
  ],
  landscaping: [
    { question: "Do you have an irrigation system? Proper watering saves on landscaping costs.", dataKeys: ["has_irrigation", "irrigation_type"] },
    { question: "Are you part of an HOA? Some have specific landscaping requirements.", dataKeys: ["has_hoa", "hoa_landscaping_rules"] },
  ],
  cleaning: [
    { question: "How many bedrooms and bathrooms does your home have? Helps us quote accurately next time.", dataKeys: ["bedrooms", "bathrooms"] },
    { question: "Do you have any pets? We use pet-safe products.", dataKeys: ["has_pets", "pet_type"] },
  ],
  pest_control: [
    { question: "When was your home last inspected for termites?", dataKeys: ["last_termite_inspection", "termite_risk"] },
    { question: "Do you have a crawlspace or basement?", dataKeys: ["has_crawlspace", "has_basement"] },
  ],
  painting: [
    { question: "What year was your home built? Older homes may have lead paint considerations.", dataKeys: ["home_built_year", "lead_paint_risk"] },
  ],
  electrical: [
    { question: "How old is your electrical panel? Panels over 25 years may need upgrading.", dataKeys: ["panel_age", "panel_type"] },
  ],
  handyman: [
    { question: "Do you have a list of small fixes you've been putting off? We can bundle them into one visit.", dataKeys: ["pending_fixes_count"] },
  ],
};

// Pro prompts by service type
const PRO_PROMPT_TEMPLATES: Record<string, Array<{ promptType: string; prompt: string }>> = {
  gutter_cleaning: [
    { promptType: "condition_check", prompt: "Note the condition of the roof shingles visible from the ladder." },
    { promptType: "photo_request", prompt: "Snap a photo of the downspout condition." },
    { promptType: "safety_flag", prompt: "Any signs of wood rot around the fascia board?" },
  ],
  hvac: [
    { promptType: "appliance_spot", prompt: "Note the AC brand, model, and approximate age." },
    { promptType: "photo_request", prompt: "Snap a photo of the water heater label." },
    { promptType: "condition_check", prompt: "Check the condition of the ductwork visible in the attic." },
  ],
  plumbing: [
    { promptType: "appliance_spot", prompt: "Note the water heater brand/model and age." },
    { promptType: "condition_check", prompt: "Check under sinks for signs of slow leaks or water damage." },
    { promptType: "upsell_opportunity", prompt: "Does the customer have old fixtures that could use updating?" },
  ],
  junk_removal: [
    { promptType: "upsell_opportunity", prompt: "Does the garage/space need a full cleanout?" },
    { promptType: "photo_request", prompt: "Photo the area after removal for before/after." },
  ],
  pressure_washing: [
    { promptType: "condition_check", prompt: "Note the condition of the paint/siding." },
    { promptType: "hoa_observation", prompt: "Any HOA violation notices visible on the property?" },
    { promptType: "upsell_opportunity", prompt: "Does the fence or deck need washing too?" },
  ],
  landscaping: [
    { promptType: "condition_check", prompt: "Note the irrigation system condition." },
    { promptType: "hoa_observation", prompt: "Any visible HOA compliance issues with the yard?" },
    { promptType: "safety_flag", prompt: "Any dead trees or branches that could be a hazard?" },
  ],
  cleaning: [
    { promptType: "condition_check", prompt: "Note any areas with mold or excessive moisture." },
    { promptType: "appliance_spot", prompt: "Note the condition of major appliances (dishwasher, washer/dryer)." },
  ],
  electrical: [
    { promptType: "safety_flag", prompt: "Any exposed wiring or outdated panel observed?" },
    { promptType: "photo_request", prompt: "Snap a photo of the electrical panel." },
  ],
  painting: [
    { promptType: "condition_check", prompt: "Note areas with peeling, bubbling, or water damage." },
    { promptType: "photo_request", prompt: "Photo the worst areas for the customer's records." },
  ],
  handyman: [
    { promptType: "upsell_opportunity", prompt: "Notice any other small fixes while you're there? List them." },
    { promptType: "safety_flag", prompt: "Any safety concerns (loose railings, smoke detectors, etc.)?" },
  ],
};

export async function getPostBookingQuestion(customerId: string, jobId: string, serviceType?: string) {
  // Check if we already asked a question for this job
  const existing = await db
    .select()
    .from(postBookingQuestions)
    .where(and(eq(postBookingQuestions.customerId, customerId), eq(postBookingQuestions.jobId, jobId)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  // Determine service type — passed in or look it up
  const svcType = serviceType || "handyman";
  const templates = POST_BOOKING_TEMPLATES[svcType] || POST_BOOKING_TEMPLATES.handyman!;
  const template = templates[Math.floor(Math.random() * templates.length)];

  const [question] = await db
    .insert(postBookingQuestions)
    .values({
      customerId,
      jobId,
      serviceType: svcType,
      question: template.question,
    })
    .returning();

  return question;
}

export async function processAnswer(questionId: string, answer: string) {
  const [question] = await db
    .select()
    .from(postBookingQuestions)
    .where(eq(postBookingQuestions.id, questionId));

  if (!question) return null;

  // Extract data points based on the answer
  const templates = POST_BOOKING_TEMPLATES[question.serviceType] || [];
  const matchingTemplate = templates.find((t) => t.question === question.question);
  const dataKeys = matchingTemplate?.dataKeys || [];

  const dataPoints: Record<string, string> = {};
  for (const key of dataKeys) {
    dataPoints[key] = answer; // In production, use NLP to extract structured data
  }

  const [updated] = await db
    .update(postBookingQuestions)
    .set({
      answer,
      dataPointExtracted: dataPoints,
      answeredAt: new Date(),
    })
    .where(eq(postBookingQuestions.id, questionId))
    .returning();

  return updated;
}

export async function getProJobPrompts(proId: string, jobId: string, serviceType?: string) {
  // Check for existing prompts
  const existing = await db
    .select()
    .from(proJobPrompts)
    .where(and(eq(proJobPrompts.proId, proId), eq(proJobPrompts.jobId, jobId)));

  if (existing.length > 0) return existing;

  // Generate prompts for this job
  const svcType = serviceType || "handyman";
  const templates = PRO_PROMPT_TEMPLATES[svcType] || PRO_PROMPT_TEMPLATES.handyman!;

  const prompts = await db
    .insert(proJobPrompts)
    .values(
      templates.map((t) => ({
        proId,
        jobId,
        promptType: t.promptType,
        prompt: t.prompt,
      }))
    )
    .returning();

  return prompts;
}

export async function processProPromptResponse(
  promptId: string,
  response: string,
  photos?: string[]
) {
  const [updated] = await db
    .update(proJobPrompts)
    .set({
      response,
      photos: photos || [],
      georgeProcessed: false, // Will be processed by Mr. George async
    })
    .where(eq(proJobPrompts.id, promptId))
    .returning();

  return updated;
}
