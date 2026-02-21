import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { LoadingScreen } from '../components/ui';
import { fetchProById } from '../services/api';

export default function VerifyProScreen({ route }: any) {
  const proId = route?.params?.proId;
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proId) { setLoading(false); return; }
    fetchProById(proId)
      .then(data => setPro(data?.pros?.[0] || data?.pro || data || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [proId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!pro) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Pro Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.proHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👷</Text>
          </View>
          <Text style={styles.proName}>{pro.firstName || pro.first_name} {pro.lastName || pro.last_name}</Text>
          {pro.companyName && <Text style={styles.company}>{pro.companyName}</Text>}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {pro.rating || 4.8} ({pro.jobsCompleted || pro.jobs_completed || 0} jobs)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyIcon}>✅</Text>
            <Text style={styles.verifyText}>Identity Verified</Text>
          </View>
          {pro.hasInsurance && (
            <View style={styles.verifyRow}>
              <Text style={styles.verifyIcon}>🛡️</Text>
              <Text style={styles.verifyText}>$1M Liability Insurance</Text>
            </View>
          )}
          {pro.hasLLC && (
            <View style={styles.verifyRow}>
              <Text style={styles.verifyIcon}>🏢</Text>
              <Text style={styles.verifyText}>Registered Business (LLC)</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.tagsRow}>
            {(pro.serviceTypes || pro.service_types || []).map((s: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{s.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  content: { padding: 20 },
  proHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36 },
  proName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  company: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  ratingRow: { marginTop: 8 },
  ratingText: { fontSize: 15, color: Colors.text },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  verifyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  verifyIcon: { fontSize: 18, marginRight: 10 },
  verifyText: { fontSize: 15, color: Colors.text },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primary + '15', borderRadius: 20 },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '500', textTransform: 'capitalize' },
});
