/**
 * PMS (Property Management Software) Integration Service
 * 
 * Connects George to external HOA/PM platforms:
 * - Buildium (Open REST API)
 * - AppFolio (Stack API - partner program)
 * - GetQuorum (Voting REST API)
 * 
 * George becomes the glue between PM's CRM and UpTend's service network.
 * Work orders flow in → George dispatches → Reports flow back.
 */

import { db, pool } from "../db";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PMSConnection {
  id: string;
  businessAccountId: string;
  platform: string;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  callbackUrl?: string;
  syncEnabled: boolean;
  syncDirection: string;
  lastSyncAt?: Date;
  fieldMappings: Record<string, string>;
}

interface ExternalWorkOrder {
  externalId: string;
  platform: string;
  propertyAddress?: string;
  unitNumber?: string;
  description: string;
  priority?: string;
  category?: string;
  requestedBy?: string;
  requestedDate?: string;
  status?: string;
  raw?: any;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  details?: any;
}

// ─── Base PMS Client ────────────────────────────────────────────────────────

abstract class PMSClient {
  protected connection: PMSConnection;

  constructor(connection: PMSConnection) {
    this.connection = connection;
  }

  abstract fetchWorkOrders(filters?: any): Promise<ExternalWorkOrder[]>;
  abstract updateWorkOrderStatus(externalId: string, status: string, notes?: string): Promise<boolean>;
  abstract attachReport(externalId: string, reportData: any): Promise<boolean>;
  abstract fetchProperties(): Promise<any[]>;
  abstract testConnection(): Promise<{ connected: boolean; message: string }>;
}

// ─── Buildium Client ────────────────────────────────────────────────────────

class BuildiumClient extends PMSClient {
  private baseUrl = "https://api.buildium.com";

  private async request(path: string, method: string = "GET", body?: any): Promise<any> {
    const headers: Record<string, string> = {
      "x-buildium-client-id": this.connection.apiKey || "",
      "x-buildium-client-secret": this.connection.apiSecret || "",
      "Content-Type": "application/json",
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Buildium API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const account = await this.request("/v1/administration/account");
      return { connected: true, message: `Connected to Buildium account: ${account.Name || account.CompanyName || 'OK'}` };
    } catch (err: any) {
      return { connected: false, message: `Buildium connection failed: ${err.message}` };
    }
  }

  async fetchWorkOrders(filters?: { status?: string; updatedSince?: string }): Promise<ExternalWorkOrder[]> {
    let path = "/v1/workorders?orderby=lastupdateddatetime desc&limit=50";
    if (filters?.status) path += `&statuses=${filters.status}`;
    if (filters?.updatedSince) path += `&lastupdatedfrom=${filters.updatedSince}`;

    const orders = await this.request(path);
    return (orders || []).map((wo: any) => ({
      externalId: wo.Id?.toString(),
      platform: "buildium",
      propertyAddress: wo.PropertyAddress || wo.UnitAddress,
      unitNumber: wo.UnitNumber,
      description: wo.Title || wo.Description,
      priority: wo.Priority,
      category: wo.Category,
      requestedBy: wo.RequestedByUserName,
      requestedDate: wo.CreatedDateTime,
      status: wo.Status,
      raw: wo,
    }));
  }

  async updateWorkOrderStatus(externalId: string, status: string, notes?: string): Promise<boolean> {
    try {
      await this.request(`/v1/workorders/${externalId}`, "PUT", {
        Status: status, // New, InProgress, Completed, Deferred, Closed
        InternalNotes: notes,
      });
      return true;
    } catch {
      return false;
    }
  }

  async attachReport(externalId: string, reportData: { filename: string; fileUrl: string; notes: string }): Promise<boolean> {
    try {
      // Buildium uses multipart for attachments, but we can update notes
      await this.request(`/v1/workorders/${externalId}`, "PUT", {
        InternalNotes: reportData.notes,
        Status: "Completed",
      });
      return true;
    } catch {
      return false;
    }
  }

  async fetchProperties(): Promise<any[]> {
    try {
      const [rentals, associations] = await Promise.all([
        this.request("/v1/rentals?limit=200").catch(() => []),
        this.request("/v1/associations?limit=200").catch(() => []),
      ]);
      return [
        ...(rentals || []).map((r: any) => ({
          externalId: r.Id,
          name: r.Name,
          address: r.Address?.AddressLine1,
          city: r.Address?.City,
          state: r.Address?.State,
          zip: r.Address?.PostalCode,
          type: "rental",
          units: r.NumberOfUnits,
        })),
        ...(associations || []).map((a: any) => ({
          externalId: a.Id,
          name: a.Name,
          address: a.Address?.AddressLine1,
          city: a.Address?.City,
          state: a.Address?.State,
          zip: a.Address?.PostalCode,
          type: "association",
        })),
      ];
    } catch {
      return [];
    }
  }

  async createWorkOrder(data: {
    propertyId: number;
    unitId?: number;
    title: string;
    description: string;
    priority: string;
    category?: string;
  }): Promise<any> {
    return this.request("/v1/workorders", "POST", {
      PropertyId: data.propertyId,
      UnitId: data.unitId,
      Title: data.title,
      Description: data.description,
      Priority: data.priority,
      CategoryId: data.category,
      Status: "New",
    });
  }
}

// ─── AppFolio Client ────────────────────────────────────────────────────────

class AppFolioClient extends PMSClient {
  private baseUrl: string;

  constructor(connection: PMSConnection) {
    super(connection);
    // AppFolio uses customer-specific URLs: {database_name}.appfolio.com/api/v1
    this.baseUrl = connection.fieldMappings?.baseUrl || "https://api.appfolio.com";
  }

  private async request(path: string, method: string = "GET", body?: any): Promise<any> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.connection.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AppFolio API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      // AppFolio Stack API - test with a simple properties request
      await this.request("/api/v1/properties?limit=1");
      return { connected: true, message: "Connected to AppFolio" };
    } catch (err: any) {
      return { connected: false, message: `AppFolio connection failed: ${err.message}` };
    }
  }

  async fetchWorkOrders(filters?: any): Promise<ExternalWorkOrder[]> {
    try {
      const orders = await this.request("/api/v1/work-orders?limit=50");
      return (orders || []).map((wo: any) => ({
        externalId: wo.Id?.toString(),
        platform: "appfolio",
        propertyAddress: wo.PropertyAddress,
        unitNumber: wo.UnitNumber,
        description: wo.Description || wo.Subject,
        priority: wo.Priority,
        category: wo.Category,
        requestedBy: wo.RequestedBy,
        requestedDate: wo.CreatedAt,
        status: wo.Status,
        raw: wo,
      }));
    } catch {
      return [];
    }
  }

  async updateWorkOrderStatus(externalId: string, status: string, notes?: string): Promise<boolean> {
    try {
      await this.request(`/api/v1/work-orders/${externalId}`, "PATCH", {
        Status: status,
        Notes: notes,
      });
      return true;
    } catch {
      return false;
    }
  }

  async attachReport(externalId: string, reportData: any): Promise<boolean> {
    try {
      await this.request(`/api/v1/work-orders/${externalId}/attachments`, "POST", reportData);
      return true;
    } catch {
      return false;
    }
  }

  async fetchProperties(): Promise<any[]> {
    try {
      const properties = await this.request("/api/v1/properties?limit=200");
      return (properties || []).map((p: any) => ({
        externalId: p.Id,
        name: p.Name,
        address: p.Address1,
        city: p.City,
        state: p.State,
        zip: p.PostalCode,
        type: p.PropertyType,
        units: p.UnitCount,
      }));
    } catch {
      return [];
    }
  }
}

// ─── GetQuorum Client (Voting) ──────────────────────────────────────────────

class GetQuorumClient extends PMSClient {
  private baseUrl = "https://api.getquorum.com";

  private async request(path: string): Promise<any> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.connection.apiKey}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(`${this.baseUrl}${path}`, { headers });

    if (!response.ok) {
      throw new Error(`GetQuorum API error (${response.status})`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.request("/v1/campaigns?limit=1");
      return { connected: true, message: "Connected to GetQuorum" };
    } catch (err: any) {
      return { connected: false, message: `GetQuorum connection failed: ${err.message}` };
    }
  }

  // GetQuorum is voting-specific — no work orders
  async fetchWorkOrders(): Promise<ExternalWorkOrder[]> { return []; }
  async updateWorkOrderStatus(): Promise<boolean> { return false; }
  async attachReport(): Promise<boolean> { return false; }
  async fetchProperties(): Promise<any[]> { return []; }

  // Voting-specific methods
  async fetchCampaigns(): Promise<any[]> {
    try {
      const campaigns = await this.request("/v1/campaigns");
      return (campaigns || []).map((c: any) => ({
        id: c.key,
        name: c.name,
        description: c.description,
        meetingDate: c.meetingDate,
        location: c.location,
        status: c.status,
        votesSubmitted: c.stats?.votesSubmitted,
        maxVoters: c.stats?.maxVoters,
        attendingCount: c.stats?.attendingCount,
        dashboardUrl: c.dashboardUrl,
        participationRate: c.stats?.maxVoters
          ? Math.round((c.stats.votesSubmitted / c.stats.maxVoters) * 100)
          : null,
      }));
    } catch {
      return [];
    }
  }

  async getCampaignResults(campaignKey: string): Promise<any> {
    try {
      return await this.request(`/v1/campaigns/${campaignKey}`);
    } catch {
      return null;
    }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

function createPMSClient(connection: PMSConnection): PMSClient {
  switch (connection.platform) {
    case "buildium": return new BuildiumClient(connection);
    case "appfolio": return new AppFolioClient(connection);
    case "getquorum": return new GetQuorumClient(connection);
    default: throw new Error(`Unsupported PMS platform: ${connection.platform}`);
  }
}

// ─── Connection Management (George Tools) ───────────────────────────────────

export async function connectPMS(params: {
  businessId: string;
  platform: string;
  apiKey: string;
  apiSecret?: string;
  baseUrl?: string;
}): Promise<object> {
  try {
    const connection: PMSConnection = {
      id: "",
      businessAccountId: params.businessId,
      platform: params.platform,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
      syncEnabled: true,
      syncDirection: "bidirectional",
      fieldMappings: params.baseUrl ? { baseUrl: params.baseUrl } : {},
    };

    const client = createPMSClient(connection);
    const test = await client.testConnection();

    if (!test.connected) {
      return { connected: false, message: test.message };
    }

    // Save connection to DB
    const result = await pool.query(`
      INSERT INTO pms_connections (id, business_account_id, platform, api_key, api_secret, sync_enabled, sync_direction, field_mappings, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, true, 'bidirectional', $5, NOW(), NOW())
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [params.businessId, params.platform, params.apiKey, params.apiSecret, JSON.stringify(connection.fieldMappings)]);

    return {
      connected: true,
      connectionId: result.rows[0]?.id,
      platform: params.platform,
      message: test.message,
    };
  } catch (err: any) {
    return { connected: false, error: err.message, message: `Failed to connect: ${err.message}` };
  }
}

export async function disconnectPMS(params: {
  businessId: string;
  platform: string;
}): Promise<object> {
  try {
    await pool.query(`
      DELETE FROM pms_connections
      WHERE business_account_id = $1 AND platform = $2
    `, [params.businessId, params.platform]);

    return { disconnected: true, platform: params.platform, message: `${params.platform} disconnected successfully.` };
  } catch (err: any) {
    return { disconnected: false, error: err.message };
  }
}

export async function getPMSConnections(businessId: string): Promise<object> {
  try {
    const result = await pool.query(`
      SELECT id, platform, sync_enabled, sync_direction, last_sync_at, created_at
      FROM pms_connections
      WHERE business_account_id = $1
    `, [businessId]);

    return {
      connections: result.rows.map((c: any) => ({
        id: c.id,
        platform: c.platform,
        syncEnabled: c.sync_enabled,
        syncDirection: c.sync_direction,
        lastSync: c.last_sync_at,
        connectedSince: c.created_at,
      })),
      count: result.rows.length,
      message: result.rows.length
        ? `${result.rows.length} CRM integration(s) active: ${result.rows.map((c: any) => c.platform).join(', ')}`
        : "No CRM integrations connected yet. I can help you set up AppFolio, Buildium, Yardi, or GetQuorum.",
    };
  } catch (err: any) {
    return { connections: [], error: err.message };
  }
}

// ─── Sync Operations ────────────────────────────────────────────────────────

async function getConnection(businessId: string, platform: string): Promise<PMSConnection | null> {
  const result = await pool.query(`
    SELECT * FROM pms_connections
    WHERE business_account_id = $1 AND platform = $2 AND sync_enabled = true
  `, [businessId, platform]);

  if (!result.rows.length) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    businessAccountId: row.business_account_id,
    platform: row.platform,
    apiKey: row.api_key,
    apiSecret: row.api_secret,
    webhookUrl: row.webhook_url,
    callbackUrl: row.callback_url,
    syncEnabled: row.sync_enabled,
    syncDirection: row.sync_direction,
    lastSyncAt: row.last_sync_at,
    fieldMappings: row.field_mappings || {},
  };
}

export async function syncWorkOrders(params: {
  businessId: string;
  platform: string;
}): Promise<object> {
  try {
    const connection = await getConnection(params.businessId, params.platform);
    if (!connection) {
      return { synced: false, message: `No active ${params.platform} connection found.` };
    }

    const client = createPMSClient(connection);
    const orders = await client.fetchWorkOrders({ status: "New" });

    // Log sync
    await pool.query(`
      UPDATE pms_connections SET last_sync_at = NOW() WHERE id = $1
    `, [connection.id]);

    for (const order of orders) {
      await pool.query(`
        INSERT INTO pms_sync_log (id, connection_id, direction, entity_type, external_id, status, payload, created_at)
        VALUES (gen_random_uuid(), $1, 'inbound', 'work_order', $2, 'success', $3, NOW())
        ON CONFLICT DO NOTHING
      `, [connection.id, order.externalId, JSON.stringify(order)]);
    }

    return {
      synced: true,
      platform: params.platform,
      workOrdersFound: orders.length,
      orders: orders.map(o => ({
        id: o.externalId,
        address: o.propertyAddress,
        description: o.description,
        priority: o.priority,
        status: o.status,
      })),
      message: orders.length
        ? `Synced ${orders.length} new work orders from ${params.platform}. Ready to dispatch.`
        : `No new work orders in ${params.platform}.`,
    };
  } catch (err: any) {
    return { synced: false, error: err.message, message: `Sync failed: ${err.message}` };
  }
}

export async function pushJobReport(params: {
  businessId: string;
  platform: string;
  externalWorkOrderId: string;
  status: string;
  notes: string;
  photos?: string[];
}): Promise<object> {
  try {
    const connection = await getConnection(params.businessId, params.platform);
    if (!connection) {
      return { pushed: false, message: `No active ${params.platform} connection.` };
    }

    const client = createPMSClient(connection);
    const updated = await client.updateWorkOrderStatus(
      params.externalWorkOrderId,
      params.status,
      params.notes
    );

    // Log outbound sync
    await pool.query(`
      INSERT INTO pms_sync_log (id, connection_id, direction, entity_type, external_id, status, payload, created_at)
      VALUES (gen_random_uuid(), $1, 'outbound', 'work_order', $2, $3, $4, NOW())
    `, [connection.id, params.externalWorkOrderId, updated ? 'success' : 'failed', JSON.stringify(params)]);

    return {
      pushed: updated,
      platform: params.platform,
      message: updated
        ? `Job report pushed to ${params.platform}. Work order ${params.externalWorkOrderId} updated to "${params.status}".`
        : `Failed to update work order in ${params.platform}.`,
    };
  } catch (err: any) {
    return { pushed: false, error: err.message };
  }
}

export async function syncProperties(params: {
  businessId: string;
  platform: string;
}): Promise<object> {
  try {
    const connection = await getConnection(params.businessId, params.platform);
    if (!connection) {
      return { synced: false, message: `No active ${params.platform} connection.` };
    }

    const client = createPMSClient(connection);
    const properties = await client.fetchProperties();

    return {
      synced: true,
      platform: params.platform,
      propertiesFound: properties.length,
      properties: properties.slice(0, 20), // limit response size
      message: `Found ${properties.length} properties in ${params.platform}.`,
    };
  } catch (err: any) {
    return { synced: false, error: err.message };
  }
}

// ─── GetQuorum Voting ───────────────────────────────────────────────────────

export async function getVoteResults(params: {
  businessId: string;
  campaignId?: string;
}): Promise<object> {
  try {
    const connection = await getConnection(params.businessId, "getquorum");
    if (!connection) {
      return { connected: false, message: "No GetQuorum connection. Connect it first to pull vote results." };
    }

    const client = new GetQuorumClient(connection);

    if (params.campaignId) {
      const result = await client.getCampaignResults(params.campaignId);
      return {
        campaign: result,
        message: result
          ? `Vote results for "${result.name}": ${result.stats?.votesSubmitted} of ${result.stats?.maxVoters} voted (${Math.round((result.stats?.votesSubmitted / result.stats?.maxVoters) * 100)}% participation).`
          : "Campaign not found.",
      };
    }

    const campaigns = await client.fetchCampaigns();
    return {
      campaigns,
      count: campaigns.length,
      message: campaigns.length
        ? `${campaigns.length} vote/meeting campaigns found. Latest: "${campaigns[0]?.name}" — ${campaigns[0]?.votesSubmitted || 0} votes submitted.`
        : "No campaigns found in GetQuorum.",
    };
  } catch (err: any) {
    return { connected: false, error: err.message, message: "Could not fetch vote results." };
  }
}

// ─── Webhook Handler (for inbound CRM events) ──────────────────────────────

export async function handlePMSWebhook(platform: string, payload: any): Promise<{ handled: boolean; action?: string }> {
  try {
    // Log the webhook
    await pool.query(`
      INSERT INTO pms_sync_log (id, connection_id, direction, entity_type, external_id, status, payload, created_at)
      VALUES (gen_random_uuid(), 'webhook', 'inbound', $1, $2, 'received', $3, NOW())
    `, [payload.type || 'unknown', payload.id || 'unknown', JSON.stringify(payload)]);

    // Route based on event type
    if (payload.type === 'work_order.created' || payload.event === 'WorkOrderCreated') {
      // New maintenance request from CRM → George should pick it up
      return { handled: true, action: 'dispatch_work_order' };
    }

    if (payload.type === 'vote.completed' || payload.event === 'CampaignCompleted') {
      // Vote finished → George can announce results
      return { handled: true, action: 'announce_vote_results' };
    }

    return { handled: true, action: 'logged' };
  } catch {
    return { handled: false };
  }
}
