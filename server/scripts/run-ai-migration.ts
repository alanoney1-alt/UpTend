/**
 * AI Expansion Database Migration Runner
 *
 * Runs the AI capabilities migration (0013_add_ai_expansion_tables.sql)
 */

import 'dotenv/config';
import { pool } from "../db";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  console.log("🚀 Starting AI Expansion database migration...\n");

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, "../db/migrations/0013_add_ai_expansion_tables.sql");
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
      console.log("🔍 Verifying AI capability tables...");

      const tableCheck = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
          'ai_conversations',
          'ai_conversation_messages',
          'photo_quote_requests',
          'seasonal_advisories',
          'smart_schedule_suggestions',
          'move_in_plans',
          'document_scans',
          'pro_route_optimizations',
          'pro_quality_scores',
          'job_quality_assessments',
          'inventory_estimates',
          'portfolio_health_reports',
          'fraud_alerts',
          'ai_marketing_content',
          'voice_booking_sessions',
          'neighborhood_intelligence_reports'
        )
        ORDER BY table_name;
      `);

      console.log("\n📋 Tables created:");
      tableCheck.rows.forEach((row: any) => {
        console.log("  ✅", row.table_name);
      });

      console.log(`\n📊 Total: ${tableCheck.rows.length} / 16 AI capability tables created`);

      // Verify indexes were created
      const indexCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename IN (
          'ai_conversations',
          'ai_conversation_messages',
          'photo_quote_requests',
          'seasonal_advisories',
          'smart_schedule_suggestions',
          'move_in_plans',
          'document_scans',
          'pro_route_optimizations',
          'pro_quality_scores',
          'job_quality_assessments',
          'inventory_estimates',
          'portfolio_health_reports',
          'fraud_alerts',
          'ai_marketing_content',
          'voice_booking_sessions',
          'neighborhood_intelligence_reports'
        );
      `);

      console.log(`\n📇 Indexes created: ${indexCheck.rows[0].count}`);

      console.log("\n✨ AI Expansion migration completed successfully!");
      console.log("\n📋 Next steps:");
      console.log("  1. API routes are ready to be created");
      console.log("  2. Storage layer is already integrated");
      console.log("  3. Start building AI features!");

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);

    if (error.message.includes("already exists")) {
      console.log("\n💡 Tables may already exist. This is safe to ignore if you've run this migration before.");
      console.log("   Run this script again to verify all tables are present.");
    } else {
      console.error("\n📝 Full error details:");
      console.error(error);
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
    console.error("\n❌ Script failed:", error.message);
    process.exit(1);
  });

export { runMigration };
