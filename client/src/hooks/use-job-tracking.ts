import { useState, useEffect, useRef, useCallback } from "react";

interface JobTrackingState {
  status: string | null;
  lastUpdate: any | null;
  isConnected: boolean;
  proLocation: { lat: number; lng: number } | null;
}

export function useJobTracking(jobId: string | undefined) {
  const [state, setState] = useState<JobTrackingState>({
    status: null,
    lastUpdate: null,
    isConnected: false,
    proLocation: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(1000);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!jobId || !mountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?jobId=${jobId}&role=customer`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setState((s) => ({ ...s, isConnected: true }));
      reconnectDelay.current = 1000; // reset backoff
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        setState((s) => {
          const updates: Partial<JobTrackingState> = { lastUpdate: msg };

          if (msg.type === "location_updated") {
            updates.proLocation = { lat: msg.lat, lng: msg.lng };
          }

          // Extract status from job update events
          if (msg.request?.status) {
            updates.status = msg.request.status;
          }
          if (msg.type === "job_accepted") updates.status = "assigned";
          if (msg.type === "job_started") updates.status = "in_progress";
          if (msg.type === "job_completed") updates.status = "completed";

          return { ...s, ...updates };
        });
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setState((s) => ({ ...s, isConnected: false }));
      // Reconnect with exponential backoff (max 30s)
      reconnectTimeout.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [jobId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return state;
}
