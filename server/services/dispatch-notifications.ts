/**
 * Dispatch Notifications Service
 * 
 * Sends SMS/email notifications when job status changes.
 * Calculates ETAs and sends appropriate messages to customers.
 */

import { pool } from "../db";
import { canAccessFeature } from "./tier-gates";
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

const FROM_EMAIL = process.env.FROM_EMAIL || "UpTend <alan@uptendapp.com>";

// Real notification service using Twilio and SendGrid
interface NotificationService {
  sendSMS: (to: string, message: string) => Promise<void>;
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

const notifications: NotificationService = {
  async sendSMS(to: string, message: string) {
    try {
      const result = await sendSMS(to, message);
      if (result.success) {
        console.log(`[SMS] Sent to ${to}: ${message}`);
      } else {
        console.error(`[SMS] Failed to send to ${to}: ${result.error}`);
      }
    } catch (error: any) {
      console.error(`[SMS] Error sending to ${to}:`, error.message);
    }
  },
  
  async sendEmail(to: string, subject: string, body: string) {
    try {
      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });
      console.log(`[EMAIL] Sent to ${to}: ${subject}`);
    } catch (error: any) {
      console.error(`[EMAIL] Error sending to ${to}:`, error.message);
    }
  }
};

/**
 * Calculate straight-line distance ETA in minutes
 */
function calculateETA(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  // Calculate distance in miles
  const R = 3959;
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  // Assume average speed of 30 mph in city traffic
  const avgSpeedMph = 30;
  const etaMinutes = (distance / avgSpeedMph) * 60;
  
  return Math.round(etaMinutes);
}

/**
 * Get pro's current location
 */
async function getProLocation(proId: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const result = await pool.query(`
      SELECT lat, lng
      FROM pro_locations
      WHERE pro_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1
    `, [proId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error getting pro location:', error);
    return null;
  }
}

/**
 * Send notification when job status changes
 */
export async function sendDispatchNotification(job: any, status: string): Promise<void> {
  try {
    // Skip notifications if no customer contact info
    if (!job.customer_phone && !job.customer_email) {
      return;
    }

    const customerName = job.customer_name || 'Customer';
    let message = '';
    let subject = '';
    let emailBody = '';

    // Get pro info if assigned
    let proName = 'Your technician';
    if (job.assigned_pro_id) {
      const proResult = await pool.query(`
        SELECT first_name, last_name FROM users WHERE id = $1
      `, [job.assigned_pro_id]);
      
      if (proResult.rows.length > 0) {
        const pro = proResult.rows[0];
        proName = `${pro.first_name} ${pro.last_name}`;
      }
    }

    switch (status) {
      case 'dispatched':
        subject = 'Your technician has been assigned';
        message = `Hi ${customerName}! ${proName} has been assigned to your ${job.service_type} service at ${job.customer_address}. We'll notify you when they're on the way.`;
        emailBody = `
          <p>Hi ${customerName}!</p>
          <p>${proName} has been assigned to your ${job.service_type} service.</p>
          <p><strong>Address:</strong> ${job.customer_address}</p>
          <p><strong>Scheduled:</strong> ${new Date(job.scheduled_date).toLocaleDateString()}</p>
          <p>We'll notify you when they're on the way. Thank you for choosing UpTend!</p>
        `;
        break;

      case 'en_route':
        // Only send ETA for growth+ partners
        const hasEtaFeature = await canAccessFeature(job.partner_slug, 'customer_eta_notifications');
        
        if (hasEtaFeature && job.assigned_pro_id && job.customer_lat && job.customer_lng) {
          const proLocation = await getProLocation(job.assigned_pro_id);
          if (proLocation) {
            const eta = calculateETA(proLocation.lat, proLocation.lng, job.customer_lat, job.customer_lng);
            subject = `${proName} is on the way`;
            message = `${proName} is on the way to your ${job.service_type} service. ETA: ${eta} minutes. Address: ${job.customer_address}`;
            emailBody = `
              <p>Hi ${customerName}!</p>
              <p>${proName} is on the way to your ${job.service_type} service.</p>
              <p><strong>ETA:</strong> ${eta} minutes</p>
              <p><strong>Address:</strong> ${job.customer_address}</p>
              <p>Please be available for their arrival. Thank you!</p>
            `;
          } else {
            // Fallback without ETA
            subject = `${proName} is on the way`;
            message = `${proName} is on the way to your ${job.service_type} service at ${job.customer_address}. They'll be there soon!`;
            emailBody = `
              <p>Hi ${customerName}!</p>
              <p>${proName} is on the way to your ${job.service_type} service.</p>
              <p><strong>Address:</strong> ${job.customer_address}</p>
              <p>They'll be there soon! Please be available for their arrival.</p>
            `;
          }
        } else {
          // Basic message for starter tier
          subject = `${proName} is on the way`;
          message = `${proName} is on the way to your ${job.service_type} service at ${job.customer_address}`;
          emailBody = `
            <p>Hi ${customerName}!</p>
            <p>${proName} is on the way to your ${job.service_type} service.</p>
            <p><strong>Address:</strong> ${job.customer_address}</p>
            <p>Please be available for their arrival. Thank you!</p>
          `;
        }
        break;

      case 'arrived':
        subject = `${proName} has arrived`;
        message = `${proName} has arrived at ${job.customer_address} for your ${job.service_type} service.`;
        emailBody = `
          <p>Hi ${customerName}!</p>
          <p>${proName} has arrived at your location for your ${job.service_type} service.</p>
          <p><strong>Address:</strong> ${job.customer_address}</p>
          <p>Please let them know you're ready when convenient.</p>
        `;
        break;

      case 'in_progress':
        // Optional notification - some partners prefer not to send this
        return;

      case 'completed':
        subject = 'Your service is complete';
        const reviewLink = `${process.env.FRONTEND_URL || 'https://uptend.app'}/track/${job.id}#review`;
        message = `Your ${job.service_type} service is complete! Thank you for choosing UpTend. Please rate your experience: ${reviewLink}`;
        emailBody = `
          <p>Hi ${customerName}!</p>
          <p>Your ${job.service_type} service is complete!</p>
          <p><strong>Completed by:</strong> ${proName}</p>
          <p><strong>Address:</strong> ${job.customer_address}</p>
          <p>Thank you for choosing UpTend. We'd love to hear about your experience:</p>
          <p><a href="${reviewLink}" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rate Your Service</a></p>
        `;
        break;

      default:
        return; // No notification for other statuses
    }

    // Send SMS if phone number provided
    if (job.customer_phone && message) {
      await notifications.sendSMS(job.customer_phone, message);
    }

    // Send email if email provided
    if (job.customer_email && subject && emailBody) {
      await notifications.sendEmail(job.customer_email, subject, emailBody);
    }

    // Log the notification
    console.log(`[DISPATCH NOTIFICATION] Job ${job.id} | Status: ${status} | Customer: ${customerName}`);

  } catch (error) {
    console.error('Error sending dispatch notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send bulk notifications (for batch status updates)
 */
export async function sendBulkDispatchNotifications(jobs: any[], status: string): Promise<void> {
  const promises = jobs.map(job => sendDispatchNotification(job, status));
  await Promise.allSettled(promises); // Continue even if some notifications fail
}

/**
 * Send custom notification to customer
 */
export async function sendCustomNotification(
  jobId: string, 
  message: string, 
  channel: 'sms' | 'email' | 'both' = 'both'
): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT customer_name, customer_phone, customer_email 
      FROM dispatch_jobs 
      WHERE id = $1
    `, [jobId]);

    if (result.rows.length === 0) {
      throw new Error('Job not found');
    }

    const job = result.rows[0];

    if ((channel === 'sms' || channel === 'both') && job.customer_phone) {
      await notifications.sendSMS(job.customer_phone, message);
    }

    if ((channel === 'email' || channel === 'both') && job.customer_email) {
      await notifications.sendEmail(job.customer_email, 'Update on your service', `
        <p>Hi ${job.customer_name}!</p>
        <p>${message}</p>
        <p>Thank you for choosing UpTend!</p>
      `);
    }
  } catch (error) {
    console.error('Error sending custom notification:', error);
    throw error;
  }
}