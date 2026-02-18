import * as Notifications from 'expo-notifications';

interface WeatherData {
  condition: string;
  temp: number;
  humidity: number;
  rainDays: number;
  forecast: string;
}

interface SeasonalReminder {
  month: number;
  services: string[];
  message: string;
  icon: string;
}

const SEASONAL_REMINDERS: SeasonalReminder[] = [
  { month: 1, services: ['HVAC Inspection'], message: 'New year, new filters! Schedule an HVAC tune-up.', icon: '❄️' },
  { month: 2, services: ['Gutter Cleaning'], message: 'Pre-spring gutter cleaning prevents water damage.', icon: '🌧' },
  { month: 3, services: ['Lawn Care', 'Pressure Washing'], message: 'Spring is here! Time for lawn care and a fresh pressure wash.', icon: '🌱' },
  { month: 4, services: ['Window Cleaning', 'Landscaping'], message: 'Spring cleaning season — sparkling windows and fresh landscaping.', icon: '🌸' },
  { month: 5, services: ['AC Service', 'Deck Staining'], message: 'Summer prep: AC tune-up and deck staining before it heats up.', icon: '☀️' },
  { month: 6, services: ['Pool Cleaning', 'Pest Control'], message: 'Pool season! Plus pest control before bugs take over.', icon: '🏊' },
  { month: 7, services: ['Lawn Care', 'Irrigation'], message: 'Keep that lawn green — irrigation check and mowing.', icon: '💧' },
  { month: 8, services: ['Roof Inspection'], message: 'Hurricane prep: roof inspection catches problems early.', icon: '🏠' },
  { month: 9, services: ['Gutter Cleaning', 'Tree Trimming'], message: 'Fall prep: gutters and tree trimming before leaf season.', icon: '🍂' },
  { month: 10, services: ['Exterior Painting', 'Sealing'], message: 'Perfect painting weather! Seal driveways before winter.', icon: '🎨' },
  { month: 11, services: ['Furnace Service', 'Insulation'], message: 'Winter is coming — furnace service and insulation check.', icon: '🔥' },
  { month: 12, services: ['Holiday Lights', 'Chimney Sweep'], message: 'Holiday light installation and chimney sweep for cozy nights.', icon: '🎄' },
];

const WEATHER_TRIGGERS = [
  {
    condition: (w: WeatherData) => w.rainDays >= 3,
    title: '🌧 Rain Alert',
    body: "It's rained 3+ days. Your gutters might need cleaning — want a quick quote?",
    services: ['Gutter Cleaning'],
  },
  {
    condition: (w: WeatherData) => w.temp > 95,
    title: '🌡️ Heat Wave',
    body: 'Extreme heat! Make sure your AC is running well. Schedule a tune-up?',
    services: ['AC Service'],
  },
  {
    condition: (w: WeatherData) => w.condition === 'snow',
    title: '❄️ Snow Coming',
    body: 'Snow in the forecast! Book snow removal before the rush.',
    services: ['Snow Removal'],
  },
  {
    condition: (w: WeatherData) => w.temp < 32,
    title: '🥶 Freeze Warning',
    body: "Temps below freezing — make sure pipes are insulated. Need a handyman?",
    services: ['Pipe Insulation', 'Handyman'],
  },
  {
    condition: (w: WeatherData) => w.humidity > 85 && w.temp > 75,
    title: '🍄 Mold Risk',
    body: 'High humidity + heat = mold risk. Consider a home inspection.',
    services: ['Mold Inspection', 'Dehumidifier Install'],
  },
];

class SmartNotificationService {
  private static instance: SmartNotificationService;

  static getInstance(): SmartNotificationService {
    if (!this.instance) this.instance = new SmartNotificationService();
    return this.instance;
  }

  async checkWeatherTriggers(weather: WeatherData): Promise<void> {
    for (const trigger of WEATHER_TRIGGERS) {
      if (trigger.condition(weather)) {
        await this.sendNotification(trigger.title, trigger.body, {
          type: 'weather_trigger',
          services: trigger.services,
        });
      }
    }
  }

  async checkSeasonalReminders(): Promise<void> {
    const month = new Date().getMonth() + 1;
    const reminder = SEASONAL_REMINDERS.find((r) => r.month === month);
    if (!reminder) return;

    await this.sendNotification(
      `${reminder.icon} Seasonal Reminder`,
      reminder.message,
      { type: 'seasonal', services: reminder.services }
    );
  }

  async sendJobStatusUpdate(
    jobId: string,
    status: string,
    details: string
  ): Promise<void> {
    const titles: Record<string, string> = {
      confirmed: '✅ Job Confirmed',
      pro_assigned: '👷 Pro Assigned',
      en_route: '🚗 Pro On the Way',
      arrived: '📍 Pro Has Arrived',
      in_progress: '🔨 Work In Progress',
      completed: '🎉 Job Complete',
      review: '⭐ Leave a Review',
    };

    await this.sendNotification(
      titles[status] || 'Job Update',
      details,
      { type: 'job_status', jobId, status }
    );
  }

  async sendNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: 'default' },
      trigger: null,
    });
  }

  async scheduleNotification(
    title: string,
    body: string,
    date: Date,
    data?: Record<string, any>
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data || {}, sound: 'default' },
      trigger: { type: 'date', date } as any,
    });
  }

  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Fetch weather from backend/API — mock for now
  async fetchWeather(lat: number, lon: number): Promise<WeatherData> {
    // TODO: integrate with real weather API via backend
    return {
      condition: 'clear',
      temp: 78,
      humidity: 65,
      rainDays: 0,
      forecast: 'Sunny for the next 3 days',
    };
  }

  async runDailyCheck(lat: number, lon: number): Promise<void> {
    const weather = await this.fetchWeather(lat, lon);
    await this.checkWeatherTriggers(weather);
    await this.checkSeasonalReminders();
  }
}

export default SmartNotificationService;
