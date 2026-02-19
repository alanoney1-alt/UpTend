import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchActiveSubscriptions } from '../services/api';
import config from '../config';

const PLANS = [
  { id: 'pool_monthly', name: 'Pool Cleaning', frequency: 'Monthly', price: '$120/mo', icon: '🏊' },
  { id: 'lawn_biweekly', name: 'Lawn Care', frequency: 'Bi-weekly', price: '$89/mo', icon: '🌿' },
  { id: 'cleaning_weekly', name: 'Home Cleaning', frequency: 'Weekly', price: '$149/mo', icon: '🧹' },
  { id: 'gutter_quarterly', name: 'Gutter Cleaning', frequency: 'Quarterly', price: '$50/mo', icon: '🏠' },
];

export default function SubscribeScreen() {
  const [activeSubs, setActiveSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSubscriptions()
      .then(data => setActiveSubs(data.subscriptions || []))
      .catch(() => setActiveSubs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 Subscriptions</Text>
        <Text style={styles.subtitle}>Set it and forget it — recurring home maintenance.</Text>

        {activeSubs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
            {activeSubs.map((sub: any, i: number) => (
              <View key={i} style={styles.activeCard}>
                <Text style={styles.activeService}>{sub.service_type || sub.name}</Text>
                <Text style={styles.activeFreq}>{sub.frequency || 'Monthly'}</Text>
                <Text style={styles.activePrice}>${sub.price || sub.amount}/mo</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {PLANS.map(plan => (
            <TouchableOpacity key={plan.id} style={styles.planCard}>
              <Text style={styles.planIcon}>{plan.icon}</Text>
              <View style={styles.planInfo}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planFreq}>{plan.frequency}</Text>
              </View>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bundleCard}>
          <Text style={styles.bundleTitle}>🎁 Bundle & Save</Text>
          <Text style={styles.bundleText}>Subscribe to 2+ services and save 7-18% on every visit.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  activeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: Colors.primary + '10', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.primary + '30' },
  activeService: { fontSize: 15, fontWeight: '600', color: Colors.text },
  activeFreq: { fontSize: 13, color: Colors.textLight },
  activePrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  planCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.surface, borderRadius: 12, marginBottom: 8 },
  planIcon: { fontSize: 28, marginRight: 12 },
  planInfo: { flex: 1 },
  planName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  planFreq: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  bundleCard: { padding: 20, backgroundColor: Colors.primary + '10', borderRadius: 16, alignItems: 'center', marginTop: 8 },
  bundleTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  bundleText: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8 },
});
