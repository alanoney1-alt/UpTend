// JobCheckInOut.ts — GPS-based check-in/check-out for pros
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKINS_KEY = 'uptend_checkins';

export interface CheckInRecord {
  jobId: string;
  proId: string;
  address: string;
  scheduledTime: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'pending' | 'checked_in' | 'checked_out' | 'late' | 'no_show';
  actualMinutesOnSite?: number;
  estimatedMinutes: number;
  autoDetected: boolean;
}

const GEOFENCE_RADIUS_METERS = 100;

class JobCheckInOutService {
  private records: CheckInRecord[] = [];

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CHECKINS_KEY);
      if (stored) this.records = JSON.parse(stored);
    } catch {}
  }

  registerJob(jobId: string, proId: string, address: string, scheduledTime: Date, estimatedMinutes: number): CheckInRecord {
    const record: CheckInRecord = {
      jobId, proId, address, scheduledTime, estimatedMinutes,
      status: 'pending', autoDetected: false,
    };
    this.records.push(record);
    this.save();
    return record;
  }

  checkIn(jobId: string, auto: boolean = false): CheckInRecord | null {
    const record = this.records.find(r => r.jobId === jobId);
    if (!record) return null;
    record.checkInTime = new Date();
    record.status = 'checked_in';
    record.autoDetected = auto;
    this.save();
    return record;
  }

  checkOut(jobId: string): CheckInRecord | null {
    const record = this.records.find(r => r.jobId === jobId);
    if (!record || !record.checkInTime) return null;
    record.checkOutTime = new Date();
    record.status = 'checked_out';
    record.actualMinutesOnSite = Math.round((record.checkOutTime.getTime() - record.checkInTime.getTime()) / 60000);
    this.save();
    return record;
  }

  isLate(jobId: string): boolean {
    const record = this.records.find(r => r.jobId === jobId);
    if (!record || record.status !== 'pending') return false;
    return new Date().getTime() > record.scheduledTime.getTime() + 15 * 60000;
  }

  getRecord(jobId: string): CheckInRecord | undefined {
    return this.records.find(r => r.jobId === jobId);
  }

  getActiveCheckIns(): CheckInRecord[] {
    return this.records.filter(r => r.status === 'checked_in');
  }

  getTodayRecords(): CheckInRecord[] {
    const today = new Date().toDateString();
    return this.records.filter(r => new Date(r.scheduledTime).toDateString() === today);
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(this.records));
  }
}

export const jobCheckInOut = new JobCheckInOutService();
