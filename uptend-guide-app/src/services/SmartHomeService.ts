/**
 * SmartHomeService — interface layer for Ring, Nest, smart locks.
 * Mock implementations for now; real integrations will use OAuth + vendor SDKs.
 */

export interface SmartDevice {
  id: string;
  name: string;
  type: 'lock' | 'camera' | 'doorbell' | 'thermostat';
  brand: 'ring' | 'nest' | 'august' | 'yale' | 'generic';
  status: 'online' | 'offline';
  battery?: number;
}

export interface SmartLockAction {
  deviceId: string;
  action: 'lock' | 'unlock';
  timestamp: Date;
  triggeredBy: string;
}

export interface CameraEvent {
  deviceId: string;
  type: 'motion' | 'person' | 'recording_start' | 'recording_stop';
  timestamp: Date;
  thumbnailUrl?: string;
}

interface SmartHomeProvider {
  getDevices(): Promise<SmartDevice[]>;
  unlockDoor(deviceId: string): Promise<boolean>;
  lockDoor(deviceId: string): Promise<boolean>;
  startRecording(deviceId: string): Promise<boolean>;
  stopRecording(deviceId: string): Promise<boolean>;
  getRecentEvents(deviceId: string): Promise<CameraEvent[]>;
}

class MockSmartHomeProvider implements SmartHomeProvider {
  private devices: SmartDevice[] = [
    { id: 'lock-1', name: 'Front Door Lock', type: 'lock', brand: 'august', status: 'online', battery: 85 },
    { id: 'cam-1', name: 'Front Porch Camera', type: 'camera', brand: 'ring', status: 'online' },
    { id: 'cam-2', name: 'Backyard Camera', type: 'camera', brand: 'ring', status: 'online' },
    { id: 'door-1', name: 'Front Doorbell', type: 'doorbell', brand: 'nest', status: 'online' },
  ];

  async getDevices() { return this.devices; }
  async unlockDoor(deviceId: string) { console.log(`[SmartHome] Unlocked ${deviceId}`); return true; }
  async lockDoor(deviceId: string) { console.log(`[SmartHome] Locked ${deviceId}`); return true; }
  async startRecording(deviceId: string) { console.log(`[SmartHome] Recording started on ${deviceId}`); return true; }
  async stopRecording(deviceId: string) { console.log(`[SmartHome] Recording stopped on ${deviceId}`); return true; }
  async getRecentEvents(deviceId: string): Promise<CameraEvent[]> {
    return [
      { deviceId, type: 'person', timestamp: new Date(), thumbnailUrl: undefined },
    ];
  }
}

class SmartHomeService {
  private static instance: SmartHomeService;
  private provider: SmartHomeProvider;

  private constructor() {
    this.provider = new MockSmartHomeProvider();
  }

  static getInstance(): SmartHomeService {
    if (!this.instance) this.instance = new SmartHomeService();
    return this.instance;
  }

  async getDevices(): Promise<SmartDevice[]> {
    return this.provider.getDevices();
  }

  /**
   * Pro arrival flow:
   * 1. Verify pro identity
   * 2. Unlock smart lock
   * 3. Start camera recording
   * 4. Notify customer
   */
  async handleProArrival(proId: string, jobId: string): Promise<{
    unlocked: boolean;
    recording: boolean;
  }> {
    const devices = await this.getDevices();
    const lock = devices.find((d) => d.type === 'lock' && d.status === 'online');
    const cameras = devices.filter((d) => (d.type === 'camera' || d.type === 'doorbell') && d.status === 'online');

    let unlocked = false;
    let recording = false;

    if (lock) {
      unlocked = await this.provider.unlockDoor(lock.id);
    }

    for (const cam of cameras) {
      const started = await this.provider.startRecording(cam.id);
      if (started) recording = true;
    }

    console.log(`[SmartHome] Pro arrival: unlocked=${unlocked}, recording=${recording}`);
    return { unlocked, recording };
  }

  async handleProDeparture(proId: string, jobId: string): Promise<void> {
    const devices = await this.getDevices();
    const lock = devices.find((d) => d.type === 'lock' && d.status === 'online');
    const cameras = devices.filter((d) => (d.type === 'camera' || d.type === 'doorbell') && d.status === 'online');

    if (lock) await this.provider.lockDoor(lock.id);
    for (const cam of cameras) await this.provider.stopRecording(cam.id);

    console.log('[SmartHome] Pro departure: locked and recording stopped');
  }

  async getLockStatus(): Promise<{ locked: boolean; battery: number } | null> {
    const devices = await this.getDevices();
    const lock = devices.find((d) => d.type === 'lock');
    if (!lock) return null;
    return { locked: true, battery: lock.battery || 100 };
  }
}

export default SmartHomeService;
