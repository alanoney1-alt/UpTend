import React from 'react';
import { View, Text, ScrollView, StyleSheet, Share, TouchableOpacity } from 'react-native';
import { Colors } from '../theme/colors';
import StreakCalendar from '../components/StreakCalendar';
import { MOCK_WEEK_DATA, STREAK_MILESTONES, MOCK_LEADERBOARD } from '../data/mockStreaks';
import { getCurrentStreak, getMilestoneProgress, getDiscountForStreak } from '../services/StreakService';

export default function HomeStreaksScreen() {
  const streak = getCurrentStreak();
  const discount = getDiscountForStreak(streak);
  const { current, next, progress } = getMilestoneProgress(streak);

  const shareStreak = () => {
    Share.share({ message: `🔥 I'm on a ${streak}-week home maintenance streak with UpTend! My home has never looked better. 🏠✨` });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Streak Hero */}
      <View style={styles.hero}>
        <Text style={styles.fireEmoji}>🔥</Text>
        <Text style={styles.streakNum}>{streak}</Text>
        <Text style={styles.streakLabel}>week streak!</Text>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>You earn {discount}% off services</Text>
          </View>
        )}
        <TouchableOpacity style={styles.shareBtn} onPress={shareStreak}>
          <Text style={styles.shareBtnText}>Share Your Streak ↗️</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <StreakCalendar weeks={MOCK_WEEK_DATA} />
      </View>

      {/* Next Milestone */}
      {next && (
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneTitle}>Next Milestone</Text>
          <View style={styles.milestoneRow}>
            <Text style={styles.milestoneEmoji}>{next.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneName}>{next.name} — {next.weeks} weeks</Text>
              <Text style={styles.milestoneDesc}>{next.description}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{streak}/{next.weeks} weeks</Text>
        </View>
      )}

      {/* All Badges */}
      <Text style={styles.sectionTitle}>Badge Collection</Text>
      <View style={styles.badgeGrid}>
        {STREAK_MILESTONES.map(m => (
          <View key={m.weeks} style={[styles.badgeItem, !m.unlocked && styles.badgeLocked]}>
            <Text style={[styles.badgeEmoji, !m.unlocked && { opacity: 0.3 }]}>{m.emoji}</Text>
            <Text style={styles.badgeName}>{m.name}</Text>
            <Text style={styles.badgeWeeks}>{m.weeks}w</Text>
            {m.discount > 0 && <Text style={styles.badgeDiscount}>{m.discount}% off</Text>}
          </View>
        ))}
      </View>

      {/* Leaderboard */}
      <Text style={styles.sectionTitle}>Neighborhood Rankings</Text>
      <View style={styles.leaderboard}>
        {MOCK_LEADERBOARD.map(entry => (
          <View key={entry.rank} style={[styles.leaderRow, entry.isUser && styles.leaderRowUser]}>
            <Text style={styles.leaderRank}>#{entry.rank}</Text>
            <Text style={styles.leaderBadge}>{entry.badge}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.leaderName, entry.isUser && { color: Colors.primary, fontWeight: '700' }]}>{entry.name}</Text>
              <Text style={styles.leaderHood}>{entry.neighborhood}</Text>
            </View>
            <Text style={styles.leaderStreak}>{entry.streak}w 🔥</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  hero: { alignItems: 'center', paddingVertical: 32, backgroundColor: Colors.primary, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  fireEmoji: { fontSize: 48 },
  streakNum: { fontSize: 56, fontWeight: '900', color: Colors.white, marginTop: -4 },
  streakLabel: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginTop: -4 },
  discountBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginTop: 12 },
  discountText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  shareBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, marginTop: 12 },
  shareBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  calendarCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  milestoneCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  milestoneTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  milestoneEmoji: { fontSize: 32 },
  milestoneName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  milestoneDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  progressTrack: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, marginTop: 14 },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, textAlign: 'right' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, justifyContent: 'center' },
  badgeItem: { backgroundColor: Colors.white, width: 100, alignItems: 'center', padding: 14, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
  badgeLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 32 },
  badgeName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginTop: 6 },
  badgeWeeks: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  badgeDiscount: { fontSize: 11, fontWeight: '700', color: Colors.success, marginTop: 2 },
  leaderboard: { marginHorizontal: 16, backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  leaderRowUser: { backgroundColor: Colors.primary + '08' },
  leaderRank: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, width: 30 },
  leaderBadge: { fontSize: 20 },
  leaderName: { fontSize: 14, fontWeight: '500', color: Colors.text },
  leaderHood: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  leaderStreak: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
