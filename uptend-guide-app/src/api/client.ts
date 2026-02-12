// Legacy client — re-exports from new services layer for backward compatibility
export { setToken, clearToken, getToken } from '../services/api';
export { request } from '../services/api';
export { customerLogin, proLogin, businessLogin, customerRegister, getUser } from '../services/auth';
export { sendBudMessage as guideChat } from '../services/chat';

// Legacy aliases kept for any remaining imports
import { request } from '../services/api';

export const guidePhotoAnalyze = (formData: FormData) =>
  request('POST', '/api/ai/guide/photo-analyze', formData, true);

export const guidePropertyScan = (address: string) =>
  request('POST', '/api/ai/guide/property-scan', { address });

export const createServiceRequest = (data: any) =>
  request('POST', '/api/service-requests', data);

export const getServiceRequests = () => request('GET', '/api/service-requests');
