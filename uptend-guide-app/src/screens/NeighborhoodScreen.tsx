import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchCommunityFeed } from '../services/api';

export default function NeighborhoodScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feed, setFeed] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const load = useCallback(async () => {
    try { setError(null); const d = await fetchCommunityFeed(); setFeed(Array.isArray(d) ? d : d?.feed || d?.posts || []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading neighborhood activity..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Neighborhood" subtitle="Local activity" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}>
        {error ? (
          <EmptyState icon="⚠️" title="Couldn't load feed" description={error} ctaLabel="Retry" onCta={load} />
        ) : feed.length === 0 ? (
          <EmptyState icon="🏘️" title="No Activity Yet" description="I'm still learning this trick! Check back soon. George will show you what's happening in your neighborhood." />
        ) : (
          feed.map((item: any, i: number) => (
            <View key={i} style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ fontSize: 24, marginRight: 10 }}>{item.icon || '🏠'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{item.title || item.name || 'Neighborhood Update'}</Text>
                  <Text style={{ fontSize: 12, color: mutedColor }}>{item.time || item.date || item.createdAt || ''}</Text>
                </View>
                {item.type && <Badge status="info" size="sm">{item.type}</Badge>}
              </View>
              {item.description && <Text style={{ fontSize: 14, color: mutedColor, lineHeight: 20 }}>{item.description}</Text>}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
