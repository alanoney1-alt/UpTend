/**
 * B2B Contracts Service
 * Manages service agreements and document tracking for business accounts.
 */

import { db } from "../db.js";
import { b2bServiceAgreements, b2bDocumentTracking } from "@shared/schema";
import { eq, and, sql, lte, gte } from "drizzle-orm";

const AGREEMENT_TEMPLATES: Record<string, any> = {
  master_service: {
    scope: "Comprehensive property maintenance services",
    payment_terms: "Net 30",
    insurance_requirements: "General liability $1M, Workers comp required",
    termination_clause: "30 days written notice by either party",
  },
  statement_of_work: {
    scope: "Specific project deliverables as defined",
    payment_terms: "50% upfront, 50% on completion",
    insurance_requirements: "General liability $1M",
    termination_clause: "Project cancellation fee of 15% of remaining value",
  },
  sla: {
    sla_targets: {
      response_time: "4 hours for urgent, 24 hours standard",
      resolution_time: "48 hours for standard issues",
      satisfaction_target: "95%",
      uptime: "99% availability during business hours",
    },
    payment_terms: "Monthly recurring",
    termination_clause: "90 days written notice",
  },
  amendment: {
    scope: "Modification to existing agreement",
    payment_terms: "Per original agreement unless specified",
    termination_clause: "Per original agreement",
  },
};

export async function generateServiceAgreement(
  businessAccountId: string,
  agreementType: string,
  terms: Record<string, any>
) {
  const template = AGREEMENT_TEMPLATES[agreementType] || {};
  const mergedTerms = { ...template, ...terms };

  const [agreement] = await db
    .insert(b2bServiceAgreements)
    .values({
      businessAccountId,
      agreementType,
      status: "draft",
      title: terms.title || `${agreementType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} - ${new Date().toLocaleDateString()}`,
      terms: mergedTerms,
      startDate: terms.startDate ? new Date(terms.startDate) : undefined,
      endDate: terms.endDate ? new Date(terms.endDate) : undefined,
      autoRenew: terms.autoRenew ?? false,
    })
    .returning();

  return agreement;
}

export async function getAgreementStatus(agreementId: string) {
  const [agreement] = await db
    .select()
    .from(b2bServiceAgreements)
    .where(eq(b2bServiceAgreements.id, agreementId));

  if (!agreement) return null;

  const timeline = [];
  timeline.push({ event: "Created", date: agreement.createdAt });
  if (agreement.signedByClient) timeline.push({ event: "Signed by client", date: agreement.signedByClient });
  if (agreement.signedByUptend) timeline.push({ event: "Signed by UpTend", date: agreement.signedByUptend });
  if (agreement.status === "active") timeline.push({ event: "Active", date: agreement.updatedAt });
  if (agreement.endDate) timeline.push({ event: "Expires", date: agreement.endDate });

  return { ...agreement, timeline };
}

export async function getDocumentTracker(businessAccountId: string) {
  const documents = await db
    .select()
    .from(b2bDocumentTracking)
    .where(eq(b2bDocumentTracking.businessAccountId, businessAccountId));

  return documents;
}

export async function flagExpiringDocuments(businessAccountId: string) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiring = await db
    .select()
    .from(b2bDocumentTracking)
    .where(
      and(
        eq(b2bDocumentTracking.businessAccountId, businessAccountId),
        lte(b2bDocumentTracking.dueDate, thirtyDaysFromNow),
        sql`${b2bDocumentTracking.status} NOT IN ('approved', 'submitted')`
      )
    );

  // Also check agreements expiring soon
  const expiringAgreements = await db
    .select()
    .from(b2bServiceAgreements)
    .where(
      and(
        eq(b2bServiceAgreements.businessAccountId, businessAccountId),
        lte(b2bServiceAgreements.endDate, thirtyDaysFromNow),
        eq(b2bServiceAgreements.status, "active")
      )
    );

  return {
    expiringDocuments: expiring,
    expiringAgreements,
    totalExpiring: expiring.length + expiringAgreements.length,
  };
}

export async function getComplianceReport(businessAccountId: string) {
  const documents = await db
    .select()
    .from(b2bDocumentTracking)
    .where(eq(b2bDocumentTracking.businessAccountId, businessAccountId));

  const agreements = await db
    .select()
    .from(b2bServiceAgreements)
    .where(eq(b2bServiceAgreements.businessAccountId, businessAccountId));

  const requiredDocs = ["insurance_cert", "w9"];
  const missing = requiredDocs.filter(
    (dt) => !documents.some((d) => d.documentType === dt && d.status === "approved")
  );

  const expired = documents.filter((d) => d.status === "expired");
  const pending = documents.filter((d) => d.status === "pending");
  const activeAgreements = agreements.filter((a) => a.status === "active");

  const score = Math.max(
    0,
    100 - missing.length * 25 - expired.length * 15 - pending.length * 5
  );

  return {
    businessAccountId,
    complianceScore: score,
    status: score >= 80 ? "compliant" : score >= 50 ? "needs_attention" : "non_compliant",
    missingDocuments: missing,
    expiredDocuments: expired.map((d) => d.documentName),
    pendingDocuments: pending.map((d) => d.documentName),
    activeAgreements: activeAgreements.length,
    totalDocuments: documents.length,
  };
}
