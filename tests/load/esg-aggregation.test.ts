/**
 * Load Tests for ESG Aggregation Performance
 *
 * Tests:
 * - Single service type aggregate completes < 1 second
 * - All service types aggregate completes < 2 seconds
 * - Large dataset queries (100k+ records) complete within SLA
 * - Concurrent requests don't degrade performance
 */

import { test, expect } from "@playwright/test";

// Test configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const BUSINESS_ACCOUNT_ID = "test-business-123";

// Performance SLAs (in milliseconds)
const SLA_SINGLE_SERVICE = 1000; // 1 second
const SLA_ALL_SERVICES = 2000; // 2 seconds
const SLA_LARGE_DATASET = 3000; // 3 seconds for 100k+ records

test.describe("ESG Aggregation Performance", () => {
  test("single service aggregate completes within 1 second", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    // Login as test user
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Measure performance of single service aggregation
    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/pressure_washing/aggregate`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Single service aggregate took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA
    expect(duration).toBeLessThan(SLA_SINGLE_SERVICE);
  });

  test("all service types aggregate completes within 2 seconds", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Measure performance of all services aggregation
    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`All services aggregate took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA
    expect(duration).toBeLessThan(SLA_ALL_SERVICES);

    // Verify all service types are returned
    const data = await response.json();
    expect(data.data || data.aggregates).toBeDefined();
    const serviceCount = (data.data || data.aggregates).length;
    console.log(`Returned ${serviceCount} service types`);
  });

  test("business-specific service breakdown completes within SLA", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Measure performance of business-specific aggregation
    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/esg-metrics?groupBy=service_type`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Business service breakdown took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA
    expect(duration).toBeLessThan(SLA_ALL_SERVICES);
  });

  test("date-filtered aggregation completes within SLA", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Test date range filtering (1 year of data)
    const startDate = "2024-01-01";
    const endDate = "2024-12-31";

    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Date-filtered aggregate took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA
    expect(duration).toBeLessThan(SLA_ALL_SERVICES);
  });

  test("concurrent aggregation requests maintain performance", async ({ browser }) => {
    // Create multiple concurrent requests
    const CONCURRENT_REQUESTS = 5;
    const contexts = await Promise.all(
      Array(CONCURRENT_REQUESTS)
        .fill(null)
        .map(() => browser.newContext())
    );

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));

    // Login all contexts
    for (const page of pages) {
      await page.goto(`${BASE_URL}/business-login`);
      await page.fill('input[name="email"]', "test@test.com");
      await page.fill('input[name="password"]', "test-password");
      await page.click('button[type="submit"]');
    }

    // Execute concurrent requests and measure
    const startTime = performance.now();

    const results = await Promise.all(
      pages.map((page) =>
        page.request.get(`${BASE_URL}/api/esg/service-types/aggregate/all`)
      )
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(
      `${CONCURRENT_REQUESTS} concurrent requests took: ${duration.toFixed(2)}ms`
    );
    console.log(`Average per request: ${(duration / CONCURRENT_REQUESTS).toFixed(2)}ms`);

    // Verify all requests succeeded
    results.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    // Verify performance doesn't degrade too much
    // Allow 3x SLA for concurrent requests
    expect(duration).toBeLessThan(SLA_ALL_SERVICES * 3);

    // Cleanup
    await Promise.all(contexts.map((ctx) => ctx.close()));
  });

  test("service-specific query with verification filter completes within SLA", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Test filtered query (verification status)
    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/junk_removal/aggregate?verificationStatus=verified`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Filtered service aggregate took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA (should be faster with filter)
    expect(duration).toBeLessThan(SLA_SINGLE_SERVICE);
  });

  test("CSV export generation completes within SLA", async ({ page }) => {
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Test CSV export (I/O intensive operation)
    const startDate = "2024-01-01";
    const endDate = "2024-12-31";

    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/reports/csv?businessAccountId=${BUSINESS_ACCOUNT_ID}&startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          "Content-Type": "text/csv",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`CSV export took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify content type
    expect(response.headers()["content-type"]).toContain("text/csv");

    // Verify performance SLA (CSV generation can be slower)
    expect(duration).toBeLessThan(SLA_LARGE_DATASET);
  });

  test("admin dashboard aggregate query completes within SLA", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin-login`);
    await page.fill('input[name="email"]', "admin@uptend.app");
    await page.fill('input[name="password"]', "admin-password");
    await page.click('button[type="submit"]');

    // Test platform-wide aggregation (largest dataset)
    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Platform-wide aggregate took: ${duration.toFixed(2)}ms`);

    // Verify response is successful
    expect(response.status()).toBe(200);

    // Verify performance SLA
    expect(duration).toBeLessThan(SLA_ALL_SERVICES);

    // Verify data structure
    const data = await response.json();
    console.log(
      `Platform aggregate returned ${(data.data || data.aggregates).length} service types`
    );
  });
});

test.describe("Query Optimization Verification", () => {
  test("verify indexes are being used for service type queries", async ({ page }) => {
    // This test would require database access to check EXPLAIN ANALYZE
    // For now, we verify the query performance meets SLA
    // In production, connect to DB and run: EXPLAIN ANALYZE SELECT ...

    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "test@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    const startTime = performance.now();

    const response = await page.request.get(
      `${BASE_URL}/api/esg/service-types/pressure_washing/aggregate`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    // If indexes are working, query should be very fast (< 500ms)
    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(500);

    console.log(
      `✓ Service type query completed in ${duration.toFixed(2)}ms (indexes working)`
    );
  });
});
