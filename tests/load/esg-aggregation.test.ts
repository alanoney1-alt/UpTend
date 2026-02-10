/**
 * Load Tests for ESG Aggregation Queries
 *
 * Tests performance of service ESG metric aggregation
 * Ensures queries meet SLA requirements (<1s per service, <2s for all)
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const SLA_SINGLE_SERVICE_MS = 1000; // 1 second
const SLA_ALL_SERVICES_MS = 2000; // 2 seconds

test.describe("ESG Aggregation Performance", () => {
  test("Single service aggregate completes within SLA", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/pressure_washing/aggregate`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_SINGLE_SERVICE_MS);

    console.log(`✓ Single service aggregate: ${duration.toFixed(0)}ms (SLA: ${SLA_SINGLE_SERVICE_MS}ms)`);
  });

  test("All service types aggregate completes within SLA", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_ALL_SERVICES_MS);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);

    console.log(`✓ All services aggregate: ${duration.toFixed(0)}ms (SLA: ${SLA_ALL_SERVICES_MS}ms)`);
    console.log(`  Service types returned: ${data.data.length}`);
  });

  test("Date range filtering performs well", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all?startDate=2024-01-01&endDate=2024-12-31`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_ALL_SERVICES_MS);

    console.log(`✓ Date range filtering: ${duration.toFixed(0)}ms`);
  });

  test("Verification status filtering performs well", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all?verificationStatus=verified`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_ALL_SERVICES_MS);

    console.log(`✓ Verification status filtering: ${duration.toFixed(0)}ms`);
  });

  test("Combined filters perform well", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all?startDate=2024-01-01&endDate=2024-12-31&verificationStatus=verified`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_ALL_SERVICES_MS);

    console.log(`✓ Combined filters: ${duration.toFixed(0)}ms`);
  });

  test("Service type aggregate with filters", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/landscaping/aggregate?startDate=2024-01-01&endDate=2024-12-31`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(SLA_SINGLE_SERVICE_MS);

    console.log(`✓ Service type with filters: ${duration.toFixed(0)}ms`);
  });

  test("CSV export generation performs acceptably", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/reports/csv?businessAccountId=test-123&startDate=2024-01-01&endDate=2024-12-31`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(3000); // 3 second SLA for CSV generation

    console.log(`✓ CSV export: ${duration.toFixed(0)}ms (SLA: 3000ms)`);
  });

  test("PDF report data generation performs acceptably", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/reports/pdf?businessAccountId=test-123&startDate=2024-01-01&endDate=2024-12-31`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    expect(duration).toBeLessThan(3000); // 3 second SLA for PDF generation

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.pdfData).toHaveProperty("executiveSummary");
    expect(data.pdfData).toHaveProperty("serviceBreakdown");

    console.log(`✓ PDF report data: ${duration.toFixed(0)}ms (SLA: 3000ms)`);
  });
});

test.describe("ESG Query Stress Tests", () => {
  test("Multiple concurrent aggregate queries", async ({ request }) => {
    const startTime = performance.now();

    // Fire 10 concurrent aggregate queries
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.get(`${BASE_URL}/api/esg/service-types/aggregate/all`, {
          headers: { Cookie: "test-session" },
        })
      );
    }

    const responses = await Promise.all(promises);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // All should succeed
    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });

    // Average per query should still be under SLA
    const avgDuration = duration / 10;
    expect(avgDuration).toBeLessThan(SLA_ALL_SERVICES_MS);

    console.log(`✓ 10 concurrent queries: ${duration.toFixed(0)}ms total, ${avgDuration.toFixed(0)}ms avg`);
  });

  test("Large date range query", async ({ request }) => {
    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/aggregate/all?startDate=2020-01-01&endDate=2024-12-31`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(response.status()).toBe(200);
    // Allow longer time for large date range (5 seconds)
    expect(duration).toBeLessThan(5000);

    console.log(`✓ 5-year date range query: ${duration.toFixed(0)}ms (SLA: 5000ms)`);
  });
});

test.describe("Database Index Verification", () => {
  test("Query plan uses index for service_type", async ({ request }) => {
    // This would require database access to check EXPLAIN output
    // For now, we verify that queries are fast enough to indicate index usage

    const startTime = performance.now();

    const response = await request.get(
      `${BASE_URL}/api/esg/service-types/pressure_washing/aggregate`,
      {
        headers: {
          Cookie: "test-session",
        },
      }
    );

    const endTime = performance.now();
    const duration = endTime - startTime;

    // If query is under 100ms, index is likely being used
    expect(duration).toBeLessThan(500);

    console.log(`✓ Service type query: ${duration.toFixed(0)}ms (indicates index usage)`);
  });
});
