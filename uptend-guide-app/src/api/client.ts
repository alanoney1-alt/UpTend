// Legacy client — re-exports from new services layer for backward compatibility
export { setToken, clearToken, getToken } from '../services/api';
export { request } from '../services/api';
export { customerLogin, proLogin, businessLogin, customerRegister, getUser } from '../services/auth';
export { sendChatMessage as guideChat, sendGeorgeMessage as georgeChat } from '../services/chat';

// Legacy aliases kept for any remaining imports
import { uploadForm } from '../services/api';
import { request } from '../services/api';

export const georgePhotoAnalyze = (formData: FormData) =>
  uploadForm('/api/ai/photo-analyze', formData);

export const georgePropertyScan = (address: string) =>
  request('POST', '/api/ai/property-scan', { address });

export const createServiceRequest = (data: any) =>
  request('POST', '/api/service-requests', data);

export const getServiceRequests = () => request('GET', '/api/service-requests');
