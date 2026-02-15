import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, varchar, text, real, boolean } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
// Extended with uPYCK platform fields: role, phone, location, stripe
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  password: text("password"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Platform-specific fields
  role: text("role").notNull().default("customer"), // customer, hauler, admin
  phone: text("phone"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  lastLocationUpdate: text("last_location_update"),
  googleId: text("google_id"),
  stripeCustomerId: text("stripe_customer_id"),
  totalJobsCompleted: real("total_jobs_completed").default(0),
  // Chargeback/Dispute Risk Fields
  disputeCount: integer("dispute_count").default(0),
  riskLevel: text("risk_level").default("normal"), // 'normal' | 'elevated' | 'high'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Customer addresses table for saved pickup/delivery locations
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  label: text("label").notNull(), // "Home", "Work", "Mom's House", etc.
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = typeof customerAddresses.$inferInsert;
