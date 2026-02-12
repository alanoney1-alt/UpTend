// DamageProtection.ts — Continuous recording with rolling buffer for damage protection
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECORDINGS_KEY = 'uptend_damage_recordings';

export interface RecordingSegment {
  id: string;
  jobId: string;
  uri: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  triggerType: 'impact' | 'manual' | 'auto';
  gForce?: number;
  sizeBytes: number;
  uploaded: boolean;
}

class DamageProtectionService {
  private isRecording = false;
  private segments: RecordingSegment[] = [];
  private bufferDurationMs = 30000; // 30 seconds

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(RECORDINGS_KEY);
      if (stored) this.segments = JSON.parse(stored);
    } catch {}
  }

  startRecording(jobId: string): void {
    if (this.isRecording) return;
    this.isRecording = true;
    console.log('[DamageProtection] Recording started for job:', jobId);
    // In real app: start expo-camera recording with rolling buffer
  }

  stopRecording(): void {
    this.isRecording = false;
    console.log('[DamageProtection] Recording stopped');
  }

  async onImpactDetected(jobId: string, gForce: number): Promise<RecordingSegment> {
    // Save 30sec before + 30sec after impact
    const segment: RecordingSegment = {
      id: `rec_${Date.now()}`,
      jobId,
      uri: `file:///recordings/${jobId}_impact_${Date.now()}.mp4`,
      startTime: new Date(Date.now() - this.bufferDurationMs),
      endTime: new Date(Date.now() + this.bufferDurationMs),
      durationSeconds: 60,
      triggerType: 'impact',
      gForce,
      sizeBytes: 15_000_000, // ~15MB for 60sec
      uploaded: false,
    };
    this.segments.push(segment);
    await this.save();
    return segment;
  }

  async uploadSegment(segmentId: string): Promise<boolean> {
    const segment = this.segments.find(s => s.id === segmentId);
    if (!segment) return false;
    // In real app: upload to cloud storage
    segment.uploaded = true;
    await this.save();
    console.log('[DamageProtection] Uploaded segment:', segmentId);
    return true;
  }

  getSegments(jobId?: string): RecordingSegment[] {
    return jobId ? this.segments.filter(s => s.jobId === jobId) : this.segments;
  }

  getTotalStorageUsed(): number {
    return this.segments.reduce((sum, s) => sum + s.sizeBytes, 0);
  }

  formatStorage(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  async deleteSegment(segmentId: string): Promise<void> {
    this.segments = this.segments.filter(s => s.id !== segmentId);
    await this.save();
  }

  isActive(): boolean {
    return this.isRecording;
  }

  private async save(): Promise<void> {
    await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(this.segments));
  }
}

export const damageProtection = new DamageProtectionService();
