// Shared type definitions for UpTend app

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  icon?: string;
  imageUrl?: string;
  actionLabel?: string;
  emoji?: string;
  text?: string;
  neighborhood?: string;
  timeAgo?: string;
  thumbnail?: string;
}

export interface WeekData {
  weekStart: string;
  servicesCount: number;
  label?: string;
}

export interface StreakMilestone {
  weeks: number;
  label: string;
  discount: number;
  icon?: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { weeks: 4, label: '1 Month', discount: 5, icon: '🌱' },
  { weeks: 8, label: '2 Months', discount: 8, icon: '🌿' },
  { weeks: 12, label: '3 Months', discount: 10, icon: '🌳' },
  { weeks: 24, label: '6 Months', discount: 15, icon: '🏆' },
  { weeks: 52, label: '1 Year', discount: 20, icon: '👑' },
];

export interface Transformation {
  id: string;
  serviceType: string;
  neighborhood: string;
  beforeImage: string;
  afterImage: string;
  proName: string;
  proAvatar?: string;
  description?: string;
  reactions: { heart: number; fire: number; love: number };
  createdAt: string;
  proRating?: number;
  timeAgo?: string;
  serviceEmoji?: string;
}

export interface FlashDeal {
  id: string;
  title: string;
  description: string;
  category: 'today' | 'upcoming' | 'past';
  originalPrice: number;
  dealPrice: number;
  discount: number;
  claimed: number;
  totalQuantity: number;
  endsAt: Date;
  serviceType: string;
  proName?: string;
  imageUrl?: string;
}

export type TipCategory = 'maintenance' | 'seasonal' | 'diy' | 'safety' | 'efficiency' | 'curb_appeal';

export interface ProTip {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: TipCategory;
  imageUrl?: string;
  isTipOfDay?: boolean;
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: Frequency;
  features: string[];
}

export interface SubscriptionBundle {
  id: string;
  name: string;
  plans: string[];
  discount: number;
  price: number;
}

export interface ActiveSubscription {
  id: string;
  planId: string;
  name: string;
  price: number;
  frequency: Frequency;
  nextServiceDate: string;
  isPaused: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'lawn-weekly', name: 'Lawn Care', description: 'Weekly lawn maintenance', price: 49, frequency: 'weekly', features: ['Mowing', 'Edging', 'Blowing'] },
  { id: 'cleaning-biweekly', name: 'Home Cleaning', description: 'Bi-weekly deep clean', price: 129, frequency: 'biweekly', features: ['Kitchen', 'Bathrooms', 'Common Areas'] },
  { id: 'pressure-monthly', name: 'Pressure Washing', description: 'Monthly pressure wash', price: 89, frequency: 'monthly', features: ['Driveway', 'Walkways', 'Patio'] },
  { id: 'pest-quarterly', name: 'Pest Control', description: 'Quarterly treatment', price: 79, frequency: 'quarterly', features: ['Interior', 'Exterior', 'Prevention'] },
];

export const SUBSCRIPTION_BUNDLES: SubscriptionBundle[] = [
  { id: 'home-essentials', name: 'Home Essentials', plans: ['lawn-weekly', 'cleaning-biweekly'], discount: 15, price: 151 },
  { id: 'total-care', name: 'Total Home Care', plans: ['lawn-weekly', 'cleaning-biweekly', 'pressure-monthly', 'pest-quarterly'], discount: 20, price: 277 },
];
