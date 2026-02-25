/**
 * Business Dashboard API Routes
 * 
 * Provides dashboard endpoints for business accounts
 */

import { Router } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Helper: get business account for the authenticated user
async function getBusinessForUser(userId: string) {
  return storage.getBusinessAccountByUser(userId);
}

// GET /api/business/team - Get team for current user's business
router.get("/team", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const business = await getBusinessForUser(userId);
    if (!business) {
      return res.json([]);
    }

    const teamMembers = await storage.getTeamMembersByBusiness(business.id);
    res.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
});

// GET /api/business/billing - Get billing overview
router.get("/billing", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const business = await getBusinessForUser(userId);
    if (!business) {
      return res.json({
        currentBalance: 0,
        upcomingCharges: 0,
        paymentMethods: [],
        recentTransactions: [],
        billingPeriod: "monthly"
      });
    }

    const jobs = await storage.getServiceRequestsByCustomer(userId);
    const completedJobs = jobs.filter(j => j.status === "completed");
    const recentTransactions = completedJobs
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""))
      .slice(0, 10)
      .map(j => ({
        id: j.id,
        serviceType: j.serviceType,
        amount: j.finalPrice || j.livePrice || j.priceEstimate || 0,
        date: j.completedAt || j.createdAt,
        status: j.paymentStatus,
      }));

    const pendingJobs = jobs.filter(j => j.paymentStatus === "pending" && j.status !== "cancelled");
    const upcomingCharges = pendingJobs.reduce((sum, j) => sum + (j.livePrice || j.priceEstimate || 0), 0);

    res.json({
      currentBalance: business.totalSpent || 0,
      upcomingCharges,
      paymentMethods: business.paymentMethodId ? [{ id: business.paymentMethodId, type: "card" }] : [],
      recentTransactions,
      billingPeriod: business.billingFrequency || "monthly",
    });
  } catch (error) {
    console.error("Error fetching billing data:", error);
    res.status(500).json({ error: "Failed to fetch billing data" });
  }
});

// GET /api/business/booking - Get booking overview
router.get("/booking", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const business = await getBusinessForUser(userId);
    const jobs = await storage.getServiceRequestsByCustomer(userId);

    const now = new Date().toISOString();
    const upcomingBookings = jobs
      .filter(j => j.scheduledFor > now && j.status !== "completed" && j.status !== "cancelled")
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));

    const recentBookings = jobs
      .filter(j => j.status === "completed")
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""))
      .slice(0, 10);

    const recurringJobs = business
      ? await storage.getRecurringJobsByBusinessAccount(business.id)
      : [];

    res.json({
      upcomingBookings,
      recentBookings,
      bookingSettings: {
        invoicingEnabled: business?.invoicingEnabled || false,
        netPaymentTerms: business?.netPaymentTerms || 0,
      },
      availableServices: recurringJobs,
    });
  } catch (error) {
    console.error("Error fetching booking data:", error);
    res.status(500).json({ error: "Failed to fetch booking data" });
  }
});

// GET /api/business/dashboard
router.get("/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const business = await getBusinessForUser(userId);
    const jobs = await storage.getServiceRequestsByCustomer(userId);

    const activeJobs = jobs.filter(j => ["accepted", "in_progress", "started", "en_route"].includes(j.status));
    const completedJobs = jobs.filter(j => j.status === "completed");
    const totalSpent = completedJobs.reduce((sum, j) => sum + (j.finalPrice || j.livePrice || 0), 0);

    const teamMembers = business ? await storage.getTeamMembersByBusiness(business.id) : [];
    const properties = business ? await storage.getHoaPropertiesByBusinessAccount(business.id) : [];

    const upcomingJobs = jobs
      .filter(j => j.scheduledFor > new Date().toISOString() && j.status !== "completed" && j.status !== "cancelled")
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
      .slice(0, 5);

    const recentActivity = jobs
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .slice(0, 10)
      .map(j => ({
        id: j.id,
        type: j.status,
        serviceType: j.serviceType,
        date: j.completedAt || j.createdAt,
      }));

    res.json({
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
      totalSpent,
      teamMembers: teamMembers.length,
      properties: properties.length,
      upcomingJobs,
      recentActivity,
      esgMetrics: {
        carbonSaved: business?.carbonCreditsGenerated || 0,
        wasteReduced: completedJobs.reduce((sum, j) => sum + (j.disposalRecycledPercent || 0) + (j.disposalDonatedPercent || 0), 0),
        esgScore: business?.carbonCreditBalance || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching business dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// GET /api/business/jobs
router.get("/jobs", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const jobs = await storage.getServiceRequestsByCustomer(userId);
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching business jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /api/business/analytics
router.get("/analytics", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const jobs = await storage.getServiceRequestsByCustomer(userId);
    const completedJobs = jobs.filter(j => j.status === "completed");
    const totalSpending = completedJobs.reduce((sum, j) => sum + (j.finalPrice || j.livePrice || 0), 0);
    const averageJobCost = completedJobs.length > 0 ? totalSpending / completedJobs.length : 0;

    // Count jobs per month for frequency
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const recentJobs = completedJobs.filter(j => new Date(j.createdAt) >= sixMonthsAgo);
    const jobFrequency = recentJobs.length > 0 ? recentJobs.length / 6 : 0;

    // Service type breakdown
    const serviceCount: Record<string, number> = {};
    completedJobs.forEach(j => {
      serviceCount[j.serviceType] = (serviceCount[j.serviceType] || 0) + 1;
    });
    const preferredServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .map(([service, count]) => ({ service, count }));

    // Monthly trends
    const monthlyTrends: { month: string; spending: number; jobs: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      const monthJobs = completedJobs.filter(j => (j.completedAt || j.createdAt).startsWith(monthStr));
      monthlyTrends.push({
        month: monthStr,
        spending: monthJobs.reduce((s, j) => s + (j.finalPrice || j.livePrice || 0), 0),
        jobs: monthJobs.length,
      });
    }

    res.json({
      totalSpending,
      averageJobCost,
      jobFrequency,
      preferredServices,
      monthlyTrends,
      costSavings: completedJobs.reduce((sum, j) => sum + (j.promotionDiscountAmount || 0), 0),
    });
  } catch (error) {
    console.error("Error fetching business analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/business/invoices
router.get("/invoices", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const jobs = await storage.getServiceRequestsByCustomer(userId);
    const invoices = jobs
      .filter(j => j.status === "completed" && j.paymentStatus)
      .map(j => ({
        id: j.id,
        serviceType: j.serviceType,
        amount: j.finalPrice || j.livePrice || j.priceEstimate || 0,
        date: j.completedAt || j.createdAt,
        paymentStatus: j.paymentStatus,
        stripePaymentIntentId: j.stripePaymentIntentId,
      }))
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching business invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET /api/business/esg
router.get("/esg", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const business = await getBusinessForUser(userId);
    if (!business) {
      return res.json({
        carbonFootprint: 0,
        wasteReduction: 0,
        sustainabilityScore: 0,
        greenCertifications: [],
        impactMetrics: [],
      });
    }

    const esgReports = await storage.getEsgReportsByBusiness(business.id);
    const jobs = await storage.getServiceRequestsByCustomer(userId);
    const completedJobs = jobs.filter(j => j.status === "completed");

    const wasteReduction = completedJobs.reduce(
      (sum, j) => sum + (j.disposalRecycledPercent || 0) + (j.disposalDonatedPercent || 0), 0
    );

    res.json({
      carbonFootprint: business.carbonCreditsGenerated || 0,
      wasteReduction,
      sustainabilityScore: business.carbonCreditBalance || 0,
      greenCertifications: esgReports,
      impactMetrics: completedJobs
        .filter(j => j.environmentalCertificateId)
        .map(j => ({
          jobId: j.id,
          recycledPercent: j.disposalRecycledPercent || 0,
          donatedPercent: j.disposalDonatedPercent || 0,
          landfilledPercent: j.disposalLandfilledPercent || 0,
        })),
    });
  } catch (error) {
    console.error("Error fetching business ESG data:", error);
    res.status(500).json({ error: "Failed to fetch ESG data" });
  }
});

// GET /api/business/service-requests
router.get("/service-requests", requireAuth, async (req: any, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const requests = await storage.getServiceRequestsByCustomer(userId);
    res.json(requests);
  } catch (error) {
    console.error("Error fetching business service requests:", error);
    res.status(500).json({ error: "Failed to fetch service requests" });
  }
});

export default router;
