import { db } from "../db";
import { sql } from "drizzle-orm";

async function testTables() {
  try {
    console.log("🧪 Testing Database Tables...\n");

    // Test service_esg_metrics table
    const esgCount = await db.execute(sql`SELECT COUNT(*) FROM service_esg_metrics`);
    console.log("✅ service_esg_metrics table exists, rows:", esgCount.rows[0].count);

    // Test business_team_members table  
    const teamCount = await db.execute(sql`SELECT COUNT(*) FROM business_team_members`);
    console.log("✅ business_team_members table exists, rows:", teamCount.rows[0].count);

    // Test schema
    const esgColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'service_esg_metrics'
      ORDER BY ordinal_position
    `);
    console.log("✅ service_esg_metrics has", esgColumns.rows.length, "columns");

    const teamColumns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'business_team_members'
      ORDER BY ordinal_position
    `);
    console.log("✅ business_team_members has", teamColumns.rows.length, "columns");

    // Test indexes exist
    const indexes = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('service_esg_metrics', 'business_team_members')
    `);
    console.log("✅", indexes.rows.length, "indexes created");

    console.log("\n✅ DATABASE TEST PASSED\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ DATABASE TEST FAILED:", error);
    process.exit(1);
  }
}

testTables();
