import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const PROPERTIES = [
  { id: '1', address: '123 Oak St, Unit A-D', type: 'Apartment Complex', units: 4, healthScore: 82, activeServices: 3, image: '🏢' },
  { id: '2', address: '456 Elm Ave', type: 'Single Family', units: 1, healthScore: 91, activeServices: 2, image: '🏠' },
  { id: '3', address: '789 Pine Plaza', type: 'Commercial', units: 8, healthScore: 67, activeServices: 5, image: '🏬' },
  { id: '4', address: '321 Maple Gardens', type: 'Townhomes', units: 12, healthScore: 74, activeServices: 4, image: '🏘️' },
];

const ACTIVE_SERVICES = [
  { id: '1', service: 'Bi-weekly Lawn Care', properties: 4, nextDate: 'Feb 15', cost: '$520/mo' },
  { id: '2', service: 'Monthly Pressure Wash', properties: 2, nextDate: 'Mar 1', cost: '$340/mo' },
  { id: '3', service: 'Quarterly Gutter Clean', properties: 4, nextDate: 'Apr 1', cost: '$680/qtr' },
];

const PREFERRED_PROS = [
  { id: '1', name: 'Carlos M.', rating: 4.9, jobs: 47, specialty: 'Landscaping' },
  { id: '2', name: 'James R.', rating: 4.8, jobs: 32, specialty: 'Pressure Washing' },
  { id: '3', name: 'Maria S.', rating: 5.0, jobs: 28, specialty: 'Cleaning' },
];

const INVOICES = [
  { id: '1', date: 'Feb 1, 2026', amount: '$2,340', status: 'Paid', ref: 'INV-2026-0201' },
  { id: '2', date: 'Jan 1, 2026', amount: '$2,180', status: 'Paid', ref: 'INV-2026-0101' },
  { id: '3', date: 'Dec 1, 2025', amount: '$2,540', status: 'Paid', ref: 'INV-2025-1201' },
];

const MONTHLY_SPEND = [
  { month: 'Sep', amount: 1800 },
  { month: 'Oct', amount: 2100 },
  { month: 'Nov', amount: 2400 },
  { month: 'Dec', amount: 2540 },
  { month: 'Jan', amount: 2180 },
  { month: 'Feb', amount: 2340 },
];

const MAX_SPEND = Math.max(...MONTHLY_SPEND.map(m => m.amount), 1);

export default function B2BDashboardScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'pros' | 'invoices'>('overview');
  const companyName = user?.companyName || 'Maple Property Group';
  const totalProperties = PROPERTIES.length;
  const totalMonthlySpend = '$2,340';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{companyName}</Text>
            <Text style={styles.portfolioSummary}>Managing {totalProperties} properties</Text>
          </View>
          <View style={styles.spendBadge}>
            <Text style={styles.spendLabel}>Monthly</Text>
            <Text style={styles.spendValue}>{totalMonthlySpend}</Text>
          </View>
        </View>

        {/* Bulk Actions */}
        <View style={styles.bulkActions}>
          <TouchableOpacity style={styles.bulkBtn} activeOpacity={0.8}>
            <Text style={styles.bulkBtnEmoji}>📋</Text>
            <Text style={styles.bulkBtnText}>Schedule All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkBtn} activeOpacity={0.8}>
            <Text style={styles.bulkBtnEmoji}>💬</Text>
            <Text style={styles.bulkBtnText}>Get Quotes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnPrimary]} activeOpacity={0.8}>
            <Text style={styles.bulkBtnEmoji}>📊</Text>
            <Text style={[styles.bulkBtnText, { color: Colors.white }]}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Properties Grid */}
        <Text style={styles.sectionTitle}>Properties</Text>
        <View style={styles.propertiesGrid}>
          {PROPERTIES.map((prop) => (
            <TouchableOpacity key={prop.id} style={styles.propertyCard} activeOpacity={0.8}>
              <Text style={styles.propertyImage}>{prop.image}</Text>
              <Text style={styles.propertyAddress} numberOfLines={1}>{prop.address}</Text>
              <Text style={styles.propertyType}>{prop.type} • {prop.units} unit{prop.units > 1 ? 's' : ''}</Text>
              <View style={styles.propertyStats}>
                <View style={[styles.propertyScoreBadge, prop.healthScore >= 80 ? styles.scoreGood : prop.healthScore >= 70 ? styles.scoreOk : styles.scoreLow]}>
                  <Text style={styles.propertyScoreText}>{prop.healthScore}</Text>
                </View>
                <Text style={styles.propertyServices}>{prop.activeServices} services</Text>
              </View>
              <TouchableOpacity style={styles.manageBtn}>
                <Text style={styles.manageBtnText}>Manage</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Services */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Services</Text>
          <TouchableOpacity><Text style={styles.viewAll}>Calendar View</Text></TouchableOpacity>
        </View>
        {ACTIVE_SERVICES.map((svc) => (
          <View key={svc.id} style={styles.serviceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{svc.service}</Text>
              <Text style={styles.serviceDetail}>{svc.properties} properties • Next: {svc.nextDate}</Text>
            </View>
            <Text style={styles.serviceCost}>{svc.cost}</Text>
          </View>
        ))}

        {/* Spending Analytics */}
        <Text style={styles.sectionTitle}>Spending Analytics</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {MONTHLY_SPEND.map((m) => (
              <View key={m.month} style={styles.chartColumn}>
                <View style={[styles.chartBar, { height: Math.max(8, (m.amount / MAX_SPEND) * 100) }]} />
                <Text style={styles.chartBarLabel}>{m.month}</Text>
                <Text style={styles.chartBarValue}>${(m.amount / 1000).toFixed(1)}k</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartSummary}>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Avg Monthly</Text>
              <Text style={styles.chartStatValue}>$2,227</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>YoY Change</Text>
              <Text style={[styles.chartStatValue, { color: Colors.success }]}>-12%</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.chartStatLabel}>Portfolio Discount</Text>
              <Text style={[styles.chartStatValue, { color: Colors.primary }]}>18%</Text>
            </View>
          </View>
        </View>

        {/* Preferred Pros */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferred Pros</Text>
          <TouchableOpacity><Text style={styles.viewAll}>Manage</Text></TouchableOpacity>
        </View>
        {PREFERRED_PROS.map((pro) => (
          <View key={pro.id} style={styles.proCard}>
            <View style={styles.proAvatar}>
              <Text style={styles.proAvatarText}>{pro.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.proName}>{pro.name}</Text>
              <Text style={styles.proDetail}>⭐ {pro.rating} • {pro.jobs} jobs • {pro.specialty}</Text>
            </View>
            <TouchableOpacity style={styles.assignBtn}>
              <Text style={styles.assignBtnText}>Assign</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Invoice Center */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
        </View>
        {INVOICES.map((inv) => (
          <View key={inv.id} style={styles.invoiceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invoiceRef}>{inv.ref}</Text>
              <Text style={styles.invoiceDate}>{inv.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.invoiceAmount}>{inv.amount}</Text>
              <View style={styles.invoiceStatusBadge}>
                <Text style={styles.invoiceStatusText}>{inv.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.downloadBtn}>
              <Text style={styles.downloadBtnText}>📥</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  companyName: { fontSize: 24, fontWeight: '800', color: Colors.text },
  portfolioSummary: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  spendBadge: {
    backgroundColor: Colors.purple, borderRadius: 14, padding: 14, alignItems: 'center',
  },
  spendLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  spendValue: { color: Colors.white, fontSize: 20, fontWeight: '800', marginTop: 2 },

  // Bulk actions
  bulkActions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  bulkBtn: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bulkBtnPrimary: { backgroundColor: Colors.primary },
  bulkBtnEmoji: { fontSize: 20, marginBottom: 4 },
  bulkBtnText: { fontSize: 12, fontWeight: '600', color: Colors.text },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  viewAll: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Properties grid
  propertiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  propertyCard: {
    width: '48%' as any, backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  propertyImage: { fontSize: 32, marginBottom: 8 },
  propertyAddress: { fontSize: 14, fontWeight: '600', color: Colors.text },
  propertyType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  propertyStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  propertyScoreBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  scoreGood: { backgroundColor: '#D1FAE5' },
  scoreOk: { backgroundColor: '#FEF3C7' },
  scoreLow: { backgroundColor: '#FEE2E2' },
  propertyScoreText: { fontSize: 13, fontWeight: '700' },
  propertyServices: { fontSize: 12, color: Colors.textSecondary },
  manageBtn: {
    marginTop: 10, backgroundColor: Colors.background, borderRadius: 8,
    paddingVertical: 6, alignItems: 'center',
  },
  manageBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Services
  serviceCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  serviceName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  serviceDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  serviceCost: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  // Chart
  chartCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginBottom: 16 },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartBar: { width: 20, borderRadius: 6, backgroundColor: Colors.primary },
  chartBarLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
  chartBarValue: { fontSize: 10, color: Colors.textLight, marginTop: 2 },
  chartSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 14 },
  chartStat: { alignItems: 'center' },
  chartStatLabel: { fontSize: 11, color: Colors.textSecondary },
  chartStatValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },

  // Pros
  proCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  proAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple,
    justifyContent: 'center', alignItems: 'center',
  },
  proAvatarText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  proName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  proDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  assignBtn: {
    backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  assignBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Invoices
  invoiceCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  invoiceRef: { fontSize: 14, fontWeight: '600', color: Colors.text },
  invoiceDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  invoiceStatusBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  invoiceStatusText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  downloadBtn: { padding: 8 },
  downloadBtnText: { fontSize: 18 },
});
