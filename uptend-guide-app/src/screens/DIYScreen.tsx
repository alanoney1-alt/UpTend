import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Input, Card, Button, Badge } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';

const CATEGORIES = [
  { id: '1', name: 'Plumbing', icon: '🔧', count: 24 },
  { id: '2', name: 'Electrical', icon: '⚡', count: 18 },
  { id: '3', name: 'Painting', icon: '🎨', count: 15 },
  { id: '4', name: 'Flooring', icon: '🏗️', count: 12 },
  { id: '5', name: 'HVAC', icon: '❄️', count: 20 },
  { id: '6', name: 'Appliances', icon: '🔌', count: 16 },
  { id: '7', name: 'Roofing', icon: '🏠', count: 10 },
  { id: '8', name: 'Drywall', icon: '🧱', count: 8 },
  { id: '9', name: 'Outdoor', icon: '🌳', count: 14 },
];

const POPULAR_REPAIRS = [
  { id: '1', title: 'Fix a Running Toilet', difficulty: 'Easy', time: '15 min', icon: '🚽' },
  { id: '2', title: 'Unclog a Drain', difficulty: 'Easy', time: '20 min', icon: '🚿' },
  { id: '3', title: 'Patch Drywall Holes', difficulty: 'Medium', time: '45 min', icon: '🔨' },
  { id: '4', title: 'Replace a Light Switch', difficulty: 'Medium', time: '30 min', icon: '💡' },
  { id: '5', title: 'Fix a Squeaky Door', difficulty: 'Easy', time: '10 min', icon: '🚪' },
];

export default function DIYScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [search, setSearch] = useState('');

  const bg = dark ? colors.backgroundDark : '#FFFBF5';
  const cardBg = dark ? colors.surfaceDark : colors.surface;
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  const filteredRepairs = POPULAR_REPAIRS.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const diffColor = (d: string) => d === 'Easy' ? colors.success : d === 'Medium' ? colors.warning : colors.error;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="DIY Guides" subtitle="Learn to fix it with Mr. George" onBack={() => navigation?.goBack()} />

      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }}>
        <Input placeholder="🔍 Search repairs..." value={search} onChangeText={setSearch} accessibilityLabel="Search DIY repairs" />

        {/* Ask George CTA */}
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel="Ask Mr. George for DIY help"
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: dark ? colors.surfaceDark : '#1E293B', borderRadius: radii.lg, padding: 18, marginTop: spacing.lg, marginBottom: spacing.xl }}
          onPress={() => navigation?.navigate?.('GeorgeChat', { initialMessage: 'DIY Help' })}
          activeOpacity={0.8}
        >
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <Text style={{ fontSize: 22 }}>💬</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#fff' }}>Ask Mr. George</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Start a DIY coaching session with your AI guide</Text>
          </View>
          <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700' }}>→</Text>
        </TouchableOpacity>

        {/* Categories */}
        <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>Categories</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xl }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} accessibilityRole="button" accessibilityLabel={`${cat.name} category, ${cat.count} guides`}
              style={{ width: '31%', backgroundColor: cardBg, borderRadius: radii.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: dark ? colors.borderDark : '#F3F4F6' }}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{cat.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>{cat.name}</Text>
              <Text style={{ fontSize: 11, color: mutedColor, marginTop: 2 }}>{cat.count} guides</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Repairs */}
        <Text accessibilityRole="header" style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: spacing.md }}>Popular Repairs</Text>
        {filteredRepairs.map(repair => (
          <TouchableOpacity key={repair.id} accessibilityRole="button" accessibilityLabel={`${repair.title}, ${repair.difficulty}, ${repair.time}`}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: radii.lg, padding: spacing.lg, marginBottom: 10, borderWidth: 1, borderColor: dark ? colors.borderDark : '#F3F4F6' }}>
            <Text style={{ fontSize: 28, marginRight: 14 }}>{repair.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{repair.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <Badge status={repair.difficulty === 'Easy' ? 'success' : 'warning'} size="sm">{repair.difficulty}</Badge>
                <Text style={{ fontSize: 12, color: mutedColor }}>⏱ {repair.time}</Text>
              </View>
            </View>
            <Text style={{ fontSize: 22, color: mutedColor }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
