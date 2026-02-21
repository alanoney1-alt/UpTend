/**
 * Notification Engine
 *
 * Multi-channel notification dispatcher:
 * - Push notifications (via Expo Push API)
 * - Email notifications (via SendGrid/nodemailer)
 * - SMS notifications (via Twilio)
 * - In-app notifications (database only)
 *
 * Processes the notification_queue table and sends pending notifications.
 */

import {
  getPendingNotifications,
  updateNotification,
  markNotificationSent,
} from "../storage/domains/properties/storage";
import { storage } from "../storage";
import { sendPushNotification as sendExpoPush } from "./push-notification";
import { sendSms } from "./notifications";
import type { NotificationQueue } from "../../shared/schema";
import { pool } from "../db";

// ==========================================
// CHANNEL HANDLERS
// ==========================================

async function sendPushNotification(notification: NotificationQueue): Promise<boolean> {
  // Look up user's Expo push token (stored via raw SQL column, not in Drizzle schema)
  const result = await pool.query(
    `SELECT expo_push_token FROM users WHERE id = $1`,
    [notification.userId]
  );
  const token: string | null = result.rows[0]?.expo_push_token;

  if (!token) {
    console.warn(`[NotificationEngine] No push token for user ${notification.userId}, skipping push`);
    return false;
  }

  const pushResult = await sendExpoPush(
    token,
    notification.title,
    notification.message,
    {
      deepLink: notification.actionUrl || undefined,
      ctaText: notification.actionText || undefined,
      notificationType: notification.notificationType,
    }
  );

  if (!pushResult.success) {
    // If device not registered, remove the stale token
    if (pushResult.error?.includes("DeviceNotRegistered") || pushResult.error?.includes("InvalidCredentials")) {
      console.warn(`[NotificationEngine] Removing stale push token for user ${notification.userId}`);
      await pool.query(`UPDATE users SET expo_push_token = NULL WHERE id = $1`, [notification.userId]);
    }
    throw new Error(`Push failed: ${pushResult.error}`);
  }

  return true;
}

async function sendEmailNotification(notification: NotificationQueue): Promise<boolean> {
  const user = await storage.getUser(notification.userId);
  if (!user?.email) {
    console.warn(`[NotificationEngine] No email for user ${notification.userId}, skipping email`);
    return false;
  }

  // Dynamic import to avoid circular deps — use the generic send from notifications service
  const { sendEmail } = await import("./notifications");

  const textBody = `${notification.title}\n\n${notification.message}${notification.actionUrl ? `\n\n${notification.actionText || "View"}: ${notification.actionUrl}` : ""}`;

  // Simple branded HTML wrapper
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#F47C20;padding:24px 32px">
  <h1 style="margin:0;color:#fff;font-size:24px">🏠 UpTend</h1>
</td></tr>
<tr><td style="padding:32px">
  <h2 style="margin:0 0 16px;color:#222">${notification.title}</h2>
  <p style="color:#555;line-height:1.6">${notification.message}</p>
  ${notification.actionUrl ? `<div style="text-align:center;margin:24px 0"><a href="${notification.actionUrl}" style="background:#F47C20;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600">${notification.actionText || "View"}</a></div>` : ""}
</td></tr>
<tr><td style="padding:16px 32px;background:#fafafa;color:#999;font-size:12px;text-align:center">
  © ${new Date().getFullYear()} UpTend — Home services, simplified.
</td></tr>
</table></td></tr></table></body></html>`;

  const result = await sendEmail({
    to: user.email,
    subject: notification.title,
    html,
    text: textBody,
  });

  if (!result.success) {
    throw new Error(`Email failed: ${result.error}`);
  }

  return true;
}

async function sendSmsNotification(notification: NotificationQueue): Promise<boolean> {
  const user = await storage.getUser(notification.userId);
  if (!user?.phone) {
    console.warn(`[NotificationEngine] No phone for user ${notification.userId}, skipping SMS`);
    return false;
  }

  const body = `${notification.title}\n${notification.message}${notification.actionUrl ? `\n${notification.actionUrl}` : ""}`;

  const result = await sendSms({
    to: user.phone,
    message: body,
  });

  if (!result.success) {
    throw new Error(`SMS failed: ${result.error}`);
  }

  return true;
}

async function createInAppNotification(_notification: NotificationQueue): Promise<boolean> {
  // In-app notifications are just database records - already created in notification_queue
  return true;
}

// ==========================================
// MAIN DISPATCHER
// ==========================================

async function sendNotification(notification: NotificationQueue): Promise<void> {
  try {
    let success = false;

    switch (notification.channel) {
      case "push":
        success = await sendPushNotification(notification);
        break;
      case "email":
        success = await sendEmailNotification(notification);
        break;
      case "sms":
        success = await sendSmsNotification(notification);
        break;
      case "in_app":
        success = await createInAppNotification(notification);
        break;
      default:
        console.error(`[NotificationEngine] Unknown channel: ${notification.channel}`);
        success = false;
    }

    if (success) {
      await markNotificationSent(notification.id);
      console.log(`[NotificationEngine] Sent ${notification.channel} notification ${notification.id}`);
    } else {
      throw new Error(`Failed to send ${notification.channel} notification`);
    }
  } catch (error) {
    console.error(`[NotificationEngine] Error sending notification ${notification.id}:`, error);

    // Increment retry count
    const retryCount = (notification.retryCount || 0) + 1;
    const maxRetries = notification.maxRetries || 3;

    if (retryCount >= maxRetries) {
      await updateNotification(notification.id, {
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
        retryCount,
      });
      console.error(`[NotificationEngine] Notification ${notification.id} failed after ${maxRetries} retries`);
    } else {
      await updateNotification(notification.id, {
        retryCount,
        failureReason: error instanceof Error ? error.message : "Unknown error",
      });
      console.log(`[NotificationEngine] Notification ${notification.id} will retry (attempt ${retryCount}/${maxRetries})`);
    }
  }
}

// ==========================================
// BATCH PROCESSOR (Called by CRON)
// ==========================================

export async function processNotificationQueue(): Promise<number> {
  const notifications = await getPendingNotifications();

  console.log(`[NotificationEngine] Processing ${notifications.length} pending notifications...`);

  let sent = 0;
  for (const notification of notifications) {
    try {
      await sendNotification(notification);
      sent++;
    } catch (error) {
      console.error(`[NotificationEngine] Failed to process notification ${notification.id}:`, error);
    }

    // Rate limiting: sleep 100ms between sends to avoid overwhelming APIs
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`[NotificationEngine] Sent ${sent}/${notifications.length} notifications`);
  return sent;
}

// ==========================================
// IMMEDIATE SEND (For time-sensitive notifications)
// ==========================================

export async function sendImmediateNotification(
  userId: string,
  propertyId: string | null,
  type: string,
  channel: "push" | "email" | "sms" | "in_app",
  title: string,
  body: string,
  deepLink?: string,
  ctaText?: string,
  ctaLink?: string
): Promise<void> {
  const { createNotification } = await import("../storage/domains/properties/storage");

  const notification = await createNotification({
    userId,
    propertyId: propertyId || undefined,
    notificationType: type as any,
    channel,
    title,
    message: body || "",
    actionUrl: deepLink,
    actionText: ctaText,
    scheduledFor: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  await sendNotification(notification);
}
