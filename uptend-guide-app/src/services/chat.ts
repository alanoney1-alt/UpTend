import { request } from './api';

export interface ChatResponse {
  response: string;
  reply?: string;
  message?: string;
  text?: string;
  type?: string;
  data?: any;
  quote?: any;
  property?: any;
  toolResults?: any[];
  quickActions?: string[];
  videoIds?: string[];
  products?: any[];
}

export const sendGeorgeMessage = (
  message: string,
  options?: { sessionId?: string; page?: string; userRole?: string },
): Promise<ChatResponse> =>
  request('POST', '/api/ai/guide/chat', {
    message,
    sessionId: options?.sessionId,
    page: options?.page || 'mobile-app',
    userRole: options?.userRole || 'customer',
  });

export const sendChatMessage = (
  message: string,
  options?: Record<string, any>,
): Promise<ChatResponse> =>
  request('POST', '/api/ai/guide/chat', { message, ...options });
