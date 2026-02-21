import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue, QueuedAction } from '../services/offline';

export function useOffline(queueHandler?: (action: QueuedAction) => Promise<boolean>) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true;
      const wasOffline = !isOnline;
      setIsOnline(online);

      if (online && wasOffline && queueHandler) {
        processQueue(queueHandler).catch(() => {});
      }
    });

    return () => unsub();
  }, [isOnline, queueHandler]);

  return { isOnline };
}

export default useOffline;
