import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../middleware/auth";
import { requireBusinessTeamAccess } from "../../auth-middleware";

export function registerHoaReferralPaymentRoutes(app: Express) {
  // ==========================================
  // HOA REFERRAL PAYMENT TRACKING
  // ==========================================

  // Get referral payment summary for HOA
  app.get("/api/business/:businessAccountId/referral-payments", requireAuth, requireBusinessTeamAccess("canViewFinancials"), async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Team access already verified by middleware

      // Get all properties for this business account
      const properties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);

      if (properties.length === 0) {
        return res.json({
          totalEarned: 0,
          pendingAmount: 0,
          processingAmount: 0,
          paidAmount: 0,
          totalJobs: 0,
          averageCommission: 0,
          monthlyBreakdown: [],
          propertyBreakdown: [],
          recentPayments: [],
        });
      }

      // Get all referral payments for this business account
      const referralPayments = await storage.getHoaReferralPaymentsByBusinessAccount(businessAccountId);

      // Calculate totals
      let totalEarned = 0;
      let pendingAmount = 0;
      let processingAmount = 0;
      let paidAmount = 0;

      referralPayments.forEach(payment => {
        totalEarned += payment.commissionAmount || 0;

        if (payment.status === "pending") {
          pendingAmount += payment.commissionAmount || 0;
        } else if (payment.status === "processing") {
          processingAmount += payment.commissionAmount || 0;
        } else if (payment.status === "paid") {
          paidAmount += payment.commissionAmount || 0;
        }
      });

      const totalJobs = referralPayments.length;
      const averageCommission = totalJobs > 0 ? totalEarned / totalJobs : 0;

      // Property breakdown
      const propertyMap = new Map();
      properties.forEach(property => {
        propertyMap.set(property.id, {
          propertyId: property.id,
          propertyAddress: property.address,
          jobCount: 0,
          totalCommission: 0,
        });
      });

      referralPayments.forEach(payment => {
        if (propertyMap.has(payment.propertyId)) {
          const prop = propertyMap.get(payment.propertyId);
          prop.jobCount += 1;
          prop.totalCommission += payment.commissionAmount || 0;
        }
      });

      const propertyBreakdown = Array.from(propertyMap.values()).filter(p => p.jobCount > 0);

      // Monthly breakdown (last 6 months)
      const monthlyMap = new Map();
      const months = ['January', 'February', 'March', 'April', 'May', 'June'];

      months.forEach(month => {
        monthlyMap.set(month, {
          month,
          jobCount: 0,
          totalCommission: 0,
          paidCommission: 0,
        });
      });

      referralPayments.forEach(payment => {
        const date = new Date(payment.createdAt);
        const monthName = months[date.getMonth()];

        if (monthlyMap.has(monthName)) {
          const monthData = monthlyMap.get(monthName);
          monthData.jobCount += 1;
          monthData.totalCommission += payment.commissionAmount || 0;
          if (payment.status === "paid") {
            monthData.paidCommission += payment.commissionAmount || 0;
          }
        }
      });

      const monthlyBreakdown = Array.from(monthlyMap.values());

      // Recent payments (last 10)
      const recentPayments = referralPayments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(payment => {
          const property = properties.find(p => p.id === payment.propertyId);
          return {
            id: payment.id,
            propertyId: payment.propertyId,
            propertyAddress: property?.address || "Unknown",
            serviceRequestId: payment.serviceRequestId,
            serviceType: payment.serviceType || "junk_removal",
            jobAmount: payment.jobAmount || 0,
            commissionRate: payment.commissionRate || 0.05,
            commissionAmount: payment.commissionAmount || 0,
            status: payment.status,
            completedAt: payment.createdAt,
            paidAt: payment.paidAt,
          };
        });

      res.json({
        totalEarned,
        pendingAmount,
        processingAmount,
        paidAmount,
        totalJobs,
        averageCommission,
        monthlyBreakdown,
        propertyBreakdown,
        recentPayments,
      });
    } catch (error) {
      console.error("Get referral payments error:", error);
      res.status(500).json({ error: "Failed to fetch referral payments" });
    }
  });

  // Get single referral payment details
  app.get("/api/hoa/referral-payments/:id", requireAuth, async (req, res) => {
    try {
      // TODO: Implement when needed
      res.status(501).json({ error: "Not implemented" });
    } catch (error) {
      console.error("Get referral payment error:", error);
      res.status(500).json({ error: "Failed to fetch referral payment" });
    }
  });
}
