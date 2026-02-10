/**
 * Email Service using SendGrid
 *
 * Sends email notifications for:
 * - Fraud alerts to admins
 * - Quality score updates to pros
 * - Seasonal advisories to customers
 * - Portfolio health reports to business accounts
 */

import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@uptend.com";

if (!SENDGRID_API_KEY) {
  console.warn("⚠️  SENDGRID_API_KEY not set. Email notifications disabled.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid email service initialized");
}

/**
 * Send fraud alert email to admins
 */
export async function sendFraudAlertEmail(alert: {
  id: string;
  alertType: string;
  severity: string;
  description: string;
  evidenceData: any;
}) {
  if (!SENDGRID_API_KEY) {
    console.log("📧 [Mock] Would send fraud alert email:", alert.alertType);
    return;
  }

  const severityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "⚡",
    low: "ℹ️",
  }[alert.severity] || "⚠️";

  const msg = {
    to: "admin@uptend.com", // TODO: Get from admin user settings
    from: SENDGRID_FROM_EMAIL,
    subject: `${severityEmoji} Fraud Alert: ${alert.alertType.replace(/_/g, " ")}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">${severityEmoji} Fraud Alert Detected</h2>
        <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p><strong>Alert Type:</strong> ${alert.alertType.replace(/_/g, " ")}</p>
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Description:</strong> ${alert.description}</p>
        </div>
        <p>Review this alert immediately in the admin dashboard:</p>
        <a href="https://uptend.com/admin/fraud/${alert.id}"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Review Alert →
        </a>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated alert from UpTend's AI fraud detection system.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Sent fraud alert email for ${alert.id}`);
  } catch (error: any) {
    console.error(`❌ Failed to send fraud alert email:`, error.message);
  }
}

/**
 * Send quality score update to pro
 */
export async function sendQualityScoreEmail(pro: {
  id: string;
  email: string;
  name: string;
  score: {
    overallScore: number;
    tier: string;
    previousTier?: string;
  };
}) {
  if (!SENDGRID_API_KEY) {
    console.log("📧 [Mock] Would send quality score email to:", pro.email);
    return;
  }

  const tierEmoji = {
    platinum: "💎",
    gold: "🥇",
    silver: "🥈",
    bronze: "🥉",
  }[pro.score.tier] || "⭐";

  const tierChanged = pro.score.previousTier && pro.score.previousTier !== pro.score.tier;

  const msg = {
    to: pro.email,
    from: SENDGRID_FROM_EMAIL,
    subject: tierChanged
      ? `${tierEmoji} Congratulations! You've reached ${pro.score.tier} tier!`
      : `Your Monthly Quality Score: ${pro.score.overallScore}/100`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${pro.name}! ${tierEmoji}</h2>

        ${tierChanged ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h1 style="margin: 0; font-size: 36px;">🎉 Tier Upgrade!</h1>
            <p style="font-size: 24px; margin: 10px 0;">You've reached ${pro.score.tier.toUpperCase()} tier!</p>
          </div>
        ` : ""}

        <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Quality Score</h3>
          <div style="font-size: 48px; font-weight: bold; color: #2563eb;">${pro.score.overallScore}<span style="font-size: 24px; color: #666;">/100</span></div>
          <p style="color: #666; margin-bottom: 0;">${tierEmoji} ${pro.score.tier.toUpperCase()} Tier</p>
        </div>

        <p>View your detailed performance breakdown and training recommendations:</p>
        <a href="https://uptend.com/hauler-dashboard?tab=quality"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Full Report →
        </a>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Keep up the great work! Higher tiers earn priority job assignments and customer trust.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Sent quality score email to ${pro.email}`);
  } catch (error: any) {
    console.error(`❌ Failed to send quality score email:`, error.message);
  }
}

/**
 * Send seasonal advisory to customer
 */
export async function sendSeasonalAdvisoryEmail(customer: {
  email: string;
  name: string;
  advisory: {
    title: string;
    description: string;
    recommendedServices: string[];
    priority: string;
  };
}) {
  if (!SENDGRID_API_KEY) {
    console.log("📧 [Mock] Would send seasonal advisory to:", customer.email);
    return;
  }

  const priorityEmoji = {
    critical: "🚨",
    high: "⚠️",
    medium: "📋",
    low: "💡",
  }[customer.advisory.priority] || "📋";

  const msg = {
    to: customer.email,
    from: SENDGRID_FROM_EMAIL,
    subject: `${priorityEmoji} ${customer.advisory.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${customer.name}! 👋</h2>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">${priorityEmoji} ${customer.advisory.title}</h3>
          <p style="color: #78350f;">${customer.advisory.description}</p>
        </div>

        <h4>Recommended Services:</h4>
        <ul style="list-style: none; padding: 0;">
          ${customer.advisory.recommendedServices
            .map(
              (service) => `
            <li style="background: #f3f4f6; padding: 10px; margin: 5px 0; border-radius: 5px;">
              ✓ ${service.replace(/_/g, " ")}
            </li>
          `
            )
            .join("")}
        </ul>

        <a href="https://uptend.com/customer-dashboard?action=book"
           style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Book Services Now →
        </a>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This personalized advisory is based on your location and the current season.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Sent seasonal advisory email to ${customer.email}`);
  } catch (error: any) {
    console.error(`❌ Failed to send seasonal advisory email:`, error.message);
  }
}

/**
 * Send portfolio health report to business account
 */
export async function sendPortfolioHealthEmail(business: {
  email: string;
  name: string;
  report: {
    propertiesAnalyzed: number;
    totalServiceRequests: number;
    costPerUnitAvg: number;
    riskProperties: string[];
    costSavingOpportunities: string[];
  };
}) {
  if (!SENDGRID_API_KEY) {
    console.log("📧 [Mock] Would send portfolio health report to:", business.email);
    return;
  }

  const msg = {
    to: business.email,
    from: SENDGRID_FROM_EMAIL,
    subject: `📊 Your Weekly Portfolio Health Report`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${business.name}!</h2>
        <p>Here's your weekly portfolio health summary:</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${business.report.propertiesAnalyzed}</div>
            <div style="color: #666; font-size: 14px;">Properties</div>
          </div>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #2563eb;">${business.report.totalServiceRequests}</div>
            <div style="color: #666; font-size: 14px;">Service Requests</div>
          </div>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>💰 Average Cost Per Unit:</strong> $${business.report.costPerUnitAvg.toFixed(2)}
        </div>

        ${business.report.riskProperties.length > 0 ? `
          <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #dc2626;">⚠️ Properties Needing Attention</h4>
            <ul style="margin: 0;">
              ${business.report.riskProperties.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${business.report.costSavingOpportunities.length > 0 ? `
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #065f46;">💡 Cost Saving Opportunities</h4>
            <ul style="margin: 0;">
              ${business.report.costSavingOpportunities.map(o => `<li>${o}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <a href="https://uptend.com/business-dashboard?tab=portfolio"
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Full Report →
        </a>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This automated report is generated weekly by UpTend's AI Portfolio Intelligence system.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Sent portfolio health email to ${business.email}`);
  } catch (error: any) {
    console.error(`❌ Failed to send portfolio health email:`, error.message);
  }
}

export default {
  sendFraudAlertEmail,
  sendQualityScoreEmail,
  sendSeasonalAdvisoryEmail,
  sendPortfolioHealthEmail,
};
