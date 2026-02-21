import * as SecureStore from 'expo-secure-store';
import config from '../config';

const BASE = config.API_BASE_URL;
const TOKEN_KEY = 'uptend_jwt_token';

// ─── Token Management (SecureStore) ───────────────────
let _cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;
  try {
    _cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch { _cachedToken = null; }
  return _cachedToken;
}

export async function setToken(token: string): Promise<void> {
  _cachedToken = token;
  try { await SecureStore.setItemAsync(TOKEN_KEY, token); } catch {}
}

export async function clearToken(): Promise<void> {
  _cachedToken = null;
  try { await SecureStore.deleteItemAsync(TOKEN_KEY); } catch {}
}

// ─── Logout callback (set by AuthContext to clear state on 401) ───
let _onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: (() => void) | null) {
  _onUnauthorized = cb;
}

// ─── Generic fetch helper with auth ───────────────────
export async function apiFetch(path: string, options?: RequestInit) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401 && _onUnauthorized) {
    _onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    let msg = `API ${res.status}: ${path}`;
    try { const body = await res.json(); msg = body.message || body.error || msg; } catch {}
    throw new Error(msg);
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// ─── request() helper (method, path, body) ────────────
export async function request(method: string, path: string, body?: any): Promise<any> {
  return apiFetch(path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ─── Multipart upload helper ──────────────────────────
export async function uploadForm(path: string, formData: FormData): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (res.status === 401 && _onUnauthorized) {
    _onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }
  if (!res.ok) {
    let msg = `API ${res.status}: ${path}`;
    try { const b = await res.json(); msg = b.message || b.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Pro / Map ────────────────────────────────────────
export async function fetchNearbyPros(lat = 28.495, lng = -81.36, radius = 30) {
  return apiFetch(`/api/pros/active-nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
}

export async function fetchProById(proId: string) {
  return apiFetch(`/api/find-pro?id=${proId}`);
}

// ─── Jobs / Bookings ──────────────────────────────────
export async function fetchMyBookings() {
  return apiFetch('/api/service-requests');
}

export async function fetchJobById(jobId: string) {
  return apiFetch(`/api/service-requests/${jobId}`);
}

export async function fetchAvailableJobs() {
  return apiFetch('/api/hauler/available-jobs');
}

// ─── Pro Dashboard ────────────────────────────────────
export async function fetchProDashboard() {
  return apiFetch('/api/hauler/dashboard');
}

export async function fetchProEarnings() {
  return apiFetch('/api/hauler/earnings');
}

export async function fetchProCertifications() {
  return apiFetch('/api/hauler/certifications');
}

// ─── Customer Data ────────────────────────────────────
export async function fetchCustomerCRM() {
  return apiFetch('/api/business/customers');
}

// ─── Home / Health ────────────────────────────────────
export async function fetchHomeHealth() {
  return apiFetch('/api/home-scan/health');
}

export async function fetchHomeStreaks() {
  return apiFetch('/api/home-scan/streaks');
}

export async function fetchHomeScanReport(scanId: string) {
  return apiFetch(`/api/home-scan/report/${scanId}`);
}

// ─── Subscriptions ────────────────────────────────────
export async function fetchActiveSubscriptions() {
  return apiFetch('/api/subscriptions/active');
}

// ─── Loyalty ──────────────────────────────────────────
export async function fetchLoyaltyStatus() {
  return apiFetch('/api/loyalty/status');
}

// ─── Community ────────────────────────────────────────
export async function fetchCommunityFeed() {
  return apiFetch('/api/community/feed');
}

// ─── Pricing ──────────────────────────────────────────
export async function fetchPricingQuote(service: string, details: Record<string, any>) {
  return apiFetch('/api/pricing/quote', {
    method: 'POST',
    body: JSON.stringify({ service, ...details }),
  });
}

// ─── Service Requests ─────────────────────────────────
export async function createServiceRequest(data: any) {
  return request('POST', '/api/service-requests', data);
}

// ─── User Profile ─────────────────────────────────────
export async function fetchCurrentUser() {
  return apiFetch('/api/auth/user');
}

export async function updateUserProfile(data: any) {
  return request('PUT', '/api/auth/user', data);
}

// ─── Home Scan ────────────────────────────────────────
export async function analyzeRoom(formData: FormData) {
  return uploadForm('/api/ai/analyze-room', formData);
}

// ─── B2B Dashboard ────────────────────────────────────
export async function fetchB2BDashboard() {
  return apiFetch('/api/business/dashboard');
}

export async function fetchB2BProperties() {
  return apiFetch('/api/business/properties');
}

export async function fetchB2BServices() {
  return apiFetch('/api/business/services');
}

export async function fetchB2BPreferredPros() {
  return apiFetch('/api/business/preferred-pros');
}

export async function fetchB2BInvoices() {
  return apiFetch('/api/business/invoices');
}

export async function fetchB2BSpending() {
  return apiFetch('/api/business/spending');
}

// ─── Property Management ──────────────────────────────
export async function fetchPortfolios() {
  return apiFetch('/api/business/portfolios');
}

export async function fetchPropertyUnits() {
  return apiFetch('/api/business/units');
}

export async function fetchWorkOrders() {
  return apiFetch('/api/business/work-orders');
}

export async function createWorkOrder(data: any) {
  return request('POST', '/api/business/work-orders', data);
}

export async function fetchTurnovers() {
  return apiFetch('/api/business/turnovers');
}

export async function fetchSLAMetrics() {
  return apiFetch('/api/business/sla-metrics');
}

// ─── HOA Community ────────────────────────────────────
export async function fetchHOACommunities() {
  return apiFetch('/api/business/hoa/communities');
}

export async function fetchHOAViolations() {
  return apiFetch('/api/business/hoa/violations');
}

export async function fetchHOAApprovals() {
  return apiFetch('/api/business/hoa/approvals');
}

export async function voteHOAApproval(id: string, vote: 'approve' | 'reject') {
  return request('POST', `/api/business/hoa/approvals/${id}/vote`, { vote });
}

export async function fetchHOACalendar() {
  return apiFetch('/api/business/hoa/calendar');
}

export async function fetchHOAReserves() {
  return apiFetch('/api/business/hoa/reserves');
}

// ─── Government Contracts ─────────────────────────────
export async function fetchGovBids() {
  return apiFetch('/api/business/gov/bids');
}

export async function fetchGovSAMStatus() {
  return apiFetch('/api/business/gov/sam-status');
}

export async function fetchPrevailingWages() {
  return apiFetch('/api/business/gov/prevailing-wages');
}

export async function fetchPayrollRecords() {
  return apiFetch('/api/business/gov/payroll');
}

export async function fetchDBETracking() {
  return apiFetch('/api/business/gov/dbe');
}

export async function fetchFEMAPool() {
  return apiFetch('/api/business/gov/fema-pool');
}

// ─── Compliance ───────────────────────────────────────
export async function fetchCOIVault() {
  return apiFetch('/api/business/compliance/coi');
}

export async function fetchComplianceDocs() {
  return apiFetch('/api/business/compliance/documents');
}

export async function fetchBackgroundChecks() {
  return apiFetch('/api/business/compliance/background-checks');
}

// ─── Construction ─────────────────────────────────────
export async function fetchPunchLists() {
  return apiFetch('/api/business/construction/punch-lists');
}

export async function fetchPunchItems(punchListId: string) {
  return apiFetch(`/api/business/construction/punch-lists/${punchListId}/items`);
}

export async function fetchLienWaivers() {
  return apiFetch('/api/business/construction/lien-waivers');
}

export async function fetchPermits() {
  return apiFetch('/api/business/construction/permits');
}

// ─── Veteran ──────────────────────────────────────────
export async function fetchVeteranOnboarding() {
  return apiFetch('/api/veteran/onboarding');
}

export async function fetchMOSMappings() {
  return apiFetch('/api/veteran/mos-mappings');
}

export async function fetchVeteranBenefits() {
  return apiFetch('/api/veteran/benefits');
}

export async function fetchVeteranMentors() {
  return apiFetch('/api/veteran/mentors');
}

export async function fetchActiveMentorships() {
  return apiFetch('/api/veteran/mentorships');
}

export async function fetchSpouseProgram() {
  return apiFetch('/api/veteran/spouse-program');
}

export async function requestMentor(mentorId: string) {
  return request('POST', '/api/veteran/mentors/request', { mentorId });
}

// ─── Report Builder ───────────────────────────────────
export async function fetchReportTemplates() {
  return apiFetch('/api/business/reports/templates');
}

export async function fetchSavedReports() {
  return apiFetch('/api/business/reports/saved');
}

export async function generateReport(data: any) {
  return request('POST', '/api/business/reports/generate', data);
}

// ─── Invoicing ────────────────────────────────────────
export async function fetchInvoices() {
  return apiFetch('/api/business/invoices');
}

export async function fetchInvoiceDetail(id: string) {
  return apiFetch(`/api/business/invoices/${id}`);
}

export async function createInvoice(data: any) {
  return request('POST', '/api/business/invoices', data);
}

export async function markInvoicePaid(id: string) {
  return request('PUT', `/api/business/invoices/${id}/paid`);
}

// ─── White Label ──────────────────────────────────────
export async function fetchWhiteLabelPortals() {
  return apiFetch('/api/business/white-label/portals');
}

export async function fetchWhiteLabelConfig(portalId: string) {
  return apiFetch(`/api/business/white-label/portals/${portalId}`);
}

export async function saveWhiteLabelConfig(data: any) {
  return request('PUT', '/api/business/white-label/config', data);
}

// ─── Business Booking ─────────────────────────────────
export async function fetchBusinessProperties() {
  return apiFetch('/api/business/properties');
}

export async function fetchBusinessServices() {
  return apiFetch('/api/business/services/catalog');
}

export async function createBusinessBooking(data: any) {
  return request('POST', '/api/business/bookings', data);
}

// ─── Academy ──────────────────────────────────────────
export async function fetchAcademyCertifications() {
  return apiFetch('/api/academy/certifications');
}

export async function fetchAcademyCareerLadder() {
  return apiFetch('/api/academy/career-ladder');
}

// ─── Transformation Feed ──────────────────────────────
export async function fetchTransformationFeed(filter?: string) {
  const q = filter && filter !== 'All' ? `?filter=${filter}` : '';
  return apiFetch(`/api/community/transformations${q}`);
}

// ─── Flash Deals ──────────────────────────────────────
export async function fetchFlashDeals(tab?: string) {
  const q = tab ? `?category=${tab}` : '';
  return apiFetch(`/api/deals/flash${q}`);
}

export async function claimFlashDeal(dealId: string) {
  return request('POST', `/api/deals/flash/${dealId}/claim`);
}

// ─── Neighborhood ─────────────────────────────────────
export async function fetchNeighborhoodActivity(lat?: number, lng?: number) {
  const q = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
  return apiFetch(`/api/neighborhood/activity${q}`);
}

export async function fetchNeighborhoodStats() {
  return apiFetch('/api/neighborhood/stats');
}

export async function fetchGroupDeals() {
  return apiFetch('/api/neighborhood/group-deals');
}

export async function joinGroupDeal(dealId: string) {
  return request('POST', `/api/neighborhood/group-deals/${dealId}/join`);
}

export async function fetchLocalPros() {
  return apiFetch('/api/neighborhood/local-pros');
}

// ─── Subscribe / Subscriptions ────────────────────────
export async function fetchSubscriptionPlans() {
  return apiFetch('/api/subscriptions/plans');
}

export async function subscribeToPlan(planId: string) {
  return request('POST', '/api/subscriptions', { planId });
}

// ─── DIY Guides ───────────────────────────────────────
export async function fetchDIYCategories() {
  return apiFetch('/api/diy/categories');
}

export async function fetchDIYGuides(search?: string) {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiFetch(`/api/diy/guides${q}`);
}

// ─── Shopping ─────────────────────────────────────────
export async function fetchShoppingProducts(search?: string) {
  const q = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiFetch(`/api/shopping/products${q}`);
}

export async function fetchPurchaseHistory() {
  return apiFetch('/api/shopping/history');
}

// ─── Smart Home ───────────────────────────────────────
export async function fetchSmartDevices() {
  return apiFetch('/api/smart-home/devices');
}

export async function toggleSmartDeviceAuto(deviceId: string, enabled: boolean) {
  return request('PUT', `/api/smart-home/devices/${deviceId}/auto`, { enabled });
}

// ─── Calendar ─────────────────────────────────────────
export async function fetchServiceCalendar(month?: string) {
  const q = month ? `?month=${month}` : '';
  return apiFetch(`/api/calendar/services${q}`);
}

export async function fetchSuggestedTimes() {
  return apiFetch('/api/calendar/suggested-times');
}

// ─── Photo Timeline ───────────────────────────────────
export async function fetchPhotoTimeline(area?: string) {
  const q = area && area !== 'All' ? `?area=${area}` : '';
  return apiFetch(`/api/home/photo-timeline${q}`);
}

// ─── Live Map ─────────────────────────────────────────
export async function fetchLiveMapStats() {
  return apiFetch('/api/pros/live-stats');
}

// ─── Recruit ──────────────────────────────────────────
export async function fetchRecruits() {
  return apiFetch('/api/recruit/candidates');
}

export async function sendRecruitInvite(candidateId: string) {
  return request('POST', `/api/recruit/candidates/${candidateId}/invite`);
}

export async function scanContactsForPros() {
  return apiFetch('/api/recruit/scan-contacts');
}

// ─── Auto / Vehicles ──────────────────────────────────
export async function fetchVehicles() {
  return apiFetch('/api/auto/vehicles');
}

export async function addVehicle(data: any) {
  return request('POST', '/api/auto/vehicles', data);
}

export async function fetchMaintenanceSchedule() {
  return apiFetch('/api/auto/maintenance');
}

// ─── Location Update (Pro) ────────────────────────────
export async function updateProLocation(lat: number, lng: number) {
  return apiFetch('/api/pros/update-location', {
    method: 'POST',
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  });
}

// ─── Job Actions ──────────────────────────────────────
export async function acceptJob(jobId: string) {
  return apiFetch(`/api/service-requests/${jobId}/accept`, { method: 'POST' });
}

export async function declineJob(jobId: string) {
  return apiFetch(`/api/service-requests/${jobId}/decline`, { method: 'POST' });
}

export async function updateJobStatus(jobId: string, status: string) {
  return apiFetch(`/api/service-requests/${jobId}/status`, { method: 'POST', body: JSON.stringify({ status }) });
}

// ─── Demand / Heatmap ─────────────────────────────────
export async function fetchDemandHeatmap(lat = 28.495, lng = -81.36) {
  return apiFetch(`/api/demand/heatmap?lat=${lat}&lng=${lng}`);
}

export async function fetchSurgePricing() {
  return apiFetch('/api/demand/surge-pricing');
}

// ─── Incidents / Damage ───────────────────────────────
export async function fetchIncidents() {
  return apiFetch('/api/hauler/incidents');
}

export async function createIncident(data: Record<string, any>) {
  return apiFetch('/api/hauler/incidents', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchDamageRecordings() {
  return apiFetch('/api/hauler/damage-recordings');
}

export async function uploadDamageRecording(data: Record<string, any>) {
  return apiFetch('/api/hauler/damage-recordings', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Parts / Materials ────────────────────────────────
export async function fetchPartsRequests(jobId?: string) {
  return apiFetch(`/api/hauler/parts-requests${jobId ? `?jobId=${jobId}` : ''}`);
}

export async function createPartsRequest(data: Record<string, any>) {
  return apiFetch('/api/hauler/parts-requests', { method: 'POST', body: JSON.stringify(data) });
}

export async function updatePartsRequest(id: string, data: Record<string, any>) {
  return apiFetch(`/api/hauler/parts-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function fetchMaterialList(jobId: string) {
  return apiFetch(`/api/hauler/materials/${jobId}`);
}

export async function saveMaterialList(data: Record<string, any>) {
  return apiFetch('/api/hauler/materials', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Scope Measure ────────────────────────────────────
export async function saveScopeMeasurement(data: Record<string, any>) {
  return apiFetch('/api/hauler/scope-measurements', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Reviews ──────────────────────────────────────────
export async function fetchReviews() {
  return apiFetch('/api/hauler/reviews');
}

export async function submitReviewResponse(reviewId: string, response: string) {
  return apiFetch(`/api/hauler/reviews/${reviewId}/respond`, { method: 'POST', body: JSON.stringify({ response }) });
}

// ─── Certifications / SkillUp ─────────────────────────
export async function fetchSkillPrograms() {
  return apiFetch('/api/hauler/skill-programs');
}

export async function enrollSkillProgram(programId: string) {
  return apiFetch(`/api/hauler/skill-programs/${programId}/enroll`, { method: 'POST' });
}

// ─── Scheduler ────────────────────────────────────────
export async function fetchProSchedule() {
  return apiFetch('/api/hauler/schedule');
}

export async function saveProSchedule(schedule: Record<string, any>) {
  return apiFetch('/api/hauler/schedule', { method: 'POST', body: JSON.stringify(schedule) });
}

// ─── Insurance Claims ─────────────────────────────────
export async function submitInsuranceClaim(data: Record<string, any>) {
  return apiFetch('/api/hauler/insurance-claims', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Identity Verification ────────────────────────────
export async function submitIdentityVerification(data: Record<string, any>) {
  return apiFetch('/api/hauler/verify-identity', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Referrals ────────────────────────────────────────
export async function fetchReferrals() {
  return apiFetch('/api/hauler/referrals');
}

// ─── Leaderboard ──────────────────────────────────────
export async function fetchLeaderboard(metric = 'jobs', period = 'month') {
  return apiFetch(`/api/hauler/leaderboard?metric=${metric}&period=${period}`);
}

// ─── Tax Helper ───────────────────────────────────────
export async function fetchTaxSummary() {
  return apiFetch('/api/hauler/tax-summary');
}

// ─── Pro Tips ─────────────────────────────────────────
export async function fetchProTips(category?: string) {
  return apiFetch(`/api/hauler/tips${category && category !== 'all' ? `?category=${category}` : ''}`);
}

// ─── Route Optimization ──────────────────────────────
export async function fetchTodayRoute() {
  return apiFetch('/api/hauler/today-route');
}

export async function optimizeRoute(jobIds: string[]) {
  return apiFetch('/api/hauler/optimize-route', { method: 'POST', body: JSON.stringify({ jobIds }) });
}

export default {
  fetchNearbyPros, fetchProById, fetchMyBookings, fetchJobById,
  fetchAvailableJobs, fetchProDashboard, fetchProEarnings,
  fetchProCertifications, fetchCustomerCRM, fetchHomeHealth,
  fetchHomeStreaks, fetchHomeScanReport, fetchActiveSubscriptions,
  fetchLoyaltyStatus, fetchCommunityFeed, fetchPricingQuote,
  updateProLocation, createServiceRequest, fetchCurrentUser,
  updateUserProfile, analyzeRoom, acceptJob, declineJob,
  updateJobStatus, fetchDemandHeatmap, fetchSurgePricing,
  fetchIncidents, createIncident, fetchDamageRecordings,
  uploadDamageRecording, fetchPartsRequests, createPartsRequest,
  updatePartsRequest, fetchMaterialList, saveMaterialList,
  saveScopeMeasurement, fetchReviews, submitReviewResponse,
  fetchSkillPrograms, enrollSkillProgram, fetchProSchedule,
  saveProSchedule, submitInsuranceClaim, submitIdentityVerification,
  fetchReferrals, fetchLeaderboard, fetchTaxSummary,
  fetchProTips, fetchTodayRoute, optimizeRoute,
};
