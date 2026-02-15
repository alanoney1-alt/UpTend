import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const BID_PIPELINE = [
  { id: '1', title: 'City Hall HVAC Replacement', agency: 'City of Tampa', dueDate: 'Mar 15, 2026', value: '$340,000', status: 'Drafting', emoji: '🏛️' },
  { id: '2', title: 'VA Hospital Grounds Maintenance', agency: 'Dept of Veterans Affairs', dueDate: 'Feb 28, 2026', value: '$1,200,000', status: 'Submitted', emoji: '🏥' },
  { id: '3', title: 'School District Roof Repairs', agency: 'Hillsborough County Schools', dueDate: 'Apr 1, 2026', value: '$560,000', status: 'Under Review', emoji: '🏫' },
  { id: '4', title: 'Highway Rest Stop Renovation', agency: 'FL DOT', dueDate: 'May 10, 2026', value: '$890,000', status: 'Won', emoji: '🛣️' },
];

const PREVAILING_WAGES = [
  { trade: 'Electrician', county: 'Hillsborough', rate: '$42.50/hr', fringe: '$18.75/hr' },
  { trade: 'Plumber', county: 'Hillsborough', rate: '$40.00/hr', fringe: '$17.25/hr' },
  { trade: 'HVAC Mechanic', county: 'Pinellas', rate: '$38.75/hr', fringe: '$16.50/hr' },
  { trade: 'Carpenter', county: 'Hillsborough', rate: '$35.00/hr', fringe: '$15.00/hr' },
  { trade: 'Laborer', county: 'Hillsborough', rate: '$28.00/hr', fringe: '$12.50/hr' },
];

const PAYROLL_RECORDS = [
  { id: '1', contract: 'Highway Rest Stop', weekEnding: 'Feb 7, 2026', workers: 12, totalHours: 480, status: 'Certified' },
  { id: '2', contract: 'Highway Rest Stop', weekEnding: 'Jan 31, 2026', workers: 12, totalHours: 456, status: 'Certified' },
  { id: '3', contract: 'VA Hospital Grounds', weekEnding: 'Feb 7, 2026', workers: 8, totalHours: 320, status: 'Pending' },
];

const DBE_TRACKING = [
  { id: '1', vendor: 'Martinez Electric LLC', certType: 'MBE / DBE', contract: 'Highway Rest Stop', amount: '$124,000', pct: '14%' },
  { id: '2', vendor: 'Santos Plumbing Co', certType: 'WBE', contract: 'Highway Rest Stop', amount: '$89,000', pct: '10%' },
  { id: '3', vendor: 'Kim HVAC Solutions', certType: 'SDVOSB', contract: 'VA Hospital', amount: '$210,000', pct: '17.5%' },
];

const FEMA_POOL = [
  { id: '1', name: 'Carlos Martinez', trade: 'Electrician', equipment: 'Generator, tools', radius: '150 mi', activated: false },
  { id: '2', name: 'James Rivera', trade: 'Plumber', equipment: 'Pump, tools', radius: '100 mi', activated: true },
  { id: '3', name: 'David Kim', trade: 'HVAC', equipment: 'Full mobile unit', radius: '200 mi', activated: false },
];

const BID_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Drafting': { bg: '#F3F4F6', color: '#6B7280' },
  'Submitted': { bg: '#DBEAFE', color: '#2563EB' },
  'Under Review': { bg: '#FEF3C7', color: '#D97706' },
  'Won': { bg: '#D1FAE5', color: '#059669' },
  'Lost': { bg: '#FEE2E2', color: '#DC2626' },
  'Certified': { bg: '#D1FAE5', color: '#059669' },
  'Pending': { bg: '#FEF3C7', color: '#D97706' },
};

export default function GovernmentContractsScreen() {
  const [activeTab, setActiveTab] = useState<'bids' | 'wages' | 'payroll' | 'dbe' | 'fema'>('bids');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Government Contracts</Text>
          <Text style={styles.subtitle}>Bids, payroll, compliance & FEMA</Text>
        </View>

        {/* SAM Status */}
        <View style={styles.samCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.samTitle}>🏛️ SAM.gov Registration</Text>
            <Text style={styles.samDetail}>UEI: K8JX2NP4L7M3 • CAGE: 7A2B9</Text>
            <Text style={styles.samDetail}>NAICS: 236220, 238210, 561730</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[styles.badgeText, { color: '#059669' }]}>Active</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabs}>
            {([['bids', '📋 Bids'], ['wages', '💰 Wages'], ['payroll', '📊 Payroll'], ['dbe', '🤝 DBE'], ['fema', '🌪️ FEMA']] as const).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bids */}
        {activeTab === 'bids' && BID_PIPELINE.map((bid) => {
          const s = BID_STATUS_STYLES[bid.status] || BID_STATUS_STYLES['Drafting'];
          return (
            <View key={bid.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.bidEmoji}>{bid.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{bid.title}</Text>
                  <Text style={styles.cardSubtitle}>{bid.agency}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{bid.status}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.bidValue}>{bid.value}</Text>
                <Text style={styles.cardDetail}>Due: {bid.dueDate}</Text>
              </View>
            </View>
          );
        })}

        {/* Wages */}
        {activeTab === 'wages' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Davis-Bacon Prevailing Wages</Text>
            {PREVAILING_WAGES.map((w, i) => (
              <View key={i} style={[styles.wageRow, i < PREVAILING_WAGES.length - 1 && styles.wageRowBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wageTrade}>{w.trade}</Text>
                  <Text style={styles.wageCounty}>{w.county} County</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.wageRate}>{w.rate}</Text>
                  <Text style={styles.wageFringe}>+{w.fringe} fringe</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payroll */}
        {activeTab === 'payroll' && (
          <>
            <TouchableOpacity style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>📋 Generate WH-347 Report</Text>
            </TouchableOpacity>
            {PAYROLL_RECORDS.map((p) => {
              const s = BID_STATUS_STYLES[p.status] || BID_STATUS_STYLES['Pending'];
              return (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{p.contract}</Text>
                      <Text style={styles.cardSubtitle}>Week ending: {p.weekEnding}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{p.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardDetail}>{p.workers} workers</Text>
                    <Text style={styles.cardDetail}>{p.totalHours} total hours</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* DBE */}
        {activeTab === 'dbe' && (
          <>
            <View style={styles.dbeGoalCard}>
              <Text style={styles.dbeGoalTitle}>DBE Goal Progress</Text>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: '72%' }]} /></View>
              <Text style={styles.dbeGoalDetail}>72% of 15% goal achieved across active contracts</Text>
            </View>
            {DBE_TRACKING.map((d) => (
              <View key={d.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{d.vendor}</Text>
                    <Text style={styles.cardSubtitle}>{d.certType} • {d.contract}</Text>
                  </View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.bidValue}>{d.amount}</Text>
                  <Text style={styles.cardDetail}>{d.pct} of contract</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* FEMA */}
        {activeTab === 'fema' && (
          <>
            <View style={[styles.samCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={{ fontSize: 14, color: '#92400E' }}>🌪️ FEMA Pre-Registration Pool — 3 pros registered, 1 currently activated</Text>
            </View>
            {FEMA_POOL.map((f) => (
              <View key={f.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{f.name}</Text>
                    <Text style={styles.cardSubtitle}>{f.trade} • {f.equipment}</Text>
                  </View>
                  {f.activated ? (
                    <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.badgeText, { color: '#DC2626' }]}>🔴 Activated</Text>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.badgeText, { color: '#059669' }]}>Standby</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDetail}>Response radius: {f.radius}</Text>
              </View>
            ))}
          </>
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
  samCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  samTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  samDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  tabScroll: { marginBottom: 16 },
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
  bidEmoji: { fontSize: 28 },
  bidValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  wageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  wageRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  wageTrade: { fontSize: 15, fontWeight: '600', color: Colors.text },
  wageCounty: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  wageRate: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  wageFringe: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  uploadBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  uploadBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  dbeGoalCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dbeGoalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  dbeGoalDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 8 },
  progressBar: { height: 10, backgroundColor: Colors.borderLight, borderRadius: 5 },
  progressFill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
});
