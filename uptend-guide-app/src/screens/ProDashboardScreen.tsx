import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const TODAYS_SCHEDULE = [
  { id: '1', time: '8:00 AM', service: 'Lawn Mowing', address: '123 Oak St', status: 'completed', amount: '$65' },
  { id: '2', time: '10:30 AM', service: 'Junk Removal', address: '456 Elm Ave', status: 'completed', amount: '$149' },
  { id: '3', time: '1:00 PM', service: 'Pressure Washing', address: '789 Pine Dr', status: 'current', amount: '$120' },
  { id: '4', time: '3:30 PM', service: 'Gutter Cleaning', address: '321 Maple Ln', status: 'upcoming', amount: '$95' },
];

const AVAILABLE_JOBS = [
  { id: '1', service: 'Junk Removal', address: '555 Cedar Ct', price: '$175', distance: '1.8 mi', icon: '🗑', surge: false },
  { id: '2', service: 'Lawn Mowing', address: '777 Birch Way', price: '$98', distance: '0.9 mi', icon: '🌱', surge: true, surgeMultiplier: '1.5x' },
  { id: '3', service: 'Fence Repair', address: '222 Willow Rd', price: '$250', distance: '2.4 mi', icon: '🔨', surge: false },
];

const WEEKLY_EARNINGS = [
  { day: 'Mon', amount: 245, lastWeek: 180 },
  { day: 'Tue', amount: 310, lastWeek: 220 },
  { day: 'Wed', amount: 340, lastWeek: 290 },
  { day: 'Thu', amount: 0, lastWeek: 310 },
  { day: 'Fri', amount: 0, lastWeek: 275 },
  { day: 'Sat', amount: 0, lastWeek: 420 },
  { day: 'Sun', amount: 0, lastWeek: 0 },
];

const QUICK_ACTIONS = [
  { emoji: '🗺️', label: 'Optimize\nRoute' },
  { emoji: '📸', label: 'Scope\na Job' },
  { emoji: '💰', label: 'Tax\nSummary' },
  { emoji: '🎓', label: 'Academy' },
];

const MAX_EARNING = Math.max(...WEEKLY_EARNINGS.map(e => Math.max(e.amount, e.lastWeek)), 1);

const STATUS_COLORS: Record<string, string> = {
  completed: '#9CA3AF',
  current: Colors.success,
  upcoming: Colors.info,
};

export default function ProDashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Top: Go Online + Earnings + Active job */}
        <View style={styles.topCard}>
          {/* Online toggle */}
          <View style={styles.onlineRow}>
            <View>
              <Text style={styles.onlineLabel}>{isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
              <Text style={styles.onlineSubtext}>{isOnline ? 'Accepting jobs' : 'Not accepting jobs'}</Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: '#D1D5DB', true: Colors.success }}
              thumbColor={Colors.white}
              style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
            />
          </View>

          {/* Today's earnings */}
          <View style={styles.earningsRow}>
            <View style={styles.earningsStat}>
              <Text style={styles.earningsAmount}>$340</Text>
              <Text style={styles.earningsLabel}>Earned Today</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsAmount}>$1,280</Text>
              <Text style={styles.earningsLabel}>This Week</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsStat}>
              <Text style={styles.earningsAmount}>5</Text>
              <Text style={styles.earningsLabel}>Jobs Today</Text>
            </View>
          </View>
        </View>

        {/* Today's Schedule */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
        </View>
        {TODAYS_SCHEDULE.map((job) => (
          <TouchableOpacity key={job.id} style={styles.scheduleItem} activeOpacity={0.7}>
            <View style={[styles.timelineDot, { backgroundColor: STATUS_COLORS[job.status] }]} />
            <View style={styles.timelineContent}>
              <Text style={styles.scheduleTime}>{job.time}</Text>
              <Text style={[styles.scheduleName, job.status === 'completed' && styles.completedText]}>{job.service}</Text>
              <Text style={styles.scheduleAddress}>{job.address}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.scheduleAmount}>{job.amount}</Text>
              <Text style={[styles.scheduleStatus, { color: STATUS_COLORS[job.status] }]}>
                {job.status === 'completed' ? '✓ Done' : job.status === 'current' ? '● Now' : 'Upcoming'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Available Jobs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Nearby</Text>
          <Text style={styles.sectionCount}>{AVAILABLE_JOBS.length} jobs</Text>
        </View>
        {AVAILABLE_JOBS.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <Text style={styles.jobIcon}>{job.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.jobNameRow}>
                <Text style={styles.jobName}>{job.service}</Text>
                {job.surge && (
                  <View style={styles.surgeBadge}>
                    <Text style={styles.surgeText}>{job.surgeMultiplier} 🔥</Text>
                  </View>
                )}
              </View>
              <Text style={styles.jobAddress}>{job.address} • {job.distance}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.jobPrice}>{job.price}</Text>
              <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Weekly Earnings Chart */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Earnings</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View Details</Text></TouchableOpacity>
        </View>
        <View style={styles.chartCard}>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.legendText}>This Week</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.borderLight }]} />
              <Text style={styles.legendText}>Last Week</Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {WEEKLY_EARNINGS.map((day, i) => (
              <View key={day.day} style={styles.chartColumn}>
                <View style={styles.barGroup}>
                  <View style={[styles.bar, styles.barLastWeek, { height: Math.max(4, (day.lastWeek / MAX_EARNING) * 100) }]} />
                  <View style={[styles.bar, styles.barThisWeek, { height: Math.max(4, (day.amount / MAX_EARNING) * 100) }]} />
                </View>
                <Text style={styles.chartLabel}>{day.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Stats */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>⭐ 4.9</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>47</Text>
            <Text style={styles.statLabel}>Jobs / Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3 min</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickAction} activeOpacity={0.7}>
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  // Top card
  topCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginBottom: 20,
  },
  onlineRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  onlineLabel: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  onlineSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  earningsStat: { alignItems: 'center' },
  earningsAmount: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  earningsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  earningsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  sectionCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  viewAll: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Schedule timeline
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  timelineDot: { width: 12, height: 12, borderRadius: 6 },
  timelineContent: { flex: 1 },
  scheduleTime: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  scheduleName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: 2 },
  completedText: { color: Colors.textLight, textDecorationLine: 'line-through' },
  scheduleAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  scheduleAmount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  scheduleStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Available jobs
  jobCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  jobIcon: { fontSize: 24 },
  jobNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  surgeBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  surgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  jobAddress: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  jobPrice: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  acceptBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 4,
  },
  acceptText: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  // Chart
  chartCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  chartColumn: { alignItems: 'center', flex: 1 },
  barGroup: { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
  bar: { width: 12, borderRadius: 4 },
  barThisWeek: { backgroundColor: Colors.primary },
  barLastWeek: { backgroundColor: Colors.borderLight },
  chartLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%' as any, backgroundColor: Colors.white, borderRadius: 14, padding: 16,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },

  // Quick actions
  quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  quickActionEmoji: { fontSize: 24 },
  quickActionLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', lineHeight: 14 },
});
