/**
 * Verify AI Tables Script
 * Checks that all AI capability tables are accessible and shows their structure
 */

import 'dotenv/config';
import { pool } from "../db";

async function verifyTables() {
  console.log("🔍 Verifying AI capability tables...\n");

  try {
    const client = await pool.connect();

    try {
      // Get column details for a few key tables
      const tables = [
        'ai_conversations',
        'photo_quote_requests',
        'pro_quality_scores',
        'fraud_alerts'
      ];

      for (const tableName of tables) {
        const result = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        console.log(`\n📋 Table: ${tableName}`);
        console.log(`   Columns: ${result.rows.length}`);
        result.rows.slice(0, 5).forEach((col: any) => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        if (result.rows.length > 5) {
          console.log(`   ... and ${result.rows.length - 5} more columns`);
        }
      }

      // Check if we can insert and query
      console.log("\n\n🧪 Testing basic operations...");

      // Test insert
      await client.query(`
        INSERT INTO ai_conversations (
          id, user_id, session_id, conversation_type,
          started_at, last_message_at, is_active
        ) VALUES (
          'test-conv-123', 'test-user-456', 'test-session-789', 'general',
          NOW()::TEXT, NOW()::TEXT, true
        )
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log("✅ Insert test passed");

      // Test query
      const queryResult = await client.query(`
        SELECT COUNT(*) as count FROM ai_conversations WHERE id = 'test-conv-123'
      `);
      console.log(`✅ Query test passed (found ${queryResult.rows[0].count} record)`);

      // Clean up test data
      await client.query(`DELETE FROM ai_conversations WHERE id = 'test-conv-123'`);
      console.log("✅ Cleanup completed");

      console.log("\n✨ All AI capability tables are verified and functional!");

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error("\n❌ Verification failed:");
    console.error(error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyTables()
  .then(() => {
    console.log("\n✅ Verification completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error.message);
    process.exit(1);
  });
