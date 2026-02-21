import * as SecureStore from 'expo-secure-store';
import { request, setToken, clearToken, getToken } from './api';

export { setToken, clearToken, getToken };

const USER_KEY = 'uptend_user';

export interface LoginResponse {
  token?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    [key: string]: any;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  smsOptIn?: boolean;
}

// ─── Auth methods ─────────────────────────────────────

export const customerLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/customers/login', { email, password });

export const customerRegister = (data: RegisterData): Promise<LoginResponse> =>
  request('POST', '/api/customers/register', {
    email: data.email,
    password: data.password,
    name: `${data.firstName} ${data.lastName}`.trim(),
    phone: data.phone,
  });

export const proLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/haulers/login', { email, password });

export const businessLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/business/login', { email, password });

export const getUser = (): Promise<any> =>
  request('GET', '/api/auth/user');

export const googleOAuthMobile = (idToken: string): Promise<LoginResponse> =>
  request('POST', '/api/auth/google/token', { idToken, role: 'customer' });

// ─── Login (unified) ─────────────────────────────────
export async function login(
  email: string,
  password: string,
  role: 'customer' | 'pro' | 'business',
): Promise<LoginResponse> {
  const fn = role === 'pro' ? proLogin : role === 'business' ? businessLogin : customerLogin;
  const res = await fn(email, password);
  if (res.token) {
    await setToken(res.token);
  }
  if (res.user) {
    await storeUser(res.user);
  }
  return res;
}

// ─── Register ─────────────────────────────────────────
export async function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
): Promise<LoginResponse> {
  const [firstName, ...lastParts] = name.split(' ');
  const lastName = lastParts.join(' ');
  const res = await customerRegister({ email, password, firstName, lastName, phone });
  if (res.token) {
    await setToken(res.token);
  }
  if (res.user) {
    await storeUser(res.user);
  }
  return res;
}

// ─── Logout ───────────────────────────────────────────
export async function logout(): Promise<void> {
  await clearToken();
  try { await SecureStore.deleteItemAsync(USER_KEY); } catch {}
}

// ─── Stored auth (for app launch) ─────────────────────
export async function getStoredAuth(): Promise<{ token: string; user: any } | null> {
  try {
    const token = await getToken();
    if (!token) return null;
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    return { token, user };
  } catch {
    return null;
  }
}

// ─── Store user in SecureStore ────────────────────────
async function storeUser(user: any): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch {}
}

// ─── Refresh token (if backend supports) ──────────────
export async function refreshToken(): Promise<string | null> {
  try {
    const res = await request('POST', '/api/auth/refresh');
    if (res?.token) {
      await setToken(res.token);
      return res.token;
    }
  } catch {}
  return null;
}

// ─── Quick auth check ─────────────────────────────────
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
