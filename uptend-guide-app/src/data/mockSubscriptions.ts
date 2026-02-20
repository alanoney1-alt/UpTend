export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

export interface SubscriptionPlan {
  id: string;
  serviceName: string;
  icon: string;
  frequencies: Frequency[];
  pricing: Record<Frequency, number>;
  regularPrice: Record<Frequency, number>;
  description: string;
}

export interface SubscriptionBundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  monthlyPrice: number;
  regularMonthlyPrice: number;
  discountPercent: number;
  icon: string;
}

export interface ActiveSubscription {
  id: string;
  serviceName: string;
  icon: string;
  frequency: Frequency;
  price: number;
  nextServiceDate: string;
  preferredDay: string;
  preferredTime: string;
  proName: string;
  isPaused: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'sp1', serviceName: 'Lawn Care', icon: '🌱', frequencies: ['weekly', 'biweekly', 'monthly'], pricing: { weekly: 34, biweekly: 36, monthly: 55, quarterly: 0 }, regularPrice: { weekly: 40, biweekly: 42, monthly: 65, quarterly: 0 }, description: 'Mow, edge, blow + weed treatment' },
  { id: 'sp2', serviceName: 'Pool Cleaning', icon: '🏊', frequencies: ['weekly', 'biweekly', 'monthly'], pricing: { weekly: 25, biweekly: 30, monthly: 50, quarterly: 0 }, regularPrice: { weekly: 30, biweekly: 35, monthly: 59, quarterly: 0 }, description: 'Chemical balance, skim, brush, filter check' },
  { id: 'sp3', serviceName: 'House Cleaning', icon: '🧹', frequencies: ['weekly', 'biweekly', 'monthly'], pricing: { weekly: 102, biweekly: 110, monthly: 170, quarterly: 0 }, regularPrice: { weekly: 120, biweekly: 129, monthly: 200, quarterly: 0 }, description: 'Full house clean — kitchen, baths, floors, dusting' },
  { id: 'sp4', serviceName: 'Gutter Cleaning', icon: '🏗️', frequencies: ['quarterly'], pricing: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 110 }, regularPrice: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 130 }, description: 'Full gutter clean + downspout flush' },
  { id: 'sp5', serviceName: 'Pressure Washing', icon: '💦', frequencies: ['quarterly'], pricing: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 145 }, regularPrice: { weekly: 0, biweekly: 0, monthly: 0, quarterly: 170 }, description: 'Driveway + walkways + patio' },
  { id: 'sp6', serviceName: 'Window Cleaning', icon: '✨', frequencies: ['monthly', 'quarterly'], pricing: { weekly: 0, biweekly: 0, monthly: 80, quarterly: 95 }, regularPrice: { weekly: 0, biweekly: 0, monthly: 95, quarterly: 112 }, description: 'Interior + exterior, all windows' },
  { id: 'sp7', serviceName: 'Pest Control', icon: '🐜', frequencies: ['monthly', 'quarterly'], pricing: { weekly: 0, biweekly: 0, monthly: 34, quarterly: 85 }, regularPrice: { weekly: 0, biweekly: 0, monthly: 40, quarterly: 100 }, description: 'Interior + exterior spray treatment' },
];

export const SUBSCRIPTION_BUNDLES: SubscriptionBundle[] = [
  { id: 'sb1', name: 'Home Essentials', description: 'Cleaning + Lawn + Pool — everything a home needs', services: ['House Cleaning', 'Lawn Care', 'Pool Cleaning'], monthlyPrice: 248, regularMonthlyPrice: 310, discountPercent: 20, icon: '🏠' },
  { id: 'sb2', name: 'Curb Appeal', description: 'Lawn + Pressure Washing + Window Cleaning', services: ['Lawn Care', 'Pressure Washing', 'Window Cleaning'], monthlyPrice: 155, regularMonthlyPrice: 194, discountPercent: 20, icon: '✨' },
  { id: 'sb3', name: 'Total Home Care', description: 'Everything — the ultimate package', services: ['House Cleaning', 'Lawn Care', 'Pool Cleaning', 'Gutter Cleaning', 'Pest Control'], monthlyPrice: 395, regularMonthlyPrice: 494, discountPercent: 20, icon: '👑' },
];

export const MOCK_ACTIVE_SUBSCRIPTIONS: ActiveSubscription[] = [
  { id: 'as1', serviceName: 'Lawn Care', icon: '🌱', frequency: 'biweekly', price: 36, nextServiceDate: '2026-02-18', preferredDay: 'Tuesday', preferredTime: '9:00 AM', proName: 'Miguel R.', isPaused: false },
  { id: 'as2', serviceName: 'Pool Cleaning', icon: '🏊', frequency: 'weekly', price: 25, nextServiceDate: '2026-02-14', preferredDay: 'Friday', preferredTime: '8:00 AM', proName: 'Ana S.', isPaused: false },
];
