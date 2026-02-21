import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProCard, Button, Card, Header, LoadingScreen, EmptyState, Input } from '../components/ui';
import { colors, spacing } from '../components/ui/tokens';
import { fetchNearbyPros } from '../services/api';

interface Pro {
  id: string;
  firstName: string;
  lastName?: string;
  rating: number;
  serviceTypes: string[];
  profileImage?: string;
  location?: { latitude: number; longitude: number };
  verified?: boolean;
}

const GEORGE_TIPS = [
  "These are your top-rated pros nearby. Tap any card to book!",
  "I handpick pros based on ratings, reliability, and your home's needs.",
  "All UpTend pros are background-checked and insured.",
];

export default function ProListScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [pros, setPros] = useState<Pro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const loadPros = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchNearbyPros();
      const list = data?.pros || (Array.isArray(data) ? data : []);
      setPros(list);
    } catch {
      setError('Could not load nearby pros.');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPros().finally(() => setLoading(false));
  }, [loadPros]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPros();
    setRefreshing(false);
  }, [loadPros]);

  const filteredPros = search.trim()
    ? pros.filter(p => {
        const name = `${p.firstName} ${p.lastName || ''}`.toLowerCase();
        const services = (p.serviceTypes || []).join(' ').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || services.includes(q);
      })
    : pros;

  const georgeTip = GEORGE_TIPS[Math.floor(Date.now() / 86400000) % GEORGE_TIPS.length];

  if (loading) {
    return <LoadingScreen message="Finding pros near you..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
      <Header title="Find a Pro" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* George recommendation */}
        <Card style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
          <Text style={{ fontSize: 28 }}>🏠</Text>
          <Text style={{ flex: 1, fontSize: 14, color: mutedColor, fontStyle: 'italic' }}>
            "{georgeTip}" — Mr. George
          </Text>
        </Card>

        {/* Search */}
        <Input
          variant="search"
          placeholder="Search by name or service..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: spacing.lg }}
          accessibilityLabel="Search pros"
        />

        {error ? (
          <EmptyState
            icon="⚠️"
            title="Connection Issue"
            description={error}
            ctaLabel="Retry"
            onCta={loadPros}
          />
        ) : filteredPros.length === 0 ? (
          <EmptyState
            icon="🔍"
            title={search ? 'No Matches' : 'No Pros Found'}
            description={search ? 'Try a different search term.' : 'Check back soon — pros are joining UpTend daily!'}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {filteredPros.map((pro) => (
              <View key={pro.id}>
                <ProCard
                  name={`${pro.firstName} ${(pro.lastName || '').charAt(0)}.`}
                  rating={pro.rating || 4.5}
                  specialties={pro.serviceTypes || ['General']}
                  avatar={pro.profileImage ? { uri: pro.profileImage } : undefined}
                  online={pro.verified}
                  onPress={() => navigation?.navigate('GeorgeChat', {
                    initialMessage: `Tell me about pro ${pro.firstName}`,
                  })}
                />
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onPress={() => navigation?.navigate('Book', {
                    screen: 'BookingHome',
                    params: { proId: pro.id, proName: pro.firstName },
                  })}
                  accessibilityLabel={`Book ${pro.firstName}`}
                  style={{ marginTop: spacing.xs }}
                >
                  Book {pro.firstName}
                </Button>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
