import type {
  User, UpsertUser, CustomerAddress, InsertCustomerAddress,
  HaulerProfile, InsertHaulerProfile,
  PyckerOnlineStatus, InsertPyckerOnlineStatus,
  ServiceRequest, InsertServiceRequest,
  MatchAttempt, InsertMatchAttempt,
  JobCrewAssignment, InsertJobCrewAssignment,
  LocationHistory, InsertLocationHistory,
  PricingRate, InsertPricingRate,
  SurgeModifier, InsertSurgeModifier,
  AiEstimate, InsertAiEstimate,
  HaulerReview, InsertHaulerReview, HaulerReviewWithCustomer,
  HaulerPenalty, InsertHaulerPenalty,
  Referral, InsertReferral,
  BusinessAccount, InsertBusinessAccount,
  RecurringJob, InsertRecurringJob,
  LoyaltyAccount, InsertLoyaltyAccount,
  LoyaltyTransaction, InsertLoyaltyTransaction,
  LoyaltyReward, InsertLoyaltyReward,
  Promotion, InsertPromotion,
  AppPrioritySlot, InsertAppPrioritySlot,
  AnalyticsEvent, InsertAnalyticsEvent,
  PromoCode, InsertPromoCode,
  PromoCodeUsage, InsertPromoCodeUsage,
  PyckerVehicle, InsertPyckerVehicle,
  RebateClaim, InsertRebateClaim,
  ApprovedFacility, InsertApprovedFacility,
  EnvironmentalCertificate, InsertEnvironmentalCertificate,
  JobAdjustment, InsertJobAdjustment,
  JobCompletion, InsertJobCompletion,
  HaulerWithProfile, HaulerWithProfileAndVehicle, ServiceRequestWithDetails,
  PriceQuote, QuoteRequest,
  EsgImpactLog, InsertEsgImpactLog,
  Dispute, InsertDispute,
  WorkerSkill, InsertWorkerSkill,
  AiSafetyAlert, InsertAiSafetyAlert,
  BundlingSuggestion, InsertBundlingSuggestion,
  DemandHeatmapData, InsertDemandHeatmapData,
  TaxCreditClaim, InsertTaxCreditClaim,
  DispatchBatch, InsertDispatchBatch,
  DisposalRecommendation, InsertDisposalRecommendation,
  ComplianceReceipt, InsertComplianceReceipt,
  MileageLog, InsertMileageLog,
  EsgReport, InsertEsgReport,
  PlatformSustainabilityStats,
  AiTriageReport, InsertAiTriageReport,
  DispatchRecommendation, InsertDispatchRecommendation,
  SentimentFlag, InsertSentimentFlag,
  ConflictShieldReport, InsertConflictShieldReport,
  DisposalReceipt, InsertDisposalReceipt,
  HomeInventory, InsertHomeInventory,
  AuditLog, InsertAuditLog,
  PropertyScore, InsertPropertyScore,
  ScoreHistory, InsertScoreHistory,
  Consultation, InsertConsultation,
  DeferredJob, InsertDeferredJob,
  HaulerCertification, InsertHaulerCertification,
  CarbonCredit, InsertCarbonCredit,
  HoaProperty, InsertHoaProperty,
  HoaViolation, InsertHoaViolation,
  HoaReferralPayment, InsertHoaReferralPayment,
  ViolationCommunication, InsertViolationCommunication,
  JobVerification, InsertJobVerification,
  DisposalRecord, InsertDisposalRecord,
  SmsConversation, InsertSmsConversation,
  SmsMessage, InsertSmsMessage,
  CleaningChecklist, InsertCleaningChecklist,
  RecurringSubscription, InsertRecurringSubscription,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserLocation(id: string, lat: number, lng: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;

  getHaulerProfile(userId: string): Promise<HaulerProfile | undefined>;
  getHaulerProfileById(id: string): Promise<HaulerProfile | undefined>;
  getAllHaulerProfiles(): Promise<HaulerProfile[]>;
  createHaulerProfile(profile: InsertHaulerProfile): Promise<HaulerProfile>;
  updateHaulerProfile(id: string, updates: Partial<HaulerProfile>): Promise<HaulerProfile | undefined>;
  getAvailableHaulers(): Promise<HaulerWithProfile[]>;
  getAvailableHaulersWithVehicles(): Promise<HaulerWithProfileAndVehicle[]>;
  getAllHaulers(): Promise<HaulerWithProfile[]>;

  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestWithDetails(id: string): Promise<ServiceRequestWithDetails | undefined>;
  getServiceRequestsByCustomer(customerId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByHauler(haulerId: string): Promise<ServiceRequest[]>;
  getPendingRequests(): Promise<ServiceRequestWithDetails[]>;
  getActiveJobsForHauler(haulerId: string): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  acceptServiceRequest(id: string, haulerId: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;

  getMatchAttempt(id: string): Promise<MatchAttempt | undefined>;
  getMatchAttemptsByRequest(requestId: string): Promise<MatchAttempt[]>;
  getMatchAttemptsByHauler(haulerId: string): Promise<MatchAttempt[]>;
  getPendingMatchesForHauler(haulerId: string): Promise<(MatchAttempt & { request: ServiceRequest })[]>;
  createMatchAttempt(match: InsertMatchAttempt): Promise<MatchAttempt>;
  updateMatchAttempt(id: string, updates: Partial<MatchAttempt>): Promise<MatchAttempt | undefined>;

  // Job crew assignments for multi-Pro jobs
  createJobCrewAssignment(assignment: InsertJobCrewAssignment): Promise<JobCrewAssignment>;
  getJobCrewAssignments(serviceRequestId: string): Promise<JobCrewAssignment[]>;
  getCrewAssignmentsByHauler(haulerId: string): Promise<JobCrewAssignment[]>;
  updateJobCrewAssignment(id: string, updates: Partial<JobCrewAssignment>): Promise<JobCrewAssignment | undefined>;
  getAcceptedCrewCount(serviceRequestId: string): Promise<number>;

  addLocationHistory(location: InsertLocationHistory): Promise<LocationHistory>;
  getLocationHistory(userId: string, jobId?: string): Promise<LocationHistory[]>;
  getLatestLocation(userId: string): Promise<LocationHistory | undefined>;

  getPricingRate(serviceType: string, loadSize: string, vehicleType?: string): Promise<PricingRate | undefined>;
  getAllPricingRates(): Promise<PricingRate[]>;
  createPricingRate(rate: InsertPricingRate): Promise<PricingRate>;

  getCurrentSurgeMultiplier(): Promise<number>;
  getSurgeModifiers(): Promise<SurgeModifier[]>;
  createSurgeModifier(modifier: InsertSurgeModifier): Promise<SurgeModifier>;
  updateSurgeModifier(id: string, updates: Partial<SurgeModifier>): Promise<SurgeModifier | undefined>;
  deleteSurgeModifier(id: string): Promise<void>;
  getHaulerActiveJobs(haulerId: string): Promise<ServiceRequest[]>;

  calculateQuote(request: QuoteRequest): Promise<PriceQuote>;

  createAiEstimate(estimate: InsertAiEstimate): Promise<AiEstimate>;
  getAiEstimate(id: string): Promise<AiEstimate | undefined>;
  getAiEstimateByRequest(requestId: string): Promise<AiEstimate | undefined>;

  createReview(review: InsertHaulerReview): Promise<HaulerReview>;
  getReviewsByHauler(haulerId: string): Promise<HaulerReviewWithCustomer[]>;
  getReviewByServiceRequest(serviceRequestId: string): Promise<HaulerReview | undefined>;
  updateHaulerRating(haulerId: string): Promise<void>;

  getAvailableHaulersByServiceType(serviceType: string): Promise<HaulerWithProfile[]>;
  searchHaulers(filters: {
    serviceType?: string;
    capability?: string;
    laborOnly?: boolean;
    availableOnly?: boolean;
  }): Promise<{ matches: HaulerWithProfile[]; suggestions: HaulerWithProfile[] }>;

  createHaulerPenalty(penalty: InsertHaulerPenalty): Promise<HaulerPenalty>;
  getPenaltiesByHauler(haulerId: string): Promise<HaulerPenalty[]>;
  updateHaulerPenalty(id: string, updates: Partial<HaulerPenalty>): Promise<HaulerPenalty | undefined>;

  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  getReferralsByReferrer(referrerId: string): Promise<Referral[]>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined>;

  createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount>;
  getBusinessAccount(id: string): Promise<BusinessAccount | undefined>;
  getBusinessAccountByUser(userId: string): Promise<BusinessAccount | undefined>;
  updateBusinessAccount(id: string, updates: Partial<BusinessAccount>): Promise<BusinessAccount | undefined>;

  // Carbon Credits
  createCarbonCredit(credit: InsertCarbonCredit): Promise<CarbonCredit>;
  getCarbonCreditsByBusinessAccount(businessAccountId: string): Promise<CarbonCredit[]>;
  getCarbonCreditsByServiceRequest(serviceRequestId: string): Promise<CarbonCredit | undefined>;
  updateCarbonCredit(id: string, updates: Partial<CarbonCredit>): Promise<CarbonCredit | undefined>;

  // HOA Properties
  createHoaProperty(property: InsertHoaProperty): Promise<HoaProperty>;
  getHoaProperty(id: string): Promise<HoaProperty | undefined>;
  getHoaPropertiesByBusinessAccount(businessAccountId: string): Promise<HoaProperty[]>;
  updateHoaProperty(id: string, updates: Partial<HoaProperty>): Promise<HoaProperty | undefined>;

  // HOA Violations
  createHoaViolation(violation: InsertHoaViolation): Promise<HoaViolation>;
  getHoaViolation(id: string): Promise<HoaViolation | undefined>;
  getHoaViolationsByBusinessAccount(businessAccountId: string): Promise<HoaViolation[]>;
  getHoaViolationsByProperty(propertyId: string): Promise<HoaViolation[]>;
  updateHoaViolation(id: string, updates: Partial<HoaViolation>): Promise<HoaViolation | undefined>;

  // HOA Referral Payments
  createHoaReferralPayment(payment: InsertHoaReferralPayment): Promise<HoaReferralPayment>;
  getHoaReferralPaymentsByBusinessAccount(businessAccountId: string): Promise<HoaReferralPayment[]>;
  updateHoaReferralPayment(id: string, updates: Partial<HoaReferralPayment>): Promise<HoaReferralPayment | undefined>;

  // Violation Communications
  createViolationCommunication(communication: InsertViolationCommunication): Promise<ViolationCommunication>;
  getViolationCommunicationsByViolation(violationId: string): Promise<ViolationCommunication[]>;
  updateViolationCommunication(id: string, updates: Partial<ViolationCommunication>): Promise<ViolationCommunication | undefined>;

  // Job Verification
  createJobVerification(verification: InsertJobVerification): Promise<JobVerification>;
  getJobVerification(serviceRequestId: string): Promise<JobVerification | undefined>;
  updateJobVerification(id: string, updates: Partial<JobVerification>): Promise<JobVerification | undefined>;

  // Disposal Records
  createDisposalRecord(record: InsertDisposalRecord): Promise<DisposalRecord>;
  getDisposalRecordsByVerification(verificationId: string): Promise<DisposalRecord[]>;
  getDisposalRecordsByServiceRequest(serviceRequestId: string): Promise<DisposalRecord[]>;
  updateDisposalRecord(id: string, updates: Partial<DisposalRecord>): Promise<DisposalRecord | undefined>;

  createRecurringJob(job: InsertRecurringJob): Promise<RecurringJob>;
  getRecurringJobsByBusinessAccount(businessAccountId: string): Promise<RecurringJob[]>;
  updateRecurringJob(id: string, updates: Partial<RecurringJob>): Promise<RecurringJob | undefined>;
  getActiveRecurringJobs(): Promise<RecurringJob[]>;

  getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | undefined>;
  createLoyaltyAccount(account: InsertLoyaltyAccount): Promise<LoyaltyAccount>;
  updateLoyaltyAccount(id: string, updates: Partial<LoyaltyAccount>): Promise<LoyaltyAccount | undefined>;
  addLoyaltyPoints(userId: string, points: number, description: string, serviceRequestId?: string): Promise<LoyaltyTransaction>;
  redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined>;
  getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;

  getLoyaltyRewards(): Promise<LoyaltyReward[]>;
  getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;

  getSmartMatchedHaulers(request: {
    serviceType: string;
    loadSize: string;
    pickupLat?: number;
    pickupLng?: number;
    isPriority?: boolean;
    preferVerifiedPro?: boolean;
  }): Promise<HaulerWithProfile[]>;

  // Promotions
  hasUsedFirstJobDiscount(userId: string): Promise<boolean>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  getPromotionsByUser(userId: string): Promise<Promotion[]>;

  // Green Guarantee Approved Facilities
  getApprovedFacilities(): Promise<ApprovedFacility[]>;
  getApprovedFacility(id: string): Promise<ApprovedFacility | undefined>;
  findFacilityByName(name: string): Promise<ApprovedFacility | undefined>;
  createApprovedFacility(facility: InsertApprovedFacility): Promise<ApprovedFacility>;
  updateApprovedFacility(id: string, updates: Partial<ApprovedFacility>): Promise<ApprovedFacility | undefined>;

  // Green Guarantee Rebate Claims
  createRebateClaim(claim: InsertRebateClaim): Promise<RebateClaim>;
  getRebateClaimsByHauler(haulerId: string): Promise<RebateClaim[]>;
  getRebateClaimsByStatus(status: string): Promise<RebateClaim[]>;
  getRebateClaim(id: string): Promise<RebateClaim | undefined>;
  updateRebateClaim(id: string, updates: Partial<RebateClaim>): Promise<RebateClaim | undefined>;
  updateRebateClaimAIValidation(id: string, updates: {
    aiValidationStatus: string;
    aiValidationResult?: string;
    aiValidationNotes?: string;
    aiValidatedAt: string;
    aiConfidenceScore?: number;
  }): Promise<RebateClaim | undefined>;
  approveRebateClaim(id: string, reviewerId: string): Promise<RebateClaim | undefined>;
  denyRebateClaim(id: string, reviewerId: string, reason: string): Promise<RebateClaim | undefined>;
  addRebateToBalance(haulerId: string, amount: number): Promise<HaulerProfile | undefined>;
  validateRebateClaim(claim: Partial<InsertRebateClaim>, jobCompletedAt: string, estimatedWeight: number): Promise<{ flags: string[]; withinVariance: boolean; within48Hours: boolean; facilityApproved: boolean; isDuplicate: boolean }>;

  // App priority slots
  isSlotAvailableForApp(slotDate: string, slotTime: string): Promise<boolean>;
  reserveSlotForApp(slotDate: string, slotTime: string, userId: string): Promise<AppPrioritySlot>;
  getAvailablePrioritySlots(date: string): Promise<AppPrioritySlot[]>;

  // Check if user is first-time customer
  isFirstTimeCustomer(userId: string): Promise<boolean>;

  // Calculate quote with promotions
  calculateQuoteWithPromotions(request: QuoteRequest & { userId?: string; bookingSource?: string }): Promise<PriceQuote & { firstJobDiscount?: number; hasPriorityAccess?: boolean }>;

  // Pycker vehicles
  createPyckerVehicle(vehicle: InsertPyckerVehicle): Promise<PyckerVehicle>;
  getPyckerVehicles(haulerProfileId: string): Promise<PyckerVehicle[]>;
  getPyckerVehicle(id: string): Promise<PyckerVehicle | undefined>;
  updatePyckerVehicle(id: string, updates: Partial<PyckerVehicle>): Promise<PyckerVehicle | undefined>;
  deletePyckerVehicle(id: string): Promise<boolean>;

  // Environmental Certificates
  createEnvironmentalCertificate(certificate: InsertEnvironmentalCertificate): Promise<EnvironmentalCertificate>;
  getEnvironmentalCertificate(id: string): Promise<EnvironmentalCertificate | undefined>;
  getEnvironmentalCertificateByServiceRequest(serviceRequestId: string): Promise<EnvironmentalCertificate | undefined>;
  generateEnvironmentalCertificate(serviceRequestId: string): Promise<EnvironmentalCertificate>;

  // Email verification codes
  createEmailVerificationCode(email: string, code: string, expiresAt: Date): Promise<void>;
  getEmailVerificationCode(email: string): Promise<{ code: string; expiresAt: Date; verified: boolean } | undefined>;
  markEmailVerified(email: string): Promise<void>;
  deleteEmailVerificationCode(email: string): Promise<void>;

  // Job Adjustments - for extra items/charges added during a job
  createJobAdjustment(adjustment: InsertJobAdjustment): Promise<JobAdjustment>;
  getJobAdjustmentsByRequest(serviceRequestId: string): Promise<JobAdjustment[]>;
  updateJobAdjustment(id: string, updates: Partial<JobAdjustment>): Promise<JobAdjustment | undefined>;
  approveJobAdjustment(id: string): Promise<JobAdjustment | undefined>;
  declineJobAdjustment(id: string): Promise<JobAdjustment | undefined>;

  // Job Completions - verification and payment capture
  createJobCompletion(completion: InsertJobCompletion): Promise<JobCompletion>;
  getJobCompletion(serviceRequestId: string): Promise<JobCompletion | undefined>;
  updateJobCompletion(id: string, updates: Partial<JobCompletion>): Promise<JobCompletion | undefined>;
  getAllJobsWithDetails(): Promise<any[]>;

  // Customer Address Management
  getCustomerAddresses(userId: string): Promise<CustomerAddress[]>;
  createCustomerAddress(data: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, userId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress | undefined>;
  deleteCustomerAddress(id: string, userId: string): Promise<void>;
  setDefaultCustomerAddress(id: string, userId: string): Promise<void>;

  // PYCKER Online Status & GPS Tracking
  getPyckerOnlineStatus(pyckerId: string): Promise<PyckerOnlineStatus | undefined>;
  updatePyckerLocation(data: InsertPyckerOnlineStatus): Promise<PyckerOnlineStatus>;
  setPyckerOffline(pyckerId: string): Promise<void>;
  getOnlinePyckersNearby(lat: number, lng: number, radiusMiles: number): Promise<(PyckerOnlineStatus & { haulerProfile: HaulerProfile; distance: number })[]>;
  cleanupExpiredPyckerLocations(): Promise<number>;

  // ESG Impact Logs
  createEsgImpactLog(log: InsertEsgImpactLog): Promise<EsgImpactLog>;
  getEsgImpactLogByRequest(serviceRequestId: string): Promise<EsgImpactLog | undefined>;
  getEsgImpactLogsByCustomer(customerId: string): Promise<EsgImpactLog[]>;
  getEsgImpactLogsByHauler(haulerId: string): Promise<EsgImpactLog[]>;
  getEsgSummary(): Promise<{ totalJobs: number; totalCarbonLbs: number; totalDivertedLbs: number; avgDiversionRate: number }>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDispute(id: string): Promise<Dispute | undefined>;
  getDisputesByCustomer(customerId: string): Promise<Dispute[]>;
  getDisputesByStatus(status: string): Promise<Dispute[]>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;

  // Worker Skills
  getWorkerSkills(haulerProfileId: string): Promise<WorkerSkill[]>;
  upsertWorkerSkill(skill: InsertWorkerSkill): Promise<WorkerSkill>;

  // AI Safety Alerts
  createSafetyAlert(alert: InsertAiSafetyAlert): Promise<AiSafetyAlert>;
  getSafetyAlertsByRequest(serviceRequestId: string): Promise<AiSafetyAlert[]>;
  acknowledgeSafetyAlert(id: string): Promise<AiSafetyAlert | undefined>;

  // Bundling Suggestions
  createBundlingSuggestion(suggestion: InsertBundlingSuggestion): Promise<BundlingSuggestion>;
  getBundlingSuggestionsByRequest(serviceRequestId: string): Promise<BundlingSuggestion[]>;
  updateBundlingSuggestion(id: string, updates: Partial<BundlingSuggestion>): Promise<BundlingSuggestion | undefined>;

  // Demand Heatmap
  getDemandHeatmapData(dayOfWeek: number, hourOfDay: number): Promise<DemandHeatmapData[]>;
  upsertDemandHeatmapData(data: InsertDemandHeatmapData): Promise<DemandHeatmapData>;

  // Carbon-Intelligent Dispatch Batches
  createDispatchBatch(batch: InsertDispatchBatch): Promise<DispatchBatch>;
  getDispatchBatchesByDate(date: string): Promise<DispatchBatch[]>;
  getDispatchBatchesByHauler(haulerId: string): Promise<DispatchBatch[]>;
  updateDispatchBatch(id: string, updates: Partial<DispatchBatch>): Promise<DispatchBatch | undefined>;

  // Circular Economy - Disposal Recommendations
  createDisposalRecommendation(rec: InsertDisposalRecommendation): Promise<DisposalRecommendation>;
  getDisposalRecommendationsByRequest(serviceRequestId: string): Promise<DisposalRecommendation[]>;
  updateDisposalRecommendation(id: string, updates: Partial<DisposalRecommendation>): Promise<DisposalRecommendation | undefined>;

  // Compliance Vault - Receipts
  createComplianceReceipt(receipt: InsertComplianceReceipt): Promise<ComplianceReceipt>;
  getComplianceReceiptsByHauler(haulerId: string): Promise<ComplianceReceipt[]>;
  getComplianceReceiptSummary(haulerId: string, year: number): Promise<{ totalExpenses: number; totalDeductible: number; byCategory: Record<string, number> }>;

  // Compliance Vault - Mileage
  createMileageLog(log: InsertMileageLog): Promise<MileageLog>;
  getMileageLogsByHauler(haulerId: string): Promise<MileageLog[]>;
  getMileageSummary(haulerId: string, year: number): Promise<{ totalMiles: number; businessMiles: number; totalDeduction: number }>;

  // B2B ESG Reports
  createEsgReport(report: InsertEsgReport): Promise<EsgReport>;
  getEsgReportsByBusiness(businessAccountId: string): Promise<EsgReport[]>;
  getEsgReport(id: string): Promise<EsgReport | undefined>;

  // Platform Sustainability Stats
  getPlatformSustainabilityStats(): Promise<PlatformSustainabilityStats | undefined>;
  upsertPlatformSustainabilityStats(stats: Partial<PlatformSustainabilityStats>): Promise<PlatformSustainabilityStats>;

  // Agentic Brain - AI Triage
  createAiTriageReport(report: InsertAiTriageReport): Promise<AiTriageReport>;
  getAiTriageReport(id: string): Promise<AiTriageReport | undefined>;
  getAiTriageReportByRequest(serviceRequestId: string): Promise<AiTriageReport | undefined>;
  getRecentAiTriageReports(limit?: number): Promise<AiTriageReport[]>;

  // Agentic Brain - Smart Dispatch Recommendations
  createDispatchRecommendation(rec: InsertDispatchRecommendation): Promise<DispatchRecommendation>;
  getDispatchRecommendation(id: string): Promise<DispatchRecommendation | undefined>;
  getDispatchRecommendationByRequest(serviceRequestId: string): Promise<DispatchRecommendation | undefined>;

  // Agentic Brain - Revenue Protector (Sentiment)
  createSentimentFlag(flag: InsertSentimentFlag): Promise<SentimentFlag>;
  getSentimentFlag(id: string): Promise<SentimentFlag | undefined>;
  getRecentSentimentFlags(limit?: number): Promise<SentimentFlag[]>;
  getSentimentFlagsByRisk(riskLevel: string): Promise<SentimentFlag[]>;
  updateSentimentFlag(id: string, updates: Partial<SentimentFlag>): Promise<SentimentFlag | undefined>;

  // Agentic Brain - Conflict Shield
  createConflictShieldReport(report: InsertConflictShieldReport): Promise<ConflictShieldReport>;
  getConflictShieldReport(id: string): Promise<ConflictShieldReport | undefined>;
  getConflictShieldReportByRequest(serviceRequestId: string): Promise<ConflictShieldReport | undefined>;
  getRecentConflictShieldReports(limit?: number): Promise<ConflictShieldReport[]>;

  // Home Inventory (Insurance Vault + Reseller)
  createHomeInventoryItem(item: InsertHomeInventory): Promise<HomeInventory>;
  getHomeInventoryByCustomer(customerId: string): Promise<HomeInventory[]>;
  getHomeInventoryByServiceRequest(serviceRequestId: string): Promise<HomeInventory[]>;
  updateHomeInventoryItem(id: string, updates: Partial<HomeInventory>): Promise<HomeInventory | undefined>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;

  // Property Scores (Gamified Home Score)
  getPropertyScore(userId: string): Promise<PropertyScore | undefined>;
  getScoreHistory(scoreId: string, limit?: number): Promise<ScoreHistory[]>;

  // Consultations ($49 Commitment Credit)
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultation(id: string): Promise<Consultation | undefined>;
  getConsultationsByCustomer(customerId: string): Promise<Consultation[]>;
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined>;
  getUnusedConsultationCredit(customerId: string): Promise<Consultation | undefined>;

  // Deferred Jobs (Nudge Engine)
  createDeferredJob(job: InsertDeferredJob): Promise<DeferredJob>;
  getDeferredJobsByUser(userId: string): Promise<DeferredJob[]>;
  updateDeferredJob(id: string, updates: Partial<DeferredJob>): Promise<DeferredJob | undefined>;

  // Hauler Certifications
  createHaulerCertification(cert: InsertHaulerCertification): Promise<HaulerCertification>;
  getHaulerCertifications(haulerId: string): Promise<HaulerCertification[]>;
  getHaulerCareerStats(haulerId: string): Promise<any>;

  // Hauler Profile Operations
  checkInHauler(profileId: string, lat?: number, lng?: number): Promise<HaulerProfile | undefined>;
  checkOutHauler(profileId: string): Promise<HaulerProfile | undefined>;

  // Promo Code Operations
  createPromoCode(code: InsertPromoCode): Promise<PromoCode>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  validateAndApplyPromoCode(code: string, userId: string, orderAmount: number, isApp: boolean): Promise<{ valid: boolean; discount: number; error?: string }>;
  recordPromoCodeUsage(promoCodeId: string, userId: string, serviceRequestId: string, discountApplied: number): Promise<PromoCodeUsage>;
  seedOrlando25PromoCode(): Promise<PromoCode>;

  // Analytics Operations
  trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getEventsByUser(userId: string): Promise<AnalyticsEvent[]>;
  getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]>;
  getFunnelStats(startDate?: string, endDate?: string): Promise<{ eventType: string; count: number }[]>;
  incrementCustomerJobCount(userId: string): Promise<void>;

  // SMS Bot / AI Assistant
  getOrCreateSmsConversation(phoneNumber: string): Promise<SmsConversation>;
  getSmsConversation(id: string): Promise<SmsConversation | undefined>;
  getSmsConversationByPhone(phoneNumber: string): Promise<SmsConversation | undefined>;
  updateSmsConversation(id: string, updates: Partial<SmsConversation>): Promise<SmsConversation | undefined>;
  createSmsMessage(message: InsertSmsMessage): Promise<SmsMessage>;
  getSmsMessage(id: string): Promise<SmsMessage | undefined>;
  getSmsMessagesByConversation(conversationId: string, limit?: number): Promise<SmsMessage[]>;
  updateSmsMessage(id: string, updates: Partial<SmsMessage>): Promise<SmsMessage | undefined>;
  updateSmsMessageByTwilioSid(twilioMessageSid: string, updates: Partial<SmsMessage>): Promise<SmsMessage | undefined>;

  // FreshSpace Cleaning Checklists
  createCleaningChecklist(checklist: InsertCleaningChecklist): Promise<CleaningChecklist>;
  getCleaningChecklistsByRequest(serviceRequestId: string): Promise<CleaningChecklist[]>;
  updateCleaningChecklistTask(id: string, updates: Partial<CleaningChecklist>): Promise<CleaningChecklist | undefined>;
  bulkCreateCleaningChecklists(checklists: InsertCleaningChecklist[]): Promise<CleaningChecklist[]>;

  // FreshSpace Recurring Subscriptions
  createRecurringSubscription(subscription: InsertRecurringSubscription): Promise<RecurringSubscription>;
  getRecurringSubscription(id: string): Promise<RecurringSubscription | undefined>;
  getCustomerSubscriptions(customerId: string): Promise<RecurringSubscription[]>;
  updateRecurringSubscription(id: string, updates: Partial<RecurringSubscription>): Promise<RecurringSubscription | undefined>;
  getActiveSubscriptionsDueForBooking(date: string): Promise<RecurringSubscription[]>;

  seedInitialData(): Promise<void>;
}
