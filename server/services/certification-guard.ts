/**
 * Certification Guard Service
 * Checks if a pro has the required active certifications to accept certain job types.
 */

import { db } from "../db";
import { proCertifications, certificationPrograms } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Map job types / business account types to required certification slugs
const JOB_TYPE_CERT_REQUIREMENTS: Record<string, string[]> = {
  property_management: ["b2b-property-management"],
  pm: ["b2b-property-management"],
  hoa: ["b2b-hoa-operations"],
  ai_home_scan: ["ai-home-scan-specialist"],
  home_consultation: ["ai-home-scan-specialist"],
  parts_materials: ["parts-materials-handler"],
  emergency: ["emergency-response"],
  government: ["government-contract-ready"],
};

const BUSINESS_TYPE_CERT_REQUIREMENTS: Record<string, string[]> = {
  property_management: ["b2b-property-management"],
  hoa: ["b2b-hoa-operations"],
  government: ["government-contract-ready"],
};

export interface CertGuardResult {
  allowed: boolean;
  missingCerts: string[];
  message: string;
}

/**
 * Check if a pro can accept a specific job type.
 * @param proId - The pro's user ID
 * @param jobType - The type of job (e.g., 'property_management', 'hoa', 'emergency')
 * @param businessType - Optional business account type for B2B jobs
 */
export async function canAcceptJob(
  proId: string,
  jobType?: string,
  businessType?: string
): Promise<CertGuardResult> {
  const requiredSlugs = new Set<string>();

  if (jobType && JOB_TYPE_CERT_REQUIREMENTS[jobType]) {
    JOB_TYPE_CERT_REQUIREMENTS[jobType].forEach(s => requiredSlugs.add(s));
  }

  if (businessType && BUSINESS_TYPE_CERT_REQUIREMENTS[businessType]) {
    BUSINESS_TYPE_CERT_REQUIREMENTS[businessType].forEach(s => requiredSlugs.add(s));
  }

  if (requiredSlugs.size === 0) {
    return { allowed: true, missingCerts: [], message: "No certification required" };
  }

  // Get all active certifications for the pro
  const proCerts = await db
    .select({
      status: proCertifications.status,
      expiresAt: proCertifications.expiresAt,
      slug: certificationPrograms.slug,
      name: certificationPrograms.name,
    })
    .from(proCertifications)
    .innerJoin(
      certificationPrograms,
      eq(proCertifications.certificationId, certificationPrograms.id)
    )
    .where(eq(proCertifications.proId, proId));

  const now = new Date();
  const activeSlugs = new Set(
    proCerts
      .filter(c => c.status === "completed" && (!c.expiresAt || new Date(c.expiresAt) > now))
      .map(c => c.slug)
  );

  const missing: string[] = [];
  const missingNames: string[] = [];

  for (const slug of requiredSlugs) {
    if (!activeSlugs.has(slug)) {
      missing.push(slug);
      // Find the name
      const cert = proCerts.find(c => c.slug === slug);
      if (cert) {
        missingNames.push(cert.name);
      } else {
        // Look up from DB
        const [prog] = await db
          .select({ name: certificationPrograms.name })
          .from(certificationPrograms)
          .where(eq(certificationPrograms.slug, slug));
        missingNames.push(prog?.name || slug);
      }
    }
  }

  if (missing.length === 0) {
    return { allowed: true, missingCerts: [], message: "All certifications met" };
  }

  return {
    allowed: false,
    missingCerts: missing,
    message: `This job requires ${missingNames.join(" and ")} certification. Visit the Pro Academy to get certified.`,
  };
}
