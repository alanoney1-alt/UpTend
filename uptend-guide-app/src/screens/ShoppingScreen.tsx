import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const PRODUCTS = [
  {
    id: '1', name: 'DEWALT 20V Drill Kit', image: '🔧',
    prices: [
      { store: 'Home Depot', price: '$129.00', best: true },
      { store: 'Amazon', price: '$134.99', best: false },
      { store: 'Lowes', price: '$139.00', best: false },
    ],
  },
  {
    id: '2', name: 'Karcher Pressure Washer', image: '💦',
    prices: [
      { store: 'Amazon', price: '$189.00', best: true },
      { store: 'Home Depot', price: '$199.00', best: false },
      { store: 'Walmart', price: '$194.99', best: false },
    ],
  },
  {
    id: '3', name: 'Nest Thermostat', image: '🌡️',
    prices: [
      { store: 'Best Buy', price: '$119.99', best: true },
      { store: 'Amazon', price: '$124.99', best: false },
      { store: 'Google Store', price: '$129.99', best: false },
    ],
  },
];

const HISTORY = [
  { id: '1', name: 'Ryobi Leaf Blower', date: 'Jan 15, 2026', price: '$89.00', store: 'Home Depot' },
  { id: '2', name: 'GFCI Outlets 3-Pack', date: 'Dec 28, 2025', price: '$24.99', store: 'Amazon' },
  { id: '3', name: 'Caulk Gun + Silicone', date: 'Dec 10, 2025', price: '$18.50', store: 'Lowes' },
];

export default function ShoppingScreen() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping</Text>
        <Text style={styles.headerSub}>Compare prices across retailers</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.tabActive]}
          onPress={() => setActiveTab('search')}
        >
          <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>🔍 Search</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>📦 History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'search' && (
          <>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products, tools, parts..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <Text style={styles.sectionTitle}>Price Comparisons</Text>
            {PRODUCTS.map(product => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productIcon}>{product.image}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
                {product.prices.map((p, i) => (
                  <View key={i} style={[styles.priceRow, p.best && styles.priceRowBest]}>
                    <Text style={styles.storeName}>{p.store}</Text>
                    <View style={styles.priceRight}>
                      <Text style={[styles.priceText, p.best && styles.priceTextBest]}>{p.price}</Text>
                      {p.best && (
                        <View style={styles.bestBadge}>
                          <Text style={styles.bestBadgeText}>Best</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.buyBtn}>
                  <Text style={styles.buyBtnText}>Buy at Best Price</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <Text style={styles.sectionTitle}>Purchase History</Text>
            {HISTORY.map(item => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyName}>{item.name}</Text>
                  <Text style={styles.historyMeta}>{item.store} · {item.date}</Text>
                </View>
                <Text style={styles.historyPrice}>{item.price}</Text>
              </View>
            ))}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Spent (Last 90 Days)</Text>
              <Text style={styles.totalAmount}>$132.49</Text>
              <Text style={styles.totalSaved}>You saved $47.50 with UpTend price matching! 🎉</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: '#f97316', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
    paddingTop: 12, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  tabActive: { backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#f97316' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f97316' },
  scroll: { padding: 20, paddingBottom: 40 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1e293b' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  productCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  productHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  productIcon: { fontSize: 32 },
  productName: { fontSize: 17, fontWeight: '700', color: '#1e293b', flex: 1 },
  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  priceRowBest: { backgroundColor: '#f0fdf4', marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 8 },
  storeName: { fontSize: 14, color: '#64748b' },
  priceRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  priceTextBest: { color: '#22c55e' },
  bestBadge: { backgroundColor: '#22c55e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  bestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  buyBtn: {
    backgroundColor: '#f97316', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 14,
  },
  buyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  historyMeta: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  historyPrice: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  totalCard: {
    backgroundColor: '#f0fdf4', borderRadius: 16, padding: 24, alignItems: 'center',
    marginTop: 12, borderWidth: 1.5, borderColor: '#bbf7d0',
  },
  totalLabel: { fontSize: 13, color: '#64748b' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginVertical: 4 },
  totalSaved: { fontSize: 14, color: '#22c55e', fontWeight: '600', textAlign: 'center' },
});
