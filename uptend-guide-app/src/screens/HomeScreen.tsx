import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Button, Card, JobCard, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings } from '../services/api';

const QUICK_ACTIONS = [
  { label: '📋 Book a Pro', screen: 'Book' },
  { label: '🔧 DIY Help', screen: 'GeorgeChat', msg: 'DIY Help' },
  { label: '💰 Get a Quote', screen: 'GeorgeChat', msg: 'Get a Quote' },
  { label: '🏠 Services', screen: 'Book' },
];

export default function HomeScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const { user, guestMode } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const loadJobs = useCallback(async () => {
    if (guestMode) return;
    try {
      setError(null);
      const data = await fetchMyBookings();
      setJobs(Array.isArray(data) ? data.slice(0, 3) : (data?.bookings || []).slice(0, 3));
    } catch {
      setError('Could not load recent activity.');
    }
  }, [guestMode]);

  useEffect(() => {
    setLoading(true);
    loadJobs().finally(() => setLoading(false));
  }, [loadJobs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  }, [loadJobs]);

  const displayName = user?.firstName || user?.name?.split(' ')[0] || 'there';

  const navigateToChat = (msg?: string) => {
    if (msg) {
      navigation.navigate('Home', { screen: 'GeorgeChat', params: { initialMessage: msg } });
    } else {
      navigation.navigate('Home', { screen: 'GeorgeChat' });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* George greeting */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl }}>
          <Avatar name="Mr. George" size="xl" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: textColor, letterSpacing: -0.5 }}>
              Hey {displayName}! 👋
            </Text>
            <Text style={{ fontSize: 15, color: mutedColor, marginTop: 2 }}>
              I'm Mr. George — your home concierge. How can I help?
            </Text>
          </View>
        </View>

        {/* Chat CTA */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => navigateToChat()}
          accessibilityLabel="Chat with Mr. George"
          style={{ marginBottom: spacing.xl }}
        >
          💬  Chat with George
        </Button>

        {/* Quick action chips */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
          {QUICK_ACTIONS.map(action => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              onPress={() => {
                if (action.screen === 'Book') {
                  navigation.navigate('Book');
                } else {
                  navigateToChat(action.msg);
                }
              }}
              accessibilityLabel={action.label}
            >
              {action.label}
            </Button>
          ))}
        </View>

        {/* Recent activity / upcoming jobs */}
        {!guestMode && (
          <>
            <Text style={{ fontSize: 14, fontWeight: '600', color: mutedColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
              Recent Activity
            </Text>
            {loading ? (
              <LoadingScreen message="Loading your jobs..." style={{ height: 150 }} />
            ) : error ? (
              <Card>
                <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text>
                <Button variant="tertiary" size="sm" onPress={loadJobs} style={{ marginTop: spacing.sm }}>
                  Retry
                </Button>
              </Card>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No Jobs Yet"
                description="When you book a service, your jobs will appear here."
                ctaLabel="Book a Service"
                onCta={() => navigation.navigate('Book')}
                style={{ height: 200 }}
              />
            ) : (
              <View style={{ gap: spacing.sm }}>
                {jobs.map((job: any) => (
                  <JobCard
                    key={job.id || job._id}
                    status={job.status || 'pending'}
                    serviceType={job.serviceName || job.serviceType || 'Service'}
                    date={job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'TBD'}
                    address={job.address || 'Address not set'}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Guest CTA */}
        {guestMode && (
          <Card style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>Create a Free Account</Text>
            <Text style={{ fontSize: 14, color: mutedColor, textAlign: 'center' }}>
              Track jobs, save favorites, earn rewards, and get personalized recommendations.
            </Text>
            <Button variant="primary" size="md" onPress={() => navigation.navigate('More', { screen: 'Profile' })} accessibilityLabel="Sign up">
              Sign Up Free
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
