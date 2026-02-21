import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchHomeStreaks } from '../services/api';

export default function HomeStreaksScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const load = useCallback(async () => {
    try { setError(null); const d = await fetchHomeStreaks(); setData(d); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading your streaks..." />;

  const streaks = data?.streaks || [];
  const badges = data?.badges || [];
  const currentStreak = data?.currentStreak ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Home Streaks" subtitle="Keep up the good work!" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load streaks" description={error} ctaLabel="Retry" onCta={load} />
        ) : (
          <>
            {/* Current streak */}
            <View style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>🔥 Current Streak</Text>
              <Text style={{ fontSize: 48, fontWeight: '900', color: '#fff', marginVertical: 4 }}>{currentStreak}</Text>
              <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>days of home maintenance</Text>
            </View>

            {/* Badges */}
            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>🏅 Badges Earned</Text>
            {badges.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xl }}>
                {badges.map((badge: any, i: number) => (
                  <View key={i} style={{ width: '47%', backgroundColor: dark ? '#3B2A15' : '#FFF7ED', borderRadius: radii.lg, padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary }}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>{badge.icon || '🏅'}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{badge.name || badge.title}</Text>
                    <Text style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>{badge.earnedDate || '✅ Earned'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl }}>
                <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center' }}>
                  💬 George says: "Complete maintenance tasks to earn badges! You got this! 💪"
                </Text>
              </View>
            )}

            {/* Streak history */}
            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>📊 Streak History</Text>
            {streaks.length > 0 ? streaks.map((s: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.md, padding: spacing.lg, marginBottom: 10 }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{s.name || s.task || `Streak #${i + 1}`}</Text>
                  <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{s.days || s.count || 0} days</Text>
                </View>
                <Badge status="success" size="sm">{s.status || 'Active'}</Badge>
              </View>
            )) : (
              <EmptyState icon="🔥" title="No streaks yet" description="Start completing maintenance tasks to build your first streak!" />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
