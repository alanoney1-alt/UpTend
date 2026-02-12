/**
 * AI Fraud Detection Service
 *
 * Detects suspicious patterns and potential fraud:
 * - Price manipulation (unusually high quotes)
 * - Fake disposal receipts
 * - GPS spoofing detection
 * - Duplicate job photos
 * - Review manipulation
 * - Abnormal booking patterns
 */

export interface FraudCheckData {
  entityType: "job" | "pro" | "customer";
  entityId: string;
  checkType: string;
  data: Record<string, any>;
}

export interface FraudAlertResult {
  isSuspicious: boolean;
  severity: "low" | "medium" | "high" | "critical";
  alertType: string;
  description: string;
  detectedPatterns: string[];
  evidenceData: Record<string, any>;
  confidenceScore: number; // 0-1
  recommendedAction: string;
}

export async function checkForFraud(
  checkData: FraudCheckData
): Promise<FraudAlertResult | null> {
  const { entityType, entityId, checkType, data } = checkData;

  // Run appropriate fraud check
  switch (checkType) {
    case "price_manipulation":
      return checkPriceManipulation(data as any);

    case "disposal_receipt":
      return checkDisposalReceipt(data as any);

    case "gps_integrity":
      return checkGpsIntegrity(data as any);

    case "photo_authenticity":
      return checkPhotoAuthenticity(data as any);

    case "review_manipulation":
      return checkReviewManipulation(data as any);

    case "booking_pattern":
      return checkBookingPattern(data as any);

    default:
      return null;
  }
}

function checkPriceManipulation(data: {
  quotedPrice: number;
  estimatedPrice: number;
  serviceType: string;
  proHistory: { avgPrice: number; jobCount: number };
}): FraudAlertResult | null {
  const { quotedPrice, estimatedPrice, proHistory } = data;

  // Check if quoted price is significantly higher than estimate
  const priceRatio = quotedPrice / estimatedPrice;
  const avgRatio = proHistory.avgPrice / estimatedPrice;

  if (priceRatio > 2.0 && quotedPrice > proHistory.avgPrice * 1.5) {
    return {
      isSuspicious: true,
      severity: "high",
      alertType: "price_manipulation",
      description: `Quoted price $${quotedPrice} is ${Math.round((priceRatio - 1) * 100)}% higher than estimated`,
      detectedPatterns: [
        "Quote significantly exceeds AI estimate",
        "Quote higher than pro's average pricing",
      ],
      evidenceData: {
        quotedPrice,
        estimatedPrice,
        priceRatio: Math.round(priceRatio * 100) / 100,
        proAvgPrice: proHistory.avgPrice,
      },
      confidenceScore: Math.min(0.95, (priceRatio - 1.5) / 2),
      recommendedAction: "Require approval before job assignment",
    };
  }

  return null;
}

function checkDisposalReceipt(data: {
  receiptImageUrl: string;
  reportedWeight: number;
  estimatedWeight: number;
  facilityName?: string;
  receiptDate?: string;
}): FraudAlertResult | null {
  const { reportedWeight, estimatedWeight, receiptDate } = data;

  const patterns: string[] = [];
  let severity: "low" | "medium" | "high" | "critical" = "low";
  let confidenceScore = 0;

  // Check weight variance
  const weightVariance = Math.abs(reportedWeight - estimatedWeight) / estimatedWeight;
  if (weightVariance > 0.5) {
    patterns.push(`Weight variance: ${Math.round(weightVariance * 100)}% from estimate`);
    severity = "medium";
    confidenceScore += 0.3;
  }

  // Check receipt date (should be same day as job)
  const jobDate = new Date().toISOString().split("T")[0];
  if (receiptDate && receiptDate !== jobDate) {
    patterns.push("Receipt date doesn't match job date");
    severity = "high";
    confidenceScore += 0.4;
  }

  // TODO: OCR-based checks:
  // - Verify facility name matches approved list
  // - Check for image manipulation (duplicate receipts, photoshop)
  // - Validate receipt format/authenticity

  if (patterns.length === 0) {
    return null;
  }

  return {
    isSuspicious: true,
    severity,
    alertType: "disposal_receipt_fraud",
    description: "Disposal receipt has suspicious characteristics",
    detectedPatterns: patterns,
    evidenceData: {
      reportedWeight,
      estimatedWeight,
      weightVariance: Math.round(weightVariance * 100) / 100,
      receiptDate,
    },
    confidenceScore: Math.min(confidenceScore, 0.95),
    recommendedAction: severity === "high" ? "Manual review required" : "Flag for audit",
  };
}

function checkGpsIntegrity(data: {
  reportedLocation: { lat: number; lng: number };
  expectedLocation: { lat: number; lng: number };
  timestamp: string;
  speedToLocation?: number; // mph
}): FraudAlertResult | null {
  const distance = calculateDistance(data.reportedLocation, data.expectedLocation);

  // Check if location is too far from expected
  if (distance > 1.0) {
    // More than 1 mile away
    return {
      isSuspicious: true,
      severity: distance > 5 ? "high" : "medium",
      alertType: "gps_spoofing",
      description: `GPS location is ${distance.toFixed(2)} miles from expected job site`,
      detectedPatterns: ["GPS coordinates don't match job address"],
      evidenceData: {
        reportedLocation: data.reportedLocation,
        expectedLocation: data.expectedLocation,
        distanceMiles: Math.round(distance * 100) / 100,
      },
      confidenceScore: Math.min(0.95, distance / 10),
      recommendedAction: "Require photo proof at location",
    };
  }

  // Check impossible travel speed
  if (data.speedToLocation && data.speedToLocation > 100) {
    return {
      isSuspicious: true,
      severity: "high",
      alertType: "impossible_travel",
      description: `Travel speed of ${data.speedToLocation} mph is physically impossible`,
      detectedPatterns: ["Impossible travel time between locations"],
      evidenceData: { speed: data.speedToLocation },
      confidenceScore: 0.98,
      recommendedAction: "Suspend account pending investigation",
    };
  }

  return null;
}

function checkPhotoAuthenticity(data: {
  photoUrl: string;
  jobId: string;
  previousPhotos?: string[];
}): FraudAlertResult | null {
  // TODO: Implement with image comparison AI
  // - Check for duplicate photos across jobs
  // - Detect stock images
  // - Identify photoshopped images
  // - Verify EXIF data integrity

  // Placeholder for now
  return null;
}

function checkReviewManipulation(data: {
  proId: string;
  recentReviews: Array<{ rating: number; text: string; customerId: string; date: string }>;
}): FraudAlertResult | null {
  const { recentReviews } = data;

  if (recentReviews.length < 5) {
    return null; // Need more data
  }

  const patterns: string[] = [];
  let confidenceScore = 0;

  // Check for suspiciously uniform ratings
  const allFiveStars = recentReviews.every((r) => r.rating === 5);
  if (allFiveStars && recentReviews.length > 10) {
    patterns.push("100% five-star reviews is statistically unlikely");
    confidenceScore += 0.5;
  }

  // Check for rapid reviews from new accounts
  const newAccountReviews = recentReviews.filter((r) => {
    // TODO: Check customer account age
    return false;
  });

  if (newAccountReviews.length > 3) {
    patterns.push("Multiple reviews from newly created accounts");
    confidenceScore += 0.4;
  }

  if (patterns.length === 0) {
    return null;
  }

  return {
    isSuspicious: true,
    severity: "medium",
    alertType: "review_manipulation",
    description: "Review patterns suggest potential manipulation",
    detectedPatterns: patterns,
    evidenceData: {
      totalReviews: recentReviews.length,
      fiveStarCount: recentReviews.filter((r) => r.rating === 5).length,
    },
    confidenceScore,
    recommendedAction: "Investigate reviewer accounts and review timing",
  };
}

function checkBookingPattern(data: {
  customerId: string;
  recentBookings: Array<{ date: string; serviceType: string; price: number; cancelled: boolean }>;
}): FraudAlertResult | null {
  const { recentBookings } = data;

  if (recentBookings.length < 3) {
    return null;
  }

  // Check cancellation rate
  const cancellationRate =
    recentBookings.filter((b) => b.cancelled).length / recentBookings.length;

  if (cancellationRate > 0.7) {
    return {
      isSuspicious: true,
      severity: "medium",
      alertType: "booking_abuse",
      description: `${Math.round(cancellationRate * 100)}% cancellation rate suggests booking abuse`,
      detectedPatterns: ["High cancellation rate", "Possible competitor reconnaissance"],
      evidenceData: {
        totalBookings: recentBookings.length,
        cancelled: recentBookings.filter((b) => b.cancelled).length,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
      confidenceScore: cancellationRate,
      recommendedAction: "Require deposit for future bookings",
    };
  }

  return null;
}

function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default {
  checkForFraud,
};
