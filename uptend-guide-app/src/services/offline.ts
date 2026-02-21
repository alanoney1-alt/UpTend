import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@uptend_offline_queue';

export async function cacheData(key: string, data: any): Promise<void> {
  await AsyncStorage.setItem(
    `@cache_${key}`,
    JSON.stringify({ data, timestamp: Date.now() })
  );
}

export async function getCachedData<T = any>(key: string, maxAgeMs: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(`@cache_${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  createdAt: number;
}

export async function queueAction(action: Omit<QueuedAction, 'id' | 'createdAt'>): Promise<void> {
  const queue = await getQueue();
  queue.push({ ...action, id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, createdAt: Date.now() });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function getQueue(): Promise<QueuedAction[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function processQueue(
  handler: (action: QueuedAction) => Promise<boolean>
): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  const remaining: QueuedAction[] = [];
  let processed = 0;

  for (const action of queue) {
    try {
      const success = await handler(action);
      if (success) {
        processed++;
      } else {
        remaining.push(action);
      }
    } catch {
      remaining.push(action);
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return processed;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
}
