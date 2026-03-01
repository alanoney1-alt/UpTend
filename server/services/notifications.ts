import twilio from 'twilio';
import { sanitizePhone } from '../utils/phone';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const FROM_EMAIL = process.env.FROM_EMAIL || 'George from UpTend <alan@uptendapp.com>';

// Prefer API Key auth (more secure), fall back to Account Auth Token
const twilioClient = TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET && TWILIO_ACCOUNT_SID
  ? twilio(TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, { accountSid: TWILIO_ACCOUNT_SID })
  : TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface SmsOptions {
  to: string;
  message: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  // Try Resend first, then SendGrid fallback
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [options.to],
          subject: options.subject,
          html: options.html || undefined,
          text: options.text || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Resend] Email sent to ${options.to} - id: ${data.id}`);
        return { success: true };
      } else {
        const err = await res.text();
        console.error(`[Resend] Error ${res.status}: ${err}`);
        return { success: false, error: `Resend ${res.status}: ${err}` };
      }
    } catch (error: any) {
      console.error('[Resend] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  if (SENDGRID_API_KEY) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: FROM_EMAIL.includes('<') ? FROM_EMAIL.match(/<(.+)>/)?.[1] || 'alan@uptendapp.com' : FROM_EMAIL },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || '' },
            ...(options.html ? [{ type: 'text/html', value: options.html }] : []),
          ],
        }),
      });
      if (res.ok || res.status === 202) {
        console.log(`[SendGrid] Email sent to ${options.to}`);
        return { success: true };
      } else {
        const err = await res.text();
        console.error(`[SendGrid] Error ${res.status}: ${err}`);
        return { success: false, error: `SendGrid ${res.status}: ${err}` };
      }
    } catch (error: any) {
      console.error('[SendGrid] Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  console.warn('No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY) - email not sent');
  return { success: false, error: 'No email provider configured' };
}

export async function sendSms(options: SmsOptions): Promise<{ success: boolean; error?: string; sid?: string; status?: string }> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured - SMS not sent');
    return { success: false, error: 'Twilio not configured' };
  }

  const cleanTo = sanitizePhone(options.to);
  if (!cleanTo) {
    console.warn(`Invalid phone number: ${options.to}`);
    return { success: false, error: 'Invalid phone number format' };
  }

  try {
    const message = await twilioClient.messages.create({
      body: options.message,
      from: TWILIO_PHONE_NUMBER,
      to: cleanTo,
    });
    console.log(`SMS sent to ${options.to} - SID: ${message.sid}, Status: ${message.status}`);
    return { success: true, sid: message.sid, status: message.status };
  } catch (error: any) {
    console.error('Twilio error:', error.message, error.code, error.moreInfo);
    return { success: false, error: `${error.message} (Code: ${error.code})` };
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'UpTend - Your Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
          <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
        </div>
        
        <h2 style="color: #333;">Verify Your Email</h2>
        <p style="color: #666; font-size: 16px;">
          Welcome to UpTend! Use the verification code below to complete your Pro registration:
        </p>
        
        <div style="background: linear-gradient(135deg, #0B1120 0%, #1a2340 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #F47C20;">${code}</span>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This code expires in <strong>10 minutes</strong>. If you didn't request this code, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          UpTend - Home Intelligence<br>
          Orlando Metro Area | (407) 338-3342
        </p>
      </div>
    `,
    text: `Your UpTend verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

export async function sendVerificationSms(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `Your UpTend verification code is: ${code}. This code expires in 10 minutes.`,
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: 'UpTend - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
          <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
        </div>
        
        <h2 style="color: #333;">Reset Your Password</h2>
        <p style="color: #666; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #F47C20 0%, #e06b15 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #F47C20; word-break: break-all;">${resetLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          UpTend - Home Intelligence<br>
          Orlando Metro Area | (407) 338-3342
        </p>
      </div>
    `,
    text: `Reset your UpTend password by visiting: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, please ignore this email.`,
  });
}

export async function sendVerificationCode(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `Your UpTend code is: ${code}. Expires in 10 min.`,
  });
}

export async function sendJobNotification(phone: string, jobDetails: { 
  customerName: string; 
  address: string; 
  serviceType: string;
  estimatedPayout: number;
}): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `New UpTend Job Available!\n${jobDetails.serviceType} at ${jobDetails.address}\nEstimated payout: $${jobDetails.estimatedPayout}\nOpen the app to accept.`,
  });
}

export async function sendBookingConfirmation(
  email: string,
  phone: string,
  jobId: string,
  serviceType: string,
  total: number
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const serviceNames: Record<string, string> = {
    junk_removal: "Junk Removal",
    moving: "Moving",
    truck_unloading: "Truck Unloading",
    garage_cleanout: "Garage Cleanout",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home DNA Scan",
    home_cleaning: "Home Cleaning",
  };

  const serviceName = serviceNames[serviceType] || serviceType;

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: `UpTend Booking Confirmed - ${serviceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>
          
          <h2 style="color: #333;">Booking Confirmed!</h2>
          <p style="color: #666; font-size: 16px;">
            Your ${serviceName} service has been booked successfully.
          </p>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${total.toFixed(2)}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            A Pro will be assigned to your job shortly. You'll receive updates via SMS.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `UpTend Booking Confirmed!\n\nService: ${serviceName}\nJob ID: ${jobId}\nTotal: $${total.toFixed(2)}\n\nA Pro will be assigned shortly.`,
    }),
    sendSms({
      to: phone,
      message: `UpTend Booking Confirmed! Your ${serviceName} job #${jobId.slice(-6)} is booked for $${total.toFixed(2)}. A Pro will contact you soon.`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendPYCKERArrivingSoon(
  phone: string,
  pyckerName: string,
  minutesAway: number
): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `Your Pro ${pyckerName} is ${minutesAway} minute${minutesAway === 1 ? '' : 's'} away! Please be ready. - UpTend`,
  });
}

export async function sendPYCKERArrived(
  phone: string,
  pyckerName: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `Your Pro ${pyckerName} has arrived! They're ready to help. - UpTend`,
  });
}

export async function sendJobCompleted(
  email: string,
  phone: string,
  jobId: string,
  pyckerName: string,
  total: number
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: `UpTend Job Complete - Thank You!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>
          
          <h2 style="color: #333;">Job Complete!</h2>
          <p style="color: #666; font-size: 16px;">
            Your job with ${pyckerName} has been completed successfully.
          </p>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Job ID:</strong> ${jobId}</p>
            <p style="margin: 5px 0;"><strong>Pro:</strong> ${pyckerName}</p>
            <p style="margin: 5px 0;"><strong>Total Charged:</strong> $${total.toFixed(2)}</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Please take a moment to rate your Pro in the app. Your feedback helps us maintain quality service!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `UpTend Job Complete!\n\nYour job with ${pyckerName} is done.\nJob ID: ${jobId}\nTotal: $${total.toFixed(2)}\n\nPlease rate your Pro in the app!`,
    }),
    sendSms({
      to: phone,
      message: `Your UpTend job is complete! ${pyckerName} finished your job. Total: $${total.toFixed(2)}. Please rate your experience in the app!`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}

export async function sendPYCKERJobAccepted(
  customerPhone: string,
  pyckerName: string,
  pyckerPhone: string,
  eta: string
): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: customerPhone,
    message: `Great news! ${pyckerName} accepted your job and will arrive ${eta}. They'll call you shortly. - UpTend`,
  });
}

export function isEmailConfigured(): boolean {
  return !!(RESEND_API_KEY || SENDGRID_API_KEY);
}

export function isSmsConfigured(): boolean {
  return !!(twilioClient && TWILIO_PHONE_NUMBER);
}

// Admin alert for jobs that need manual matching (after Real-Time Matching window expires)
export async function sendManualMatchAlert(
  adminEmail: string,
  adminPhone: string,
  jobDetails: {
    jobId: string;
    customerName: string;
    customerPhone: string;
    serviceType: string;
    pickupAddress: string;
    priceEstimate: number;
  }
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const serviceNames: Record<string, string> = {
    junk_removal: "Junk Removal",
    moving: "Moving",
    truck_unloading: "Truck Unloading",
    garage_cleanout: "Garage Cleanout",
    pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning",
    moving_labor: "Moving Labor",
    light_demolition: "Light Demolition",
    home_consultation: "Home DNA Scan",
    home_cleaning: "Home Cleaning",
  };
  const serviceName = serviceNames[jobDetails.serviceType] || jobDetails.serviceType;

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: adminEmail,
      subject: `URGENT: Manual Pro Match Needed - Job #${jobDetails.jobId.slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ URGENT: Manual Match Required</h1>
          </div>
          
          <div style="background: #fef2f2; padding: 20px; border: 1px solid #dc2626; border-top: none;">
            <p style="color: #dc2626; font-weight: bold; margin-top: 0;">
              No Pro accepted this job via Real-Time Matching. Manual matching required within 5 minutes!
            </p>
            
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0B1120; margin-top: 0;">Job Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Job ID:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobDetails.jobId}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${serviceName}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Customer:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobDetails.customerName}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="tel:${jobDetails.customerPhone}">${jobDetails.customerPhone}</a></td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pickup:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee;">${jobDetails.pickupAddress}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Price:</strong></td><td style="padding: 8px 0;">$${jobDetails.priceEstimate.toFixed(2)}</td></tr>
              </table>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              Customer has been notified they will be connected to a Pro within 5 minutes. Please assign a Pro immediately.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              UpTend Admin Alert System
            </p>
          </div>
        </div>
      `,
      text: `URGENT: Manual Pro Match Needed!\n\nNo Pro accepted job #${jobDetails.jobId.slice(-6)} via Real-Time Matching.\n\nJob Details:\n- Service: ${serviceName}\n- Customer: ${jobDetails.customerName}\n- Phone: ${jobDetails.customerPhone}\n- Pickup: ${jobDetails.pickupAddress}\n- Price: $${jobDetails.priceEstimate.toFixed(2)}\n\nPlease assign a Pro within 5 minutes.`,
    }),
    sendSms({
      to: adminPhone,
      message: `URGENT UpTend: Job #${jobDetails.jobId.slice(-6)} needs manual match! ${jobDetails.customerName} at ${jobDetails.pickupAddress}. $${jobDetails.priceEstimate.toFixed(2)} ${serviceName}. Call customer: ${jobDetails.customerPhone}`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}

// Notify customer that manual matching is in progress
export async function sendManualMatchNotification(
  customerPhone: string,
  customerEmail: string | null
): Promise<{ sms: { success: boolean; error?: string }; email?: { success: boolean; error?: string } }> {
  // Only send SMS if phone is provided
  let smsResult: { success: boolean; error?: string } = { success: false, error: "No phone number provided" };
  if (customerPhone) {
    smsResult = await sendSms({
      to: customerPhone,
      message: `UpTend Update: We're personally connecting you with a Pro. Expect a call within 5 minutes. Thank you for your patience! - UpTend Team`,
    });
  }

  let emailResult;
  if (customerEmail) {
    emailResult = await sendEmail({
      to: customerEmail,
      subject: 'UpTend - Connecting You With a Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>
          
          <h2 style="color: #333;">We're Connecting You Personally</h2>
          <p style="color: #666; font-size: 16px;">
            Our team is personally matching you with the best available Pro for your job. 
            You'll receive a call within the next <strong>5 minutes</strong>.
          </p>
          
          <div style="background: linear-gradient(135deg, #F47C20 0%, #e06b15 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: white; font-size: 18px; margin: 0;">
              Thank you for your patience!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: 'We\'re personally connecting you with a Pro. Expect a call within 5 minutes. Thank you for your patience! - UpTend Team',
    });
  }

  return { sms: smsResult, email: emailResult };
}

export async function sendPropertyTransferEmail(
  toEmail: string,
  fromName: string,
  address: string,
  claimToken: string,
  maintenanceScore: number
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://uptend.app';
  const claimUrl = `${baseUrl}/claim/${claimToken}`;

  return sendEmail({
    to: toEmail,
    subject: `Claim the verified maintenance history for ${address}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
          <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
        </div>
        
        <h2 style="color: #333;">Your New Home Has a Maintenance History</h2>
        <p style="color: #666; font-size: 16px;">
          <strong>${fromName}</strong> has transferred the verified maintenance history 
          for <strong>${address}</strong> to you.
        </p>
        
        <div style="background: linear-gradient(135deg, #0B1120 0%, #1a2340 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 8px 0;">Maintenance Score</p>
          <span style="font-size: 48px; font-weight: bold; color: #F47C20;">${maintenanceScore}</span>
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 8px 0 0 0;">out of 100</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This property has a verified record of professional maintenance services, 
          including documented before/after photos and service certificates. 
          Claim this history to maintain the home's score and unlock insurance benefits.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${claimUrl}" style="display: inline-block; background: linear-gradient(135deg, #F47C20 0%, #e06b15 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Claim Home History</a>
        </div>
        
        <p style="color: #999; font-size: 12px;">
          This link is valid for 30 days. Once claimed, you'll be able to view the full 
          maintenance timeline and continue building your home's score with UpTend services.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          UpTend - Home Intelligence<br>
          Orlando Metro Area | (407) 338-3342
        </p>
      </div>
    `,
    text: `${fromName} has transferred the verified maintenance history for ${address} to you. Maintenance Score: ${maintenanceScore}/100. Claim it here: ${claimUrl}`,
  });
}

export async function sendLaunchNotificationConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: "You're on the UpTend Launch List!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
          <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
        </div>

        <h2 style="color: #333;">You're on the List!</h2>
        <p style="color: #666; font-size: 16px;">
          Thanks for signing up to be notified when UpTend launches in your area!
        </p>

        <div style="background: linear-gradient(135deg, #0B1120 0%, #1a2340 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
          <p style="color: white; font-size: 18px; margin: 0;">
            As an early subscriber, you'll get <strong style="color: #F47C20;">$25 OFF</strong> your first job!
          </p>
        </div>

        <p style="color: #666; font-size: 14px;">
          We're launching soon in the Orlando Metro area (Orange, Seminole, and Osceola counties).
          You'll be the first to know when we go live!
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
          UpTend - Home Intelligence<br>
          Orlando Metro Area | (407) 338-3342
        </p>
      </div>
    `,
    text: "Thanks for signing up to be notified when UpTend launches! As an early subscriber, you'll get $25 OFF your first job. We're launching soon in the Orlando Metro area.",
  });
}

/**
 * Home Cleaning Subscription Confirmation
 * Sent when customer subscribes to recurring cleaning service
 */
export async function sendPolishUpSubscriptionConfirmation(
  email: string,
  phone: string,
  subscriptionDetails: {
    subscriptionId: string;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    cleanType: string;
    price: number;
    nextCleaningDate: string;
  }
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const frequencyLabels = {
    weekly: 'Weekly',
    biweekly: 'Every 2 Weeks',
    monthly: 'Monthly',
  };

  const cleanTypeLabels: Record<string, string> = {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    moveInOut: 'Move-In/Move-Out Clean',
  };

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: 'Home Cleaning Subscription Active - Welcome!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>

          <h2 style="color: #333;">🏠 Welcome to Home Cleaning!</h2>
          <p style="color: #666; font-size: 16px;">
            Your recurring cleaning subscription is now active. Say goodbye to cleaning stress!
          </p>

          <div style="background: linear-gradient(135deg, #ec4899 0%, #d946ef 100%); border-radius: 12px; padding: 30px; color: white; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 20px;">Your Plan</h3>
            <p style="margin: 5px 0;"><strong>Frequency:</strong> ${frequencyLabels[subscriptionDetails.frequency]}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${cleanTypeLabels[subscriptionDetails.cleanType] || subscriptionDetails.cleanType}</p>
            <p style="margin: 5px 0;"><strong>Price:</strong> $${subscriptionDetails.price.toFixed(2)} per visit</p>
            <p style="margin: 5px 0;"><strong>Next Cleaning:</strong> ${new Date(subscriptionDetails.nextCleaningDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>✓ Auto-Booking Enabled:</strong> Your Pro will be automatically scheduled ${frequencyLabels[subscriptionDetails.frequency].toLowerCase()}. No action needed!
            </p>
          </div>

          <h3 style="color: #333; margin-top: 30px;">What Happens Next?</h3>
          <ul style="color: #666; font-size: 14px; line-height: 1.8;">
            <li>You'll receive a reminder 24 hours before each cleaning</li>
            <li>Your preferred Pro (when available) will be assigned automatically</li>
            <li>Before/after photos will be sent after each visit</li>
            <li>Payment processes automatically via your saved card</li>
          </ul>

          <p style="color: #666; font-size: 14px;">
            Manage your subscription anytime at: <a href="https://uptend.app/subscriptions" style="color: #F47C20;">uptend.app/subscriptions</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `Home Cleaning Subscription Active!\n\nFrequency: ${frequencyLabels[subscriptionDetails.frequency]}\nService: ${cleanTypeLabels[subscriptionDetails.cleanType]}\nPrice: $${subscriptionDetails.price} per visit\nNext Cleaning: ${new Date(subscriptionDetails.nextCleaningDate).toLocaleDateString()}\n\nYour Pro will be automatically scheduled. Manage at uptend.app/subscriptions`,
    }),
    sendSms({
      to: phone,
      message: `Welcome to Home Cleaning! Your ${frequencyLabels[subscriptionDetails.frequency].toLowerCase()} cleaning is set up. Next visit: ${new Date(subscriptionDetails.nextCleaningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}. Manage at uptend.app/subscriptions`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}

/**
 * Home Cleaning Cleaning Reminder
 * Sent 24 hours before scheduled cleaning
 */
export async function sendPolishUpReminder(
  email: string,
  phone: string,
  cleaningDetails: {
    cleanType: string;
    scheduledDate: string;
    scheduledTime: string;
    proName?: string;
  }
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const cleanTypeLabels: Record<string, string> = {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    moveInOut: 'Move-In/Move-Out Clean',
  };

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: 'Home Cleaning Cleaning Tomorrow - Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>

          <h2 style="color: #333;">🧹 Cleaning Tomorrow!</h2>
          <p style="color: #666; font-size: 16px;">
            Your Home Cleaning cleaning is scheduled for tomorrow.
          </p>

          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Service:</strong> ${cleanTypeLabels[cleaningDetails.cleanType] || cleaningDetails.cleanType}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(cleaningDetails.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time Window:</strong> ${cleaningDetails.scheduledTime}</p>
            ${cleaningDetails.proName ? `<p style="margin: 5px 0;"><strong>Your Pro:</strong> ${cleaningDetails.proName}</p>` : ''}
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Reminder:</strong> Please ensure pets are secured and any fragile items are moved.
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Need to reschedule or cancel? Manage at: <a href="https://uptend.app/subscriptions" style="color: #F47C20;">uptend.app/subscriptions</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `Home Cleaning Reminder: Your ${cleanTypeLabels[cleaningDetails.cleanType]} is tomorrow ${cleaningDetails.scheduledTime}. ${cleaningDetails.proName ? `Your Pro: ${cleaningDetails.proName}.` : ''} Reschedule at uptend.app/subscriptions`,
    }),
    sendSms({
      to: phone,
      message: `🧹 Home Cleaning reminder: Your cleaning is tomorrow ${cleaningDetails.scheduledTime}. ${cleaningDetails.proName ? `Pro: ${cleaningDetails.proName}.` : ''} Reschedule at uptend.app/subscriptions`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}

/**
 * Home Cleaning Pro En Route Notification
 */
export async function sendPolishUpProEnRoute(
  phone: string,
  proName: string,
  minutesAway: number
): Promise<{ success: boolean; error?: string }> {
  return sendSms({
    to: phone,
    message: `Your Home Cleaning Pro ${proName} is ${minutesAway} minute${minutesAway === 1 ? '' : 's'} away! 🧹`,
  });
}

/**
 * Home Cleaning Cleaning Complete Notification
 * Sent when Pro completes cleaning with before/after photos
 */
export async function sendPolishUpCleaningComplete(
  email: string,
  phone: string,
  cleaningDetails: {
    cleanType: string;
    proName: string;
    cleanlinessScore: number;
    beforePhotosUrl: string;
    afterPhotosUrl: string;
    nextCleaningDate: string;
  }
): Promise<{ email: { success: boolean; error?: string }; sms: { success: boolean; error?: string } }> {
  const cleanTypeLabels: Record<string, string> = {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    moveInOut: 'Move-In/Move-Out Clean',
  };

  const [emailResult, smsResult] = await Promise.all([
    sendEmail({
      to: email,
      subject: 'Home Cleaning Cleaning Complete - See Your Results!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1120; margin: 0;">UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>

          <h2 style="color: #333;">✨ Your Home Sparkles!</h2>
          <p style="color: #666; font-size: 16px;">
            ${cleaningDetails.proName} completed your ${cleanTypeLabels[cleaningDetails.cleanType].toLowerCase()}.
            Your home is Home Cleaning certified clean!
          </p>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; color: white;">
            <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">AI Cleanliness Score</p>
            <p style="margin: 0; font-size: 48px; font-weight: bold;">${cleaningDetails.cleanlinessScore}/10</p>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
              ${cleaningDetails.cleanlinessScore >= 9 ? 'Exceptional!' : cleaningDetails.cleanlinessScore >= 8 ? 'Excellent!' : cleaningDetails.cleanlinessScore >= 7 ? 'Great job!' : 'Good clean!'}
            </p>
          </div>

          <h3 style="color: #333;">Before & After Photos</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
            <a href="${cleaningDetails.beforePhotosUrl}" style="display: block; background: #f3f4f6; padding: 40px 20px; text-align: center; border-radius: 8px; text-decoration: none; color: #6b7280;">
              <p style="margin: 0; font-size: 12px;">📷 Before</p>
            </a>
            <a href="${cleaningDetails.afterPhotosUrl}" style="display: block; background: #d1fae5; padding: 40px 20px; text-align: center; border-radius: 8px; text-decoration: none; color: #059669;">
              <p style="margin: 0; font-size: 12px;">✨ After</p>
            </a>
          </div>

          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
              <strong>Next Cleaning:</strong> ${new Date(cleaningDetails.nextCleaningDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Please rate your Pro in the app. Your feedback helps us maintain quality service!
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `Home Cleaning Complete! ${cleaningDetails.proName} finished your cleaning. AI Score: ${cleaningDetails.cleanlinessScore}/10. Next cleaning: ${new Date(cleaningDetails.nextCleaningDate).toLocaleDateString()}. Rate your Pro in the app!`,
    }),
    sendSms({
      to: phone,
      message: `✨ Your Home Cleaning cleaning is complete! AI score: ${cleaningDetails.cleanlinessScore}/10. See before/after photos in the app. Next visit: ${new Date(cleaningDetails.nextCleaningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
    }),
  ]);

  return { email: emailResult, sms: smsResult };
}
