import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';
import { fetchMyBookings } from '../services/api';

type JobStatus = 'booked' | 'assigned' | 'en_route' | 'in_progress' | 'complete';

interface JobStep {
  key: JobStatus;
  label: string;
  icon: string;
  time?: string;
}

const STEPS: JobStep[] = [
  { key: 'booked', label: 'Booked', icon: '📋' },
  { key: 'assigned', label: 'Pro Assigned', icon: '✅' },
  { key: 'en_route', label: 'En Route', icon: '🚗' },
  { key: 'in_progress', label: 'In Progress', icon: '🔨' },
  { key: 'complete', label: 'Complete', icon: '🎉' },
];

function mapStatus(s: string): JobStatus {
  const map: Record<string, JobStatus> = {
    pending: 'booked', accepted: 'assigned', en_route: 'en_route',
    in_progress: 'in_progress', completed: 'complete', active: 'in_progress',
  };
  return map[s] || 'booked';
}

export default function JobTrackingScreen() {
  const [job, setJob] = useState<any>(null);
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyBookings()
      .then(data => {
        const jobs = data.requests || data.bookings || [];
        // Show most recent active job
        const active = jobs.find((j: any) => !['completed', 'cancelled'].includes(j.status)) || jobs[0];
        if (active) {
          setJob(active);
          setPro(active.pro || { name: active.pro_name || 'Your Pro', rating: active.pro_rating || 4.8 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Active Jobs</Text>
          <Text style={styles.emptyText}>Book a service to start tracking your job here.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = mapStatus(job.status);
  const statusIndex = STEPS.findIndex(s => s.key === currentStatus);

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: `I'm using UpTend for ${job.service_type || job.serviceType || 'home service'}. Track my job in real-time on the UpTend app.`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <Text style={styles.serviceTitle}>{job.service_type || job.serviceType || 'Service'}</Text>
          <Text style={styles.serviceDate}>{job.scheduled_date || job.scheduledDate || 'Scheduled'} · {job.pickup_address || job.address || ''}</Text>
        </View>

        {/* Map placeholder */}
        <View style={styles.mapArea}>
          <Text style={styles.mapText}>📍 Live Tracking</Text>
          <Text style={styles.mapSubtext}>Pro is on the way</Text>
        </View>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, i) => (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= statusIndex && styles.stepDotActive]}>
                <Text style={styles.stepIcon}>{step.icon}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < statusIndex && styles.stepLineActive]} />
              )}
              <View style={styles.stepLabel}>
                <Text style={[styles.stepText, i <= statusIndex && styles.stepTextActive]}>{step.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pro Card */}
        {pro && (
          <View style={styles.proCard}>
            <View style={styles.proAvatar}>
              <Text style={styles.proAvatarText}>👷</Text>
            </View>
            <View style={styles.proInfo}>
              <Text style={styles.proName}>{pro.name || pro.first_name || 'Your Pro'}</Text>
              <Text style={styles.proRating}>⭐ {pro.rating || 4.8} · {pro.jobs_completed || 0} jobs</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShareTrip}>
            <Text style={styles.actionText}>📤 Share Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Contact', 'Calling your pro...')}>
            <Text style={styles.actionText}>📞 Call Pro</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  jobHeader: { padding: 20 },
  serviceTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  serviceDate: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  mapArea: { height: 160, backgroundColor: Colors.surface, margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: '600', color: Colors.text },
  mapSubtext: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  stepsContainer: { paddingHorizontal: 24, paddingVertical: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: Colors.primary + '20' },
  stepLine: { width: 2, height: 20, backgroundColor: Colors.surface, marginLeft: 17, position: 'absolute', top: 36 },
  stepLineActive: { backgroundColor: Colors.primary },
  stepIcon: { fontSize: 16 },
  stepLabel: { marginLeft: 12 },
  stepText: { fontSize: 15, color: Colors.textLight },
  stepTextActive: { color: Colors.text, fontWeight: '600' },
  proCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, backgroundColor: Colors.surface, borderRadius: 16 },
  proAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
  proAvatarText: { fontSize: 24 },
  proInfo: { marginLeft: 12 },
  proName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  proRating: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  actionBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 12 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
