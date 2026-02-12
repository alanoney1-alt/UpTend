import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Milestone {
  id: string;
  type: 'jobs' | 'earnings' | 'reviews' | 'streak' | 'special';
  title: string;
  description: string;
  icon: string;
  threshold: number;
  reward?: string;
}

interface AchievedMilestone extends Milestone {
  achievedAt: string;
  celebrated: boolean;
}

const MILESTONES: Milestone[] = [
  { id: 'jobs-1', type: 'jobs', title: 'First Job!', description: 'Completed your first job on UpTend', icon: '🎉', threshold: 1, reward: '$10 bonus' },
  { id: 'jobs-10', type: 'jobs', title: '10 Jobs Strong', description: '10 jobs completed — you\'re building momentum!', icon: '💪', threshold: 10, reward: '$25 bonus' },
  { id: 'jobs-25', type: 'jobs', title: 'Quarter Century', description: '25 jobs! You\'re a reliable pro.', icon: '⭐', threshold: 25, reward: 'Featured Pro badge' },
  { id: 'jobs-50', type: 'jobs', title: 'Half Century', description: '50 jobs completed — impressive!', icon: '🔥', threshold: 50, reward: '$50 bonus' },
  { id: 'jobs-100', type: 'jobs', title: 'Centurion', description: '100 jobs! You\'re a legend on UpTend.', icon: '🏆', threshold: 100, reward: '$100 bonus + priority placement' },
  { id: 'jobs-500', type: 'jobs', title: 'Elite Pro', description: '500 jobs — truly elite status.', icon: '👑', threshold: 500, reward: '$250 bonus + permanent featured' },
  { id: 'earn-1k', type: 'earnings', title: 'First $1K', description: 'Earned your first $1,000', icon: '💰', threshold: 1000 },
  { id: 'earn-5k', type: 'earnings', title: '$5K Club', description: '$5,000 in earnings!', icon: '💎', threshold: 5000 },
  { id: 'earn-10k', type: 'earnings', title: 'Five Figures', description: '$10,000 earned on UpTend', icon: '🚀', threshold: 10000, reward: 'Pro Elite tier' },
  { id: 'earn-50k', type: 'earnings', title: '$50K Milestone', description: 'Fifty thousand dollars earned!', icon: '🌟', threshold: 50000, reward: 'Diamond tier' },
  { id: 'reviews-5star-10', type: 'reviews', title: 'Perfect 10', description: '10 five-star reviews', icon: '⭐', threshold: 10 },
  { id: 'reviews-5star-50', type: 'reviews', title: 'Star Power', description: '50 five-star reviews!', icon: '🌟', threshold: 50 },
  { id: 'streak-7', type: 'streak', title: 'Week Warrior', description: '7-day job streak!', icon: '📅', threshold: 7 },
  { id: 'streak-30', type: 'streak', title: 'Month of Hustle', description: '30-day job streak!', icon: '🔥', threshold: 30, reward: '$75 bonus' },
];

const ACHIEVED_KEY = '@uptend_milestones';

class MilestoneService {
  private static instance: MilestoneService;

  static getInstance(): MilestoneService {
    if (!this.instance) this.instance = new MilestoneService();
    return this.instance;
  }

  async getAchieved(): Promise<AchievedMilestone[]> {
    const raw = await AsyncStorage.getItem(ACHIEVED_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async checkAndAward(stats: {
    totalJobs: number;
    totalEarnings: number;
    fiveStarReviews: number;
    currentStreak: number;
  }): Promise<AchievedMilestone[]> {
    const achieved = await this.getAchieved();
    const achievedIds = new Set(achieved.map((a) => a.id));
    const newAchievements: AchievedMilestone[] = [];

    const checks: Array<{ type: Milestone['type']; value: number }> = [
      { type: 'jobs', value: stats.totalJobs },
      { type: 'earnings', value: stats.totalEarnings },
      { type: 'reviews', value: stats.fiveStarReviews },
      { type: 'streak', value: stats.currentStreak },
    ];

    for (const { type, value } of checks) {
      const eligible = MILESTONES.filter((m) => m.type === type && m.threshold <= value && !achievedIds.has(m.id));
      for (const milestone of eligible) {
        const achievement: AchievedMilestone = {
          ...milestone,
          achievedAt: new Date().toISOString(),
          celebrated: false,
        };
        newAchievements.push(achievement);
        achieved.push(achievement);
      }
    }

    if (newAchievements.length > 0) {
      await AsyncStorage.setItem(ACHIEVED_KEY, JSON.stringify(achieved));
      for (const a of newAchievements) {
        await this.celebrate(a);
      }
    }

    return newAchievements;
  }

  private async celebrate(milestone: AchievedMilestone): Promise<void> {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${milestone.icon} ${milestone.title}`,
        body: `${milestone.description}${milestone.reward ? ` — ${milestone.reward}!` : ''}`,
        data: { type: 'milestone', milestoneId: milestone.id },
      },
      trigger: null,
    });
  }

  getNextMilestones(stats: { totalJobs: number; totalEarnings: number }): Milestone[] {
    return MILESTONES
      .filter((m) => {
        if (m.type === 'jobs') return m.threshold > stats.totalJobs;
        if (m.type === 'earnings') return m.threshold > stats.totalEarnings;
        return false;
      })
      .slice(0, 3);
  }

  getAllMilestones(): Milestone[] {
    return MILESTONES;
  }
}

export default MilestoneService;
