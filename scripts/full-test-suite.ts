#!/usr/bin/env tsx
/**
 * Full Test Suite - Tests all endpoints with realistic data
 */

import 'dotenv/config';

const BASE = 'http://localhost:5000';

interface Bug {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  endpoint: string;
  method: string;
  status: number;
  issue: string;
  details?: string;
  fix?: string;
}

const bugs: Bug[] = [];
const passed: string[] = [];

async function test(
  method: string,
  path: string,
  body?: any,
  expectedStatus?: number
): Promise<any> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = res.headers.get('content-type');
    let data: any;

    if (contentType?.includes('json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    // Check for errors
    if (res.status === 500) {
      bugs.push({
        severity: 'CRITICAL',
        endpoint: path,
        method,
        status: res.status,
        issue: 'Server error (500)',
        details: JSON.stringify(data).slice(0, 200),
      });
    } else if (res.status === 404 && !path.includes(':') && expectedStatus !== 404) {
      bugs.push({
        severity: 'HIGH',
        endpoint: path,
        method,
        status: res.status,
        issue: 'Route not found (404)',
      });
    } else if (expectedStatus && res.status !== expectedStatus) {
      bugs.push({
        severity: 'MEDIUM',
        endpoint: path,
        method,
        status: res.status,
        issue: `Expected ${expectedStatus}, got ${res.status}`,
        details: JSON.stringify(data).slice(0, 200),
      });
    } else if (res.status >= 200 && res.status < 300) {
      passed.push(`${method} ${path}`);
    }

    return { status: res.status, data };
  } catch (err: any) {
    bugs.push({
      severity: 'CRITICAL',
      endpoint: path,
      method,
      status: 0,
      issue: 'Network error',
      details: err.message,
    });
    return { status: 0, data: null };
  }
}

async function runFullTestSuite() {
  console.log('🧪 Running Full Test Suite...\n');

  // === PUBLIC ROUTES ===
  console.log('1️⃣  Testing Public Routes...');
  await test('GET', '/');
  await test('GET', '/api/health');
  await test('GET', '/about');

  // === STRIPE ===
  console.log('2️⃣  Testing Stripe Integration...');
  await test('GET', '/api/stripe/publishable-key');
  const paymentIntent = await test('POST', '/api/payments/create-intent', {
    amount: 10000,
    currency: 'usd',
    jobId: 'test-job-123',
    customerId: 'test-customer-123',
  });

  // === PRICING ===
  console.log('3️⃣  Testing Pricing Engine...');
  await test('POST', '/api/pricing/quote', {
    serviceType: 'junk_removal',
    loadSize: 'small',
    pickupLat: 28.5,
    pickupLng: -81.3,
  });
  await test('GET', '/api/pricing/supported-zips');
  await test('GET', '/api/pricing/dump-distance/32801');

  // === FACILITIES & REBATES ===
  console.log('4️⃣  Testing Facilities & Rebates...');
  await test('GET', '/api/facilities');

  // === ANALYTICS ===
  console.log('5️⃣  Testing Analytics...');
  await test('POST', '/api/analytics/track', {
    userId: 'test-user',
    eventType: 'page_view',
    eventData: { page: '/test' },
  });
  await test('GET', '/api/analytics/funnel');

  // === PROMO CODES ===
  console.log('6️⃣  Testing Promo Codes...');
  await test('POST', '/api/promo-codes/validate', {
    code: 'INVALID',
    userId: 'test-user',
  });

  // === AUTH - CUSTOMER ===
  console.log('7️⃣  Testing Customer Auth...');
  await test('POST', '/api/customers/register', {
    email: 'newcustomer@test.com',
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '14075551234',
    agreeToSms: true,
  });
  await test('POST', '/api/customers/login', {
    email: 'wrong@test.com',
    password: 'wrongpass',
  }, 401);

  // === AUTH - HAULER ===
  console.log('8️⃣  Testing Hauler Auth...');
  await test('POST', '/api/haulers/check-username', {
    username: 'testdriver',
  });
  await test('POST', '/api/haulers/send-verification', {
    email: 'hauler@test.com',
  });

  // === AUTH - ADMIN ===
  console.log('9️⃣  Testing Admin Auth...');
  const adminCheck = await test('GET', '/api/admin/check');
  await test('POST', '/api/auth/forgot-password', {
    email: 'admin@test.com',
  });

  // === PROTECTED ROUTES (should return 401) ===
  console.log('🔒 Testing Protected Routes...');
  await test('GET', '/api/my-jobs', undefined, 401);
  await test('PATCH', '/api/customers/profile', {}, 401);
  await test('GET', '/api/customers/payment-methods', undefined, 401);
  await test('POST', '/api/haulers/go-online', {}, 401);
  await test('GET', '/api/admin/jobs', undefined, 401);

  // === AI ENDPOINTS ===
  console.log('🤖 Testing AI Endpoints...');
  await test('POST', '/api/ai/analyze-photos', {
    photoUrls: ['https://images.unsplash.com/photo-1574643156929-51fa098b0394'],
    serviceType: 'junk_removal',
    loadEstimate: 'small',
  });

  // === SERVICE REQUESTS ===
  console.log('📦 Testing Service Requests...');
  await test('GET', '/api/service-requests/pending');

  // === WEBSOCKET ===
  console.log('🔌 Testing WebSocket...');
  await test('GET', '/ws');

  console.log('\n✅ Test Suite Complete!\n');
}

function generateReport() {
  console.log('='.repeat(80));
  console.log('                    🐛 COMPREHENSIVE BUG REPORT');
  console.log('='.repeat(80));
  console.log();
  console.log(`📊 Summary:`);
  console.log(`   Total Tests: ${bugs.length + passed.length}`);
  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ❌ Failed: ${bugs.length}`);
  console.log();

  const critical = bugs.filter((b) => b.severity === 'CRITICAL');
  const high = bugs.filter((b) => b.severity === 'HIGH');
  const medium = bugs.filter((b) => b.severity === 'MEDIUM');
  const low = bugs.filter((b) => b.severity === 'LOW');

  if (critical.length === 0 && high.length === 0 && medium.length === 0) {
    console.log('🎉 NO CRITICAL OR HIGH SEVERITY BUGS FOUND!\n');
  }

  if (critical.length > 0) {
    console.log('💀 CRITICAL BUGS (Must Fix Immediately)');
    console.log('-'.repeat(80));
    critical.forEach((bug, i) => {
      console.log(`${i + 1}. ${bug.method} ${bug.endpoint}`);
      console.log(`   Issue: ${bug.issue}`);
      if (bug.details) console.log(`   Details: ${bug.details}`);
      if (bug.fix) console.log(`   Fix: ${bug.fix}`);
      console.log();
    });
  }

  if (high.length > 0) {
    console.log('🔴 HIGH SEVERITY BUGS (Fix Soon)');
    console.log('-'.repeat(80));
    high.forEach((bug, i) => {
      console.log(`${i + 1}. ${bug.method} ${bug.endpoint}`);
      console.log(`   Issue: ${bug.issue}`);
      if (bug.details) console.log(`   Details: ${bug.details}`);
      console.log();
    });
  }

  if (medium.length > 0) {
    console.log('🟡 MEDIUM SEVERITY BUGS (Review & Fix)');
    console.log('-'.repeat(80));
    medium.forEach((bug, i) => {
      console.log(`${i + 1}. ${bug.method} ${bug.endpoint}`);
      console.log(`   Issue: ${bug.issue}`);
      if (bug.details) console.log(`   Details: ${bug.details}`);
      console.log();
    });
  }

  if (low.length > 0) {
    console.log('⚠️  LOW SEVERITY BUGS (Minor Issues)');
    console.log('-'.repeat(80));
    low.forEach((bug, i) => {
      console.log(`${i + 1}. ${bug.method} ${bug.endpoint} - ${bug.issue}`);
    });
    console.log();
  }

  console.log('✅ PASSING ENDPOINTS');
  console.log('-'.repeat(80));
  console.log(`${passed.length} endpoints working correctly\n`);

  console.log('='.repeat(80));
  console.log('                        END OF REPORT');
  console.log('='.repeat(80));
}

runFullTestSuite().then(generateReport).catch(console.error);
