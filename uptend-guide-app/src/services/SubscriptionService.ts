import { Frequency, SUBSCRIPTION_PLANS, SUBSCRIPTION_BUNDLES, MOCK_ACTIVE_SUBSCRIPTIONS, ActiveSubscription } from '../data/mockSubscriptions';

export function getPlans() {
  return SUBSCRIPTION_PLANS;
}

export function getBundles() {
  return SUBSCRIPTION_BUNDLES;
}

export function getActiveSubscriptions(): ActiveSubscription[] {
  return [...MOCK_ACTIVE_SUBSCRIPTIONS];
}

export function calculateSavings(regularPrice: number, subPrice: number): { amount: number; percent: number } {
  const amount = regularPrice - subPrice;
  const percent = Math.round((amount / regularPrice) * 100);
  return { amount, percent };
}

export function getNextServiceDate(frequency: Frequency, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  switch (frequency) {
    case 'weekly': next.setDate(next.getDate() + 7); break;
    case 'biweekly': next.setDate(next.getDate() + 14); break;
    case 'monthly': next.setMonth(next.getMonth() + 1); break;
    case 'quarterly': next.setMonth(next.getMonth() + 3); break;
  }
  return next;
}

export function totalMonthlyCost(subscriptions: ActiveSubscription[]): number {
  return subscriptions.filter(s => !s.isPaused).reduce((sum, s) => {
    switch (s.frequency) {
      case 'weekly': return sum + s.price * 4.33;
      case 'biweekly': return sum + s.price * 2.17;
      case 'monthly': return sum + s.price;
      case 'quarterly': return sum + s.price / 3;
    }
  }, 0);
}
