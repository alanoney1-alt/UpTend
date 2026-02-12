// CalendarSync.ts — expo-calendar integration for UpTend
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_PREFS_KEY = 'uptend_calendar_prefs';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  isUptendService?: boolean;
  serviceType?: string;
  jobId?: string;
}

export interface CalendarPrefs {
  calendarId: string | null;
  autoAdd: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
  syncEnabled: boolean;
}

const DEFAULT_PREFS: CalendarPrefs = {
  calendarId: null,
  autoAdd: true,
  reminder24h: true,
  reminder1h: true,
  syncEnabled: false,
};

// Mock busy slots for demo
const MOCK_BUSY_SLOTS: CalendarEvent[] = [
  { id: 'cal1', title: 'Team Meeting', startDate: new Date(Date.now() + 86400000), endDate: new Date(Date.now() + 86400000 + 3600000), isUptendService: false },
  { id: 'cal2', title: 'Dentist Appointment', startDate: new Date(Date.now() + 172800000), endDate: new Date(Date.now() + 172800000 + 5400000), isUptendService: false },
  { id: 'cal3', title: 'Pressure Washing — UpTend', startDate: new Date(Date.now() + 259200000), endDate: new Date(Date.now() + 259200000 + 7200000), isUptendService: true, serviceType: 'pressure_washing', jobId: 'job_101' },
];

class CalendarSyncService {
  private prefs: CalendarPrefs = DEFAULT_PREFS;

  async init(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CALENDAR_PREFS_KEY);
      if (stored) this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    } catch {}
  }

  async requestPermission(): Promise<boolean> {
    // In real app: Calendar.requestCalendarPermissionsAsync()
    console.log('[CalendarSync] Permission requested');
    return true;
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    // In real: Calendar.getEventsAsync(calendarIds, startDate, endDate)
    return MOCK_BUSY_SLOTS;
  }

  async getAvailableSlots(date: Date): Promise<{ start: Date; end: Date }[]> {
    const events = await this.getUpcomingEvents();
    // Simple availability: 8am-6pm minus busy slots
    const dayStart = new Date(date);
    dayStart.setHours(8, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0);

    const slots: { start: Date; end: Date }[] = [];
    let current = new Date(dayStart);

    for (const evt of events) {
      if (evt.startDate > current && evt.startDate < dayEnd) {
        if (evt.startDate.getTime() - current.getTime() >= 3600000) {
          slots.push({ start: new Date(current), end: new Date(evt.startDate) });
        }
        current = new Date(evt.endDate);
      }
    }
    if (dayEnd.getTime() - current.getTime() >= 3600000) {
      slots.push({ start: new Date(current), end: new Date(dayEnd) });
    }
    return slots;
  }

  async addServiceToCalendar(service: {
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    jobId: string;
    serviceType: string;
  }): Promise<string> {
    // In real: Calendar.createEventAsync()
    const eventId = `uptend_${Date.now()}`;
    console.log('[CalendarSync] Added event:', service.title);
    return eventId;
  }

  async removeServiceFromCalendar(eventId: string): Promise<void> {
    console.log('[CalendarSync] Removed event:', eventId);
  }

  async suggestOptimalTimes(serviceType: string): Promise<{ date: Date; reason: string }[]> {
    return [
      { date: new Date(Date.now() + 86400000 * 2), reason: 'You have a free 3-hour window' },
      { date: new Date(Date.now() + 86400000 * 4), reason: 'Best weather + you\'re home all day' },
      { date: new Date(Date.now() + 86400000 * 6), reason: 'Weekend — most popular booking time' },
    ];
  }

  async updatePrefs(newPrefs: Partial<CalendarPrefs>): Promise<void> {
    this.prefs = { ...this.prefs, ...newPrefs };
    await AsyncStorage.setItem(CALENDAR_PREFS_KEY, JSON.stringify(this.prefs));
  }

  getPrefs(): CalendarPrefs {
    return this.prefs;
  }
}

export const calendarSync = new CalendarSyncService();
