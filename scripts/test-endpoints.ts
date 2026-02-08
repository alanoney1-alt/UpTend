#!/usr/bin/env tsx
/**
 * Comprehensive API Endpoint Testing Script
 * Tests every route and reports bugs by severity
 */

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
  response?: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
}

const results: TestResult[] = [];

async function testEndpoint(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    let severity: TestResult['severity'] = 'OK';
    let error: string | undefined;

    // Determine severity
    if (response.status === 500) {
      severity = 'CRITICAL';
      error = 'Server Error (500)';
    } else if (response.status === 404 && !path.includes(':')) {
      // 404 on non-parameterized routes is HIGH
      severity = 'HIGH';
      error = 'Not Found (404)';
    } else if (response.status === 401 || response.status === 403) {
      severity = 'LOW'; // Expected for auth-protected routes
      error = 'Auth Required';
    } else if (response.status >= 400) {
      severity = 'MEDIUM';
      error = `Client Error (${response.status})`;
    }

    return {
      endpoint: path,
      method,
      status: response.status,
      success: response.status < 400,
      error,
      response: data,
      severity,
    };
  } catch (err: any) {
    return {
      endpoint: path,
      method,
      status: 0,
      success: false,
      error: `Network Error: ${err.message}`,
      severity: 'CRITICAL',
    };
  }
}

async function runTests() {
  console.log('🧪 Starting Comprehensive API Testing...\n');

  // PUBLIC ENDPOINTS (should work without auth)
  console.log('📋 Testing Public Endpoints...');

  // Health/Status
  results.push(await testEndpoint('GET', '/'));
  results.push(await testEndpoint('GET', '/api/health'));

  // Stripe
  results.push(await testEndpoint('GET', '/api/stripe/publishable-key'));

  // Pricing
  results.push(await testEndpoint('POST', '/api/pricing/quote', {
    serviceType: 'junk_removal',
    loadSize: 'quarter_load',
  }));
  results.push(await testEndpoint('GET', '/api/pricing/supported-zips'));
  results.push(await testEndpoint('GET', '/api/pricing/dump-distance/32801'));

  // Facilities
  results.push(await testEndpoint('GET', '/api/facilities'));
  results.push(await testEndpoint('GET', '/api/facilities/test-id'));

  // Service Requests
  results.push(await testEndpoint('GET', '/api/service-requests/pending'));

  // Promo Codes
  results.push(await testEndpoint('POST', '/api/promo-codes/validate', { code: 'TEST' }));
  results.push(await testEndpoint('GET', '/api/promo-codes/TEST'));

  // Analytics
  results.push(await testEndpoint('POST', '/api/analytics/track', {
    event: 'page_view',
    page: '/test',
  }));
  results.push(await testEndpoint('GET', '/api/analytics/funnel'));

  // AUTH ENDPOINTS
  console.log('🔐 Testing Auth Endpoints...');

  // Customer Auth
  results.push(await testEndpoint('POST', '/api/customers/register', {
    email: 'test@test.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
  }));
  results.push(await testEndpoint('POST', '/api/customers/login', {
    email: 'test@test.com',
    password: 'wrongpass',
  }));
  results.push(await testEndpoint('POST', '/api/customers/logout'));

  // Hauler Auth
  results.push(await testEndpoint('POST', '/api/haulers/check-username', {
    username: 'testuser',
  }));
  results.push(await testEndpoint('POST', '/api/haulers/send-verification', {
    phone: '1234567890',
  }));
  results.push(await testEndpoint('POST', '/api/haulers/verify-email', {
    phone: '1234567890',
    code: '123456',
  }));
  results.push(await testEndpoint('POST', '/api/haulers/login', {
    username: 'testuser',
    password: 'testpass',
  }));
  results.push(await testEndpoint('POST', '/api/haulers/logout'));

  // Admin Auth
  results.push(await testEndpoint('POST', '/api/admin/login', {
    password: 'wrongpass',
  }));
  results.push(await testEndpoint('GET', '/api/admin/check'));
  results.push(await testEndpoint('POST', '/api/admin/logout'));

  // PROTECTED ENDPOINTS (should return 401)
  console.log('🔒 Testing Protected Endpoints (should return 401)...');

  // Customer routes
  results.push(await testEndpoint('POST', '/api/customers/setup-payment'));
  results.push(await testEndpoint('GET', '/api/customers/payment-status'));
  results.push(await testEndpoint('PATCH', '/api/customers/profile'));
  results.push(await testEndpoint('GET', '/api/customers/addresses'));
  results.push(await testEndpoint('GET', '/api/customers/payment-methods'));
  results.push(await testEndpoint('GET', '/api/my-jobs'));

  // Hauler routes
  results.push(await testEndpoint('GET', '/api/haulers/test-id/profile'));
  results.push(await testEndpoint('PATCH', '/api/hauler/profile'));
  results.push(await testEndpoint('POST', '/api/haulers/go-online'));
  results.push(await testEndpoint('POST', '/api/haulers/go-offline'));
  results.push(await testEndpoint('GET', '/api/haulers/online-status'));

  // Service requests
  results.push(await testEndpoint('POST', '/api/service-requests', {
    serviceType: 'junk_removal',
    loadEstimate: 'quarter_load',
  }));
  results.push(await testEndpoint('GET', '/api/service-requests/test-id'));

  // AI endpoints
  results.push(await testEndpoint('POST', '/api/ai/analyze-photos', {
    photoUrls: ['https://example.com/photo.jpg'],
  }));
  results.push(await testEndpoint('POST', '/api/agentic/triage', {
    photoUrls: ['https://example.com/photo.jpg'],
  }));

  // Payment endpoints
  results.push(await testEndpoint('POST', '/api/payments/create-intent', {
    amount: 10000,
    jobId: 'test-job',
  }));

  // Admin routes
  results.push(await testEndpoint('GET', '/api/admin/jobs'));
  results.push(await testEndpoint('GET', '/api/promo-codes'));

  console.log('\n✅ Testing Complete!\n');
}

function generateReport() {
  const critical = results.filter((r) => r.severity === 'CRITICAL');
  const high = results.filter((r) => r.severity === 'HIGH');
  const medium = results.filter((r) => r.severity === 'MEDIUM');
  const low = results.filter((r) => r.severity === 'LOW');
  const ok = results.filter((r) => r.severity === 'OK');

  console.log('='.repeat(80));
  console.log('                      🐛 BUG REPORT                                 ');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total Endpoints Tested: ${results.length}`);
  console.log(`✅ OK: ${ok.length}`);
  console.log(`⚠️  LOW: ${low.length}`);
  console.log(`🟡 MEDIUM: ${medium.length}`);
  console.log(`🔴 HIGH: ${high.length}`);
  console.log(`💀 CRITICAL: ${critical.length}`);
  console.log();

  if (critical.length > 0) {
    console.log('💀 CRITICAL ISSUES (Server Errors / Network Failures)');
    console.log('-'.repeat(80));
    critical.forEach((r) => {
      console.log(`${r.method} ${r.endpoint}`);
      console.log(`  Status: ${r.status || 'NO RESPONSE'}`);
      console.log(`  Error: ${r.error}`);
      if (r.response) {
        console.log(`  Response: ${JSON.stringify(r.response).slice(0, 200)}`);
      }
      console.log();
    });
  }

  if (high.length > 0) {
    console.log('🔴 HIGH SEVERITY (Missing Routes / Broken Endpoints)');
    console.log('-'.repeat(80));
    high.forEach((r) => {
      console.log(`${r.method} ${r.endpoint}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Error: ${r.error}`);
      console.log();
    });
  }

  if (medium.length > 0) {
    console.log('🟡 MEDIUM SEVERITY (Client Errors / Validation Issues)');
    console.log('-'.repeat(80));
    medium.forEach((r) => {
      console.log(`${r.method} ${r.endpoint}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Error: ${r.error}`);
      if (r.response?.message || r.response?.error) {
        console.log(`  Message: ${r.response.message || r.response.error}`);
      }
      console.log();
    });
  }

  if (low.length > 0) {
    console.log('⚠️  LOW SEVERITY (Expected Auth Failures)');
    console.log('-'.repeat(80));
    console.log(`${low.length} endpoints correctly require authentication`);
    console.log();
  }

  if (ok.length > 0) {
    console.log('✅ WORKING ENDPOINTS');
    console.log('-'.repeat(80));
    ok.forEach((r) => {
      console.log(`${r.method} ${r.endpoint} - ${r.status}`);
    });
    console.log();
  }

  console.log('='.repeat(80));
  console.log('                      END OF REPORT                                ');
  console.log('='.repeat(80));
}

// Run tests
runTests().then(generateReport).catch(console.error);
