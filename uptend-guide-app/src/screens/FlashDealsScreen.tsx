import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { formatCountdown, claimDeal } from '../services/FlashDealsService';

function DealCard({ deal }: { deal: FlashDeal }) {
  const [countdown, setCountdown] = useState(formatCountdown(deal.endsAt));
  const [claimed, setClaimed] = useState(false);
  const remaining = deal.totalQuantity - deal.claimed;
  const progress = deal.claimed / deal.totalQuantity;

  useEffect(() => {
    const timer = setInterval(() => setCountdown(formatCountdown(deal.endsAt)), 1000);
    return () => clearInterval(timer);
  }, [deal.endsAt]);

  const handleClaim = () => {
    const result = claimDeal(deal.id);
    if (result) {
      setClaimed(true);
      Alert.alert('Deal Claimed! 🎉', `You saved $${deal.originalPrice - deal.dealPrice} on ${deal.serviceName}`);
    }
  };

  return (
    <View style={styles.dealCard}>
      <Image source={{ uri: deal.image }} style={styles.dealImage} />
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsText}>SAVE {deal.savingsPercent}%</Text>
      </View>
      <View style={styles.dealContent}>
        <Text style={styles.dealName}>{deal.serviceName}</Text>
        <Text style={styles.dealDesc}>{deal.description}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>${deal.originalPrice}</Text>
          <Text style={styles.dealPrice}>${deal.dealPrice}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.countdown}>⏱ {countdown}</Text>
          <Text style={[styles.remaining, remaining <= 3 && { color: Colors.error }]}>
            {remaining > 0 ? `Only ${remaining} left!` : 'Sold out'}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <TouchableOpacity
          style={[styles.claimBtn, (claimed || remaining <= 0) && styles.claimBtnDisabled]}
          onPress={handleClaim}
          disabled={claimed || remaining <= 0}
          activeOpacity={0.8}
        >
          <Text style={styles.claimText}>{claimed ? '✓ Claimed' : remaining <= 0 ? 'Sold Out' : 'Claim Deal'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FlashDealsScreen() {
  const [tab, setTab] = useState<'today' | 'upcoming' | 'past'>('today');
  const deals = [].filter(d => d.category === tab);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⚡</Text>
        <Text style={styles.headerTitle}>Flash Deals</Text>
        <Text style={styles.headerSub}>Limited time, limited quantity</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['today', 'upcoming', 'past'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'today' ? "Today's Deals" : t === 'upcoming' ? 'Upcoming' : 'Past Deals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {deals.map(deal => <DealCard key={deal.id} deal={deal} />)}
      {deals.length === 0 && (
        <View style={styles.empty}><Text style={styles.emptyText}>No deals in this category</Text></View>
      )}

      {/* Notification opt-in */}
      <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
        <Text style={styles.notifyText}>🔔 Get notified about flash deals</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 20 },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.primary, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerEmoji: { fontSize: 40 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, marginTop: 4 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.purple },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  dealCard: { backgroundColor: Colors.white, borderRadius: 18, marginHorizontal: 16, marginTop: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  dealImage: { width: '100%', height: 160, resizeMode: 'cover' },
  savingsBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: Colors.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  savingsText: { color: Colors.white, fontWeight: '800', fontSize: 12 },
  dealContent: { padding: 16 },
  dealName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  dealDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  originalPrice: { fontSize: 16, color: Colors.textLight, textDecorationLine: 'line-through' },
  dealPrice: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  countdown: { fontSize: 13, fontWeight: '600', color: Colors.purple },
  remaining: { fontSize: 13, fontWeight: '600', color: Colors.warning },
  progressTrack: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  claimBtn: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 14 },
  claimBtnDisabled: { backgroundColor: Colors.textLight },
  claimText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.textSecondary, fontSize: 15 },
  notifyBtn: { marginHorizontal: 16, marginTop: 24, backgroundColor: Colors.purple, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  notifyText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
