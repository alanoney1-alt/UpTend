// LiveProTracking.ts — WebSocket connection for real-time pro location updates
import { ProLocation } from './ProAvailabilityAPI';

const WS_URL = __DEV__ ? 'ws://localhost:5000/ws' : 'wss://api.uptend.com/ws';

export type ProUpdateEvent =
  | { type: 'location'; proId: string; lat: number; lng: number }
  | { type: 'status'; proId: string; status: ProLocation['status']; estimatedDoneMin?: number }
  | { type: 'online'; pro: ProLocation }
  | { type: 'offline'; proId: string }
  | { type: 'count'; nearbyCount: number };

type Listener = (event: ProUpdateEvent) => void;

class LiveProTrackingService {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isConnected = false;
  private isForeground = true;
  private mockInterval: ReturnType<typeof setInterval> | null = null;
  private customerLat = 28.5505;
  private customerLng = -81.3780;

  connect(lat: number, lng: number): void {
    this.customerLat = lat;
    this.customerLng = lng;

    try {
      this.ws = new WebSocket(`${WS_URL}?lat=${lat}&lng=${lng}&role=customer`);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[LiveProTracking] WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data: ProUpdateEvent = JSON.parse(event.data);
          this.emit(data);
        } catch {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log('[LiveProTracking] WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        console.log('[LiveProTracking] WebSocket error, falling back to mock');
        this.startMockUpdates();
      };
    } catch {
      console.log('[LiveProTracking] WebSocket unavailable, using mock');
      this.startMockUpdates();
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopMockUpdates();
    this.isConnected = false;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  setForeground(isForeground: boolean): void {
    this.isForeground = isForeground;
    // Adjust mock update frequency
    if (this.mockInterval) {
      this.stopMockUpdates();
      this.startMockUpdates();
    }
  }

  getIsConnected(): boolean {
    return this.isConnected || this.mockInterval !== null;
  }

  private emit(event: ProUpdateEvent): void {
    this.listeners.forEach(l => {
      try { l(event); } catch {}
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[LiveProTracking] Max reconnect attempts, falling back to mock');
      this.startMockUpdates();
      return;
    }
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.customerLat, this.customerLng);
    }, delay);
  }

  // --- Mock data simulation ---
  private mockProPositions: Map<string, { lat: number; lng: number }> = new Map();
  private mockProIds = ['pro_1', 'pro_2', 'pro_3', 'pro_4', 'pro_5', 'pro_6', 'pro_7', 'pro_8', 'pro_9', 'pro_10', 'pro_11', 'pro_12', 'pro_13', 'pro_14'];

  private startMockUpdates(): void {
    if (this.mockInterval) return;

    // Initialize positions
    this.mockProIds.forEach((id, i) => {
      const angle = (i / this.mockProIds.length) * Math.PI * 2;
      const dist = 0.01 + Math.random() * 0.02;
      this.mockProPositions.set(id, {
        lat: this.customerLat + Math.sin(angle) * dist,
        lng: this.customerLng + Math.cos(angle) * dist,
      });
    });

    const interval = this.isForeground ? 3000 : 15000; // 3s foreground, 15s background

    this.mockInterval = setInterval(() => {
      // Simulate 1-3 location updates per tick
      const updateCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < updateCount; i++) {
        const proId = this.mockProIds[Math.floor(Math.random() * this.mockProIds.length)];
        const pos = this.mockProPositions.get(proId);
        if (!pos) continue;

        // Small random movement
        const newPos = {
          lat: pos.lat + (Math.random() - 0.5) * 0.001,
          lng: pos.lng + (Math.random() - 0.5) * 0.001,
        };
        this.mockProPositions.set(proId, newPos);

        this.emit({
          type: 'location',
          proId,
          lat: newPos.lat,
          lng: newPos.lng,
        });
      }

      // Occasionally send status changes
      if (Math.random() < 0.1) {
        const proId = this.mockProIds[Math.floor(Math.random() * this.mockProIds.length)];
        const statuses: ProLocation['status'][] = ['available', 'busy', 'finishing_soon'];
        this.emit({
          type: 'status',
          proId,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          estimatedDoneMin: Math.floor(Math.random() * 45) + 5,
        });
      }

      // Count update
      if (Math.random() < 0.15) {
        this.emit({
          type: 'count',
          nearbyCount: this.mockProIds.length + Math.floor(Math.random() * 4) - 2,
        });
      }
    }, interval);

    this.isConnected = true;
    console.log('[LiveProTracking] Mock updates started');
  }

  private stopMockUpdates(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}

export const liveProTracking = new LiveProTrackingService();
