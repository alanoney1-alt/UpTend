import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

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


const TIME_FILTERS = ['This Week', 'This Month', 'All Time'];
const METRIC_FILTERS = ['Jobs', 'Rating', 'Earnings', 'Speed'];

export default function LeaderboardScreen() {
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [metric, setMetric] = useState('Jobs');

  const rankChange = (current: number, prev: number) => {
    if (current < prev) return { text: `↑${prev - current}`, color: Colors.success };
    if (current > prev) return { text: `↓${current - prev}`, color: Colors.error };
    return { text: '—', color: Colors.textLight };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>🏆 Leaderboard</Text>
      <Text style={styles.subtitle}>Orlando Area Rankings</Text>

      <View style={styles.timeRow}>
        {TIME_FILTERS.map(t => (
          <TouchableOpacity key={t} style={[styles.timeBtn, timeFilter === t && styles.timeActive]} onPress={() => setTimeFilter(t)}>
            <Text style={[styles.timeText, timeFilter === t && styles.timeTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.metricRow}>
        {METRIC_FILTERS.map(m => (
          <TouchableOpacity key={m} style={[styles.metricBtn, metric === m && styles.metricActive]} onPress={() => setMetric(m)}>
            <Text style={[styles.metricText, metric === m && styles.metricTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 podium */}
      <View style={styles.podium}>
        {[[][1], [][0], [][2]].map((p, i) => {
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

      <FlatList
        data={[]}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const rc = rankChange(item.rank, item.prevRank);
          return (
            <View style={[styles.card, item.name === 'You' && styles.youCard]}>
              <Text style={styles.cardRank}>#{item.rank}</Text>
              <View style={[styles.rankChange, { backgroundColor: `${rc.color}20` }]}>
                <Text style={[styles.rankChangeText, { color: rc.color }]}>{rc.text}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, item.name === 'You' && styles.youText]}>{item.name}</Text>
                <Text style={styles.cardStats}>{item.jobs} jobs • ⭐ {item.rating} • ${item.earnings.toLocaleString()}</Text>
              </View>
              <View style={styles.badgeRow}>{item.badges.map((b, i) => <Text key={i} style={styles.badge}>{b}</Text>)}</View>
            </View>
          );
        }}
      />
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
