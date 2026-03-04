-- Migration 0022: Enable RLS on all 32 unprotected tables + add service_role policies
-- This locks down direct Supabase API access while keeping the backend (postgres role) unaffected

-- 1. Enable RLS on all 32 tables
ALTER TABLE public.b2b_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_outreach_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builder_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partner_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partner_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_discount_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.george_relationship_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_customer_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_network_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_tracking_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snap_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_cures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.w2_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.w2_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

-- 2. Add service_role_all policies (allows backend full access)
CREATE POLICY service_role_all ON public.b2b_budgets FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.b2b_outreach_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.builder_handoffs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.business_partner_employees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.business_partner_rates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.business_partners FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.community_guidelines FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.crew_property_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.discovery_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.founding_discount_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.founding_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.george_relationship_memory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_call_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_customer_registry FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_network_members FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_onboarding FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_route_plans FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.partner_tracking_numbers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.quality_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.recurring_job_schedules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.scheduled_batches FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.snap_quotes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.violation_cures FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.violation_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.violation_records FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.w2_crews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.w2_time_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.warranties FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON public.warranty_claims FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Fix function search path (mutable search path vulnerability)
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_updated_at_metadata() SET search_path = public;
