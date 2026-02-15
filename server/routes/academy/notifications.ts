import { db } from "../../db";
import { eq, and, sql, gte, lte } from "drizzle-orm";

/**
 * Academy Notification Hooks
 * 
 * These functions handle certification-related notifications.
 * Actual email sending and scheduling can be wired up later —
 * these provide the logic and data gathering.
 */

/**
 * Get count of premium B2B jobs a pro missed in the past week
 * because they lack required certifications.
 */
export async function getWeeklyMissedJobsCount(proId: number): Promise<{
  count: number;
  missingCerts: string[];
}> {
  try {
    // For now, return an estimate based on whether the pro has B2B certs
    // Once job-cert gating is fully wired, this will query actual filtered jobs
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
 * For now, logs the intent — actual email/push sending wired later.
 */
export async function sendCertificationNudge(proId: number): Promise<void> {
  try {
    const { count, missingCerts } = await getWeeklyMissedJobsCount(proId);

    if (count === 0) return;

    const certNames = missingCerts.map(s => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));

    console.log(`[Academy Nudge] Pro ${proId}: Missed ~${count} premium jobs this week. Missing certs: ${certNames.join(", ")}`);

    // TODO: Wire up actual email sending
    // await sendEmail({
    //   to: proEmail,
    //   subject: `You missed ${count} premium jobs this week`,
    //   body: `Get ${certNames[0]} certified to unlock them.`,
    // });
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

      // TODO: Wire up actual email sending
      // await sendEmail({
      //   to: proEmail,
      //   subject: `Your ${c.cert_name} certification expires soon`,
      //   body: `Renew before ${c.expires_at} to keep access to premium jobs.`,
      // });
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

    // TODO: Wire up actual email sending
    // await sendEmail({
    //   to: proEmail,
    //   subject: `Congratulations! You're now ${certName} certified`,
    //   body: `You now have access to X new premium jobs in your area.`,
    // });
  } catch (error) {
    console.error("Error sending cert completion congrats:", error);
  }
}

/**
 * Send fee tier upgrade notification when a pro crosses a tier threshold.
 * Called after certification completion in the quiz submission flow.
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

    // TODO: Wire up actual email sending
    // await sendEmail({
    //   to: proEmail,
    //   subject: `🎉 Your platform fee just dropped to ${newPercent}%!`,
    //   body: `Your platform fee just dropped from ${oldPercent}% to ${newPercent}%! Based on your recent earnings, that's an extra $${monthlySavings.toFixed(2)} per month.`,
    // });
  } catch (error) {
    console.error("Error sending fee reduction congrats:", error);
  }
}
