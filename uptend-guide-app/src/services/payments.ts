import { initPaymentSheet, presentPaymentSheet as stripePresent } from '@stripe/stripe-react-native';
import { getToken } from './api';
import config from '../config';

const BASE = config.API_BASE_URL;

async function authHeaders() {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function createPaymentIntent(amount: number, jobId: string) {
  const res = await fetch(`${BASE}/api/payments/create-intent`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ amount, jobId }),
  });
  if (!res.ok) throw new Error('Failed to create payment intent');
  return res.json() as Promise<{ clientSecret: string; ephemeralKey: string; customerId: string }>;
}

export async function presentPaymentSheet(clientSecret: string, ephemeralKey: string, customerId: string) {
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    customerEphemeralKeySecret: ephemeralKey,
    customerId,
    merchantDisplayName: 'UpTend',
    allowsDelayedPaymentMethods: false,
  });
  if (initError) throw new Error(initError.message);

  const { error } = await stripePresent();
  if (error) throw new Error(error.message);
  return true;
}

export async function saveCard() {
  const res = await fetch(`${BASE}/api/payments/setup-intent`, {
    method: 'POST',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to create setup intent');
  return res.json() as Promise<{ clientSecret: string }>;
}

export async function fetchPaymentMethods() {
  const res = await fetch(`${BASE}/api/payments/methods`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch payment methods');
  return res.json() as Promise<PaymentMethod[]>;
}

export async function fetchPaymentHistory() {
  const res = await fetch(`${BASE}/api/payments/history`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch payment history');
  return res.json() as Promise<PaymentRecord[]>;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  jobId: string;
  createdAt: string;
}
