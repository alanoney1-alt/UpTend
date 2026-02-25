/**
 * Seed pros directly into DB (bypasses email verification).
 * Run: npx tsx scripts/seed-pros-direct.ts
 */
import { config } from "dotenv";
config({ path: "../.env" });

import pg from "pg";
import bcrypt from "bcrypt";
import crypto from "crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const pros = [
  {
    firstName: "Marcus", lastName: "Williams", email: "testpro1@uptend.app",
    phone: "4075552001", company: "Williams Hauling LLC",
    vehicle: "box_truck", services: ["junk_removal", "furniture_moving", "garage_cleanout", "moving_labor"],
  },
  {
    firstName: "David", lastName: "Chen", email: "testpro2@uptend.app",
    phone: "4075552002", company: "Chen Home Services",
    vehicle: "pickup_truck", services: ["pressure_washing", "gutter_cleaning", "light_demolition", "landscaping"],
  },
  {
    firstName: "Maria", lastName: "Santos", email: "testpro3@uptend.app",
    phone: "4075552003", company: "Santos Clean Orlando",
    vehicle: "cargo_van", services: ["home_cleaning", "carpet_cleaning", "home_consultation"],
  },
];

async function main() {
  const password = await bcrypt.hash("TestPass123!", 10);

  for (const p of pros) {
    const id = crypto.randomUUID();
    try {
      // Insert user
      await pool.query(
        `INSERT INTO users (id, username, email, password, first_name, last_name, phone, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'hauler', NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, p.email, p.email, password, p.firstName, p.lastName, p.phone]
      );

      // Insert hauler profile
      const profileId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO hauler_profiles (id, user_id, company_name, vehicle_type, capacity, service_types, service_radius, rating, review_count, jobs_completed)
         VALUES ($1, $2, $3, $4, $5, $6, 25, 4.8, 0, 0)
         ON CONFLICT DO NOTHING`,
        [profileId, id, p.company, p.vehicle, "medium", p.services]
      );

      console.log(`✅ Pro: ${p.firstName} ${p.lastName} (${p.email})`);
    } catch (err: any) {
      console.log(`⚠️  ${p.email}: ${err.message}`);
    }
  }

  await pool.end();
  console.log("\n📋 Pro Credentials: testpro[1-3]@uptend.app / TestPass123!");
  console.log("Done! 🎉");
}

main().catch(console.error);
