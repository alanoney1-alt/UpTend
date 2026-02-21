import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Card, Button, Badge, EmptyState } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const PRODUCTS = [
  { id: '1', name: 'Drano Max Gel Clog Remover', category: 'Plumbing', price: '$8.99', rating: '4.6', icon: '🔧', url: 'https://www.amazon.com/dp/B00009PN5G' },
  { id: '2', name: 'HVAC Air Filter 20x25x1 (6-pack)', category: 'HVAC', price: '$29.99', rating: '4.7', icon: '❄️', url: 'https://www.amazon.com/dp/B01711XKD4' },
  { id: '3', name: 'Gorilla Waterproof Patch & Seal Tape', category: 'General', price: '$12.99', rating: '4.5', icon: '🛠️', url: 'https://www.amazon.com/dp/B01LZRNRPC' },
  { id: '4', name: 'BLACK+DECKER Cordless Drill', category: 'Tools', price: '$49.99', rating: '4.7', icon: '🔨', url: 'https://www.amazon.com/dp/B005NNF0YU' },
  { id: '5', name: 'Scotts Turf Builder Lawn Food', category: 'Lawn', price: '$24.99', rating: '4.6', icon: '🌱', url: 'https://www.amazon.com/dp/B00CQ65BPS' },
  { id: '6', name: 'Ring Video Doorbell', category: 'Smart Home', price: '$99.99', rating: '4.5', icon: '📹', url: 'https://www.amazon.com/dp/B08N5NQ69J' },
  { id: '7', name: 'Dyson V15 Detect Vacuum', category: 'Cleaning', price: '$649.99', rating: '4.7', icon: '🧹', url: 'https://www.amazon.com/dp/B0B7QLKTH2' },
  { id: '8', name: 'Rust-Oleum Painter\'s Touch', category: 'Painting', price: '$6.99', rating: '4.6', icon: '🎨', url: 'https://www.amazon.com/dp/B002BWOS4Q' },
];

export default function ShoppingScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="George's Picks" subtitle="Recommended products" onBack={() => navigation?.goBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        {/* George recommendation banner */}
        <View style={{ backgroundColor: dark ? '#3B2A15' : '#FFF7ED', borderRadius: radii.lg, padding: spacing.xl, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primary }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>💬 George says:</Text>
          <Text style={{ fontSize: 14, color: mutedColor, marginTop: 4, lineHeight: 20 }}>
            "These are my top picks for keeping your home in great shape. I handpicked each one!"
          </Text>
        </View>

        {PRODUCTS.map(product => (
          <TouchableOpacity
            key={product.id}
            accessibilityRole="button" accessibilityLabel={`${product.name}, ${product.price}`}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: dark ? colors.borderDark : colors.border }}
            onPress={() => Linking.openURL(product.url)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 32, marginRight: 14 }}>{product.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }} numberOfLines={2}>{product.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Badge status="info" size="sm">{product.category}</Badge>
                <Text style={{ fontSize: 12, color: mutedColor }}>⭐ {product.rating}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{product.price}</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>Amazon →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
