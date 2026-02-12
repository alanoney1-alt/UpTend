/**
 * Notification Engine
 *
 * Multi-channel notification dispatcher:
 * - Push notifications (via FCM/APNS)
 * - Email notifications (via SendGrid)
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
import type { NotificationQueue } from "../../shared/schema";

// ==========================================
// CHANNEL HANDLERS (Placeholders - integrate with your services)
// ==========================================

async function sendPushNotification(notification: NotificationQueue): Promise<boolean> {
  // TODO: Integrate with Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)
  // Example:
  // const message = {
  //   notification: {
  //     title: notification.title,
  //     body: notification.body,
  //   },
  //   data: {
  //     deepLink: notification.deepLink,
  //     ctaText: notification.ctaText,
  //     ctaLink: notification.ctaLink,
  //   },
  //   token: userDeviceToken,
  // };
  // await admin.messaging().send(message);

  console.log(`[NotificationEngine] Sending push to user ${notification.userId}: ${notification.title}`);
  return true;
}

async function sendEmailNotification(notification: NotificationQueue): Promise<boolean> {
  // TODO: Integrate with SendGrid or your email service
  // Example:
  // const msg = {
  //   to: userEmail,
  //   from: 'noreply@uptend.com',
  //   subject: notification.title,
  //   html: generateEmailTemplate(notification),
  // };
  // await sgMail.send(msg);

  console.log(`[NotificationEngine] Sending email to user ${notification.userId}: ${notification.title}`);
  return true;
}

async function sendSmsNotification(notification: NotificationQueue): Promise<boolean> {
  // TODO: Integrate with Twilio
  // Example:
  // await twilioClient.messages.create({
  //   body: `${notification.title}\n${notification.body}\n${notification.ctaLink}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: userPhoneNumber,
  // });

  console.log(`[NotificationEngine] Sending SMS to user ${notification.userId}: ${notification.title}`);
  return true;
}

async function createInAppNotification(notification: NotificationQueue): Promise<boolean> {
  // In-app notifications are just database records - already created in notification_queue
  // No action needed here
  console.log(`[NotificationEngine] In-app notification created for user ${notification.userId}`);
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
      // Max retries reached, mark as failed
      await updateNotification(notification.id, {
        status: "failed",
        failureReason: error instanceof Error ? error.message : "Unknown error",
        retryCount,
      });
      console.error(`[NotificationEngine] Notification ${notification.id} failed after ${maxRetries} retries`);
    } else {
      // Retry later
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
