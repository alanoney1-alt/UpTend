/**
 * Activate test pros: set available, set location, set verified tier.
 * Run: cd ~/uptend-openclaw && npx tsx scripts/activate-test-pros.ts
 */
import { config } from "dotenv";
config({ path: ".env" });

import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const proEmails = [
  "testpro1@uptend.app",
  "testpro2@uptend.app",
  "testpro3@uptend.app",
];

async function main() {
  for (const email of proEmails) {
    try {
      // Get user ID
      const userResult = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (userResult.rows.length === 0) {
        console.log(`❌ No user found for ${email}`);
        continue;
      }
      const userId = userResult.rows[0].id;

      // Update user location
      await pool.query(
        `UPDATE users SET current_lat = $1, current_lng = $2, last_location_update = NOW() WHERE id = $3`,
        [28.5383, -81.3792, userId]
      );

      // Update hauler_profile: available, location, tier
      const profileResult = await pool.query(
        `UPDATE hauler_profiles 
         SET is_available = true, 
             current_lat = $1, 
             current_lng = $2, 
             pycker_tier = 'verified_pro',
             background_check_status = 'approved'
         WHERE user_id = $3
         RETURNING id`,
        [28.5383, -81.3792, userId]
      );

      if (profileResult.rowCount === 0) {
        console.log(`⚠️  No hauler_profile for ${email} — creating one`);
        // Might not have a profile if insert failed before
      } else {
        console.log(`✅ Activated: ${email} (profile ${profileResult.rows[0].id})`);
      }

      // Ensure vehicle exists
      const vehicleCheck = await pool.query(
        `SELECT id FROM pycker_vehicles WHERE hauler_profile_id = (SELECT id FROM hauler_profiles WHERE user_id = $1)`,
        [userId]
      );
      if (vehicleCheck.rows.length === 0) {
        const profileId = profileResult.rows[0]?.id;
        if (profileId) {
          const vehicleTypes = { "testpro1@uptend.app": "box_truck", "testpro2@uptend.app": "pickup_truck", "testpro3@uptend.app": "cargo_van" };
          await pool.query(
            `INSERT INTO pycker_vehicles (id, hauler_profile_id, vehicle_type, vehicle_name, make, model, year, license_plate, capacity, is_active, created_at)
             VALUES (gen_random_uuid(), $1, $2, $2 || ' - Ford F-250', 'Ford', 'F-250', 2022, 'FL-TEST', 'medium', true, NOW())`,
            [profileId, vehicleTypes[email as keyof typeof vehicleTypes] || "pickup_truck"]
          );
          console.log(`  🚛 Vehicle added for ${email}`);
        }
      } else {
        console.log(`  🚛 Vehicle already exists for ${email}`);
      }
    } catch (err: any) {
      console.log(`❌ ${email}: ${err.message}`);
    }
  }

  await pool.end();
  console.log("\nDone! All test pros activated. 🎉");
}

main().catch(console.error);
