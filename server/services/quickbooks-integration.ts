/**
 * QuickBooks Online Integration Service
 * 
 * OAuth 2.0 flow, invoice/expense sync, payout tracking.
 * When QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET env vars are missing,
 * all methods return mock success responses for demo/development.
 */

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || "";
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || "";
const QB_REDIRECT_URI = "https://uptendapp.com/api/integrations/quickbooks/callback";
const QB_AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_API_BASE = "https://quickbooks.api.intuit.com/v3/company";
const QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

function isMockMode(): boolean {
  return !QB_CLIENT_ID || !QB_CLIENT_SECRET;
}

// In-memory token store (production would use encrypted DB storage)
const tokenStore: Record<string, {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: number;
  connectedAt: string;
  lastSyncAt: string | null;
}> = {};

// Sync history log
const syncHistory: Array<{
  id: string;
  businessId: string;
  type: string;
  status: string;
  details: string;
  qbEntity: string;
  qbId: string | null;
  amount: number | null;
  syncedAt: string;
}> = [];

function generateId(): string {
  return `qb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get QuickBooks OAuth authorization URL
 */
export function getAuthUrl(businessId: string): string {
  if (isMockMode()) {
    return `https://uptendapp.com/api/integrations/quickbooks/callback?code=mock_code_${businessId}&realmId=mock_realm_123&state=${businessId}`;
  }

  const params = new URLSearchParams({
    client_id: QB_CLIENT_ID,
    redirect_uri: QB_REDIRECT_URI,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state: businessId,
  });

  return `${QB_AUTH_BASE}?${params.toString()}`;
}

/**
 * Handle OAuth callback — exchange code for tokens
 */
export async function handleCallback(
  code: string,
  realmId: string,
  businessId: string
): Promise<{ success: boolean; realmId: string }> {
  if (isMockMode()) {
    tokenStore[businessId] = {
      accessToken: `mock_access_${businessId}`,
      refreshToken: `mock_refresh_${businessId}`,
      realmId: realmId || "mock_realm_123",
      expiresAt: Date.now() + 3600 * 1000,
      connectedAt: new Date().toISOString(),
      lastSyncAt: null,
    };
    return { success: true, realmId: realmId || "mock_realm_123" };
  }

  const basicAuth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: QB_REDIRECT_URI,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`QuickBooks token exchange failed: ${err}`);
  }

  const data = await resp.json() as any;
  tokenStore[businessId] = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    realmId,
    expiresAt: Date.now() + data.expires_in * 1000,
    connectedAt: new Date().toISOString(),
    lastSyncAt: null,
  };

  return { success: true, realmId };
}

/**
 * Refresh expired access token
 */
export async function refreshToken(businessId: string): Promise<boolean> {
  const tokens = tokenStore[businessId];
  if (!tokens) return false;

  if (isMockMode()) {
    tokens.accessToken = `mock_access_refreshed_${Date.now()}`;
    tokens.expiresAt = Date.now() + 3600 * 1000;
    return true;
  }

  const basicAuth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!resp.ok) return false;

  const data = await resp.json() as any;
  tokens.accessToken = data.access_token;
  tokens.refreshToken = data.refresh_token;
  tokens.expiresAt = Date.now() + data.expires_in * 1000;
  return true;
}

/**
 * Disconnect QuickBooks — revoke tokens
 */
export async function disconnect(businessId: string): Promise<boolean> {
  const tokens = tokenStore[businessId];
  if (!tokens) return true;

  if (!isMockMode()) {
    try {
      const basicAuth = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString("base64");
      await fetch(QB_REVOKE_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokens.refreshToken }),
      });
    } catch (e) {
      console.error("QuickBooks revoke error:", e);
    }
  }

  delete tokenStore[businessId];
  return true;
}

/**
 * Get connection status
 */
export function getStatus(businessId: string): {
  connected: boolean;
  realmId: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  mockMode: boolean;
} {
  const tokens = tokenStore[businessId];
  return {
    connected: !!tokens,
    realmId: tokens?.realmId || null,
    connectedAt: tokens?.connectedAt || null,
    lastSyncAt: tokens?.lastSyncAt || null,
    mockMode: isMockMode(),
  };
}

async function qbApiRequest(businessId: string, method: string, endpoint: string, body?: any): Promise<any> {
  const tokens = tokenStore[businessId];
  if (!tokens) throw new Error("Not connected to QuickBooks");

  // Auto-refresh if expired
  if (tokens.expiresAt < Date.now()) {
    const refreshed = await refreshToken(businessId);
    if (!refreshed) throw new Error("Failed to refresh QuickBooks token");
  }

  if (isMockMode()) {
    return { Id: generateId(), SyncToken: "0", ...body };
  }

  const url = `${QB_API_BASE}/${tokens.realmId}/${endpoint}`;
  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`QuickBooks API error: ${resp.status} ${err}`);
  }

  return resp.json();
}

/**
 * Sync a completed job to QuickBooks as an Invoice
 */
export async function syncCompletedJob(
  businessId: string,
  jobData: {
    jobId: string;
    serviceType: string;
    customerFirstName: string;
    finalPrice: number;
    platformFee: number;
    completedAt: string;
  }
): Promise<{ success: boolean; qbInvoiceId: string }> {
  const tokens = tokenStore[businessId];
  if (!tokens) throw new Error("Not connected to QuickBooks");

  if (isMockMode()) {
    const invoiceId = `INV-${Date.now()}`;
    const entry = {
      id: generateId(),
      businessId,
      type: "invoice",
      status: "success",
      details: `Job ${jobData.jobId}: ${jobData.serviceType} - $${jobData.finalPrice}`,
      qbEntity: "Invoice",
      qbId: invoiceId,
      amount: jobData.finalPrice,
      syncedAt: new Date().toISOString(),
    };
    syncHistory.push(entry);
    tokens.lastSyncAt = entry.syncedAt;
    return { success: true, qbInvoiceId: invoiceId };
  }

  // Create or find customer (first name only for privacy)
  const customerQuery = await qbApiRequest(
    businessId, "GET",
    `query?query=select * from Customer where DisplayName = '${jobData.customerFirstName} (UpTend)'&minorversion=65`
  );

  let customerId: string;
  if (customerQuery?.QueryResponse?.Customer?.length > 0) {
    customerId = customerQuery.QueryResponse.Customer[0].Id;
  } else {
    const newCustomer = await qbApiRequest(businessId, "POST", "customer?minorversion=65", {
      DisplayName: `${jobData.customerFirstName} (UpTend)`,
      CompanyName: "UpTend Customer",
    });
    customerId = newCustomer.Customer.Id;
  }

  // Create invoice
  const invoice = await qbApiRequest(businessId, "POST", "invoice?minorversion=65", {
    CustomerRef: { value: customerId },
    Line: [
      {
        Amount: jobData.finalPrice,
        DetailType: "SalesItemLineDetail",
        SalesItemLineDetail: {
          ItemRef: { value: "1", name: "Services" },
        },
        Description: `UpTend Job: ${jobData.serviceType} (Job #${jobData.jobId})`,
      },
    ],
    PrivateNote: `UpTend Job ID: ${jobData.jobId}. Platform fee: $${jobData.platformFee.toFixed(2)}`,
  });

  const qbInvoiceId = invoice?.Invoice?.Id || "unknown";
  syncHistory.push({
    id: generateId(),
    businessId,
    type: "invoice",
    status: "success",
    details: `Job ${jobData.jobId}: ${jobData.serviceType} - $${jobData.finalPrice}`,
    qbEntity: "Invoice",
    qbId: qbInvoiceId,
    amount: jobData.finalPrice,
    syncedAt: new Date().toISOString(),
  });
  tokens.lastSyncAt = new Date().toISOString();

  return { success: true, qbInvoiceId };
}

/**
 * Sync a payout as a deposit in QuickBooks
 */
export async function syncPayout(
  businessId: string,
  payoutData: {
    payoutId: string;
    amount: number;
    date: string;
  }
): Promise<{ success: boolean; qbDepositId: string }> {
  const tokens = tokenStore[businessId];
  if (!tokens) throw new Error("Not connected to QuickBooks");

  if (isMockMode()) {
    const depositId = `DEP-${Date.now()}`;
    syncHistory.push({
      id: generateId(),
      businessId,
      type: "deposit",
      status: "success",
      details: `Payout ${payoutData.payoutId}: $${payoutData.amount}`,
      qbEntity: "Deposit",
      qbId: depositId,
      amount: payoutData.amount,
      syncedAt: new Date().toISOString(),
    });
    tokens.lastSyncAt = new Date().toISOString();
    return { success: true, qbDepositId: depositId };
  }

  const deposit = await qbApiRequest(businessId, "POST", "deposit?minorversion=65", {
    DepositToAccountRef: { value: "1" },
    Line: [
      {
        Amount: payoutData.amount,
        DetailType: "DepositLineDetail",
        DepositLineDetail: {
          AccountRef: { value: "1" },
        },
      },
    ],
    PrivateNote: `UpTend Payout ID: ${payoutData.payoutId}`,
    TxnDate: payoutData.date,
  });

  const qbDepositId = deposit?.Deposit?.Id || "unknown";
  syncHistory.push({
    id: generateId(),
    businessId,
    type: "deposit",
    status: "success",
    details: `Payout ${payoutData.payoutId}: $${payoutData.amount}`,
    qbEntity: "Deposit",
    qbId: qbDepositId,
    amount: payoutData.amount,
    syncedAt: new Date().toISOString(),
  });
  tokens.lastSyncAt = new Date().toISOString();

  return { success: true, qbDepositId };
}

/**
 * Record platform fee as expense in QuickBooks
 */
export async function syncPlatformFeeExpense(
  businessId: string,
  data: {
    amount: number;
    period: string;
    jobCount: number;
  }
): Promise<{ success: boolean; qbExpenseId: string }> {
  const tokens = tokenStore[businessId];
  if (!tokens) throw new Error("Not connected to QuickBooks");

  if (isMockMode()) {
    const expenseId = `EXP-${Date.now()}`;
    syncHistory.push({
      id: generateId(),
      businessId,
      type: "expense",
      status: "success",
      details: `Platform fees for ${data.period}: $${data.amount} (${data.jobCount} jobs)`,
      qbEntity: "Purchase",
      qbId: expenseId,
      amount: data.amount,
      syncedAt: new Date().toISOString(),
    });
    tokens.lastSyncAt = new Date().toISOString();
    return { success: true, qbExpenseId: expenseId };
  }

  const purchase = await qbApiRequest(businessId, "POST", "purchase?minorversion=65", {
    PaymentType: "Cash",
    AccountRef: { value: "1" },
    Line: [
      {
        Amount: data.amount,
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: "1", name: "UpTend Platform Fees" },
        },
        Description: `UpTend platform fees - ${data.period} (${data.jobCount} jobs)`,
      },
    ],
    PrivateNote: `UpTend platform fee summary for ${data.period}`,
  });

  const qbExpenseId = purchase?.Purchase?.Id || "unknown";
  syncHistory.push({
    id: generateId(),
    businessId,
    type: "expense",
    status: "success",
    details: `Platform fees for ${data.period}: $${data.amount} (${data.jobCount} jobs)`,
    qbEntity: "Purchase",
    qbId: qbExpenseId,
    amount: data.amount,
    syncedAt: new Date().toISOString(),
  });
  tokens.lastSyncAt = new Date().toISOString();

  return { success: true, qbExpenseId };
}

/**
 * Get sync history for a business
 */
export function getSyncHistory(businessId: string, limit = 50): typeof syncHistory {
  return syncHistory
    .filter(h => h.businessId === businessId)
    .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
    .slice(0, limit);
}
