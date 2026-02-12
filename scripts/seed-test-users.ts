/**
 * Seed script: creates fake customers and pros for testing.
 * Run with: npx tsx scripts/seed-test-users.ts
 * 
 * Uses the live API at localhost:5000 so all auth/session logic is exercised.
 */

const BASE = "http://localhost:5000";

interface TestCustomer {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  smsOptIn: boolean;
}

interface TestPro {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  vehicleType: string;
  serviceTypes: string[];
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

const customers: TestCustomer[] = [
  {
    email: "testcustomer1@uptend.app",
    password: "TestPass123!",
    firstName: "Maria",
    lastName: "Santos",
    phone: "4075551001",
    smsOptIn: true,
  },
  {
    email: "testcustomer2@uptend.app",
    password: "TestPass123!",
    firstName: "James",
    lastName: "Wilson",
    phone: "4075551002",
    smsOptIn: true,
  },
  {
    email: "testcustomer3@uptend.app",
    password: "TestPass123!",
    firstName: "Keisha",
    lastName: "Brown",
    phone: "4075551003",
    smsOptIn: true,
  },
];

const pros: TestPro[] = [
  {
    email: "testpro1@uptend.app",
    password: "TestPass123!",
    firstName: "Carlos",
    lastName: "Rivera",
    phone: "4075552001",
    companyName: "Rivera Hauling LLC",
    vehicleType: "box_truck_small",
    serviceTypes: ["junk_removal", "furniture_moving", "garage_cleanout", "moving_labor"],
    streetAddress: "123 Orange Ave",
    city: "Orlando",
    state: "FL",
    zipCode: "32801",
  },
  {
    email: "testpro2@uptend.app",
    password: "TestPass123!",
    firstName: "Derek",
    lastName: "Thompson",
    phone: "4075552002",
    companyName: "Thompson Home Services",
    vehicleType: "pickup",
    serviceTypes: ["pressure_washing", "gutter_cleaning", "light_demolition", "landscaping"],
    streetAddress: "456 Pine St",
    city: "Kissimmee",
    state: "FL",
    zipCode: "34741",
  },
  {
    email: "testpro3@uptend.app",
    password: "TestPass123!",
    firstName: "Aisha",
    lastName: "Johnson",
    phone: "4075552003",
    companyName: "Sparkle Clean Orlando",
    vehicleType: "cargo_van",
    serviceTypes: ["home_cleaning", "carpet_cleaning", "home_consultation"],
    streetAddress: "789 Lake Rd",
    city: "Winter Park",
    state: "FL",
    zipCode: "32789",
  },
];

async function seedCustomer(c: TestCustomer) {
  const res = await fetch(`${BASE}/api/customers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`✅ Customer: ${c.firstName} ${c.lastName} (${c.email}) — id: ${data.userId}`);
  } else {
    console.log(`⚠️  Customer ${c.email}: ${data.error}`);
  }
  return data;
}

async function seedPro(p: TestPro) {
  // Pro registration requires email verification first.
  // We'll bypass by inserting directly via the DB through an admin-style API call.
  // But first, let's try the simpler hauler register endpoint that may not require verification.
  
  // Try the legacy /api/haulers/register endpoint
  const res = await fetch(`${BASE}/api/haulers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...p,
      vehicleYear: "2022",
      vehicleMake: "Ford",
      vehicleModel: "Transit",
      licensePlate: "ABC" + Math.floor(Math.random() * 9000 + 1000),
      driversLicense: "FL" + Math.floor(Math.random() * 900000 + 100000),
      insuranceProvider: "State Farm",
      insurancePolicyNumber: "POL" + Math.floor(Math.random() * 900000 + 100000),
      aboutYou: "Experienced home services professional in the Orlando area.",
      agreeTerms: true,
      agreeBackgroundCheck: true,
    }),
  });
  const data = await res.json();
  if (res.ok) {
    console.log(`✅ Pro: ${p.firstName} ${p.lastName} (${p.email}) — ${p.companyName}`);
  } else {
    console.log(`⚠️  Pro ${p.email}: ${data.error}`);
  }
  return data;
}

async function main() {
  console.log("🌱 Seeding test users for UpTend...\n");
  
  console.log("--- Customers ---");
  for (const c of customers) {
    await seedCustomer(c);
  }
  
  console.log("\n--- Pros ---");
  for (const p of pros) {
    await seedPro(p);
  }
  
  console.log("\n📋 Test Credentials:");
  console.log("  Customers: testcustomer[1-3]@uptend.app / TestPass123!");
  console.log("  Pros:      testpro[1-3]@uptend.app / TestPass123!");
  console.log("\nDone! 🎉");
}

main().catch(console.error);
