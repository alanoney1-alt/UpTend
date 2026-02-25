// Knowledge base loader for George
// Loads embedded knowledge from knowledge-data.ts (generated from server/knowledge/*.md)

import { businessOps, bookkeeping, hiring, businessPlans, serviceCategories, floridaSpecific } from "./knowledge-data";

// Intent detection patterns mapped to knowledge content
const KNOWLEDGE_ROUTES: { pattern: RegExp; content: string; label: string }[] = [
  {
    pattern: /\b(bookkeep|accounting|tax|quickbooks|xero|wave|invoice|deduct|s.corp|schedule c|1099.*tax|estimated tax|chart of accounts|profit.?loss|balance sheet|cash flow|expense|receipt|write.?off|depreci|section 179|self.?employ)\b/i,
    content: bookkeeping,
    label: "Bookkeeping & Tax Knowledge"
  },
  {
    pattern: /\b(hire|hiring|employee|recruit|onboard|worker.?comp|w.?2|1099.*classif|job description|pay rate|salary|wage|retention|fire an|firing|termina|interview|background check|drug test|i.?9|w.?4|labor law|osha|minimum wage|overtime)\b/i,
    content: hiring,
    label: "Hiring & Employment Knowledge"
  },
  {
    pattern: /\b(business plan|startup cost|financial project|break.?even|funding|sba loan|microloan|business model|executive summary|market analysis|revenue project|cash flow forecast|exit strategy|pitch deck|investor)\b/i,
    content: businessPlans,
    label: "Business Plan Knowledge"
  },
  {
    pattern: /\b(run.*(my|a|the) business|daily op|schedul.*business|dispatch|route optim|customer communicat|scaling|grow my business|first hire|software.*business|jobber|servicetitan|housecall|crm|fleet|vehicle wrap|door hanger|yard sign|google business|local seo|google ads|referral program|marketing.*business|review.*generat|complaint|repeat business|loyalty program|pricing strateg|raise.*price|minimum.*charge|emergency.*pric)\b/i,
    content: businessOps,
    label: "Business Operations Knowledge"
  },
  {
    pattern: /\b(florida licens|fl licens|dbpr|contractor licens|sales tax.*florida|fl sales tax|workers comp.*florida|llc.*florida|sunbiz|annual report.*florida|building permit|hurricane season|hoa law|lien law|chapter 713|consumer protect|3.?day.*cancel|florida building code|heat safety|fl insurance)\b/i,
    content: floridaSpecific,
    label: "Florida-Specific Knowledge"
  },
  {
    pattern: /\b(start.*(hvac|plumbing|electrical|roofing|gutter|pest|appliance|cleaning|junk|landscap|handyman|paint|floor|window|insulation|pressure|pool|carpet|moving|demolition|garage door|locksmith|tree|fence|concrete|masonry|drywall|cabinet|septic).*business|hvac business|plumbing business|cleaning business|junk removal business|landscaping business|handyman business|painting business|pool business|carpet business|how to start a)\b/i,
    content: serviceCategories,
    label: "Home Service Categories Knowledge"
  },
];

/**
 * Detect which knowledge file is relevant to a user message.
 * Returns the content of the best matching file (max 1 to keep context manageable).
 */
export function getRelevantKnowledge(message: string): string {
  if (!message) return "";

  let bestMatch: { content: string; label: string } | null = null;

  for (const route of KNOWLEDGE_ROUTES) {
    if (route.pattern.test(message)) {
      bestMatch = { content: route.content, label: route.label };
      break; // Take first (most specific) match
    }
  }

  if (!bestMatch) return "";

  // Truncate to ~12K chars to stay within token limits
  const truncated = bestMatch.content.length > 12000
    ? bestMatch.content.substring(0, 12000) + "\n\n[... additional content available, ask George to continue ...]"
    : bestMatch.content;

  return `\n\n--- GEORGE KNOWLEDGE BASE: ${bestMatch.label} ---\n${truncated}\n--- END KNOWLEDGE BASE ---\nUse the knowledge above to give detailed, accurate answers. Cite specific numbers, steps, and FL-specific details. Always recommend consulting a CPA for tax questions and an attorney for legal questions.\n`;
}
