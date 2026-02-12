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
  alertField: "alert90DaySent" | "alert60DaySent" | "alert30DaySent" | "expirationAlertSent";
  alertFieldDate: "alert90DaySentAt" | "alert60DaySentAt" | "alert30DaySentAt" | string;
  notificationType: "warranty_expiring_90d" | "warranty_expiring_60d" | "warranty_expiring_30d" | "warranty_expired";
  title: string;
  bodyTemplate: (warranty: PropertyWarranty) => string;
  ctaText: string;
}

const ALERT_CONFIGS: AlertConfig[] = [
  {
    daysBeforeExpiration: 90,
    alertField: "alert90DaySent",
    alertFieldDate: "alert90DaySentAt",
    notificationType: "warranty_expiring_90d",
    title: "Warranty Expiring in 90 Days",
    bodyTemplate: (w) => `Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 90 days. Book a service now to use your coverage.`,
    ctaText: "Book Service",
  },
  {
    daysBeforeExpiration: 60,
    alertField: "alert60DaySent",
    alertFieldDate: "alert60DaySentAt",
    notificationType: "warranty_expiring_60d",
    title: "Warranty Expiring in 60 Days",
    bodyTemplate: (w) => `Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 60 days. Don't miss your coverage window.`,
    ctaText: "Book Now",
  },
  {
    daysBeforeExpiration: 30,
    alertField: "alert30DaySent",
    alertFieldDate: "alert30DaySentAt",
    notificationType: "warranty_expiring_30d",
    title: "⚠️ Warranty Expiring in 30 Days!",
    bodyTemplate: (w) => `URGENT: Your ${w.warrantyType.replace(/_/g, " ")} warranty expires in 30 days. Schedule service ASAP.`,
    ctaText: "Book ASAP",
  },
  {
    daysBeforeExpiration: 0,
    alertField: "expirationAlertSent",
    alertFieldDate: "expirationAlertSent",
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
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // Check if it's time to send this alert
      const shouldSend =
        config.daysBeforeExpiration === 0
          ? daysLeft <= 0
          : daysLeft <= config.daysBeforeExpiration && daysLeft > config.daysBeforeExpiration - 1;

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
        let serviceType = "home_scan"; // Default
        let deepLink = `/property/${warranty.propertyId}/warranties/${warranty.id}`;

        if (warranty.warrantyType.includes("hvac")) {
          serviceType = "hvac"; // Placeholder
        }

        // Create notification
        const notification: InsertNotificationQueue = {
          userId: property.ownerId ?? "",
          propertyId: warranty.propertyId,
          notificationType: config.notificationType,
          channel: "push",
          title: config.title,
          message: config.bodyTemplate(warranty),
          actionUrl: deepLink,
          actionText: config.ctaText,
          scheduledFor: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          warrantyId: warranty.id,
          status: "pending",
          createdAt: new Date().toISOString(),
        };

        await createNotification(notification);

        // Mark alert as sent
        await updateWarranty(warranty.id, {
          [config.alertField]: true,
          [config.alertFieldDate]: new Date().toISOString(),
        });

        // Update status if expired
        if (config.daysBeforeExpiration === 0) {
          await updateWarranty(warranty.id, {
            status: "expired",
          });
        } else if (daysLeft <= 30) {
          await updateWarranty(warranty.id, {
            status: "expiring_soon",
          });
        }

        alertsSent++;
        console.log(
          `[WarrantyAlerts] Sent ${config.notificationType} alert for warranty ${warranty.id} (${daysLeft} days left)`
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
  // Get all active warranties and update expired ones
  const warranties = await getExpiringWarranties(9999);
  let updated = 0;

  for (const warranty of warranties) {
    const endDate = new Date(warranty.endDate);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    try {
      if (daysLeft <= 0 && warranty.status !== "expired") {
        await updateWarranty(warranty.id, { status: "expired" });
        updated++;
      }
    } catch (error) {
      console.error(`[WarrantyAlerts] Failed to update warranty ${warranty.id}:`, error);
    }
  }

  console.log(`[WarrantyAlerts] Updated ${updated} warranty expiration days`);
  return updated;
}
