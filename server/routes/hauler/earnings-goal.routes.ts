import { Router } from "express";
import { z } from "zod";
import { db } from "../../db";
import { users, haulerProfiles, serviceRequests, proWeeklyEarnings, proMilestones } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, sum, count } from "drizzle-orm";
import { requireAuth } from "../../auth-middleware";

const router = Router();

// Average payouts by service type (after platform fees)
const SERVICE_PAYOUTS = {
  junk_removal: 90,
  pressure_washing: 110,
  gutter_cleaning: 95,
  moving_labor: 100, // per hour
  handyman: 56, // per hour
  home_cleaning: 75,
  pool_cleaning: 85, // per client per month
  landscaping: 65,
  carpet_cleaning: 45,
  light_demolition: 150,
  garage_cleanout: 120,
  b2b_jobs: 150, // 40% higher than consumer
};

// Earnings levels based on total career earnings
const EARNINGS_LEVELS = {
  starter: { min: 0, max: 10000 },
  rising: { min: 10000, max: 25000 },
  pro: { min: 25000, max: 50000 },
  elite: { min: 50000, max: 100000 },
  legend: { min: 100000, max: Infinity },
};

// Set/update annual income goal
router.post("/income-goal", requireAuth, async (req, res) => {
  try {
    const schema = z.object({
      annualIncomeGoal: z.number().min(0).max(500000),
      availableHoursPerWeek: z.number().min(1).max(80).optional(),
    });

    const { annualIncomeGoal, availableHoursPerWeek } = schema.parse(req.body);
    const userId = ((req.user as any).userId || (req.user as any).id);

    // Update hauler profile with income goal
    await db
      .update(haulerProfiles)
      .set({
        annualIncomeGoal,
        ...(availableHoursPerWeek && { availableHoursPerWeek }),
      })
      .where(eq(haulerProfiles.userId, userId));

    res.json({ success: true, annualIncomeGoal });
  } catch (error: any) {
    console.error("Error setting income goal:", error);
    res.status(400).json({ error: error.message });
  }
});

// Calculate job track based on income goal and service mix
async function calculateJobTrack(profile: any) {
  const { annualIncomeGoal, availableHoursPerWeek, serviceTypes, pyckerTier } = profile;
  
  if (!annualIncomeGoal || annualIncomeGoal <= 0) {
    return null;
  }

  // Calculate weekly target
  const weeklyTarget = annualIncomeGoal / 52;

  // Calculate average payout based on service mix
  const avgPayout = serviceTypes.reduce((sum: number, service: string) => {
    const payout = SERVICE_PAYOUTS[service as keyof typeof SERVICE_PAYOUTS] || 75;
    return sum + payout;
  }, 0) / serviceTypes.length;

  // B2B certification bonus
  const b2bBonus = pyckerTier === 'verified_pro' ? 1.4 : 1.0;
  const adjustedPayout = avgPayout * b2bBonus;

  // Jobs needed per week
  const jobsPerWeek = Math.ceil(weeklyTarget / adjustedPayout);
  const hoursNeeded = jobsPerWeek * 3; // Assume 3 hours per job

  return {
    weeklyTarget,
    avgPayout: adjustedPayout,
    jobsPerWeek,
    hoursNeeded,
    recommendation: hoursNeeded > availableHoursPerWeek && pyckerTier !== 'verified_pro' 
      ? "Get B2B certification to work less and earn more"
      : "Stay on track with your current service mix",
    canMeetGoal: hoursNeeded <= availableHoursPerWeek,
  };
}

// Calculate current pace and streak
async function calculateProgress(userId: string, profile: any) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearStart = `${currentYear}-01-01`;
  
  // Get YTD earnings
  const ytdResult = await db
    .select({
      totalEarnings: sum(serviceRequests.haulerPayout),
      jobCount: count(),
    })
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.assignedHaulerId, userId),
        eq(serviceRequests.status, "completed"),
        gte(serviceRequests.completedAt, yearStart)
      )
    );

  const ytdEarnings = Number(ytdResult[0]?.totalEarnings || 0);
  const ytdJobs = Number(ytdResult[0]?.jobCount || 0);

  // Calculate progress percentage
  const progressPercent = profile.annualIncomeGoal > 0 
    ? Math.min((ytdEarnings / profile.annualIncomeGoal) * 100, 100)
    : 0;

  // Calculate weeks passed this year
  const weeksPassed = Math.floor((now.getTime() - new Date(yearStart).getTime()) / (7 * 24 * 60 * 60 * 1000));
  const expectedEarnings = (profile.annualIncomeGoal / 52) * weeksPassed;
  
  // Pace indicator
  let paceStatus = "on_track";
  if (ytdEarnings > expectedEarnings * 1.1) paceStatus = "ahead";
  else if (ytdEarnings < expectedEarnings * 0.9) paceStatus = "behind";

  // Calculate current level
  let earningsLevel = "starter";
  const totalEarnings = profile.careerTotalEarnings || 0;
  for (const [level, range] of Object.entries(EARNINGS_LEVELS)) {
    if (totalEarnings >= range.min && totalEarnings < range.max) {
      earningsLevel = level;
      break;
    }
  }

  // Update earnings level if changed
  if (earningsLevel !== profile.earningsLevel) {
    await db
      .update(haulerProfiles)
      .set({ earningsLevel })
      .where(eq(haulerProfiles.userId, userId));
  }

  return {
    ytdEarnings,
    ytdJobs,
    progressPercent,
    paceStatus,
    earningsLevel,
    weeksPassed,
  };
}

// Get full earnings dashboard data
router.get("/earnings-track", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);

    // Get hauler profile
    const profileResult = await db
      .select()
      .from(haulerProfiles)
      .where(eq(haulerProfiles.userId, userId))
      .limit(1);

    if (!profileResult.length) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = profileResult[0];

    // Calculate job track
    const jobTrack = await calculateJobTrack(profile);
    
    // Calculate progress
    const progress = await calculateProgress(userId, profile);

    // Get recent milestones
    const milestones = await db
      .select()
      .from(proMilestones)
      .where(eq(proMilestones.proId, userId))
      .orderBy(desc(proMilestones.achievedAt))
      .limit(5);

    // Get current week earnings
    const mondayThisWeek = new Date();
    mondayThisWeek.setDate(mondayThisWeek.getDate() - mondayThisWeek.getDay() + 1);
    const mondayStr = mondayThisWeek.toISOString().split('T')[0];
    
    const sundayThisWeek = new Date(mondayThisWeek);
    sundayThisWeek.setDate(sundayThisWeek.getDate() + 6);
    const sundayStr = sundayThisWeek.toISOString().split('T')[0];

    const thisWeekResult = await db
      .select({
        totalEarnings: sum(serviceRequests.haulerPayout),
        jobCount: count(),
      })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.assignedHaulerId, userId),
          eq(serviceRequests.status, "completed"),
          gte(serviceRequests.completedAt, mondayStr),
          lte(serviceRequests.completedAt, sundayStr)
        )
      );

    const thisWeekEarnings = Number(thisWeekResult[0]?.totalEarnings || 0);
    const thisWeekJobs = Number(thisWeekResult[0]?.jobCount || 0);

    res.json({
      profile: {
        annualIncomeGoal: profile.annualIncomeGoal,
        availableHoursPerWeek: profile.availableHoursPerWeek,
        currentStreakWeeks: profile.currentStreakWeeks,
        longestStreakWeeks: profile.longestStreakWeeks,
        earningsLevel: profile.earningsLevel,
        careerTotalEarnings: profile.careerTotalEarnings,
      },
      jobTrack,
      progress,
      thisWeek: {
        earnings: thisWeekEarnings,
        jobs: thisWeekJobs,
        weeklyTarget: jobTrack?.weeklyTarget || 0,
        targetMet: jobTrack ? thisWeekEarnings >= jobTrack.weeklyTarget : false,
      },
      milestones,
    });
  } catch (error: any) {
    console.error("Error getting earnings track:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get weekly breakdown
router.get("/weekly-earnings", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const { weeks = 12 } = req.query;

    const weeklyData = await db
      .select()
      .from(proWeeklyEarnings)
      .where(eq(proWeeklyEarnings.proId, userId))
      .orderBy(desc(proWeeklyEarnings.weekStart))
      .limit(Number(weeks));

    res.json({ weeklyData });
  } catch (error: any) {
    console.error("Error getting weekly earnings:", error);
    res.status(500).json({ error: error.message });
  }
});

// Recalculate job track after cert changes
router.post("/recalculate", requireAuth, async (req, res) => {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);

    // Get updated profile
    const profileResult = await db
      .select()
      .from(haulerProfiles)
      .where(eq(haulerProfiles.userId, userId))
      .limit(1);

    if (!profileResult.length) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profile = profileResult[0];
    const jobTrack = await calculateJobTrack(profile);

    res.json({ jobTrack });
  } catch (error: any) {
    console.error("Error recalculating job track:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

export function registerEarningsGoalRoutes(app: any) {
  app.use("/api/pro", router);

  // GET /api/haulers/earnings - pro earnings summary (alias)
  app.get("/api/haulers/earnings", requireAuth, async (req: any, res: any) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      res.json({
        earnings: { thisWeek: 0, thisMonth: 0, ytd: 0, allTime: 0 },
        recentPayouts: [],
        userId,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}