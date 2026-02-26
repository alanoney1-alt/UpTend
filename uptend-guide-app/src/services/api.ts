import config from '../config';

const BASE = config.API_BASE_URL;

// Generic fetch helper with auth
async function apiFetch(path: string, options?: RequestInit) {
  const token = ''; // TODO: get from auth context/storage
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
import config from '../config';

const BASE = config.API_BASE_URL;

// ─── Token storage (module-level) ──────────────────────
let authToken: string | null = null;

export const setToken = (t: string) => { authToken = t; };
export const clearToken = () => { authToken = null; };
export const getToken = () => authToken;

// ─── Generic request helper (used by chat.ts, auth.ts, etc.) ──
export async function request(
    method: string,
    path: string,
    body?: any,
    isFormData = false,
  ): Promise<any> {
    const headers: Record<string, string> = {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    };
    const res = await fetch(`${BASE}${path}`, {
          method,
          headers,
          body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json();
}

  // ─── Legacy fetch helper (internal use) ────────────────
  async function apiFetch(path: string, options?: RequestInit) {
      const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            ...(options?.headers as Record<string, string> || {}),
      };
      const res = await fetch(`${BASE}${path}`, { ...options, headers });
      if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
      return res.json();
  }

  // ─── Pro / Map ──────────────────────────────────────────
  export async function fetchNearbyPros(lat = 28.495, lng = -81.36, radius = 30) {
      return apiFetch(`/api/pros/active-nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  export async function fetchProById(proId: string) {
      return apiFetch(`/api/find-pro?id=${proId}`);
  }

  // ─── Jobs / Bookings ────────────────────────────────────
  export async function fetchMyBookings() {
      return apiFetch('/api/service-requests');
  }

  export async function fetchJobById(jobId: string) {
      return apiFetch(`/api/service-requests/${jobId}`);
  }

  export async function fetchAvailableJobs() {
      return apiFetch('/api/hauler/available-jobs');
  }

  // ─── Pro Dashboard ──────────────────────────────────────
  export async function fetchProDashboard() {
      return apiFetch('/api/hauler/dashboard');
  }

  export async function fetchProEarnings() {
      return apiFetch('/api/hauler/earnings');
  }

  export async function fetchProCertifications() {
      return apiFetch('/api/hauler/certifications');
  }

  // ─── Customer Data ──────────────────────────────────────
  export async function fetchCustomerCRM() {
      return apiFetch('/api/business/customers');
  }

  // ─── Home / Health ──────────────────────────────────────
  export async function fetchHomeHealth() {
      return apiFetch('/api/home-scan/health');
  }

  export async function fetchHomeStreaks() {
      return apiFetch('/api/home-scan/streaks');
  }

  export async function fetchHomeScanReport(scanId: string) {
      return apiFetch(`/api/home-scan/report/${scanId}`);
  }

  // ─── Subscriptions ──────────────────────────────────────
  export async function fetchActiveSubscriptions() {
      return apiFetch('/api/subscriptions/active');
  }

  // ─── Loyalty ────────────────────────────────────────────
  export async function fetchLoyaltyStatus() {
      return apiFetch('/api/loyalty/status');
  }

  // ─── Community ──────────────────────────────────────────
  export async function fetchCommunityFeed() {
      return apiFetch('/api/community/feed');
  }

  // ─── Pricing ────────────────────────────────────────────
  export async function fetchPricingQuote(service: string, details: Record<string, any>) {
      return apiFetch('/api/pricing/quote', {
            method: 'POST',
            body: JSON.stringify({ service, ...details }),
      });
  }

  // ─── Location Update (Pro) ──────────────────────────────
  export async function updateProLocation(lat: number, lng: number) {
      return apiFetch('/api/pros/update-location', {
            method: 'POST',
            body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
  }

  export default {
      fetchNearbyPros,
      fetchProById,
      fetchMyBookings,
      fetchJobById,
      fetchAvailableJobs,
      fetchProDashboard,
      fetchProEarnings,
      fetchProCertifications,
      fetchCustomerCRM,
      fetchHomeHealth,
      fetchHomeStreaks,
      fetchHomeScanReport,
      fetchActiveSubscriptions,
      fetchLoyaltyStatus,
      fetchCommunityFeed,
      fetchPricingQuote,
      updateProLocation,
  };
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

// ─── Location Update (Pro) ────────────────────────────
export async function updateProLocation(lat: number, lng: number) {
  return apiFetch('/api/pros/update-location', {
    method: 'POST',
    body: JSON.stringify({ latitude: lat, longitude: lng }),
  });
}

export default {
  fetchNearbyPros, fetchProById, fetchMyBookings, fetchJobById,
  fetchAvailableJobs, fetchProDashboard, fetchProEarnings,
  fetchProCertifications, fetchCustomerCRM, fetchHomeHealth,
  fetchHomeStreaks, fetchHomeScanReport, fetchActiveSubscriptions,
  fetchLoyaltyStatus, fetchCommunityFeed, fetchPricingQuote,
  updateProLocation,
};
