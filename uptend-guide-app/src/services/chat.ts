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
}

export const sendGeorgeMessage = (message: string): Promise<ChatResponse> =>
  request('POST', '/api/ai/concierge/chat', { message });

export const sendChatMessage = (message: string, options?: Record<string, any>): Promise<ChatResponse> =>
  request('POST', '/api/ai/concierge/chat', { message, ...options });
