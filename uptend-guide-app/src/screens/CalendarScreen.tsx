import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchMyBookings } from '../services/api';

export default function CalendarScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMyBookings();
      const list = Array.isArray(data) ? data : data?.bookings || data?.serviceRequests || [];
      setBookings(list);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading your calendar..." />;

  // Group by date
  const grouped: Record<string, any[]> = {};
  bookings.forEach(b => {
    const date = b.scheduledDate || b.date || b.createdAt?.slice(0, 10) || 'Unscheduled';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(b);
  });
  const sortedDates = Object.keys(grouped).sort();

  const statusColor = (s: string) => {
    const sl = (s || '').toLowerCase();
    if (sl.includes('complet')) return 'success' as const;
    if (sl.includes('cancel')) return 'error' as const;
    if (sl.includes('progress') || sl.includes('active')) return 'warning' as const;
    return 'info' as const;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Calendar" subtitle="Upcoming bookings" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load bookings" description={error} ctaLabel="Retry" onCta={load} />
        ) : bookings.length === 0 ? (
          <EmptyState icon="📅" title="No bookings yet" description="When you book a service, your upcoming appointments will appear here." ctaLabel="Browse Services" onCta={() => navigation?.navigate('ServiceCatalog')} />
        ) : (
          sortedDates.map(date => (
            <View key={date} style={{ marginBottom: spacing.xl }}>
              <Text accessibilityRole="header" style={{ fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm }}>📅 {date}</Text>
              {grouped[date].map((booking: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.md, padding: spacing.lg, marginBottom: 8, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>{booking.serviceIcon || '🔧'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{booking.serviceName || booking.service || booking.title || 'Service'}</Text>
                    <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{booking.time || booking.scheduledTime || ''} {booking.proName ? `· ${booking.proName}` : ''}</Text>
                  </View>
                  <Badge status={statusColor(booking.status)} size="sm">{booking.status || 'Pending'}</Badge>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
