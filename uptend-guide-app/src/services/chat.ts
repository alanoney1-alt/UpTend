import { request } from './api';

export interface ChatResponse {
  response: string;
  toolResults?: any[];
}

export const sendGeorgeMessage = (message: string): Promise<ChatResponse> =>
  request('POST', '/api/ai/concierge/chat', { message });
