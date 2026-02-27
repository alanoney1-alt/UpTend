/**
 * DIY Brain — George's repair knowledge lookup service.
 * Fuzzy matches customer descriptions to the knowledge base.
 */

import { DIY_KNOWLEDGE_BASE, type DIYRepair } from "../data/diy-knowledge-base.js";

/** Fuzzy match customer description to repairs */
export function findRepairBySymptoms(description: string): DIYRepair[] {
  const lower = description.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 2);

  const scored = DIY_KNOWLEDGE_BASE.map((repair) => {
    let score = 0;

    // Check symptoms
    for (const symptom of repair.symptoms) {
      const symLower = symptom.toLowerCase();
      if (lower.includes(symLower)) score += 10;
      for (const word of words) {
        if (symLower.includes(word)) score += 3;
      }
    }

    // Check name
    const nameLower = repair.name.toLowerCase();
    if (lower.includes(nameLower)) score += 15;
    for (const word of words) {
      if (nameLower.includes(word)) score += 2;
    }

    // Check category/subcategory
    if (lower.includes(repair.category)) score += 2;
    if (lower.includes(repair.subcategory)) score += 3;

    // Check diagnosis
    const diagLower = repair.diagnosis.toLowerCase();
    for (const word of words) {
      if (diagLower.includes(word)) score += 1;
    }

    return { repair, score };
  })
    .filter((s) => s.score > 3)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((s) => s.repair);
}

/** Direct lookup by ID */
export function getRepairById(id: string): DIYRepair | undefined {
  return DIY_KNOWLEDGE_BASE.find((r) => r.id === id);
}

/** Get all repairs in a category */
export function getRepairsByCategory(category: string): DIYRepair[] {
  return DIY_KNOWLEDGE_BASE.filter(
    (r) => r.category.toLowerCase() === category.toLowerCase()
  );
}

/** Get related repairs */
export function getRelatedRepairs(repairId: string): DIYRepair[] {
  const repair = getRepairById(repairId);
  if (!repair) return [];
  return repair.relatedRepairs
    .map((id) => getRepairById(id))
    .filter((r): r is DIYRepair => !!r);
}

/** Should they DIY or call a pro? */
export function getDifficultyAssessment(repairId: string): object | null {
  const repair = getRepairById(repairId);
  if (!repair) return null;

  const assessment = {
    repairId: repair.id,
    name: repair.name,
    difficulty: repair.difficulty,
    safetyLevel: repair.safetyLevel,
    proRecommended: repair.proRecommended,
    estimatedTime: repair.estimatedTime,
    estimatedCost: repair.estimatedCost,
    recommendation: "",
    reasoning: "",
  };

  if (repair.safetyLevel === "red" || repair.proRecommended) {
    assessment.recommendation = "HIRE A PRO";
    assessment.reasoning = `This repair involves ${repair.safetyWarnings[0] || "safety risks"}. I'd strongly recommend a professional for this one.`;
  } else if (repair.difficulty >= 4) {
    assessment.recommendation = "PRO RECOMMENDED";
    assessment.reasoning = `This is a difficulty ${repair.difficulty}/5 repair that takes ${repair.estimatedTime}. Doable but challenging — a pro would be faster and more reliable.`;
  } else if (repair.safetyLevel === "yellow") {
    assessment.recommendation = "DIY WITH CAUTION";
    assessment.reasoning = `You can do this yourself, but be careful: ${repair.safetyWarnings[0] || "follow safety precautions"}. Cost to DIY: ~${repair.estimatedCost}.`;
  } else {
    assessment.recommendation = "GREAT DIY PROJECT";
    assessment.reasoning = `Difficulty ${repair.difficulty}/5, takes about ${repair.estimatedTime}, costs ~${repair.estimatedCost}. You got this!`;
  }

  return assessment;
}

/** Get all categories with counts */
export function getCategories(): Array<{ category: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const r of DIY_KNOWLEDGE_BASE) {
    counts[r.category] = (counts[r.category] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

/** Total repair count */
export function getTotalRepairCount(): number {
  return DIY_KNOWLEDGE_BASE.length;
}
