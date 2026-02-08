export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registered:', registration.scope);
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available; please refresh.');
              }
            });
          }
        });
      } catch (error) {
        console.log('ServiceWorker registration failed:', error);
      }
    });
  }
}

export function checkInstallPrompt(callback: (event: BeforeInstallPromptEvent) => void) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    callback(e as BeforeInstallPromptEvent);
  });
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches 
    || (window.navigator as any).standalone === true;
}

export function isPWAInstalled(): boolean {
  return isStandalone() || document.referrer.includes('android-app://');
}
