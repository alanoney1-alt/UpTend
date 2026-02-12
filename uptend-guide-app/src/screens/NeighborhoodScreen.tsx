import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface NeighborhoodActivity {
  id: string;
  service: string;
  count: number;
  icon: string;
  discount: boolean;
  discountPct: number;
  minForDiscount: number;
  currentBookings: number;
}

const MOCK_ACTIVITIES: NeighborhoodActivity[] = [
  { id: '1', service: 'Pressure Washing', count: 5, icon: '💦', discount: true, discountPct: 20, minForDiscount: 3, currentBookings: 2 },
  { id: '2', service: 'Lawn Care', count: 8, icon: '🌿', discount: true, discountPct: 15, minForDiscount: 4, currentBookings: 3 },
  { id: '3', service: 'Gutter Cleaning', count: 3, icon: '🏠', discount: false, discountPct: 20, minForDiscount: 3, currentBookings: 1 },
  { id: '4', service: 'Junk Removal', count: 2, icon: '🗑️', discount: false, discountPct: 15, minForDiscount: 3, currentBookings: 0 },
  { id: '5', service: 'Pool Cleaning', count: 4, icon: '🏊', discount: true, discountPct: 20, minForDiscount: 3, currentBookings: 4 },
];

const STATS = {
  activeNeighbors: 23,
  totalServicesThisMonth: 47,
  avgSpend: '$185',
  topService: 'Lawn Care',
};

export default function NeighborhoodScreen() {
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const toggleJoin = (id: string) => {
    setJoinedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏘️ Your Neighborhood</Text>
        <Text style={styles.subtitle}>See what's happening nearby • Privacy-first</Text>

        {/* Map placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Map View</Text>
          <Text style={styles.mapSubtext}>Showing activity within 1 mile</Text>
          {/* Activity bubbles */}
          <View style={[styles.bubble, { top: 30, left: 40 }]}><Text style={styles.bubbleText}>5 💦</Text></View>
          <View style={[styles.bubble, { top: 60, right: 50 }]}><Text style={styles.bubbleText}>8 🌿</Text></View>
          <View style={[styles.bubble, { bottom: 40, left: 80 }]}><Text style={styles.bubbleText}>3 🏠</Text></View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>{STATS.activeNeighbors}</Text><Text style={styles.statLabel}>Neighbors</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{STATS.totalServicesThisMonth}</Text><Text style={styles.statLabel}>Services/mo</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{STATS.avgSpend}</Text><Text style={styles.statLabel}>Avg Spend</Text></View>
        </View>

        {/* Group Deals */}
        <Text style={styles.sectionTitle}>Group Deals Available</Text>
        {MOCK_ACTIVITIES.map(activity => {
          const joined = joinedGroups.includes(activity.id);
          const spotsNeeded = activity.minForDiscount - activity.currentBookings;
          return (
            <View key={activity.id} style={styles.dealCard}>
              <View style={styles.dealHeader}>
                <Text style={styles.dealIcon}>{activity.icon}</Text>
                <View style={styles.dealInfo}>
                  <Text style={styles.dealService}>{activity.service}</Text>
                  <Text style={styles.dealCount}>{activity.count} neighbors booked this month</Text>
                </View>
                {activity.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{activity.discountPct}% OFF</Text>
                  </View>
                )}
              </View>
              {activity.discount && (
                <View style={styles.dealProgress}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${(activity.currentBookings / activity.minForDiscount) * 100}%` }]} />
                  </View>
                  <Text style={styles.progressText}>
                    {spotsNeeded > 0 ? `${spotsNeeded} more needed for group rate` : '✅ Group rate unlocked!'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.joinBtn, joined && styles.joinedBtn]}
                onPress={() => toggleJoin(activity.id)}
              >
                <Text style={[styles.joinBtnText, joined && styles.joinedBtnText]}>
                  {joined ? '✓ Joined Group' : 'Join Group Deal'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Local Pro Recommendations */}
        <Text style={styles.sectionTitle}>Top Local Pros</Text>
        {[
          { name: 'Maria S.', service: 'House Cleaning', rating: 4.9, jobs: 215, icon: '🧹' },
          { name: 'Marcus J.', service: 'Junk Removal', rating: 4.8, jobs: 342, icon: '🗑️' },
          { name: 'Jake R.', service: 'Pressure Washing', rating: 4.9, jobs: 178, icon: '💦' },
        ].map((pro, i) => (
          <View key={i} style={styles.proCard}>
            <Text style={{ fontSize: 28 }}>{pro.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dealService}>{pro.name}</Text>
              <Text style={styles.dealCount}>{pro.service} · ⭐ {pro.rating} · {pro.jobs} jobs</Text>
            </View>
            <TouchableOpacity style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Activity Feed */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {[
          { text: 'A neighbor booked pressure washing', time: '2h ago', icon: '💦' },
          { text: 'Group deal unlocked for lawn care!', time: '5h ago', icon: '🎉' },
          { text: '3 neighbors got gutter cleaning', time: '1d ago', icon: '🏠' },
        ].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dealService}>{item.text}</Text>
              <Text style={styles.dealCount}>{item.time}</Text>
            </View>
          </View>
        ))}

        {/* Invite */}
        <TouchableOpacity style={styles.inviteBtn}>
          <Text style={styles.inviteBtnText}>📨 Invite Your Neighbors</Text>
          <Text style={styles.inviteSubtext}>Share via text or social • No personal data shared</Text>
        </TouchableOpacity>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>Privacy-first: No names or exact addresses are ever shown. Only anonymized counts and zones.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  mapPlaceholder: { height: 180, backgroundColor: '#E8F0FF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' },
  mapIcon: { fontSize: 36 },
  mapText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 4 },
  mapSubtext: { fontSize: 12, color: Colors.textSecondary },
  bubble: { position: 'absolute', backgroundColor: 'rgba(244,124,32,0.85)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  bubbleText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  dealCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  dealHeader: { flexDirection: 'row', alignItems: 'center' },
  dealIcon: { fontSize: 28, marginRight: 12 },
  dealInfo: { flex: 1 },
  dealService: { fontSize: 15, fontWeight: '600', color: Colors.text },
  dealCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  discountBadge: { backgroundColor: '#FFF3E8', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  discountText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
  dealProgress: { marginTop: 10 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  joinBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  joinedBtn: { backgroundColor: Colors.success },
  joinBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  joinedBtnText: { color: '#fff' },
  inviteBtn: { backgroundColor: Colors.purple, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 12 },
  inviteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inviteSubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0F0F0', borderRadius: 10, padding: 12, marginTop: 4 },
  privacyIcon: { fontSize: 16 },
  privacyText: { fontSize: 12, color: Colors.textSecondary, flex: 1, lineHeight: 16 },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  bookBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  bookBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
});
