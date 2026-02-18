/**
 * Consent Manager Service
 *
 * TCPA/CCPA/GDPR-compliant consent management.
 * Handles granting, revoking, STOP keyword processing,
 * and CCPA/GDPR data deletion requests.
 */

import { pool } from "../db";

export type ConsentType =
  | "transactional_sms"
  | "marketing_sms"
  | "marketing_email"
  | "push_notifications"
  | "smart_home_data"
  | "calendar_access"
  | "location_tracking";

export type ConsentMethod = "booking_flow" | "conversational" | "settings" | "written";
export type TriggeredBy = "user" | "system" | "george";

export interface ConsentRecord {
  id: string;
  userId: string;
  userType: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
  consentMethod: string;
  consentText: string | null;
  version: number;
}

// ─── Check Consent ─────────────────────────────────────────

export async function checkConsent(userId: string, consentType: ConsentType): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT granted FROM user_consents WHERE user_id = $1 AND consent_type = $2`,
    [userId, consentType]
  );
  return rows.length > 0 && rows[0].granted === true;
}

// ─── Grant Consent ─────────────────────────────────────────

export async function grantConsent(
  userId: string,
  consentType: ConsentType,
  method: ConsentMethod,
  consentText: string,
  options?: { userType?: string; ipAddress?: string; triggeredBy?: TriggeredBy }
): Promise<ConsentRecord> {
  const userType = options?.userType ?? "customer";
  const ipAddress = options?.ipAddress ?? null;
  const triggeredBy = options?.triggeredBy ?? "user";

  // Upsert consent
  const { rows } = await pool.query(
    `INSERT INTO user_consents (user_id, user_type, consent_type, granted, granted_at, revoked_at, consent_method, ip_address, consent_text, version)
     VALUES ($1, $2, $3, true, now(), NULL, $4, $5, $6, 1)
     ON CONFLICT (user_id, consent_type) DO UPDATE SET
       granted = true,
       granted_at = now(),
       revoked_at = NULL,
       consent_method = $4,
       ip_address = COALESCE($5, user_consents.ip_address),
       consent_text = $6,
       version = user_consents.version + 1,
       updated_at = now()
     RETURNING *`,
    [userId, userType, consentType, method, ipAddress, consentText]
  );

  const consent = rows[0];

  // Audit log
  await pool.query(
    `INSERT INTO consent_audit_log (user_id, consent_id, action, previous_state, new_state, triggered_by)
     VALUES ($1, $2, 'granted', $3, $4, $5)`,
    [
      userId,
      consent.id,
      JSON.stringify({ granted: false }),
      JSON.stringify({ granted: true, consentType, method }),
      triggeredBy,
    ]
  );

  return mapConsentRow(consent);
}

// ─── Revoke Consent ────────────────────────────────────────

export async function revokeConsent(
  userId: string,
  consentType: ConsentType,
  triggeredBy: TriggeredBy = "user"
): Promise<boolean> {
  const { rows } = await pool.query(
    `UPDATE user_consents
     SET granted = false, revoked_at = now(), updated_at = now()
     WHERE user_id = $1 AND consent_type = $2 AND granted = true
     RETURNING *`,
    [userId, consentType]
  );

  if (rows.length === 0) return false;

  await pool.query(
    `INSERT INTO consent_audit_log (user_id, consent_id, action, previous_state, new_state, triggered_by)
     VALUES ($1, $2, 'revoked', $3, $4, $5)`,
    [
      userId,
      rows[0].id,
      JSON.stringify({ granted: true, consentType }),
      JSON.stringify({ granted: false, consentType }),
      triggeredBy,
    ]
  );

  return true;
}

// ─── Handle STOP (revoke ALL SMS consents) ─────────────────

export async function handleSTOP(userId: string): Promise<{ revoked: string[] }> {
  const smsTypes: ConsentType[] = ["transactional_sms", "marketing_sms"];
  const revoked: string[] = [];

  for (const ct of smsTypes) {
    const didRevoke = await revokeConsent(userId, ct, "user");
    if (didRevoke) revoked.push(ct);
  }

  return { revoked };
}

// ─── Process Data Deletion (CCPA/GDPR) ────────────────────

export async function processDataDeletion(
  userId: string,
  categories: string[]
): Promise<{ requestId: string }> {
  const { rows } = await pool.query(
    `INSERT INTO data_deletion_requests (user_id, data_categories, status)
     VALUES ($1, $2, 'pending')
     RETURNING id`,
    [userId, JSON.stringify(categories)]
  );

  const requestId = rows[0].id;

  // Audit log entry
  await pool.query(
    `INSERT INTO consent_audit_log (user_id, action, new_state, triggered_by)
     VALUES ($1, 'revoked', $2, 'user')`,
    [userId, JSON.stringify({ dataDeletionRequest: requestId, categories })]
  );

  // In production, this would trigger an async worker to actually delete data.
  // For now, mark processing started.
  await pool.query(
    `UPDATE data_deletion_requests SET status = 'processing' WHERE id = $1`,
    [requestId]
  );

  return { requestId };
}

// ─── Get Consent Status ────────────────────────────────────

export async function getConsentStatus(userId: string): Promise<ConsentRecord[]> {
  const { rows } = await pool.query(
    `SELECT * FROM user_consents WHERE user_id = $1 ORDER BY consent_type`,
    [userId]
  );
  return rows.map(mapConsentRow);
}

// ─── Require Consent (for George) ──────────────────────────

export async function requireConsent(
  userId: string,
  consentType: ConsentType,
  georgeMessage?: string
): Promise<{ hasConsent: boolean; prompt?: string }> {
  const has = await checkConsent(userId, consentType);
  if (has) return { hasConsent: true };

  const prompts: Record<ConsentType, string> = {
    transactional_sms:
      "I'd love to send you updates about your booking via text. Is that cool with you?",
    marketing_sms:
      "I sometimes share tips and deals that could save you money. Mind if I text you occasionally?",
    marketing_email:
      "I can send you seasonal maintenance reminders and exclusive offers by email. Want in?",
    push_notifications:
      "Want me to ping you when there's something important — like a pro arriving or a deal expiring?",
    smart_home_data:
      "If you connect your smart home devices, I can catch problems early and save you money. Cool to access that data?",
    calendar_access:
      "I can sync with your calendar to find the perfect booking time. Mind if I take a peek?",
    location_tracking:
      "Knowing your area helps me give you hyper-local tips and pricing. OK to use your location?",
  };

  return {
    hasConsent: false,
    prompt: georgeMessage ?? prompts[consentType],
  };
}

// ─── Get Audit Trail ───────────────────────────────────────

export async function getAuditTrail(userId: string): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT * FROM consent_audit_log WHERE user_id = $1 ORDER BY timestamp DESC`,
    [userId]
  );
  return rows;
}

// ─── Helpers ───────────────────────────────────────────────

function mapConsentRow(row: any): ConsentRecord {
  return {
    id: row.id,
    userId: row.user_id,
    userType: row.user_type,
    consentType: row.consent_type,
    granted: row.granted,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    consentMethod: row.consent_method,
    consentText: row.consent_text,
    version: row.version,
  };
}
