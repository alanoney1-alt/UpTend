import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import ScoreCircle from '../components/ScoreCircle';
import { calculateHomeHealth, MOCK_SERVICE_HISTORY } from '../services/HomeHealthScoring';

function CategoryCard({ cat }: { cat: any }) {
  return (
    <View style={[styles.catCard, cat.overdue && styles.catCardOverdue]}>
      <View style={styles.catHeader}>
        <Text style={styles.catEmoji}>{cat.emoji}</Text>
        <View style={styles.catInfo}>
          <Text style={styles.catName}>{cat.name}</Text>
          <Text style={styles.catDate}>
            {cat.lastServiceDate ? `Last: ${cat.lastServiceDate}` : 'Never serviced'}
          </Text>
        </View>
        <View style={[styles.catScoreBadge, { backgroundColor: cat.score >= 75 ? Colors.success + '20' : cat.score >= 50 ? Colors.warning + '20' : Colors.error + '20' }]}>
          <Text style={[styles.catScore, { color: cat.score >= 75 ? Colors.success : cat.score >= 50 ? Colors.warning : Colors.error }]}>{cat.score}</Text>
        </View>
      </View>
      {cat.overdue && (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueText}>⚠️ {cat.suggestion}</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeHealthScreen() {
  const navigation = useNavigation<any>();
  const health = useMemo(() => calculateHomeHealth(MOCK_SERVICE_HISTORY), []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Score */}
      <View style={styles.scoreSection}>
        <ScoreCircle score={health.totalScore} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {[
          { label: '🔥 Streaks', screen: 'HomeStreaks' },
          { label: '📦 Subscribe', screen: 'Subscribe' },
          { label: '⚡ Deals', screen: 'FlashDeals' },
          { label: '💡 Tips', screen: 'ProTips' },
        ].map(action => (
          <TouchableOpacity key={action.screen} style={styles.quickAction} onPress={() => navigation.navigate(action.screen)}>
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Health Breakdown</Text>
      {health.categories.map(cat => (
        <CategoryCard key={cat.id} cat={cat} />
      ))}

      {/* History */}
      <Text style={styles.sectionTitle}>Score History</Text>
      <View style={styles.historyChart}>
        {health.history.map((h, i) => (
          <View key={i} style={styles.historyBar}>
            <View style={[styles.bar, { height: h.score * 0.8, backgroundColor: h.score >= 75 ? Colors.success : h.score >= 50 ? Colors.warning : Colors.error }]} />
            <Text style={styles.historyMonth}>{h.date.slice(5)}</Text>
          </View>
        ))}
      </View>

      {/* Neighborhood Activity */}
      <TouchableOpacity style={styles.neighborhoodBtn} onPress={() => navigation.navigate('NeighborhoodActivity')}>
        <Text style={styles.neighborhoodBtnText}>🏘️ See Neighborhood Activity</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  scoreSection: { alignItems: 'center', paddingVertical: 28, backgroundColor: Colors.white, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 12 },
  quickAction: { backgroundColor: Colors.white, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  quickActionText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  catCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  catCardOverdue: { borderLeftWidth: 3, borderLeftColor: Colors.error },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catEmoji: { fontSize: 28 },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  catDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  catScoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  catScore: { fontSize: 18, fontWeight: '800' },
  overdueBadge: { marginTop: 8, backgroundColor: Colors.error + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  overdueText: { fontSize: 12, color: Colors.error, fontWeight: '500' },
  historyChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginHorizontal: 16, height: 100, backgroundColor: Colors.white, borderRadius: 14, padding: 14 },
  historyBar: { alignItems: 'center', gap: 4 },
  bar: { width: 28, borderRadius: 6, minHeight: 4 },
  historyMonth: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },
  neighborhoodBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.purple, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  neighborhoodBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
