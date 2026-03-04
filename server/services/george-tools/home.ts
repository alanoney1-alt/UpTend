/**
 * George Tools - Home Domain
 * Home profile, maintenance, scans, warranties, smart home, appliances
 */
export {
  // Home Profile
  getHomeProfile,
  getHomeDashboard,
  getHomeOSDashboardForGeorge,
  getTonightChecklistForGeorge,

  // Home Memory
  saveHomeMemory,
  getHomeMemories,

  // Maintenance
  getMaintenanceSchedule,
  getHomeMaintenanceReminders,
  addCustomReminder,
  setHomeReminderForGeorge,
  getMaintenanceDueForGeorge,
  logDIYMaintenance,
  generateSeasonalCareplan,
  generateHomeTimeline,
  predict_maintenance_needs,

  // Home Scan
  startHomeScan,
  processHomeScanPhoto,
  getHomeScanProgress,

  // Wallet & Warranty
  getWalletBalance,
  getWarrantyTracker,
  updateAppliancePurchaseDate,
  getWarrantyDashboard,
  registerWarranty,

  // Appliance Info
  getGarageDoorInfo,
  getWaterHeaterInfo,

  // Smart Home
  getSmartHomeStatus,
  connectSmartHome,
  getSmartHomeOAuthStatus,
  assessSmartHomeIntegration,

  // Home Value & Property
  getHomeValueEstimate,
  scanPropertyAddress,
  getCustomerAddress,

  // Service History
  getServiceHistory,

  // Utilities
  getUtilityProvidersForGeorge,
  getSprinklerSettingsForGeorge,
  updateSprinklerZoneForGeorge,
  getWaterRestrictionsForGeorge,

  // Purchase History
  getPurchaseHistory,
  connectRetailerAccount,

  // Home Health
  calculate_home_health_score,
  predictHomeHealthScore,

  // Insurance
  generateInsuranceClaimAssist,
  analyze_contractor_quote,
  get_market_rate,
} from "../george-tools";
