/**
 * Background Check Service (Checkr Integration)
 * 
 * Full framework for Checkr background checks.
 * Gracefully degrades to "pending_manual_review" when CHECKR_API_KEY is not set.
 */

import { db } from "../db";
import { backgroundChecks, type BackgroundCheck, type InsertBackgroundCheck } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const CHECKR_API_KEY = process.env.CHECKR_API_KEY;
const CHECKR_API_BASE = "https://api.checkr.com/v1";

export type BackgroundCheckStatus = 
  | "not_started" 
  | "pending" 
  | "pending_manual_review"
  | "in_review" 
  | "clear" 
  | "flagged" 
  | "failed";

export class BackgroundCheckService {
  /**
   * Initiate a background check for a pro.
   */
  async initiateCheck(params: {
    proId: string;
    firstName: string;
    lastName: string;
    email: string;
    dob?: string;
    ssn_last4?: string;
  }): Promise<{ success: boolean; checkId?: string; status: BackgroundCheckStatus; error?: string }> {
    try {
      const existing = await this.getCheckStatus(params.proId);
      if (existing && ["pending", "in_review", "clear"].includes(existing.status)) {
        return { success: true, checkId: existing.id, status: existing.status as BackgroundCheckStatus };
      }

      if (CHECKR_API_KEY) {
        return await this.initiateCheckrCheck(params);
      }

      // No API key — create record for manual review
      const [check] = await db.insert(backgroundChecks).values({
        proId: params.proId,
        status: "pending_manual_review",
        provider: "manual",
      }).returning();

      return { success: true, checkId: check.id, status: "pending_manual_review" };
    } catch (error: any) {
      console.error("[BackgroundCheck] Error initiating check:", error.message);
      return { success: false, status: "failed", error: error.message };
    }
  }

  private async initiateCheckrCheck(params: {
    proId: string;
    firstName: string;
    lastName: string;
    email: string;
    dob?: string;
    ssn_last4?: string;
  }): Promise<{ success: boolean; checkId?: string; status: BackgroundCheckStatus; error?: string }> {
    try {
      const candidateRes = await fetch(`${CHECKR_API_BASE}/candidates`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: params.firstName,
          last_name: params.lastName,
          email: params.email,
          dob: params.dob,
          ssn: params.ssn_last4,
        }),
      });

      if (!candidateRes.ok) {
        throw new Error(`Checkr candidate creation failed: ${await candidateRes.text()}`);
      }

      const candidate = await candidateRes.json() as any;

      const reportRes = await fetch(`${CHECKR_API_BASE}/invitations`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_id: candidate.id,
          package: "tasker_standard",
        }),
      });

      if (!reportRes.ok) {
        throw new Error(`Checkr invitation failed: ${await reportRes.text()}`);
      }

      const invitation = await reportRes.json() as any;

      const [check] = await db.insert(backgroundChecks).values({
        proId: params.proId,
        status: "pending",
        provider: "checkr",
        providerCheckId: invitation.id || candidate.id,
      }).returning();

      return { success: true, checkId: check.id, status: "pending" };
    } catch (error: any) {
      console.error("[BackgroundCheck] Checkr API error, falling back to manual:", error.message);
      const [check] = await db.insert(backgroundChecks).values({
        proId: params.proId,
        status: "pending_manual_review",
        provider: "manual",
      }).returning();
      return { success: true, checkId: check.id, status: "pending_manual_review", error: error.message };
    }
  }

  async getCheckStatus(proId: string): Promise<BackgroundCheck | null> {
    try {
      const checks = await db.select().from(backgroundChecks)
        .where(eq(backgroundChecks.proId, proId))
        .orderBy(desc(backgroundChecks.createdAt))
        .limit(1);
      return checks[0] || null;
    } catch (error: any) {
      console.error("[BackgroundCheck] Error getting status:", error.message);
      return null;
    }
  }

  async handleWebhook(payload: {
    type?: string;
    data?: { object?: { id?: string; status?: string; result?: string; report_url?: string; completed_at?: string } };
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const checkData = payload.data?.object;
      if (!checkData?.id) return { success: false, error: "No check ID in webhook payload" };

      let status = "pending";
      let result: string | undefined;

      switch (payload.type) {
        case "report.completed":
          status = checkData.result === "clear" ? "clear" : "flagged";
          result = checkData.result || "unknown";
          break;
        case "report.created":
        case "report.upgraded":
        case "report.suspended":
        case "report.disputed":
          status = "in_review";
          break;
        default:
          return { success: true };
      }

      await db.update(backgroundChecks)
        .set({
          status,
          result,
          completedAt: ["clear", "flagged", "failed"].includes(status) ? new Date().toISOString() : undefined,
          reportUrl: checkData.report_url,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(backgroundChecks.providerCheckId, checkData.id));

      return { success: true };
    } catch (error: any) {
      console.error("[BackgroundCheck] Webhook error:", error.message);
      return { success: false, error: error.message };
    }
  }

  async manualApprove(proId: string, _notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getCheckStatus(proId);
      if (!existing) {
        await db.insert(backgroundChecks).values({
          proId,
          status: "clear",
          provider: "manual",
          result: "clear",
          completedAt: new Date().toISOString(),
        });
      } else {
        await db.update(backgroundChecks)
          .set({
            status: "clear",
            result: "clear",
            provider: "manual",
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(backgroundChecks.id, existing.id));
      }
      return { success: true };
    } catch (error: any) {
      console.error("[BackgroundCheck] Manual approve error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

export const backgroundCheckService = new BackgroundCheckService();
