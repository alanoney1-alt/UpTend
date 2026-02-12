import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme';

const HOME_DETAILS = {
  address: '123 Oak Street, Tampa, FL 33602',
  sqft: 2400,
  beds: 4,
  baths: 3,
  yearBuilt: 2015,
  type: 'Single Family',
};

const SERVICE_HISTORY = [
  { id: '1', service: 'House Cleaning', date: 'Feb 10, 2026', pro: 'Maria S.', rating: 5, icon: '🧹' },
  { id: '2', service: 'Junk Removal', date: 'Jan 28, 2026', pro: 'Marcus J.', rating: 5, icon: '🗑️' },
  { id: '3', service: 'Pressure Washing', date: 'Jan 15, 2026', pro: 'Jake R.', rating: 4, icon: '💦' },
  { id: '4', service: 'Landscaping', date: 'Dec 20, 2025', pro: 'Carlos M.', rating: 5, icon: '🌿' },
];

const WARRANTIES = [
  { id: '1', item: 'HVAC System', expires: 'Mar 2028', status: 'active', icon: '❄️' },
  { id: '2', item: 'Roof', expires: 'Jun 2035', status: 'active', icon: '🏠' },
  { id: '3', item: 'Water Heater', expires: 'Sep 2026', status: 'expiring', icon: '🔥' },
];

const APPLIANCES = [
  { id: '1', name: 'Samsung Fridge', age: '3 years', icon: '🧊' },
  { id: '2', name: 'LG Washer/Dryer', age: '2 years', icon: '👕' },
  { id: '3', name: 'Carrier AC', age: '5 years', icon: '❄️' },
  { id: '4', name: 'GE Dishwasher', age: '3 years', icon: '🍽️' },
];

export default function HomeProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>🏠 My Home</Text>

        {/* Home Details Card */}
        <View style={styles.card}>
          <Text style={styles.address}>{HOME_DETAILS.address}</Text>
          <View style={styles.detailsGrid}>
            <DetailBadge label="Sq Ft" value={HOME_DETAILS.sqft.toLocaleString()} />
            <DetailBadge label="Beds" value={String(HOME_DETAILS.beds)} />
            <DetailBadge label="Baths" value={String(HOME_DETAILS.baths)} />
            <DetailBadge label="Built" value={String(HOME_DETAILS.yearBuilt)} />
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️ Edit Home Details</Text>
          </TouchableOpacity>
        </View>

        {/* Service History */}
        <Text style={styles.sectionTitle}>Service History</Text>
        {SERVICE_HISTORY.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.timelineDot} />
            <View style={styles.historyCard}>
              <Text style={styles.historyIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyService}>{item.service}</Text>
                <Text style={styles.historyMeta}>{item.date} · {item.pro}</Text>
              </View>
              <Text style={styles.historyRating}>{'⭐'.repeat(item.rating)}</Text>
            </View>
          </View>
        ))}

        {/* Warranty Tracker */}
        <Text style={styles.sectionTitle}>Warranty Tracker</Text>
        <View style={styles.card}>
          {WARRANTIES.map((w) => (
            <View key={w.id} style={styles.warrantyRow}>
              <Text style={styles.warrantyIcon}>{w.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warrantyName}>{w.item}</Text>
                <Text style={styles.warrantyExpiry}>Expires: {w.expires}</Text>
              </View>
              <View style={[styles.statusBadge, w.status === 'expiring' && styles.statusExpiring]}>
                <Text style={[styles.statusText, w.status === 'expiring' && styles.statusTextExpiring]}>
                  {w.status === 'active' ? '✅ Active' : '⚠️ Expiring'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Appliances */}
        <Text style={styles.sectionTitle}>Appliances</Text>
        <View style={styles.applianceGrid}>
          {APPLIANCES.map((a) => (
            <View key={a.id} style={styles.applianceCard}>
              <Text style={styles.applianceIcon}>{a.icon}</Text>
              <Text style={styles.applianceName}>{a.name}</Text>
              <Text style={styles.applianceAge}>{a.age}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Appliance</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailBadge}>
      <Text style={styles.detailValue}>{value}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl },
  title: { ...Typography.h1, marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadows.sm, marginBottom: Spacing.lg },
  address: { ...Typography.bodyBold, marginBottom: Spacing.md },
  detailsGrid: { flexDirection: 'row', gap: Spacing.sm },
  detailBadge: { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.sm, padding: Spacing.md, alignItems: 'center' },
  detailValue: { ...Typography.h4, color: Colors.primary },
  detailLabel: { ...Typography.small, marginTop: 2 },
  editBtn: { marginTop: Spacing.md, alignItems: 'center', padding: Spacing.sm },
  editBtnText: { ...Typography.captionBold, color: Colors.primary },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.md, marginTop: Spacing.sm },
  historyItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md, paddingLeft: Spacing.sm },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 14, marginRight: Spacing.md },
  historyCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.md, ...Shadows.sm,
  },
  historyIcon: { fontSize: 24 },
  historyService: { ...Typography.bodyBold, fontSize: 14 },
  historyMeta: { ...Typography.small, marginTop: 2 },
  historyRating: { fontSize: 10 },
  warrantyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  warrantyIcon: { fontSize: 24 },
  warrantyName: { ...Typography.bodyBold, fontSize: 14 },
  warrantyExpiry: { ...Typography.small, marginTop: 2 },
  statusBadge: { backgroundColor: '#F0FDF4', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4 },
  statusExpiring: { backgroundColor: '#FFFBEB' },
  statusText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  statusTextExpiring: { color: Colors.warning },
  applianceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  applianceCard: {
    width: '47%' as any, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  applianceIcon: { fontSize: 28, marginBottom: Spacing.xs },
  applianceName: { ...Typography.captionBold, color: Colors.text, textAlign: 'center' },
  applianceAge: { ...Typography.small, marginTop: 2 },
  addBtn: { backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed' },
  addBtnText: { ...Typography.bodyBold, color: Colors.primary },
});
