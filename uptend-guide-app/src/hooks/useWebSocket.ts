import { useEffect, useState, useCallback, useRef } from 'react';
import wsService, { WSMessage } from '../services/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    wsService.connect();

    const unsubConn = wsService.subscribe('connection', ({ connected }) => {
      setIsConnected(connected);
    });

    const messageTypes = ['job_status_update', 'pro_location', 'chat_message', 'booking_accepted'] as const;
    const unsubs = messageTypes.map((type) =>
      wsService.subscribe(type, (payload) => {
        setLastMessage({ type, payload });
      })
    );

    return () => {
      unsubConn();
      unsubs.forEach((u) => u());
      wsService.disconnect();
    };
  }, []);

  const send = useCallback((type: string, payload: any) => {
    wsService.sendMessage(type, payload);
  }, []);

  return { isConnected, lastMessage, send };
}

export default useWebSocket;
