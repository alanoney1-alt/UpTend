// EmergencySOS.ts — Emergency SOS with shake detection
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOS_CONTACTS_KEY = 'uptend_sos_contacts';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface SOSEvent {
  id: string;
  triggeredAt: Date;
  triggerMethod: 'shake' | 'voice' | 'manual';
  location: { lat: number; lng: number } | null;
  cancelled: boolean;
  dispatched: boolean;
}

class EmergencySOSService {
  private contacts: EmergencyContact[] = [];
  private shakeCount = 0;
  private lastShakeTime = 0;
  private sosCallback?: () => void;
  private countdownTimer?: ReturnType<typeof setTimeout>;
  private isCountingDown = false;

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SOS_CONTACTS_KEY);
      if (stored) this.contacts = JSON.parse(stored);
    } catch {}
  }

  setSOSCallback(callback: () => void): void {
    this.sosCallback = callback;
  }

  onAccelerometerData(magnitude: number): void {
    const now = Date.now();
    if (magnitude > 3.0) {
      if (now - this.lastShakeTime < 2000) {
        this.shakeCount++;
        if (this.shakeCount >= 3) {
          this.triggerSOS('shake');
          this.shakeCount = 0;
        }
      } else {
        this.shakeCount = 1;
      }
      this.lastShakeTime = now;
    }
  }

  triggerSOS(method: 'shake' | 'voice' | 'manual'): SOSEvent {
    const event: SOSEvent = {
      id: `sos_${Date.now()}`,
      triggeredAt: new Date(),
      triggerMethod: method,
      location: null, // In real: get current GPS
      cancelled: false,
      dispatched: false,
    };
    this.isCountingDown = true;
    this.sosCallback?.();
    // 5-second countdown before dispatching
    this.countdownTimer = setTimeout(() => {
      if (!event.cancelled) {
        this.dispatch(event);
      }
      this.isCountingDown = false;
    }, 5000);
    return event;
  }

  cancelSOS(event: SOSEvent): void {
    event.cancelled = true;
    this.isCountingDown = false;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private dispatch(event: SOSEvent): void {
    event.dispatched = true;
    console.log('[SOS] DISPATCHED — alerting UpTend, emergency contacts, sharing GPS');
    // In real: call API, send SMS to emergency contacts, share live GPS
  }

  async addContact(contact: Omit<EmergencyContact, 'id'>): Promise<void> {
    this.contacts.push({ ...contact, id: `ec_${Date.now()}` });
    await AsyncStorage.setItem(SOS_CONTACTS_KEY, JSON.stringify(this.contacts));
  }

  async removeContact(id: string): Promise<void> {
    this.contacts = this.contacts.filter(c => c.id !== id);
    await AsyncStorage.setItem(SOS_CONTACTS_KEY, JSON.stringify(this.contacts));
  }

  getContacts(): EmergencyContact[] {
    return this.contacts;
  }

  getIsCountingDown(): boolean {
    return this.isCountingDown;
  }
}

export const emergencySOS = new EmergencySOSService();
