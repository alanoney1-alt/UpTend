import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const PUNCH_LISTS = [
  { id: '1', project: 'Riverside Office Build-Out', status: 'Active', dueDate: 'Feb 28, 2026', totalItems: 24, completedItems: 18, trades: ['Electrical', 'Drywall', 'Paint'] },
  { id: '2', project: 'Marina Bay Condos Phase 2', status: 'Active', dueDate: 'Mar 15, 2026', totalItems: 42, completedItems: 12, trades: ['Plumbing', 'HVAC', 'Flooring', 'Paint'] },
  { id: '3', project: 'Tampa Heights Restaurant', status: 'Final Review', dueDate: 'Feb 20, 2026', totalItems: 15, completedItems: 14, trades: ['Electrical', 'Plumbing'] },
];

const PUNCH_ITEMS = [
  { id: '1', description: 'Touch up paint - lobby south wall', trade: 'Paint', assignedTo: 'Maria S.', status: 'Open', photos: 2 },
  { id: '2', description: 'Adjust HVAC duct damper - Suite 200', trade: 'HVAC', assignedTo: 'David K.', status: 'In Progress', photos: 1 },
  { id: '3', description: 'Install outlet cover plates - 3rd floor', trade: 'Electrical', assignedTo: 'Carlos M.', status: 'Completed', photos: 3 },
  { id: '4', description: 'Fix drywall crack above door frame', trade: 'Drywall', assignedTo: 'James R.', status: 'Open', photos: 1 },
  { id: '5', description: 'Caulk bathroom tile gaps - Unit 204', trade: 'Tile', assignedTo: 'Maria S.', status: 'Open', photos: 0 },
];

const LIEN_WAIVERS = [
  { id: '1', project: 'Riverside Office', vendor: 'Martinez Electric LLC', type: 'Conditional Progress', amount: '$34,500', signed: true, date: 'Feb 1, 2026' },
  { id: '2', project: 'Riverside Office', vendor: 'Santos Plumbing Co', type: 'Conditional Progress', amount: '$22,000', signed: true, date: 'Feb 1, 2026' },
  { id: '3', project: 'Marina Bay', vendor: 'Premier HVAC Inc', type: 'Unconditional Progress', amount: '$67,000', signed: false, date: null },
  { id: '4', project: 'Marina Bay', vendor: 'GreenPro Landscaping', type: 'Conditional Final', amount: '$18,500', signed: false, date: null },
];

const PERMITS = [
  { id: '1', project: 'Riverside Office', type: 'Building Permit', number: 'BLD-2026-04412', status: 'Approved', inspectionDate: 'Feb 18, 2026', emoji: '🏗️' },
  { id: '2', project: 'Marina Bay', type: 'Electrical Permit', number: 'ELE-2026-07823', status: 'Inspection Scheduled', inspectionDate: 'Feb 22, 2026', emoji: '⚡' },
  { id: '3', project: 'Marina Bay', type: 'Plumbing Permit', number: 'PLB-2026-06104', status: 'Under Review', inspectionDate: null, emoji: '🔧' },
  { id: '4', project: 'Tampa Heights', type: 'Fire Suppression', number: 'FIR-2026-01199', status: 'Passed', inspectionDate: 'Feb 10, 2026', emoji: '🔥' },
  { id: '5', project: 'Tampa Heights', type: 'Health Dept', number: 'HLT-2026-00332', status: 'Inspection Scheduled', inspectionDate: 'Feb 19, 2026', emoji: '🏥' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Open': { bg: '#FEF3C7', color: '#D97706' },
  'In Progress': { bg: '#DBEAFE', color: '#2563EB' },
  'Completed': { bg: '#D1FAE5', color: '#059669' },
  'Active': { bg: '#DBEAFE', color: '#2563EB' },
  'Final Review': { bg: '#FEF3C7', color: '#D97706' },
  'Approved': { bg: '#D1FAE5', color: '#059669' },
  'Passed': { bg: '#D1FAE5', color: '#059669' },
  'Inspection Scheduled': { bg: '#FEF3C7', color: '#D97706' },
  'Under Review': { bg: '#F3F4F6', color: '#6B7280' },
};

export default function ConstructionScreen() {
  const [activeTab, setActiveTab] = useState<'punchlist' | 'liens' | 'permits'>('punchlist');
  const [expandedPunch, setExpandedPunch] = useState<string | null>('1');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Construction</Text>
          <Text style={styles.subtitle}>Punch lists, lien waivers & permits</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.summaryValue}>81</Text>
            <Text style={styles.summaryLabel}>Punch Items</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.summaryValue}>4</Text>
            <Text style={styles.summaryLabel}>Pending Waivers</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.summaryValue}>5</Text>
            <Text style={styles.summaryLabel}>Active Permits</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([['punchlist', '📋 Punch Lists'], ['liens', '📝 Lien Waivers'], ['permits', '🏗️ Permits']] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
              <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Punch Lists */}
        {activeTab === 'punchlist' && (
          <>
            {PUNCH_LISTS.map((pl) => {
              const s = STATUS_STYLES[pl.status] || STATUS_STYLES['Active'];
              const expanded = expandedPunch === pl.id;
              return (
                <View key={pl.id}>
                  <TouchableOpacity style={styles.card} onPress={() => setExpandedPunch(expanded ? null : pl.id)}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{pl.project}</Text>
                        <Text style={styles.cardSubtitle}>Due: {pl.dueDate} • {pl.trades.join(', ')}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.badgeText, { color: s.color }]}>{pl.status}</Text>
                      </View>
                    </View>
                    <View style={styles.progressRow}>
                      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(pl.completedItems / pl.totalItems) * 100}%` }]} /></View>
                      <Text style={styles.progressText}>{pl.completedItems}/{pl.totalItems}</Text>
                    </View>
                  </TouchableOpacity>
                  {expanded && PUNCH_ITEMS.map((item) => {
                    const is = STATUS_STYLES[item.status] || STATUS_STYLES['Open'];
                    return (
                      <View key={item.id} style={styles.punchItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.punchDesc}>{item.description}</Text>
                          <Text style={styles.punchMeta}>{item.trade} • {item.assignedTo} {item.photos > 0 ? `• 📷 ${item.photos}` : ''}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: is.bg }]}>
                          <Text style={[styles.badgeText, { color: is.color }]}>{item.status}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {/* Lien Waivers */}
        {activeTab === 'liens' && LIEN_WAIVERS.map((lw) => (
          <View key={lw.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{lw.vendor}</Text>
                <Text style={styles.cardSubtitle}>{lw.project} • {lw.type}</Text>
              </View>
              {lw.signed ? (
                <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.badgeText, { color: '#059669' }]}>✓ Signed</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>Pending</Text>
                </View>
              )}
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.lienAmount}>{lw.amount}</Text>
              {lw.date ? <Text style={styles.cardDetail}>Signed: {lw.date}</Text> : (
                <TouchableOpacity style={styles.signBtn}><Text style={styles.signBtnText}>Request Signature</Text></TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Permits */}
        {activeTab === 'permits' && PERMITS.map((p) => {
          const s = STATUS_STYLES[p.status] || STATUS_STYLES['Under Review'];
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 24 }}>{p.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.type}</Text>
                  <Text style={styles.cardSubtitle}>{p.project} • #{p.number}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{p.status}</Text>
                </View>
              </View>
              {p.inspectionDate && (
                <Text style={styles.cardDetail}>Inspection: {p.inspectionDate}</Text>
              )}
            </View>
          );
        })}

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
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center' },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  punchItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 10, padding: 12, marginBottom: 6, marginLeft: 16, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  punchDesc: { fontSize: 14, fontWeight: '600', color: Colors.text },
  punchMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  lienAmount: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  signBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  signBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});
