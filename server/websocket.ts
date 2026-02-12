import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { URL } from "url";

// Room-based WebSocket management
const jobRooms = new Map<string, Set<WebSocket>>();

interface WsClient extends WebSocket {
  jobId?: string;
  role?: string;
  isAlive?: boolean;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Monkey-patch the server's emit to intercept 'upgrade' events for /ws
  // before Vite HMR can destroy the socket. This is necessary because
  // Node.js EventEmitter doesn't support stopPropagation.
  const originalEmit = server.emit.bind(server);
  server.emit = function (event: string, ...args: any[]) {
    if (event === "upgrade") {
      const request = args[0] as IncomingMessage;
      const socket = args[1];
      const head = args[2] as Buffer;
      const url = new URL(request.url || "/", `http://${request.headers.host}`);
      if (url.pathname === "/ws") {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
        return true; // Swallow the event — don't propagate to Vite
      }
    }
    return originalEmit(event, ...args);
  } as any;

  wss.on("connection", (ws: WsClient, request: IncomingMessage) => {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const jobId = url.searchParams.get("jobId");
    const role = url.searchParams.get("role") || "customer";

    ws.isAlive = true;
    ws.jobId = jobId || undefined;
    ws.role = role;

    // Auto-join job room if jobId provided
    if (jobId) {
      joinRoom(jobId, ws);
    }

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join-job" && message.jobId) {
          // Leave old room if switching
          if (ws.jobId && ws.jobId !== message.jobId) {
            leaveRoom(ws.jobId, ws);
          }
          ws.jobId = message.jobId;
          joinRoom(message.jobId, ws);
        } else if (message.type === "leave-job" && message.jobId) {
          leaveRoom(message.jobId, ws);
          ws.jobId = undefined;
        } else if (message.type === "customer_location_update" && ws.jobId) {
          // Forward customer location to pros in the same room
          broadcastToJob(ws.jobId, {
            type: "customer_location_update",
            ...message.data,
          }, ws); // exclude sender
        } else if (message.type === "location_update" && ws.jobId) {
          // Pro location update — forward to customers
          broadcastToJob(ws.jobId, {
            type: "location_updated",
            lat: message.data?.lat || message.lat,
            lng: message.data?.lng || message.lng,
          }, ws);
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (ws.jobId) {
        leaveRoom(ws.jobId, ws);
      }
    });

    // Send connection confirmation
    ws.send(JSON.stringify({ type: "connected", jobId, role }));
  });

  // Heartbeat to clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WsClient) => {
      if (ws.isAlive === false) {
        if (ws.jobId) leaveRoom(ws.jobId, ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  console.log("✅ WebSocket server initialized on /ws");
  return wss;
}

function joinRoom(jobId: string, ws: WebSocket) {
  if (!jobRooms.has(jobId)) {
    jobRooms.set(jobId, new Set());
  }
  jobRooms.get(jobId)!.add(ws);
}

function leaveRoom(jobId: string, ws: WebSocket) {
  const room = jobRooms.get(jobId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) {
      jobRooms.delete(jobId);
    }
  }
}

/**
 * Broadcast a message to all clients watching a specific job.
 * @param jobId - The job/service-request ID
 * @param message - Object to JSON-serialize and send
 * @param exclude - Optional WebSocket to exclude (e.g., the sender)
 */
export function broadcastToJob(jobId: string, message: object, exclude?: WebSocket) {
  const room = jobRooms.get(jobId);
  if (!room || room.size === 0) {
    return;
  }

  const payload = JSON.stringify(message);
  let sent = 0;

  room.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(payload);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[WS] Broadcast to job ${jobId}: ${(message as any).type || "update"} → ${sent} client(s)`);
  }
}
