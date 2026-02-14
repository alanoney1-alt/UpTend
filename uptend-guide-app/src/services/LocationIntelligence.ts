import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const LOCATION_TASK = 'UPTEND_BACKGROUND_LOCATION';

// Known home improvement store chains for geofencing
const STORE_CHAINS = [
  { name: 'Home Depot', keyword: 'home depot' },
  { name: "Lowe's", keyword: 'lowes' },
  { name: 'Ace Hardware', keyword: 'ace hardware' },
  { name: 'Menards', keyword: 'menards' },
];

interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

interface LocationSuggestion {
  store: string;
  services: string[];
  message: string;
}

// Suggestions based on store proximity
const STORE_SUGGESTIONS: Record<string, LocationSuggestion> = {
  'home depot': {
    store: 'Home Depot',
    services: ['Handyman', 'Assembly', 'Installation'],
    message: "At Home Depot? 🔨 Skip the DIY — UpTend pros can handle it! Want a handyman quote?",
  },
  'lowes': {
    store: "Lowe's",
    services: ['Installation', 'Plumbing', 'Electrical'],
    message: "Shopping at Lowe's? 🛒 Our pros can install whatever you buy. Get an instant quote!",
  },
  'ace hardware': {
    store: 'Ace Hardware',
    services: ['Handyman', 'Repair'],
    message: "At Ace Hardware? 🔧 Let UpTend handle the project — we'll do the work while you relax.",
  },
  'menards': {
    store: 'Menards',
    services: ['Handyman', 'Assembly', 'Installation'],
    message: "At Menards? Save more with UpTend pros handling the installation!",
  },
};

class LocationIntelligenceService {
  private static instance: LocationIntelligenceService;
  private isTracking = false;
  private geofences: GeofenceRegion[] = [];

  static getInstance(): LocationIntelligenceService {
    if (!this.instance) this.instance = new LocationIntelligenceService();
    return this.instance;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === 'granted';
  }

  async startBackgroundTracking(): Promise<void> {
    if (this.isTracking) return;
    const granted = await this.requestPermissions();
    if (!granted) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5 * 60 * 1000, // every 5 minutes
      distanceInterval: 100, // or every 100 meters
      deferredUpdatesInterval: 5 * 60 * 1000,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: 'UpTend George',
        notificationBody: 'Watching for service opportunities nearby',
        notificationColor: '#F47C20',
      },
    });
    this.isTracking = true;
  }

  async stopBackgroundTracking(): Promise<void> {
    if (!this.isTracking) return;
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    this.isTracking = false;
  }

  async setupGeofences(storeLocations: GeofenceRegion[]): Promise<void> {
    this.geofences = storeLocations;
    await Location.startGeofencingAsync(
      'UPTEND_GEOFENCE',
      storeLocations.map((g) => ({
        ...g,
        notifyOnEnter: true,
        notifyOnExit: false,
      }))
    );
  }

  getSuggestionForStore(storeName: string): LocationSuggestion | null {
    const key = storeName.toLowerCase();
    for (const [keyword, suggestion] of Object.entries(STORE_SUGGESTIONS)) {
      if (key.includes(keyword)) return suggestion;
    }
    return null;
  }

  async sendProximitySuggestion(storeName: string): Promise<void> {
    const suggestion = this.getSuggestionForStore(storeName);
    if (!suggestion) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Near ${suggestion.store}?`,
        body: suggestion.message,
        data: { type: 'store_proximity', services: suggestion.services },
      },
      trigger: null, // immediate
    });
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    } catch {
      return null;
    }
  }

  // Check if user is at home (within radius of saved home address)
  isNearHome(
    current: { latitude: number; longitude: number },
    home: { latitude: number; longitude: number },
    radiusMeters = 100
  ): boolean {
    const R = 6371000;
    const dLat = ((home.latitude - current.latitude) * Math.PI) / 180;
    const dLon = ((home.longitude - current.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((current.latitude * Math.PI) / 180) *
        Math.cos((home.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d <= radiusMeters;
  }
}

// Register background task
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  if (data?.locations?.length) {
    const location = data.locations[0];
    // In production: reverse geocode & check against known stores
    console.log('[LocationIntelligence] Background update:', location.coords);
  }
});

TaskManager.defineTask('UPTEND_GEOFENCE', async ({ data, error }: any) => {
  if (error) return;
  const { eventType, region } = data;
  if (eventType === Location.GeofencingEventType.Enter) {
    const service = LocationIntelligenceService.getInstance();
    await service.sendProximitySuggestion(region.identifier);
  }
});

export default LocationIntelligenceService;
