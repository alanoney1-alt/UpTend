/**
 * George Tool Definitions - B2B Domain
 * Property management, HOA, government, portfolio analytics
 */

export const B2B_TOOL_NAMES = new Set([
  "check_property_contract",
  "get_portfolio_analytics",
  "get_portfolio_health_rollup",
  "get_assigned_crew",
  "get_vendor_scorecard",
  "get_billing_history",
  "get_compliance_status",
  "generate_roi_report",
  "generate_portfolio_intelligence",
  "predict_budget_variance",
  "get_customer_hoa",
  "report_hoa_rule",
  "generate_hoa_pricing_schedule",
  "book_drone_scan",
  "get_drone_scan_status",
  "start_insurance_claim",
  "get_morning_briefing_tool",
  "lookup_property",
  "lookup_resident",
  "list_portfolio_properties",
  "get_portfolio_work_orders",
  "generate_spend_report",
  "get_property_service_history",
  "get_properties_needing_attention",
  "generate_morning_briefing",
  "check_budget_status",
  "log_tenant_satisfaction",
  "get_portfolio_satisfaction",
  "generate_maintenance_forecast",
  "get_vendor_performance",
  "manage_turnover",
  "set_budget",
  "schedule_bulk_service",
  "check_regulatory_compliance",
  "generate_vendor_scorecard_report",
]);

export function isB2BTool(name: string): boolean {
  return B2B_TOOL_NAMES.has(name);
}
