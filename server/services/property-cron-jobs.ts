/**
 * Property Intelligence CRON Jobs
 * 
 * Background jobs that run on schedule:
 * 1. Appliance scan processor (every 30 seconds)
 * 2. Warranty alert dispatcher (daily at 6am)
 * 3. Property health score updater (nightly)
 * 4. Maintenance task scanner (daily at 7am)
 * 5. Notification dispatcher (every 5 minutes)
 */

import { processQueuedScans } from "./appliance-scan-processor";
import { processWarrantyAlerts, updateWarrantyExpirationDays } from "./warranty-alert-engine";
import { processNotificationQueue } from "./notification-engine";
import {
  getPropertiesByUserId,
  getOverdueMaintenanceTasks,
  updateMaintenanceTask,
} from "../storage/domains/properties/storage";

// Track intervals
const intervals: NodeJS.Timeout[] = [];

/**
 * Start all CRON jobs
 */
export function startPropertyCronJobs() {
  console.log("[PropertyCRON] Starting Property Intelligence background jobs...");

  // 1. Appliance Scan Processor (every 30 seconds)
  const scanProcessor = setInterval(async () => {
    try {
      const processed = await processQueuedScans();
      if (processed > 0) {
        console.log(`[PropertyCRON] Processed ${processed} appliance scans`);
      }
    } catch (error) {
      console.error("[PropertyCRON] Scan processor error:", error);
    }
  }, 30000);
  intervals.push(scanProcessor);

  // 2. Warranty Alert Dispatcher (daily at 6am)
  const warrantyAlerts = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 6 && now.getMinutes() < 5) {
      try {
        const sent = await processWarrantyAlerts();
        console.log(`[PropertyCRON] Sent ${sent} warranty alerts`);
      } catch (error) {
        console.error("[PropertyCRON] Warranty alerts error:", error);
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  intervals.push(warrantyAlerts);

  // 3. Warranty Expiration Day Updater (nightly at 1am)
  const warrantyUpdater = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 1 && now.getMinutes() < 5) {
      try {
        const updated = await updateWarrantyExpirationDays();
        console.log(`[PropertyCRON] Updated ${updated} warranty expiration days`);
      } catch (error) {
        console.error("[PropertyCRON] Warranty updater error:", error);
      }
    }
  }, 5 * 60 * 1000);
  intervals.push(warrantyUpdater);

  // 4. Maintenance Task Scanner (daily at 7am)
  const maintenanceScanner = setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 7 && now.getMinutes() < 5) {
      try {
        const tasks = await getOverdueMaintenanceTasks();
        for (const task of tasks) {
          const dueDate = new Date(task.nextDueDate!);
          const overdueBy = Math.floor((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
          await updateMaintenanceTask(task.id, {
            isOverdue: true,
            overdueBy,
          });
        }
        console.log(`[PropertyCRON] Scanned ${tasks.length} overdue maintenance tasks`);
      } catch (error) {
        console.error("[PropertyCRON] Maintenance scanner error:", error);
      }
    }
  }, 5 * 60 * 1000);
  intervals.push(maintenanceScanner);

  // 5. Notification Dispatcher (every 5 minutes)
  const notificationDispatcher = setInterval(async () => {
    try {
      const sent = await processNotificationQueue();
      if (sent > 0) {
        console.log(`[PropertyCRON] Sent ${sent} notifications`);
      }
    } catch (error) {
      console.error("[PropertyCRON] Notification dispatcher error:", error);
    }
  }, 5 * 60 * 1000);
  intervals.push(notificationDispatcher);

  console.log("[PropertyCRON] All background jobs started");
}

/**
 * Stop all CRON jobs (for graceful shutdown)
 */
export function stopPropertyCronJobs() {
  console.log("[PropertyCRON] Stopping all background jobs...");
  intervals.forEach(interval => clearInterval(interval));
  intervals.length = 0;
  console.log("[PropertyCRON] All background jobs stopped");
}

// Start on import (can be disabled if needed)
if (process.env.NODE_ENV !== "test") {
  startPropertyCronJobs();
}
