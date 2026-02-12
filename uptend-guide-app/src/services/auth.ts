import { request, setToken, clearToken, getToken } from './api';

export { setToken, clearToken, getToken };

export interface LoginResponse {
  token: string;
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

export const customerLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/customers/login', { email, password });

export const customerRegister = (data: RegisterData): Promise<LoginResponse> =>
  request('POST', '/api/customers/register', data);

export const proLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/haulers/login', { email, password });

export const businessLogin = (email: string, password: string): Promise<LoginResponse> =>
  request('POST', '/api/business/login', { email, password });

export const getUser = (): Promise<any> =>
  request('GET', '/api/auth/user');

export const googleOAuthMobile = (idToken: string): Promise<LoginResponse> =>
  request('POST', '/api/auth/google/token', { idToken, role: 'customer' });

export const logout = async (): Promise<void> => {
  await clearToken();
};
