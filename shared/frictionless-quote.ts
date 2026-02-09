/**
 * Frictionless Quote Flow
 * Customer can get AI quote without logging in
 * Login only required at payment step
 */

export interface AddressData {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  yearBuilt?: number;
  propertyType?: string;
  estimatedValue?: number;
}

export interface PhotoAnalysisQuote {
  identifiedItems: string[];
  estimatedVolumeCubicFt: number;
  recommendedLoadSize: string;
  confidence: number;
  suggestedPrice: number;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  estimatedTime: string;
  sustainability: {
    recycledLbs: number;
    donatedLbs: number;
    landfilledLbs: number;
    diversionRate: number;
    co2AvoidedLbs: number;
    treesEquivalent: number;
  };
}

export interface FrictionlessQuoteSession {
  sessionId: string;
  address: AddressData;
  serviceType: string;
  photoUrls: string[];
  videoFrames?: string[];
  aiQuote: PhotoAnalysisQuote;
  createdAt: string;
  expiresAt: string; // 24 hours from creation
}

/**
 * Check if frictionless quote session is still valid
 */
export function isQuoteSessionValid(session: FrictionlessQuoteSession): boolean {
  const now = new Date();
  const expires = new Date(session.expiresAt);
  return now < expires;
}

/**
 * Create new frictionless quote session
 */
export function createQuoteSession(
  address: AddressData,
  serviceType: string,
  photoUrls: string[],
  aiQuote: PhotoAnalysisQuote
): FrictionlessQuoteSession {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    sessionId: crypto.randomUUID(),
    address,
    serviceType,
    photoUrls,
    aiQuote,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}
