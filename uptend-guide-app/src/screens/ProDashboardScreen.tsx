import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchProDashboard, fetchProEarnings, fetchAvailableJobs } from '../services/api';
import config from '../config';

const QUICK_ACTIONS = [
  { emoji: '🗺️', label: 'Optimize\nRoute' },
  { emoji: '📸', label: 'Scope\na Job' },
  { emoji: '💰', label: 'Tax\nSummary' },
  { emoji: '🎓', label: 'Academy' },
];

export default function ProDashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchProDashboard().catch(() => ({ totalJobs: 0, activeJobs: 0, completedJobs: 0, totalEarnings: 0 })),
      fetchProEarnings().catch(() => ({ totalEarnings: 0, weeklyEarnings: 0 })),
      fetchAvailableJobs().catch(() => ({ jobs: [] })),
    ]).then(([d, e, j]) => {
      setDashboard(d);
      setEarnings(e);
      setJobs(j.jobs || []);
    }).finally(() => setLoading(false));
  }, []);

  const toggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    fetch(`${config.API_BASE_URL}/api/pros/update-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: newState, latitude: 28.495, longitude: -81.36 }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const todayEarnings = earnings?.weeklyEarnings || earnings?.totalEarnings || 0;
  const totalJobs = dashboard?.totalJobs || 0;
  const activeJobs = dashboard?.activeJobs || 0;
  const completedJobs = dashboard?.completedJobs || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Online Toggle + Earnings */}
        <View style={styles.topCard}>
          <View style={styles.onlineRow}>
            <View>
              <Text style={styles.onlineLabel}>{isOnline ? '🟢 Online' : '⚫ Offline'}</Text>
              <Text style={styles.onlineSubtext}>{isOnline ? 'Accepting jobs' : 'Not accepting jobs'}</Text>
            </View>
            <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: '#333', true: Colors.primary + '60' }} thumbColor={isOnline ? Colors.primary : '#666'} />
          </View>

          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>${todayEarnings}</Text>
              <Text style={styles.earningLabel}>Today</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{activeJobs}</Text>
              <Text style={styles.earningLabel}>Active</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{completedJobs}</Text>
              <Text style={styles.earningLabel}>Completed</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{totalJobs}</Text>
              <Text style={styles.earningLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard}>
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Jobs ({jobs.length})</Text>
          {jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No available jobs right now. Stay online and they'll appear here.</Text>
            </View>
          ) : (
            jobs.slice(0, 5).map((job: any, i: number) => (
              <TouchableOpacity key={job.id || i} style={styles.jobCard}>
                <View style={styles.jobTop}>
                  <Text style={styles.jobService}>{(job.service_type || '').replace(/_/g, ' ')}</Text>
                  <Text style={styles.jobPrice}>${job.estimated_price || 'TBD'}</Text>
                </View>
                <Text style={styles.jobAddress}>{job.address}</Text>
                <Text style={styles.jobUrgency}>{job.urgency}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  topCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16 },
  onlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  onlineLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  onlineSubtext: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  earningItem: { alignItems: 'center' },
  earningValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  earningLabel: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionCard: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginHorizontal: 4 },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 11, color: Colors.textLight, textAlign: 'center', marginTop: 6 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  emptyCard: { padding: 20, backgroundColor: Colors.surface, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  jobCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8 },
  jobTop: { flexDirection: 'row', justifyContent: 'space-between' },
  jobService: { fontSize: 15, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  jobPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  jobAddress: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  jobUrgency: { fontSize: 12, color: Colors.primary, marginTop: 6, fontWeight: '500' },
});
