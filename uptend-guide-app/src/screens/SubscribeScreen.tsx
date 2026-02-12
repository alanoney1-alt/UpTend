import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_BUNDLES, MOCK_ACTIVE_SUBSCRIPTIONS, Frequency } from '../data/mockSubscriptions';
import { calculateSavings, totalMonthlyCost } from '../services/SubscriptionService';

function BundleCard({ bundle }: { bundle: typeof SUBSCRIPTION_BUNDLES[0] }) {
  return (
    <View style={styles.bundleCard}>
      <View style={styles.bundleHeader}>
        <Text style={styles.bundleIcon}>{bundle.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.bundleName}>{bundle.name}</Text>
          <Text style={styles.bundleDesc}>{bundle.description}</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{bundle.discountPercent}%</Text>
        </View>
      </View>
      <View style={styles.bundleServices}>
        {bundle.services.map(s => <Text key={s} style={styles.bundleService}>✓ {s}</Text>)}
      </View>
      <View style={styles.bundlePriceRow}>
        <Text style={styles.bundleOldPrice}>${bundle.regularMonthlyPrice}/mo</Text>
        <Text style={styles.bundlePrice}>${bundle.monthlyPrice}/mo</Text>
      </View>
      <TouchableOpacity style={styles.subscribeBtn} onPress={() => Alert.alert('Bundle Selected', `${bundle.name} — $${bundle.monthlyPrice}/mo`)} activeOpacity={0.8}>
        <Text style={styles.subscribeBtnText}>Subscribe to Bundle</Text>
      </TouchableOpacity>
    </View>
  );
}

function PlanCard({ plan }: { plan: typeof SUBSCRIPTION_PLANS[0] }) {
  const [selectedFreq, setSelectedFreq] = useState<Frequency>(plan.frequencies[0]);
  const price = plan.pricing[selectedFreq];
  const regular = plan.regularPrice[selectedFreq];
  const savings = calculateSavings(regular, price);

  return (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planIcon}>{plan.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.planName}>{plan.serviceName}</Text>
          <Text style={styles.planDesc}>{plan.description}</Text>
        </View>
      </View>
      <View style={styles.freqRow}>
        {plan.frequencies.map(f => (
          <TouchableOpacity key={f} style={[styles.freqBtn, selectedFreq === f && styles.freqBtnActive]} onPress={() => setSelectedFreq(f)}>
            <Text style={[styles.freqText, selectedFreq === f && styles.freqTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.planPriceRow}>
        <Text style={styles.planOldPrice}>${regular}</Text>
        <Text style={styles.planPrice}>${price}</Text>
        <View style={styles.saveBadge}><Text style={styles.saveText}>Save {savings.percent}%</Text></View>
      </View>
      <TouchableOpacity style={styles.subBtnSmall} onPress={() => Alert.alert('Subscribed!', `${plan.serviceName} — ${selectedFreq} at $${price}`)}>
        <Text style={styles.subBtnSmallText}>Subscribe</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function SubscribeScreen() {
  const monthlyCost = totalMonthlyCost(MOCK_ACTIVE_SUBSCRIPTIONS);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscribe & Save</Text>
        <Text style={styles.headerSub}>Recurring services at a discount</Text>
      </View>

      {/* Active subs summary */}
      {MOCK_ACTIVE_SUBSCRIPTIONS.length > 0 && (
        <View style={styles.activeSection}>
          <Text style={styles.sectionTitle}>Your Subscriptions</Text>
          <Text style={styles.monthlyCost}>~${Math.round(monthlyCost)}/mo</Text>
          {MOCK_ACTIVE_SUBSCRIPTIONS.map(sub => (
            <View key={sub.id} style={styles.activeSub}>
              <Text style={styles.activeIcon}>{sub.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeName}>{sub.serviceName} · {sub.frequency}</Text>
                <Text style={styles.activeNext}>Next: {sub.nextServiceDate} · {sub.proName}</Text>
              </View>
              <Text style={styles.activePrice}>${sub.price}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bundles */}
      <Text style={styles.sectionTitle}>Bundles — Extra Savings</Text>
      {SUBSCRIPTION_BUNDLES.map(b => <BundleCard key={b.id} bundle={b} />)}

      {/* Individual plans */}
      <Text style={styles.sectionTitle}>Individual Services</Text>
      {SUBSCRIPTION_PLANS.map(p => <PlanCard key={p.id} plan={p} />)}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  header: { backgroundColor: Colors.purple, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginHorizontal: 16, marginTop: 24, marginBottom: 12 },
  activeSection: { marginTop: 8 },
  monthlyCost: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginHorizontal: 16, marginBottom: 8 },
  activeSub: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, marginHorizontal: 16, padding: 14, borderRadius: 14, marginBottom: 8, gap: 12 },
  activeIcon: { fontSize: 24 },
  activeName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  activeNext: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  activePrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  bundleCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 16, borderWidth: 2, borderColor: Colors.primary + '30', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bundleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bundleIcon: { fontSize: 32 },
  bundleName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  bundleDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  discountBadge: { backgroundColor: Colors.error, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { color: Colors.white, fontWeight: '800', fontSize: 13 },
  bundleServices: { marginTop: 10, gap: 4 },
  bundleService: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  bundlePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  bundleOldPrice: { fontSize: 15, color: Colors.textLight, textDecorationLine: 'line-through' },
  bundlePrice: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  subscribeBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  subscribeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  planCard: { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { fontSize: 28 },
  planName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  planDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  freqRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  freqBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.background },
  freqBtnActive: { backgroundColor: Colors.primary },
  freqText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'capitalize' },
  freqTextActive: { color: Colors.white },
  planPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  planOldPrice: { fontSize: 14, color: Colors.textLight, textDecorationLine: 'line-through' },
  planPrice: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  saveBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  saveText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  subBtnSmall: { backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  subBtnSmallText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
});
