/**
 * WidgetService — iOS widget configuration.
 * Uses expo-widgets (when available) or native module bridge.
 * For now, provides data structure that native widget code can read from shared UserDefaults.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_DATA_KEY = '@uptend_widget_data';

export interface WidgetData {
  nextService?: {
    name: string;
    date: string;
    time: string;
    proName?: string;
  };
  tipOfDay: string;
  homeScore?: number;
  quickBookUrl: string;
  lastUpdated: number;
}

const TIPS = [
  'Clean gutters twice a year to prevent water damage 🌧',
  'Change HVAC filters every 1-3 months for best efficiency ❄️',
  'Pressure wash your driveway to boost curb appeal 💦',
  'Test smoke detectors monthly — it takes 30 seconds 🔥',
  'Seal cracks in your driveway before winter ❄️',
  'Trim trees away from your roof to prevent damage 🌳',
  'Schedule annual termite inspections in spring 🐛',
  'Clean dryer vents yearly to prevent fires 🔥',
  'Check for water stains on ceilings — early leak detection 💧',
  'Caulk around windows and doors to save on energy 🏠',
];

class WidgetService {
  private static instance: WidgetService;

  static getInstance(): WidgetService {
    if (!this.instance) this.instance = new WidgetService();
    return this.instance;
  }

  getTipOfDay(): string {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return TIPS[dayOfYear % TIPS.length];
  }

  async updateWidgetData(nextService?: WidgetData['nextService'], homeScore?: number): Promise<void> {
    const data: WidgetData = {
      nextService,
      tipOfDay: this.getTipOfDay(),
      homeScore,
      quickBookUrl: 'uptend://guide?action=quick-book',
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));

    // In production, write to shared App Group UserDefaults for iOS widget access:
    // NativeModules.SharedDefaults.set('widget_data', JSON.stringify(data));

    console.log('[WidgetService] Widget data updated');
  }

  async getWidgetData(): Promise<WidgetData | null> {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}

export default WidgetService;
