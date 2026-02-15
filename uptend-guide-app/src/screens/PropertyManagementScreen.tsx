import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const PORTFOLIOS = [
  { id: '1', name: 'Downtown Portfolio', properties: 5, totalUnits: 48, occupancy: 94, monthlyRevenue: '$72,000' },
  { id: '2', name: 'Suburban Rentals', properties: 12, totalUnits: 24, occupancy: 100, monthlyRevenue: '$38,400' },
  { id: '3', name: 'Commercial Holdings', properties: 3, totalUnits: 15, occupancy: 87, monthlyRevenue: '$125,000' },
];

const UNITS = [
  { id: '1', property: '100 Main St', unit: 'Apt 201', tenant: 'J. Smith', status: 'Occupied', rent: '$1,800', leaseEnd: 'Aug 2026' },
  { id: '2', property: '100 Main St', unit: 'Apt 304', tenant: null, status: 'Turnover', rent: '$1,650', leaseEnd: null },
  { id: '3', property: '250 Oak Ave', unit: 'Unit B', tenant: 'M. Johnson', status: 'Occupied', rent: '$2,100', leaseEnd: 'Dec 2026' },
  { id: '4', property: '250 Oak Ave', unit: 'Unit D', tenant: 'K. Lee', status: 'Lease Expiring', rent: '$1,950', leaseEnd: 'Mar 2026' },
  { id: '5', property: '88 Elm Dr', unit: 'Suite 100', tenant: 'ABC Corp', status: 'Occupied', rent: '$4,500', leaseEnd: 'Jan 2028' },
];

const WORK_ORDERS = [
  { id: '1', unit: 'Apt 201', description: 'Leaking kitchen faucet', priority: 'Medium', status: 'In Progress', sla: '24h', created: 'Feb 14', assignedTo: 'Carlos M.' },
  { id: '2', unit: 'Suite 100', description: 'HVAC not cooling', priority: 'High', status: 'Assigned', sla: '4h', created: 'Feb 15', assignedTo: 'David K.' },
  { id: '3', unit: 'Unit B', description: 'Replace smoke detectors', priority: 'Low', status: 'Scheduled', sla: '72h', created: 'Feb 12', assignedTo: 'James R.' },
  { id: '4', unit: 'Apt 304', description: 'Full unit turnover - paint & clean', priority: 'High', status: 'In Progress', sla: '5 days', created: 'Feb 10', assignedTo: 'Maria S.' },
];

const TURNOVERS = [
  { id: '1', unit: 'Apt 304', tasks: 8, completed: 5, dueDate: 'Feb 22, 2026', items: ['Paint walls ✅', 'Deep clean ✅', 'Replace carpet ✅', 'Fix blinds ✅', 'Patch drywall ✅', 'Replace locks 🔄', 'Appliance check ⏳', 'Final inspection ⏳'] },
];

const SLA_METRICS = [
  { priority: 'Emergency', responseTarget: '1h', resolutionTarget: '4h', compliance: 100 },
  { priority: 'High', responseTarget: '2h', resolutionTarget: '24h', compliance: 94 },
  { priority: 'Medium', responseTarget: '8h', resolutionTarget: '48h', compliance: 88 },
  { priority: 'Low', responseTarget: '24h', resolutionTarget: '7 days', compliance: 96 },
];

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  'High': { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'Low': { bg: '#D1FAE5', color: '#059669' },
  'Emergency': { bg: '#FEE2E2', color: '#DC2626' },
};

const UNIT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Occupied': { bg: '#D1FAE5', color: '#059669' },
  'Turnover': { bg: '#FEF3C7', color: '#D97706' },
  'Lease Expiring': { bg: '#FEE2E2', color: '#DC2626' },
  'Vacant': { bg: '#F3F4F6', color: '#6B7280' },
};

export default function PropertyManagementScreen() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'units' | 'workorders' | 'turnovers' | 'sla'>('portfolio');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Property Management</Text>
          <Text style={styles.subtitle}>Portfolio overview & operations</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.summaryValue, { color: Colors.white }]}>87</Text>
            <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>Total Units</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.summaryValue}>94%</Text>
            <Text style={styles.summaryLabel}>Occupancy</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.summaryValue}>12</Text>
            <Text style={styles.summaryLabel}>Open WOs</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.tabs}>
            {([['portfolio', '🏢 Portfolio'], ['units', '🏠 Units'], ['workorders', '🔧 Work Orders'], ['turnovers', '🔄 Turnovers'], ['sla', '⏱️ SLAs']] as const).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Portfolio */}
        {activeTab === 'portfolio' && PORTFOLIOS.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card}>
            <Text style={styles.cardTitle}>{p.name}</Text>
            <Text style={styles.cardSubtitle}>{p.properties} properties • {p.totalUnits} units</Text>
            <View style={styles.portfolioStats}>
              <View style={styles.portfolioStat}>
                <Text style={styles.portfolioStatValue}>{p.occupancy}%</Text>
                <Text style={styles.portfolioStatLabel}>Occupancy</Text>
              </View>
              <View style={styles.portfolioStat}>
                <Text style={[styles.portfolioStatValue, { color: Colors.primary }]}>{p.monthlyRevenue}</Text>
                <Text style={styles.portfolioStatLabel}>Monthly Revenue</Text>
              </View>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${p.occupancy}%` }]} /></View>
          </TouchableOpacity>
        ))}

        {/* Units */}
        {activeTab === 'units' && UNITS.map((u) => {
          const s = UNIT_STATUS_STYLES[u.status] || UNIT_STATUS_STYLES['Occupied'];
          return (
            <View key={u.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{u.property} — {u.unit}</Text>
                  <Text style={styles.cardSubtitle}>{u.tenant || 'No tenant'}{u.leaseEnd ? ` • Lease ends ${u.leaseEnd}` : ''}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{u.status}</Text>
                </View>
              </View>
              <Text style={styles.rentValue}>{u.rent}/mo</Text>
            </View>
          );
        })}

        {/* Work Orders */}
        {activeTab === 'workorders' && (
          <>
            <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>➕ Create Work Order</Text></TouchableOpacity>
            {WORK_ORDERS.map((wo) => {
              const s = PRIORITY_STYLES[wo.priority] || PRIORITY_STYLES['Medium'];
              return (
                <View key={wo.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{wo.description}</Text>
                      <Text style={styles.cardSubtitle}>{wo.unit} • Created {wo.created}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{wo.priority}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardDetail}>Assigned: {wo.assignedTo}</Text>
                    <Text style={styles.cardDetail}>SLA: {wo.sla}</Text>
                    <Text style={[styles.cardDetail, { fontWeight: '600' }]}>{wo.status}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Turnovers */}
        {activeTab === 'turnovers' && TURNOVERS.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t.unit} Turnover</Text>
                <Text style={styles.cardSubtitle}>Due: {t.dueDate}</Text>
              </View>
              <Text style={styles.turnoverProgress}>{t.completed}/{t.tasks}</Text>
            </View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(t.completed / t.tasks) * 100}%` }]} /></View>
            <View style={{ marginTop: 12 }}>
              {t.items.map((item, i) => (
                <Text key={i} style={styles.checklistItem}>{item}</Text>
              ))}
            </View>
          </View>
        ))}

        {/* SLAs */}
        {activeTab === 'sla' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SLA Compliance</Text>
            {SLA_METRICS.map((s, i) => {
              const ps = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES['Medium'];
              return (
                <View key={i} style={[styles.slaRow, i < SLA_METRICS.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.badge, { backgroundColor: ps.bg }]}><Text style={[styles.badgeText, { color: ps.color }]}>{s.priority}</Text></View>
                    </View>
                    <Text style={styles.slaDetail}>Response: {s.responseTarget} • Resolution: {s.resolutionTarget}</Text>
                  </View>
                  <Text style={[styles.slaCompliance, { color: s.compliance >= 95 ? '#059669' : s.compliance >= 90 ? '#D97706' : '#DC2626' }]}>{s.compliance}%</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.white },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  rentValue: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  portfolioStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, marginBottom: 10 },
  portfolioStat: { alignItems: 'center' },
  portfolioStatValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  portfolioStatLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  progressBar: { height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  uploadBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  uploadBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  turnoverProgress: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  checklistItem: { fontSize: 14, color: Colors.text, paddingVertical: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  slaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  slaDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  slaCompliance: { fontSize: 22, fontWeight: '800' },
});
