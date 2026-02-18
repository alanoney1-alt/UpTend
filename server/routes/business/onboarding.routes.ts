/**
 * B2B Onboarding Routes
 *
 * POST /api/business/onboard           — Full onboarding flow
 * POST /api/business/onboard/parse-csv — Parse property CSV
 * GET  /api/business/onboard/csv-template — Download CSV template
 * POST /api/business/onboard/validate-integration — Test PM software connection
 */

import { Router, type Request, type Response } from "express";
import multer from "multer";
import { BusinessAccountsStorage } from "../../storage/domains/business-accounts/storage";
import { storage } from "../../storage";
import { pool } from "../../db";
import { logSubscriptionPayment } from "../../services/accounting-service";
import { stripeService } from "../../stripeService";

const router = Router();
const store = new BusinessAccountsStorage();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── CSV Template ──────────────────────────────────────────────────

const CSV_TEMPLATE = "address,city,state,zip,units,type,tenant_name,tenant_email,tenant_phone\n" +
  "123 Main St,Austin,TX,78701,4,residential,John Smith,john@example.com,512-555-0100\n";

router.get("/onboard/csv-template", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=uptend-property-template.csv");
  res.send(CSV_TEMPLATE);
});

// ─── CSV Parse ─────────────────────────────────────────────────────

router.post("/onboard/parse-csv", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const content = file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: "CSV must have a header row and at least one data row" });

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const requiredHeaders = ["address", "city", "state", "zip"];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) return res.status(400).json({ error: `Missing required columns: ${missing.join(", ")}` });

    const rows: Record<string, string>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length < headers.length) {
        errors.push(`Row ${i}: insufficient columns`);
        continue;
      }
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      if (!row.address) {
        errors.push(`Row ${i}: missing address`);
        continue;
      }
      if (!row.state || row.state.length !== 2) {
        errors.push(`Row ${i}: invalid state code`);
      }
      rows.push(row);
    }

    res.json({
      headers,
      rows,
      totalRows: lines.length - 1,
      validRows: rows.length,
      errors,
    });
  } catch (error: any) {
    console.error("[ONBOARD] CSV parse error:", error);
    res.status(500).json({ error: "Failed to parse CSV" });
  }
});

// ─── Validate Integration ──────────────────────────────────────────

router.post("/onboard/validate-integration", async (req: Request, res: Response) => {
  try {
    const { platform, apiKey } = req.body;
    if (!platform || !apiKey) return res.status(400).json({ error: "Platform and API key required" });

    // Validation — in production this would hit the actual APIs
    const supported = ["appfolio", "buildium", "yardi"];
    if (!supported.includes(platform)) {
      return res.status(400).json({ error: `Unsupported platform: ${platform}` });
    }

    // Basic key format validation
    if (apiKey.length < 8) {
      return res.status(400).json({ valid: false, error: "API key appears too short" });
    }

    res.json({ valid: true, platform, message: `${platform} connection will be configured during account setup.` });
  } catch (error: any) {
    console.error("[ONBOARD] Integration validation error:", error);
    res.status(500).json({ error: "Failed to validate integration" });
  }
});

// ─── Full Onboarding ──────────────────────────────────────────────

router.post("/onboard", async (req: Request, res: Response) => {
  try {
    const {
      businessInfo,
      plan,
      serviceConfig,
      properties,
      csvData,
      integrations,
      importMode,
      teamMembers,
    } = req.body;

    if (!businessInfo?.companyName || !businessInfo?.email || !businessInfo?.segment) {
      return res.status(400).json({ error: "Company name, email, and segment are required" });
    }
    if (!plan) {
      return res.status(400).json({ error: "Plan selection is required" });
    }

    const isIndependent = plan === "independent";

    // 1. Create or find user
    let user = await storage.getUserByEmail(businessInfo.contactEmail || businessInfo.email);
    if (!user) {
      user = await storage.createUser({
        email: businessInfo.contactEmail || businessInfo.email,
        firstName: businessInfo.contactName || businessInfo.companyName, lastName: "",
        phone: businessInfo.contactPhone || businessInfo.phone,
        role: "business",
      });
    }

    // 2. Create business account
    const accountTypeMap: Record<string, string> = {
      property_management: "property_manager",
      hoa: "hoa",
      construction: "business",
      government: "government",
    };

    const account = await store.createBusinessAccount({
      userId: user.id,
      businessName: businessInfo.companyName,
      businessType: businessInfo.segment,
      accountType: accountTypeMap[businessInfo.segment] || "business",
      taxId: businessInfo.taxId || null,
      billingAddress: businessInfo.address || null,
      billingCity: businessInfo.city || null,
      billingState: businessInfo.state || null,
      billingZip: businessInfo.zip || null,
      primaryContactName: businessInfo.contactName || null,
      primaryContactPhone: businessInfo.contactPhone || null,
      primaryContactEmail: businessInfo.contactEmail || null,
      communityName: businessInfo.companyName,
      totalProperties: parseInt(businessInfo.unitCount) || 0,
      createdAt: new Date().toISOString(),
    });

    // 3. Store plan & service config as metadata update
    await store.updateBusinessAccount(account.id, {
      volumeDiscountTier: isIndependent ? "independent" : plan,
      monthlyJobTarget: parseInt(serviceConfig?.autoApprovalThreshold) || 500,
      invoicingEnabled: !isIndependent,
    });

    // 4. Import properties (enforce limit for independent tier)
    const propertyData = importMode === "csv" && csvData?.length
      ? csvData.map((row: any) => ({
          address: row.address,
          city: row.city,
          state: row.state,
          zip: row.zip,
          units: parseInt(row.units) || 1,
          type: row.type || "residential",
          tenantName: row.tenant_name || "",
          tenantEmail: row.tenant_email || "",
          tenantPhone: row.tenant_phone || "",
        }))
      : (properties || []);

    // Enforce property limit for independent tier
    if (isIndependent && propertyData.length > 10) {
      return res.status(400).json({
        error: "Independent plan supports up to 10 properties. Upgrade to add more.",
        propertyLimit: 10,
        submitted: propertyData.length,
      });
    }

    // Store properties in hoa_properties table if available
    if (propertyData.length > 0) {
      for (const prop of propertyData) {
        try {
          await pool.query(`
            INSERT INTO hoa_properties (business_account_id, address, city, state, zip, unit_count, property_type, tenant_name, tenant_email, tenant_phone, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          `, [account.id, prop.address, prop.city, prop.state, prop.zip, prop.units || 1, prop.type || "residential", prop.tenantName || "", prop.tenantEmail || "", prop.tenantPhone || ""]);
        } catch (propErr: any) {
          console.error("[ONBOARD] Property insert error:", propErr.message);
          // Continue with other properties
        }
      }
    }

    // 5. Send team invitations
    const validTeamMembers = (teamMembers || []).filter((m: any) => m.email?.trim());
    if (validTeamMembers.length > 0) {
      const { sendB2BWelcome } = await import("../../services/email-service");
      for (const member of validTeamMembers) {
        try {
          // Create team member record
          await store.createTeamMember({
            businessAccountId: account.id,
            userId: user.id, // Placeholder — will be updated when they accept invite
            role: member.role || "coordinator",
            invitedEmail: member.email,
            invitedName: member.name,
            isActive: false,
          } as any);

          // Send invitation email
          await sendB2BWelcome(member.email, {
            businessName: businessInfo.companyName,
            contactName: member.name,
          });
        } catch (invErr: any) {
          console.error("[ONBOARD] Team invite error:", invErr.message);
        }
      }
    }

    // 6. Create Stripe subscription if applicable (skip for independent tier)
    let subscriptionId: string | null = null;
    if (isIndependent) {
      // No Stripe setup needed for free tier
      console.log("[ONBOARD] Independent tier — skipping Stripe setup");
    } else try {
      let stripeCustomerId = (user as any).stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          businessInfo.contactEmail || businessInfo.email,
          businessInfo.companyName,
          user.id,
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }

      // Log the subscription intent (actual Stripe price creation happens via admin/webhook)
      await logSubscriptionPayment({
        id: `onboard-${account.id}`,
        amount: 0, // Trial period — $0
        businessAccountId: account.id,
      });
    } catch (stripeErr: any) {
      console.error("[ONBOARD] Stripe setup error:", stripeErr.message);
      // Non-fatal — account is still created
    }

    // 7. Send welcome email to primary contact
    try {
      const { sendB2BWelcome } = await import("../../services/email-service");
      await sendB2BWelcome(businessInfo.contactEmail || businessInfo.email, {
        businessName: businessInfo.companyName,
        contactName: businessInfo.contactName,
      });
    } catch (emailErr: any) {
      console.error("[ONBOARD] Welcome email error:", emailErr.message);
    }

    res.status(201).json({
      success: true,
      account,
      userId: user.id,
      dashboardUrl: "/business/dashboard",
      message: "Business account created successfully",
    });
  } catch (error: any) {
    console.error("[ONBOARD] Error:", error);
    res.status(500).json({ error: "Failed to create business account" });
  }
});

// ─── Property Limit Check (for independent tier) ──────────────────

router.get("/property-limit", async (req: Request, res: Response) => {
  try {
    const userId = ((req.user as any)?.userId || (req.user as any)?.id);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const account = await store.getBusinessAccountByUser(userId);
    if (!account) return res.status(404).json({ error: "No business account found" });

    const isIndependent = account.volumeDiscountTier === "independent";
    const propertyLimit = isIndependent ? 10 : null; // null = unlimited

    // Count existing properties
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM hoa_properties WHERE business_account_id = $1`,
      [account.id]
    );
    const currentCount = parseInt(result.rows?.[0]?.count) || 0;

    res.json({
      tier: account.volumeDiscountTier,
      propertyLimit,
      currentCount,
      canAdd: propertyLimit === null || currentCount < propertyLimit,
      remaining: propertyLimit ? Math.max(0, propertyLimit - currentCount) : null,
    });
  } catch (error: any) {
    console.error("[ONBOARD] Property limit check error:", error);
    res.status(500).json({ error: "Failed to check property limit" });
  }
});

export default router;
