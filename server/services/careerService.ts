import { db } from "../db";
import { haulerProfiles, haulerCertifications } from "@shared/schema";
import { eq } from "drizzle-orm";

const LEVEL_NAMES: Record<number, string> = {
  1: "Rookie Hauler",
  2: "Verified Pro",
  3: "Master Consultant",
};

const PROMOTION_REQUIREMENTS = {
  2: { jobs: 10, rating: 4.8, title: "Verified Pro" },
  3: { jobs: 50, fiveStarCount: 40, title: "Master Consultant" },
};

export async function checkPromotion(haulerId: string): Promise<{
  promoted: boolean;
  newLevel: number;
  message: string;
}> {
  const hauler = await db.query.haulerProfiles.findFirst({
    where: eq(haulerProfiles.id, haulerId),
  });

  if (!hauler) {
    return { promoted: false, newLevel: 0, message: "" };
  }

  const currentLevel = hauler.level || 1;
  let newLevel = currentLevel;
  let message = "";

  if (
    currentLevel === 1 &&
    (hauler.jobsCompleted || 0) >= 10 &&
    (hauler.rating || 0) >= 4.8
  ) {
    newLevel = 2;
    message = "You've been promoted to Verified Pro! You now qualify for lower fees and priority jobs.";
  }

  if (
    currentLevel === 2 &&
    (hauler.jobsCompleted || 0) >= 50 &&
    (hauler.fiveStarRatingCount || 0) >= 40
  ) {
    newLevel = 3;
    message = "You are now a Master Consultant! You can accept $99 Consults and earn sales commission.";

    await db.insert(haulerCertifications).values({
      haulerId,
      type: "home_estimator",
      isActive: true,
    });
  }

  if (newLevel > currentLevel) {
    await db
      .update(haulerProfiles)
      .set({
        level: newLevel,
        isConsultantEligible: newLevel === 3,
        commissionRate: newLevel === 3 ? 10 : 0,
        payoutPercentage: 0.85,
      })
      .where(eq(haulerProfiles.id, haulerId));

    console.log(
      `[CAREER] Hauler ${haulerId} promoted to Level ${newLevel} (${LEVEL_NAMES[newLevel]})`
    );
  }

  return { promoted: newLevel > currentLevel, newLevel, message };
}

export async function addXp(haulerId: string, points: number): Promise<void> {
  const hauler = await db.query.haulerProfiles.findFirst({
    where: eq(haulerProfiles.id, haulerId),
  });
  if (!hauler) return;

  await db
    .update(haulerProfiles)
    .set({ xpPoints: (hauler.xpPoints || 0) + points })
    .where(eq(haulerProfiles.id, haulerId));
}

export function getNextLevelRequirements(level: number) {
  if (level === 1) {
    return {
      nextLevel: 2,
      title: "Verified Pro",
      requirements: { jobs: 10, rating: 4.8 },
      unlocks: ["15% Platform Fee", "Priority Jobs", "Bounty Jobs"],
    };
  }
  if (level === 2) {
    return {
      nextLevel: 3,
      title: "Master Consultant",
      requirements: { jobs: 50, fiveStarCount: 40 },
      unlocks: ["$49 Consultations", "10% Sales Commission", "Auto-Inventory Tools"],
    };
  }
  return {
    nextLevel: 3,
    title: "Max Level",
    requirements: { jobs: 999, rating: 5.0, fiveStarCount: 999 },
    unlocks: [],
  };
}

export { LEVEL_NAMES };
