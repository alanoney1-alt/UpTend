import { storage } from "../storage";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let isRunning = false;

async function cleanupExpiredLocations(): Promise<void> {
  try {
    const deletedCount = await storage.cleanupExpiredPyckerLocations();
    if (deletedCount > 0) {
      console.log(`[LocationCleanup] Removed ${deletedCount} expired PYCKER location entries`);
    }
  } catch (error) {
    console.error("[LocationCleanup] Error cleaning up expired locations:", error);
  }
}

export function startLocationCleanupService(): void {
  if (isRunning) {
    console.log("[LocationCleanup] Already running");
    return;
  }

  isRunning = true;
  console.log("[LocationCleanup] Starting location cleanup service (hourly)");

  cleanupExpiredLocations();

  setInterval(() => {
    cleanupExpiredLocations().catch(console.error);
  }, CLEANUP_INTERVAL_MS);
}
