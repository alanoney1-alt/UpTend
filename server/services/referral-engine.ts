/**
 * Referral Engine — Codes, tracking, credits, group deals
 */
import { pool } from "../db.js";

function generateCode(customerId: string): string {
  const prefix = customerId.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "X");
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}${year}${rand}`;
}

export async function generateReferralCode(customerId: string) {
  // Check for existing active code
  const { rows: existing } = await pool.query(
    `SELECT * FROM referral_codes WHERE customer_id = $1 AND active = true LIMIT 1`,
    [customerId]
  );
  if (existing.length) return { code: existing[0].code, existing: true };

  const code = generateCode(customerId);
  const { rows } = await pool.query(
    `INSERT INTO referral_codes (customer_id, code) VALUES ($1, $2) RETURNING *`,
    [customerId, code]
  );
  return { code: rows[0].code, existing: false };
}

export async function trackReferral(code: string, newCustomerEmail: string) {
  const { rows: codeRows } = await pool.query(
    `SELECT * FROM referral_codes WHERE code = $1 AND active = true`,
    [code]
  );
  if (!codeRows.length) return { error: "Invalid or inactive referral code" };

  const refCode = codeRows[0];
  if (refCode.max_uses && refCode.uses >= refCode.max_uses) {
    return { error: "Referral code has reached maximum uses" };
  }

  const { rows } = await pool.query(
    `INSERT INTO referrals (referrer_id, referred_email, referral_code, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [refCode.customer_id, newCustomerEmail, code]
  );

  await pool.query(
    `UPDATE referral_codes SET uses = uses + 1 WHERE id = $1`,
    [refCode.id]
  );

  return { referralId: rows[0].id, status: "pending" };
}

export async function creditReferral(referralId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM referrals WHERE id = $1`,
    [referralId]
  );
  if (!rows.length) return { error: "Referral not found" };

  const referral = rows[0];
  if (referral.referrer_credited) return { error: "Already credited" };

  // $25 to referrer, $10 to referred
  await pool.query(
    `UPDATE referrals SET status = 'credited', referrer_credited = true, referred_credited = true, converted_at = NOW() WHERE id = $1`,
    [referralId]
  );

  // Update referrer's loyalty spend (credit acts like spend for tier purposes)
  await pool.query(
    `UPDATE loyalty_tiers SET lifetime_spend = lifetime_spend + $1 WHERE customer_id = $2`,
    [25, referral.referrer_id]
  );

  return {
    credited: true,
    referrerCredit: 25,
    referredCredit: 10,
    referrerId: referral.referrer_id,
    referredCustomerId: referral.referred_customer_id,
  };
}

export async function getReferralStatus(customerId: string) {
  const { rows: all } = await pool.query(
    `SELECT * FROM referrals WHERE referrer_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );

  const credited = all.filter(r => r.status === "credited");
  const pending = all.filter(r => r.status !== "credited");

  return {
    totalReferrals: all.length,
    credited: credited.length,
    pending: pending.length,
    totalEarned: credited.length * 25,
    referrals: all.map(r => ({
      id: r.id,
      email: r.referred_email,
      status: r.status,
      creditAmount: parseFloat(r.credit_amount),
      createdAt: r.created_at,
    })),
  };
}

export async function createGroupDeal(customerId: string, neighborhood: string, serviceType: string) {
  const { rows } = await pool.query(
    `INSERT INTO group_deals (neighborhood_name, service_type, organized_by, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '14 days') RETURNING *`,
    [neighborhood, serviceType, customerId]
  );

  // Auto-add organizer as participant
  await pool.query(
    `INSERT INTO group_deal_participants (group_deal_id, customer_id) VALUES ($1, $2)`,
    [rows[0].id, customerId]
  );

  return {
    dealId: rows[0].id,
    neighborhood,
    serviceType,
    minParticipants: rows[0].min_participants,
    discountPercent: parseFloat(rows[0].discount_percent),
    expiresAt: rows[0].expires_at,
    status: "forming",
  };
}

export async function joinGroupDeal(dealId: string, customerId: string) {
  const { rows: deal } = await pool.query(
    `SELECT * FROM group_deals WHERE id = $1 AND status = 'forming'`,
    [dealId]
  );
  if (!deal.length) return { error: "Deal not found or no longer forming" };

  await pool.query(
    `INSERT INTO group_deal_participants (group_deal_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [dealId, customerId]
  );

  await pool.query(
    `UPDATE group_deals SET participant_count = participant_count + 1 WHERE id = $1`,
    [dealId]
  );

  const updated = (await pool.query(`SELECT * FROM group_deals WHERE id = $1`, [dealId])).rows[0];

  // Auto-confirm if min reached
  if (updated.participant_count >= updated.min_participants && updated.status === "forming") {
    await pool.query(`UPDATE group_deals SET status = 'confirmed' WHERE id = $1`, [dealId]);
    updated.status = "confirmed";
  }

  return {
    joined: true,
    dealId,
    participantCount: updated.participant_count,
    minParticipants: updated.min_participants,
    status: updated.status,
    discountPercent: parseFloat(updated.discount_percent),
  };
}

export async function getNeighborhoodDeals(zip: string) {
  const { rows } = await pool.query(
    `SELECT gd.*, 
       (SELECT neighborhood_name FROM neighborhood_activity WHERE zip = $1 LIMIT 1) as area_name
     FROM group_deals gd
     WHERE gd.status IN ('forming','confirmed')
       AND gd.expires_at > NOW()
     ORDER BY gd.created_at DESC
     LIMIT 20`,
    [zip]
  );

  return rows.map(d => ({
    id: d.id,
    neighborhood: d.neighborhood_name,
    serviceType: d.service_type,
    participantCount: d.participant_count,
    minParticipants: d.min_participants,
    discountPercent: parseFloat(d.discount_percent),
    status: d.status,
    expiresAt: d.expires_at,
  }));
}
