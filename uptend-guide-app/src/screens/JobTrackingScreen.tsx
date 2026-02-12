import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

type JobStatus = 'booked' | 'assigned' | 'en_route' | 'in_progress' | 'complete';

interface JobStep {
  key: JobStatus;
  label: string;
  icon: string;
  time?: string;
}

const STEPS: JobStep[] = [
  { key: 'booked', label: 'Booked', icon: '📋', time: '9:00 AM' },
  { key: 'assigned', label: 'Pro Assigned', icon: '✅', time: '9:05 AM' },
  { key: 'en_route', label: 'En Route', icon: '🚗', time: '9:20 AM' },
  { key: 'in_progress', label: 'In Progress', icon: '🔨' },
  { key: 'complete', label: 'Complete', icon: '🎉' },
];

const MOCK_PRO = {
  name: 'Marcus Johnson',
  rating: 4.9,
  reviews: 127,
  vehicle: 'White Ford F-150',
  photo: '👷',
  eta: '12 min',
  jobsCompleted: 342,
};

const MOCK_JOB = {
  service: 'Junk Removal',
  address: '123 Oak Street',
  date: 'Today, Feb 12',
  status: 'en_route' as JobStatus,
};

export default function JobTrackingScreen() {
  const [currentStatus] = useState<JobStatus>(MOCK_JOB.status);

  const statusIndex = STEPS.findIndex(s => s.key === currentStatus);

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: `I'm using UpTend for ${MOCK_JOB.service}. Pro: ${MOCK_PRO.name} (${MOCK_PRO.rating}⭐). Track my job in real-time on the UpTend app.`,
      });
    } catch {
      Alert.alert('Error', 'Could not share trip');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.serviceTitle}>{MOCK_JOB.service}</Text>
          <Text style={styles.serviceDate}>{MOCK_JOB.date} · {MOCK_JOB.address}</Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapText}>Live Map</Text>
          <Text style={styles.mapSubtext}>Pro is {MOCK_PRO.eta} away</Text>
          {/* Simulated markers */}
          <View style={[styles.marker, { top: 40, left: 60 }]}>
            <Text style={styles.markerText}>🏠</Text>
          </View>
          <View style={[styles.marker, { top: 70, right: 80 }]}>
            <Text style={styles.markerText}>🚗</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>ETA: {MOCK_PRO.eta}</Text>
          </View>
        </View>

        {/* Share Trip */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareTrip} activeOpacity={0.7}>
          <Text style={styles.shareBtnText}>🔗 Share My Trip</Text>
          <Text style={styles.shareSubtext}>Share with family for safety</Text>
        </TouchableOpacity>

        {/* Status Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Job Progress</Text>
          {STEPS.map((step, i) => {
            const isActive = i <= statusIndex;
            const isCurrent = i === statusIndex;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLine}>
                  <View style={[styles.stepDot, isActive && styles.stepDotActive, isCurrent && styles.stepDotCurrent]} >
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepConnector, isActive && styles.stepConnectorActive]} />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isCurrent && styles.stepLabelCurrent]}>
                    {step.label}
                  </Text>
                  {step.time && <Text style={styles.stepTime}>{step.time}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Pro Card */}
        <View style={styles.proCard}>
          <View style={styles.proHeader}>
            <View style={styles.proAvatar}>
              <Text style={styles.proAvatarText}>{MOCK_PRO.photo}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.proName}>{MOCK_PRO.name}</Text>
              <Text style={styles.proRating}>⭐ {MOCK_PRO.rating} · {MOCK_PRO.reviews} reviews · {MOCK_PRO.jobsCompleted} jobs</Text>
              <Text style={styles.proVehicle}>🚗 {MOCK_PRO.vehicle}</Text>
            </View>
          </View>
          <View style={styles.proActions}>
            <TouchableOpacity style={styles.proActionBtn}>
              <Text style={styles.proActionText}>💬 Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proActionBtn}>
              <Text style={styles.proActionText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Before/After Photos */}
        <View style={styles.photosSection}>
          <Text style={styles.photosTitle}>Before & After Photos</Text>
          <View style={styles.photosRow}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>📸</Text>
              <Text style={styles.photoLabel}>Before</Text>
            </View>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>📸</Text>
              <Text style={styles.photoLabel}>After</Text>
            </View>
          </View>
          <Text style={styles.photosHint}>Photos will be taken by your pro during the job</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  header: { padding: Spacing.xl, backgroundColor: Colors.white },
  serviceTitle: { ...Typography.h2 },
  serviceDate: { ...Typography.caption, marginTop: Spacing.xs },
  mapPlaceholder: {
    height: 200, backgroundColor: '#E8F0FF', justifyContent: 'center', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  mapEmoji: { fontSize: 36 },
  mapText: { ...Typography.bodyBold, marginTop: Spacing.xs },
  mapSubtext: { ...Typography.caption },
  marker: { position: 'absolute' },
  markerText: { fontSize: 28 },
  etaBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6,
  },
  etaText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FDF2F8', marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#FBCFE8',
  },
  shareBtnText: { ...Typography.bodyBold, color: '#BE185D' },
  shareSubtext: { ...Typography.small, color: '#BE185D' },
  stepsCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm,
  },
  stepsTitle: { ...Typography.h4, marginBottom: Spacing.lg },
  stepRow: { flexDirection: 'row', minHeight: 56 },
  stepLine: { alignItems: 'center', width: 40, marginRight: Spacing.md },
  stepDot: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#FFF7ED' },
  stepDotCurrent: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  stepIcon: { fontSize: 16 },
  stepConnector: { width: 2, flex: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },
  stepConnectorActive: { backgroundColor: Colors.primary },
  stepInfo: { flex: 1, paddingTop: 6 },
  stepLabel: { ...Typography.body, color: Colors.textLight },
  stepLabelActive: { color: Colors.text },
  stepLabelCurrent: { ...Typography.bodyBold, color: Colors.primary },
  stepTime: { ...Typography.small, marginTop: 2 },
  proCard: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm,
  },
  proHeader: { flexDirection: 'row', gap: Spacing.md },
  proAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center',
  },
  proAvatarText: { fontSize: 28 },
  proName: { ...Typography.h4 },
  proRating: { ...Typography.caption, marginTop: 2 },
  proVehicle: { ...Typography.caption, marginTop: 2 },
  proActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  proActionBtn: {
    flex: 1, backgroundColor: Colors.background, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  proActionText: { ...Typography.bodyBold, fontSize: 14 },
  photosSection: {
    backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm,
  },
  photosTitle: { ...Typography.h4, marginBottom: Spacing.md },
  photosRow: { flexDirection: 'row', gap: Spacing.md },
  photoPlaceholder: {
    flex: 1, height: 120, backgroundColor: Colors.background, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed',
  },
  photoEmoji: { fontSize: 28 },
  photoLabel: { ...Typography.captionBold, marginTop: Spacing.xs },
  photosHint: { ...Typography.small, textAlign: 'center', marginTop: Spacing.md },
});
