import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

export async function initializeCapacitor() {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#3B1D5A' });
  } catch (e) {
    console.log('StatusBar not available:', e);
  }

  try {
    await SplashScreen.hide();
  } catch (e) {
    console.log('SplashScreen not available:', e);
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });

  App.addListener('appUrlOpen', (data) => {
    const url = new URL(data.url);
    if (url.pathname) {
      window.location.href = url.pathname;
    }
  });

  if (platform === 'ios') {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  }
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!isNative) return false;
  
  try {
    let permission = await PushNotifications.checkPermissions();
    
    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions();
    }
    
    if (permission.receive === 'granted') {
      await PushNotifications.register();
      
      PushNotifications.addListener('registration', (token) => {
        // Token registered — send to backend for push delivery
        // Do not log token value in production
      });
      
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });
      
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });
      
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        const data = notification.notification.data;
        if (data?.url) {
          window.location.href = data.url;
        }
      });
      
      return true;
    }
    
    return false;
  } catch (e) {
    console.log('Push notifications not available:', e);
    return false;
  }
}

export async function requestLocationPermissions(): Promise<boolean> {
  if (!isNative) return false;
  
  try {
    let permission = await Geolocation.checkPermissions();
    
    if (permission.location === 'prompt') {
      permission = await Geolocation.requestPermissions();
    }
    
    return permission.location === 'granted';
  } catch (e) {
    console.log('Geolocation permissions not available:', e);
    return false;
  }
}

export async function getCurrentPosition() {
  if (!isNative) {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  }
  
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    
    return {
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      },
      timestamp: position.timestamp,
    } as GeolocationPosition;
  } catch (e) {
    console.log('Geolocation error:', e);
    throw e;
  }
}

export async function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative) return;
  
  try {
    const impactStyle = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }[style];
    
    await Haptics.impact({ style: impactStyle });
  } catch (e) {
    console.log('Haptics not available:', e);
  }
}

export async function vibrate() {
  if (!isNative) return;
  
  try {
    await Haptics.vibrate();
  } catch (e) {
    console.log('Haptics not available:', e);
  }
}
