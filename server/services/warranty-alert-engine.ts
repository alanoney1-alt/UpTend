/**
 * Warranty Alert Engine
 *
 * Sends automated alerts for warranty expirations:
 * - 90 days before expiration
 * - 60 days before expiration
 * - 30 days before expiration
 * - On expiration day
 *
 * Each alert includes a CTA to book a service before coverage ends.
 */

import {
  getExpiringWarranties,
  updateWarranty,
  createNotification,
  getPropertyById,
} from "../storage/domains/properties/storage";
import type { PropertyWarranty, InsertNotificationQueue } from "../../shared/schema";

interface AlertConfig {
  daysBeforeExpiration: number;
  alertField: "alert90Sent" | "alert60Sent" | "alert30Sent" | "expiredAlertSent";
  alertFieldDate: "alert90SentAt" | "alert60SentAt" | "alert30SentAt" | "expiredAlertSentAt";
  notificationType: "warranty_expiring_90d" | "warranty_expiring_60d" | "warranty_expiring_30d" | "warranty_expired";
  title: string;
  bodyTemplate: (warranty: PropertyWarranty) => string;
  ctaText: string;
}

const ALERT_CONFIGS: AlertConfig[] = [
  {
    daysBeforeExpiration: 90,
    alertField: "alert90Sent",
    alertFieldDate: "alert90SentAt",
    notificationType: "warranty_expiring_90d",
    title: "Warranty Expiring in 90 Days",
    bodyTemplate: (w) => `Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 90 days. Book a service now to use your coverage.`,
    ctaText: "Book Service",
  },
  {
    daysBeforeExpiration: 60,
    alertField: "alert60Sent",
    alertFieldDate: "alert60SentAt",
    notificationType: "warranty_expiring_60d",
    title: "Warranty Expiring in 60 Days",
    bodyTemplate: (w) => `Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 60 days. Don't miss your coverage window.`,
    ctaText: "Book Now",
  },
  {
    daysBeforeExpiration: 30,
    alertField: "alert30Sent",
    alertFieldDate: "alert30SentAt",
    notificationType: "warranty_expiring_30d",
    title: "⚠️ Warranty Expiring in 30 Days!",
    bodyTemplate: (w) => `URGENT: Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 30 days. Schedule service ASAP.`,
    ctaText: "Book ASAP",
  },
  {
    daysBeforeExpiration: 0,
    alertField: "expiredAlertSent",
    alertFieldDate: "expiredAlertSentAt",
    notificationType: "warranty_expired",
    title: "Warranty Expired",
    bodyTemplate: (w) => `Your ${w.warrantyType.replace(/_/g, " ")} warranty has expired. Consider purchasing an extended warranty.`,
    ctaText: "Get Quote",
  },
];

/**
 * Check and send alerts for warranties nearing expiration
 */
export async function processWarrantyAlerts(): Promise<number> {
  let alertsSent = 0;

  for (const config of ALERT_CONFIGS) {
    // Get warranties that need this alert
    const warranties = await getExpiringWarranties(config.daysBeforeExpiration);

    for (const warranty of warranties) {
      // Skip if alert already sent
      if (warranty[config.alertField]) {
        continue;
      }

      // Calculate exact days until expiration
      const endDate = new Date(warranty.endDate);
      const now = new Date();
      const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // Check if it's time to send this alert
      const shouldSend =
        config.daysBeforeExpiration === 0
          ? daysUntilExpiration <= 0
          : daysUntilExpiration <= config.daysBeforeExpiration && daysUntilExpiration > config.daysBeforeExpiration - 1;

      if (!shouldSend) {
        continue;
      }

      try {
        // Get property to find owner
        const property = await getPropertyById(warranty.propertyId);
        if (!property) {
          console.error(`[WarrantyAlerts] Property ${warranty.propertyId} not found`);
          continue;
        }

        // Determine service type based on warranty type
        let serviceType = "home_audit"; // Default
        let deepLink = `/property/${warranty.propertyId}/warranties/${warranty.id}`;

        if (warranty.warrantyType.includes("hvac") || warranty.applianceId) {
          const appliance = warranty.applianceId;
          if (appliance) {
            // TODO: Look up appliance category and suggest appropriate service
            serviceType = "hvac"; // Placeholder
          }
        }

        // Create notification
        const notification: InsertNotificationQueue = {
          id: crypto.randomUUID(),
          userId: property.userId,
          propertyId: warranty.propertyId,
          notificationType: config.notificationType,
          channel: "push", // Could also send email/SMS
          title: config.title,
          body: config.bodyTemplate(warranty),
          deepLink,
          ctaText: config.ctaText,
          ctaLink: `/booking?propertyId=${warranty.propertyId}&warranty=${warranty.id}`,
          scheduledFor: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          relatedWarrantyId: warranty.id,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        await createNotification(notification);

        // Mark alert as sent
        await updateWarranty(warranty.id, {
          [config.alertField]: true,
          [config.alertFieldDate]: new Date().toISOString(),
          daysUntilExpiration,
        });

        // Update status if expired
        if (config.daysBeforeExpiration === 0) {
          await updateWarranty(warranty.id, {
            status: "expired",
          });
        } else if (daysUntilExpiration <= 30) {
          await updateWarranty(warranty.id, {
            status: "expiring_soon",
          });
        }

        alertsSent++;
        console.log(
          `[WarrantyAlerts] Sent ${config.notificationType} alert for warranty ${warranty.id} (${daysUntilExpiration} days left)`
        );
      } catch (error) {
        console.error(`[WarrantyAlerts] Failed to send alert for warranty ${warranty.id}:`, error);
      }
    }
  }

  console.log(`[WarrantyAlerts] Sent ${alertsSent} warranty alerts`);
  return alertsSent;
}

/**
 * Check all warranties and update their days-until-expiration field
 * (Called nightly)
 */
export async function updateWarrantyExpirationDays(): Promise<number> {
  // Get all active warranties
  const warranties = await getExpiringWarranties(9999); // Get all
  let updated = 0;

  for (const warranty of warranties) {
    const endDate = new Date(warranty.endDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    try {
      await updateWarranty(warranty.id, {
        daysUntilExpiration,
      });
      updated++;
    } catch (error) {
      console.error(`[WarrantyAlerts] Failed to update warranty ${warranty.id}:`, error);
    }
  }

  console.log(`[WarrantyAlerts] Updated ${updated} warranty expiration days`);
  return updated;
}
