// SurgePricing.ts — Monitor demand vs supply for surge pricing
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SurgeZone {
  id: string;
  area: string;
  serviceType: string;
  multiplier: number;
  pendingJobs: number;
  availablePros: number;
  expiresAt: Date;
}

const MOCK_SURGES: SurgeZone[] = [
  { id: 's1', area: 'Winter Park', serviceType: 'Junk Removal', multiplier: 1.5, pendingJobs: 12, availablePros: 3, expiresAt: new Date(Date.now() + 7200000) },
  { id: 's2', area: 'Downtown Orlando', serviceType: 'Pressure Washing', multiplier: 1.3, pendingJobs: 8, availablePros: 4, expiresAt: new Date(Date.now() + 14400000) },
  { id: 's3', area: 'Lake Nona', serviceType: 'Lawn Care', multiplier: 1.8, pendingJobs: 15, availablePros: 2, expiresAt: new Date(Date.now() + 3600000) },
  { id: 's4', area: 'Kissimmee', serviceType: 'Moving Help', multiplier: 1.4, pendingJobs: 6, availablePros: 3, expiresAt: new Date(Date.now() + 10800000) },
];

class SurgePricingService {
  private surgeZones: SurgeZone[] = MOCK_SURGES;
  private listeners: ((zones: SurgeZone[]) => void)[] = [];

  getActiveSurges(): SurgeZone[] {
    return this.surgeZones.filter(s => s.expiresAt > new Date());
  }

  getSurgeForService(serviceType: string): SurgeZone[] {
    return this.getActiveSurges().filter(s => s.serviceType.toLowerCase().includes(serviceType.toLowerCase()));
  }

  getHighestSurge(): SurgeZone | null {
    const active = this.getActiveSurges();
    return active.sort((a, b) => b.multiplier - a.multiplier)[0] || null;
  }

  getSurgeCount(): number {
    return this.getActiveSurges().length;
  }

  onSurgeUpdate(callback: (zones: SurgeZone[]) => void): () => void {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  }

  formatMultiplier(multiplier: number): string {
    return `${multiplier.toFixed(1)}x`;
  }

  estimateEarnings(baseRate: number, multiplier: number): number {
    return Math.round(baseRate * multiplier);
  }
}

export const surgePricing = new SurgePricingService();
