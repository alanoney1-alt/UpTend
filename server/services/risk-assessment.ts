import { storage } from "../storage";

export interface RiskAssessment {
  riskLevel: "normal" | "elevated" | "high";
  reasons: string[];
  actions: {
    requireUpfrontPayment: boolean;
    requireIdVerification: boolean;
    blockBooking: boolean;
    flagForReview: boolean;
  };
}

/**
 * Assess customer risk for chargeback/dispute protection.
 * Called during booking flow and dispute handling.
 */
export async function assessCustomerRisk(
  customerId: string,
  jobValue: number = 0,
): Promise<RiskAssessment> {
  const reasons: string[] = [];
  let riskScore = 0;

  const user = await storage.getUser(customerId);
  if (!user) {
    return {
      riskLevel: "normal",
      reasons: ["User not found"],
      actions: {
        requireUpfrontPayment: false,
        requireIdVerification: false,
        blockBooking: false,
        flagForReview: false,
      },
    };
  }

  // Factor 1: Previous disputes
  const disputeCount = user.disputeCount || 0;
  if (disputeCount >= 3) {
    riskScore += 100;
    reasons.push(`${disputeCount} previous disputes`);
  } else if (disputeCount >= 1) {
    riskScore += 40 * disputeCount;
    reasons.push(`${disputeCount} previous dispute(s)`);
  }

  // Factor 2: Account age
  const accountAge = user.createdAt
    ? (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 0;

  if (accountAge < 7) {
    riskScore += 20;
    reasons.push("Account less than 7 days old");
  } else if (accountAge < 30) {
    riskScore += 10;
    reasons.push("Account less than 30 days old");
  }

  // Factor 3: Job value
  if (jobValue > 500) {
    riskScore += 15;
    reasons.push(`High-value job ($${jobValue.toFixed(0)})`);
  }

  // Factor 4: First-time customer with high value
  const totalJobs = user.totalJobsCompleted || 0;
  if (totalJobs === 0 && jobValue > 500) {
    riskScore += 20;
    reasons.push("First-time customer with high-value job");
  }

  // Factor 5: Already flagged as elevated or high
  if (user.riskLevel === "high") {
    riskScore += 50;
    reasons.push("Previously flagged as high risk");
  } else if (user.riskLevel === "elevated") {
    riskScore += 20;
    reasons.push("Previously flagged as elevated risk");
  }

  // Determine risk level
  let riskLevel: "normal" | "elevated" | "high";
  if (riskScore >= 80) {
    riskLevel = "high";
  } else if (riskScore >= 30) {
    riskLevel = "elevated";
  } else {
    riskLevel = "normal";
  }

  // Determine required actions
  const actions = {
    requireUpfrontPayment: riskLevel === "elevated" || riskLevel === "high",
    requireIdVerification: riskLevel === "high",
    blockBooking: riskLevel === "high" && disputeCount >= 3,
    flagForReview: (totalJobs === 0 && jobValue > 500) || riskLevel === "elevated",
  };

  return { riskLevel, reasons, actions };
}
