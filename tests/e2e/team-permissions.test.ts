/**
 * E2E Tests for Team Permissions
 *
 * Tests multi-user B2B authorization flow:
 * - Team member with permissions can access resources
 * - Team member without permissions gets 403
 * - Non-members get 403
 * - Owners bypass all checks
 */

import { test, expect } from "@playwright/test";

// Test Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const TEST_TIMEOUT = 30000;

test.describe("Team Permissions Authorization", () => {
  let ownerSession: string;
  let memberSession: string;
  let nonMemberSession: string;
  let businessAccountId: string;
  let propertyId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create test business account, users, and team memberships
    // This would typically be done via API endpoints or database seeding

    // Mock IDs for testing (replace with actual setup in real tests)
    businessAccountId = "test-business-123";
    propertyId = "test-property-456";
  });

  test("Owner can create properties without team membership", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/hoa/properties`, {
      headers: {
        Cookie: ownerSession,
        "Content-Type": "application/json",
      },
      data: {
        businessAccountId,
        address: "123 Test St",
        city: "Test City",
        state: "CA",
        zipCode: "90210",
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
  });

  test("Team member with canManageProperties can create properties", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/hoa/properties`, {
      headers: {
        Cookie: memberSession,
        "Content-Type": "application/json",
      },
      data: {
        businessAccountId,
        address: "456 Team Member St",
        city: "Test City",
        state: "CA",
        zipCode: "90210",
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
  });

  test("Team member without canManageProperties gets 403", async ({ request }) => {
    // Create a member with only canAccessEsgReports permission
    const response = await request.post(`${BASE_URL}/api/hoa/properties`, {
      headers: {
        Cookie: memberSession, // Member without canManageProperties
        "Content-Type": "application/json",
      },
      data: {
        businessAccountId,
        address: "789 Unauthorized St",
        city: "Test City",
        state: "CA",
        zipCode: "90210",
      },
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("canManageProperties");
  });

  test("Non-member cannot access business properties", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/properties`,
      {
        headers: {
          Cookie: nonMemberSession,
        },
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("not a member");
  });

  test("Team member with canAccessEsgReports can view ESG metrics", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/esg-metrics`,
      {
        headers: {
          Cookie: memberSession,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("success");
  });

  test("Team member without canAccessEsgReports gets 403 for ESG metrics", async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/esg-metrics`,
      {
        headers: {
          Cookie: memberSession, // Member without canAccessEsgReports
        },
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("canAccessEsgReports");
  });

  test("Admin bypasses all team permission checks", async ({ request }) => {
    // Admin should be able to access any business account
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/properties`,
      {
        headers: {
          Cookie: "admin-session", // Admin user session
        },
      }
    );

    expect(response.status()).toBe(200);
  });

  test("Team member can create violations", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/hoa/violations`, {
      headers: {
        Cookie: memberSession,
        "Content-Type": "application/json",
      },
      data: {
        propertyId,
        violationType: "lawn_maintenance",
        description: "Grass height exceeds 6 inches",
        severity: "low",
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("id");
  });

  test("Inactive team member gets 403", async ({ request }) => {
    // Member who was deactivated
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/properties`,
      {
        headers: {
          Cookie: "inactive-member-session",
        },
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("not a member");
  });

  test("Pending invitation member gets 403", async ({ request }) => {
    // Member with pending invitation (not yet accepted)
    const response = await request.get(
      `${BASE_URL}/api/business/${businessAccountId}/properties`,
      {
        headers: {
          Cookie: "pending-member-session",
        },
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("not a member");
  });
});

test.describe("Team Management Operations", () => {
  test("Owner can invite team members", async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/business/test-business-123/team/invite`,
      {
        headers: {
          Cookie: "owner-session",
          "Content-Type": "application/json",
        },
        data: {
          email: "newmember@test.com",
          role: "member",
          canViewFinancials: false,
          canManageTeam: false,
          canCreateJobs: true,
          canApprovePayments: false,
          canAccessEsgReports: true,
          canManageProperties: true,
        },
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("success", true);
  });

  test("Member with canManageTeam can invite members", async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/business/test-business-123/team/invite`,
      {
        headers: {
          Cookie: "manager-session",
          "Content-Type": "application/json",
        },
        data: {
          email: "another@test.com",
          role: "member",
          canCreateJobs: true,
        },
      }
    );

    expect(response.status()).toBe(200);
  });

  test("Member without canManageTeam cannot invite members", async ({ request }) => {
    const response = await request.post(
      `${BASE_URL}/api/business/test-business-123/team/invite`,
      {
        headers: {
          Cookie: "regular-member-session",
          "Content-Type": "application/json",
        },
        data: {
          email: "unauthorized@test.com",
          role: "member",
        },
      }
    );

    expect(response.status()).toBe(403);
  });

  test("Owner cannot be removed from team", async ({ request }) => {
    const response = await request.delete(
      `${BASE_URL}/api/business/test-business-123/team/owner-user-id`,
      {
        headers: {
          Cookie: "manager-session",
        },
      }
    );

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain("owner");
  });
});
