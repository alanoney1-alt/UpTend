import { db } from "../db";
import { deferredJobs } from "@shared/schema";
import { eq, lte, and } from "drizzle-orm";

export async function runDailyNudge(): Promise<number> {
  const today = new Date().toISOString();
  let nudgedCount = 0;

  try {
    const dueJobs = await db
      .select()
      .from(deferredJobs)
      .where(
        and(
          lte(deferredJobs.nextNudgeDate, today),
          eq(deferredJobs.status, "pending")
        )
      );

    for (const job of dueJobs) {
      const nextDate = new Date();
      if (job.nudgeCount === 0) {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if ((job.nudgeCount || 0) < 3) {
        nextDate.setDate(nextDate.getDate() + 30);
      } else {
        nextDate.setDate(nextDate.getDate() + 90);
      }

      await db
        .update(deferredJobs)
        .set({
          nudgeCount: (job.nudgeCount || 0) + 1,
          nextNudgeDate: nextDate.toISOString(),
        })
        .where(eq(deferredJobs.id, job.id));

      console.log(
        `[MARKETING] Nudged user ${job.userId} about "${job.title}" (nudge #${(job.nudgeCount || 0) + 1})`
      );
      nudgedCount++;
    }
  } catch (error) {
    console.error("[MARKETING] Nudge engine error:", error);
  }

  return nudgedCount;
}

export function startNudgeEngine(): void {
  console.log("[MARKETING] Nudge engine started (runs daily at midnight)");
  const DAILY_MS = 24 * 60 * 60 * 1000;

  runDailyNudge().catch(console.error);

  setInterval(() => {
    runDailyNudge().catch(console.error);
  }, DAILY_MS);
}
