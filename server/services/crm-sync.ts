/**
 * Unified CRM Sync Service
 * 
 * Routes sync/push operations to the correct CRM based on which platform
 * a business account has connected. Handles contact deduplication and mapping.
 */

import { db } from "../db";
import { integrationConnections, crmContactMappings, integrationSyncLogs } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export type CrmPlatform = 'salesforce' | 'hubspot' | 'zoho' | 'monday' | 'servicetitan' | 'jobber' | 'housecallpro' | 'govwin';

export interface CrmContact {
  externalId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
  raw: Record<string, any>;
}

export interface CrmCompany {
  externalId: string;
  name: string;
  industry?: string;
  phone?: string;
  website?: string;
  address?: string;
  raw: Record<string, any>;
}

export interface CrmDeal {
  externalId: string;
  name: string;
  amount?: number;
  stage?: string;
  contactId?: string;
  companyId?: string;
  raw: Record<string, any>;
}

/**
 * Get active CRM connection for a business account
 */
export async function getConnection(businessAccountId: string, platform?: CrmPlatform) {
  const conditions = [
    eq(integrationConnections.businessAccountId, businessAccountId),
    eq(integrationConnections.status, "active"),
  ];
  if (platform) {
    conditions.push(eq(integrationConnections.platform, platform));
  }
  const [conn] = await db.select().from(integrationConnections)
    .where(and(...conditions))
    .limit(1);
  return conn || null;
}

/**
 * Get all active CRM connections for a business account
 */
export async function getAllCrmConnections(businessAccountId: string) {
  return db.select().from(integrationConnections)
    .where(and(
      eq(integrationConnections.businessAccountId, businessAccountId),
      eq(integrationConnections.status, "active"),
    ));
}

/**
 * Parse encrypted credentials from a connection
 */
export function parseCredentials(connection: { credentials: string | null }): Record<string, any> {
  if (!connection.credentials) return {};
  try {
    // In production, decrypt here. For now, JSON parse.
    return JSON.parse(connection.credentials);
  } catch {
    return {};
  }
}

/**
 * Log a sync operation
 */
export async function logSync(connectionId: string, platform: string, action: string, status: string, recordsProcessed: number, details?: any) {
  await db.insert(integrationSyncLogs).values({
    connectionId,
    platform,
    action,
    status,
    recordsProcessed,
    details: details || null,
  });
}

/**
 * Upsert a CRM contact mapping (deduplication by externalContactId + platform + businessAccount)
 */
export async function upsertContactMapping(
  businessAccountId: string,
  platform: CrmPlatform,
  externalContactId: string,
  externalData: Record<string, any>,
  uptendUserId?: string,
  uptendPropertyId?: string,
) {
  const existing = await db.select().from(crmContactMappings)
    .where(and(
      eq(crmContactMappings.businessAccountId, businessAccountId),
      eq(crmContactMappings.crmPlatform, platform),
      eq(crmContactMappings.externalContactId, externalContactId),
    ))
    .limit(1);

  if (existing.length > 0) {
    await db.update(crmContactMappings)
      .set({
        externalData,
        lastSyncAt: new Date(),
        ...(uptendUserId ? { uptendUserId } : {}),
        ...(uptendPropertyId ? { uptendPropertyId } : {}),
      })
      .where(eq(crmContactMappings.id, existing[0].id));
    return existing[0].id;
  }

  const [record] = await db.insert(crmContactMappings).values({
    businessAccountId,
    crmPlatform: platform,
    externalContactId,
    externalData,
    uptendUserId: uptendUserId || null,
    uptendPropertyId: uptendPropertyId || null,
    lastSyncAt: new Date(),
  }).returning();
  return record.id;
}

// ==========================================
// Platform-specific mappers
// ==========================================

export function mapCrmContact(platform: CrmPlatform, externalData: Record<string, any>): CrmContact {
  switch (platform) {
    case 'salesforce':
      return {
        externalId: externalData.Id,
        firstName: externalData.FirstName,
        lastName: externalData.LastName,
        email: externalData.Email,
        phone: externalData.Phone,
        company: externalData.Account?.Name,
        title: externalData.Title,
        raw: externalData,
      };
    case 'hubspot':
      const props = externalData.properties || externalData;
      return {
        externalId: String(externalData.id || externalData.vid),
        firstName: props.firstname,
        lastName: props.lastname,
        email: props.email,
        phone: props.phone,
        company: props.company,
        raw: externalData,
      };
    case 'zoho':
      return {
        externalId: externalData.id,
        firstName: externalData.First_Name,
        lastName: externalData.Last_Name,
        email: externalData.Email,
        phone: externalData.Phone,
        company: externalData.Company,
        raw: externalData,
      };
    case 'servicetitan':
      return {
        externalId: String(externalData.id),
        firstName: externalData.name?.split(' ')[0],
        lastName: externalData.name?.split(' ').slice(1).join(' '),
        email: externalData.email,
        phone: externalData.phoneNumber || externalData.phone,
        address: externalData.address?.street,
        raw: externalData,
      };
    case 'jobber':
      return {
        externalId: String(externalData.id),
        firstName: externalData.first_name,
        lastName: externalData.last_name,
        email: externalData.email,
        phone: externalData.phone,
        raw: externalData,
      };
    case 'housecallpro':
      return {
        externalId: String(externalData.id),
        firstName: externalData.first_name,
        lastName: externalData.last_name,
        email: externalData.email,
        phone: externalData.mobile_number || externalData.phone_number,
        raw: externalData,
      };
    case 'monday':
      return {
        externalId: String(externalData.id),
        firstName: externalData.name,
        email: externalData.column_values?.find((c: any) => c.id === 'email')?.text,
        phone: externalData.column_values?.find((c: any) => c.id === 'phone')?.text,
        raw: externalData,
      };
    case 'govwin':
      return {
        externalId: String(externalData.id),
        firstName: externalData.contactName?.split(' ')[0],
        lastName: externalData.contactName?.split(' ').slice(1).join(' '),
        email: externalData.contactEmail,
        phone: externalData.contactPhone,
        company: externalData.agencyName,
        raw: externalData,
      };
    default:
      return { externalId: String(externalData.id || ''), raw: externalData };
  }
}

export function mapCrmCompany(platform: CrmPlatform, externalData: Record<string, any>): CrmCompany {
  switch (platform) {
    case 'salesforce':
      return { externalId: externalData.Id, name: externalData.Name, industry: externalData.Industry, phone: externalData.Phone, website: externalData.Website, raw: externalData };
    case 'hubspot':
      const p = externalData.properties || externalData;
      return { externalId: String(externalData.id || externalData.companyId), name: p.name, industry: p.industry, phone: p.phone, website: p.domain, raw: externalData };
    case 'zoho':
      return { externalId: externalData.id, name: externalData.Account_Name, industry: externalData.Industry, phone: externalData.Phone, website: externalData.Website, raw: externalData };
    default:
      return { externalId: String(externalData.id || ''), name: externalData.name || 'Unknown', raw: externalData };
  }
}

export function mapCrmDeal(platform: CrmPlatform, externalData: Record<string, any>): CrmDeal {
  switch (platform) {
    case 'salesforce':
      return { externalId: externalData.Id, name: externalData.Name, amount: externalData.Amount, stage: externalData.StageName, raw: externalData };
    case 'hubspot':
      const p = externalData.properties || externalData;
      return { externalId: String(externalData.id || externalData.dealId), name: p.dealname, amount: Number(p.amount), stage: p.dealstage, raw: externalData };
    case 'zoho':
      return { externalId: externalData.id, name: externalData.Deal_Name, amount: externalData.Amount, stage: externalData.Stage, raw: externalData };
    default:
      return { externalId: String(externalData.id || ''), name: externalData.name || 'Unknown', raw: externalData };
  }
}

// ==========================================
// High-level sync operations
// ==========================================

/**
 * Sync contacts from any connected CRM
 */
export async function syncCrmContacts(businessAccountId: string, platform: CrmPlatform): Promise<{ synced: number; platform: string }> {
  const conn = await getConnection(businessAccountId, platform);
  if (!conn) throw new Error(`No active ${platform} connection found`);

  // The actual API calls happen in each platform's route handler.
  // This function is called by those handlers after fetching data.
  // Return shape for consistency.
  return { synced: 0, platform };
}

/**
 * Push a completed job to the connected CRM (fire-and-forget)
 */
export async function pushJobToCrm(businessAccountId: string, jobId: string): Promise<void> {
  const connections = await getAllCrmConnections(businessAccountId);
  const crmConnections = connections.filter(c =>
    ['salesforce', 'hubspot', 'zoho', 'monday', 'servicetitan', 'jobber', 'housecallpro'].includes(c.platform)
  );

  for (const conn of crmConnections) {
    try {
      // Fire-and-forget: log attempt, actual push is handled by platform-specific code
      await logSync(conn.id, conn.platform, 'push-job', 'pending', 0, { jobId });
      console.log(`[CRM-Sync] Queued job ${jobId} push to ${conn.platform} for business ${businessAccountId}`);
    } catch (err) {
      console.error(`[CRM-Sync] Failed to queue job push to ${conn.platform}:`, err);
    }
  }
}

/**
 * Push an invoice to the connected CRM (fire-and-forget)
 */
export async function pushInvoiceToCrm(businessAccountId: string, invoiceId: string): Promise<void> {
  const connections = await getAllCrmConnections(businessAccountId);
  for (const conn of connections) {
    try {
      await logSync(conn.id, conn.platform, 'push-invoice', 'pending', 0, { invoiceId });
      console.log(`[CRM-Sync] Queued invoice ${invoiceId} push to ${conn.platform}`);
    } catch (err) {
      console.error(`[CRM-Sync] Failed to queue invoice push to ${conn.platform}:`, err);
    }
  }
}
