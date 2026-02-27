import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";
import { stripeService } from "../../stripeService";

export function registerCustomerAccountRoutes(app: Express) {
  // Get customer profile
  app.get("/api/customers/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Return profile data (excluding sensitive fields)
      const profile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Get customer dashboard data
  app.get("/api/customers/dashboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get recent service requests
      const recentRequests = await storage.getServiceRequestsByCustomer(userId);
      
      // Get customer stats
      const totalRequests = await storage.getServiceRequestsByCustomer(userId); // get count
      
      const dashboardData = {
        recentRequests: recentRequests || [],
        totalRequests: Array.isArray(totalRequests) ? totalRequests.length : 0,
        upcomingJobs: [], // TODO: Implement when job scheduling is ready
        notifications: [], // TODO: Implement notifications
        esgImpact: {
          carbonSaved: 0,
          wasteReduced: 0,
          esgScore: 0
        }
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching customer dashboard:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  // Get customer notifications
  app.get("/api/customers/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // TODO: Implement notifications system
      const notifications: any[] = [];

      res.json(notifications);
    } catch (error) {
      console.error("Error fetching customer notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get customer history
  app.get("/api/customers/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const history = await storage.getServiceRequestsByCustomer(userId);
      res.json(history || []);
    } catch (error) {
      console.error("Error fetching customer history:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Get customer jobs (active/ongoing jobs)
  app.get("/api/customers/jobs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get active jobs for this customer
      const jobs = await storage.getServiceRequestsByCustomer(userId);
      res.json(jobs || []);
    } catch (error) {
      console.error("Error fetching customer jobs:", error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
  // Setup payment method for customer
  app.post("/api/customers/setup-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email || '',
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer',
          userId
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId });
      }

      // Create setup intent for collecting payment method
      const setupIntent = await stripeService.createSetupIntent(stripeCustomerId);

      res.json({
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId,
      });
    } catch (error) {
      console.error("Payment setup error:", error);
      res.status(500).json({ error: "Failed to setup payment" });
    }
  });

  // Check if customer has payment method on file
  app.get("/api/customers/payment-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify actual attached payment method via Stripe
      let hasPaymentMethod = false;
      if (user.stripeCustomerId) {
        try {
          const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
          hasPaymentMethod = paymentMethods.data.length > 0;
        } catch (error) {
          console.error("Error checking Stripe payment methods:", error);
          // Return error if Stripe check fails - don't assume payment method exists
          hasPaymentMethod = false;
        }
      }

      res.json({ hasPaymentMethod, stripeCustomerId: user.stripeCustomerId });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // Confirm payment setup completed
  app.post("/api/customers/confirm-payment-setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { paymentMethodId, stripeCustomerId } = req.body;

      if (!paymentMethodId || !stripeCustomerId) {
        return res.status(400).json({ error: "Missing payment method details" });
      }

      // Attach the payment method to customer
      await stripeService.attachPaymentMethod(stripeCustomerId, paymentMethodId);

      // Update user with stripe customer ID if not already set
      await storage.updateUser(userId, { stripeCustomerId });

      res.json({
        success: true,
        message: "Payment method saved successfully. You won't be charged until you confirm a booking."
      });
    } catch (error) {
      console.error("Confirm payment setup error:", error);
      res.status(500).json({ error: "Failed to confirm payment setup" });
    }
  });

  // Update customer profile
  app.patch("/api/customers/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { firstName, lastName, phone } = req.body;
      await storage.updateUser(userId, { firstName, lastName, phone });

      res.json({ success: true, message: "Profile updated" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Get customer addresses
  app.get("/api/customers/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const addresses = await storage.getCustomerAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Get addresses error:", error);
      res.status(500).json({ error: "Failed to get addresses" });
    }
  });

  // Add customer address
  app.post("/api/customers/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { label, street, city, state, zipCode, lat, lng } = req.body;
      const address = await storage.createCustomerAddress({
        userId,
        label,
        street,
        city,
        state,
        zipCode,
        lat,
        lng,
      });

      res.json(address);
    } catch (error) {
      console.error("Create address error:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Update customer address
  app.patch("/api/customers/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      const { label, street, city, state, zipCode, lat, lng } = req.body;

      const address = await storage.updateCustomerAddress(id, userId, {
        label,
        street,
        city,
        state,
        zipCode,
        lat,
        lng,
      });

      res.json(address);
    } catch (error) {
      console.error("Update address error:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  // Delete customer address
  app.delete("/api/customers/addresses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      await storage.deleteCustomerAddress(id, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete address error:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  // Set default address
  app.post("/api/customers/addresses/:id/set-default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { id } = req.params;
      await storage.setDefaultCustomerAddress(id, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Set default address error:", error);
      res.status(500).json({ error: "Failed to set default address" });
    }
  });

  // Get customer payment methods
  app.get("/api/customers/payment-methods", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.json([]);
      }

      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const defaultPaymentMethod = await stripeService.getDefaultPaymentMethod(user.stripeCustomerId);

      const methods = paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand || "unknown",
        last4: pm.card?.last4 || "****",
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethod,
      }));

      res.json(methods);
    } catch (error) {
      console.error("Get payment methods error:", error);
      res.status(500).json({ error: "Failed to get payment methods" });
    }
  });

  // Delete payment method
  app.delete("/api/customers/payment-methods/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const { id } = req.params;

      // Verify ownership - check that this payment method belongs to this customer
      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const ownsMethod = paymentMethods.data.some(pm => pm.id === id);
      if (!ownsMethod) {
        return res.status(403).json({ error: "Payment method not found" });
      }

      await stripeService.detachPaymentMethod(id);

      res.json({ success: true });
    } catch (error) {
      console.error("Delete payment method error:", error);
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });

  // Set default payment method
  app.post("/api/customers/payment-methods/:id/set-default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const { id } = req.params;

      // Verify ownership - check that this payment method belongs to this customer
      const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
      const ownsMethod = paymentMethods.data.some(pm => pm.id === id);
      if (!ownsMethod) {
        return res.status(403).json({ error: "Payment method not found" });
      }

      await stripeService.setDefaultPaymentMethod(user.stripeCustomerId, id);

      res.json({ success: true });
    } catch (error) {
      console.error("Set default payment method error:", error);
      res.status(500).json({ error: "Failed to set default payment method" });
    }
  });

  // GET /api/customer/recent-services - last 5 completed services for claims section
  app.get("/api/customer/recent-services", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const jobs = await storage.getServiceRequestsByCustomer(userId);
      const recent = jobs
        .filter((j: any) => j.status === "completed")
        .sort((a: any, b: any) => new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime())
        .slice(0, 5);
      res.json(recent);
    } catch (error) {
      console.error("Recent services error:", error);
      res.json([]);
    }
  });
}
