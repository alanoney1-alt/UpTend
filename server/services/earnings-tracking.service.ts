import { db } from "../db";
import { users, haulerProfiles, serviceRequests, proWeeklyEarnings, proMilestones } from "@shared/schema";
import { eq, sql, and, gte, lte, desc, sum, count } from "drizzle-orm";

export class EarningsTrackingService {
  // Update weekly earnings data for a specific pro
  static async updateWeeklyEarnings(userId: string, weekStart: string) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Get earnings for this week
    const weeklyResult = await db
      .select({
        totalEarnings: sum(serviceRequests.haulerPayout),
        jobsCompleted: count(),
      })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.assignedHaulerId, userId),
          eq(serviceRequests.status, "completed"),
          gte(serviceRequests.completedAt, weekStart),
          lte(serviceRequests.completedAt, weekEndStr)
        )
      );

    const totalEarnings = Number(weeklyResult[0]?.totalEarnings || 0);
    const jobsCompleted = Number(weeklyResult[0]?.jobsCompleted || 0);

    // Get pro's weekly target
    const profileResult = await db
      .select({
        annualIncomeGoal: haulerProfiles.annualIncomeGoal,
      })
      .from(haulerProfiles)
      .where(eq(haulerProfiles.userId, userId))
      .limit(1);

    const weeklyTarget = (profileResult[0]?.annualIncomeGoal || 0) / 52;
    const targetMet = totalEarnings >= weeklyTarget;

    // Upsert weekly earnings record
    await db
      .insert(proWeeklyEarnings)
      .values({
        proId: userId,
        weekStart,
        weekEnd: weekEndStr,
        totalEarnings,
        jobsCompleted,
        weeklyTarget,
        targetMet,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [proWeeklyEarnings.proId, proWeeklyEarnings.weekStart],
        set: {
          totalEarnings,
          jobsCompleted,
          weeklyTarget,
          targetMet,
        },
      });

    return { totalEarnings, jobsCompleted, weeklyTarget, targetMet };
  }

  // Update streak calculation for a pro
  static async updateStreak(userId: string) {
    // Get last 20 weeks of data to calculate streak
    const weeklyData = await db
      .select()
      .from(proWeeklyEarnings)
      .where(eq(proWeeklyEarnings.proId, userId))
      .orderBy(desc(proWeeklyEarnings.weekStart))
      .limit(20);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak (from most recent week backwards)
    for (let i = 0; i < weeklyData.length; i++) {
      if (weeklyData[i].targetMet) {
        if (i === 0) currentStreak++; // Current week starts the streak
        if (i === currentStreak - 1) currentStreak++; // Continuing streak
        else if (i > currentStreak) break; // Streak is broken
      } else {
        if (i < currentStreak) break; // Current streak is broken
      }
    }

    // Calculate longest streak from all data
    for (const week of weeklyData) {
      if (week.targetMet) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Update profile with new streak data
    await db
      .update(haulerProfiles)
      .set({
        currentStreakWeeks: currentStreak,
        longestStreakWeeks: longestStreak,
      })
      .where(eq(haulerProfiles.userId, userId));

    return { currentStreak, longestStreak };
  }

  // Update career total earnings and level
  static async updateCareerEarnings(userId: string) {
    // Calculate total lifetime earnings
    const totalResult = await db
      .select({
        totalEarnings: sum(serviceRequests.haulerPayout),
      })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.assignedHaulerId, userId),
          eq(serviceRequests.status, "completed")
        )
      );

    const careerTotal = Number(totalResult[0]?.totalEarnings || 0);

    // Determine earnings level
    let earningsLevel = "starter";
    if (careerTotal >= 100000) earningsLevel = "legend";
    else if (careerTotal >= 50000) earningsLevel = "elite";
    else if (careerTotal >= 25000) earningsLevel = "pro";
    else if (careerTotal >= 10000) earningsLevel = "rising";

    // Update profile
    await db
      .update(haulerProfiles)
      .set({
        careerTotalEarnings: careerTotal,
        earningsLevel,
      })
      .where(eq(haulerProfiles.userId, userId));

    return { careerTotal, earningsLevel };
  }

  // Check and award milestones
  static async checkMilestones(userId: string) {
    const profileResult = await db
      .select()
      .from(haulerProfiles)
      .where(eq(haulerProfiles.userId, userId))
      .limit(1);

    if (!profileResult.length) return;

    const profile = profileResult[0];
    const newMilestones = [];

    // Check annual progress milestones
    if (profile.annualIncomeGoal && profile.annualIncomeGoal > 0) {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      
      const ytdResult = await db
        .select({
          totalEarnings: sum(serviceRequests.haulerPayout),
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
      const progressPercent = (ytdEarnings / profile.annualIncomeGoal) * 100;

      const milestoneChecks = [
        { type: "annual_25", threshold: 25 },
        { type: "annual_50", threshold: 50 },
        { type: "annual_75", threshold: 75 },
        { type: "annual_100", threshold: 100 },
      ];

      for (const milestone of milestoneChecks) {
        if (progressPercent >= milestone.threshold) {
          // Check if milestone already awarded this year
          const existingMilestone = await db
            .select()
            .from(proMilestones)
            .where(
              and(
                eq(proMilestones.proId, userId),
                eq(proMilestones.milestoneType, milestone.type),
                gte(proMilestones.achievedAt, yearStart)
              )
            )
            .limit(1);

          if (!existingMilestone.length) {
            await db.insert(proMilestones).values({
              proId: userId,
              milestoneType: milestone.type,
              milestoneValue: `${milestone.threshold}% of annual goal`,
              achievedAt: new Date().toISOString(),
            });
            newMilestones.push(milestone.type);
          }
        }
      }
    }

    // Check streak milestones
    const streakChecks = [
      { type: "streak_4", threshold: 4 },
      { type: "streak_12", threshold: 12 },
    ];

    for (const streak of streakChecks) {
      if ((profile.currentStreakWeeks ?? 0) >= streak.threshold) {
        const existingStreak = await db
          .select()
          .from(proMilestones)
          .where(
            and(
              eq(proMilestones.proId, userId),
              eq(proMilestones.milestoneType, streak.type)
            )
          )
          .limit(1);

        if (!existingStreak.length) {
          await db.insert(proMilestones).values({
            proId: userId,
            milestoneType: streak.type,
            milestoneValue: `${streak.threshold} week streak`,
            achievedAt: new Date().toISOString(),
          });
          newMilestones.push(streak.type);
        }
      }
    }

    // Check level up milestones
    const previousEarningsResult = await db
      .select()
      .from(proMilestones)
      .where(
        and(
          eq(proMilestones.proId, userId),
          eq(proMilestones.milestoneType, "level_up")
        )
      )
      .orderBy(desc(proMilestones.achievedAt))
      .limit(1);

    const lastLevel = previousEarningsResult[0]?.milestoneValue || "starter";
    if (profile.earningsLevel !== lastLevel && profile.earningsLevel !== "starter") {
      await db.insert(proMilestones).values({
        proId: userId,
        milestoneType: "level_up",
        milestoneValue: profile.earningsLevel,
        achievedAt: new Date().toISOString(),
      });
      newMilestones.push("level_up");
    }

    return newMilestones;
  }

  // Main function to update all earnings data when a job completes
  static async onJobCompleted(userId: string, completedAt: string) {
    try {
      // Get the Monday of the week this job was completed
      const completedDate = new Date(completedAt);
      const monday = new Date(completedDate);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      const weekStart = monday.toISOString().split('T')[0];

      // Update weekly earnings
      await this.updateWeeklyEarnings(userId, weekStart);

      // Update streak
      await this.updateStreak(userId);

      // Update career earnings and level
      await this.updateCareerEarnings(userId);

      // Check and award milestones
      const newMilestones = await this.checkMilestones(userId);

      return { weekStart, newMilestones };
    } catch (error) {
      console.error("Error updating earnings data:", error);
      throw error;
    }
  }

  // Calculate job recommendations based on income goal
  static calculateJobRecommendations(profile: any) {
    const { annualIncomeGoal, availableHoursPerWeek, serviceTypes, pyckerTier } = profile;
    
    if (!annualIncomeGoal || annualIncomeGoal <= 0) {
      return null;
    }

    // Service type average payouts (after platform fees)
    const SERVICE_PAYOUTS = {
      junk_removal: 90,
      pressure_washing: 110,
      gutter_cleaning: 95,
      moving_labor: 100,
      handyman: 56,
      home_cleaning: 75,
      pool_cleaning: 85,
      landscaping: 65,
      carpet_cleaning: 45,
      light_demolition: 150,
      garage_cleanout: 120,
    };

    // Calculate average payout based on service mix
    const avgPayout = serviceTypes.reduce((sum: number, service: string) => {
      const payout = SERVICE_PAYOUTS[service as keyof typeof SERVICE_PAYOUTS] || 75;
      return sum + payout;
    }, 0) / serviceTypes.length;

    // B2B certification bonus (40% higher)
    const b2bMultiplier = pyckerTier === 'verified_pro' ? 1.4 : 1.0;
    const adjustedPayout = avgPayout * b2bMultiplier;

    // Weekly target
    const weeklyTarget = annualIncomeGoal / 52;
    const jobsPerWeek = Math.ceil(weeklyTarget / adjustedPayout);
    const hoursNeeded = jobsPerWeek * 3; // Assume 3 hours per job

    return {
      weeklyTarget: Math.round(weeklyTarget),
      avgPayout: Math.round(adjustedPayout),
      jobsPerWeek,
      hoursNeeded,
      recommendation: hoursNeeded > availableHoursPerWeek && pyckerTier !== 'verified_pro' 
        ? "Get B2B certification to boost your average payout by 40%"
        : hoursNeeded > availableHoursPerWeek
        ? `Consider increasing available hours to ${hoursNeeded}/week to meet your goal`
        : "You're on track! Keep up the great work",
      certUpgrade: pyckerTier !== 'verified_pro' ? {
        currentJobsPerWeek: jobsPerWeek,
        withCertJobsPerWeek: Math.ceil(weeklyTarget / (avgPayout * 1.4)),
        savings: `Work ${Math.ceil(weeklyTarget / (avgPayout * 1.4))} fewer jobs per week`,
      } : null,
    };
  }
}