import { MOCK_DEALS, FlashDeal } from '../data/mockDeals';

export function getActiveDeals(): FlashDeal[] {
  return MOCK_DEALS.filter(d => d.category === 'today' && d.endsAt > new Date());
}

export function getUpcomingDeals(): FlashDeal[] {
  return MOCK_DEALS.filter(d => d.category === 'upcoming');
}

export function getPastDeals(): FlashDeal[] {
  return MOCK_DEALS.filter(d => d.category === 'past' || d.endsAt <= new Date());
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
  const deal = MOCK_DEALS.find(d => d.id === dealId);
  if (deal && deal.claimed < deal.totalQuantity) {
    deal.claimed += 1;
    return deal;
  }
  return null;
}
