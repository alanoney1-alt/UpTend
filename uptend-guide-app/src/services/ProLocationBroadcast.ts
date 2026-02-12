// ProLocationBroadcast.ts — Background GPS broadcasting for online pros
import * as Location from 'expo-location';
import { updateProLocation, goOffline } from './ProAvailabilityAPI';

const TASK_NAME = 'UPTEND_PRO_LOCATION_BROADCAST';
const BROADCAST_INTERVAL_MS = 30_000;
const AUTO_OFFLINE_HOURS = 8;
const LOW_BATTERY_THRESHOLD = 0.1;

class ProLocationBroadcastService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onlineSince: Date | null = null;
  private totalOnlineMs = 0;
  private isOnline = false;

  async startBroadcasting(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    // Try background permission
    try {
      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status === 'granted') {
        await this.startBackgroundTask();
      }
    } catch {}

    this.isOnline = true;
    this.onlineSince = new Date();

    // Foreground interval as fallback
    this.intervalId = setInterval(() => this.broadcastLocation(), BROADCAST_INTERVAL_MS);

    // Immediate first broadcast
    await this.broadcastLocation();
    return true;
  }

  async stopBroadcasting(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.onlineSince) {
      this.totalOnlineMs += Date.now() - this.onlineSince.getTime();
      this.onlineSince = null;
    }
    this.isOnline = false;

    try {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    } catch {}

    await goOffline();
    console.log('[ProLocationBroadcast] Stopped');
  }

  getOnlineTimeMinutes(): number {
    let ms = this.totalOnlineMs;
    if (this.onlineSince) ms += Date.now() - this.onlineSince.getTime();
    return Math.round(ms / 60_000);
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  private async broadcastLocation(): Promise<void> {
    try {
      // Auto-offline after max hours
      if (this.onlineSince && Date.now() - this.onlineSince.getTime() > AUTO_OFFLINE_HOURS * 3600_000) {
        console.log('[ProLocationBroadcast] Auto-offline: max hours reached');
        await this.stopBroadcasting();
        return;
      }

      // Battery check (best effort)
      try {
        const Battery = require('expo-battery');
        const level = await Battery.getBatteryLevelAsync();
        if (level > 0 && level < LOW_BATTERY_THRESHOLD) {
          console.log('[ProLocationBroadcast] Auto-offline: low battery');
          await this.stopBroadcasting();
          return;
        }
      } catch {}

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await updateProLocation(loc.coords.latitude, loc.coords.longitude);
    } catch (e) {
      console.warn('[ProLocationBroadcast] Error:', e);
    }
  }

  private async startBackgroundTask(): Promise<void> {
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
    if (isRegistered) return;

    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: BROADCAST_INTERVAL_MS,
      distanceInterval: 20,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'UpTend — You\'re Online',
        notificationBody: 'Customers can see you nearby',
      },
    });
  }
}

export const proLocationBroadcast = new ProLocationBroadcastService();
