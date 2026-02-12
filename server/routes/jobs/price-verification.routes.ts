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

// In-memory storage (replace with database in production)
const verifications: Map<string, VerificationResult> = new Map();
const approvalRequests: Map<string, CustomerApprovalRequest> = new Map();
const verificationLogs: Map<string, any> = new Map();

export function registerPriceVerificationRoutes(app: Express) {

/**
 * POST /api/jobs/:jobId/verify-price
 * Pro submits on-site verification with photos and adjusted inputs
 */
app.post("/api/jobs/:jobId/verify-price", async (req: Request, res: Response) => {
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

    // If requires approval, create approval request
    if (verification.requiresApproval) {
      // TODO: Fetch customer info from database using jobId
      const customer = {
        id: req.body.customerId || "unknown",
        name: req.body.customerName || "Customer",
        phone: req.body.customerPhone || "",
      };

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

      // TODO: Send SMS to customer
      const proName = req.body.proName || "Your Pro"; // TODO: fetch from DB
      const smsMessage = generateApprovalSmsMessage(verification, customer.name, proName);
      console.log("SMS to customer:", smsMessage);

      // TODO: Schedule timeout job (30 minutes)
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

    // Auto-approved
    // TODO: Notify Pro to start work
    console.log("Auto-approved, notifying Pro to start work");

    // TODO: Notify customer of price adjustment
    const customer = { name: req.body.customerName || "Customer" };
    const proName = req.body.proName || "Your Pro"; // TODO: fetch from DB
    const smsMessage = generateApprovalSmsMessage(verification, customer.name, proName);
    console.log("SMS to customer:", smsMessage);

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
app.post("/api/jobs/:jobId/price-verification/:verificationId/approve", async (req: Request, res: Response) => {
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

    // TODO: Notify Pro to start work
    console.log("Customer approved, notifying Pro to start work");

    // TODO: Send confirmation SMS to customer
    console.log("Sending confirmation SMS to customer");

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
app.post("/api/jobs/:jobId/price-verification/:verificationId/decline", async (req: Request, res: Response) => {
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

    // TODO: Release Pro (cancel job assignment)
    console.log("Customer declined, releasing Pro");

    // TODO: Send reschedule options to customer
    console.log("Sending reschedule options to customer");

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
app.post("/api/jobs/:jobId/price-verification/:verificationId/timeout", async (req: Request, res: Response) => {
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

    // TODO: Release Pro
    console.log("Approval timeout, releasing Pro");

    // TODO: Send reschedule notification to customer
    console.log("Sending reschedule notification to customer");

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

      // TODO: Release Pro and send customer reschedule notification
      console.log("Timeout job executed:", result.message);
    }
  } catch (error) {
    console.error("Error in timeout job:", error);
  }
}

}
