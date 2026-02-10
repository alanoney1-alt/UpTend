import { db } from "../db";
import { sql } from "drizzle-orm";

async function checkTestData() {
  const result = await db.execute(sql`
    SELECT 
      id,
      service_request_id, 
      service_type, 
      esg_score, 
      net_co2_impact_lbs,
      water_saved_gallons,
      created_at
    FROM service_esg_metrics 
    WHERE service_request_id LIKE 'test-%'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  
  console.log(`\n✅ Found ${result.rows.length} test ESG records:\n`);
  result.rows.forEach((row: any) => {
    console.log(`- ${row.service_type}: Score ${row.esg_score}/100, CO2: ${row.net_co2_impact_lbs} lbs`);
  });
  
  // Clean up test records
  await db.execute(sql`DELETE FROM service_esg_metrics WHERE service_request_id LIKE 'test-%'`);
  console.log(`\n✅ Cleaned up ${result.rows.length} test records\n`);
}

checkTestData();
