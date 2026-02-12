/**
 * AI Capabilities Storage Layer
 *
 * Provides database operations for all AI-powered features including:
 * - AI Concierge & Chat
 * - Photo-to-Quote
 * - Seasonal Advisor
 * - Smart Scheduling
 * - Move-In Wizard
 * - Document Scanner
 * - Route Optimizer
 * - Quality Scoring
 * - Inventory Estimator
 * - Portfolio Dashboard
 * - Fraud Detection
 * - Marketing Content
 * - Voice Booking
 * - Neighborhood Intelligence
 */

import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../../../db";
import {
  aiConversations,
  aiConversationMessages,
  photoQuoteRequests,
  seasonalAdvisories,
  smartScheduleSuggestions,
  moveInPlans,
  documentScans,
  proRouteOptimizations,
  proQualityScores,
  jobQualityAssessments,
  inventoryEstimates,
  portfolioHealthReports,
  fraudAlerts,
  aiMarketingContent,
  voiceBookingSessions,
  neighborhoodIntelligenceReports,
  type AiConversation,
  type AiConversationMessage,
  type PhotoQuoteRequest,
  type SeasonalAdvisory,
  type SmartScheduleSuggestion,
  type MoveInPlan,
  type DocumentScan,
  type ProRouteOptimization,
  type ProQualityScore,
  type JobQualityAssessment,
  type InventoryEstimate,
  type PortfolioHealthReport,
  type FraudAlert,
  type AiMarketingContent,
  type VoiceBookingSession,
  type NeighborhoodIntelligenceReport,
  type InsertAiConversation,
  type InsertAiConversationMessage,
  type InsertPhotoQuoteRequest,
  type InsertSeasonalAdvisory,
  type InsertSmartScheduleSuggestion,
  type InsertMoveInPlan,
  type InsertDocumentScan,
  type InsertProRouteOptimization,
  type InsertProQualityScore,
  type InsertJobQualityAssessment,
  type InsertInventoryEstimate,
  type InsertPortfolioHealthReport,
  type InsertFraudAlert,
  type InsertAiMarketingContent,
  type InsertVoiceBookingSession,
  type InsertNeighborhoodIntelligenceReport,
} from "../../../../shared/schema";

export class AiCapabilitiesStorage {
  // ==========================================
  // AI Concierge & Chat Assistant
  // ==========================================

  async createConversation(data: InsertAiConversation): Promise<AiConversation> {
    const [conversation] = await db.insert(aiConversations).values(data).returning();
    return conversation;
  }

  async getConversation(id: string): Promise<AiConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id));
    return conversation;
  }

  async getActiveConversationsByUser(userId: string): Promise<AiConversation[]> {
    return db
      .select()
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.userId, userId),
          eq(aiConversations.status, "active")
        )
      )
      .orderBy(desc(aiConversations.updatedAt));
  }

  async updateConversation(id: string, updates: Partial<AiConversation>): Promise<AiConversation> {
    const [conversation] = await db
      .update(aiConversations)
      .set(updates)
      .where(eq(aiConversations.id, id))
      .returning();
    return conversation;
  }

  async createMessage(data: InsertAiConversationMessage): Promise<AiConversationMessage> {
    const [message] = await db.insert(aiConversationMessages).values(data).returning();
    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<AiConversationMessage[]> {
    return db
      .select()
      .from(aiConversationMessages)
      .where(eq(aiConversationMessages.conversationId, conversationId))
      .orderBy(aiConversationMessages.createdAt);
  }

  // ==========================================
  // AI Photo-to-Quote
  // ==========================================

  async createPhotoQuoteRequest(data: InsertPhotoQuoteRequest): Promise<PhotoQuoteRequest> {
    const [request] = await db.insert(photoQuoteRequests).values(data).returning();
    return request;
  }

  async getPhotoQuoteRequest(id: string): Promise<PhotoQuoteRequest | undefined> {
    const [request] = await db
      .select()
      .from(photoQuoteRequests)
      .where(eq(photoQuoteRequests.id, id));
    return request;
  }

  async getPhotoQuoteRequestsByUser(userId: string): Promise<PhotoQuoteRequest[]> {
    return db
      .select()
      .from(photoQuoteRequests)
      .where(eq(photoQuoteRequests.userId, userId))
      .orderBy(desc(photoQuoteRequests.createdAt));
  }

  async updatePhotoQuoteRequest(
    id: string,
    updates: Partial<PhotoQuoteRequest>
  ): Promise<PhotoQuoteRequest> {
    const [request] = await db
      .update(photoQuoteRequests)
      .set(updates)
      .where(eq(photoQuoteRequests.id, id))
      .returning();
    return request;
  }

  // ==========================================
  // AI Seasonal Home Advisor
  // ==========================================

  async createSeasonalAdvisory(data: InsertSeasonalAdvisory): Promise<SeasonalAdvisory> {
    const [advisory] = await db.insert(seasonalAdvisories).values(data).returning();
    return advisory;
  }

  async getActiveAdvisoriesByZip(zipCode: string): Promise<SeasonalAdvisory[]> {
    const now = new Date().toISOString();
    return db
      .select()
      .from(seasonalAdvisories)
      .where(
        and(
          eq(seasonalAdvisories.zipCode, zipCode),
          sql`${seasonalAdvisories.expiresAt} IS NULL OR ${seasonalAdvisories.expiresAt} >= ${now}`
        )
      )
      .orderBy(desc(seasonalAdvisories.createdAt));
  }

  async getAdvisoriesByUser(userId: string): Promise<SeasonalAdvisory[]> {
    return db
      .select()
      .from(seasonalAdvisories)
      .where(eq(seasonalAdvisories.userId, userId))
      .orderBy(desc(seasonalAdvisories.createdAt));
  }

  // ==========================================
  // AI Smart Scheduling
  // ==========================================

  async createScheduleSuggestion(data: InsertSmartScheduleSuggestion): Promise<SmartScheduleSuggestion> {
    const [suggestion] = await db.insert(smartScheduleSuggestions).values(data).returning();
    return suggestion;
  }

  async getActiveSuggestionsByUser(userId: string): Promise<SmartScheduleSuggestion[]> {
    return db
      .select()
      .from(smartScheduleSuggestions)
      .where(
        and(
          eq(smartScheduleSuggestions.userId, userId),
          eq(smartScheduleSuggestions.status, "suggested")
        )
      )
      .orderBy(desc(smartScheduleSuggestions.createdAt));
  }

  async updateScheduleSuggestion(
    id: string,
    updates: Partial<SmartScheduleSuggestion>
  ): Promise<SmartScheduleSuggestion> {
    const [suggestion] = await db
      .update(smartScheduleSuggestions)
      .set(updates)
      .where(eq(smartScheduleSuggestions.id, id))
      .returning();
    return suggestion;
  }

  // ==========================================
  // AI Move-In Wizard
  // ==========================================

  async createMoveInPlan(data: InsertMoveInPlan): Promise<MoveInPlan> {
    const [plan] = await db.insert(moveInPlans).values(data).returning();
    return plan;
  }

  async getMoveInPlan(id: string): Promise<MoveInPlan | undefined> {
    const [plan] = await db
      .select()
      .from(moveInPlans)
      .where(eq(moveInPlans.id, id));
    return plan;
  }

  async getMoveInPlansByUser(userId: string): Promise<MoveInPlan[]> {
    return db
      .select()
      .from(moveInPlans)
      .where(eq(moveInPlans.userId, userId))
      .orderBy(desc(moveInPlans.createdAt));
  }

  async updateMoveInPlan(id: string, updates: Partial<MoveInPlan>): Promise<MoveInPlan> {
    const [plan] = await db
      .update(moveInPlans)
      .set(updates)
      .where(eq(moveInPlans.id, id))
      .returning();
    return plan;
  }

  // ==========================================
  // AI Receipt & Document Scanner
  // ==========================================

  async createDocumentScan(data: InsertDocumentScan): Promise<DocumentScan> {
    const [scan] = await db.insert(documentScans).values(data).returning();
    return scan;
  }

  async getDocumentScan(id: string): Promise<DocumentScan | undefined> {
    const [scan] = await db
      .select()
      .from(documentScans)
      .where(eq(documentScans.id, id));
    return scan;
  }

  async getDocumentScansByUser(userId: string): Promise<DocumentScan[]> {
    return db
      .select()
      .from(documentScans)
      .where(eq(documentScans.userId, userId))
      .orderBy(desc(documentScans.createdAt));
  }

  async getDocumentScansByProperty(propertyId: string): Promise<DocumentScan[]> {
    return db
      .select()
      .from(documentScans)
      .where(eq(documentScans.propertyId, propertyId))
      .orderBy(desc(documentScans.createdAt));
  }

  async updateDocumentScan(id: string, updates: Partial<DocumentScan>): Promise<DocumentScan> {
    const [scan] = await db
      .update(documentScans)
      .set(updates)
      .where(eq(documentScans.id, id))
      .returning();
    return scan;
  }

  // ==========================================
  // AI Route Optimizer
  // ==========================================

  async createRouteOptimization(data: InsertProRouteOptimization): Promise<ProRouteOptimization> {
    const [optimization] = await db.insert(proRouteOptimizations).values(data).returning();
    return optimization;
  }

  async getRouteOptimization(id: string): Promise<ProRouteOptimization | undefined> {
    const [optimization] = await db
      .select()
      .from(proRouteOptimizations)
      .where(eq(proRouteOptimizations.id, id));
    return optimization;
  }

  async getRouteOptimizationsByHauler(
    haulerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProRouteOptimization[]> {
    const conditions = [eq(proRouteOptimizations.proUserId, haulerId)];

    if (startDate && endDate) {
      conditions.push(gte(proRouteOptimizations.routeDate, startDate));
      conditions.push(lte(proRouteOptimizations.routeDate, endDate));
    }

    return db
      .select()
      .from(proRouteOptimizations)
      .where(and(...conditions))
      .orderBy(desc(proRouteOptimizations.createdAt));
  }

  async updateRouteOptimization(
    id: string,
    updates: Partial<ProRouteOptimization>
  ): Promise<ProRouteOptimization> {
    const [optimization] = await db
      .update(proRouteOptimizations)
      .set(updates)
      .where(eq(proRouteOptimizations.id, id))
      .returning();
    return optimization;
  }

  async getRouteOptimizationStats(haulerId: string): Promise<{
    totalOptimizations: number;
    totalDistanceSaved: number;
    totalTimeSaved: number;
    totalFuelSaved: number;
    totalCo2Saved: number;
  }> {
    const [stats] = await db
      .select({
        totalOptimizations: sql<number>`count(*)`,
        totalDistanceSaved: sql<number>`sum(${proRouteOptimizations.milesSaved})`,
        totalTimeSaved: sql<number>`sum(${proRouteOptimizations.estimatedTimeSavedMinutes})`,
        totalFuelSaved: sql<number>`0`,
        totalCo2Saved: sql<number>`sum(${proRouteOptimizations.co2Saved})`,
      })
      .from(proRouteOptimizations)
      .where(
        and(
          eq(proRouteOptimizations.proUserId, haulerId),
          eq(proRouteOptimizations.proAccepted, true)
        )
      );

    return stats || {
      totalOptimizations: 0,
      totalDistanceSaved: 0,
      totalTimeSaved: 0,
      totalFuelSaved: 0,
      totalCo2Saved: 0,
    };
  }

  // ==========================================
  // AI Training & Quality Scoring
  // ==========================================

  async createQualityScore(data: InsertProQualityScore): Promise<ProQualityScore> {
    const [score] = await db.insert(proQualityScores).values(data).returning();
    return score;
  }

  async getLatestQualityScore(haulerId: string): Promise<ProQualityScore | undefined> {
    const [score] = await db
      .select()
      .from(proQualityScores)
      .where(eq(proQualityScores.proUserId, haulerId))
      .orderBy(desc(proQualityScores.lastUpdated))
      .limit(1);
    return score;
  }

  async getQualityScoreHistory(
    haulerId: string,
    limit: number = 12
  ): Promise<ProQualityScore[]> {
    return db
      .select()
      .from(proQualityScores)
      .where(eq(proQualityScores.proUserId, haulerId))
      .orderBy(desc(proQualityScores.lastUpdated))
      .limit(limit);
  }

  async createJobQualityAssessment(data: InsertJobQualityAssessment): Promise<JobQualityAssessment> {
    const [assessment] = await db.insert(jobQualityAssessments).values(data).returning();
    return assessment;
  }

  async getJobQualityAssessment(serviceRequestId: string): Promise<JobQualityAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(jobQualityAssessments)
      .where(eq(jobQualityAssessments.serviceRequestId, serviceRequestId));
    return assessment;
  }

  async getJobQualityAssessmentsByHauler(haulerId: string): Promise<JobQualityAssessment[]> {
    return db
      .select()
      .from(jobQualityAssessments)
      .where(eq(jobQualityAssessments.proUserId, haulerId))
      .orderBy(desc(jobQualityAssessments.createdAt));
  }

  // ==========================================
  // AI Inventory Estimator
  // ==========================================

  async createInventoryEstimate(data: InsertInventoryEstimate): Promise<InventoryEstimate> {
    const [estimate] = await db.insert(inventoryEstimates).values(data).returning();
    return estimate;
  }

  async getInventoryEstimate(id: string): Promise<InventoryEstimate | undefined> {
    const [estimate] = await db
      .select()
      .from(inventoryEstimates)
      .where(eq(inventoryEstimates.id, id));
    return estimate;
  }

  async getInventoryEstimateByServiceRequest(
    serviceRequestId: string
  ): Promise<InventoryEstimate | undefined> {
    const [estimate] = await db
      .select()
      .from(inventoryEstimates)
      .where(eq(inventoryEstimates.serviceRequestId, serviceRequestId));
    return estimate;
  }

  async updateInventoryEstimate(
    id: string,
    updates: Partial<InventoryEstimate>
  ): Promise<InventoryEstimate> {
    const [estimate] = await db
      .update(inventoryEstimates)
      .set(updates)
      .where(eq(inventoryEstimates.id, id))
      .returning();
    return estimate;
  }

  // ==========================================
  // AI Property Manager Portfolio Dashboard
  // ==========================================

  async createPortfolioHealthReport(data: InsertPortfolioHealthReport): Promise<PortfolioHealthReport> {
    const [report] = await db.insert(portfolioHealthReports).values(data).returning();
    return report;
  }

  async getLatestPortfolioHealthReport(
    businessAccountId: string
  ): Promise<PortfolioHealthReport | undefined> {
    const [report] = await db
      .select()
      .from(portfolioHealthReports)
      .where(eq(portfolioHealthReports.businessAccountId, businessAccountId))
      .orderBy(desc(portfolioHealthReports.createdAt))
      .limit(1);
    return report;
  }

  async getPortfolioHealthReportHistory(
    businessAccountId: string,
    limit: number = 12
  ): Promise<PortfolioHealthReport[]> {
    return db
      .select()
      .from(portfolioHealthReports)
      .where(eq(portfolioHealthReports.businessAccountId, businessAccountId))
      .orderBy(desc(portfolioHealthReports.createdAt))
      .limit(limit);
  }

  // ==========================================
  // AI Fraud & Quality Detection
  // ==========================================

  async createFraudAlert(data: InsertFraudAlert): Promise<FraudAlert> {
    const [alert] = await db.insert(fraudAlerts).values(data).returning();
    return alert;
  }

  async getFraudAlert(id: string): Promise<FraudAlert | undefined> {
    const [alert] = await db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.id, id));
    return alert;
  }

  async getPendingFraudAlerts(): Promise<FraudAlert[]> {
    return db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.status, "pending"))
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async getFraudAlertsByHauler(haulerId: string): Promise<FraudAlert[]> {
    return db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.proUserId, haulerId))
      .orderBy(desc(fraudAlerts.createdAt));
  }

  async updateFraudAlert(id: string, updates: Partial<FraudAlert>): Promise<FraudAlert> {
    const [alert] = await db
      .update(fraudAlerts)
      .set(updates)
      .where(eq(fraudAlerts.id, id))
      .returning();
    return alert;
  }

  // ==========================================
  // AI-Generated Marketing Content
  // ==========================================

  async createMarketingContent(data: InsertAiMarketingContent): Promise<AiMarketingContent> {
    const [content] = await db.insert(aiMarketingContent).values(data).returning();
    return content;
  }

  async getMarketingContent(id: string): Promise<AiMarketingContent | undefined> {
    const [content] = await db
      .select()
      .from(aiMarketingContent)
      .where(eq(aiMarketingContent.id, id));
    return content;
  }

  async getMarketingContentByType(
    contentType: string,
    status?: string
  ): Promise<AiMarketingContent[]> {
    const conditions = [eq(aiMarketingContent.serviceType, contentType)];
    if (status) {
      conditions.push(eq(aiMarketingContent.status, status));
    }

    return db
      .select()
      .from(aiMarketingContent)
      .where(and(...conditions))
      .orderBy(desc(aiMarketingContent.createdAt));
  }

  async updateMarketingContent(
    id: string,
    updates: Partial<AiMarketingContent>
  ): Promise<AiMarketingContent> {
    const [content] = await db
      .update(aiMarketingContent)
      .set(updates)
      .where(eq(aiMarketingContent.id, id))
      .returning();
    return content;
  }

  // ==========================================
  // AI Voice Assistant for Booking
  // ==========================================

  async createVoiceBookingSession(data: InsertVoiceBookingSession): Promise<VoiceBookingSession> {
    const [session] = await db.insert(voiceBookingSessions).values(data).returning();
    return session;
  }

  async getVoiceBookingSession(id: string): Promise<VoiceBookingSession | undefined> {
    const [session] = await db
      .select()
      .from(voiceBookingSessions)
      .where(eq(voiceBookingSessions.id, id));
    return session;
  }

  async getVoiceBookingSessionsByUser(userId: string): Promise<VoiceBookingSession[]> {
    return db
      .select()
      .from(voiceBookingSessions)
      .where(eq(voiceBookingSessions.userId, userId))
      .orderBy(desc(voiceBookingSessions.createdAt));
  }

  async updateVoiceBookingSession(
    id: string,
    updates: Partial<VoiceBookingSession>
  ): Promise<VoiceBookingSession> {
    const [session] = await db
      .update(voiceBookingSessions)
      .set(updates)
      .where(eq(voiceBookingSessions.id, id))
      .returning();
    return session;
  }

  // ==========================================
  // AI Neighborhood Intelligence
  // ==========================================

  async createNeighborhoodIntelligence(
    data: InsertNeighborhoodIntelligenceReport
  ): Promise<NeighborhoodIntelligenceReport> {
    const [report] = await db.insert(neighborhoodIntelligenceReports).values(data).returning();
    return report;
  }

  async getLatestNeighborhoodIntelligence(
    zipCode: string
  ): Promise<NeighborhoodIntelligenceReport | undefined> {
    try {
      const [report] = await db
        .select()
        .from(neighborhoodIntelligenceReports)
        .where(eq(neighborhoodIntelligenceReports.zipCode, zipCode))
        .orderBy(desc(neighborhoodIntelligenceReports.createdAt))
        .limit(1);
      return report;
    } catch (error) {
      console.error("Error querying neighborhood intelligence:", error);
      return undefined;
    }
  }

  async getNeighborhoodIntelligenceHistory(
    zipCode: string,
    limit: number = 6
  ): Promise<NeighborhoodIntelligenceReport[]> {
    return db
      .select()
      .from(neighborhoodIntelligenceReports)
      .where(eq(neighborhoodIntelligenceReports.zipCode, zipCode))
      .orderBy(desc(neighborhoodIntelligenceReports.createdAt))
      .limit(limit);
  }
}
