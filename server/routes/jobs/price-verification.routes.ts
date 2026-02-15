/**
 * On-Site Verification API Routes
 *
 * Endpoints:
 * POST /api/jobs/:jobId/verify-price - Pro submits verification
 * GET /api/jobs/:jobId/verification - Get verification status
 * POST /api/jobs/:jobId/verification/:verificationId/approve - Customer approves
 * POST /api/jobs/:jobId/verification/:verificationId/decline - Customer declines
 * POST /api/jobs/:jobId/verification/:verificationId/timeout - Handle timeout
 */

import type { Express, Request, Response } from "express";
import { requireAuth } from "../../auth-middleware";
import {
  verifyJobPrice,
  generateApprovalSmsMessage,
  isApprovalExpired,
  processCustomerApproval,
  handleApprovalTimeout,
  createVerificationLog,
  type VerificationInput,
  type VerificationResult,
  type CustomerApprovalRequest,
} from "../../services/verification";
import { storage } from "../../storage";
import { sendSms } from "../../services/notifications";

// In-memory storage (replace with database in production)
const verifications: Map<string, VerificationResult> = new Map();
const approvalRequests: Map<string, CustomerApprovalRequest> = new Map();
const verificationLogs: Map<string, any> = new Map();

export function registerPriceVerificationRoutes(app: Express) {

/**
 * POST /api/jobs/:jobId/verify-price
 * Pro submits on-site verification with photos and adjusted inputs
 */
app.post("/api/jobs/:jobId/verify-price", requireAuth, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { proId, originalQuote, verifiedServiceInputs, verificationPhotos, proNotes } = req.body;

    if (!jobId || !proId || !originalQuote || !verifiedServiceInputs) {
      return res.status(400).json({
        error: "Missing required fields: jobId, proId, originalQuote, verifiedServiceInputs",
      });
    }

    const input: VerificationInput = {
      jobId,
      proId,
      originalQuote,
      verifiedServiceInputs,
      verificationPhotos: verificationPhotos || [],
      proNotes,
    };

    // Run verification logic
    const verification = verifyJobPrice(input);

    // Store verification result
    verifications.set(verification.verificationId, verification);

    // Fetch job details to get customer and pro info
    const job = await storage.getServiceRequest(jobId);
    const customerUser = job ? await storage.getUser(job.customerId) : null;
    const proUser = job?.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;

    const customer = {
      id: customerUser?.id || req.body.customerId || "unknown",
      name: customerUser?.fullName || req.body.customerName || "Customer",
      phone: customerUser?.phone || req.body.customerPhone || "",
    };
    const proName = proUser?.fullName || req.body.proName || "Your Pro";

    // If requires approval, create approval request
    if (verification.requiresApproval) {
      const approvalRequest: CustomerApprovalRequest = {
        verificationId: verification.verificationId,
        jobId,
        customerId: customer.id,
        customerPhone: customer.phone,
        originalPrice: verification.originalPrice,
        verifiedPrice: verification.verifiedPrice,
        priceDifference: verification.priceDifference,
        percentageDifference: verification.percentageDifference,
        reason: verification.reason,
        approvalDeadline: verification.expiresAt,
        status: "pending",
      };

      approvalRequests.set(verification.verificationId, approvalRequest);

      // Send SMS to customer
      const smsMessage = generateApprovalSmsMessage(verification, customer.name, proName);
      if (customer.phone) {
        await sendSms({ to: customer.phone, message: smsMessage }).catch(err =>
          console.error("Failed to send approval SMS:", err)
        );
      } else {
        console.warn("No customer phone for SMS, verification:", verification.verificationId);
      }

      // Schedule timeout (30 minutes) - Note: in production use a persistent job queue
      setTimeout(() => {
        handleTimeoutJob(verification.verificationId);
      }, 30 * 60 * 1000);

      return res.status(200).json({
        success: true,
        verification,
        requiresApproval: true,
        approvalRequest,
        message: "Customer approval required. SMS sent.",
      });
    }

    // Auto-approved - notify customer of price adjustment via SMS
    const smsMessage = generateApprovalSmsMessage(verification, customer.name, proName);
    if (customer.phone) {
      await sendSms({ to: customer.phone, message: smsMessage }).catch(err =>
        console.error("Failed to send auto-approval SMS:", err)
      );
    }

    return res.status(200).json({
      success: true,
      verification,
      requiresApproval: false,
      autoApproved: true,
      message: "Price adjustment auto-approved. Pro can start work.",
    });
  } catch (error) {
    console.error("Error in verify-price:", error);
    return res.status(500).json({
      error: "Internal server error during price verification",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/jobs/:jobId/price-verification
 * Get current price verification status for a job
 */
app.get("/api/jobs/:jobId/price-verification", async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Find verification by jobId
    const verification = Array.from(verifications.values()).find(v => v.jobId === jobId);

    if (!verification) {
      return res.status(404).json({
        error: "No verification found for this job",
      });
    }

    // Check if approval request exists
    const approvalRequest = approvalRequests.get(verification.verificationId);

    return res.status(200).json({
      success: true,
      verification,
      approvalRequest: approvalRequest || null,
    });
  } catch (error) {
    console.error("Error in get verification:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/jobs/:jobId/price-verification/:verificationId/approve
 * Customer approves price adjustment
 */
app.post("/api/jobs/:jobId/price-verification/:verificationId/approve", requireAuth, async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;

    const approvalRequest = approvalRequests.get(verificationId);
    if (!approvalRequest) {
      return res.status(404).json({
        error: "Approval request not found",
      });
    }

    // Check if expired
    if (isApprovalExpired(approvalRequest)) {
      return res.status(410).json({
        error: "Approval request has expired (30 minutes elapsed)",
        nextAction: "reschedule",
      });
    }

    // Check if already responded
    if (approvalRequest.status !== "pending") {
      return res.status(400).json({
        error: `Approval request already ${approvalRequest.status}`,
      });
    }

    // Process approval
    const result = processCustomerApproval(verificationId, true);

    // Update approval request
    approvalRequest.status = "approved";
    approvalRequest.respondedAt = new Date();

    // Create log
    const verification = verifications.get(verificationId);
    if (verification) {
      const input: any = {}; // TODO: Retrieve original input from database
      const log = createVerificationLog(verification, input, {
        approved: true,
        respondedAt: approvalRequest.respondedAt,
      });
      verificationLogs.set(verificationId, log);
    }

    // Notify pro and customer via SMS
    const job = await storage.getServiceRequest(approvalRequest.jobId);
    if (job) {
      const proUser = job.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;
      const customerUser = await storage.getUser(job.customerId);
      if (proUser?.phone) {
        await sendSms({ to: proUser.phone, message: `Price approved for job ${approvalRequest.jobId}. You can start work now.` }).catch(err => console.error("SMS to pro failed:", err));
      }
      if (customerUser?.phone) {
        await sendSms({ to: customerUser.phone, message: `You approved the updated price of $${approvalRequest.verifiedPrice?.toFixed(2)}. Your pro will begin shortly.` }).catch(err => console.error("SMS to customer failed:", err));
      }
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      nextAction: result.nextAction,
      approvalRequest,
    });
  } catch (error) {
    console.error("Error in approve:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/jobs/:jobId/price-verification/:verificationId/decline
 * Customer declines price adjustment
 */
app.post("/api/jobs/:jobId/price-verification/:verificationId/decline", requireAuth, async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;

    const approvalRequest = approvalRequests.get(verificationId);
    if (!approvalRequest) {
      return res.status(404).json({
        error: "Approval request not found",
      });
    }

    // Check if already responded
    if (approvalRequest.status !== "pending") {
      return res.status(400).json({
        error: `Approval request already ${approvalRequest.status}`,
      });
    }

    // Process decline
    const result = processCustomerApproval(verificationId, false);

    // Update approval request
    approvalRequest.status = "declined";
    approvalRequest.respondedAt = new Date();

    // Create log
    const verification = verifications.get(verificationId);
    if (verification) {
      const input: any = {}; // TODO: Retrieve original input from database
      const log = createVerificationLog(verification, input, {
        approved: false,
        respondedAt: approvalRequest.respondedAt,
      });
      verificationLogs.set(verificationId, log);
    }

    // Notify pro of decline and send reschedule info to customer
    const job = await storage.getServiceRequest(approvalRequest.jobId);
    if (job) {
      const proUser = job.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;
      const customerUser = await storage.getUser(job.customerId);
      if (proUser?.phone) {
        await sendSms({ to: proUser.phone, message: `Customer declined the updated price for job ${approvalRequest.jobId}. You have been released from this job.` }).catch(err => console.error("SMS to pro failed:", err));
      }
      if (customerUser?.phone) {
        await sendSms({ to: customerUser.phone, message: `You declined the updated price. You can reschedule this job at any time through the app.` }).catch(err => console.error("SMS to customer failed:", err));
      }
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      nextAction: result.nextAction,
      approvalRequest,
    });
  } catch (error) {
    console.error("Error in decline:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/jobs/:jobId/price-verification/:verificationId/timeout
 * Handle approval timeout (called by scheduled job after 30 minutes)
 */
app.post("/api/jobs/:jobId/price-verification/:verificationId/timeout", requireAuth, async (req: Request, res: Response) => {
  try {
    const { verificationId } = req.params;

    const approvalRequest = approvalRequests.get(verificationId);
    if (!approvalRequest) {
      return res.status(404).json({
        error: "Approval request not found",
      });
    }

    // Check if already responded
    if (approvalRequest.status !== "pending") {
      return res.status(400).json({
        error: `Approval request already ${approvalRequest.status}`,
      });
    }

    // Process timeout
    const result = handleApprovalTimeout(verificationId);

    // Update approval request
    approvalRequest.status = "expired";

    // Notify pro of release and customer of timeout
    const job = await storage.getServiceRequest(approvalRequest.jobId);
    if (job) {
      const proUser = job.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;
      const customerUser = await storage.getUser(job.customerId);
      if (proUser?.phone) {
        await sendSms({ to: proUser.phone, message: `Approval timed out for job ${approvalRequest.jobId}. You have been released.` }).catch(err => console.error("SMS to pro failed:", err));
      }
      if (customerUser?.phone) {
        await sendSms({ to: customerUser.phone, message: `Your approval window has expired. Please reschedule through the app.` }).catch(err => console.error("SMS to customer failed:", err));
      }
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      nextAction: result.nextAction,
      approvalRequest,
    });
  } catch (error) {
    console.error("Error in timeout:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Helper: Handle timeout job (called by setTimeout)
 */
async function handleTimeoutJob(verificationId: string) {
  try {
    const approvalRequest = approvalRequests.get(verificationId);
    if (!approvalRequest) {
      console.error("Approval request not found for timeout:", verificationId);
      return;
    }

    // Only process if still pending
    if (approvalRequest.status === "pending") {
      const result = handleApprovalTimeout(verificationId);
      approvalRequest.status = "expired";

      console.log("Timeout job executed:", result.message);
      // Send notifications
      const job = await storage.getServiceRequest(approvalRequest.jobId);
      if (job) {
        const proUser = job.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;
        const customerUser = await storage.getUser(job.customerId);
        if (proUser?.phone) {
          await sendSms({ to: proUser.phone, message: `Approval timed out for job ${approvalRequest.jobId}. You have been released.` }).catch(err => console.error("Timeout SMS to pro failed:", err));
        }
        if (customerUser?.phone) {
          await sendSms({ to: customerUser.phone, message: `Your approval window has expired. Please reschedule through the app.` }).catch(err => console.error("Timeout SMS to customer failed:", err));
        }
      }
    }
  } catch (error) {
    console.error("Error in timeout job:", error);
  }
}

}
