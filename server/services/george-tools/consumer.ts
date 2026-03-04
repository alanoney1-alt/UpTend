/**
 * George Tools - Consumer Domain
 * Booking, quoting, DIY, products, shopping, loyalty, referrals
 */
export {
  // Pricing & Quoting
  getServicePricingFromEngine,
  getServicePricing,
  calculateQuoteFromEngine,
  calculateQuote,
  getBundleOptionsFromEngine,
  getBundleOptions,
  checkAvailability,
  createBookingDraft,
  getAllServices,

  // Customer Jobs & Dashboard
  getCustomerJobs,
  getCustomerLoyaltyStatus,
  getReferralStatus,
  getCustomerMilestones,
  getMorningBriefing,
  getSpendingTracker,

  // Booking & Payment
  sendBookingConfirmationTool,
  generatePaymentLink,
  cancelBooking,
  rescheduleBooking,
  getProArrivalInfo,
  getProLiveLocation,
  addToCalendar,

  // DIY & Products
  getDIYTipForGeorge,
  getDIYvsProForGeorge,
  getSeasonalDIYTipsForGeorge,
  get_diy_guide,
  get_step_by_step_walkthrough,
  startDIYProjectForGeorge,
  getSeasonalDIYSuggestionsForGeorge,
  tool_log_diy_completion,

  // Shopping & Products
  searchProductsForGeorge,
  getProductRecommendationForGeorge,
  comparePricesForGeorge,
  findDIYTutorialForGeorge,
  getNextTutorialVideoForGeorge,
  getShoppingListForGeorge,
  getDIYShoppingList,

  // Loyalty & Referrals
  getCustomerLoyaltyStatusForGeorge,
  getAvailableRewardsForGeorge,
  redeemRewardForGeorge,
  getReferralCode,
  getReferralStatusForGeorge,

  // Neighborhood & Community
  getNeighborhoodInsights,
  getNeighborhoodInsightsForGeorge,
  getNeighborhoodGroupDeals,
  createGroupDealForGeorge,
  getNeighborhoodDealsForGeorge,
  getNeighborhoodActivityForGeorge,
  getLocalEventsForGeorge,
  getNeighborhoodActivity,
  getLocalEvents,
  submitNeighborhoodTip,
  get_neighborhood_insights_v2,
  find_neighbor_bundles,
  get_local_alerts,

  // Communication
  sendEmailToCustomer,
  callCustomer,
  getCallStatusTool,
  sendQuotePdf,
  sendWhatsAppMessage,
  sendPushNotificationToCustomer,

  // Rebooking & Deals
  getRebookingSuggestions,
  getNearbyProDeals,
  getMultiProQuotes,
  applySaveDiscount,

  // Photo & Receipt Analysis
  analyzePhotoInChat,
  diagnoseFromPhoto,
  scanReceipt,
  scanReceiptPhoto,

  // Emergency & Disaster
  getStormPrepChecklist,
  generateClaimDocumentation,
  getDisasterModeStatus,
  getEmergencyPros,
  activate_emergency_mode,
  generate_insurance_claim_packet,
  get_emergency_shutoff_guide,
  getStormPrepChecklistTool,
  createEmergencyDispatchTool,

  // Pests & Water Damage
  identify_pest,
  assess_water_damage,

  // Seasonal
  getSeasonalRecommendations,
  getSeasonalCountdown,
  getHomeTips,

  // Auto / Vehicle
  addVehicleToProfile,
  lookupVIN,
  getVehicleMaintenanceSchedule,
  logVehicleMaintenance,
  getVehicleMaintenanceDue,
  diagnoseCarIssue,
  searchAutoPartsForGeorge,
  findAutoTutorial,
  getOBDCode,
  estimateAutoRepairCost,
  tool_vehicle_add,
  tool_vehicle_diagnose,
  tool_vehicle_parts_search,
  tool_vehicle_diy_start,
  tool_vehicle_recall_check,
  tool_vehicle_maintenance_log,
  tool_vehicle_maintenance_due,

  // Dynamic bundles & service suggestions
  suggestDynamicServiceBundle,
  getSeasonalDemandForGeorge,

  // Consent
  checkUserConsent,
  requestConsent,
  getNextPassiveQuestion,

  // Misc
  getTrashScheduleInfo,
  getTrashScheduleForGeorge,
  getRecyclingScheduleForGeorge,
  getPostBookingQuestion,
  getPostBookingQuestionForGeorge,
  getWeatherAlerts,
  getWeather,
  getCalendarSuggestion,
  getMaintenanceGameStatus,
} from "../george-tools";
