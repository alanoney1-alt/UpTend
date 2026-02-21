import React from 'react';
import { View, Text, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Badge, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const DEALS = [
  { id: '1', title: '50% Off First Cleaning', desc: 'Deep clean your home for half price', icon: '🧹', original: '$159', price: '$79', expires: '2 days', service: 'Cleaning' },
  { id: '2', title: 'Free Lawn Assessment', desc: 'George analyzes your yard — no charge', icon: '🌱', original: '$49', price: 'FREE', expires: '3 days', service: 'Lawn Care' },
  { id: '3', title: '$30 Off Junk Removal', desc: 'Spring cleaning special', icon: '🗑️', original: '$129', price: '$99', expires: '5 days', service: 'Junk Removal' },
  { id: '4', title: 'HVAC Tune-Up Special', desc: 'Pre-summer AC check at a great price', icon: '❄️', original: '$149', price: '$99', expires: '1 week', service: 'HVAC' },
];

export default function FlashDealsScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Flash Deals" subtitle="⚡ Limited time offers" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.primary, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl, alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>⚡ Flash Deals</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Grab these before they're gone!</Text>
        </View>

        {DEALS.map(deal => (
          <View key={deal.id} style={{ backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: 32, marginRight: 12 }}>{deal.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>{deal.title}</Text>
                <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{deal.desc}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, color: mutedColor, textDecorationLine: 'line-through' }}>{deal.original}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>{deal.price}</Text>
              </View>
              <Badge status="warning" size="sm">⏰ {deal.expires}</Badge>
            </View>
            <Button variant="primary" size="md" fullWidth onPress={() => navigation?.navigate('Book', { service: deal.service })}>
              Book Now
            </Button>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
