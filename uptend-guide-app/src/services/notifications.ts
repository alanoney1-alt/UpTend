import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getToken } from './api';
import config from '../config';

const API_BASE = config.API_BASE_URL;

// --- Types ---

export type NotificationCategory =
  | 'job_update'
  | 'new_booking'
  | 'message'
  | 'pro_nearby';

export interface NotificationData {
  category?: NotificationCategory;
  jobId?: string;
  bookingId?: string;
  proId?: string;
  [key: string]: any;
}

// --- Navigation reference (set from outside) ---

let _navigationRef: any = null;

export function setNavigationRef(ref: any) {
  _navigationRef = ref;
}

function navigateTo(screen: string, params?: Record<string, any>) {
  if (_navigationRef?.isReady?.()) {
    _navigationRef.navigate(screen, params);
  }
}

// --- Route notification taps to the right screen ---

function routeNotification(data: NotificationData) {
  const category = data?.category;
  switch (category) {
    case 'job_update':
      navigateTo('Jobs', { screen: 'JobsHome' }); // or JobTrackingScreen if standalone
      break;
    case 'new_booking':
      navigateTo('Book', { screen: 'BookingHome' });
      break;
    case 'message':
      navigateTo('Home', { screen: 'GeorgeChat' });
      break;
    case 'pro_nearby':
      navigateTo('FindPro', { screen: 'ProListHome' });
      break;
    default:
      navigateTo('Home', { screen: 'HomeScreen' });
  }
}

// --- Register for push notifications ---

export async function registerForPushNotifications(userId?: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });
  const pushToken = tokenData.data;

  // Register with backend
  try {
    const jwt = await getToken();
    await fetch(`${API_BASE}/api/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
      },
      body: JSON.stringify({
        token: pushToken,
        userId: userId ?? undefined,
        platform: Platform.OS,
      }),
    });
    console.log('Push token registered:', pushToken);
  } catch (err) {
    console.warn('Failed to register push token:', err);
  }

  return pushToken;
}

// --- Handlers ---

export function handleNotificationReceived(notification: Notifications.Notification) {
  // Foreground notification — logged, could show in-app toast
  const data = notification.request.content.data as NotificationData;
  console.log('Notification received (foreground):', data);
}

export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as NotificationData;
  console.log('Notification tapped:', data);
  routeNotification(data);
}
