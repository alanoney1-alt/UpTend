import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { LoadingScreen } from '../components/ui';
import { fetchAcademyCertifications, fetchAcademyCareerLadder } from '../services/api';

type CertStatus = 'Available' | 'In Progress' | 'Certified' | 'Expired';

interface Certification {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  status: CertStatus;
  progress: number;
  icon: string;
  color: string;
  expiresAt?: string;
}

const CERTIFICATIONS: Certification[] = [
  { id: '1', name: 'B2B Property Management', description: 'Master commercial property service workflows, bulk scheduling, and PM communication protocols.', estimatedHours: 8, status: 'In Progress', progress: 0.45, icon: '🏢', color: '#3B82F6' },
  { id: '2', name: 'B2B HOA', description: 'Learn HOA compliance standards, community board reporting, and seasonal planning.', estimatedHours: 6, status: 'Available', progress: 0, icon: '🏘️', color: '#10B981' },
  { id: '3', name: 'AI Home Scan', description: 'Use AR/AI tools to assess property conditions, generate scopes, and create estimates.', estimatedHours: 4, status: 'Certified', progress: 1, icon: '📱', color: '#8B5CF6' },
  { id: '4', name: 'Parts & Materials', description: 'Handle parts requests, supplier coordination, receipt tracking, and cost management.', estimatedHours: 3, status: 'Available', progress: 0, icon: '🔧', color: '#F97316' },
  { id: '5', name: 'Emergency Response', description: 'Rapid response protocols, damage documentation, insurance coordination, and safety procedures.', estimatedHours: 5, status: 'Expired', progress: 1, icon: '🚨', color: '#EF4444', expiresAt: 'Jan 15, 2026' },
  { id: '6', name: 'Government Contract', description: 'Federal/state contract requirements, Davis-Bacon compliance, and documentation standards.', estimatedHours: 10, status: 'Available', progress: 0, icon: '🏛️', color: '#1E3A5F' },
];

const FEE_TIERS = [
  { certs: 0, fee: '15%', label: 'Starter' },
  { certs: 2, fee: '12%', label: 'Skilled' },
  { certs: 4, fee: '10%', label: 'Expert' },
  { certs: 6, fee: '8%', label: 'Elite' },
];

const statusColors: Record<CertStatus, { bg: string; text: string }> = {
  'Available': { bg: '#F3F4F6', text: '#6B7280' },
  'In Progress': { bg: '#DBEAFE', text: '#2563EB' },
  'Certified': { bg: '#D1FAE5', text: '#059669' },
  'Expired': { bg: '#FEE2E2', text: '#DC2626' },
};

export default function AcademyScreen() {
  const [certs, setCerts] = useState<Certification[]>(CERTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [certRes, _ladderRes] = await Promise.all([
        fetchAcademyCertifications().catch(() => null),
        fetchAcademyCareerLadder().catch(() => null),
      ]);
      if (certRes?.certifications || certRes?.courses) {
        const list = (certRes.certifications || certRes.courses || []).map((c: any, i: number) => ({
          id: c.id || `${i}`,
          name: c.name || c.title || 'Course',
          description: c.description || '',
          estimatedHours: c.estimatedHours || c.hours || 4,
          status: c.status || 'Available',
          progress: c.progress || 0,
          icon: c.icon || '📚',
          color: c.color || '#3B82F6',
          expiresAt: c.expiresAt,
        }));
        setCerts(list);
      }
    } catch { /* keep fallback data */ }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <LoadingScreen message="Loading Pro Academy..." />;
  const earnedCount = certs.filter(c => c.status === 'Certified').length;
  const currentTier = FEE_TIERS.filter(t => t.certs <= earnedCount).pop()!;

  const getButtonLabel = (status: CertStatus) => {
    switch (status) {
      case 'Available': return 'Start';
      case 'In Progress': return 'Continue';
      case 'Expired': return 'Renew';
      case 'Certified': return 'View';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Pro Academy</Text>
            <Text style={styles.subtitle}>{earnedCount} of {certs.length} certifications earned</Text>
          </View>
          <View style={[styles.tierBadge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.tierLabel}>{currentTier.label}</Text>
            <Text style={styles.tierFee}>{currentTier.fee} fee</Text>
          </View>
        </View>

        {/* Certifications */}
        <Text style={styles.sectionTitle}>Certifications</Text>
        {certs.map((cert) => (
          <View key={cert.id} style={styles.certCard}>
            <View style={styles.certHeader}>
              <View style={[styles.certIcon, { backgroundColor: cert.color + '20' }]}>
                <Text style={{ fontSize: 24 }}>{cert.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certTime}>⏱ {cert.estimatedHours}h estimated</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[cert.status].bg }]}>
                <Text style={[styles.statusText, { color: statusColors[cert.status].text }]}>{cert.status}</Text>
              </View>
            </View>
            <Text style={styles.certDesc}>{cert.description}</Text>
            {cert.status === 'In Progress' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${cert.progress * 100}%`, backgroundColor: cert.color }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(cert.progress * 100)}%</Text>
              </View>
            )}
            {cert.status === 'Expired' && cert.expiresAt && (
              <Text style={styles.expiredText}>Expired {cert.expiresAt}</Text>
            )}
            <TouchableOpacity
              style={[styles.certBtn, cert.status === 'Certified' && styles.certBtnSecondary]}
              activeOpacity={0.8}
            >
              <Text style={[styles.certBtnText, cert.status === 'Certified' && styles.certBtnTextSecondary]}>
                {getButtonLabel(cert.status)}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Career Ladder */}
        <Text style={styles.sectionTitle}>Career Ladder</Text>
        <View style={styles.ladderCard}>
          <Text style={styles.ladderIntro}>Earn certifications to unlock lower platform fees and keep more money.</Text>
          {FEE_TIERS.map((tier, i) => (
            <View key={tier.label} style={[styles.tierRow, earnedCount >= tier.certs && styles.tierRowActive]}>
              <View style={[styles.tierDot, earnedCount >= tier.certs ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.borderLight }]} />
              {i < FEE_TIERS.length - 1 && <View style={[styles.tierLine, earnedCount > tier.certs ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.borderLight }]} />}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.tierName, earnedCount >= tier.certs && { color: Colors.primary }]}>{tier.label}</Text>
                <Text style={styles.tierDetail}>{tier.certs === 0 ? 'No certs required' : `${tier.certs}+ certifications`}</Text>
              </View>
              <Text style={[styles.tierFeeLabel, earnedCount >= tier.certs && { color: Colors.primary }]}>{tier.fee}</Text>
            </View>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  tierBadge: { borderRadius: 14, padding: 14, alignItems: 'center' },
  tierLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  tierFee: { color: Colors.white, fontSize: 20, fontWeight: '800', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 4 },

  certCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  certHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  certIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  certName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  certTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  certDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '700', color: Colors.text },

  expiredText: { fontSize: 12, color: Colors.error, marginBottom: 8 },

  certBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  certBtnSecondary: { backgroundColor: Colors.background },
  certBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  certBtnTextSecondary: { color: Colors.primary },

  ladderCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  ladderIntro: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  tierRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, position: 'relative' },
  tierRowActive: {},
  tierDot: { width: 14, height: 14, borderRadius: 7 },
  tierLine: { position: 'absolute', left: 6, top: 26, width: 2, height: 24 },
  tierName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tierDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tierFeeLabel: { fontSize: 18, fontWeight: '800', color: Colors.textLight },
});
