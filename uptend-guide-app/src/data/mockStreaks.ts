export interface StreakMilestone {
  weeks: number;
  badge: string;
  emoji: string;
  name: string;
  discount: number;
  description: string;
  unlocked: boolean;
}

export interface WeekData {
  weekStart: string;
  servicesCount: number;
  services: string[];
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { weeks: 4, badge: 'Starter', emoji: '🌱', name: 'Starter', discount: 0, description: 'Maintain your home for 4 consecutive weeks', unlocked: true },
  { weeks: 8, badge: 'Committed', emoji: '💪', name: 'Committed', discount: 5, description: '8 weeks strong — 5% off your next service', unlocked: true },
  { weeks: 12, badge: 'Dedicated', emoji: '⭐', name: 'Dedicated', discount: 10, description: '3 months of consistency — 10% off', unlocked: true },
  { weeks: 26, badge: 'Home Hero', emoji: '🏆', name: 'Home Hero', discount: 15, description: 'Half a year! 15% off + neighborhood recognition', unlocked: false },
  { weeks: 52, badge: 'Legend', emoji: '👑', name: 'Legend', discount: 20, description: 'A full year — 20% off + featured in your area', unlocked: false },
];

// Generate 52 weeks of mock data (current week back)
function generateWeekData(): WeekData[] {
  const weeks: WeekData[] = [];
  const services = ['Lawn Care', 'Pool Cleaning', 'House Cleaning', 'Gutter Cleaning', 'Pressure Washing'];
  const now = new Date();
  for (let i = 51; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const dateStr = weekStart.toISOString().split('T')[0];
    // Current streak: 14 weeks, then a gap, then sporadic
    let count = 0;
    let weekServices: string[] = [];
    if (i <= 13) {
      // Active streak
      count = Math.floor(Math.random() * 3) + 1;
      weekServices = services.slice(0, count);
    } else if (i >= 20 && i <= 30) {
      // Earlier active period
      count = Math.random() > 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;
      weekServices = count > 0 ? services.slice(0, count) : [];
    } else {
      count = Math.random() > 0.6 ? 1 : 0;
      weekServices = count > 0 ? [services[Math.floor(Math.random() * services.length)]] : [];
    }
    weeks.push({ weekStart: dateStr, servicesCount: count, services: weekServices });
  }
  return weeks;
}

export const MOCK_WEEK_DATA = generateWeekData();

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'The Martinez Home', neighborhood: 'Winter Park', streak: 28, badge: '🏆' },
  { rank: 2, name: 'The Chen Residence', neighborhood: 'Lake Nona', streak: 22, badge: '🏆' },
  { rank: 3, name: 'Your Home', neighborhood: 'Dr. Phillips', streak: 14, badge: '⭐', isUser: true },
  { rank: 4, name: 'The Johnson Home', neighborhood: 'Baldwin Park', streak: 12, badge: '⭐' },
  { rank: 5, name: 'The Garcia Family', neighborhood: 'Celebration', streak: 10, badge: '💪' },
  { rank: 6, name: 'The Williams Home', neighborhood: 'Windermere', streak: 8, badge: '💪' },
  { rank: 7, name: 'The Brown Residence', neighborhood: 'College Park', streak: 6, badge: '🌱' },
  { rank: 8, name: 'The Davis Home', neighborhood: 'Thornton Park', streak: 4, badge: '🌱' },
];
