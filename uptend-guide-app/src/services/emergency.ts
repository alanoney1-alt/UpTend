import { request } from './api';

export interface EmergencyRequestData {
  emergencyType: string;
  description: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

export const createEmergencyRequest = (data: EmergencyRequestData) =>
  request('POST', '/api/emergency/request', data);

export const getEmergencyStatus = (id: string) =>
  request('GET', `/api/emergency/request/${id}`);
