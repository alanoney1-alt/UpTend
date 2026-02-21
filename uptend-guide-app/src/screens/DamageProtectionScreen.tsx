import React from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Card } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const FEATURES = [
  { icon: '🛡️', title: '$1M Liability Coverage', desc: 'Every job is backed by up to $1 million in liability coverage.' },
  { icon: '✅', title: 'Background-Checked Pros', desc: 'All UpTend pros pass rigorous background checks.' },
  { icon: '📸', title: 'Photo Documentation', desc: 'Before/after photos are taken for every job as proof of work.' },
  { icon: '💰', title: 'Damage Claims', desc: 'If something goes wrong, file a claim and we handle it fast.' },
  { icon: '⚡', title: 'Fast Resolution', desc: 'Most claims are resolved within 48-72 hours.' },
];

export default function DamageProtectionScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Damage Protection" subtitle="You're covered" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {/* Hero */}
        <View style={{ backgroundColor: dark ? '#0A2E1A' : '#F0FDF4', borderRadius: radii.lg, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 2, borderColor: colors.success }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🛡️</Text>
          <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '800', color: textColor, textAlign: 'center' }}>You're Protected</Text>
          <Text style={{ fontSize: 15, color: mutedColor, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
            Every UpTend job comes with comprehensive damage protection and liability coverage.
          </Text>
        </View>

        {/* Features */}
        {FEATURES.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}>
            <Text style={{ fontSize: 28, marginRight: 14 }}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{f.title}</Text>
              <Text style={{ fontSize: 14, color: mutedColor, marginTop: 4, lineHeight: 20 }}>{f.desc}</Text>
            </View>
          </View>
        ))}

        <Button variant="primary" size="lg" fullWidth onPress={() => navigation?.navigate('InsuranceClaim')} style={{ marginTop: spacing.lg }}>
          File a Claim
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
