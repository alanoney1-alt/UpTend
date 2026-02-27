/**
 * Pro Goal Tracker Service
 * Earnings goals, milestones, progress tracking, AI-suggested goals
 * Pros are 1099 independent contractors - earnings/payouts only
 */

import { pool } from "../db.js";
import { getDemandForecast } from "./pro-intelligence.js";

// ─── Set Goal ────────────────────────────────────────────────────

export async function setGoal(
 proId: string,
 goalType: "weekly" | "monthly" | "quarterly" | "yearly",
 targetAmount: number,
 startDate: string,
 endDate: string
): Promise<object> {
 const milestones = [
 { percent: 25, amount: targetAmount * 0.25, reached: false, reachedAt: null },
 { percent: 50, amount: targetAmount * 0.50, reached: false, reachedAt: null },
 { percent: 75, amount: targetAmount * 0.75, reached: false, reachedAt: null },
 { percent: 100, amount: targetAmount, reached: false, reachedAt: null },
 ];

 const { rows } = await pool.query(
 `INSERT INTO pro_earnings_goals (pro_id, goal_type, target_amount, current_amount, start_date, end_date, status, milestones)
 VALUES ($1, $2, $3, 0, $4, $5, 'active', $6)
 RETURNING *`,
 [proId, goalType, targetAmount, startDate, endDate, JSON.stringify(milestones)]
 );

 return {
 goal: rows[0],
 message: ` ${goalType} earnings goal set: $${targetAmount.toLocaleString()}. Let's get it!`,
 };
}

// ─── Get Goal Progress ───────────────────────────────────────────

export async function getGoalProgress(proId: string): Promise<object> {
 // Get active goals
 const { rows: goals } = await pool.query(
 `SELECT * FROM pro_earnings_goals WHERE pro_id = $1 AND status = 'active' ORDER BY created_at DESC`,
 [proId]
 );

 if (goals.length === 0) {
 return { goals: [], message: "No active earnings goals. Set one to start tracking!" };
 }

 const now = new Date();
 const results = [];

 for (const goal of goals) {
 // Calculate actual earnings in the goal period
 const { rows: earnings } = await pool.query(
 `SELECT COALESCE(SUM(final_price), 0)::numeric(10,2) as total
 FROM service_requests
 WHERE hauler_id = $1 AND status = 'completed'
 AND created_at >= $2 AND created_at <= $3`,
 [proId, goal.start_date, goal.end_date]
 );

 const currentAmount = parseFloat(earnings[0]?.total) || 0;
 const targetAmount = parseFloat(goal.target_amount);
 const progressPercent = Math.min(100, parseFloat(((currentAmount / targetAmount) * 100).toFixed(1)));

 // Pace calculation
 const totalDays = Math.max(1, (new Date(goal.end_date).getTime() - new Date(goal.start_date).getTime()) / 86400000);
 const elapsedDays = Math.max(1, (now.getTime() - new Date(goal.start_date).getTime()) / 86400000);
 const expectedPercent = (elapsedDays / totalDays) * 100;
 const pace = progressPercent >= expectedPercent + 5 ? "ahead" : progressPercent <= expectedPercent - 5 ? "behind" : "on-track";

 // Update current_amount
 await pool.query(
 `UPDATE pro_earnings_goals SET current_amount = $1 WHERE id = $2`,
 [currentAmount, goal.id]
 );

 // Check if achieved
 if (currentAmount >= targetAmount && goal.status === "active") {
 await pool.query(
 `UPDATE pro_earnings_goals SET status = 'achieved' WHERE id = $1`,
 [goal.id]
 );
 }

 const daysLeft = Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - now.getTime()) / 86400000));
 const remaining = Math.max(0, targetAmount - currentAmount);
 const dailyNeeded = daysLeft > 0 ? parseFloat((remaining / daysLeft).toFixed(2)) : 0;

 results.push({
 id: goal.id,
 goalType: goal.goal_type,
 targetAmount,
 currentAmount,
 progressPercent,
 pace,
 daysLeft,
 dailyNeeded,
 milestones: goal.milestones,
 progressBar: generateProgressBar(progressPercent),
 });
 }

 return {
 goals: results,
 message: results.map(g =>
 `${g.goalType}: $${g.currentAmount.toFixed(0)}/$${g.targetAmount.toFixed(0)} (${g.progressPercent}%) ${g.progressBar} - ${g.pace === "ahead" ? " Ahead of pace!" : g.pace === "behind" ? ` Need ~$${g.dailyNeeded}/day` : " On track"}`
 ).join("\n"),
 };
}

function generateProgressBar(percent: number): string {
 const filled = Math.round(percent / 10);
 return "█".repeat(filled) + "░".repeat(10 - filled);
}

// ─── Check Milestones ────────────────────────────────────────────

export async function checkMilestones(proId: string): Promise<object> {
 const { rows: goals } = await pool.query(
 `SELECT * FROM pro_earnings_goals WHERE pro_id = $1 AND status = 'active'`,
 [proId]
 );

 const notifications: string[] = [];

 for (const goal of goals) {
 const { rows: earnings } = await pool.query(
 `SELECT COALESCE(SUM(final_price), 0)::numeric(10,2) as total
 FROM service_requests
 WHERE hauler_id = $1 AND status = 'completed'
 AND created_at >= $2 AND created_at <= $3`,
 [proId, goal.start_date, goal.end_date]
 );

 const current = parseFloat(earnings[0]?.total) || 0;
 const target = parseFloat(goal.target_amount);
 const milestones = goal.milestones || [];
 let updated = false;

 for (const m of milestones) {
 if (!m.reached && current >= m.amount) {
 m.reached = true;
 m.reachedAt = new Date().toISOString();
 updated = true;
 notifications.push(` ${m.percent}% milestone hit! $${current.toFixed(0)}/$${target.toFixed(0)} on your ${goal.goal_type} goal.`);
 }
 }

 if (updated) {
 await pool.query(
 `UPDATE pro_earnings_goals SET milestones = $1, current_amount = $2 WHERE id = $3`,
 [JSON.stringify(milestones), current, goal.id]
 );
 }
 }

 return {
 milestonesHit: notifications.length,
 notifications,
 message: notifications.length > 0 ? notifications.join("\n") : "No new milestones - keep grinding! ",
 };
}

// ─── Goal History ────────────────────────────────────────────────

export async function getGoalHistory(proId: string): Promise<object> {
 const { rows: goals } = await pool.query(
 `SELECT * FROM pro_earnings_goals WHERE pro_id = $1 AND status IN ('achieved', 'missed') ORDER BY end_date DESC LIMIT 20`,
 [proId]
 );

 const achieved = goals.filter(g => g.status === "achieved").length;
 const missed = goals.filter(g => g.status === "missed").length;

 return {
 goals: goals.map(g => ({
 goalType: g.goal_type,
 target: parseFloat(g.target_amount),
 actual: parseFloat(g.current_amount),
 status: g.status,
 period: `${g.start_date} - ${g.end_date}`,
 })),
 achieved,
 missed,
 successRate: goals.length > 0 ? parseFloat(((achieved / goals.length) * 100).toFixed(1)) : 0,
 message: goals.length > 0
 ? `${achieved} achieved, ${missed} missed (${((achieved / goals.length) * 100).toFixed(0)}% success rate).`
 : "No completed goals yet. Set your first one!",
 };
}

// ─── Suggest Goal ────────────────────────────────────────────────

export async function suggestGoal(proId: string): Promise<object> {
 // Get recent earnings
 const { rows: recentEarnings } = await pool.query(
 `SELECT COALESCE(SUM(final_price), 0)::numeric(10,2) as total,
 COUNT(*)::int as job_count
 FROM service_requests
 WHERE hauler_id = $1 AND status = 'completed'
 AND created_at > NOW() - INTERVAL '30 days'`,
 [proId]
 );

 const monthlyEarnings = parseFloat(recentEarnings[0]?.total) || 0;
 const monthlyJobs = recentEarnings[0]?.job_count || 0;

 // Get pro's zip for demand forecast
 const { rows: profile } = await pool.query(
 `SELECT service_radius FROM hauler_profiles WHERE user_id = $1 LIMIT 1`,
 [proId]
 );

 const zip = "32801";

 // Suggest 10-15% stretch goal
 const stretchMultiplier = monthlyEarnings > 0 ? 1.12 : 1.0;
 const suggestedWeekly = Math.round((monthlyEarnings * stretchMultiplier) / 4 / 50) * 50 || 500;
 const suggestedMonthly = suggestedWeekly * 4;

 const now = new Date();
 const weekEnd = new Date(now);
 weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
 const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

 return {
 suggestions: [
 {
 goalType: "weekly",
 targetAmount: suggestedWeekly,
 startDate: now.toISOString().split("T")[0],
 endDate: weekEnd.toISOString().split("T")[0],
 reasoning: `Based on ~$${monthlyEarnings.toFixed(0)}/month recent earnings + 12% stretch`,
 },
 {
 goalType: "monthly",
 targetAmount: suggestedMonthly,
 startDate: now.toISOString().split("T")[0],
 endDate: monthEnd.toISOString().split("T")[0],
 reasoning: `4x weekly target for consistent monthly earnings`,
 },
 ],
 recentPerformance: {
 last30DaysEarnings: monthlyEarnings,
 last30DaysJobs: monthlyJobs,
 avgPerJob: monthlyJobs > 0 ? parseFloat((monthlyEarnings / monthlyJobs).toFixed(2)) : 0,
 },
 message: monthlyEarnings > 0
 ? `Based on your recent $${monthlyEarnings.toFixed(0)}/month, I'd suggest a weekly goal of $${suggestedWeekly} (12% stretch). That's ~$${suggestedMonthly}/month. Want to set it?`
 : "Set a starting goal of $500/week and adjust as you build your client base!",
 };
}
