import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button, Card } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const SERVICES = [
  { id: '1', name: 'Junk Removal', icon: '🗑️', desc: 'Fast removal of furniture, appliances, and debris', price: 'From $99' },
  { id: '2', name: 'Lawn Care', icon: '🌱', desc: 'Mowing, edging, trimming, and seasonal care', price: 'From $49' },
  { id: '3', name: 'Cleaning', icon: '🧹', desc: 'Deep cleaning, move-in/out, regular service', price: 'From $79' },
  { id: '4', name: 'Handyman', icon: '🔧', desc: 'Repairs, installations, and odd jobs', price: 'From $69' },
  { id: '5', name: 'Plumbing', icon: '🔨', desc: 'Leak repair, drain cleaning, fixtures', price: 'From $89' },
  { id: '6', name: 'Electrical', icon: '⚡', desc: 'Outlets, switches, lighting, panel work', price: 'From $79' },
  { id: '7', name: 'HVAC', icon: '❄️', desc: 'AC/heating repair, maintenance, installation', price: 'From $99' },
  { id: '8', name: 'Painting', icon: '🎨', desc: 'Interior & exterior painting and touch-ups', price: 'From $149' },
  { id: '9', name: 'Pressure Washing', icon: '💦', desc: 'Driveways, decks, siding, patios', price: 'From $99' },
  { id: '10', name: 'Pool Service', icon: '🏊', desc: 'Cleaning, chemical balancing, equipment', price: 'From $79/mo' },
  { id: '11', name: 'Pest Control', icon: '🐛', desc: 'Inspection, treatment, and prevention', price: 'From $69' },
  { id: '12', name: 'Moving', icon: '📦', desc: 'Local moves, packing, and loading help', price: 'From $149' },
];

export default function ServiceCatalogScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="All Services" subtitle="12 services, one app" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {SERVICES.map(svc => (
          <TouchableOpacity
            key={svc.id}
            accessibilityRole="button" accessibilityLabel={`${svc.name}, ${svc.price}`}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}
            onPress={() => navigation?.navigate('Book', { service: svc.name })}
            activeOpacity={0.7}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: dark ? '#3B2A15' : '#FFF7ED', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 28 }}>{svc.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{svc.name}</Text>
              <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }} numberOfLines={1}>{svc.desc}</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 }}>{svc.price}</Text>
            </View>
            <Text style={{ fontSize: 20, color: mutedColor }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
