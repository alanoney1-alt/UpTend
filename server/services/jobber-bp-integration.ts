/**
 * Jobber Integration Service (Business Partner — job sync)
 * 
 * Syncs completed UpTend jobs to Jobber via GraphQL API.
 * Mock mode when JOBBER_BP_CLIENT_ID env var is missing.
 * Separate from the CRM Jobber integration (server/routes/integrations/jobber.ts).
 */

const JOBBER_CLIENT_ID = process.env.JOBBER_BP_CLIENT_ID || process.env.JOBBER_CLIENT_ID || "";
const JOBBER_CLIENT_SECRET = process.env.JOBBER_BP_CLIENT_SECRET || process.env.JOBBER_CLIENT_SECRET || "";
const JOBBER_REDIRECT_URI = "https://uptendapp.com/api/integrations/jobber-bp/callback";
const JOBBER_AUTH_URL = "https://api.getjobber.com/api/oauth/authorize";
const JOBBER_TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const JOBBER_GQL_URL = "https://api.getjobber.com/api/graphql";

function isMockMode(): boolean {
  return !JOBBER_CLIENT_ID || !JOBBER_CLIENT_SECRET;
}

const tokenStore: Record<string, {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  connectedAt: string;
  lastSyncAt: string | null;
}> = {};

const syncHistory: Array<{
  id: string;
  businessId: string;
  type: string;
  status: string;
  details: string;
  syncedAt: string;
}> = [];

function generateId(): string {
  return `jobber_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getAuthUrl(businessId: string): string {
  if (isMockMode()) {
    return `https://uptendapp.com/api/integrations/jobber-bp/callback?code=mock_code_${businessId}&state=${businessId}`;
  }

  const params = new URLSearchParams({
    client_id: JOBBER_CLIENT_ID,
    redirect_uri: JOBBER_REDIRECT_URI,
    response_type: "code",
    state: businessId,
  });

  return `${JOBBER_AUTH_URL}?${params.toString()}`;
}

export async function handleCallback(code: string, businessId: string): Promise<{ success: boolean }> {
  if (isMockMode()) {
    tokenStore[businessId] = {
      accessToken: `mock_jobber_access_${businessId}`,
      refreshToken: `mock_jobber_refresh_${businessId}`,
      expiresAt: Date.now() + 7200 * 1000,
      connectedAt: new Date().toISOString(),
      lastSyncAt: null,
    };
    return { success: true };
  }

  const resp = await fetch(JOBBER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: JOBBER_CLIENT_ID,
      client_secret: JOBBER_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: JOBBER_REDIRECT_URI,
    }),
  });

  if (!resp.ok) throw new Error(`Jobber token exchange failed: ${await resp.text()}`);
  const data = await resp.json() as any;

  tokenStore[businessId] = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in || 7200) * 1000,
    connectedAt: new Date().toISOString(),
    lastSyncAt: null,
  };

  return { success: true };
}

export async function disconnect(businessId: string): Promise<boolean> {
  delete tokenStore[businessId];
  return true;
}

export function getStatus(businessId: string) {
  const tokens = tokenStore[businessId];
  return {
    connected: !!tokens,
    connectedAt: tokens?.connectedAt || null,
    lastSyncAt: tokens?.lastSyncAt || null,
    mockMode: isMockMode(),
  };
}

/**
 * Sync a completed UpTend job to Jobber
 */
export async function syncCompletedJob(
  businessId: string,
  jobData: {
    jobId: string;
    serviceType: string;
    customerFirstName: string;
    finalPrice: number;
    completedAt: string;
    address?: string;
  }
): Promise<{ success: boolean; jobberJobId: string }> {
  const tokens = tokenStore[businessId];
  if (!tokens) throw new Error("Not connected to Jobber");

  if (isMockMode()) {
    const jobberJobId = `JOB-${Date.now()}`;
    syncHistory.push({
      id: generateId(),
      businessId,
      type: "job",
      status: "success",
      details: `Job ${jobData.jobId}: ${jobData.serviceType} - $${jobData.finalPrice}`,
      syncedAt: new Date().toISOString(),
    });
    tokens.lastSyncAt = new Date().toISOString();
    return { success: true, jobberJobId };
  }

  // Create client in Jobber (first name only for privacy)
  const clientMutation = `
    mutation CreateClient($input: ClientCreateInput!) {
      clientCreate(input: $input) {
        client { id }
        userErrors { message }
      }
    }
  `;

  const clientResp = await fetch(JOBBER_GQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      "X-JOBBER-GRAPHQL-VERSION": "2024-06-13",
    },
    body: JSON.stringify({
      query: clientMutation,
      variables: {
        input: {
          firstName: jobData.customerFirstName,
          lastName: "(UpTend)",
        },
      },
    }),
  });

  const clientData = await clientResp.json() as any;
  const clientId = clientData?.data?.clientCreate?.client?.id;

  // Create job in Jobber
  const jobMutation = `
    mutation CreateJob($input: JobCreateInput!) {
      jobCreate(input: $input) {
        job { id }
        userErrors { message }
      }
    }
  `;

  const jobResp = await fetch(JOBBER_GQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      "X-JOBBER-GRAPHQL-VERSION": "2024-06-13",
    },
    body: JSON.stringify({
      query: jobMutation,
      variables: {
        input: {
          clientId,
          title: `UpTend: ${jobData.serviceType}`,
          startAt: jobData.completedAt,
          lineItems: [
            {
              name: jobData.serviceType,
              qty: 1,
              unitPrice: jobData.finalPrice,
              description: `UpTend Job #${jobData.jobId}`,
            },
          ],
        },
      },
    }),
  });

  const jobResult = await jobResp.json() as any;
  const jobberJobId = jobResult?.data?.jobCreate?.job?.id || "unknown";

  syncHistory.push({
    id: generateId(),
    businessId,
    type: "job",
    status: "success",
    details: `Job ${jobData.jobId}: ${jobData.serviceType} - $${jobData.finalPrice}`,
    syncedAt: new Date().toISOString(),
  });
  tokens.lastSyncAt = new Date().toISOString();

  return { success: true, jobberJobId };
}

export function getSyncHistory(businessId: string, limit = 50) {
  return syncHistory
    .filter(h => h.businessId === businessId)
    .sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime())
    .slice(0, limit);
}
