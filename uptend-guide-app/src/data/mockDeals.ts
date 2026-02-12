export interface FlashDeal {
  id: string;
  serviceName: string;
  image: string;
  originalPrice: number;
  dealPrice: number;
  savingsPercent: number;
  endsAt: Date;
  totalQuantity: number;
  claimed: number;
  category: 'today' | 'upcoming' | 'past';
  description: string;
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000);

export const MOCK_DEALS: FlashDeal[] = [
  { id: 'd1', serviceName: 'Lawn Mowing', image: 'https://picsum.photos/seed/deal-lawn/400/250', originalPrice: 85, dealPrice: 49, savingsPercent: 42, endsAt: hoursFromNow(2), totalQuantity: 10, claimed: 7, category: 'today', description: 'Full lawn mow + edge + blow for standard lots' },
  { id: 'd2', serviceName: 'Pressure Washing', image: 'https://picsum.photos/seed/deal-pw/400/250', originalPrice: 200, dealPrice: 99, savingsPercent: 50, endsAt: hoursFromNow(5), totalQuantity: 8, claimed: 5, category: 'today', description: 'Driveway + walkway pressure wash up to 1000 sqft' },
  { id: 'd3', serviceName: 'Pool Cleaning', image: 'https://picsum.photos/seed/deal-pool/400/250', originalPrice: 69, dealPrice: 39, savingsPercent: 43, endsAt: hoursFromNow(8), totalQuantity: 15, claimed: 9, category: 'today', description: 'First month of weekly pool service' },
  { id: 'd4', serviceName: 'Gutter Cleaning', image: 'https://picsum.photos/seed/deal-gutter/400/250', originalPrice: 150, dealPrice: 79, savingsPercent: 47, endsAt: hoursFromNow(12), totalQuantity: 12, claimed: 4, category: 'today', description: 'Full gutter clean + downspout flush' },
  { id: 'd5', serviceName: 'Deep House Cleaning', image: 'https://picsum.photos/seed/deal-clean/400/250', originalPrice: 250, dealPrice: 149, savingsPercent: 40, endsAt: hoursFromNow(24), totalQuantity: 6, claimed: 2, category: 'today', description: '3-bed / 2-bath deep clean + windows' },
  { id: 'd6', serviceName: 'Tree Trimming', image: 'https://picsum.photos/seed/deal-tree/400/250', originalPrice: 300, dealPrice: 189, savingsPercent: 37, endsAt: hoursFromNow(48), totalQuantity: 5, claimed: 0, category: 'upcoming', description: 'Up to 3 trees trimmed and debris hauled' },
  { id: 'd7', serviceName: 'Junk Removal', image: 'https://picsum.photos/seed/deal-junk/400/250', originalPrice: 175, dealPrice: 99, savingsPercent: 43, endsAt: hoursFromNow(72), totalQuantity: 10, claimed: 0, category: 'upcoming', description: 'Half truck load junk removal' },
  { id: 'd8', serviceName: 'Window Cleaning', image: 'https://picsum.photos/seed/deal-window/400/250', originalPrice: 120, dealPrice: 69, savingsPercent: 42, endsAt: new Date(Date.now() - 86400000), totalQuantity: 8, claimed: 8, category: 'past', description: 'Interior + exterior up to 20 windows' },
];
