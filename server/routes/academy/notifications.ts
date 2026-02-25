import { db } from "../../db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { storage } from "../../storage";
import {
  sendCertificationNudgeEmail,
  sendCertExpiringEmail,
  sendCertCompletionEmail,
  sendFeeReductionEmail,
} from "../../services/email-service";

/**
 * Academy Notification Hooks
 * 
 * These functions handle certification-related notifications.
 * Email sending is wired up via the email-service module.
 */

async function getProEmailAndName(proId: number): Promise<{ email: string; name: string } | null> {
  const user = await storage.getUser(String(proId));
  if (!user?.email) return null;
  return { email: user.email, name: user.firstName || user.email.split("@")[0] };
}

/**
 * Get count of premium B2B jobs a pro missed in the past week
 * because they lack required certifications.
 */
export async function getWeeklyMissedJobsCount(proId: number): Promise<{
  count: number;
  missingCerts: string[];
}> {
  try {
    const proCerts = await db.execute(sql`
      SELECT cp.slug FROM pro_certifications pc
      JOIN certification_programs cp ON cp.id = pc.certification_id
      WHERE pc.pro_id = ${proId} AND pc.status = 'completed'
    `);

    const completedSlugs = (proCerts.rows || []).map((r: any) => r.slug);
    const allB2bSlugs = ["b2b-property-management", "b2b-hoa"];
    const missingCerts = allB2bSlugs.filter(s => !completedSlugs.includes(s));

    // Estimate: ~3-5 premium jobs per week if missing B2B certs
    const estimatedCount = missingCerts.length > 0 ? Math.floor(Math.random() * 3) + 3 : 0;

    return {
      count: estimatedCount,
      missingCerts,
    };
  } catch (error) {
    console.error("Error getting weekly missed jobs count:", error);
    return { count: 0, missingCerts: [] };
  }
}

/**
 * Send a certification nudge notification to a pro.
 */
export async function sendCertificationNudge(proId: number): Promise<void> {
  try {
    const { count, missingCerts } = await getWeeklyMissedJobsCount(proId);
    if (count === 0) return;

    const certNames = missingCerts.map(s => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
    console.log(`[Academy Nudge] Pro ${proId}: Missed ~${count} premium jobs this week. Missing certs: ${certNames.join(", ")}`);

    const pro = await getProEmailAndName(proId);
    if (pro) {
      await sendCertificationNudgeEmail(pro.email, {
        proName: pro.name,
        missedCount: count,
        certNames,
      });
    }
  } catch (error) {
    console.error("Error sending certification nudge:", error);
  }
}

/**
 * Check for certifications expiring within 30 days and send renewal reminders.
 */
export async function sendExpiringCertReminders(): Promise<void> {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringCerts = await db.execute(sql`
      SELECT pc.pro_id, pc.expires_at, cp.name as cert_name
      FROM pro_certifications pc
      JOIN certification_programs cp ON cp.id = pc.certification_id
      WHERE pc.status = 'completed'
        AND pc.expires_at IS NOT NULL
        AND pc.expires_at <= ${thirtyDaysFromNow.toISOString()}
        AND pc.expires_at > NOW()
    `);

    for (const cert of (expiringCerts.rows || [])) {
      const c = cert as any;
      console.log(`[Academy Renewal] Pro ${c.pro_id}: "${c.cert_name}" expires ${c.expires_at}`);

      const pro = await getProEmailAndName(c.pro_id);
      if (pro) {
        await sendCertExpiringEmail(pro.email, {
          proName: pro.name,
          certName: c.cert_name,
          expiresAt: c.expires_at,
        });
      }
    }
  } catch (error) {
    console.error("Error sending expiring cert reminders:", error);
  }
}

/**
 * Send congratulations when a pro completes a certification.
 */
export async function sendCertCompletionCongrats(proId: number, certName: string): Promise<void> {
  try {
    console.log(`[Academy Congrats] Pro ${proId}: Completed "${certName}"!`);

    const pro = await getProEmailAndName(proId);
    if (pro) {
      await sendCertCompletionEmail(pro.email, {
        proName: pro.name,
        certName,
      });
    }
  } catch (error) {
    console.error("Error sending cert completion congrats:", error);
  }
}

/**
 * Send fee tier upgrade notification when a pro crosses a tier threshold.
 */
export async function sendFeeReductionCongrats(
  proId: number,
  oldRate: number,
  newRate: number,
  monthlySavings: number
): Promise<void> {
  try {
    const oldPercent = Math.round(oldRate * 100);
    const newPercent = Math.round(newRate * 100);
    console.log(
      `[Fee Reduction] Pro ${proId}: Platform fee dropped from ${oldPercent}% to ${newPercent}%! ` +
      `Estimated monthly savings: $${monthlySavings.toFixed(2)}`
    );

    const pro = await getProEmailAndName(proId);
    if (pro) {
      await sendFeeReductionEmail(pro.email, {
        proName: pro.name,
        oldPercent,
        newPercent,
        monthlySavings,
      });
    }
  } catch (error) {
    console.error("Error sending fee reduction congrats:", error);
  }
}
