import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const QUICK_ACTIONS = [
  { emoji: '📸', label: 'Photo\nQuote' },
  { emoji: '🗺️', label: 'Find a\nPro' },
  { emoji: '📅', label: 'Schedule\nService' },
  { emoji: '🔄', label: 'Rebook\nLast' },
  { emoji: '💬', label: 'Ask\nGeorge' },
];

const UPCOMING = [
  { id: '1', service: 'Lawn Mowing', pro: 'Carlos M.', date: 'Tomorrow, 10 AM', daysAway: 1, icon: '🌱' },
  { id: '2', service: 'Gutter Cleaning', pro: 'James R.', date: 'Fri, Feb 14', daysAway: 3, icon: '🏠' },
];

const ACTIVE_JOB = {
  pro: 'Carlos',
  service: 'Lawn Mowing',
  status: 'en route',
  eta: '12 min away',
  progress: 0.3,
};

const RECENT_ACTIVITY = [
  { id: '1', service: 'Junk Removal', date: 'Jan 28', rating: 5, amount: '$149', icon: '🗑' },
  { id: '2', service: 'Pressure Washing', date: 'Jan 15', rating: 5, amount: '$89', icon: '💦' },
  { id: '3', service: 'Tree Trimming', date: 'Jan 8', rating: 4, amount: '$220', icon: '🌳' },
];

const SUBSCRIPTIONS = [
  { id: '1', service: 'Bi-weekly Lawn Care', nextDate: 'Feb 15', icon: '🌱' },
  { id: '2', service: 'Monthly Gutter Clean', nextDate: 'Mar 1', icon: '🏠' },
];

const RECOMMENDATIONS = [
  { id: '1', text: "Your gutters haven't been cleaned since October — book now?", emoji: '🏠', action: 'Book Gutter Cleaning' },
  { id: '2', text: 'Spring is coming! Schedule a full yard cleanup before the rush.', emoji: '🌸', action: 'Get Quote' },
];

export default function CustomerDashboardScreen({ navigation }: any) {
  const { user, guestMode, requireAuth } = useAuth();
  const userName = user?.name?.split(' ')[0] || 'there';

  const handleBook = (service?: string) => {
    if (requireAuth({ type: 'book', payload: { service } })) return;
    // proceed with booking
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Top Section: Greeting + Health Score + Streak */}
        <View style={styles.topSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
            {!guestMode && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 12 week streak</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.healthScoreCircle} activeOpacity={0.7}>
            <Text style={styles.healthScoreValue}>78</Text>
            <Text style={styles.healthScoreLabel}>Score</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsRow} contentContainerStyle={styles.quickActionsContent}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickAction}
              activeOpacity={0.7}
              onPress={() => {
                if (action.label.includes('George')) navigation?.navigate('George');
                else if (action.label.includes('Find')) navigation?.navigate('LiveMap');
                else if (action.label.includes('Photo')) navigation?.navigate('George');
                else handleBook(action.label);
              }}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Job */}
        {!guestMode && ACTIVE_JOB && (
          <TouchableOpacity style={styles.activeJobCard} activeOpacity={0.8}>
            <View style={styles.activeJobHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.activeJobLabel}>Active Job</Text>
            </View>
            <Text style={styles.activeJobTitle}>
              {ACTIVE_JOB.pro} is {ACTIVE_JOB.status} — {ACTIVE_JOB.eta}
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${ACTIVE_JOB.progress * 100}%` }]} />
            </View>
            <Text style={styles.activeJobTap}>Tap for full tracking →</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Services</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>
        {UPCOMING.map((job) => (
          <View key={job.id} style={styles.card}>
            <Text style={styles.cardIcon}>{job.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{job.service}</Text>
              <Text style={styles.cardSubtitle}>{job.pro} • {job.date}</Text>
            </View>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{job.daysAway === 1 ? 'Tomorrow' : `${job.daysAway}d`}</Text>
            </View>
          </View>
        ))}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {RECENT_ACTIVITY.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.service}</Text>
              <Text style={styles.cardSubtitle}>{item.date} • {'⭐'.repeat(item.rating)}</Text>
            </View>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        ))}

        {/* Subscriptions */}
        {!guestMode && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Subscriptions</Text>
              <TouchableOpacity><Text style={styles.viewAll}>Manage</Text></TouchableOpacity>
            </View>
            {SUBSCRIPTIONS.map((sub) => (
              <View key={sub.id} style={styles.card}>
                <Text style={styles.cardIcon}>{sub.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{sub.service}</Text>
                  <Text style={styles.cardSubtitle}>Next: {sub.nextDate}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Savings Summary */}
        {!guestMode && (
          <View style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>💰 Your Savings This Year</Text>
            <Text style={styles.savingsAmount}>$487</Text>
            <View style={styles.savingsBreakdown}>
              <View style={styles.savingsItem}>
                <Text style={styles.savingsItemLabel}>Bundles</Text>
                <Text style={styles.savingsItemValue}>$210</Text>
              </View>
              <View style={styles.savingsItem}>
                <Text style={styles.savingsItemLabel}>Subscriptions</Text>
                <Text style={styles.savingsItemValue}>$180</Text>
              </View>
              <View style={styles.savingsItem}>
                <Text style={styles.savingsItemLabel}>Streak Rewards</Text>
                <Text style={styles.savingsItemValue}>$97</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        {RECOMMENDATIONS.map((rec) => (
          <TouchableOpacity key={rec.id} style={styles.recCard} activeOpacity={0.8} onPress={() => handleBook(rec.action)}>
            <Text style={styles.recEmoji}>{rec.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.recText}>{rec.text}</Text>
            </View>
            <TouchableOpacity style={styles.recBtn} onPress={() => handleBook(rec.action)}>
              <Text style={styles.recBtnText}>{rec.action}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  // Top section
  topSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.text },
  streakBadge: {
    backgroundColor: '#FFF7ED', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    alignSelf: 'flex-start', marginTop: 6,
  },
  streakText: { fontSize: 13, fontWeight: '600', color: '#EA580C' },
  healthScoreCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.purple, justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  healthScoreValue: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  healthScoreLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },

  // Quick actions
  quickActionsRow: { marginBottom: 20, marginHorizontal: -20 },
  quickActionsContent: { paddingHorizontal: 20, gap: 12 },
  quickAction: { alignItems: 'center', width: 72 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', lineHeight: 14 },

  // Active job
  activeJobCard: {
    backgroundColor: Colors.purple, borderRadius: 18, padding: 18, marginBottom: 20,
  },
  activeJobHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  activeJobLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeJobTitle: { color: Colors.white, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  progressBarFill: { height: 6, borderRadius: 3, backgroundColor: Colors.success },
  activeJobTap: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 10, fontWeight: '500' },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  viewAll: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Cards
  card: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  countdownBadge: {
    backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  countdownText: { fontSize: 12, fontWeight: '600', color: Colors.info },
  activeBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '600', color: '#059669' },

  // Savings
  savingsCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 20, marginBottom: 20, marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  savingsTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  savingsAmount: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 16 },
  savingsBreakdown: { flexDirection: 'row', gap: 12 },
  savingsItem: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12, alignItems: 'center' },
  savingsItemLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  savingsItemValue: { fontSize: 16, fontWeight: '700', color: Colors.text },

  // Recommendations
  recCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  recEmoji: { fontSize: 28 },
  recText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  recBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  recBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
});
