import { FlashDeal } from '../types/models';

const deals: FlashDeal[] = [];

export function getActiveDeals(): FlashDeal[] {
  return deals.filter(d => d.category === 'today' && d.endsAt > new Date());
}

export function getUpcomingDeals(): FlashDeal[] {
  return deals.filter(d => d.category === 'upcoming');
}

export function getPastDeals(): FlashDeal[] {
  return deals.filter(d => d.category === 'past' || d.endsAt <= new Date());
}

export function formatCountdown(endsAt: Date): string {
  const diff = endsAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function claimDeal(dealId: string): FlashDeal | null {
  const deal = deals.find(d => d.id === dealId);
  if (deal && deal.claimed < deal.totalQuantity) {
    deal.claimed += 1;
    return deal;
  }
  return null;
}
