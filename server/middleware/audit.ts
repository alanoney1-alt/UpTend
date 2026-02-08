import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { auditLogs } from "@shared/schema";

const AUDITED_PATHS = [
  "/api/admin/",
  "/api/payments/",
  "/api/payout/",
  "/api/green-rebate/",
  "/api/agentic/",
  "/api/compliance/",
];

function getActionType(method: string, path: string): string {
  if (path.includes("/login")) return "LOGIN";
  if (path.includes("/logout")) return "LOGOUT";
  if (path.includes("/approve")) return "APPROVE";
  if (path.includes("/reject")) return "REJECT";
  if (path.includes("/export")) return "EXPORT_DATA";
  if (path.includes("/payments") && method === "POST") return "PAYMENT_ACTION";
  if (path.includes("/payout")) return "VIEW_PAYOUT";
  if (method === "GET") return "VIEW_DATA";
  if (method === "POST") return "CREATE";
  if (method === "PUT" || method === "PATCH") return "UPDATE_STATUS";
  if (method === "DELETE") return "DELETE";
  return "UNKNOWN";
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const shouldAudit = AUDITED_PATHS.some(prefix => req.path.startsWith(prefix));
  if (!shouldAudit) return next();

  const originalEnd = res.end;
  const user = (req as any).user;
  const session = (req as any).session;

  const actorId = user?.id || (session?.isAdmin ? "admin_session" : "anonymous");
  const actorRole = session?.isAdmin ? "admin" : (user?.role || "unknown");

  res.end = function (...args: any[]) {
    try {
      const ipAddress = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
      const userAgent = req.headers["user-agent"] || "unknown";

      db.insert(auditLogs).values({
        actorId,
        actorRole,
        actionType: getActionType(req.method, req.path),
        resourceTarget: `${req.method} ${req.path}`,
        ipAddress,
        userAgent,
        metadata: JSON.stringify({
          statusCode: res.statusCode,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          params: Object.keys(req.params).length > 0 ? req.params : undefined,
        }),
        timestamp: new Date().toISOString(),
      }).catch(err => console.error("[Audit] Log failed:", err));
    } catch (e) {
      console.error("[Audit] Middleware error:", e);
    }
    return (originalEnd as Function).apply(res, args);
  } as any;

  next();
}

export async function logAuditEvent(
  actorId: string,
  actorRole: string,
  actionType: string,
  resourceTarget: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId,
      actorRole,
      actionType,
      resourceTarget,
      ipAddress: ipAddress || "server",
      userAgent: userAgent || "system",
      metadata: metadata ? JSON.stringify(metadata) : null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Audit] Event log failed:", err);
  }
}
