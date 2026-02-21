import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { LoadingScreen, EmptyState } from '../components/ui';
import { fetchLeaderboard } from '../services/api';

interface ProRank {
  id: string;
  name: string;
  rank: number;
  prevRank: number;
  jobs: number;
  rating: number;
  earnings: number;
  badges: string[];
}

const TIME_FILTERS = ['This Week', 'This Month', 'All Time'] as const;
const METRIC_MAP: Record<string, string> = { Jobs: 'jobs', Rating: 'rating', Earnings: 'earnings', Speed: 'speed' };
const PERIOD_MAP: Record<string, string> = { 'This Week': 'week', 'This Month': 'month', 'All Time': 'all' };

export default function LeaderboardScreen() {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [metric, setMetric] = useState('Jobs');
  const [leaders, setLeaders] = useState<ProRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchLeaderboard(METRIC_MAP[metric] || 'jobs', PERIOD_MAP[timeFilter] || 'month');
      const list: ProRank[] = (res?.leaders || res?.leaderboard || res || []).map((p: any, i: number) => ({
        id: p.id || `${i}`,
        name: p.name || p.username || 'Pro',
        rank: p.rank || i + 1,
        prevRank: p.prevRank || p.rank || i + 1,
        jobs: p.jobs || p.totalJobs || 0,
        rating: p.rating || 0,
        earnings: p.earnings || p.totalEarnings || 0,
        badges: p.badges || [],
      }));
      setLeaders(list);
    } catch {
      setLeaders([]);
    }
  }, [metric, timeFilter]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const rankChange = (current: number, prev: number) => {
    if (current < prev) return { text: `↑${prev - current}`, color: Colors.success };
    if (current > prev) return { text: `↓${current - prev}`, color: Colors.error };
    return { text: '—', color: Colors.textLight };
  };

  if (loading) return <LoadingScreen message="Loading leaderboard..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title} accessibilityRole="header">🏆 Leaderboard</Text>
      <Text style={styles.subtitle}>Orlando Area Rankings</Text>

      <View style={styles.timeRow}>
        {TIME_FILTERS.map(t => (
          <TouchableOpacity key={t} style={[styles.timeBtn, timeFilter === t && styles.timeActive]} onPress={() => setTimeFilter(t)} accessibilityRole="button">
            <Text style={[styles.timeText, timeFilter === t && styles.timeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metricRow}>
        {Object.keys(METRIC_MAP).map(m => (
          <TouchableOpacity key={m} style={[styles.metricBtn, metric === m && styles.metricActive]} onPress={() => setMetric(m)} accessibilityRole="button">
            <Text style={[styles.metricText, metric === m && styles.metricTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {leaders.length === 0 ? (
        <EmptyState icon="🏆" title="No Rankings Yet" description="Mr. George says: Check back soon — the leaderboard updates as pros complete jobs!" />
      ) : (
        <>
          {/* Top 3 podium */}
          {leaders.length >= 3 && (
            <View style={styles.podium}>
              {[leaders[1], leaders[0], leaders[2]].map((p, i) => {
                const heights = [80, 110, 60];
                const medals = ['🥈', '👑', '🥉'];
                return (
                  <View key={p.id} style={styles.podiumItem}>
                    <Text style={styles.podiumMedal}>{medals[i]}</Text>
                    <Text style={[styles.podiumName, p.name === 'You' && styles.youName]}>{p.name}</Text>
                    <View style={[styles.podiumBar, { height: heights[i], backgroundColor: i === 1 ? Colors.primary : Colors.purple }]}>
                      <Text style={styles.podiumRank}>#{p.rank}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <FlatList
            data={leaders.slice(3)}
            keyExtractor={p => p.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            renderItem={({ item }) => {
              const rc = rankChange(item.rank, item.prevRank);
              return (
                <View style={[styles.card, item.name === 'You' && styles.youCard]} accessibilityLabel={`Rank ${item.rank}: ${item.name}`}>
                  <Text style={styles.cardRank}>#{item.rank}</Text>
                  <View style={[styles.rankChange, { backgroundColor: `${rc.color}20` }]}>
                    <Text style={[styles.rankChangeText, { color: rc.color }]}>{rc.text}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardName, item.name === 'You' && styles.youText]}>{item.name}</Text>
                    <Text style={styles.cardStats}>{item.jobs} jobs • ⭐ {item.rating} • ${item.earnings.toLocaleString()}</Text>
                  </View>
                  <View style={styles.badgeRow}>{item.badges.map((b: string, i: number) => <Text key={i} style={styles.badge}>{b}</Text>)}</View>
                </View>
              );
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, paddingHorizontal: 20, marginTop: 4 },
  timeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginTop: 12 },
  timeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' },
  timeActive: { backgroundColor: Colors.primary },
  timeText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  timeTextActive: { color: '#fff' },
  metricRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginTop: 8, marginBottom: 12 },
  metricBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  metricActive: { backgroundColor: Colors.purple },
  metricText: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  metricTextActive: { color: '#fff' },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumMedal: { fontSize: 24 },
  podiumName: { fontSize: 11, fontWeight: '600', color: Colors.text, marginVertical: 4, textAlign: 'center' },
  youName: { color: Colors.primary, fontWeight: '800' },
  podiumBar: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'center', alignItems: 'center' },
  podiumRank: { color: '#fff', fontWeight: '800', fontSize: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  youCard: { borderWidth: 2, borderColor: Colors.primary },
  cardRank: { fontSize: 16, fontWeight: '800', color: Colors.text, width: 30 },
  rankChange: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginRight: 8 },
  rankChangeText: { fontSize: 10, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  youText: { color: Colors.primary },
  cardStats: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 2 },
  badge: { fontSize: 16 },
});
