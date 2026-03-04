/**
 * George Tools - Partner Domain
 * Partner onboarding, pro operations, certifications, performance
 */
export {
  // Pro Dashboard & Earnings
  getProDashboard,
  getProEarnings,
  getProSchedule,
  getProGoalProgress,
  getProGoalProgressForGeorge,
  setProGoal,
  suggestProGoal,

  // Pro Certifications
  getProCertifications,
  getCertificationPrograms,
  startCertificationModule,
  submitCertificationQuiz,
  calculateProCertificationROI,

  // Pro Performance
  getProReviews,
  getProCustomerRetention,
  getProCustomerRetentionIntel,
  getProPerformanceAnalytics,
  setProEarningsGoal,
  analyzeProPerformance,

  // Route Optimization
  getRouteOptimization,
  getOptimizedRoute,
  getWeeklyRouteSummaryForGeorge,
  optimizeProSchedule,

  // Pro Market & Demand
  getProMarketInsights,
  getProDemandForecast,
  getProDemandForecastForGeorge,
  forecastProDemand,
  analyzeMarketOpportunity,

  // Pro Recruitment (DIY-to-Pro)
  tool_check_pro_recruitment,
  tool_show_pro_earnings_preview,
  tool_start_pro_application,

  // Pro Job Prompts & Matching
  getProJobPrompts,
  getProJobPromptsForGeorge,
  smartMatchPro,
  checkProAvailability,
  getAvailableProRates,
  submitProSiteReport,

  // Voice & Invoice generation
  generateVoiceInvoice,

  // Service Agreements & Documents
  generateServiceAgreement,
  generateServiceAgreementForGeorge,
  getDocumentStatus,
  getDocumentTrackerForGeorge,
  getComplianceReportForGeorge,

  // Cross-service revenue
  optimizeCrossServiceRevenue,

  // Parts & Supplies
  searchPartsPricing,
  buildPartsListForJob,
  getVendorQuotes,
} from "../george-tools";
