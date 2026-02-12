import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.md) / 2;

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  sameDay: boolean;
  startingPrice: string;
}

const SERVICES: Service[] = [
  { id: 'junk', name: 'Junk Removal', icon: '🗑️', description: 'Haul away furniture, appliances & debris', sameDay: true, startingPrice: '$89' },
  { id: 'cleaning', name: 'House Cleaning', icon: '🧹', description: 'Deep clean, move-in/out, recurring', sameDay: true, startingPrice: '$99' },
  { id: 'landscaping', name: 'Landscaping', icon: '🌿', description: 'Mowing, trimming, garden beds', sameDay: false, startingPrice: '$69' },
  { id: 'pressure', name: 'Pressure Washing', icon: '💦', description: 'Driveways, decks, siding, patios', sameDay: true, startingPrice: '$129' },
  { id: 'moving', name: 'Moving Help', icon: '📦', description: 'Local moves, loading & unloading', sameDay: false, startingPrice: '$149' },
  { id: 'handyman', name: 'Handyman', icon: '🔧', description: 'Repairs, assembly, installations', sameDay: true, startingPrice: '$79' },
  { id: 'pool', name: 'Pool Cleaning', icon: '🏊', description: 'Chemical balance, skimming, maintenance', sameDay: false, startingPrice: '$89' },
  { id: 'gutter', name: 'Gutter Cleaning', icon: '🏠', description: 'Clean & inspect gutters and downspouts', sameDay: true, startingPrice: '$99' },
  { id: 'carpet', name: 'Carpet Cleaning', icon: '🧶', description: 'Steam clean carpets & upholstery', sameDay: false, startingPrice: '$119' },
  { id: 'pest', name: 'Pest Control', icon: '🐜', description: 'Inspection, treatment & prevention', sameDay: false, startingPrice: '$99' },
  { id: 'painting', name: 'Painting', icon: '🎨', description: 'Interior & exterior painting', sameDay: false, startingPrice: '$199' },
  { id: 'hvac', name: 'HVAC Service', icon: '❄️', description: 'AC/heating tune-up & repair', sameDay: true, startingPrice: '$129' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', description: 'Outlets, fixtures, panel upgrades', sameDay: false, startingPrice: '$109' },
];

export default function ServiceCatalogScreen({ navigation }: any) {
  const handleServicePress = (service: Service) => {
    // Navigate to chat with pre-filled service context
    navigation.navigate('Bud', {
      screen: 'BudChat',
      params: { prefill: `I need ${service.name.toLowerCase()}` },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>All Services</Text>
        <Text style={styles.subtitle}>Tap any service to get an instant quote from Bud</Text>

        <View style={styles.grid}>
          {SERVICES.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.card}
              onPress={() => handleServicePress(service)}
              activeOpacity={0.7}
            >
              {service.sameDay && (
                <View style={styles.sameDayBadge}>
                  <Text style={styles.sameDayText}>⚡ Same Day</Text>
                </View>
              )}
              <Text style={styles.cardIcon}>{service.icon}</Text>
              <Text style={styles.cardName}>{service.name}</Text>
              <Text style={styles.cardDesc}>{service.description}</Text>
              <Text style={styles.cardPrice}>From {service.startingPrice}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.guarantee}>
          <Text style={styles.guaranteeIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>$500 Satisfaction Guarantee</Text>
            <Text style={styles.guaranteeDesc}>Every job is backed by our protection policy. If you're not happy, we'll make it right.</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl },
  title: { ...Typography.h1, marginBottom: Spacing.xs },
  subtitle: { ...Typography.caption, marginBottom: Spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    position: 'relative',
  },
  sameDayBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sameDayText: { fontSize: 9, fontWeight: '700', color: Colors.primary },
  cardIcon: { fontSize: 32, marginBottom: Spacing.sm },
  cardName: { ...Typography.bodyBold, fontSize: 14, marginBottom: 2 },
  cardDesc: { ...Typography.small, lineHeight: 15, marginBottom: Spacing.sm },
  cardPrice: { ...Typography.captionBold, color: Colors.primary },
  guarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: '#FDF2F8',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  guaranteeIcon: { fontSize: 32 },
  guaranteeTitle: { ...Typography.bodyBold, marginBottom: 2 },
  guaranteeDesc: { ...Typography.caption, lineHeight: 18 },
});
