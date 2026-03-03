/**
 * Partner-to-Partner Intros (#8)
 * 
 * George automatically connects customers to the right partner in the network.
 * When a customer needs a service their current partner doesn't cover,
 * George finds the right partner and makes the introduction.
 * 
 * The referring partner earns a 2% referral bonus (via partner-referral-network.ts).
 * 
 * Flow:
 * 1. Customer mentions need outside current partner's scope
 * 2. George identifies the service type
 * 3. George finds the best matching network partner
 * 4. George introduces the customer to the new partner
 * 5. Referral is tracked in partner_referrals table
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { createReferral, getNetworkPartners } from "./partner-referral-network";

// ============================================================
// Types
// ============================================================

export interface NetworkIntro {
  id?: number;
  referringPartnerSlug: string;
  receivingPartnerSlug: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceNeeded: string;
  introMessage: string;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: string;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureIntroTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_network_intros (
        id SERIAL PRIMARY KEY,
        referring_partner_slug TEXT NOT NULL,
        receiving_partner_slug TEXT NOT NULL,
        customer_id TEXT DEFAULT '',
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        service_needed TEXT NOT NULL,
        intro_message TEXT DEFAULT '',
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[NetworkIntros] Table creation error:", err);
  }
}

// ============================================================
// Matching
// ============================================================

/**
 * Find the best partner in the network for a given service type
 */
export async function findBestPartner(
  serviceNeeded: string,
  excludePartnerSlug: string,
  customerCity?: string
): Promise<{ slug: string; companyName: string; serviceTypes: string[] } | null> {
  const partners = await getNetworkPartners();
  
  const svcLower = serviceNeeded.toLowerCase();
  
  // Score each partner
  const scored = partners
    .filter(p => p.slug !== excludePartnerSlug && p.active)
    .map(p => {
      let score = 0;
      for (const st of p.serviceTypes) {
        if (st.toLowerCase().includes(svcLower) || svcLower.includes(st.toLowerCase())) {
          score += 10;
        }
        // Partial match
        const words = svcLower.split(" ");
        for (const word of words) {
          if (st.toLowerCase().includes(word)) score += 3;
        }
      }
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;
  return scored[0];
}

// ============================================================
// Introduction Flow
// ============================================================

/**
 * Create a partner-to-partner introduction
 * Returns the intro message George should send to the customer
 */
export async function makeIntroduction(
  referringPartnerSlug: string,
  customerId: string,
  customerName: string,
  customerPhone: string,
  serviceNeeded: string,
  customerCity?: string
): Promise<{
  success: boolean;
  message: string;
  receivingPartner?: { slug: string; companyName: string };
}> {
  await ensureIntroTables();
  
  const match = await findBestPartner(serviceNeeded, referringPartnerSlug, customerCity);
  
  if (!match) {
    return {
      success: false,
      message: `I don't have a ${serviceNeeded} partner in the network yet, but I can add you to our waitlist and reach out as soon as one joins. In the meantime, I can give you some tips on finding a good ${serviceNeeded} provider.`,
    };
  }

  const firstName = customerName.split(" ")[0] || "there";
  
  // Create the intro record
  const introMessage = `${firstName}, I've got a great ${serviceNeeded} partner in our network: ${match.companyName}. They're vetted, reviewed, and part of our trusted network. I'll connect you directly so you get the same quality and pricing transparency you're used to with us.`;

  await db.execute(sql`
    INSERT INTO partner_network_intros (
      referring_partner_slug, receiving_partner_slug, customer_id, customer_name,
      customer_phone, service_needed, intro_message, status
    ) VALUES (
      ${referringPartnerSlug}, ${match.slug}, ${customerId}, ${customerName},
      ${customerPhone}, ${serviceNeeded}, ${introMessage}, 'pending'
    )
  `);

  return {
    success: true,
    message: introMessage,
    receivingPartner: { slug: match.slug, companyName: match.companyName },
  };
}

/**
 * Accept an introduction (receiving partner confirms)
 */
export async function acceptIntro(introId: number): Promise<void> {
  await db.execute(sql`
    UPDATE partner_network_intros SET status = 'accepted' WHERE id = ${introId}
  `);
}

/**
 * Complete an introduction (job was booked and done)
 * This triggers the referral bonus
 */
export async function completeIntro(introId: number, jobId: string, jobAmount: number): Promise<void> {
  await ensureIntroTables();
  
  const introResult = await db.execute(sql`
    SELECT * FROM partner_network_intros WHERE id = ${introId}
  `);
  
  if (introResult.rows.length === 0) return;
  const intro: any = introResult.rows[0];
  
  await db.execute(sql`
    UPDATE partner_network_intros SET status = 'completed' WHERE id = ${introId}
  `);

  // Create the referral bonus
  await createReferral(
    intro.referring_partner_slug,
    intro.receiving_partner_slug,
    intro.customer_id,
    intro.customer_name,
    intro.service_needed,
    jobId,
    jobAmount,
    2.0 // 2% referral bonus
  );
}

/**
 * Get all intros for a partner (both sent and received)
 */
export async function getPartnerIntros(partnerSlug: string): Promise<{
  sent: NetworkIntro[];
  received: NetworkIntro[];
}> {
  await ensureIntroTables();
  
  const sentResult = await db.execute(sql`
    SELECT * FROM partner_network_intros
    WHERE referring_partner_slug = ${partnerSlug}
    ORDER BY created_at DESC LIMIT 50
  `);
  
  const receivedResult = await db.execute(sql`
    SELECT * FROM partner_network_intros
    WHERE receiving_partner_slug = ${partnerSlug}
    ORDER BY created_at DESC LIMIT 50
  `);

  return {
    sent: sentResult.rows as any[],
    received: receivedResult.rows as any[],
  };
}

/**
 * Natural language summary for George to text the partner
 */
export async function getIntroSummary(partnerSlug: string): Promise<string> {
  const intros = await getPartnerIntros(partnerSlug);
  
  const sentCount = intros.sent.length;
  const receivedCount = intros.received.length;
  const completedSent = intros.sent.filter((i: any) => i.status === "completed").length;
  const completedReceived = intros.received.filter((i: any) => i.status === "completed").length;

  if (sentCount === 0 && receivedCount === 0) {
    return "No cross-referrals yet. As the network grows, your customers will get access to every service type through your partnership.";
  }

  let summary = "";
  if (sentCount > 0) {
    summary += `You've referred ${sentCount} customers to other partners (${completedSent} completed). `;
  }
  if (receivedCount > 0) {
    summary += `You've received ${receivedCount} referrals from the network (${completedReceived} completed). `;
  }
  
  return summary.trim();
}
