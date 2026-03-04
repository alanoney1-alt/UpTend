/**
 * George Tools - B2B Domain
 * Property management, HOA, government, portfolio analytics
 */
export {
  // Portfolio Analytics
  getPortfolioAnalytics,
  getPortfolioHealthRollup,
  getAssignedCrew,
  getVendorScorecard,
  getBillingHistory,
  getComplianceStatus,
  generateROIReport,
  generatePortfolioIntelligence,
  predictBudgetVariance,

  // HOA
  getCustomerHOA,
  reportHOARule,
  generateHoaPricingSchedule,

  // Drone Scan
  bookDroneScan,
  getDroneScanStatus,

  // Insurance Claims
  startInsuranceClaim,

  // Morning Briefing (B2B version)
  getMorningBriefingTool,

  // Property management
  checkPropertyContract,
  lookupProperty,
  lookupResident,
  listPortfolioProperties,
  getPortfolioWorkOrders,
  generateSpendReport,
  getPropertyServiceHistory,
  getPropertiesNeedingAttention,
  generateMorningBriefing,
  checkBudgetStatus,
  logTenantSatisfaction,
  getPortfolioSatisfaction,
  generateMaintenanceForecast,
  getVendorPerformance,
  manageTurnover,
  setBudget,

  // Bulk scheduling
  scheduleBulkService,

  // Regulatory compliance
  checkRegulatoryCompliance,
  generateVendorScorecard,
} from "../george-tools";
