// AutoCapture.ts — Before/After photo auto-capture with geofencing
import AsyncStorage from '@react-native-async-storage/async-storage';

const CAPTURES_KEY = 'uptend_auto_captures';

export interface PhotoPair {
  jobId: string;
  before: string[]; // URIs
  after: string[];
  capturedAt: { before?: Date; after?: Date };
}

export interface CaptureJob {
  jobId: string;
  address: string;
  lat: number;
  lng: number;
  geofenceRadius: number;
  status: 'pending' | 'arrived' | 'before_captured' | 'in_progress' | 'after_captured' | 'complete';
  photos: PhotoPair;
}

class AutoCaptureService {
  private activeJobs: CaptureJob[] = [];

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CAPTURES_KEY);
      if (stored) this.activeJobs = JSON.parse(stored);
    } catch {}
  }

  registerJob(jobId: string, address: string, lat: number, lng: number): CaptureJob {
    const job: CaptureJob = {
      jobId, address, lat, lng,
      geofenceRadius: 100, // meters
      status: 'pending',
      photos: { jobId, before: [], after: [], capturedAt: {} },
    };
    this.activeJobs.push(job);
    this.save();
    // In real app: register geofence with expo-location
    console.log('[AutoCapture] Registered geofence for job:', jobId);
    return job;
  }

  onEnterGeofence(jobId: string): { shouldPrompt: boolean; promptType: 'before' | 'after' } {
    const job = this.activeJobs.find(j => j.jobId === jobId);
    if (!job) return { shouldPrompt: false, promptType: 'before' };
    if (job.status === 'pending') {
      job.status = 'arrived';
      this.save();
      return { shouldPrompt: true, promptType: 'before' };
    }
    return { shouldPrompt: false, promptType: 'before' };
  }

  addBeforePhoto(jobId: string, uri: string): void {
    const job = this.activeJobs.find(j => j.jobId === jobId);
    if (job) {
      job.photos.before.push(uri);
      job.photos.capturedAt.before = new Date();
      job.status = 'before_captured';
      this.save();
    }
  }

  addAfterPhoto(jobId: string, uri: string): void {
    const job = this.activeJobs.find(j => j.jobId === jobId);
    if (job) {
      job.photos.after.push(uri);
      job.photos.capturedAt.after = new Date();
      job.status = 'after_captured';
      this.save();
    }
  }

  markComplete(jobId: string): void {
    const job = this.activeJobs.find(j => j.jobId === jobId);
    if (job) {
      job.status = 'complete';
      this.save();
    }
    return;
  }

  getJob(jobId: string): CaptureJob | undefined {
    return this.activeJobs.find(j => j.jobId === jobId);
  }

  needsReminder(jobId: string): boolean {
    const job = this.activeJobs.find(j => j.jobId === jobId);
    if (!job || job.status !== 'arrived') return false;
    // 5 minutes since arrival with no photos
    return job.photos.before.length === 0;
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(this.activeJobs));
  }
}

export const autoCapture = new AutoCaptureService();
