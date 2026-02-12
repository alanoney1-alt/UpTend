export type ActivityType = 'service' | 'stat' | 'booking' | 'pro' | 'group_deal' | 'weather';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  emoji: string;
  text: string;
  neighborhood: string;
  timeAgo: string;
  thumbnail?: string;
  actionLabel?: string;
}

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'service', emoji: '🏠', text: 'A home in Winter Park just got their driveway pressure washed', neighborhood: 'Winter Park', timeAgo: '15 min ago', thumbnail: 'https://picsum.photos/seed/act1/100/100', actionLabel: 'Get a quote' },
  { id: 'a2', type: 'weather', emoji: '🌧️', text: 'Heavy rain expected Friday — 12 neighbors scheduling gutter cleaning', neighborhood: 'Lake Nona', timeAgo: '30 min ago', actionLabel: 'Schedule now' },
  { id: 'a3', type: 'pro', emoji: '🌟', text: 'New pro Carlos M. joined your area — rated 4.9 ⭐', neighborhood: 'Dr. Phillips', timeAgo: '1 hour ago', actionLabel: 'View profile' },
  { id: 'a4', type: 'booking', emoji: '⚡', text: '5 homes near you booked gutter cleaning this week', neighborhood: 'College Park', timeAgo: '2 hours ago', actionLabel: 'Book yours' },
  { id: 'a5', type: 'group_deal', emoji: '🏘️', text: 'Group deal: 3 neighbors need lawn care. Join for 20% off!', neighborhood: 'Baldwin Park', timeAgo: '3 hours ago', actionLabel: 'Join deal' },
  { id: 'a6', type: 'stat', emoji: '📊', text: 'Home scores in your neighborhood averaged 73 this month', neighborhood: 'Winter Park', timeAgo: '4 hours ago', actionLabel: 'See yours' },
  { id: 'a7', type: 'service', emoji: '🏠', text: 'A home in Thornton Park just got a full deep clean', neighborhood: 'Thornton Park', timeAgo: '5 hours ago', thumbnail: 'https://picsum.photos/seed/act7/100/100', actionLabel: 'Get a quote' },
  { id: 'a8', type: 'booking', emoji: '⚡', text: '8 pool cleanings booked in your area this week', neighborhood: 'Windermere', timeAgo: '6 hours ago', actionLabel: 'Book yours' },
  { id: 'a9', type: 'pro', emoji: '🌟', text: 'Pro Ana S. just hit 100 five-star reviews!', neighborhood: 'Celebration', timeAgo: '8 hours ago', actionLabel: 'View profile' },
  { id: 'a10', type: 'service', emoji: '🏠', text: 'Tree trimming completed in Maitland — massive oak tamed', neighborhood: 'Maitland', timeAgo: '10 hours ago', thumbnail: 'https://picsum.photos/seed/act10/100/100', actionLabel: 'Get a quote' },
  { id: 'a11', type: 'weather', emoji: '☀️', text: 'Heat wave incoming — 15 homes booking AC tune-ups', neighborhood: 'MetroWest', timeAgo: '12 hours ago', actionLabel: 'Schedule now' },
  { id: 'a12', type: 'group_deal', emoji: '🏘️', text: 'Group deal: 5 homes need pressure washing. 25% off!', neighborhood: 'Hunters Creek', timeAgo: '14 hours ago', actionLabel: 'Join deal' },
  { id: 'a13', type: 'stat', emoji: '📊', text: 'Average home score in your area rose 4 points this month!', neighborhood: 'Lake Nona', timeAgo: '1 day ago', actionLabel: 'Check yours' },
  { id: 'a14', type: 'service', emoji: '🏠', text: 'Fence repair just completed in Avalon Park', neighborhood: 'Avalon Park', timeAgo: '1 day ago', thumbnail: 'https://picsum.photos/seed/act14/100/100', actionLabel: 'Get a quote' },
  { id: 'a15', type: 'booking', emoji: '⚡', text: '3 homes near you booked window cleaning today', neighborhood: 'Winter Garden', timeAgo: '1 day ago', actionLabel: 'Book yours' },
  { id: 'a16', type: 'pro', emoji: '🌟', text: 'Pro Derek L. is offering 10% off gutter cleaning this week', neighborhood: 'College Park', timeAgo: '1 day ago', actionLabel: 'Claim offer' },
  { id: 'a17', type: 'service', emoji: '🏠', text: 'Move-out deep clean completed in Lake Mary', neighborhood: 'Lake Mary', timeAgo: '2 days ago', thumbnail: 'https://picsum.photos/seed/act17/100/100', actionLabel: 'Get a quote' },
  { id: 'a18', type: 'group_deal', emoji: '🏘️', text: 'Group deal: Holiday light installation — 4 spots left', neighborhood: 'Dr. Phillips', timeAgo: '2 days ago', actionLabel: 'Join deal' },
  { id: 'a19', type: 'weather', emoji: '🍂', text: 'Fall leaf season starting — schedule your gutter cleaning early', neighborhood: 'Winter Park', timeAgo: '2 days ago', actionLabel: 'Schedule now' },
  { id: 'a20', type: 'stat', emoji: '📊', text: '23 services completed in your neighborhood this week', neighborhood: 'Baldwin Park', timeAgo: '3 days ago' },
  { id: 'a21', type: 'booking', emoji: '⚡', text: 'Landscaping is the #1 booked service in your area', neighborhood: 'Celebration', timeAgo: '3 days ago', actionLabel: 'Book yours' },
];
