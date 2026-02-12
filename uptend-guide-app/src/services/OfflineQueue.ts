import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  method: string;
  path: string;
  body?: any;
  createdAt: number;
  retries: number;
}

const QUEUE_KEY = '@uptend_offline_queue';
const MAX_RETRIES = 5;

class OfflineQueueService {
  private static instance: OfflineQueueService;
  private isOnline = true;
  private isSyncing = false;
  private listeners: Array<(online: boolean) => void> = [];

  static getInstance(): OfflineQueueService {
    if (!this.instance) this.instance = new OfflineQueueService();
    return this.instance;
  }

  init(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = !!state.isConnected;
      this.listeners.forEach((fn) => fn(this.isOnline));
      if (wasOffline && this.isOnline) {
        this.syncQueue();
      }
    });
  }

  onConnectivityChange(fn: (online: boolean) => void): () => void {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  }

  getIsOnline(): boolean { return this.isOnline; }

  async enqueue(method: string, path: string, body?: any): Promise<void> {
    const queue = await this.getQueue();
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      method, path, body,
      createdAt: Date.now(),
      retries: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Enqueued ${method} ${path} (queue size: ${queue.length})`);
  }

  async getQueue(): Promise<QueuedAction[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async syncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    const queue = await this.getQueue();
    let synced = 0;
    let failed = 0;
    const remaining: QueuedAction[] = [];

    for (const action of queue) {
      try {
        // Import dynamically to avoid circular deps
        const token = await AsyncStorage.getItem('uptend_auth_token_backup');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:5000${action.path}`, {
          method: action.method,
          headers,
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (res.ok) {
          synced++;
        } else if (action.retries < MAX_RETRIES) {
          remaining.push({ ...action, retries: action.retries + 1 });
          failed++;
        }
      } catch {
        if (action.retries < MAX_RETRIES) {
          remaining.push({ ...action, retries: action.retries + 1 });
        }
        failed++;
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    this.isSyncing = false;
    console.log(`[OfflineQueue] Synced: ${synced}, Failed: ${failed}, Remaining: ${remaining.length}`);
    return { synced, failed };
  }

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Wrapper: execute immediately if online, queue if offline
   */
  async executeOrQueue(method: string, path: string, body?: any): Promise<any> {
    if (this.isOnline) {
      try {
        const token = await AsyncStorage.getItem('uptend_auth_token_backup');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:5000${path}`, {
          method, headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        return await res.json();
      } catch {
        await this.enqueue(method, path, body);
        return { queued: true };
      }
    } else {
      await this.enqueue(method, path, body);
      return { queued: true };
    }
  }
}

export default OfflineQueueService;
