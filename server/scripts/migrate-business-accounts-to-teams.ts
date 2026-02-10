/**
 * Data Migration: Convert Single-User Business Accounts to Multi-User Teams
 *
 * This script migrates existing business accounts to the new multi-user team structure:
 * - Creates a businessTeamMember entry for each businessAccount
 * - Sets role="owner" with all permissions enabled
 * - Marks as accepted (no invitation needed for existing users)
 *
 * Run with: npx tsx server/scripts/migrate-business-accounts-to-teams.ts
 */

import { db } from "../db";
import { businessAccounts, businessTeamMembers } from "@shared/schema";
import { sql } from "drizzle-orm";

async function migrateBusinessAccountsToTeams() {
  console.log("Starting business account migration to multi-user teams...\n");

  try {
    // Get all existing business accounts
    const accounts = await db.select().from(businessAccounts);
    console.log(`Found ${accounts.length} business accounts to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const account of accounts) {
      try {
        // Check if team member already exists
        const existing = await db.select()
          .from(businessTeamMembers)
          .where(sql`${businessTeamMembers.businessAccountId} = ${account.id} AND ${businessTeamMembers.userId} = ${account.userId}`)
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️  Skipped: ${account.businessName} (team member already exists)`);
          skipped++;
          continue;
        }

        // Create owner team member
        await db.insert(businessTeamMembers).values({
          businessAccountId: account.id,
          userId: account.userId,
          role: "owner",

          // Grant all permissions to owner
          canViewFinancials: true,
          canManageTeam: true,
          canCreateJobs: true,
          canApprovePayments: true,
          canAccessEsgReports: true,
          canManageProperties: true,

          // Mark as accepted (no invitation needed)
          invitationStatus: "accepted",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        console.log(`✅ Migrated: ${account.businessName} (${account.accountType})`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating ${account.businessName}:`, error);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Migration Summary:");
    console.log(`  ✅ Migrated: ${migrated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);
    console.log("=".repeat(60) + "\n");

    if (errors === 0) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with errors. Please review the logs.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateBusinessAccountsToTeams()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
