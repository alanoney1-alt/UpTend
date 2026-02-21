import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchProDashboard, fetchProEarnings, fetchAvailableJobs, fetchProCertifications, acceptJob, declineJob, updateProLocation } from '../services/api';

const QUICK_ACTIONS = [
  { emoji: '🗺️', label: 'Optimize\nRoute', screen: 'ProRoute' },
  { emoji: '📸', label: 'Scope\na Job', screen: 'ScopeMeasure' },
  { emoji: '💰', label: 'Tax\nSummary', screen: 'TaxHelper' },
  { emoji: '🎓', label: 'Academy', screen: 'SkillUp' },
];

export default function ProDashboardScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [certs, setCerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    const [d, e, j, c] = await Promise.all([
      fetchProDashboard().catch(() => null),
      fetchProEarnings().catch(() => null),
      fetchAvailableJobs().catch(() => ({ jobs: [] })),
      fetchProCertifications().catch(() => null),
    ]);
    setDashboard(d || { totalJobs: 0, activeJobs: 0, completedJobs: 0, totalEarnings: 0 });
    setEarnings(e || { totalEarnings: 0, weeklyEarnings: 0 });
    setJobs(j?.jobs || j?.requests || []);
    setCerts(c);
    if (!d && !e) setError('Could not load dashboard data. Pull to retry.');
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleOnline = async () => {
    const newState = !isOnline;
    setIsOnline(newState);
    try {
      await updateProLocation(28.495, -81.36);
    } catch {
      setIsOnline(!newState);
      Alert.alert('Error', 'Could not update availability');
    }
  };

  const handleAccept = async (jobId: string) => {
    setAcceptingId(jobId);
    try {
      await acceptJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      Alert.alert('Job Accepted', 'Check your route for details.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not accept job');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (jobId: string) => {
    try {
      await declineJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not decline job');
    }
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
  const certProgress = certs?.completedCount != null ? `${certs.completedCount}/${certs.totalCount || 6}` : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
        {error && (
          <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>
        )}

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

        {/* Certification Progress */}
        {certProgress && (
          <View style={styles.certCard}>
            <Text style={styles.certTitle}>🎓 Certifications</Text>
            <Text style={styles.certProgress}>{certProgress} completed</Text>
            <View style={styles.certBar}>
              <View style={[styles.certFill, { width: `${((certs?.completedCount || 0) / (certs?.totalCount || 6)) * 100}%` }]} />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={() => navigation.navigate(a.screen)}>
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
              <View key={job.id || i} style={styles.jobCard}>
                <View style={styles.jobTop}>
                  <Text style={styles.jobService}>{(job.service_type || job.serviceType || '').replace(/_/g, ' ')}</Text>
                  <Text style={styles.jobPrice}>${job.estimated_price || job.payout || 'TBD'}</Text>
                </View>
                <Text style={styles.jobAddress}>{job.address || job.pickup_address || ''}</Text>
                <Text style={styles.jobUrgency}>{job.urgency || ''}</Text>
                <View style={styles.jobActions}>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(job.id)}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(job.id)} disabled={acceptingId === job.id}>
                    <Text style={styles.acceptBtnText}>{acceptingId === job.id ? '...' : '✓ Accept'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  topCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16 },
  onlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  onlineLabel: { fontSize: 18, fontWeight: '700', color: Colors.text },
  onlineSubtext: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  earningItem: { alignItems: 'center' },
  earningValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  earningLabel: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
  certCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
  certTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  certProgress: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 4 },
  certBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  certFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
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
  jobActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  declineBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  declineBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  acceptBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
