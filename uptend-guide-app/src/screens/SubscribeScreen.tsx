import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Badge, LoadingScreen, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchActiveSubscriptions } from '../services/api';

const PLANS = [
  { id: 'pool', name: 'Pool Cleaning', icon: '🏊', price: '$79/mo', desc: 'Weekly cleaning, chemical balancing, equipment check', features: ['Weekly service', 'Chemical balancing', 'Equipment inspection'] },
  { id: 'lawn', name: 'Lawn Care', icon: '🌱', price: '$49/mo', desc: 'Bi-weekly mowing, edging, and seasonal care', features: ['Bi-weekly mowing', 'Edging & trimming', 'Seasonal treatment'] },
  { id: 'cleaning', name: 'Home Cleaning', icon: '🧹', price: '$99/mo', desc: 'Bi-weekly deep cleaning service', features: ['Bi-weekly cleaning', 'Kitchen & bathrooms', 'Vacuuming & mopping'] },
  { id: 'hvac', name: 'HVAC Maintenance', icon: '❄️', price: '$29/mo', desc: 'Quarterly tune-ups and filter replacement', features: ['Quarterly tune-up', 'Filter replacement', 'Priority repairs'] },
];

export default function SubscribeScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [activeSubs, setActiveSubs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const load = useCallback(async () => {
    try { setError(null); const d = await fetchActiveSubscriptions(); setActiveSubs(Array.isArray(d) ? d : d?.subscriptions || []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingScreen message="Loading subscription plans..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Subscriptions" subtitle="Save with recurring service" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {error && <EmptyState icon="⚠️" title="Couldn't load subscriptions" description={error} ctaLabel="Retry" onCta={load} />}

        {!error && (
          <>
            {activeSubs.length > 0 && (
              <>
                <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>Active Subscriptions</Text>
                {activeSubs.map((sub: any, i: number) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? '#0A2E1A' : '#F0FDF4', borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.success }}>
                    <Text style={{ fontSize: 28, marginRight: 12 }}>{sub.icon || '✅'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>{sub.name || sub.plan}</Text>
                      <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>Next: {sub.nextDate || sub.nextService || 'TBD'}</Text>
                    </View>
                    <Badge status="success" size="sm">Active</Badge>
                  </View>
                ))}
              </>
            )}

            <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md, marginTop: activeSubs.length > 0 ? spacing.xl : 0 }}>Available Plans</Text>
            {PLANS.map(plan => (
              <View key={plan.id} style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ fontSize: 32, marginRight: 12 }}>{plan.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>{plan.name}</Text>
                    <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{plan.desc}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>{plan.price}</Text>
                </View>
                {plan.features.map((f, i) => (
                  <Text key={i} style={{ fontSize: 14, color: mutedColor, paddingLeft: 4, marginBottom: 2 }}>✓ {f}</Text>
                ))}
                <Button variant="primary" size="md" fullWidth onPress={() => navigation?.navigate('Book', { service: plan.name, subscription: true })} style={{ marginTop: spacing.md }}>
                  Subscribe
                </Button>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
