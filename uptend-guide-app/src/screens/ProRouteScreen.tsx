import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface RouteJob {
  id: string;
  order: number;
  customer: string;
  address: string;
  service: string;
  time: string;
  duration: string;
  distance: string;
  driveTime: string;
  status: 'upcoming' | 'in_progress' | 'completed';
}


export default function ProRouteScreen({ navigation }: any) {
  const [optimized, setOptimized] = useState(false);
  const totalDrive = '45 min';
  const savedTime = '23 min';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🗺️ Today's Route</Text>
        <Text style={styles.subtitle}>{[].length} jobs • {totalDrive} total drive time</Text>

        {/* Map placeholder */}
        <View style={styles.mapCard}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Route Map</Text>
          <View style={styles.routeLine}>
            {[].map((_, i) => (
              <React.Fragment key={i}>
                <View style={[styles.routeDot, i === 1 && styles.activeDot]} />
                {i < [].length - 1 && <View style={styles.routeConnector} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Optimize button */}
        <TouchableOpacity style={[styles.optimizeBtn, optimized && styles.optimizedBtn]} onPress={() => setOptimized(true)}>
          <Text style={styles.optimizeBtnText}>{optimized ? `✓ Optimized — Saving ${savedTime}` : '🧠 Optimize Route'}</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNum}>{[].length}</Text><Text style={styles.statLabel}>Jobs</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{totalDrive}</Text><Text style={styles.statLabel}>Drive Time</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>19.5 mi</Text><Text style={styles.statLabel}>Distance</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>$485</Text><Text style={styles.statLabel}>Est. Earnings</Text></View>
        </View>

        {/* Job list */}
        {[].map((job, index) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobOrder}>
              <View style={[styles.orderCircle, job.status === 'completed' && styles.orderCompleted, job.status === 'in_progress' && styles.orderActive]}>
                <Text style={styles.orderNum}>{job.status === 'completed' ? '✓' : job.order}</Text>
              </View>
              {index < [].length - 1 && (
                <View style={styles.driveInfo}>
                  <Text style={styles.driveText}>{job.driveTime} • {job.distance}</Text>
                </View>
              )}
            </View>
            <View style={styles.jobContent}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobCustomer}>{job.customer}</Text>
                <Text style={styles.jobTime}>{job.time}</Text>
              </View>
              <Text style={styles.jobService}>{job.service} • {job.duration}</Text>
              <Text style={styles.jobAddress}>{job.address}</Text>
              {job.status === 'in_progress' && (
                <View style={styles.activeIndicator}>
                  <View style={styles.activePulse} />
                  <Text style={styles.activeText}>In Progress</Text>
                </View>
              )}
              {job.status === 'upcoming' && (
                <TouchableOpacity style={styles.navigateBtn}>
                  <Text style={styles.navigateBtnText}>🧭 Navigate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
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
