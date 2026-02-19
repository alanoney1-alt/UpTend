import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchHomeHealth } from '../services/api';

export default function HomeHealthScreen() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeHealth()
      .then(data => setHealth(data))
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

  const score = health?.score ?? health?.overallScore ?? 0;
  const systems = health?.systems || health?.categories || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏠 Home Health Score</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
          <Text style={styles.scoreStatus}>
            {score >= 80 ? '✅ Healthy' : score >= 60 ? '⚠️ Needs Attention' : '🔴 Action Required'}
          </Text>
        </View>

        {systems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Breakdown</Text>
            {systems.map((s: any, i: number) => (
              <View key={i} style={styles.systemRow}>
                <Text style={styles.systemName}>{s.name || s.system || 'System'}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${s.score || s.health || 0}%`, backgroundColor: (s.score || s.health || 0) >= 70 ? '#34C759' : '#FF9F0A' }]} />
                </View>
                <Text style={styles.systemScore}>{s.score || s.health || 0}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Complete an AI Home Scan to see your home health breakdown.</Text>
          </View>
        )}

        {health?.recommendations && health.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {health.recommendations.map((r: any, i: number) => (
              <View key={i} style={styles.recCard}>
                <Text style={styles.recText}>{typeof r === 'string' ? r : r.text || r.recommendation}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  scoreCard: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 24 },
  scoreNumber: { fontSize: 64, fontWeight: '800', color: Colors.primary },
  scoreLabel: { fontSize: 18, color: Colors.textLight, marginTop: -8 },
  scoreStatus: { fontSize: 16, fontWeight: '600', marginTop: 12, color: Colors.text },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  systemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  systemName: { width: 90, fontSize: 13, color: Colors.text },
  barBg: { flex: 1, height: 8, backgroundColor: Colors.surface, borderRadius: 4, marginHorizontal: 8 },
  barFill: { height: 8, borderRadius: 4 },
  systemScore: { width: 40, fontSize: 13, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  emptySection: { padding: 24, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  recCard: { padding: 12, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8 },
  recText: { fontSize: 14, color: Colors.text },
});
