import * as SecureStore from 'expo-secure-store';

const BASE_URL = __DEV__ ? 'http://localhost:5000' : 'https://api.uptend.com';
const TOKEN_KEY = 'uptend_auth_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
  isFormData = false,
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Auth
export const customerLogin = (email: string, password: string) =>
  request('POST', '/api/customers/login', { email, password });

export const proLogin = (email: string, password: string) =>
  request('POST', '/api/haulers/login', { email, password });

export const businessLogin = (email: string, password: string) =>
  request('POST', '/api/business/login', { email, password });

export const customerRegister = (data: any) =>
  request('POST', '/api/customers/register', data);

export const proRegister = (data: any) =>
  request('POST', '/api/haulers/register', data);

export const getUser = () => request('GET', '/api/auth/user');

// Guide AI
export const guideChat = (message: string, context?: any) =>
  request('POST', '/api/ai/guide/chat', { message, ...context });

export const guidePhotoAnalyze = (formData: FormData) =>
  request('POST', '/api/ai/guide/photo-analyze', formData, true);

export const guidePropertyScan = (address: string) =>
  request('POST', '/api/ai/guide/property-scan', { address });

export const guideVerifyReceipt = (formData: FormData) =>
  request('POST', '/api/ai/guide/verify-receipt', formData, true);

export const guideLockQuote = (quoteId: string) =>
  request('POST', '/api/ai/guide/lock-quote', { quoteId });

export const guideBundleEstimate = (services: string[]) =>
  request('POST', '/api/ai/guide/bundle-estimate', { services });

export const guideHistory = () => request('GET', '/api/ai/guide/history');

export const guideConfirmPool = (poolId: string) =>
  request('POST', '/api/ai/guide/confirm-pool', { poolId });

// Service Requests
export const createServiceRequest = (data: any) =>
  request('POST', '/api/service-requests', data);

export const getServiceRequests = () => request('GET', '/api/service-requests');
