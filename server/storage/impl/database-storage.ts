import type { IStorage } from "../interface";
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
  SmsConversation, InsertSmsConversation,
  SmsMessage, InsertSmsMessage,
} from "@shared/schema";

// Import all 27 domain storage classes
import { UsersStorage } from "../domains/users/storage";
import { LocationTrackingStorage } from "../domains/location-tracking/storage";
import { VehiclesStorage } from "../domains/vehicles/storage";
import { CustomerAddressesStorage } from "../domains/customer-addresses/storage";
import { DisputesStorage } from "../domains/disputes/storage";
import { SkillsSafetyStorage } from "../domains/skills-safety/storage";
import { BundlingDemandStorage } from "../domains/bundling-demand/storage";
import { DispatchStorage } from "../domains/dispatch/storage";
import { ComplianceStorage } from "../domains/compliance/storage";
import { ScoringStorage } from "../domains/scoring/storage";
import { PenaltiesReferralsStorage } from "../domains/penalties-referrals/storage";
import { BusinessAccountsStorage } from "../domains/business-accounts/storage";
import { EsgStorage } from "../domains/esg/storage";
import { EnvironmentalStorage } from "../domains/environmental/storage";
import { PyckerStatusStorage } from "../domains/pycker-status/storage";
import { JobManagementStorage } from "../domains/job-management/storage";
import { CertificationsStorage } from "../domains/certifications/storage";
import { LoyaltyStorage } from "../domains/loyalty/storage";
import { PromotionsStorage } from "../domains/promotions/storage";
import { AgenticStorage } from "../domains/agentic/storage";
import { ServiceRequestsStorage } from "../domains/service-requests/storage";
import { HaulerProfilesStorage } from "../domains/hauler-profiles/storage";
import { PricingSurgeStorage } from "../domains/pricing-surge/storage";
import { AiEstimatesReviewsStorage } from "../domains/ai-estimates-reviews/storage";
import { MatchingStorage } from "../domains/matching/storage";
import { RebatesStorage } from "../domains/rebates/storage";
import { AnalyticsStorage } from "../domains/analytics/storage";
import { JobCrewAssignmentsStorage } from "../domains/job-crew-assignments/storage";
import { HoaCarbonStorage } from "../domains/hoa-carbon/storage";
import { JobVerificationStorage } from "../domains/job-verification/storage";
import { SmsBotStorage } from "../domains/sms-bot/storage";
import { PolishUpStorage } from "../domains/polishup/storage";

/**
 * DatabaseStorage - Composition Layer for Storage Architecture
 *
 * This class implements the IStorage interface by delegating method calls
 * to the appropriate domain storage instances. It serves as the single
 * entry point for all storage operations across the application.
 *
 * Architecture:
 * - 27 domain storage instances (one per feature domain)
 * - Each domain handles its own data access and business logic
 * - Cross-domain operations are composed at this layer
 *
 * Benefits:
 * - Single Responsibility: Each domain handles only its data
 * - Separation of Concerns: Business logic stays within domains
 * - Testability: Each domain can be tested independently
 * - Maintainability: Easy to locate and update domain-specific code
 * - Scalability: New domains can be added without modifying existing ones
 */
export class DatabaseStorage implements IStorage {
  // Domain storage instances
  private users: UsersStorage;
  private locationTracking: LocationTrackingStorage;
  private vehicles: VehiclesStorage;
  private customerAddresses: CustomerAddressesStorage;
  private disputes: DisputesStorage;
  private skillsSafety: SkillsSafetyStorage;
  private bundlingDemand: BundlingDemandStorage;
  private dispatch: DispatchStorage;
  private compliance: ComplianceStorage;
  private scoring: ScoringStorage;
  private penaltiesReferrals: PenaltiesReferralsStorage;
  private businessAccounts: BusinessAccountsStorage;
  private esg: EsgStorage;
  private environmental: EnvironmentalStorage;
  private pyckerStatus: PyckerStatusStorage;
  private jobManagement: JobManagementStorage;
  private certifications: CertificationsStorage;
  private loyalty: LoyaltyStorage;
  private promotions: PromotionsStorage;
  private agentic: AgenticStorage;
  private serviceRequests: ServiceRequestsStorage;
  private haulerProfiles: HaulerProfilesStorage;
  private pricingSurge: PricingSurgeStorage;
  private aiEstimatesReviews: AiEstimatesReviewsStorage;
  private matching: MatchingStorage;
  private rebates: RebatesStorage;
  private analytics: AnalyticsStorage;
  private jobCrewAssignments: JobCrewAssignmentsStorage;
  private hoaCarbon: HoaCarbonStorage;
  private jobVerification: JobVerificationStorage;
  private smsBot: SmsBotStorage;
  private freshSpace: PolishUpStorage;

  constructor() {
    // Initialize all domain storage instances
    this.users = new UsersStorage();
    this.locationTracking = new LocationTrackingStorage();
    this.vehicles = new VehiclesStorage();
    this.customerAddresses = new CustomerAddressesStorage();
    this.disputes = new DisputesStorage();
    this.skillsSafety = new SkillsSafetyStorage();
    this.bundlingDemand = new BundlingDemandStorage();
    this.dispatch = new DispatchStorage();
    this.compliance = new ComplianceStorage();
    this.scoring = new ScoringStorage();
    this.penaltiesReferrals = new PenaltiesReferralsStorage();
    this.businessAccounts = new BusinessAccountsStorage();
    this.esg = new EsgStorage();
    this.environmental = new EnvironmentalStorage();
    this.pyckerStatus = new PyckerStatusStorage();
    this.jobManagement = new JobManagementStorage();
    this.certifications = new CertificationsStorage();
    this.loyalty = new LoyaltyStorage();
    this.promotions = new PromotionsStorage();
    this.agentic = new AgenticStorage();
    this.serviceRequests = new ServiceRequestsStorage();
    this.haulerProfiles = new HaulerProfilesStorage();
    this.pricingSurge = new PricingSurgeStorage();
    this.aiEstimatesReviews = new AiEstimatesReviewsStorage();
    this.matching = new MatchingStorage();
    this.rebates = new RebatesStorage();
    this.analytics = new AnalyticsStorage();
    this.jobCrewAssignments = new JobCrewAssignmentsStorage();
    this.hoaCarbon = new HoaCarbonStorage();
    this.jobVerification = new JobVerificationStorage();
    this.smsBot = new SmsBotStorage();
    this.freshSpace = new PolishUpStorage();
  }

  // ============================================================================
  // USERS DOMAIN
  // ============================================================================

  async getUser(id: string): Promise<User | undefined> {
    return this.users.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.getUserByEmail(email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.getUserByUsername(username);
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this.users.createUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return this.users.updateUser(id, updates);
  }

  async updateUserLocation(id: string, lat: number, lng: number): Promise<User | undefined> {
    return this.users.updateUserLocation(id, lat, lng);
  }

  async getUsers(): Promise<User[]> {
    return this.users.getUsers();
  }

  // ============================================================================
  // HAULER PROFILES DOMAIN
  // ============================================================================

  async getHaulerProfile(userId: string): Promise<HaulerProfile | undefined> {
    return this.haulerProfiles.getHaulerProfile(userId);
  }

  async getHaulerProfileById(id: string): Promise<HaulerProfile | undefined> {
    return this.haulerProfiles.getHaulerProfileById(id);
  }

  async getAllHaulerProfiles(): Promise<HaulerProfile[]> {
    return this.haulerProfiles.getAllHaulerProfiles();
  }

  async createHaulerProfile(profile: InsertHaulerProfile): Promise<HaulerProfile> {
    return this.haulerProfiles.createHaulerProfile(profile);
  }

  async updateHaulerProfile(id: string, updates: Partial<HaulerProfile>): Promise<HaulerProfile | undefined> {
    return this.haulerProfiles.updateHaulerProfile(id, updates);
  }

  async getAvailableHaulers(): Promise<HaulerWithProfile[]> {
    return this.haulerProfiles.getAvailableHaulers();
  }

  async getAvailableHaulersWithVehicles(): Promise<HaulerWithProfileAndVehicle[]> {
    return this.haulerProfiles.getAvailableHaulersWithVehicles();
  }

  async getAllHaulers(): Promise<HaulerWithProfile[]> {
    return this.haulerProfiles.getAllHaulers();
  }

  async checkInHauler(profileId: string, lat?: number, lng?: number): Promise<HaulerProfile | undefined> {
    return this.haulerProfiles.checkInHauler(profileId, lat, lng);
  }

  async checkOutHauler(profileId: string): Promise<HaulerProfile | undefined> {
    return this.haulerProfiles.checkOutHauler(profileId);
  }

  // ============================================================================
  // SERVICE REQUESTS DOMAIN
  // ============================================================================

  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.getServiceRequest(id);
  }

  async getServiceRequestWithDetails(id: string): Promise<ServiceRequestWithDetails | undefined> {
    // CROSS-DOMAIN COMPOSITION: This requires data from multiple domains
    const request = await this.serviceRequests.getServiceRequest(id);
    if (!request) return undefined;

    const customer = await this.users.getUser(request.customerId);
    const matches = await this.serviceRequests.getMatchAttemptsByRequest(id);

    let hauler: User | undefined;
    let haulerProfile: HaulerProfile | undefined;
    let activeVehicle: PyckerVehicle | undefined;

    if (request.assignedHaulerId) {
      hauler = await this.users.getUser(request.assignedHaulerId);
      if (hauler) {
        haulerProfile = await this.haulerProfiles.getHaulerProfile(hauler.id);
        if (haulerProfile?.activeVehicleId) {
          activeVehicle = await this.vehicles.getPyckerVehicle(haulerProfile.activeVehicleId);
        }
      }
    }

    return {
      ...request,
      customer,
      hauler,
      haulerProfile,
      activeVehicle,
      matches,
    } as ServiceRequestWithDetails;
  }

  async getServiceRequestsByCustomer(customerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequests.getServiceRequestsByCustomer(customerId);
  }

  async getServiceRequestsByHauler(haulerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequests.getServiceRequestsByHauler(haulerId);
  }

  async getPendingRequests(): Promise<ServiceRequestWithDetails[]> {
    // CROSS-DOMAIN COMPOSITION: Fetch pending requests and enrich with user data
    const requests = await this.serviceRequests.getPendingRequestsBasic();
    const enriched: ServiceRequestWithDetails[] = [];

    for (const request of requests) {
      const customer = await this.users.getUser(request.customerId);
      const matches = await this.serviceRequests.getMatchAttemptsByRequest(request.id);

      enriched.push({
        ...request,
        customer,
        matches,
      } as ServiceRequestWithDetails);
    }

    return enriched;
  }

  async getActiveJobsForHauler(haulerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequests.getActiveJobsForHauler(haulerId);
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    return this.serviceRequests.createServiceRequest(request);
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.updateServiceRequest(id, updates);
  }

  async acceptServiceRequest(id: string, haulerId: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    return this.serviceRequests.acceptServiceRequest(id, haulerId, updates);
  }

  // ============================================================================
  // MATCHING DOMAIN
  // ============================================================================

  async getMatchAttempt(id: string): Promise<MatchAttempt | undefined> {
    return this.serviceRequests.getMatchAttempt(id);
  }

  async getMatchAttemptsByRequest(requestId: string): Promise<MatchAttempt[]> {
    return this.serviceRequests.getMatchAttemptsByRequest(requestId);
  }

  async getMatchAttemptsByHauler(haulerId: string): Promise<MatchAttempt[]> {
    return this.serviceRequests.getMatchAttemptsByHauler(haulerId);
  }

  async getPendingMatchesForHauler(haulerId: string): Promise<(MatchAttempt & { request: ServiceRequest })[]> {
    return this.serviceRequests.getPendingMatchesForHauler(haulerId);
  }

  async createMatchAttempt(match: InsertMatchAttempt): Promise<MatchAttempt> {
    return this.serviceRequests.createMatchAttempt(match);
  }

  async updateMatchAttempt(id: string, updates: Partial<MatchAttempt>): Promise<MatchAttempt | undefined> {
    return this.serviceRequests.updateMatchAttempt(id, updates);
  }

  async getSmartMatchedHaulers(request: {
    serviceType: string;
    loadSize: string;
    pickupLat?: number;
    pickupLng?: number;
    isPriority?: boolean;
    preferVerifiedPro?: boolean;
  }): Promise<HaulerWithProfile[]> {
    return this.matching.getSmartMatchedHaulers(request);
  }

  async searchHaulers(filters: {
    serviceType?: string;
    capability?: string;
    laborOnly?: boolean;
    availableOnly?: boolean;
  }): Promise<{ matches: HaulerWithProfile[]; suggestions: HaulerWithProfile[] }> {
    return this.aiEstimatesReviews.searchHaulers(filters);
  }

  async getAvailableHaulersByServiceType(serviceType: string): Promise<HaulerWithProfile[]> {
    return this.aiEstimatesReviews.getAvailableHaulersByServiceType(serviceType);
  }

  // ============================================================================
  // JOB CREW ASSIGNMENTS DOMAIN
  // ============================================================================

  async createJobCrewAssignment(assignment: InsertJobCrewAssignment): Promise<JobCrewAssignment> {
    return this.jobCrewAssignments.createJobCrewAssignment(assignment);
  }

  async getJobCrewAssignments(serviceRequestId: string): Promise<JobCrewAssignment[]> {
    return this.jobCrewAssignments.getJobCrewAssignments(serviceRequestId);
  }

  async getCrewAssignmentsByHauler(haulerId: string): Promise<JobCrewAssignment[]> {
    return this.jobCrewAssignments.getCrewAssignmentsByHauler(haulerId);
  }

  async updateJobCrewAssignment(id: string, updates: Partial<JobCrewAssignment>): Promise<JobCrewAssignment | undefined> {
    return this.jobCrewAssignments.updateJobCrewAssignment(id, updates);
  }

  async getAcceptedCrewCount(serviceRequestId: string): Promise<number> {
    return this.jobCrewAssignments.getAcceptedCrewCount(serviceRequestId);
  }

  // ============================================================================
  // LOCATION TRACKING DOMAIN
  // ============================================================================

  async addLocationHistory(location: InsertLocationHistory): Promise<LocationHistory> {
    return this.locationTracking.addLocationHistory(location);
  }

  async getLocationHistory(userId: string, jobId?: string): Promise<LocationHistory[]> {
    return this.locationTracking.getLocationHistory(userId, jobId);
  }

  async getLatestLocation(userId: string): Promise<LocationHistory | undefined> {
    return this.locationTracking.getLatestLocation(userId);
  }

  // ============================================================================
  // PRICING & SURGE DOMAIN
  // ============================================================================

  async getPricingRate(serviceType: string, loadSize: string, vehicleType?: string): Promise<PricingRate | undefined> {
    return this.pricingSurge.getPricingRate(serviceType, loadSize, vehicleType);
  }

  async getAllPricingRates(): Promise<PricingRate[]> {
    return this.pricingSurge.getAllPricingRates();
  }

  async createPricingRate(rate: InsertPricingRate): Promise<PricingRate> {
    return this.pricingSurge.createPricingRate(rate);
  }

  async getCurrentSurgeMultiplier(): Promise<number> {
    return this.pricingSurge.getCurrentSurgeMultiplier();
  }

  async getSurgeModifiers(): Promise<SurgeModifier[]> {
    return this.pricingSurge.getSurgeModifiers();
  }

  async createSurgeModifier(modifier: InsertSurgeModifier): Promise<SurgeModifier> {
    return this.pricingSurge.createSurgeModifier(modifier);
  }

  async updateSurgeModifier(id: string, updates: Partial<SurgeModifier>): Promise<SurgeModifier | undefined> {
    return this.pricingSurge.updateSurgeModifier(id, updates);
  }

  async deleteSurgeModifier(id: string): Promise<void> {
    return this.pricingSurge.deleteSurgeModifier(id);
  }

  async getHaulerActiveJobs(haulerId: string): Promise<ServiceRequest[]> {
    return this.serviceRequests.getActiveJobsForHauler(haulerId);
  }

  async calculateQuote(request: QuoteRequest): Promise<PriceQuote> {
    return this.pricingSurge.calculateQuote(request);
  }

  // ============================================================================
  // AI ESTIMATES & REVIEWS DOMAIN
  // ============================================================================

  async createAiEstimate(estimate: InsertAiEstimate): Promise<AiEstimate> {
    return this.aiEstimatesReviews.createAiEstimate(estimate);
  }

  async getAiEstimate(id: string): Promise<AiEstimate | undefined> {
    return this.aiEstimatesReviews.getAiEstimate(id);
  }

  async getAiEstimateByRequest(requestId: string): Promise<AiEstimate | undefined> {
    return this.aiEstimatesReviews.getAiEstimateByRequest(requestId);
  }

  async createReview(review: InsertHaulerReview): Promise<HaulerReview> {
    return this.aiEstimatesReviews.createReview(review);
  }

  async getReviewsByHauler(haulerId: string): Promise<HaulerReviewWithCustomer[]> {
    return this.aiEstimatesReviews.getReviewsByHauler(haulerId);
  }

  async getReviewByServiceRequest(serviceRequestId: string): Promise<HaulerReview | undefined> {
    return this.aiEstimatesReviews.getReviewByServiceRequest(serviceRequestId);
  }

  async updateHaulerRating(haulerId: string): Promise<void> {
    return this.aiEstimatesReviews.updateHaulerRating(haulerId);
  }

  // ============================================================================
  // PENALTIES & REFERRALS DOMAIN
  // ============================================================================

  async createHaulerPenalty(penalty: InsertHaulerPenalty): Promise<HaulerPenalty> {
    return this.penaltiesReferrals.createHaulerPenalty(penalty);
  }

  async getPenaltiesByHauler(haulerId: string): Promise<HaulerPenalty[]> {
    return this.penaltiesReferrals.getPenaltiesByHauler(haulerId);
  }

  async updateHaulerPenalty(id: string, updates: Partial<HaulerPenalty>): Promise<HaulerPenalty | undefined> {
    return this.penaltiesReferrals.updateHaulerPenalty(id, updates);
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    return this.penaltiesReferrals.createReferral(referral);
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    return this.penaltiesReferrals.getReferralByCode(code);
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return this.penaltiesReferrals.getReferralsByReferrer(referrerId);
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    return this.penaltiesReferrals.updateReferral(id, updates);
  }

  // ============================================================================
  // BUSINESS ACCOUNTS DOMAIN
  // ============================================================================

  async createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount> {
    return this.businessAccounts.createBusinessAccount(account);
  }

  async getBusinessAccountByUser(userId: string): Promise<BusinessAccount | undefined> {
    return this.businessAccounts.getBusinessAccountByUser(userId);
  }

  async getBusinessAccount(id: string): Promise<BusinessAccount | undefined> {
    return this.hoaCarbon.getBusinessAccount(id);
  }

  async updateBusinessAccount(id: string, updates: Partial<BusinessAccount>): Promise<BusinessAccount | undefined> {
    return this.businessAccounts.updateBusinessAccount(id, updates);
  }

  // ============================================================================
  // CARBON CREDITS DOMAIN
  // ============================================================================

  async createCarbonCredit(credit: InsertCarbonCredit): Promise<CarbonCredit> {
    return this.hoaCarbon.createCarbonCredit(credit);
  }

  async getCarbonCreditsByBusinessAccount(businessAccountId: string): Promise<CarbonCredit[]> {
    return this.hoaCarbon.getCarbonCreditsByBusinessAccount(businessAccountId);
  }

  async getCarbonCreditsByServiceRequest(serviceRequestId: string): Promise<CarbonCredit | undefined> {
    return this.hoaCarbon.getCarbonCreditsByServiceRequest(serviceRequestId);
  }

  async updateCarbonCredit(id: string, updates: Partial<CarbonCredit>): Promise<CarbonCredit | undefined> {
    return this.hoaCarbon.updateCarbonCredit(id, updates);
  }

  // ============================================================================
  // HOA PROPERTIES DOMAIN
  // ============================================================================

  async createHoaProperty(property: InsertHoaProperty): Promise<HoaProperty> {
    return this.hoaCarbon.createHoaProperty(property);
  }

  async getHoaProperty(id: string): Promise<HoaProperty | undefined> {
    return this.hoaCarbon.getHoaProperty(id);
  }

  async getHoaPropertiesByBusinessAccount(businessAccountId: string): Promise<HoaProperty[]> {
    return this.hoaCarbon.getHoaPropertiesByBusinessAccount(businessAccountId);
  }

  async updateHoaProperty(id: string, updates: Partial<HoaProperty>): Promise<HoaProperty | undefined> {
    return this.hoaCarbon.updateHoaProperty(id, updates);
  }

  // ============================================================================
  // HOA VIOLATIONS DOMAIN
  // ============================================================================

  async createHoaViolation(violation: InsertHoaViolation): Promise<HoaViolation> {
    return this.hoaCarbon.createHoaViolation(violation);
  }

  async getHoaViolation(id: string): Promise<HoaViolation | undefined> {
    return this.hoaCarbon.getHoaViolation(id);
  }

  async getHoaViolationsByBusinessAccount(businessAccountId: string): Promise<HoaViolation[]> {
    return this.hoaCarbon.getHoaViolationsByBusinessAccount(businessAccountId);
  }

  async getHoaViolationsByProperty(propertyId: string): Promise<HoaViolation[]> {
    return this.hoaCarbon.getHoaViolationsByProperty(propertyId);
  }

  async updateHoaViolation(id: string, updates: Partial<HoaViolation>): Promise<HoaViolation | undefined> {
    return this.hoaCarbon.updateHoaViolation(id, updates);
  }

  // ============================================================================
  // HOA REFERRAL PAYMENTS DOMAIN
  // ============================================================================

  async createHoaReferralPayment(payment: InsertHoaReferralPayment): Promise<HoaReferralPayment> {
    return this.hoaCarbon.createHoaReferralPayment(payment);
  }

  async getHoaReferralPaymentsByBusinessAccount(businessAccountId: string): Promise<HoaReferralPayment[]> {
    return this.hoaCarbon.getHoaReferralPaymentsByBusinessAccount(businessAccountId);
  }

  async updateHoaReferralPayment(id: string, updates: Partial<HoaReferralPayment>): Promise<HoaReferralPayment | undefined> {
    return this.hoaCarbon.updateHoaReferralPayment(id, updates);
  }

  // ============================================================================
  // VIOLATION COMMUNICATIONS DOMAIN
  // ============================================================================

  async createViolationCommunication(communication: InsertViolationCommunication): Promise<ViolationCommunication> {
    return this.hoaCarbon.createViolationCommunication(communication);
  }

  async getViolationCommunicationsByViolation(violationId: string): Promise<ViolationCommunication[]> {
    return this.hoaCarbon.getViolationCommunicationsByViolation(violationId);
  }

  async updateViolationCommunication(id: string, updates: Partial<ViolationCommunication>): Promise<ViolationCommunication | undefined> {
    return this.hoaCarbon.updateViolationCommunication(id, updates);
  }

  // ============================================================================
  // JOB VERIFICATION DOMAIN
  // ============================================================================

  async createJobVerification(verification: InsertJobVerification): Promise<JobVerification> {
    return this.jobVerification.createJobVerification(verification);
  }

  async getJobVerification(serviceRequestId: string): Promise<JobVerification | undefined> {
    return this.jobVerification.getJobVerification(serviceRequestId);
  }

  async updateJobVerification(id: string, updates: Partial<JobVerification>): Promise<JobVerification | undefined> {
    return this.jobVerification.updateJobVerification(id, updates);
  }

  async createDisposalRecord(record: InsertDisposalRecord): Promise<DisposalRecord> {
    return this.jobVerification.createDisposalRecord(record);
  }

  async getDisposalRecordsByVerification(verificationId: string): Promise<DisposalRecord[]> {
    return this.jobVerification.getDisposalRecordsByVerification(verificationId);
  }

  async getDisposalRecordsByServiceRequest(serviceRequestId: string): Promise<DisposalRecord[]> {
    return this.jobVerification.getDisposalRecordsByServiceRequest(serviceRequestId);
  }

  async updateDisposalRecord(id: string, updates: Partial<DisposalRecord>): Promise<DisposalRecord | undefined> {
    return this.jobVerification.updateDisposalRecord(id, updates);
  }

  // ============================================================================
  // RECURRING JOBS DOMAIN
  // ============================================================================

  async createRecurringJob(job: InsertRecurringJob): Promise<RecurringJob> {
    return this.businessAccounts.createRecurringJob(job);
  }

  async getRecurringJobsByBusinessAccount(businessAccountId: string): Promise<RecurringJob[]> {
    return this.businessAccounts.getRecurringJobsByBusinessAccount(businessAccountId);
  }

  async updateRecurringJob(id: string, updates: Partial<RecurringJob>): Promise<RecurringJob | undefined> {
    return this.businessAccounts.updateRecurringJob(id, updates);
  }

  async getActiveRecurringJobs(): Promise<RecurringJob[]> {
    return this.businessAccounts.getActiveRecurringJobs();
  }

  // ============================================================================
  // LOYALTY DOMAIN
  // ============================================================================

  async getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | undefined> {
    return this.loyalty.getLoyaltyAccount(userId);
  }

  async createLoyaltyAccount(account: InsertLoyaltyAccount): Promise<LoyaltyAccount> {
    return this.loyalty.createLoyaltyAccount(account);
  }

  async updateLoyaltyAccount(id: string, updates: Partial<LoyaltyAccount>): Promise<LoyaltyAccount | undefined> {
    return this.loyalty.updateLoyaltyAccount(id, updates);
  }

  async addLoyaltyPoints(userId: string, points: number, description: string, serviceRequestId?: string): Promise<LoyaltyTransaction> {
    return this.loyalty.addLoyaltyPoints(userId, points, description, serviceRequestId);
  }

  async redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined> {
    return this.loyalty.redeemLoyaltyPoints(userId, points, description);
  }

  async getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    return this.loyalty.getLoyaltyTransactions(userId);
  }

  async getLoyaltyRewards(): Promise<LoyaltyReward[]> {
    return this.loyalty.getLoyaltyRewards();
  }

  async getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined> {
    return this.loyalty.getLoyaltyReward(id);
  }

  async createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward> {
    return this.loyalty.createLoyaltyReward(reward);
  }

  // ============================================================================
  // PROMOTIONS DOMAIN
  // ============================================================================

  async hasUsedFirstJobDiscount(userId: string): Promise<boolean> {
    return this.promotions.hasUsedFirstJobDiscount(userId);
  }

  async createPromotion(promotion: InsertPromotion): Promise<Promotion> {
    return this.promotions.createPromotion(promotion);
  }

  async getPromotionsByUser(userId: string): Promise<Promotion[]> {
    return this.promotions.getPromotionsByUser(userId);
  }

  async isSlotAvailableForApp(slotDate: string, slotTime: string): Promise<boolean> {
    return this.promotions.isSlotAvailableForApp(slotDate, slotTime);
  }

  async reserveSlotForApp(slotDate: string, slotTime: string, userId: string): Promise<AppPrioritySlot> {
    return this.promotions.reserveSlotForApp(slotDate, slotTime, userId);
  }

  async getAvailablePrioritySlots(date: string): Promise<AppPrioritySlot[]> {
    return this.promotions.getAvailablePrioritySlots(date);
  }

  async isFirstTimeCustomer(userId: string): Promise<boolean> {
    return this.promotions.isFirstTimeCustomer(userId);
  }

  async calculateQuoteWithPromotions(request: QuoteRequest & { userId?: string; bookingSource?: string }): Promise<PriceQuote & { firstJobDiscount?: number; hasPriorityAccess?: boolean }> {
    // CROSS-DOMAIN COMPOSITION: Calculate quote with promotions
    const baseQuote = await this.pricingSurge.calculateQuote(request);

    let firstJobDiscount = 0;
    let hasPriorityAccess = false;

    if (request.userId) {
      const isFirstTime = await this.promotions.isFirstTimeCustomer(request.userId);
      if (isFirstTime) {
        firstJobDiscount = 25; // $25 first job discount
      }

      // Check for app priority access (same-day or weekend)
      if (request.bookingSource === "app" && request.scheduledFor) {
        const scheduledDate = new Date(request.scheduledFor);
        const dateStr = scheduledDate.toISOString().split('T')[0];
        const timeStr = scheduledDate.toTimeString().slice(0, 5);
        hasPriorityAccess = await this.promotions.isSlotAvailableForApp(dateStr, timeStr);
      }
    }

    return {
      ...baseQuote,
      totalPrice: baseQuote.totalPrice - firstJobDiscount,
      firstJobDiscount,
      hasPriorityAccess,
    };
  }

  async createPromoCode(code: InsertPromoCode): Promise<PromoCode> {
    return this.promotions.createPromoCode(code);
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    return this.promotions.getPromoCodeByCode(code);
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return this.promotions.getAllPromoCodes();
  }

  async validateAndApplyPromoCode(code: string, userId: string, orderAmount: number, isApp: boolean): Promise<{ valid: boolean; discount: number; error?: string }> {
    return this.promotions.validateAndApplyPromoCode(code, userId, orderAmount, isApp);
  }

  async recordPromoCodeUsage(promoCodeId: string, userId: string, serviceRequestId: string, discountApplied: number): Promise<PromoCodeUsage> {
    return this.promotions.recordPromoCodeUsage(promoCodeId, userId, serviceRequestId, discountApplied);
  }

  async seedOrlando25PromoCode(): Promise<PromoCode> {
    // Check if ORLANDO25 already exists
    const existing = await this.promotions.getPromoCodeByCode("ORLANDO25");
    if (existing) return existing;

    // Create the ORLANDO25 promo code
    return this.promotions.createPromoCode({
      code: "ORLANDO25",
      description: "$25 off first order for Orlando app users",
      discountType: "fixed",
      discountAmount: 25,
      minOrderAmount: 50,
      appOnly: true,
      firstTimeOnly: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  // ============================================================================
  // VEHICLES DOMAIN
  // ============================================================================

  async createPyckerVehicle(vehicle: InsertPyckerVehicle): Promise<PyckerVehicle> {
    return this.vehicles.createPyckerVehicle(vehicle);
  }

  async getPyckerVehicles(haulerProfileId: string): Promise<PyckerVehicle[]> {
    return this.vehicles.getPyckerVehicles(haulerProfileId);
  }

  async getPyckerVehicle(id: string): Promise<PyckerVehicle | undefined> {
    return this.vehicles.getPyckerVehicle(id);
  }

  async updatePyckerVehicle(id: string, updates: Partial<PyckerVehicle>): Promise<PyckerVehicle | undefined> {
    return this.vehicles.updatePyckerVehicle(id, updates);
  }

  async deletePyckerVehicle(id: string): Promise<boolean> {
    return this.vehicles.deletePyckerVehicle(id);
  }

  // ============================================================================
  // ENVIRONMENTAL DOMAIN (Green Guarantee)
  // ============================================================================

  async getApprovedFacilities(): Promise<ApprovedFacility[]> {
    return this.rebates.getApprovedFacilities();
  }

  async getApprovedFacility(id: string): Promise<ApprovedFacility | undefined> {
    return this.rebates.getApprovedFacility(id);
  }

  async findFacilityByName(name: string): Promise<ApprovedFacility | undefined> {
    return this.rebates.findFacilityByName(name);
  }

  async createApprovedFacility(facility: InsertApprovedFacility): Promise<ApprovedFacility> {
    return this.rebates.createApprovedFacility(facility);
  }

  async updateApprovedFacility(id: string, updates: Partial<ApprovedFacility>): Promise<ApprovedFacility | undefined> {
    return this.rebates.updateApprovedFacility(id, updates);
  }

  async createEnvironmentalCertificate(certificate: InsertEnvironmentalCertificate): Promise<EnvironmentalCertificate> {
    return this.environmental.createEnvironmentalCertificate(certificate);
  }

  async getEnvironmentalCertificate(id: string): Promise<EnvironmentalCertificate | undefined> {
    return this.environmental.getEnvironmentalCertificate(id);
  }

  async getEnvironmentalCertificateByServiceRequest(serviceRequestId: string): Promise<EnvironmentalCertificate | undefined> {
    return this.environmental.getEnvironmentalCertificateByServiceRequest(serviceRequestId);
  }

  async generateEnvironmentalCertificate(serviceRequestId: string): Promise<EnvironmentalCertificate> {
    return this.environmental.generateEnvironmentalCertificate(
      serviceRequestId,
      (id) => this.getServiceRequest(id),
      (id, updates) => this.updateServiceRequest(id, updates),
      () => this.rebates.getApprovedFacilities()
    );
  }

  // ============================================================================
  // REBATES DOMAIN (Green Guarantee Rebates)
  // ============================================================================

  async createRebateClaim(claim: InsertRebateClaim): Promise<RebateClaim> {
    return this.rebates.createRebateClaim(claim);
  }

  async getRebateClaimsByHauler(haulerId: string): Promise<RebateClaim[]> {
    return this.rebates.getRebateClaimsByHauler(haulerId);
  }

  async getRebateClaimsByStatus(status: string): Promise<RebateClaim[]> {
    return this.rebates.getRebateClaimsByStatus(status);
  }

  async getRebateClaim(id: string): Promise<RebateClaim | undefined> {
    return this.rebates.getRebateClaim(id);
  }

  async updateRebateClaim(id: string, updates: Partial<RebateClaim>): Promise<RebateClaim | undefined> {
    return this.rebates.updateRebateClaim(id, updates);
  }

  async updateRebateClaimAIValidation(id: string, updates: {
    aiValidationStatus: string;
    aiValidationResult?: string;
    aiValidationNotes?: string;
    aiValidatedAt: string;
    aiConfidenceScore?: number;
  }): Promise<RebateClaim | undefined> {
    return this.rebates.updateRebateClaimAIValidation(id, updates);
  }

  async approveRebateClaim(id: string, reviewerId: string): Promise<RebateClaim | undefined> {
    return this.rebates.approveRebateClaim(id, reviewerId);
  }

  async denyRebateClaim(id: string, reviewerId: string, reason: string): Promise<RebateClaim | undefined> {
    return this.rebates.denyRebateClaim(id, reviewerId, reason);
  }

  async addRebateToBalance(haulerId: string, amount: number): Promise<HaulerProfile | undefined> {
    return this.rebates.addRebateToBalance(haulerId, amount);
  }

  async validateRebateClaim(claim: Partial<InsertRebateClaim>, jobCompletedAt: string, estimatedWeight: number): Promise<{ flags: string[]; withinVariance: boolean; within48Hours: boolean; facilityApproved: boolean; isDuplicate: boolean }> {
    return this.rebates.validateRebateClaim(claim, jobCompletedAt, estimatedWeight);
  }

  // ============================================================================
  // JOB MANAGEMENT DOMAIN
  // ============================================================================

  async createJobAdjustment(adjustment: InsertJobAdjustment): Promise<JobAdjustment> {
    return this.jobManagement.createJobAdjustment(adjustment);
  }

  async getJobAdjustmentsByRequest(serviceRequestId: string): Promise<JobAdjustment[]> {
    return this.jobManagement.getJobAdjustmentsByRequest(serviceRequestId);
  }

  async updateJobAdjustment(id: string, updates: Partial<JobAdjustment>): Promise<JobAdjustment | undefined> {
    return this.jobManagement.updateJobAdjustment(id, updates);
  }

  async approveJobAdjustment(id: string): Promise<JobAdjustment | undefined> {
    return this.jobManagement.approveJobAdjustment(id);
  }

  async declineJobAdjustment(id: string): Promise<JobAdjustment | undefined> {
    return this.jobManagement.declineJobAdjustment(id);
  }

  async createJobCompletion(completion: InsertJobCompletion): Promise<JobCompletion> {
    return this.jobManagement.createJobCompletion(completion);
  }

  async getJobCompletion(serviceRequestId: string): Promise<JobCompletion | undefined> {
    return this.jobManagement.getJobCompletion(serviceRequestId);
  }

  async updateJobCompletion(id: string, updates: Partial<JobCompletion>): Promise<JobCompletion | undefined> {
    return this.jobManagement.updateJobCompletion(id, updates);
  }

  async getAllJobsWithDetails(): Promise<any[]> {
    return this.jobManagement.getAllJobsWithDetails();
  }

  // ============================================================================
  // CUSTOMER ADDRESSES DOMAIN
  // ============================================================================

  async getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
    return this.customerAddresses.getCustomerAddresses(userId);
  }

  async createCustomerAddress(data: InsertCustomerAddress): Promise<CustomerAddress> {
    return this.customerAddresses.createCustomerAddress(data);
  }

  async updateCustomerAddress(id: string, userId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress | undefined> {
    return this.customerAddresses.updateCustomerAddress(id, userId, updates);
  }

  async deleteCustomerAddress(id: string, userId: string): Promise<void> {
    return this.customerAddresses.deleteCustomerAddress(id, userId);
  }

  async setDefaultCustomerAddress(id: string, userId: string): Promise<void> {
    return this.customerAddresses.setDefaultCustomerAddress(id, userId);
  }

  // ============================================================================
  // PYCKER STATUS DOMAIN (GPS Tracking)
  // ============================================================================

  async getPyckerOnlineStatus(pyckerId: string): Promise<PyckerOnlineStatus | undefined> {
    return this.pyckerStatus.getPyckerOnlineStatus(pyckerId);
  }

  async updatePyckerLocation(data: InsertPyckerOnlineStatus): Promise<PyckerOnlineStatus> {
    return this.pyckerStatus.updatePyckerLocation(data);
  }

  async setPyckerOffline(pyckerId: string): Promise<void> {
    return this.pyckerStatus.setPyckerOffline(pyckerId);
  }

  async getOnlinePyckersNearby(lat: number, lng: number, radiusMiles: number): Promise<(PyckerOnlineStatus & { haulerProfile: HaulerProfile; distance: number })[]> {
    return this.pyckerStatus.getOnlinePyckersNearby(lat, lng, radiusMiles);
  }

  async cleanupExpiredPyckerLocations(): Promise<number> {
    return this.pyckerStatus.cleanupExpiredPyckerLocations();
  }

  // ============================================================================
  // ESG DOMAIN
  // ============================================================================

  async createEsgImpactLog(log: InsertEsgImpactLog): Promise<EsgImpactLog> {
    return this.esg.createEsgImpactLog(log);
  }

  async getEsgImpactLogByRequest(serviceRequestId: string): Promise<EsgImpactLog | undefined> {
    return this.esg.getEsgImpactLogByRequest(serviceRequestId);
  }

  async getEsgImpactLogsByCustomer(customerId: string): Promise<EsgImpactLog[]> {
    return this.esg.getEsgImpactLogsByCustomer(customerId);
  }

  async getEsgImpactLogsByHauler(haulerId: string): Promise<EsgImpactLog[]> {
    return this.esg.getEsgImpactLogsByHauler(haulerId);
  }

  async getEsgSummary(): Promise<{ totalJobs: number; totalCarbonLbs: number; totalDivertedLbs: number; avgDiversionRate: number }> {
    return this.esg.getEsgSummary();
  }

  async createEsgReport(report: InsertEsgReport): Promise<EsgReport> {
    return this.esg.createEsgReport(report);
  }

  async getEsgReportsByBusiness(businessAccountId: string): Promise<EsgReport[]> {
    return this.esg.getEsgReportsByBusiness(businessAccountId);
  }

  async getEsgReport(id: string): Promise<EsgReport | undefined> {
    return this.esg.getEsgReport(id);
  }

  async getPlatformSustainabilityStats(): Promise<PlatformSustainabilityStats | undefined> {
    return this.esg.getPlatformSustainabilityStats();
  }

  async upsertPlatformSustainabilityStats(stats: Partial<PlatformSustainabilityStats>): Promise<PlatformSustainabilityStats> {
    return this.esg.upsertPlatformSustainabilityStats(stats);
  }

  // ============================================================================
  // DISPUTES DOMAIN
  // ============================================================================

  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    return this.disputes.createDispute(dispute);
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    return this.disputes.getDispute(id);
  }

  async getDisputesByCustomer(customerId: string): Promise<Dispute[]> {
    return this.disputes.getDisputesByCustomer(customerId);
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    return this.disputes.getDisputesByStatus(status);
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    return this.disputes.updateDispute(id, updates);
  }

  // ============================================================================
  // SKILLS & SAFETY DOMAIN
  // ============================================================================

  async getWorkerSkills(haulerProfileId: string): Promise<WorkerSkill[]> {
    return this.skillsSafety.getWorkerSkills(haulerProfileId);
  }

  async upsertWorkerSkill(skill: InsertWorkerSkill): Promise<WorkerSkill> {
    return this.skillsSafety.upsertWorkerSkill(skill);
  }

  async createSafetyAlert(alert: InsertAiSafetyAlert): Promise<AiSafetyAlert> {
    return this.skillsSafety.createSafetyAlert(alert);
  }

  async getSafetyAlertsByRequest(serviceRequestId: string): Promise<AiSafetyAlert[]> {
    return this.skillsSafety.getSafetyAlertsByRequest(serviceRequestId);
  }

  async acknowledgeSafetyAlert(id: string): Promise<AiSafetyAlert | undefined> {
    return this.skillsSafety.acknowledgeSafetyAlert(id);
  }

  // ============================================================================
  // BUNDLING & DEMAND DOMAIN
  // ============================================================================

  async createBundlingSuggestion(suggestion: InsertBundlingSuggestion): Promise<BundlingSuggestion> {
    return this.bundlingDemand.createBundlingSuggestion(suggestion);
  }

  async getBundlingSuggestionsByRequest(serviceRequestId: string): Promise<BundlingSuggestion[]> {
    return this.bundlingDemand.getBundlingSuggestionsByRequest(serviceRequestId);
  }

  async updateBundlingSuggestion(id: string, updates: Partial<BundlingSuggestion>): Promise<BundlingSuggestion | undefined> {
    return this.bundlingDemand.updateBundlingSuggestion(id, updates);
  }

  async getDemandHeatmapData(dayOfWeek: number, hourOfDay: number): Promise<DemandHeatmapData[]> {
    return this.bundlingDemand.getDemandHeatmapData(dayOfWeek, hourOfDay);
  }

  async upsertDemandHeatmapData(data: InsertDemandHeatmapData): Promise<DemandHeatmapData> {
    return this.bundlingDemand.upsertDemandHeatmapData(data);
  }

  // ============================================================================
  // DISPATCH DOMAIN
  // ============================================================================

  async createDispatchBatch(batch: InsertDispatchBatch): Promise<DispatchBatch> {
    return this.dispatch.createDispatchBatch(batch);
  }

  async getDispatchBatchesByDate(date: string): Promise<DispatchBatch[]> {
    return this.dispatch.getDispatchBatchesByDate(date);
  }

  async getDispatchBatchesByHauler(haulerId: string): Promise<DispatchBatch[]> {
    return this.dispatch.getDispatchBatchesByHauler(haulerId);
  }

  async updateDispatchBatch(id: string, updates: Partial<DispatchBatch>): Promise<DispatchBatch | undefined> {
    return this.dispatch.updateDispatchBatch(id, updates);
  }

  async createDisposalRecommendation(rec: InsertDisposalRecommendation): Promise<DisposalRecommendation> {
    return this.dispatch.createDisposalRecommendation(rec);
  }

  async getDisposalRecommendationsByRequest(serviceRequestId: string): Promise<DisposalRecommendation[]> {
    return this.dispatch.getDisposalRecommendationsByRequest(serviceRequestId);
  }

  async updateDisposalRecommendation(id: string, updates: Partial<DisposalRecommendation>): Promise<DisposalRecommendation | undefined> {
    return this.dispatch.updateDisposalRecommendation(id, updates);
  }

  // ============================================================================
  // COMPLIANCE DOMAIN
  // ============================================================================

  async createComplianceReceipt(receipt: InsertComplianceReceipt): Promise<ComplianceReceipt> {
    return this.compliance.createComplianceReceipt(receipt);
  }

  async getComplianceReceiptsByHauler(haulerId: string): Promise<ComplianceReceipt[]> {
    return this.compliance.getComplianceReceiptsByHauler(haulerId);
  }

  async getComplianceReceiptSummary(haulerId: string, year: number): Promise<{ totalExpenses: number; totalDeductible: number; byCategory: Record<string, number> }> {
    return this.compliance.getComplianceReceiptSummary(haulerId, year);
  }

  async createMileageLog(log: InsertMileageLog): Promise<MileageLog> {
    return this.compliance.createMileageLog(log);
  }

  async getMileageLogsByHauler(haulerId: string): Promise<MileageLog[]> {
    return this.compliance.getMileageLogsByHauler(haulerId);
  }

  async getMileageSummary(haulerId: string, year: number): Promise<{ totalMiles: number; businessMiles: number; totalDeduction: number }> {
    return this.compliance.getMileageSummary(haulerId, year);
  }

  // ============================================================================
  // AGENTIC BRAIN DOMAIN
  // ============================================================================

  async createAiTriageReport(report: InsertAiTriageReport): Promise<AiTriageReport> {
    return this.agentic.createAiTriageReport(report);
  }

  async getAiTriageReport(id: string): Promise<AiTriageReport | undefined> {
    return this.agentic.getAiTriageReport(id);
  }

  async getAiTriageReportByRequest(serviceRequestId: string): Promise<AiTriageReport | undefined> {
    return this.agentic.getAiTriageReportByRequest(serviceRequestId);
  }

  async getRecentAiTriageReports(limit?: number): Promise<AiTriageReport[]> {
    return this.agentic.getRecentAiTriageReports(limit);
  }

  async createDispatchRecommendation(rec: InsertDispatchRecommendation): Promise<DispatchRecommendation> {
    return this.agentic.createDispatchRecommendation(rec);
  }

  async getDispatchRecommendation(id: string): Promise<DispatchRecommendation | undefined> {
    return this.agentic.getDispatchRecommendation(id);
  }

  async getDispatchRecommendationByRequest(serviceRequestId: string): Promise<DispatchRecommendation | undefined> {
    return this.agentic.getDispatchRecommendationByRequest(serviceRequestId);
  }

  async createSentimentFlag(flag: InsertSentimentFlag): Promise<SentimentFlag> {
    return this.agentic.createSentimentFlag(flag);
  }

  async getSentimentFlag(id: string): Promise<SentimentFlag | undefined> {
    return this.agentic.getSentimentFlag(id);
  }

  async getRecentSentimentFlags(limit?: number): Promise<SentimentFlag[]> {
    return this.agentic.getRecentSentimentFlags(limit);
  }

  async getSentimentFlagsByRisk(riskLevel: string): Promise<SentimentFlag[]> {
    return this.agentic.getSentimentFlagsByRisk(riskLevel);
  }

  async updateSentimentFlag(id: string, updates: Partial<SentimentFlag>): Promise<SentimentFlag | undefined> {
    return this.agentic.updateSentimentFlag(id, updates);
  }

  async createConflictShieldReport(report: InsertConflictShieldReport): Promise<ConflictShieldReport> {
    return this.agentic.createConflictShieldReport(report);
  }

  async getConflictShieldReport(id: string): Promise<ConflictShieldReport | undefined> {
    return this.agentic.getConflictShieldReport(id);
  }

  async getConflictShieldReportByRequest(serviceRequestId: string): Promise<ConflictShieldReport | undefined> {
    return this.agentic.getConflictShieldReportByRequest(serviceRequestId);
  }

  async getRecentConflictShieldReports(limit?: number): Promise<ConflictShieldReport[]> {
    return this.agentic.getRecentConflictShieldReports(limit);
  }

  async createHomeInventoryItem(item: InsertHomeInventory): Promise<HomeInventory> {
    return this.penaltiesReferrals.createHomeInventoryItem(item);
  }

  async getHomeInventoryByCustomer(customerId: string): Promise<HomeInventory[]> {
    return this.penaltiesReferrals.getHomeInventoryByCustomer(customerId);
  }

  async getHomeInventoryByServiceRequest(serviceRequestId: string): Promise<HomeInventory[]> {
    return this.penaltiesReferrals.getHomeInventoryByServiceRequest(serviceRequestId);
  }

  async updateHomeInventoryItem(id: string, updates: Partial<HomeInventory>): Promise<HomeInventory | undefined> {
    return this.penaltiesReferrals.updateHomeInventoryItem(id, updates);
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    return this.penaltiesReferrals.createAuditLog(log);
  }

  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    return this.penaltiesReferrals.getAuditLogs(limit);
  }

  // ============================================================================
  // SCORING DOMAIN
  // ============================================================================

  async getPropertyScore(userId: string): Promise<PropertyScore | undefined> {
    return this.scoring.getPropertyScore(userId);
  }

  async getScoreHistory(scoreId: string, limit?: number): Promise<ScoreHistory[]> {
    return this.scoring.getScoreHistory(scoreId, limit);
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    return this.scoring.createConsultation(consultation);
  }

  async getConsultation(id: string): Promise<Consultation | undefined> {
    return this.scoring.getConsultation(id);
  }

  async getConsultationsByCustomer(customerId: string): Promise<Consultation[]> {
    return this.scoring.getConsultationsByCustomer(customerId);
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined> {
    return this.scoring.updateConsultation(id, updates);
  }

  async getUnusedConsultationCredit(customerId: string): Promise<Consultation | undefined> {
    return this.scoring.getUnusedConsultationCredit(customerId);
  }

  // ============================================================================
  // CERTIFICATIONS DOMAIN (Deferred Jobs + Hauler Certifications)
  // ============================================================================

  async createDeferredJob(job: InsertDeferredJob): Promise<DeferredJob> {
    return this.certifications.createDeferredJob(job);
  }

  async getDeferredJobsByUser(userId: string): Promise<DeferredJob[]> {
    return this.certifications.getDeferredJobsByUser(userId);
  }

  async updateDeferredJob(id: string, updates: Partial<DeferredJob>): Promise<DeferredJob | undefined> {
    return this.certifications.updateDeferredJob(id, updates);
  }

  async createHaulerCertification(cert: InsertHaulerCertification): Promise<HaulerCertification> {
    return this.certifications.createHaulerCertification(cert);
  }

  async getHaulerCertifications(haulerId: string): Promise<HaulerCertification[]> {
    return this.certifications.getHaulerCertifications(haulerId);
  }

  async getHaulerCareerStats(haulerId: string): Promise<any> {
    return this.certifications.getHaulerCareerStats(haulerId);
  }

  // ============================================================================
  // EMAIL VERIFICATION (Users Domain)
  // ============================================================================

  async createEmailVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    return this.environmental.createEmailVerificationCode(email, code, expiresAt);
  }

  async getEmailVerificationCode(email: string): Promise<{ code: string; expiresAt: Date; verified: boolean } | undefined> {
    return this.environmental.getEmailVerificationCode(email);
  }

  async markEmailVerified(email: string): Promise<void> {
    return this.environmental.markEmailVerified(email);
  }

  async deleteEmailVerificationCode(email: string): Promise<void> {
    return this.environmental.deleteEmailVerificationCode(email);
  }

  // ============================================================================
  // ANALYTICS DOMAIN
  // ============================================================================

  async trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    return this.analytics.trackEvent(event);
  }

  async getEventsByUser(userId: string): Promise<AnalyticsEvent[]> {
    return this.analytics.getEventsByUser(userId);
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    return this.analytics.getEventsBySession(sessionId);
  }

  async getFunnelStats(startDate?: string, endDate?: string): Promise<{ eventType: string; count: number }[]> {
    return this.analytics.getFunnelStats(startDate, endDate);
  }

  async incrementCustomerJobCount(userId: string): Promise<void> {
    return this.analytics.incrementCustomerJobCount(userId);
  }

  // ============================================================================
  // SMS BOT / AI ASSISTANT DOMAIN
  // ============================================================================

  async getOrCreateSmsConversation(phoneNumber: string) {
    return this.smsBot.getOrCreateSmsConversation(phoneNumber);
  }

  async getSmsConversation(id: string) {
    return this.smsBot.getSmsConversation(id);
  }

  async getSmsConversationByPhone(phoneNumber: string) {
    return this.smsBot.getSmsConversationByPhone(phoneNumber);
  }

  async updateSmsConversation(id: string, updates: any) {
    return this.smsBot.updateSmsConversation(id, updates);
  }

  async createSmsMessage(message: any) {
    return this.smsBot.createSmsMessage(message);
  }

  async getSmsMessage(id: string) {
    return this.smsBot.getSmsMessage(id);
  }

  async getSmsMessagesByConversation(conversationId: string, limit?: number) {
    return this.smsBot.getSmsMessagesByConversation(conversationId, limit);
  }

  async updateSmsMessage(id: string, updates: any) {
    return this.smsBot.updateSmsMessage(id, updates);
  }

  async updateSmsMessageByTwilioSid(twilioMessageSid: string, updates: any) {
    return this.smsBot.updateSmsMessageByTwilioSid(twilioMessageSid, updates);
  }

  // ============================================================================
  // FRESHSPACE HOME CLEANING DOMAIN
  // ============================================================================

  async createCleaningChecklist(checklist: any) {
    return this.freshSpace.createCleaningChecklist(checklist);
  }

  async getCleaningChecklistsByRequest(serviceRequestId: string) {
    return this.freshSpace.getCleaningChecklistsByRequest(serviceRequestId);
  }

  async updateCleaningChecklistTask(id: string, updates: any) {
    return this.freshSpace.updateCleaningChecklistTask(id, updates);
  }

  async bulkCreateCleaningChecklists(checklists: any[]) {
    return this.freshSpace.bulkCreateCleaningChecklists(checklists);
  }

  async createRecurringSubscription(subscription: any) {
    return this.freshSpace.createRecurringSubscription(subscription);
  }

  async getRecurringSubscription(id: string) {
    return this.freshSpace.getRecurringSubscription(id);
  }

  async getCustomerSubscriptions(customerId: string) {
    return this.freshSpace.getCustomerSubscriptions(customerId);
  }

  async updateRecurringSubscription(id: string, updates: any) {
    return this.freshSpace.updateRecurringSubscription(id, updates);
  }

  async getActiveSubscriptionsDueForBooking(date: string) {
    return this.freshSpace.getActiveSubscriptionsDueForBooking(date);
  }

  // ============================================================================
  // SEED DATA
  // ============================================================================

  async seedInitialData(): Promise<void> {
    // Seed initial data would be implemented here
    // For now, this is a placeholder that can be expanded as needed
  }
}
