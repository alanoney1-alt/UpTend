/**
 * Database Migration Runner
 *
 * Runs the multi-service ESG and team management migration.
 */

import { pool } from "../db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log("🚀 Starting database migration...\n");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, "../../migrations/0001_multi_service_esg_and_teams.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    console.log("📄 Migration file loaded:", migrationPath);
    console.log("📊 SQL length:", sql.length, "characters\n");

    // Connect to database
    const client = await pool.connect();
    console.log("✅ Connected to database\n");

    try {
      // Execute the migration
      console.log("⚙️  Executing migration SQL...");
      await client.query(sql);
      console.log("✅ Migration executed successfully!\n");

      // Verify tables were created
      console.log("🔍 Verifying tables...");

      const tableCheck = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('service_esg_metrics', 'business_team_members')
        ORDER BY table_name;
      `);

      console.log("\n📋 Tables found:");
      tableCheck.rows.forEach((row: any) => {
        console.log("  ✅", row.table_name);
      });

      // Verify indexes were created
      const indexCheck = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN ('service_esg_metrics', 'business_team_members')
        ORDER BY indexname;
      `);

      console.log("\n📇 Indexes created:");
      indexCheck.rows.forEach((row: any) => {
        console.log("  ✅", row.indexname);
      });

      // Check record counts
      const serviceEsgCount = await client.query("SELECT COUNT(*) as count FROM service_esg_metrics");
      const teamMembersCount = await client.query("SELECT COUNT(*) as count FROM business_team_members");

      console.log("\n📊 Initial record counts:");
      console.log("  service_esg_metrics:", serviceEsgCount.rows[0].count);
      console.log("  business_team_members:", teamMembersCount.rows[0].count);

      console.log("\n✨ Migration completed successfully!");
      console.log("\n📋 Next steps:");
      console.log("  1. Run data migration: npm run ts-node server/scripts/migrate-business-accounts-to-teams.ts");
      console.log("  2. Test API endpoints");
      console.log("  3. Integrate with job completion flow");

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);

    if (error.message.includes("already exists")) {
      console.log("\n💡 Tables may already exist. This is safe to ignore if you've run this migration before.");
      console.log("   To verify, run: npm run ts-node server/scripts/verify-migration.ts");
    }

    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

export { runMigration };
