import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, LoadingScreen, EmptyState, Card, Badge, Button } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings, fetchLoyaltyStatus, fetchHomeHealth } from '../services/api';

export default function CustomerDashboardScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const bg = dark ? colors.backgroundDark : colors.background;
  const cardBg = dark ? colors.surfaceDark : colors.surface;

  const load = useCallback(async () => {
    const [b, l, h] = await Promise.all([
      fetchMyBookings().catch(() => ({ requests: [] })),
      fetchLoyaltyStatus().catch(() => ({ tier: 'Bronze', points: 0 })),
      fetchHomeHealth().catch(() => ({ score: 0 })),
    ]);
    setBookings(b.requests || b.bookings || []);
    setLoyalty(l);
    setHealth(h);
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading) return <LoadingScreen message="Loading your dashboard..." />;

  const activeBookings = bookings.filter((b: any) => !['completed', 'cancelled'].includes(b.status));
  const completedBookings = bookings.filter((b: any) => b.status === 'completed');
  const displayName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title={`Hey, ${displayName}!`} subtitle="Your dashboard" onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { value: activeBookings.length, label: 'Active', color: colors.primary },
            { value: completedBookings.length, label: 'Done', color: '#34C759' },
            { value: health?.score || 0, label: 'Home Score', color: '#007AFF' },
            { value: loyalty?.tier || 'Bronze', label: 'Tier', color: '#5856D6' },
          ].map((s, i) => (
            <View
              key={i}
              style={{
                flex: 1, alignItems: 'center', backgroundColor: cardBg,
                borderRadius: 16, padding: 14,
              }}
              accessibilityLabel={`${s.label}: ${s.value}`}
            >
              <Text style={{ fontSize: typeof s.value === 'number' ? 22 : 14, fontWeight: '800', color: s.color }}>
                {s.value}
              </Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {[
            { emoji: '💬', label: 'Ask George', screen: 'GeorgeChat' },
            { emoji: '📅', label: 'Book', screen: 'Book' },
            { emoji: '🏠', label: 'Home Scan', screen: 'HomeScan' },
            { emoji: '🔧', label: 'DIY Help', screen: 'DIY' },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={{
                flex: 1, alignItems: 'center', backgroundColor: cardBg,
                borderRadius: 16, padding: 14,
              }}
              onPress={() => navigation?.navigate?.(a.screen)}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 6, textAlign: 'center' }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loyalty */}
        {loyalty && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>🏆 Loyalty</Text>
              <Badge status="active" label={loyalty.tier} />
            </View>
            <Text style={{ fontSize: 13, color: mutedColor, marginTop: 6 }}>
              {loyalty.points || 0} points • {loyalty.nextTierPoints ? `${loyalty.nextTierPoints - (loyalty.points || 0)} to next tier` : 'Top tier!'}
            </Text>
          </View>
        )}

        {/* Active Bookings */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12 }}>Active Bookings</Text>
        {activeBookings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Active Bookings"
            description="Book a service to get started!"
            ctaLabel="Book Now"
            onCta={() => navigation?.navigate?.('Book')}
          />
        ) : (
          activeBookings.map((b: any, i: number) => (
            <View key={b.id || i} style={{ backgroundColor: cardBg, borderRadius: 14, padding: 16, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, textTransform: 'capitalize' }}>
                  {(b.service_type || b.serviceType || '').replace(/_/g, ' ')}
                </Text>
                <Badge status={b.status === 'pending' ? 'pending' : b.status === 'in_progress' ? 'in_progress' : 'completed'} />
              </View>
              <Text style={{ fontSize: 13, color: mutedColor, marginTop: 6 }}>{b.pickup_address || b.address || ''}</Text>
              <Text style={{ fontSize: 12, color: colors.primary, marginTop: 4 }}>{b.scheduled_date || b.scheduledDate || ''}</Text>
            </View>
          ))
        )}

        {/* Recent Completed */}
        {completedBookings.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginTop: 20, marginBottom: 12 }}>
              Recent Jobs
            </Text>
            {completedBookings.slice(0, 5).map((b: any, i: number) => (
              <View key={b.id || i} style={{
                flexDirection: 'row', justifyContent: 'space-between',
                padding: 12, backgroundColor: cardBg, borderRadius: 10, marginBottom: 6,
              }}>
                <Text style={{ fontSize: 14, color: textColor, textTransform: 'capitalize' }}>
                  {(b.service_type || '').replace(/_/g, ' ')}
                </Text>
                <Text style={{ fontSize: 13, color: mutedColor }}>{b.scheduled_date || ''}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
