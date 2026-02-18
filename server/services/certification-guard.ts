/**
 * Certification Guard Service
 * Checks if a pro has the required active certifications to accept certain job types.
 */

import { db } from "../db";
import { proCertifications, certificationPrograms } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

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

/**
 * Check if a pro has a specific active certification by slug.
 */
export async function hasActiveCert(proId: string, certSlug: string): Promise<boolean> {
  const certs = await getProCerts(proId);
  return certs.includes(certSlug);
}

/**
 * Get all active certification slugs for a pro.
 */
export async function getProCerts(proId: string): Promise<string[]> {
  const now = new Date();
  const certs = await db
    .select({ slug: certificationPrograms.slug, status: proCertifications.status, expiresAt: proCertifications.expiresAt })
    .from(proCertifications)
    .innerJoin(certificationPrograms, eq(proCertifications.certificationId, certificationPrograms.id))
    .where(eq(proCertifications.proId, proId));

  return certs
    .filter(c => c.status === "completed" && (!c.expiresAt || new Date(c.expiresAt) > now))
    .map(c => c.slug);
}

/**
 * Get all pro IDs that have a specific active certification.
 */
export async function getCertifiedPros(certSlug: string): Promise<string[]> {
  const now = new Date();
  const rows = await db
    .select({ proId: proCertifications.proId, status: proCertifications.status, expiresAt: proCertifications.expiresAt })
    .from(proCertifications)
    .innerJoin(certificationPrograms, eq(proCertifications.certificationId, certificationPrograms.id))
    .where(eq(certificationPrograms.slug, certSlug));

  return rows
    .filter(r => r.status === "completed" && (!r.expiresAt || new Date(r.expiresAt) > now))
    .map(r => r.proId);
}

/**
 * Determine required certification slugs for a given job type and optional business account type.
 */
export function getRequiredCerts(jobType?: string, businessType?: string): string[] {
  const required = new Set<string>();
  if (jobType && JOB_TYPE_CERT_REQUIREMENTS[jobType]) {
    JOB_TYPE_CERT_REQUIREMENTS[jobType].forEach(s => required.add(s));
  }
  if (businessType && BUSINESS_TYPE_CERT_REQUIREMENTS[businessType]) {
    BUSINESS_TYPE_CERT_REQUIREMENTS[businessType].forEach(s => required.add(s));
  }
  return Array.from(required);
}

/**
 * Determine required certs for a job by looking up the business account type.
 */
export async function getRequiredCertsForJob(jobType?: string, businessAccountId?: string): Promise<string[]> {
  let businessType: string | undefined;
  if (businessAccountId) {
    const result = await db.execute(
      sql`SELECT segment FROM business_accounts WHERE id = ${businessAccountId} LIMIT 1`
    );
    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    if (rows[0]) businessType = (rows[0] as any).segment;
  }
  return getRequiredCerts(jobType, businessType);
}

/**
 * Filter a list of pro IDs down to those with ALL required certifications.
 */
export async function filterCertifiedPros(proIds: string[], jobType?: string, businessAccountId?: string): Promise<string[]> {
  const required = await getRequiredCertsForJob(jobType, businessAccountId);
  if (required.length === 0) return proIds;

  const certified: string[] = [];
  for (const proId of proIds) {
    const activeCerts = await getProCerts(proId);
    if (required.every(r => activeCerts.includes(r))) {
      certified.push(proId);
    }
  }
  return certified;
}

/**
 * Count B2B jobs a pro can't see due to missing certifications.
 */
export async function countHiddenJobs(proId: string): Promise<{ count: number; missingCerts: string[] }> {
  const activeCerts = await getProCerts(proId);
  const allRequired = new Set<string>();
  
  // Check all B2B cert types
  for (const slugs of Object.values(BUSINESS_TYPE_CERT_REQUIREMENTS)) {
    slugs.forEach(s => {
      if (!activeCerts.includes(s)) allRequired.add(s);
    });
  }

  // Estimate hidden jobs (simplified — count B2B jobs from segments the pro can't access)
  const missingCerts = Array.from(allRequired);
  if (missingCerts.length === 0) return { count: 0, missingCerts: [] };

  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM service_requests WHERE business_account_id IS NOT NULL AND status IN ('pending', 'accepted')`
    );
    const count = Number((result as any)[0]?.count || 0);
    return { count, missingCerts };
  } catch {
    return { count: 0, missingCerts };
  }
}
