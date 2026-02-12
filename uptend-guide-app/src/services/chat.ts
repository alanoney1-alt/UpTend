import { request } from './api';

export interface ChatResponse {
  message?: string;
  text?: string;
  type?: string;
  data?: any;
  quote?: any;
  property?: any;
}

export const sendBudMessage = (message: string): Promise<ChatResponse> =>
  request('POST', '/api/ai/chat', { message, conversationType: 'concierge' });
