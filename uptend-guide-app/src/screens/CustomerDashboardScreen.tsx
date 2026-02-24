import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchMyBookings, fetchLoyaltyStatus, fetchHomeHealth } from '../services/api';

export default function CustomerDashboardScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyBookings().catch(() => ({ requests: [] })),
      fetchLoyaltyStatus().catch(() => ({ tier: 'Bronze', points: 0 })),
      fetchHomeHealth().catch(() => ({ score: 0 })),
    ]).then(([b, l, h]) => {
      setBookings(b.requests || b.bookings || []);
      setLoyalty(l);
      setHealth(h);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeBookings.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedBookings.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{health?.score || 0}</Text>
            <Text style={styles.statLabel}>Home Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{loyalty?.tier || 'Bronze'}</Text>
            <Text style={styles.statLabel}>Tier</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate?.('George')}>
            <Text style={styles.quickEmoji}>💬</Text>
            <Text style={styles.quickLabel}>Ask Mr. George</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate?.('Book')}>
            <Text style={styles.quickEmoji}>📅</Text>
            <Text style={styles.quickLabel}>Book Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate?.('HomeScan')}>
            <Text style={styles.quickEmoji}>🏠</Text>
            <Text style={styles.quickLabel}>Home DNA Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation?.navigate?.('DIY')}>
            <Text style={styles.quickEmoji}>🔧</Text>
            <Text style={styles.quickLabel}>DIY Help</Text>
          </TouchableOpacity>
        </View>

        {/* Active Bookings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Bookings</Text>
          {activeBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active bookings. Book a service to get started!</Text>
            </View>
          ) : (
            activeBookings.map((b: any, i: number) => (
              <TouchableOpacity key={b.id || i} style={styles.bookingCard}>
                <View style={styles.bookingTop}>
                  <Text style={styles.bookingService}>{(b.service_type || b.serviceType || '').replace(/_/g, ' ')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: b.status === 'pending' ? '#FF9F0A20' : '#34C75920' }]}>
                    <Text style={[styles.statusText, { color: b.status === 'pending' ? '#FF9F0A' : '#34C759' }]}>{b.status}</Text>
                  </View>
                </View>
                <Text style={styles.bookingAddress}>{b.pickup_address || b.address || ''}</Text>
                <Text style={styles.bookingDate}>{b.scheduled_date || b.scheduledDate || ''}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Completed */}
        {completedBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            {completedBookings.slice(0, 3).map((b: any, i: number) => (
              <View key={b.id || i} style={styles.completedCard}>
                <Text style={styles.completedService}>{(b.service_type || '').replace(/_/g, ' ')}</Text>
                <Text style={styles.completedDate}>{b.scheduled_date || ''}</Text>
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
  scroll: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginHorizontal: 3 },
  statValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  quickBtn: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginHorizontal: 3 },
  quickEmoji: { fontSize: 24 },
  quickLabel: { fontSize: 11, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  emptyCard: { padding: 24, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  bookingCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 8 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingService: { fontSize: 15, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  bookingAddress: { fontSize: 13, color: Colors.textLight, marginTop: 6 },
  bookingDate: { fontSize: 12, color: Colors.primary, marginTop: 4 },
  completedCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: Colors.surface, borderRadius: 10, marginBottom: 6 },
  completedService: { fontSize: 14, color: Colors.text, textTransform: 'capitalize' },
  completedDate: { fontSize: 13, color: Colors.textLight },
});
