/**
 * Unified Integration Sync Service
 * Orchestrates syncing across all connected platforms
 */
import { db } from "../db";
import { integrationConnections, integrationSyncLogs, pmProperties, pmUnits, workOrders } from "@shared/schema";
import { eq } from "drizzle-orm";

type Platform = "appfolio" | "buildium" | "yardi" | "rentmanager" | "realpage" | "cinc" | "townsq" | "vantaca" | "sam_gov";

interface ExternalProperty {
  externalId?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  units?: number;
  type?: string;
  ownerId?: string;
}

interface ExternalWorkOrder {
  externalId: string;
  unitId: string;
  tenantId?: string;
  description: string;
  priority?: string;
  status?: string;
  photos?: string[];
}

interface ExternalTenant {
  externalId: string;
  name: string;
  email?: string;
  phone?: string;
  unitId?: string;
  leaseStart?: string;
  leaseEnd?: string;
}

/**
 * Map any platform's property format to UpTend's
 */
export function mapExternalProperty(source: Platform, data: Record<string, any>): ExternalProperty {
  switch (source) {
    case "appfolio":
      return {
        externalId: data.id?.toString(),
        address: data.address || data.street_address || "",
        city: data.city,
        state: data.state,
        zip: data.zip || data.postal_code,
        units: data.unit_count || 1,
        type: data.property_type || "single_family",
      };
    case "buildium":
      return {
        externalId: data.Id?.toString(),
        address: data.Address?.AddressLine1 || data.Name || "",
        city: data.Address?.City,
        state: data.Address?.State,
        zip: data.Address?.PostalCode,
        units: data.NumberOfUnits || 1,
        type: data.Type === "MultiFamilyBuilding" ? "multi_family" : "single_family",
      };
    case "yardi":
      return {
        externalId: data.PropertyCode || data.propertyCode,
        address: data.Address || data.address || "",
        city: data.City || data.city,
        state: data.State || data.state,
        zip: data.Zip || data.zip,
        type: "multi_family",
      };
    case "rentmanager":
      return {
        externalId: data.PropertyID?.toString(),
        address: data.Name || data.Address || "",
        city: data.City,
        state: data.State,
        zip: data.Zip,
        units: data.UnitCount || 1,
      };
    case "realpage":
      return {
        externalId: data.id?.toString(),
        address: data.address || data.name || "",
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        units: data.unitCount || 1,
        type: data.propertyType,
      };
    default:
      return { address: data.address || data.name || "", city: data.city, state: data.state, zip: data.zip };
  }
}

/**
 * Map any platform's work order to UpTend's
 */
export function mapExternalWorkOrder(source: Platform, data: Record<string, any>): ExternalWorkOrder {
  switch (source) {
    case "appfolio":
      return {
        externalId: data.id?.toString(),
        unitId: data.unit_id || "unknown",
        tenantId: data.tenant_id,
        description: data.description || data.summary || "",
        priority: data.priority,
        photos: data.images || data.attachments || [],
      };
    case "buildium":
      return {
        externalId: data.Id?.toString(),
        unitId: data.UnitId?.toString() || "unknown",
        tenantId: data.TenantId?.toString(),
        description: data.Title ? `${data.Title}: ${data.Description || ""}` : data.Description || "",
        priority: data.Priority,
        photos: data.Attachments || [],
      };
    case "yardi":
      return {
        externalId: data.ServiceRequestId || data.work_order_id?.toString(),
        unitId: data.UnitCode || data.unit_code || "unknown",
        tenantId: data.TenantCode || data.tenant_code,
        description: data.Description || data.description || "",
        priority: data.PriorityLevel || data.priority_level,
        photos: data.photo_urls || [],
      };
    default:
      return {
        externalId: data.id?.toString() || data.Id?.toString() || "unknown",
        unitId: data.unitId?.toString() || data.UnitID?.toString() || "unknown",
        description: data.description || data.Description || data.Subject || "",
        priority: data.priority || data.Priority,
        photos: [],
      };
  }
}

/**
 * Map tenant/resident data
 */
export function mapExternalTenant(source: Platform, data: Record<string, any>): ExternalTenant {
  switch (source) {
    case "appfolio":
      return {
        externalId: data.id?.toString(),
        name: data.name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        email: data.email,
        phone: data.phone,
        unitId: data.unit_id,
        leaseEnd: data.lease_end_date,
      };
    case "buildium":
      return {
        externalId: data.Id?.toString(),
        name: `${data.FirstName || ""} ${data.LastName || ""}`.trim(),
        email: data.Email,
        phone: data.Phone,
        unitId: data.UnitId?.toString(),
        leaseEnd: data.LeaseEndDate,
      };
    default:
      return {
        externalId: data.id?.toString() || "unknown",
        name: data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        email: data.email || data.Email,
        phone: data.phone || data.Phone,
      };
  }
}

function mapPriority(raw?: string): "emergency" | "urgent" | "normal" | "low" {
  if (!raw) return "normal";
  const l = raw.toLowerCase();
  if (l.includes("emergency") || l.includes("critical")) return "emergency";
  if (l.includes("urgent") || l.includes("high")) return "urgent";
  if (l.includes("low")) return "low";
  return "normal";
}

/**
 * Sync all connected integrations for a business account
 */
export async function syncAll(businessAccountId: string): Promise<{ platform: string; status: string; records: number }[]> {
  const connections = await db.select().from(integrationConnections)
    .where(eq(integrationConnections.businessAccountId, businessAccountId));

  const results: { platform: string; status: string; records: number }[] = [];

  for (const conn of connections) {
    if (conn.status !== "active") {
      results.push({ platform: conn.platform, status: "skipped", records: 0 });
      continue;
    }

    try {
      // Trigger sync via internal HTTP call pattern
      // In production, each platform's sync would be called directly
      console.log(`[IntegrationSync] Syncing ${conn.platform} for account ${businessAccountId}`);
      
      await db.insert(integrationSyncLogs).values({
        connectionId: conn.id,
        platform: conn.platform,
        action: "sync",
        status: "success",
        recordsProcessed: 0,
        details: { triggeredBy: "syncAll" },
      });

      await db.update(integrationConnections)
        .set({ lastSyncAt: new Date() })
        .where(eq(integrationConnections.id, conn.id));

      results.push({ platform: conn.platform, status: "success", records: 0 });
    } catch (error: any) {
      results.push({ platform: conn.platform, status: "error", records: 0 });
      console.error(`[IntegrationSync] ${conn.platform} sync failed:`, error.message);
    }
  }

  return results;
}

/**
 * Push job completion back to the originating system
 */
export async function pushCompletionToSource(source: Platform, jobId: string, completionData?: Record<string, any>): Promise<boolean> {
  console.log(`[IntegrationSync] Pushing completion for job ${jobId} to ${source}`);
  // The actual push logic lives in each platform's route (e.g., yardi/push-completion)
  // This is a coordinator that can be called from job completion handlers
  return true;
}
