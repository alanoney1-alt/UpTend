// ProAvailabilityAPI.ts — REST API for pro availability
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'https://uptendapp.com' : 'https://api.uptend.com';

export interface ProLocation {
  id: string;
  firstName: string;
  lastInitial: string;
  photoUrl: string | null;
  rating: number;
  reviewCount: number;
  services: ServiceChip[];
  lat: number;
  lng: number;
  status: 'available' | 'busy' | 'finishing_soon' | 'offline';
  estimatedDoneMin?: number;
  distanceMiles?: number;
  responseTimeMin: number;
  priceRange: 'budget' | 'mid' | 'premium';
  bio?: string;
  completedJobs: number;
  memberSince: string;
}

export interface ServiceChip {
  id: string;
  name: string;
  icon: string;
}

// Mock data — realistic Orlando area pros
const MOCK_PROS: ProLocation[] = [
  {
    id: 'pro_1', firstName: 'Marcus', lastInitial: 'J', photoUrl: null,
    rating: 4.9, reviewCount: 127, services: [
      { id: 'junk', name: 'Junk Removal', icon: '🗑️' },
      { id: 'moving', name: 'Moving Help', icon: '📦' },
    ],
    lat: 28.5505, lng: -81.3780, status: 'available', distanceMiles: 1.2,
    responseTimeMin: 2, priceRange: 'mid', bio: 'Orlando native. 5 years hauling experience.',
    completedJobs: 312, memberSince: 'Jan 2024',
  },
  {
    id: 'pro_2', firstName: 'Carlos', lastInitial: 'R', photoUrl: null,
    rating: 4.95, reviewCount: 203, services: [
      { id: 'pressure', name: 'Pressure Washing', icon: '💦' },
      { id: 'gutter', name: 'Gutter Cleaning', icon: '🏠' },
    ],
    lat: 28.5590, lng: -81.3650, status: 'available', distanceMiles: 2.3,
    responseTimeMin: 1, priceRange: 'mid', bio: 'Top-rated pressure washer in Central FL.',
    completedJobs: 485, memberSince: 'Mar 2023',
  },
  {
    id: 'pro_3', firstName: 'Mike', lastInitial: 'T', photoUrl: null,
    rating: 4.85, reviewCount: 89, services: [
      { id: 'lawn', name: 'Lawn Care', icon: '🌿' },
      { id: 'landscape', name: 'Landscaping', icon: '🌳' },
    ],
    lat: 28.5420, lng: -81.3900, status: 'finishing_soon', estimatedDoneMin: 25,
    distanceMiles: 0.8, responseTimeMin: 5, priceRange: 'budget',
    bio: 'Your yard, my passion.', completedJobs: 198, memberSince: 'Jun 2024',
  },
  {
    id: 'pro_4', firstName: 'Sarah', lastInitial: 'C', photoUrl: null,
    rating: 4.92, reviewCount: 156, services: [
      { id: 'clean', name: 'Deep Cleaning', icon: '🧹' },
      { id: 'organize', name: 'Organization', icon: '📋' },
    ],
    lat: 28.5610, lng: -81.3720, status: 'available', distanceMiles: 3.1,
    responseTimeMin: 3, priceRange: 'premium', bio: 'Spotless every time. Guaranteed.',
    completedJobs: 340, memberSince: 'Sep 2023',
  },
  {
    id: 'pro_5', firstName: 'David', lastInitial: 'W', photoUrl: null,
    rating: 4.78, reviewCount: 64, services: [
      { id: 'handyman', name: 'Handyman', icon: '🔧' },
      { id: 'paint', name: 'Painting', icon: '🎨' },
      { id: 'electric', name: 'Electrical', icon: '⚡' },
    ],
    lat: 28.5480, lng: -81.3580, status: 'busy', estimatedDoneMin: 90,
    distanceMiles: 4.5, responseTimeMin: 8, priceRange: 'mid',
    bio: 'Jack of all trades, master of most.', completedJobs: 145, memberSince: 'Nov 2024',
  },
  {
    id: 'pro_6', firstName: 'Maria', lastInitial: 'L', photoUrl: null,
    rating: 4.88, reviewCount: 112, services: [
      { id: 'clean', name: 'House Cleaning', icon: '🧹' },
      { id: 'laundry', name: 'Laundry', icon: '👕' },
    ],
    lat: 28.5550, lng: -81.3830, status: 'available', distanceMiles: 1.8,
    responseTimeMin: 2, priceRange: 'budget', bio: 'Se habla español. 10+ years experience.',
    completedJobs: 267, memberSince: 'May 2023',
  },
  {
    id: 'pro_7', firstName: 'Jake', lastInitial: 'P', photoUrl: null,
    rating: 4.80, reviewCount: 45, services: [
      { id: 'pool', name: 'Pool Cleaning', icon: '🏊' },
      { id: 'pest', name: 'Pest Control', icon: '🐛' },
    ],
    lat: 28.5630, lng: -81.3560, status: 'finishing_soon', estimatedDoneMin: 10,
    distanceMiles: 5.2, responseTimeMin: 4, priceRange: 'mid',
    bio: 'Pool and outdoor specialist.', completedJobs: 98, memberSince: 'Feb 2025',
  },
  {
    id: 'pro_8', firstName: 'Tom', lastInitial: 'B', photoUrl: null,
    rating: 4.70, reviewCount: 33, services: [
      { id: 'junk', name: 'Junk Removal', icon: '🗑️' },
    ],
    lat: 28.5460, lng: -81.3700, status: 'available', distanceMiles: 2.0,
    responseTimeMin: 6, priceRange: 'budget', bio: 'Fast and reliable junk hauling.',
    completedJobs: 67, memberSince: 'Aug 2025',
  },
  {
    id: 'pro_9', firstName: 'Jessica', lastInitial: 'M', photoUrl: null,
    rating: 4.93, reviewCount: 178, services: [
      { id: 'clean', name: 'Deep Cleaning', icon: '🧹' },
      { id: 'organize', name: 'Organization', icon: '📋' },
      { id: 'laundry', name: 'Laundry', icon: '👕' },
    ],
    lat: 28.5320, lng: -81.3850, status: 'available', distanceMiles: 1.5,
    responseTimeMin: 1, priceRange: 'premium', bio: 'Detail-oriented perfectionist. 5-star guarantee.',
    completedJobs: 412, memberSince: 'Jan 2023',
  },
  {
    id: 'pro_10', firstName: 'Andre', lastInitial: 'K', photoUrl: null,
    rating: 4.82, reviewCount: 91, services: [
      { id: 'pressure', name: 'Pressure Washing', icon: '💦' },
      { id: 'paint', name: 'Painting', icon: '🎨' },
    ],
    lat: 28.5440, lng: -81.3950, status: 'finishing_soon', estimatedDoneMin: 15,
    distanceMiles: 2.8, responseTimeMin: 3, priceRange: 'mid',
    bio: 'Exterior specialist. Before & after photos every job.',
    completedJobs: 203, memberSince: 'Jul 2024',
  },
  {
    id: 'pro_11', firstName: 'Ray', lastInitial: 'S', photoUrl: null,
    rating: 4.75, reviewCount: 56, services: [
      { id: 'lawn', name: 'Lawn Care', icon: '🌿' },
      { id: 'landscape', name: 'Landscaping', icon: '🌳' },
      { id: 'pest', name: 'Pest Control', icon: '🐛' },
    ],
    lat: 28.5570, lng: -81.3680, status: 'available', distanceMiles: 3.4,
    responseTimeMin: 7, priceRange: 'budget', bio: 'Full yard service. Mow, edge, trim, blow.',
    completedJobs: 134, memberSince: 'Apr 2025',
  },
  {
    id: 'pro_12', firstName: 'Lisa', lastInitial: 'H', photoUrl: null,
    rating: 4.97, reviewCount: 234, services: [
      { id: 'clean', name: 'House Cleaning', icon: '🧹' },
    ],
    lat: 28.5290, lng: -81.3730, status: 'available', distanceMiles: 1.0,
    responseTimeMin: 2, priceRange: 'premium', bio: 'Eco-friendly products only. 8 years in Orlando.',
    completedJobs: 567, memberSince: 'Feb 2022',
  },
  {
    id: 'pro_13', firstName: 'Kevin', lastInitial: 'D', photoUrl: null,
    rating: 4.68, reviewCount: 42, services: [
      { id: 'handyman', name: 'Handyman', icon: '🔧' },
      { id: 'electric', name: 'Electrical', icon: '⚡' },
      { id: 'plumb', name: 'Plumbing', icon: '🚿' },
    ],
    lat: 28.5510, lng: -81.3520, status: 'finishing_soon', estimatedDoneMin: 35,
    distanceMiles: 4.1, responseTimeMin: 10, priceRange: 'mid',
    bio: 'Licensed & insured. No job too small.',
    completedJobs: 89, memberSince: 'Oct 2025',
  },
  {
    id: 'pro_14', firstName: 'Vanessa', lastInitial: 'R', photoUrl: null,
    rating: 4.89, reviewCount: 167, services: [
      { id: 'pool', name: 'Pool Cleaning', icon: '🏊' },
      { id: 'pressure', name: 'Pressure Washing', icon: '💦' },
    ],
    lat: 28.5350, lng: -81.3610, status: 'available', distanceMiles: 2.6,
    responseTimeMin: 4, priceRange: 'mid', bio: 'Crystal clear pools, sparkling driveways.',
    completedJobs: 298, memberSince: 'May 2024',
  },
];

async function getToken(): Promise<string | null> {
  try { return await (await import('expo-secure-store')).getItemAsync('uptend_auth_token'); }
  catch { return null; }
}

async function apiGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers });
    if (res.ok) return res.json();
  } catch {}
  // Fallback to mock
  throw new Error('API unavailable');
}

async function apiPost<T>(path: string, body: any): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
    if (res.ok) return res.json();
  } catch {}
  throw new Error('API unavailable');
}

// --- Public API ---

export async function getAvailableProsNearby(
  lat: number, lng: number, radiusMiles: number = 10
): Promise<ProLocation[]> {
  try {
    return await apiGet(`/api/pros/available/nearby?lat=${lat}&lng=${lng}&radius=${radiusMiles}`);
  } catch {
    // Return mock data with randomized offsets for privacy
    return MOCK_PROS.map(p => ({
      ...p,
      lat: p.lat + (Math.random() - 0.5) * 0.008, // ~0.5 mile offset
      lng: p.lng + (Math.random() - 0.5) * 0.008,
    }));
  }
}

export async function getProProfile(proId: string): Promise<ProLocation | null> {
  try {
    return await apiGet(`/api/pros/${proId}/profile`);
  } catch {
    return MOCK_PROS.find(p => p.id === proId) || null;
  }
}

export async function goOnline(lat: number, lng: number): Promise<{ customersNearby: number }> {
  try {
    return await apiPost('/api/pros/go-online', { lat, lng });
  } catch {
    return { customersNearby: Math.floor(Math.random() * 20) + 5 };
  }
}

export async function goOffline(): Promise<void> {
  try {
    await apiPost('/api/pros/go-offline', {});
  } catch {}
}

export async function updateProLocation(lat: number, lng: number): Promise<void> {
  try {
    await apiPost('/api/pros/update-location', { lat, lng });
  } catch {}
}

export function getMockPros(): ProLocation[] {
  return MOCK_PROS;
}
