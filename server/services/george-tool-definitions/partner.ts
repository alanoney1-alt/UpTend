/**
 * George Tool Definitions - Partner Domain
 * Pro operations, certifications, performance, route optimization
 */

export const PARTNER_TOOL_NAMES = new Set([
  "get_pro_dashboard",
  "get_pro_earnings",
  "get_pro_schedule",
  "get_pro_goal_progress",
  "set_pro_goal",
  "suggest_pro_goal",
  "get_pro_certifications",
  "get_certification_programs",
  "start_certification_module",
  "submit_certification_quiz",
  "calculate_pro_certification_roi",
  "get_pro_reviews",
  "get_pro_customer_retention",
  "get_pro_customer_retention_intel",
  "get_pro_performance_analytics",
  "set_pro_earnings_goal",
  "analyze_pro_performance",
  "get_route_optimization",
  "get_optimized_route",
  "get_weekly_route_summary",
  "optimize_pro_schedule",
  "get_pro_market_insights",
  "get_pro_demand_forecast",
  "forecast_pro_demand",
  "analyze_market_opportunity",
  "check_pro_recruitment",
  "show_pro_earnings_preview",
  "start_pro_application",
  "get_pro_job_prompts",
  "smart_match_pro",
  "check_pro_availability",
  "get_available_pro_rates",
  "submit_pro_site_report",
  "generate_voice_invoice",
  "generate_service_agreement",
  "get_document_status",
  "get_document_tracker",
  "get_compliance_report",
  "optimize_cross_service_revenue",
  "search_parts_pricing",
  "build_parts_list",
  "get_vendor_quotes",
]);

export function isPartnerTool(name: string): boolean {
  return PARTNER_TOOL_NAMES.has(name);
}
