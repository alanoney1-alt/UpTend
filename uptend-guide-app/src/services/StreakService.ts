import { WeekData, StreakMilestone, STREAK_MILESTONES } from '../types/models';

export function getCurrentStreak(weeks: WeekData[] = []): number {
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].servicesCount > 0) streak++;
    else break;
  }
  return streak;
}

export function getLongestStreak(weeks: WeekData[] = []): number {
  let max = 0, current = 0;
  for (const w of weeks) {
    if (w.servicesCount > 0) { current++; max = Math.max(max, current); }
    else current = 0;
  }
  return max;
}

export function getMilestoneProgress(currentStreak: number): { current: StreakMilestone | null; next: StreakMilestone | null; progress: number } {
  let current: StreakMilestone | null = null;
  let next: StreakMilestone | null = null;
  for (const m of STREAK_MILESTONES) {
    if (currentStreak >= m.weeks) current = m;
    else { next = m; break; }
  }
  if (next && current) {
    const progress = (currentStreak - current.weeks) / (next.weeks - current.weeks);
    return { current, next, progress: Math.min(1, progress) };
  }
  return { current, next, progress: next ? currentStreak / next.weeks : 1 };
}

export function getDiscountForStreak(currentStreak: number): number {
  let discount = 0;
  for (const m of STREAK_MILESTONES) {
    if (currentStreak >= m.weeks) discount = m.discount;
  }
  return discount;
}
