import type { Server } from "http";
import type { IncomingMessage } from "http";
import type { Express } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../../storage";
import { locationUpdateSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "../../db";
import { chatMessages, haulerRiskProfile } from "@shared/schema";
import { sql } from "drizzle-orm";
import { URL } from "url";

// WebSocket connection tracking
const jobConnections = new Map<string, Set<WebSocket>>();
const wsConnectionMeta = new WeakMap<WebSocket, { role?: string; jobId?: string; userId?: string; isAlive?: boolean }>();
const jobConnectionTTL = new Map<string, NodeJS.Timeout>();

const JOB_CONNECTION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function resetJobConnectionTTL(jobId: string) {
  const existingTimer = jobConnectionTTL.get(jobId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    const connections = jobConnections.get(jobId);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Job connection TTL expired');
        }
      });
      jobConnections.delete(jobId);
      jobConnectionTTL.delete(jobId);
    }
  }, JOB_CONNECTION_TTL_MS);

  jobConnectionTTL.set(jobId, timer);
}

function joinRoom(jobId: string, ws: WebSocket) {
  if (!jobConnections.has(jobId)) {
    jobConnections.set(jobId, new Set());
  }
  jobConnections.get(jobId)!.add(ws);
  resetJobConnectionTTL(jobId);
}

function leaveRoom(jobId: string, ws: WebSocket) {
  const connections = jobConnections.get(jobId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      jobConnections.delete(jobId);
      const timer = jobConnectionTTL.get(jobId);
      if (timer) {
        clearTimeout(timer);
        jobConnectionTTL.delete(jobId);
      }
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
  const connections = jobConnections.get(jobId);
  if (!connections || connections.size === 0) return;

  const data = JSON.stringify(message);
  let sent = 0;

  connections.forEach(ws => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
      sent++;
    }
  });

  if (sent > 0) {
    console.log(`[WS] Broadcast to job ${jobId}: ${(message as any).type || "update"} → ${sent} client(s)`);
  }
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Registers the UNIFIED WebSocket server for real-time communication.
 * Uses noServer mode + monkey-patched upgrade to survive Vite HMR.
 * Handles: job rooms, location tracking, chat, SafeComms, geofence auto-arrival.
 */
export function registerWebSocketHandlers(server: Server, app: Express): Server {
  const wss = new WebSocketServer({ noServer: true });

  // Monkey-patch server.emit to intercept 'upgrade' events for /ws
  // before Vite HMR can destroy the socket.
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
        return true; // Swallow — don't propagate to Vite
      }
    }
    return originalEmit(event, ...args);
  } as any;

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const jobId = url.searchParams.get("jobId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role") || undefined;

    const meta = { role, jobId: jobId || undefined, userId: userId || undefined, isAlive: true };
    wsConnectionMeta.set(ws, meta);

    // Auto-join job room if jobId provided
    if (jobId) {
      joinRoom(jobId, ws);
    }

    // Send connection confirmation
    ws.send(JSON.stringify({ type: "connected", jobId, role }));

    ws.on("pong", () => {
      const m = wsConnectionMeta.get(ws);
      if (m) m.isAlive = true;
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const connMeta = wsConnectionMeta.get(ws);
        const currentJobId = connMeta?.jobId;
        const currentUserId = connMeta?.userId || userId;

        // ── Room management ──
        if (message.type === "join-job" && message.jobId) {
          if (currentJobId && currentJobId !== message.jobId) {
            leaveRoom(currentJobId, ws);
          }
          if (connMeta) connMeta.jobId = message.jobId;
          joinRoom(message.jobId, ws);
          return;
        }

        if (message.type === "leave-job" && message.jobId) {
          leaveRoom(message.jobId, ws);
          if (connMeta) connMeta.jobId = undefined;
          return;
        }

        // ── Hauler location updates (with persistence + geofence) ──
        if (message.type === "location_update" && currentUserId) {
          if (connMeta?.role !== "hauler") return;

          const location = locationUpdateSchema.parse(message.data);
          await storage.addLocationHistory({
            userId: currentUserId,
            jobId: currentJobId || undefined,
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            heading: location.heading,
            speed: location.speed,
            recordedAt: new Date().toISOString(),
          });

          if (currentJobId) {
            broadcastToJob(currentJobId, {
              type: "location_updated",
              userId: currentUserId,
              role: "hauler",
              ...location,
              timestamp: new Date().toISOString(),
            }, ws);

            // GHOST BUSTER: Auto-detect arrival via geofence (within 0.1 miles / ~500ft)
            try {
              const job = await storage.getServiceRequest(currentJobId);
              if (job && job.pickupLat && job.pickupLng && !job.arrivedAt) {
                const dist = haversineDistance(location.lat, location.lng, job.pickupLat, job.pickupLng);
                if (dist < 0.1) {
                  await storage.updateServiceRequest(currentJobId, {
                    arrivedAt: new Date().toISOString(),
                    status: "arrived",
                  });
                  broadcastToJob(currentJobId, { type: "worker_arrived", jobId: currentJobId, arrivedAt: new Date().toISOString() });
                }
              }
            } catch (geoErr) {
              console.error("Geofence check error:", geoErr);
            }
          }
          return;
        }

        // ── Customer location updates ──
        if (message.type === "customer_location_update" && currentJobId) {
          if (connMeta?.role !== "customer") return;

          const customerLocationSchema = z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            accuracy: z.number().min(0).max(10000).nullable().optional(),
          });
          const parseResult = customerLocationSchema.safeParse(message.data);
          if (parseResult.success) {
            broadcastToJob(currentJobId, {
              type: "customer_location_updated",
              ...parseResult.data,
              timestamp: new Date().toISOString(),
            }, ws);
          }
          return;
        }

        // ── SAFECOMMS: Chat message with privacy firewall ──
        if (message.type === "send_message" && currentJobId && currentUserId) {
          const phoneRegex = /(\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
          const leakageKeywords = /venmo|cash\s*app|zelle|cancel.*app|my\s*number|phone\s*number/i;

          let finalContent = message.content || "";
          let isRedacted = false;

          if (phoneRegex.test(finalContent)) {
            finalContent = finalContent.replace(phoneRegex, "[NUMBER REDACTED FOR SAFETY]");
            isRedacted = true;
          }

          if (leakageKeywords.test(message.content || "")) {
            console.warn(`[LEAKAGE ALERT] User ${currentUserId} mentioned payment keywords in job ${currentJobId}.`);
            try {
              await db.execute(sql`
                INSERT INTO hauler_risk_profile (id, hauler_id, keywords_detected, risk_score, last_incident_at)
                VALUES (gen_random_uuid(), ${currentUserId}, 1, 10, ${new Date().toISOString()})
                ON CONFLICT (hauler_id)
                DO UPDATE SET
                  keywords_detected = hauler_risk_profile.keywords_detected + 1,
                  risk_score = hauler_risk_profile.risk_score + 10,
                  last_incident_at = ${new Date().toISOString()}
              `);
            } catch (riskProfileErr) {
              console.error("Failed to update risk profile:", riskProfileErr);
            }
          }

          try {
            await db.insert(chatMessages).values({
              jobId: currentJobId,
              senderId: currentUserId,
              content: finalContent,
              isRedacted,
              sentAt: new Date().toISOString(),
            });
          } catch (chatInsertErr) {
            console.error("Failed to insert chat message:", chatInsertErr);
          }

          broadcastToJob(currentJobId, {
            type: "receive_message",
            senderId: currentUserId,
            content: finalContent,
            timestamp: new Date().toISOString(),
            isRedacted,
          });
          return;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      const m = wsConnectionMeta.get(ws);
      if (m?.jobId) {
        leaveRoom(m.jobId, ws);
      }
    });
  });

  // Heartbeat to clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const m = wsConnectionMeta.get(ws);
      if (m && m.isAlive === false) {
        if (m.jobId) leaveRoom(m.jobId, ws);
        return ws.terminate();
      }
      if (m) m.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  console.log("✅ WebSocket server initialized on /ws (unified)");
  return server;
}
