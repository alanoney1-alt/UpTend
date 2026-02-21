import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { useAuth } from '../context/AuthContext';
import {
  registerForPushNotifications,
  handleNotificationReceived,
  handleNotificationResponse,
} from '../services/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const responseListener = useRef<EventSubscription | null>(null);
  const notificationListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    // Register when user is logged in
    if (user?.id) {
      registerForPushNotifications(user.id);
    }

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Notification tap listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
}
