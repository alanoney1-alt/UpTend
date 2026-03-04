/**
 * Campaign Sender Service
 * 
 * Handles actual sending of campaign emails and SMS messages.
 * Uses Twilio for SMS and SendGrid for emails.
 */

import { pool } from "../db";
import { sendSMS } from "./sms-service";
import nodemailer from "nodemailer";

// Email service setup using SendGrid
let transporter: nodemailer.Transporter;

if (process.env.SENDGRID_API_KEY) {
  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
  });
} else {
  // Dev fallback - log to console
  transporter = nodemailer.createTransport({ jsonTransport: true });
}

const FROM_EMAIL = process.env.FROM_EMAIL || "alan@uptendapp.com";
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || "+18559012072";

interface CampaignSendResult {
  success: boolean;
  emailsSent: number;
  smsSent: number;
  errors: string[];
}

/**
 * Send campaign to target customers
 */
export async function sendCampaign(
  campaignId: string,
  partnerSlug: string,
  testMode = false,
  testCustomerId?: string
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = {
    success: false,
    emailsSent: 0,
    smsSent: 0,
    errors: []
  };

  try {
    // Get campaign details
    const campaignResult = await pool.query(
      `SELECT * FROM seasonal_campaigns WHERE id = $1 AND partner_slug = $2`,
      [campaignId, partnerSlug]
    );

    if (campaignResult.rows.length === 0) {
      result.errors.push('Campaign not found');
      return result;
    }

    const campaign = campaignResult.rows[0];

    // Get partner details
    const partnerResult = await pool.query(
      `SELECT company_name, phone_number FROM partners WHERE slug = $1`,
      [partnerSlug]
    );

    const partner = partnerResult.rows[0] || { company_name: 'UpTend Partner', phone_number: TWILIO_PHONE_NUMBER };

    let targetCustomers = [];

    if (testMode && testCustomerId) {
      // Test mode - send to single customer
      const testCustomerResult = await pool.query(
        `SELECT c.*, u.email, u.phone 
         FROM customers c 
         JOIN users u ON c.user_id = u.id 
         WHERE c.id = $1`,
        [testCustomerId]
      );
      targetCustomers = testCustomerResult.rows;
    } else {
      // Get target audience based on campaign criteria
      targetCustomers = await getTargetAudience(partnerSlug, campaign.target_audience);
    }

    console.log(`[CAMPAIGN] Sending campaign ${campaignId} to ${targetCustomers.length} customers`);

    // Send to each customer
    for (const customer of targetCustomers) {
      try {
        // Replace template variables
        const variables = {
          customer_name: customer.first_name || 'Customer',
          company_name: partner.company_name,
          phone: partner.phone_number,
          discount: campaign.offer_details?.discount_value || 10,
          link: `${process.env.FRONTEND_URL || 'https://uptendapp.com'}/partners/${partnerSlug}`
        };

        // Send email if template exists and customer has email
        if (campaign.email_template && customer.email) {
          const emailContent = replaceTemplateVariables(campaign.email_template, variables);
          const [subject, ...bodyLines] = emailContent.split('\n');
          const emailSubject = subject.replace('Subject: ', '');
          const emailBody = bodyLines.join('\n');

          await sendCampaignEmail(customer.email, emailSubject, emailBody, partner.company_name);
          
          // Update campaign send record with success
          await pool.query(
            `INSERT INTO campaign_sends (campaign_id, customer_id, channel, sent_at, delivered = true)
             VALUES ($1, $2, 'email', NOW(), true)
             ON CONFLICT (campaign_id, customer_id, channel) DO UPDATE SET 
             sent_at = NOW(), delivered = true`,
            [campaignId, customer.id]
          );

          result.emailsSent++;
        }

        // Send SMS if template exists and customer has phone
        if (campaign.sms_template && customer.phone) {
          const smsContent = replaceTemplateVariables(campaign.sms_template, variables);
          
          const smsResult = await sendSMS(customer.phone, smsContent);
          
          if (smsResult.success) {
            // Update campaign send record with success
            await pool.query(
              `INSERT INTO campaign_sends (campaign_id, customer_id, channel, sent_at, delivered = true)
               VALUES ($1, $2, 'sms', NOW(), true)
               ON CONFLICT (campaign_id, customer_id, channel) DO UPDATE SET 
               sent_at = NOW(), delivered = true`,
              [campaignId, customer.id]
            );
            result.smsSent++;
          } else {
            result.errors.push(`SMS failed for ${customer.phone}: ${smsResult.error}`);
            
            // Record failed send
            await pool.query(
              `INSERT INTO campaign_sends (campaign_id, customer_id, channel, sent_at, delivered = false, error = $5)
               VALUES ($1, $2, 'sms', NOW(), false, $5)
               ON CONFLICT (campaign_id, customer_id, channel) DO UPDATE SET 
               sent_at = NOW(), delivered = false, error = $5`,
              [campaignId, customer.id, smsResult.error]
            );
          }
        }

      } catch (customerError: any) {
        result.errors.push(`Error sending to customer ${customer.id}: ${customerError.message}`);
      }
    }

    // Update campaign status
    if (!testMode) {
      await pool.query(
        `UPDATE seasonal_campaigns 
         SET status = 'active', launched_at = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [campaignId]
      );
    }

    result.success = true;
    console.log(`[CAMPAIGN] Completed: ${result.emailsSent} emails, ${result.smsSent} SMS sent`);

  } catch (error: any) {
    result.errors.push(`Campaign send error: ${error.message}`);
    console.error('[CAMPAIGN] Send error:', error);
  }

  return result;
}

/**
 * Get target audience for campaign based on criteria
 */
async function getTargetAudience(partnerSlug: string, targetAudience: any): Promise<any[]> {
  const audience = targetAudience || {};
  
  let query = `
    SELECT DISTINCT c.*, u.email, u.phone, u.first_name, u.last_name
    FROM customers c
    JOIN users u ON c.user_id = u.id
    WHERE c.id IN (
      SELECT DISTINCT customer_id 
      FROM dispatch_jobs 
      WHERE partner_slug = $1
    )
  `;
  const params = [partnerSlug];

  // Filter by inactive days (customers who haven't had service recently)
  if (audience.inactive_days) {
    query += ` AND c.id NOT IN (
      SELECT customer_id 
      FROM dispatch_jobs 
      WHERE partner_slug = $1 
      AND status = 'completed' 
      AND actual_completion >= NOW() - INTERVAL '${audience.inactive_days} days'
    )`;
  }

  // Filter by service history
  if (audience.service_history && audience.service_history.length > 0) {
    const serviceFilters = audience.service_history.map(
      (service: string, index: number) => `$${params.length + index + 1}`
    );
    query += ` AND c.id IN (
      SELECT customer_id 
      FROM dispatch_jobs 
      WHERE partner_slug = $1 
      AND service_type = ANY(ARRAY[${serviceFilters.join(',')}])
    )`;
    params.push(...audience.service_history);
  }

  // Only include customers with contact info
  query += ` AND (u.email IS NOT NULL OR u.phone IS NOT NULL)`;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Replace template variables in campaign content
 */
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let content = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, 'g'), String(value));
  });

  return content;
}

/**
 * Send campaign email using SendGrid
 */
async function sendCampaignEmail(
  to: string, 
  subject: string, 
  body: string, 
  companyName: string
): Promise<void> {
  // Create HTML version of email
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
                <tr><td style="background:#F47C20;padding:24px 32px">
                    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">${companyName}</h1>
                </td></tr>
                <tr><td style="padding:32px">
                    <div style="color:#555;line-height:1.6">${body.replace(/\n/g, '<br>')}</div>
                </td></tr>
                <tr><td style="padding:16px 32px;background:#fafafa;color:#999;font-size:12px;text-align:center">
                    © ${new Date().getFullYear()} ${companyName} - Professional home services.
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>
  `;

  const textBody = body.replace(/<[^>]*>/g, ''); // Strip any HTML for text version

  await transporter.sendMail({
    from: `${companyName} <${FROM_EMAIL}>`,
    to,
    subject,
    html: htmlBody,
    text: textBody,
  });
}

/**
 * Get dormant customers for win-back campaigns
 */
export async function getDormantCustomers(
  partnerSlug: string,
  inactiveDays = 180
): Promise<any[]> {
  const result = await pool.query(`
    SELECT DISTINCT 
      c.*,
      u.email,
      u.phone,
      u.first_name,
      u.last_name,
      MAX(dj.actual_completion) as last_service_date,
      COUNT(dj.id) as total_jobs,
      AVG(dj.invoice_amount) as avg_job_value
    FROM customers c
    JOIN users u ON c.user_id = u.id
    JOIN dispatch_jobs dj ON c.id = dj.customer_id
    WHERE dj.partner_slug = $1
    AND dj.status = 'completed'
    AND dj.actual_completion < NOW() - INTERVAL '${inactiveDays} days'
    AND c.id NOT IN (
      SELECT customer_id 
      FROM dispatch_jobs 
      WHERE partner_slug = $1 
      AND status = 'completed' 
      AND actual_completion >= NOW() - INTERVAL '${inactiveDays} days'
    )
    GROUP BY c.id, u.id
    ORDER BY last_service_date DESC
  `, [partnerSlug]);

  return result.rows;
}

/**
 * Send win-back campaign to dormant customers
 */
export async function sendWinBackCampaign(
  partnerSlug: string,
  template: { subject: string; email_body: string; sms_body?: string },
  customerIds?: string[]
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = {
    success: false,
    emailsSent: 0,
    smsSent: 0,
    errors: []
  };

  try {
    let targetCustomers;
    
    if (customerIds && customerIds.length > 0) {
      // Send to specific customers
      const customerResult = await pool.query(`
        SELECT c.*, u.email, u.phone, u.first_name, u.last_name
        FROM customers c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ANY($1)
      `, [customerIds]);
      targetCustomers = customerResult.rows;
    } else {
      // Send to all dormant customers
      targetCustomers = await getDormantCustomers(partnerSlug);
    }

    // Get partner details
    const partnerResult = await pool.query(
      `SELECT company_name FROM partners WHERE slug = $1`,
      [partnerSlug]
    );
    const companyName = partnerResult.rows[0]?.company_name || 'UpTend Partner';

    for (const customer of targetCustomers) {
      try {
        // Replace variables
        const variables = {
          customer_name: customer.first_name || 'Customer',
          company_name: companyName
        };

        // Send email
        if (customer.email && template.email_body) {
          const emailContent = replaceTemplateVariables(template.email_body, variables);
          const subject = replaceTemplateVariables(template.subject, variables);
          
          await sendCampaignEmail(customer.email, subject, emailContent, companyName);
          result.emailsSent++;
        }

        // Send SMS
        if (customer.phone && template.sms_body) {
          const smsContent = replaceTemplateVariables(template.sms_body, variables);
          const smsResult = await sendSMS(customer.phone, smsContent);
          
          if (smsResult.success) {
            result.smsSent++;
          } else {
            result.errors.push(`SMS failed for ${customer.phone}: ${smsResult.error}`);
          }
        }

      } catch (customerError: any) {
        result.errors.push(`Error sending to customer ${customer.id}: ${customerError.message}`);
      }
    }

    result.success = true;
    console.log(`[WIN-BACK] Completed: ${result.emailsSent} emails, ${result.smsSent} SMS sent`);

  } catch (error: any) {
    result.errors.push(`Win-back campaign error: ${error.message}`);
    console.error('[WIN-BACK] Send error:', error);
  }

  return result;
}