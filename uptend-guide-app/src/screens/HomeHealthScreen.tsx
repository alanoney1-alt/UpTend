import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Badge, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchHomeHealth } from '../services/api';

const SEASON_TIPS: Record<string, { icon: string; tips: string[] }> = {
  Winter: { icon: '❄️', tips: ['Check pipe insulation', 'Service your furnace', 'Clean gutters before freeze'] },
  Spring: { icon: '🌸', tips: ['HVAC tune-up', 'Check roof for winter damage', 'Power wash exterior'] },
  Summer: { icon: '☀️', tips: ['Service AC unit', 'Check irrigation system', 'Inspect deck/patio'] },
  Fall: { icon: '🍂', tips: ['Clean gutters', 'Winterize sprinklers', 'Seal windows and doors'] },
};

function getCurrentSeason() {
  const m = new Date().getMonth();
  if (m < 2 || m === 11) return 'Winter';
  if (m < 5) return 'Spring';
  if (m < 8) return 'Summer';
  return 'Fall';
}

export default function HomeHealthScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const season = getCurrentSeason();
  const tips = SEASON_TIPS[season];

  const load = useCallback(async () => {
    try { setError(null); const d = await fetchHomeHealth(); setData(d); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Checking your home health..." />;

  const score = data?.score ?? data?.healthScore ?? 72;
  const scoreColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.error;
  const schedule = data?.maintenanceSchedule || data?.schedule || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Home Health" subtitle="Score & maintenance" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load health data" description={error} ctaLabel="Retry" onCta={load} />
        ) : (
          <>
            {/* Score */}
            <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 14, color: mutedColor, marginBottom: 8 }}>Home Health Score</Text>
              <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: scoreColor, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: scoreColor }}>{score}</Text>
              </View>
              <Badge status={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </View>

            {/* Seasonal Tips */}
            <View style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl }}>
              <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>
                {tips.icon} {season} Tips from George
              </Text>
              {tips.tips.map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.primary, marginRight: 8 }}>•</Text>
                  <Text style={{ fontSize: 15, color: textColor, flex: 1 }}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Maintenance Schedule */}
            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>📋 Maintenance Schedule</Text>
            {schedule.length > 0 ? schedule.map((item: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.md, padding: spacing.lg, marginBottom: 10 }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{item.icon || '🔧'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{item.task || item.name || item.title}</Text>
                  <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{item.dueDate || item.due || 'Upcoming'}</Text>
                </View>
                <Badge status={item.overdue ? 'error' : 'success'} size="sm">{item.overdue ? 'Overdue' : 'On Track'}</Badge>
              </View>
            )) : (
              <View style={{ backgroundColor: cardBg, borderRadius: radii.md, padding: spacing.xl, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center' }}>
                  💬 George says: "Your home is looking great! No pending maintenance tasks."
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
