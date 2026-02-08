import { db } from "../db";
import { propertyScores, scoreHistory } from "@shared/schema";
import { eq } from "drizzle-orm";

const POINT_VALUES: Record<string, { points: number; category: string }> = {
  junk_removal: { points: 15, category: "safety" },
  furniture_moving: { points: 25, category: "documentation" },
  moving: { points: 25, category: "documentation" },
  garage_cleanout: { points: 20, category: "maintenance" },
  estate_cleanout: { points: 30, category: "maintenance" },
  truck_unloading: { points: 10, category: "maintenance" },
  hvac: { points: 20, category: "safety" },
  cleaning: { points: 15, category: "maintenance" },
  labor_help: { points: 10, category: "maintenance" },
  donation_receipt: { points: 30, category: "documentation" },
  home_consultation: { points: 50, category: "documentation" },
  pressure_washing: { points: 10, category: "maintenance" },
  gutter_cleaning: { points: 20, category: "maintenance" },
  moving_labor: { points: 5, category: "maintenance" },
  light_demolition: { points: 10, category: "safety" },
};

const MAX_SCORE = 850;

export async function updateHomeScore(
  userId: string,
  jobType: string,
  jobId: string
): Promise<number> {
  let scoreRecord = await db.query.propertyScores.findFirst({
    where: eq(propertyScores.userId, userId),
  });

  if (!scoreRecord) {
    const [created] = await db
      .insert(propertyScores)
      .values({
        userId,
        totalScore: 500,
      })
      .returning();
    scoreRecord = created;
  }

  const impact = POINT_VALUES[jobType] || { points: 5, category: "maintenance" };
  const newScore = Math.min(MAX_SCORE, (scoreRecord.totalScore || 500) + impact.points);

  const healthUpdates: Record<string, number> = {};
  if (impact.category === "maintenance") {
    healthUpdates.maintenanceHealth = Math.min(100, (scoreRecord.maintenanceHealth || 50) + Math.round(impact.points / 2));
  } else if (impact.category === "safety") {
    healthUpdates.safetyHealth = Math.min(100, (scoreRecord.safetyHealth || 50) + Math.round(impact.points / 2));
  } else if (impact.category === "documentation") {
    healthUpdates.documentationHealth = Math.min(100, (scoreRecord.documentationHealth || 50) + Math.round(impact.points / 2));
  }

  await db.transaction(async (tx) => {
    await tx
      .update(propertyScores)
      .set({
        totalScore: newScore,
        lastUpdated: new Date().toISOString(),
        ...healthUpdates,
      })
      .where(eq(propertyScores.id, scoreRecord!.id));

    await tx.insert(scoreHistory).values({
      scoreId: scoreRecord!.id,
      serviceRequestId: jobId,
      pointsChanged: impact.points,
      reason: `Completed ${jobType.replace(/_/g, " ")}`,
      category: impact.category,
    });
  });

  return newScore;
}

export async function getHomeScore(userId: string) {
  const score = await db.query.propertyScores.findFirst({
    where: eq(propertyScores.userId, userId),
  });

  if (!score) {
    return {
      totalScore: 0,
      maintenanceHealth: 0,
      documentationHealth: 0,
      safetyHealth: 0,
      history: [],
    };
  }

  const history = await db
    .select()
    .from(scoreHistory)
    .where(eq(scoreHistory.scoreId, score.id))
    .orderBy(scoreHistory.createdAt)
    .limit(10);

  return {
    ...score,
    history,
  };
}

export function getScoreLabel(score: number): string {
  if (score >= 750) return "Excellent";
  if (score >= 650) return "Good";
  if (score >= 550) return "Average";
  if (score >= 450) return "Below Average";
  return "Needs Attention";
}

export function getScorePercentile(score: number): number {
  if (score >= 800) return 5;
  if (score >= 750) return 15;
  if (score >= 700) return 25;
  if (score >= 650) return 35;
  if (score >= 600) return 50;
  if (score >= 550) return 65;
  if (score >= 500) return 75;
  return 90;
}
