import { sendEmail } from './notifications';

export async function sendProWelcomeEmail(data: { firstName: string; lastName: string; email: string; phone: string; companyName: string; city?: string; state?: string; zipCode?: string; serviceTypes?: string[] }) {
  // Welcome email to the pro
  try {
    await sendEmail({
      to: data.email,
      subject: `Welcome to UpTend, ${data.firstName}! Here's how to start earning`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B1120; color: #e2e8f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #F47C20; margin: 0; font-size: 28px;">Welcome to UpTend</h1>
            <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">One Price. One Pro. Done.</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Hey ${data.firstName}, you're officially an UpTend Pro. Here's everything you need to know to start getting jobs.
          </p>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F47C20;">
            <h2 style="color: #F47C20; margin: 0 0 16px 0; font-size: 20px;">Step 1: Set Up Your Payout</h2>
            <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">
              Before you can receive payments, connect your bank account through Stripe. 
              Log into your <a href="https://uptendapp.com/login?tab=pro" style="color: #F47C20;">Pro Dashboard</a> and go to <strong style="color: white;">Settings > Payment Settings</strong>. 
              Takes about 2 minutes. Once connected, you get paid next business day after every completed job.
            </p>
          </div>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F47C20;">
            <h2 style="color: #F47C20; margin: 0 0 16px 0; font-size: 20px;">Step 2: Review Your Pricing</h2>
            <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">
              Go to <strong style="color: white;">Profile > My Services & Pricing</strong> to review and adjust your rates anytime.
              Your pricing is set per tier for each service (quarter truck vs full truck, 1-story vs 2-story, etc).
              You can update these whenever you want.
            </p>
          </div>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F47C20;">
            <h2 style="color: #F47C20; margin: 0 0 16px 0; font-size: 20px;">Step 3: Go Online</h2>
            <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">
              When you're ready to accept jobs, hit the <strong style="color: white;">Go Online</strong> button on your dashboard. 
              You'll start receiving job requests in your area immediately. Toggle off anytime you need a break.
            </p>
          </div>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F47C20;">
            <h2 style="color: #F47C20; margin: 0 0 16px 0; font-size: 20px;">Step 4: Accept & Complete Jobs</h2>
            <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">
              When a job comes in, you'll see the service type, location, and your payout amount.
              Accept it, head to the address, and do great work. The customer has already paid through the platform, 
              so there's no awkward money conversation on site. When you're done, mark it complete and snap a quick before/after photo.
              Your payout (85% of the job) hits your bank the next business day.
            </p>
          </div>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #22c55e;">
            <h2 style="color: #22c55e; margin: 0 0 16px 0; font-size: 20px;">Meet George</h2>
            <p style="color: #cbd5e1; margin: 0; line-height: 1.6;">
              George is our AI Home Service Agent. He handles all customer communication, scheduling, and job details before you even show up. 
              Need help with anything? Updating your profile, understanding a job scope, changing your availability? 
              Just <a href="https://uptendapp.com" style="color: #22c55e;">talk to George</a> on the website. He knows everything about how UpTend works and he's available 24/7.
            </p>
          </div>

          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h2 style="color: white; margin: 0 0 16px 0; font-size: 20px;">Quick Reference</h2>
            <table style="width: 100%; color: #cbd5e1; font-size: 14px;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #2a3350;">Your payout rate</td><td style="padding: 8px 0; border-bottom: 1px solid #2a3350; text-align: right; font-weight: bold; color: #22c55e;">85% of every job</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #2a3350;">Payment speed</td><td style="padding: 8px 0; border-bottom: 1px solid #2a3350; text-align: right; font-weight: bold; color: white;">Next business day</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #2a3350;">Platform fee</td><td style="padding: 8px 0; border-bottom: 1px solid #2a3350; text-align: right; font-weight: bold; color: white;">15% (customer pays 5% separately)</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #2a3350;">Your dashboard</td><td style="padding: 8px 0; border-bottom: 1px solid #2a3350; text-align: right;"><a href="https://uptendapp.com/login?tab=pro" style="color: #F47C20; text-decoration: none; font-weight: bold;">uptendapp.com/login</a></td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #2a3350;">Need help?</td><td style="padding: 8px 0; border-bottom: 1px solid #2a3350; text-align: right;"><a href="https://uptendapp.com" style="color: #F47C20; text-decoration: none; font-weight: bold;">Ask George</a></td></tr>
              <tr><td style="padding: 8px 0;">Support</td><td style="padding: 8px 0; text-align: right;"><a href="mailto:alan@uptendapp.com" style="color: #F47C20; text-decoration: none; font-weight: bold;">alan@uptendapp.com</a></td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://uptendapp.com/login?tab=pro" style="display: inline-block; background: #F47C20; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Your Dashboard</a>
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
            Welcome aboard, ${data.firstName}. Let's get to work.
          </p>

          <hr style="border: none; border-top: 1px solid #1e293b; margin: 30px 0;">
          <p style="color: #475569; font-size: 12px; text-align: center;">
            UpTend - Home Intelligence<br>
            Orlando Metro Area | (407) 338-3342
          </p>
        </div>
      `,
      text: `Welcome to UpTend, ${data.firstName}!\n\nYou're officially an UpTend Pro. Here's how to start earning:\n\n1. SET UP YOUR PAYOUT: Log into your Pro Dashboard > Settings > Payment Settings. Connect your bank via Stripe. Takes 2 minutes.\n\n2. REVIEW YOUR PRICING: Go to Profile > My Services & Pricing. Adjust your rates per tier anytime.\n\n3. GO ONLINE: Hit the Go Online button on your dashboard to start receiving jobs.\n\n4. ACCEPT & COMPLETE JOBS: Accept a job, show up, do great work. Customer already paid. Mark complete, snap before/after photos. 85% payout hits next business day.\n\nMEET GEORGE: Our AI agent handles all customer communication. Need help? Talk to George at uptendapp.com.\n\nYour dashboard: https://uptendapp.com/login?tab=pro\nSupport: alan@uptendapp.com\n\nWelcome aboard!`,
    });
    console.log(`Pro welcome email sent to ${data.email}`);
  } catch (emailErr) {
    console.error("Failed to send pro welcome email:", emailErr);
  }

  // Notify Alan
  try {
    await sendEmail({
      to: 'alan@uptendapp.com',
      subject: `New Pro Registration: ${data.firstName} ${data.lastName} (${data.companyName})`,
      html: `<div style="font-family: Arial; padding: 20px; background: #0B1120; color: #e2e8f0;">
        <h2 style="color: #F47C20;">New Pro Signed Up</h2>
        <table style="color: #cbd5e1; font-size: 14px;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Name:</td><td>${data.firstName} ${data.lastName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Company:</td><td>${data.companyName}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Email:</td><td>${data.email}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Phone:</td><td>${data.phone}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Services:</td><td>${(data.serviceTypes || []).join(', ')}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Location:</td><td>${data.city || ''}, ${data.state || ''} ${data.zipCode || ''}</td></tr>
        </table>
      </div>`,
      text: `New pro: ${data.firstName} ${data.lastName} / ${data.companyName} / ${data.email} / ${data.phone} / ${(data.serviceTypes || []).join(', ')}`,
    });
  } catch (adminErr) {
    console.error("Failed to send admin pro notification:", adminErr);
  }
}
