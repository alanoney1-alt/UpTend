/**
 * Home Health Score calculation engine.
 * Computes a 0-100 score across 6 categories, decreasing over time
 * based on service intervals and increasing when services complete.
 */

export interface CategoryScore {
  id: string;
  name: string;
  emoji: string;
  score: number;
  lastServiceDate: string | null;
  intervalDays: number;
  overdue: boolean;
  suggestion: string;
  pointsToGain: number;
}

export interface HomeHealthResult {
  totalScore: number;
  categories: CategoryScore[];
  history: { date: string; score: number }[];
}

const CATEGORIES = [
  { id: 'exterior', name: 'Exterior', emoji: '🏠', intervalDays: 365, services: ['Pressure Washing', 'Roof Cleaning', 'Painting'] },
  { id: 'landscaping', name: 'Landscaping', emoji: '🌿', intervalDays: 14, services: ['Lawn Care', 'Tree Trimming', 'Landscaping'] },
  { id: 'cleanliness', name: 'Cleanliness', emoji: '🧹', intervalDays: 30, services: ['House Cleaning', 'Window Cleaning', 'Carpet Cleaning'] },
  { id: 'systems', name: 'Systems', emoji: '🔧', intervalDays: 180, services: ['HVAC Service', 'Plumbing', 'Electrical'] },
  { id: 'pool', name: 'Pool', emoji: '🏊', intervalDays: 7, services: ['Pool Cleaning'] },
  { id: 'structure', name: 'Structure', emoji: '🏗️', intervalDays: 180, services: ['Gutter Cleaning', 'Foundation', 'Driveway'] },
];

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function categoryScore(lastService: string | null, intervalDays: number): number {
  const days = daysSince(lastService);
  if (days <= intervalDays * 0.5) return 100;
  if (days <= intervalDays) return 85;
  if (days <= intervalDays * 1.5) return 65;
  if (days <= intervalDays * 2) return 45;
  if (days <= intervalDays * 3) return 25;
  return 10;
}

// Seasonal adjustments: boost importance of certain categories by season
function seasonalMultiplier(categoryId: string): number {
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) { // summer
    if (categoryId === 'pool') return 1.3;
    if (categoryId === 'landscaping') return 1.2;
    if (categoryId === 'systems') return 1.1; // AC important
  }
  if (month >= 9 && month <= 11) { // fall
    if (categoryId === 'structure') return 1.3; // gutters
    if (categoryId === 'exterior') return 1.1;
  }
  return 1.0;
}

export function calculateHomeHealth(serviceHistory: Record<string, string | null>): HomeHealthResult {
  const categories: CategoryScore[] = CATEGORIES.map(cat => {
    const lastDate = serviceHistory[cat.id] ?? null;
    const raw = categoryScore(lastDate, cat.intervalDays);
    const multiplier = seasonalMultiplier(cat.id);
    const score = Math.min(100, Math.round(raw * multiplier));
    const overdue = daysSince(lastDate) > cat.intervalDays;
    const pointsToGain = Math.min(20, Math.round((100 - score) * 0.4));
    const suggestion = overdue
      ? `Complete ${cat.services[0]} to gain +${pointsToGain} points`
      : `${cat.name} is in good shape!`;
    return { id: cat.id, name: cat.name, emoji: cat.emoji, score, lastServiceDate: lastDate, intervalDays: cat.intervalDays, overdue, suggestion, pointsToGain };
  });

  const totalScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);

  // Mock 6-month history
  const history: { date: string; score: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    history.push({ date: d.toISOString().slice(0, 7), score: Math.max(30, Math.min(95, totalScore + Math.round((Math.random() - 0.5) * 20 - i * 3))) });
  }
  history.push({ date: new Date().toISOString().slice(0, 7), score: totalScore });

  return { totalScore, categories, history };
}

// Default mock service history
export const MOCK_SERVICE_HISTORY: Record<string, string | null> = {
  exterior: '2025-09-15',
  landscaping: '2026-02-05',
  cleanliness: '2026-01-20',
  systems: '2025-08-10',
  pool: '2026-02-10',
  structure: '2025-06-01',
};
