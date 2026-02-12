import { request } from './api';

export const getSubscriptionCatalog = () =>
  request('GET', '/api/subscriptions/catalog');

export const subscribe = (planId: string, paymentMethodId?: string) =>
  request('POST', '/api/subscriptions', { planId, paymentMethodId });

export const getMySubscriptions = () =>
  request('GET', '/api/subscriptions');

export const cancelSubscription = (id: string) =>
  request('PUT', `/api/subscriptions/${id}/cancel`);
