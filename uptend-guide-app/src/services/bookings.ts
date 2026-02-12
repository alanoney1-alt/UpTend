import { request } from './api';

export interface CreateBookingData {
  serviceType: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  photos?: string[];
  [key: string]: any;
}

export const createBooking = (data: CreateBookingData) =>
  request('POST', '/api/service-requests', data);

export const getMyBookings = () =>
  request('GET', '/api/service-requests');

export const getBookingStatus = (id: string) =>
  request('GET', `/api/service-requests/${id}`);

export const cancelBooking = (id: string) =>
  request('PUT', `/api/service-requests/${id}/cancel`);
