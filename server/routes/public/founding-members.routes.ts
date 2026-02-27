import { Router, Request, Response } from "express";
import { pool } from "../../db";

const router = Router();

// Get count of founding members
router.get("/founding-members/count", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT member_type, COUNT(*)::int as count FROM founding_members GROUP BY member_type"
    );
    const counts = { customer: 0, pro: 0 };
    for (const row of result.rows) {
      if (row.member_type === "customer") counts.customer = row.count;
      if (row.member_type === "pro") counts.pro = row.count;
    }
    res.json(counts);
  } catch (err) {
    console.error("Error fetching founding member count:", err);
    res.json({ customer: 0, pro: 0 });
  }
});

// Sign up as founding member
router.post("/founding-members", async (req: Request, res: Response) => {
  try {
    const { name, email, phone, zipCode, memberType, serviceType } = req.body;

    if (!name || !email || !memberType) {
      return res.status(400).json({ error: "Name, email, and member type are required" });
    }

    if (!["customer", "pro"].includes(memberType)) {
      return res.status(400).json({ error: "Member type must be 'customer' or 'pro'" });
    }

    // Check capacity
    const countResult = await pool.query(
      "SELECT COUNT(*)::int as count FROM founding_members WHERE member_type = $1",
      [memberType]
    );
    if (countResult.rows[0].count >= 100) {
      return res.status(409).json({ error: "All 100 spots have been claimed!" });
    }

    // Check duplicate
    const existing = await pool.query(
      "SELECT id FROM founding_members WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "This email is already registered" });
    }

    // Insert
    const result = await pool.query(
      `INSERT INTO founding_members (name, email, phone, zip_code, member_type, service_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [name, email, phone || null, zipCode || null, memberType, serviceType || null]
    );

    // Get new count for response
    const newCount = await pool.query(
      "SELECT COUNT(*)::int as count FROM founding_members WHERE member_type = $1",
      [memberType]
    );

    // Send confirmation email
    try {
      await sendFoundingMemberEmail(name, email, memberType, newCount.rows[0].count);
    } catch (emailErr) {
      console.error("Failed to send founding member email:", emailErr);
    }

    res.status(201).json({
      success: true,
      spotNumber: newCount.rows[0].count,
      message: `Welcome to the Founding 100! You're #${newCount.rows[0].count}.`
    });
  } catch (err: any) {
    console.error("Error creating founding member:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "This email is already registered" });
    }
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

async function sendFoundingMemberEmail(name: string, email: string, memberType: string, spotNumber: number) {
  const sgApiKey = process.env.SENDGRID_API_KEY;
  if (!sgApiKey) {
    console.log(`[Founding Member Email] Would send to ${email} (no SendGrid key)`);
    return;
  }

  const isPro = memberType === "pro";
  const subject = `Welcome to the Founding 100, ${name}!`;
  const perks = isPro
    ? `<ul style="padding-left:20px;color:#475569;">
        <li style="margin-bottom:8px;">12% platform fee (instead of 15%) for your entire first year</li>
        <li style="margin-bottom:8px;">Priority placement in customer matching</li>
        <li style="margin-bottom:8px;">"Founding Pro" badge on your profile</li>
        <li style="margin-bottom:8px;">Direct input on platform features</li>
      </ul>`
    : `<ul style="padding-left:20px;color:#475569;">
        <li style="margin-bottom:8px;">10% off your first service</li>
        <li style="margin-bottom:8px;">Priority booking access</li>
        <li style="margin-bottom:8px;">Direct line to George, your personal home expert</li>
        <li style="margin-bottom:8px;">"Founding Member" badge on your profile</li>
      </ul>`;

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;">
      <div style="background:#1e293b;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:28px;">
          <span style="color:#F47C20;">Up</span>Tend
        </h1>
        <p style="color:#94a3b8;margin-top:8px;font-size:14px;">Home Intelligence</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e2e8f0;border-top:none;">
        <h2 style="color:#1e293b;margin-top:0;">You're In, ${name}!</h2>
        <p style="color:#64748b;font-size:16px;line-height:1.6;">
          You're <strong style="color:#F47C20;">#${spotNumber}</strong> of 100 Founding ${isPro ? "Pros" : "Members"}. That means you're getting in before anyone else, and you're locked into perks that nobody else will get.
        </p>
        <h3 style="color:#1e293b;">Your Founding ${isPro ? "Pro" : "Member"} Perks:</h3>
        ${perks}
        <p style="color:#64748b;font-size:16px;line-height:1.6;">
          We're launching in the Orlando metro area and we'll be in touch soon with next steps. In the meantime, check out what George can do at <a href="https://uptendapp.com" style="color:#F47C20;">uptendapp.com</a>.
        </p>
        <div style="text-align:center;margin-top:32px;">
          <a href="https://uptendapp.com" style="background:#F47C20;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
            Explore UpTend
          </a>
        </div>
      </div>
      <div style="padding:24px;text-align:center;color:#94a3b8;font-size:12px;">
        UpTend Services LLC | Orlando, FL<br>
        <a href="https://uptendapp.com" style="color:#94a3b8;">uptendapp.com</a>
      </div>
    </div>
  `;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sgApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email, name }] }],
      from: { email: "alan@uptendapp.com", name: "UpTend" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SendGrid ${response.status}: ${text}`);
  }
  console.log(`[Founding Member Email] Sent to ${email}`);
}

export default router;
