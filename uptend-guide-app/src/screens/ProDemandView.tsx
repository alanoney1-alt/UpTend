import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface NearbyJob {
  id: string;
  service: string;
  icon: string;
  distance: string;
  urgency: 'now' | 'today' | 'this_week';
  estimatedPay: number;
  postedAgo: string;
  competitors: number; // other pros who can see this
}

const MOCK_NEARBY_JOBS: NearbyJob[] = [
  { id: 'j1', service: 'Junk Removal', icon: '🗑️', distance: '1.2 mi', urgency: 'now', estimatedPay: 185, postedAgo: '2 min ago', competitors: 3 },
  { id: 'j2', service: 'Pressure Washing', icon: '💦', distance: '2.8 mi', urgency: 'now', estimatedPay: 165, postedAgo: '8 min ago', competitors: 5 },
  { id: 'j3', service: 'Lawn Care', icon: '🌿', distance: '0.5 mi', urgency: 'today', estimatedPay: 75, postedAgo: '25 min ago', competitors: 2 },
  { id: 'j4', service: 'Handyman', icon: '🔧', distance: '3.5 mi', urgency: 'today', estimatedPay: 120, postedAgo: '1 hr ago', competitors: 4 },
  { id: 'j5', service: 'Pool Cleaning', icon: '🏊', distance: '4.1 mi', urgency: 'this_week', estimatedPay: 110, postedAgo: '3 hrs ago', competitors: 1 },
];

const URGENCY_CONFIG = {
  now: { label: '🔴 ASAP', bg: '#FEE2E2', color: Colors.error },
  today: { label: '🟡 Today', bg: '#FFF8E1', color: Colors.warning },
  this_week: { label: '🟢 This Week', bg: '#E8F5E8', color: Colors.success },
};

export default function ProDemandView({ navigation }: any) {
  const [jobs] = useState(MOCK_NEARBY_JOBS);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📡 Nearby Demand</Text>
        <Text style={styles.subtitle}>Jobs customers are looking for right now</Text>

        {/* Demand heat map placeholder */}
        <View style={styles.heatMap}>
          <Text style={styles.heatIcon}>🗺️</Text>
          <Text style={styles.heatText}>Demand Heat Map</Text>
          {/* Heat bubbles */}
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(239,68,68,0.2)', top: 15, left: 30, width: 70, height: 70 }]} />
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(245,158,11,0.2)', bottom: 20, right: 40, width: 55, height: 55 }]} />
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(16,185,129,0.15)', top: 40, right: 60, width: 40, height: 40 }]} />
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{jobs.filter(j => j.urgency === 'now').length}</Text>
            <Text style={styles.summaryLabel}>Need ASAP</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>{jobs.length}</Text>
            <Text style={styles.summaryLabel}>Total Nearby</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNum}>${jobs.reduce((s, j) => s + j.estimatedPay, 0)}</Text>
            <Text style={styles.summaryLabel}>Potential</Text>
          </View>
        </View>

        {/* Job list */}
        <Text style={styles.sectionTitle}>Available Jobs</Text>
        {jobs.map(job => {
          const urg = URGENCY_CONFIG[job.urgency];
          return (
            <TouchableOpacity key={job.id} style={styles.jobCard} activeOpacity={0.7}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobIcon}>{job.icon}</Text>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobService}>{job.service}</Text>
                  <Text style={styles.jobMeta}>📍 {job.distance} • {job.postedAgo}</Text>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: urg.bg }]}>
                  <Text style={[styles.urgencyText, { color: urg.color }]}>{urg.label}</Text>
                </View>
              </View>
              <View style={styles.jobFooter}>
                <Text style={styles.jobPay}>${job.estimatedPay}</Text>
                <View style={styles.competitorInfo}>
                  <Text style={styles.competitorText}>👀 {job.competitors} pros can see this</Text>
                </View>
                <TouchableOpacity style={styles.respondBtn}>
                  <Text style={styles.respondBtnText}>⚡ Respond</Text>
                </TouchableOpacity>
              </View>
              {job.urgency === 'now' && (
                <Text style={styles.firstToRespond}>🏃 First to respond gets it!</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  heatMap: { height: 150, backgroundColor: '#1a1a2e', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' },
  heatIcon: { fontSize: 28 },
  heatText: { color: '#999', fontSize: 13, marginTop: 4 },
  heatBubble: { position: 'absolute', borderRadius: 100 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  jobCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  jobHeader: { flexDirection: 'row', alignItems: 'center' },
  jobIcon: { fontSize: 28, marginRight: 12 },
  jobInfo: { flex: 1 },
  jobService: { fontSize: 16, fontWeight: '700', color: Colors.text },
  jobMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  urgencyBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  urgencyText: { fontSize: 11, fontWeight: '700' },
  jobFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  jobPay: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  competitorInfo: { flex: 1 },
  competitorText: { fontSize: 11, color: Colors.textSecondary },
  respondBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  respondBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  firstToRespond: { fontSize: 12, color: Colors.error, fontWeight: '600', marginTop: 6, fontStyle: 'italic' },
});
