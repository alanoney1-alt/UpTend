import { Accelerometer } from 'expo-sensors';

interface ImpactEvent {
  id: string;
  timestamp: Date;
  magnitude: number;
  x: number;
  y: number;
  z: number;
  jobId: string;
}

interface IncidentReport {
  id: string;
  jobId: string;
  impacts: ImpactEvent[];
  createdAt: Date;
  severity: 'minor' | 'moderate' | 'severe';
}

const IMPACT_THRESHOLD = 3.0; // g-force threshold for significant impact
const SEVERE_THRESHOLD = 6.0;

class DamageDetectionService {
  private static instance: DamageDetectionService;
  private subscription: any = null;
  private impacts: ImpactEvent[] = [];
  private currentJobId: string | null = null;
  private onImpactCallback?: (event: ImpactEvent) => void;

  static getInstance(): DamageDetectionService {
    if (!this.instance) this.instance = new DamageDetectionService();
    return this.instance;
  }

  startMonitoring(jobId: string, onImpact?: (event: ImpactEvent) => void): void {
    if (this.subscription) this.stopMonitoring();

    this.currentJobId = jobId;
    this.impacts = [];
    this.onImpactCallback = onImpact;

    Accelerometer.setUpdateInterval(100); // 10 readings per second

    this.subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > IMPACT_THRESHOLD) {
        const impact: ImpactEvent = {
          id: `impact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date(),
          magnitude,
          x, y, z,
          jobId,
        };

        this.impacts.push(impact);
        console.log(`[DamageDetection] Impact detected! Magnitude: ${magnitude.toFixed(2)}g`);

        if (this.onImpactCallback) {
          this.onImpactCallback(impact);
        }
      }
    });

    console.log(`[DamageDetection] Monitoring started for job ${jobId}`);
  }

  stopMonitoring(): IncidentReport | null {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    if (this.impacts.length === 0) {
      console.log('[DamageDetection] Monitoring stopped, no impacts detected');
      return null;
    }

    const maxMagnitude = Math.max(...this.impacts.map((i) => i.magnitude));
    const severity = maxMagnitude >= SEVERE_THRESHOLD ? 'severe'
      : maxMagnitude >= IMPACT_THRESHOLD + 1.5 ? 'moderate'
      : 'minor';

    const report: IncidentReport = {
      id: `report-${Date.now()}`,
      jobId: this.currentJobId || 'unknown',
      impacts: [...this.impacts],
      createdAt: new Date(),
      severity,
    };

    console.log(`[DamageDetection] Report generated: ${this.impacts.length} impacts, severity: ${severity}`);
    this.impacts = [];
    this.currentJobId = null;

    return report;
  }

  getImpactCount(): number {
    return this.impacts.length;
  }

  isMonitoring(): boolean {
    return this.subscription !== null;
  }

  getRecentImpacts(count = 10): ImpactEvent[] {
    return this.impacts.slice(-count);
  }
}

export default DamageDetectionService;
