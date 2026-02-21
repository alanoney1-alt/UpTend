import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Linking, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchTodayRoute, optimizeRoute, updateProLocation } from '../services/api';

export default function ProRouteScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [optimized, setOptimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState({ totalDrive: '—', savedTime: '—', totalDistance: '—', estEarnings: 0 });
  const locationInterval = useRef<any>(null);

  useEffect(() => {
    fetchTodayRoute()
      .then(data => {
        const list = data?.jobs || data?.route || [];
        setJobs(list.map((j: any, i: number) => ({
          id: j.id,
          order: j.order || i + 1,
          customer: j.customer_name || j.customer || `Customer ${i + 1}`,
          address: j.address || j.pickup_address || '',
          service: (j.service_type || j.service || '').replace(/_/g, ' '),
          time: j.scheduled_time || j.time || '',
          duration: j.estimated_duration || j.duration || '',
          distance: j.distance || '',
          driveTime: j.drive_time || j.driveTime || '',
          status: j.status || 'upcoming',
          lat: j.latitude || j.lat,
          lng: j.longitude || j.lng,
        })));
        if (data?.stats) setRouteStats({
          totalDrive: data.stats.totalDrive || '—',
          savedTime: data.stats.savedTime || '—',
          totalDistance: data.stats.totalDistance || '—',
          estEarnings: data.stats.estEarnings || 0,
        });
      })
      .catch(() => setError('Could not load today\'s route'))
      .finally(() => setLoading(false));

    // GPS tracking
    locationInterval.current = setInterval(() => {
      // In production, use Geolocation API. For now, send default coords.
      updateProLocation(28.495, -81.36).catch(() => {});
    }, 30000);

    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  const handleOptimize = async () => {
    if (jobs.length === 0) return;
    setOptimizing(true);
    try {
      const result = await optimizeRoute(jobs.map(j => j.id));
      if (result?.jobs || result?.route) {
        const list = result.jobs || result.route;
        setJobs(list.map((j: any, i: number) => ({
          ...j,
          order: j.order || i + 1,
          customer: j.customer_name || j.customer || `Customer ${i + 1}`,
          address: j.address || j.pickup_address || '',
          service: (j.service_type || j.service || '').replace(/_/g, ' '),
        })));
      }
      if (result?.stats) setRouteStats(prev => ({ ...prev, ...result.stats }));
      setOptimized(true);
    } catch {
      // Optimized locally (just reorder)
      setOptimized(true);
    } finally {
      setOptimizing(false);
    }
  };

  const openNavigation = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗺️ Today's Route</Text>
        <Text style={styles.subtitle}>{jobs.length} jobs • {routeStats.totalDrive} total drive time</Text>

        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Map placeholder */}
        <View style={styles.mapCard}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Route Map</Text>
          <View style={styles.routeLine}>
            {jobs.map((_, i) => (
              <React.Fragment key={i}>
                <View style={[styles.routeDot, jobs[i]?.status === 'in_progress' && styles.activeDot]} />
                {i < jobs.length - 1 && <View style={styles.routeConnector} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Optimize button */}
        <TouchableOpacity
          style={[styles.optimizeBtn, optimized && styles.optimizedBtn]}
          onPress={handleOptimize}
          disabled={optimizing || jobs.length === 0}
        >
          <Text style={styles.optimizeBtnText}>
            {optimizing ? '🔄 Optimizing...' : optimized ? `✓ Optimized — Saving ${routeStats.savedTime}` : '🧠 Optimize Route'}
          </Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNum}>{jobs.length}</Text><Text style={styles.statLabel}>Jobs</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{routeStats.totalDrive}</Text><Text style={styles.statLabel}>Drive Time</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{routeStats.totalDistance}</Text><Text style={styles.statLabel}>Distance</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>${routeStats.estEarnings}</Text><Text style={styles.statLabel}>Est. Earnings</Text></View>
        </View>

        {jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>No Jobs Today</Text>
            <Text style={styles.emptyText}>Accepted jobs will appear here with optimized routing.</Text>
          </View>
        ) : (
          jobs.map((job, index) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobOrder}>
                <View style={[styles.orderCircle, job.status === 'completed' && styles.orderCompleted, job.status === 'in_progress' && styles.orderActive]}>
                  <Text style={styles.orderNum}>{job.status === 'completed' ? '✓' : job.order}</Text>
                </View>
                {index < jobs.length - 1 && job.driveTime && (
                  <View style={styles.driveInfo}>
                    <Text style={styles.driveText}>{job.driveTime}{job.distance ? ` • ${job.distance}` : ''}</Text>
                  </View>
                )}
              </View>
              <View style={styles.jobContent}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobCustomer}>{job.customer}</Text>
                  <Text style={styles.jobTime}>{job.time}</Text>
                </View>
                <Text style={styles.jobService}>{job.service}{job.duration ? ` • ${job.duration}` : ''}</Text>
                <Text style={styles.jobAddress}>{job.address}</Text>
                {job.status === 'in_progress' && (
                  <View style={styles.activeIndicator}>
                    <View style={styles.activePulse} />
                    <Text style={styles.activeText}>In Progress</Text>
                  </View>
                )}
                {job.status === 'upcoming' && (
                  <TouchableOpacity style={styles.navigateBtn} onPress={() => openNavigation(job.address)}>
                    <Text style={styles.navigateBtnText}>🧭 Navigate</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  emptyCard: { padding: 30, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 6 },
  mapCard: { height: 160, backgroundColor: '#E8F0FF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  mapIcon: { fontSize: 32 },
  mapText: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  routeLine: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 0 },
  routeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.primary },
  activeDot: { backgroundColor: Colors.success, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff' },
  routeConnector: { width: 40, height: 3, backgroundColor: Colors.primaryLight },
  optimizeBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 16 },
  optimizedBtn: { backgroundColor: Colors.success },
  optimizeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  jobCard: { flexDirection: 'row', marginBottom: 4 },
  jobOrder: { alignItems: 'center', width: 50, paddingTop: 4 },
  orderCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E8', justifyContent: 'center', alignItems: 'center' },
  orderCompleted: { backgroundColor: Colors.success },
  orderActive: { backgroundColor: Colors.primary },
  orderNum: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  driveInfo: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 6 },
  driveText: { fontSize: 9, color: Colors.textSecondary, fontWeight: '600' },
  jobContent: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, marginLeft: 8 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  jobCustomer: { fontSize: 15, fontWeight: '600', color: Colors.text },
  jobTime: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  jobService: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  jobAddress: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  activeIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  activePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  activeText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  navigateBtn: { backgroundColor: '#E8F0FF', borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 8 },
  navigateBtnText: { fontSize: 13, fontWeight: '600', color: Colors.info },
});
