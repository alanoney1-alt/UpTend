// WeatherScheduler.ts — Weather-aware job scheduling
export interface WeatherForecast {
  date: Date;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'wind';
  precipChance: number;
  windSpeed: number;
  description: string;
}

export interface ScheduleConflict {
  jobId: string;
  jobTitle: string;
  scheduledDate: Date;
  weather: WeatherForecast;
  reason: string;
  suggestion: string;
  alternativeDate?: Date;
}

const MOCK_FORECAST: WeatherForecast[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  const conditions: WeatherForecast['condition'][] = ['sunny', 'cloudy', 'rain', 'sunny', 'storm', 'sunny', 'cloudy'];
  const cond = conditions[i];
  return {
    date,
    temp: 72 + Math.round(Math.random() * 15),
    condition: cond,
    precipChance: cond === 'rain' ? 80 : cond === 'storm' ? 95 : cond === 'cloudy' ? 30 : 5,
    windSpeed: cond === 'storm' ? 25 : 8 + Math.round(Math.random() * 10),
    description: cond === 'sunny' ? 'Clear skies' : cond === 'rain' ? 'Steady rain expected' : cond === 'storm' ? 'Thunderstorms likely' : cond === 'cloudy' ? 'Mostly cloudy' : 'Breezy',
  };
});

const OUTDOOR_SERVICES = ['pressure_washing', 'lawn_care', 'landscaping', 'painting_exterior', 'roof_repair', 'gutter_cleaning', 'deck_staining', 'fence_install', 'pool_cleaning'];

class WeatherSchedulerService {
  async getForecast(days: number = 7): Promise<WeatherForecast[]> {
    // In real app: fetch from weather API
    return MOCK_FORECAST.slice(0, days);
  }

  isOutdoorService(serviceType: string): boolean {
    return OUTDOOR_SERVICES.includes(serviceType.toLowerCase().replace(/\s+/g, '_'));
  }

  async checkConflicts(jobs: { id: string; title: string; date: Date; serviceType: string }[]): Promise<ScheduleConflict[]> {
    const forecast = await this.getForecast();
    const conflicts: ScheduleConflict[] = [];

    for (const job of jobs) {
      if (!this.isOutdoorService(job.serviceType)) continue;
      const dayForecast = forecast.find(f => f.date.toDateString() === job.date.toDateString());
      if (!dayForecast) continue;

      if (dayForecast.precipChance > 60 || dayForecast.condition === 'storm') {
        const altDate = forecast.find(f => f.precipChance < 30 && f.date > new Date());
        conflicts.push({
          jobId: job.id,
          jobTitle: job.title,
          scheduledDate: job.date,
          weather: dayForecast,
          reason: dayForecast.condition === 'storm' ? 'Thunderstorms expected — unsafe for outdoor work' : 'High chance of rain — poor conditions',
          suggestion: altDate ? `Move to ${altDate.date.toLocaleDateString()} (${altDate.description})` : 'Consider rescheduling to next week',
          alternativeDate: altDate?.date,
        });
      }
    }
    return conflicts;
  }

  getIndoorAlternatives(): string[] {
    return ['Interior Painting', 'Deep Cleaning', 'Furniture Assembly', 'Closet Organization', 'Appliance Install', 'Drywall Repair'];
  }
}

export const weatherScheduler = new WeatherSchedulerService();
