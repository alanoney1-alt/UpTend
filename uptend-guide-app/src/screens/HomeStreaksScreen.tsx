import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchHomeStreaks } from '../services/api';

export default function HomeStreaksScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeStreaks()
      .then(d => setData(d))
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

  const streak = data?.currentStreak ?? 0;
  const milestones = data?.milestones || [];
  const leaderboard = data?.leaderboard || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔥 Home Streaks</Text>

        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Week Streak</Text>
          <Text style={styles.streakSub}>Keep your home maintained every week!</Text>
        </View>

        {milestones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Milestones</Text>
            {milestones.map((m: any, i: number) => (
              <View key={i} style={styles.milestoneRow}>
                <Text style={styles.milestoneIcon}>{m.achieved ? '✅' : '⬜'}</Text>
                <Text style={[styles.milestoneText, m.achieved && styles.milestoneAchieved]}>
                  {m.name || m.title || `${m.weeks || 0} weeks`}
                </Text>
                {m.reward && <Text style={styles.milestoneReward}>{m.reward}</Text>}
              </View>
            ))}
          </View>
        )}

        {leaderboard.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Neighborhood Leaderboard</Text>
            {leaderboard.map((entry: any, i: number) => (
              <View key={i} style={styles.leaderRow}>
                <Text style={styles.leaderRank}>#{i + 1}</Text>
                <Text style={styles.leaderName}>{entry.name || 'Neighbor'}</Text>
                <Text style={styles.leaderStreak}>🔥 {entry.streak || 0}</Text>
              </View>
            ))}
          </View>
        )}

        {!data && (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>Book your first service to start your home maintenance streak!</Text>
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
  streakCard: { alignItems: 'center', padding: 32, backgroundColor: Colors.surface, borderRadius: 20, marginBottom: 24 },
  streakEmoji: { fontSize: 48 },
  streakNumber: { fontSize: 56, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  streakLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 4 },
  streakSub: { fontSize: 13, color: Colors.textLight, marginTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8 },
  milestoneIcon: { fontSize: 18, marginRight: 10 },
  milestoneText: { flex: 1, fontSize: 14, color: Colors.textLight },
  milestoneAchieved: { color: Colors.text, fontWeight: '600' },
  milestoneReward: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8 },
  leaderRank: { width: 30, fontSize: 16, fontWeight: '700', color: Colors.primary },
  leaderName: { flex: 1, fontSize: 14, color: Colors.text },
  leaderStreak: { fontSize: 14, fontWeight: '600', color: Colors.text },
  emptySection: { padding: 24, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
});
