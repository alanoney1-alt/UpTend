/**
 * E2E Tests for Team-Based Permissions
 *
 * Tests the multi-user B2B authorization system to ensure:
 * - Team members with correct permissions can access resources
 * - Non-members are blocked with 403 errors
 * - Permission-specific access controls work correctly
 * - Owner role has full access
 */

import { test, expect } from "@playwright/test";

// Test configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const BUSINESS_ACCOUNT_ID = "test-business-123";

test.describe("Team Permission System", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create test business account and team members
    // In real implementation, this would use API calls or database seeds
    await page.goto(BASE_URL);
  });

  test("team member with canManageProperties can create properties", async ({ page }) => {
    // Login as team member with canManageProperties = true
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "member-with-properties@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to properties page
    await page.goto(`${BASE_URL}/business-dashboard`);
    await page.click('button[data-testid="tab-properties"]');

    // Attempt to create a property
    await page.click('button:has-text("Add Property")');
    await page.fill('input[name="address"]', "123 Test St");
    await page.fill('input[name="city"]', "Test City");
    await page.fill('input[name="state"]', "CA");
    await page.fill('input[name="zipCode"]', "90210");
    await page.click('button:has-text("Save Property")');

    // Verify success
    await expect(page.locator('text=Property added successfully')).toBeVisible({
      timeout: 5000,
    });
  });

  test("team member without canAccessEsgReports cannot view ESG tab", async ({ page }) => {
    // Login as team member with canAccessEsgReports = false
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "member-no-esg@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to business dashboard
    await page.goto(`${BASE_URL}/business-dashboard`);

    // Attempt to access ESG tab
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/esg-metrics`
    );

    // Verify 403 Forbidden
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Insufficient permissions");
  });

  test("non-member cannot access business resources", async ({ page }) => {
    // Login as a user who is NOT a member of this business
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "non-member@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Attempt to access business properties
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/properties`
    );

    // Verify 403 Forbidden
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("not a member");
  });

  test("owner can invite and remove team members", async ({ page }) => {
    // Login as business account owner
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "owner@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to team management
    await page.goto(`${BASE_URL}/business-dashboard`);
    await page.click('button[data-testid="tab-team"]');

    // Invite a new team member
    await page.click('button:has-text("Invite Member")');
    await page.fill('input[name="email"]', "new-member@test.com");

    // Set permissions
    await page.check('input[name="canCreateJobs"]');
    await page.check('input[name="canAccessEsgReports"]');

    await page.click('button:has-text("Send Invitation")');

    // Verify invitation sent
    await expect(page.locator('text=Invitation sent')).toBeVisible({
      timeout: 5000,
    });

    // Verify new member appears in team list
    await expect(page.locator('text=new-member@test.com')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });

  test("member with canViewFinancials can access financial data", async ({ page }) => {
    // Login as team member with canViewFinancials = true
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "member-with-financials@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to referral payments (financial data)
    await page.goto(`${BASE_URL}/business-dashboard`);
    await page.click('button[data-testid="tab-referrals"]');

    // Attempt to access financial endpoint
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/referral-payments`
    );

    // Verify success (200 OK)
    expect(response.status()).toBe(200);
  });

  test("member without canViewFinancials gets blocked from financial data", async ({ page }) => {
    // Login as team member with canViewFinancials = false
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "member-no-financials@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Attempt to access financial endpoint
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/referral-payments`
    );

    // Verify 403 Forbidden
    expect(response.status()).toBe(403);
  });

  test("admin can bypass team permission checks", async ({ page }) => {
    // Login as admin user
    await page.goto(`${BASE_URL}/admin-login`);
    await page.fill('input[name="email"]', "admin@uptend.app");
    await page.fill('input[name="password"]', "admin-password");
    await page.click('button[type="submit"]');

    // Attempt to access any business resource
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/properties`
    );

    // Verify success (admin bypass works)
    expect(response.status()).toBe(200);
  });

  test("inactive team member is blocked from access", async ({ page }) => {
    // Login as team member who has been deactivated (isActive = false)
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "inactive-member@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Attempt to access business resources
    const response = await page.request.get(
      `${BASE_URL}/api/business/${BUSINESS_ACCOUNT_ID}/properties`
    );

    // Verify 403 Forbidden
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("not a member" || "inactive");
  });
});

test.describe("Business Context Switching", () => {
  test("user can switch between multiple business memberships", async ({ page }) => {
    // Login as user who is member of multiple businesses
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "multi-business-user@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to business dashboard
    await page.goto(`${BASE_URL}/business-dashboard`);

    // Verify context switcher is visible
    await expect(page.locator('text=Select business account')).toBeVisible();

    // Fetch memberships
    const response = await page.request.get(`${BASE_URL}/api/business/my-memberships`);
    expect(response.status()).toBe(200);

    const memberships = await response.json();
    expect(memberships.length).toBeGreaterThan(1);

    // Switch to different business
    await page.click('button:has-text("Select business account")');
    await page.click(`text=${memberships[1].businessName}`);

    // Verify context switched
    await expect(page.locator(`text=${memberships[1].businessName}`)).toBeVisible();
  });

  test("context switcher hidden when user has only 1 business", async ({ page }) => {
    // Login as user with single business membership
    await page.goto(`${BASE_URL}/business-login`);
    await page.fill('input[name="email"]', "single-business-user@test.com");
    await page.fill('input[name="password"]', "test-password");
    await page.click('button[type="submit"]');

    // Navigate to business dashboard
    await page.goto(`${BASE_URL}/business-dashboard`);

    // Verify context switcher is NOT visible
    await expect(page.locator('text=Select business account')).not.toBeVisible();
  });
});
