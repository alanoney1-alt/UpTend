import { getToken } from './api';

export type MessageType =
  | 'job_status_update'
  | 'pro_location'
  | 'chat_message'
  | 'booking_accepted';

export interface WSMessage {
  type: MessageType;
  payload: any;
}

type Callback = (payload: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<Callback>>();
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private shouldReconnect = true;
  private url = 'wss://uptendapp.com/ws';

  async connect(): Promise<void> {
    const token = await getToken();
    if (!token) return;

    this.shouldReconnect = true;
    this.reconnectDelay = 1000;

    const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.notifySubscribers('connection', { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.notifySubscribers(msg.type, msg.payload);
      } catch {}
    };

    this.ws.onclose = () => {
      this.notifySubscribers('connection', { connected: false });
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleReconnect() {
    setTimeout(() => {
      if (this.shouldReconnect) this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  sendMessage(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  subscribe(type: string, callback: Callback): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);
    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  private notifySubscribers(type: string, payload: any) {
    this.subscribers.get(type)?.forEach((cb) => cb(payload));
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService;
