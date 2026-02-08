import type { Server } from "http";
import type { Express } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../../storage";
import { locationUpdateSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "../../db";
import { chatMessages, haulerRiskProfile } from "@shared/schema";
import { sql } from "drizzle-orm";

// WebSocket connection tracking
const jobConnections = new Map<string, Set<WebSocket>>();
const wsConnectionMeta = new WeakMap<WebSocket, { role?: string; jobId?: string; userId?: string }>();
const jobConnectionTTL = new Map<string, NodeJS.Timeout>(); // TTL timers for cleanup

// Cleanup stale job connections after 24 hours of inactivity
const JOB_CONNECTION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function resetJobConnectionTTL(jobId: string) {
  // Clear existing timer
  const existingTimer = jobConnectionTTL.get(jobId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer to cleanup after TTL
  const timer = setTimeout(() => {
    const connections = jobConnections.get(jobId);
    if (connections) {
      // Close all connections for this job
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

/**
 * Broadcasts a message to all WebSocket connections for a specific job
 */
function broadcastToJob(jobId: string, message: object) {
  const connections = jobConnections.get(jobId);
  if (connections) {
    const data = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}

/**
 * Calculates distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Registers WebSocket handlers for real-time communication
 * Handles location tracking, chat messages, and job updates
 */
export function registerWebSocketHandlers(server: Server, app: Express): Server {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const jobId = url.searchParams.get("jobId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role") || undefined;

    wsConnectionMeta.set(ws, { role, jobId: jobId || undefined, userId: userId || undefined });

    if (jobId) {
      if (!jobConnections.has(jobId)) {
        jobConnections.set(jobId, new Set());
      }
      jobConnections.get(jobId)!.add(ws);

      // Reset TTL timer for this job connection
      resetJobConnectionTTL(jobId);

      ws.send(JSON.stringify({ type: "connected", jobId, role }));
    }

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Hauler location updates
        if (message.type === "location_update" && userId) {
          const connMeta = wsConnectionMeta.get(ws);
          if (connMeta?.role !== "hauler" || connMeta?.userId !== userId) {
            return;
          }

          const location = locationUpdateSchema.parse(message.data);
          await storage.addLocationHistory({
            userId,
            jobId: jobId || undefined,
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            heading: location.heading,
            speed: location.speed,
            recordedAt: new Date().toISOString(),
          });

          if (jobId) {
            broadcastToJob(jobId, {
              type: "location_updated",
              userId,
              role: "hauler",
              ...location,
              timestamp: new Date().toISOString(),
            });

            // GHOST BUSTER: Auto-detect arrival via geofence (within 0.1 miles / ~500ft)
            try {
              const job = await storage.getServiceRequest(jobId);
              if (job && job.pickupLat && job.pickupLng && !job.arrivedAt) {
                const dist = haversineDistance(location.lat, location.lng, job.pickupLat, job.pickupLng);
                if (dist < 0.1) {
                  await storage.updateServiceRequest(jobId, {
                    arrivedAt: new Date().toISOString(),
                    status: "arrived",
                  });
                  broadcastToJob(jobId, { type: "worker_arrived", jobId, arrivedAt: new Date().toISOString() });
                }
              }
            } catch (geoErr) {
              console.error("Geofence check error:", geoErr);
            }
          }
        }

        // Customer location updates
        if (message.type === "customer_location_update" && jobId) {
          const connMeta = wsConnectionMeta.get(ws);
          if (connMeta?.role !== "customer" || connMeta?.jobId !== jobId) {
            return;
          }

          const customerLocationSchema = z.object({
            lat: z.number().min(-90).max(90),
            lng: z.number().min(-180).max(180),
            accuracy: z.number().min(0).max(10000).nullable().optional(),
          });
          const parseResult = customerLocationSchema.safeParse(message.data);
          if (parseResult.success) {
            broadcastToJob(jobId, {
              type: "customer_location_updated",
              ...parseResult.data,
              timestamp: new Date().toISOString(),
            });
          }
        }

        // SAFECOMMS: Chat message with privacy firewall
        if (message.type === "send_message" && jobId && userId) {
          const phoneRegex = /(\+?1[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/g;
          const leakageKeywords = /venmo|cash\s*app|zelle|cancel.*app|my\s*number|phone\s*number/i;

          let finalContent = message.content || "";
          let isRedacted = false;

          if (phoneRegex.test(finalContent)) {
            finalContent = finalContent.replace(phoneRegex, "[NUMBER REDACTED FOR SAFETY]");
            isRedacted = true;
          }

          if (leakageKeywords.test(message.content || "")) {
            console.warn(`[LEAKAGE ALERT] User ${userId} mentioned payment keywords in job ${jobId}.`);
            try {
              await db.execute(sql`
                INSERT INTO hauler_risk_profile (id, hauler_id, keywords_detected, risk_score, last_incident_at)
                VALUES (gen_random_uuid(), ${userId}, 1, 10, ${new Date().toISOString()})
                ON CONFLICT (hauler_id)
                DO UPDATE SET
                  keywords_detected = hauler_risk_profile.keywords_detected + 1,
                  risk_score = hauler_risk_profile.risk_score + 10,
                  last_incident_at = ${new Date().toISOString()}
              `);
            } catch (riskProfileErr) {
              console.error("Failed to update risk profile:", riskProfileErr);
              // Continue - don't block message sending
            }
          }

          try {
            await db.insert(chatMessages).values({
              jobId,
              senderId: userId,
              content: finalContent,
              isRedacted,
              sentAt: new Date().toISOString(),
            });
          } catch (chatInsertErr) {
            console.error("Failed to insert chat message:", chatInsertErr);
            // Still broadcast message even if DB insert fails
          }

          broadcastToJob(jobId, {
            type: "receive_message",
            senderId: userId,
            content: finalContent,
            timestamp: new Date().toISOString(),
            isRedacted,
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      if (jobId) {
        const connections = jobConnections.get(jobId);
        if (connections) {
          connections.delete(ws);
          if (connections.size === 0) {
            jobConnections.delete(jobId);
            // Clear TTL timer when job has no more connections
            const timer = jobConnectionTTL.get(jobId);
            if (timer) {
              clearTimeout(timer);
              jobConnectionTTL.delete(jobId);
            }
          }
        }
      }
    });
  });

  return server;
}
