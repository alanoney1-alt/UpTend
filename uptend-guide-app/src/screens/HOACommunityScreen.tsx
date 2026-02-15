import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const COMMUNITIES = [
  { id: '1', name: 'Sunset Ridge HOA', units: 124, pendingViolations: 3, boardMembers: 5, emoji: '🏘️' },
  { id: '2', name: 'Lakewood Villas', units: 68, pendingViolations: 1, boardMembers: 4, emoji: '🏡' },
  { id: '3', name: 'Palm Bay Condos', units: 210, pendingViolations: 7, boardMembers: 7, emoji: '🏢' },
];

const VIOLATIONS = [
  { id: '1', community: 'Sunset Ridge', unit: '14-B', issue: 'Unapproved fence color', status: 'Open', reported: 'Feb 10, 2026', severity: 'Low' },
  { id: '2', community: 'Palm Bay', unit: '3-201', issue: 'Unauthorized satellite dish', status: 'Hearing Scheduled', reported: 'Feb 5, 2026', severity: 'Medium' },
  { id: '3', community: 'Palm Bay', unit: '7-104', issue: 'Excessive noise complaints (3)', status: 'Under Review', reported: 'Feb 8, 2026', severity: 'High' },
  { id: '4', community: 'Sunset Ridge', unit: '22-A', issue: 'Lawn not maintained', status: 'Resolved', reported: 'Jan 28, 2026', severity: 'Low' },
];

const BOARD_APPROVALS = [
  { id: '1', community: 'Sunset Ridge', request: 'Pool resurfacing project', amount: '$45,000', votesFor: 3, votesAgainst: 1, votesNeeded: 5, deadline: 'Feb 20, 2026' },
  { id: '2', community: 'Palm Bay', request: 'Security camera upgrade', amount: '$12,500', votesFor: 5, votesAgainst: 0, votesNeeded: 7, deadline: 'Feb 25, 2026' },
  { id: '3', community: 'Lakewood', request: 'Landscaping contract renewal', amount: '$8,200/mo', votesFor: 4, votesAgainst: 0, votesNeeded: 4, deadline: 'Mar 1, 2026' },
];

const MAINTENANCE_CALENDAR = [
  { id: '1', service: 'Pool Cleaning', community: 'Sunset Ridge', frequency: 'Weekly', nextDate: 'Feb 17, 2026', pro: 'AquaCare Services', emoji: '🏊' },
  { id: '2', service: 'Lawn & Landscape', community: 'All', frequency: 'Bi-weekly', nextDate: 'Feb 19, 2026', pro: 'GreenPro Landscaping', emoji: '🌿' },
  { id: '3', service: 'Pressure Washing', community: 'Palm Bay', frequency: 'Monthly', nextDate: 'Mar 1, 2026', pro: 'CleanBlast LLC', emoji: '💦' },
  { id: '4', service: 'Elevator Inspection', community: 'Palm Bay', frequency: 'Quarterly', nextDate: 'Apr 15, 2026', pro: 'SafeLift Inc', emoji: '🛗' },
  { id: '5', service: 'Fire Alarm Testing', community: 'All', frequency: 'Semi-Annual', nextDate: 'Jun 1, 2026', pro: 'FireSafe Systems', emoji: '🔥' },
];

const RESERVES = [
  { community: 'Sunset Ridge', fiscal: '2026', total: '$420,000', allocated: '$380,000', spent: '$95,000', remaining: '$325,000' },
  { community: 'Lakewood Villas', fiscal: '2026', total: '$185,000', allocated: '$170,000', spent: '$42,000', remaining: '$143,000' },
  { community: 'Palm Bay Condos', fiscal: '2026', total: '$720,000', allocated: '$680,000', spent: '$210,000', remaining: '$510,000' },
];

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  'Low': { bg: '#D1FAE5', color: '#059669' },
  'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'High': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function HOACommunityScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'approvals' | 'calendar' | 'reserves'>('overview');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Community Management</Text>
          <Text style={styles.subtitle}>HOA operations & oversight</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.tabs}>
            {([['overview', '🏘️ Overview'], ['violations', '⚠️ Violations'], ['approvals', '✅ Approvals'], ['calendar', '📅 Calendar'], ['reserves', '💰 Reserves']] as const).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Overview */}
        {activeTab === 'overview' && COMMUNITIES.map((c) => (
          <TouchableOpacity key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 32 }}>{c.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.cardSubtitle}>{c.units} units • {c.boardMembers} board members</Text>
              </View>
              {c.pendingViolations > 0 && (
                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>{c.pendingViolations} violations</Text>
                </View>
              )}
            </View>
            <View style={styles.communityStats}>
              <View style={styles.communityStat}><Text style={styles.statValue}>98%</Text><Text style={styles.statLabel}>Compliance</Text></View>
              <View style={styles.communityStat}><Text style={styles.statValue}>4.7</Text><Text style={styles.statLabel}>Satisfaction</Text></View>
              <View style={styles.communityStat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Active Jobs</Text></View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Violations */}
        {activeTab === 'violations' && VIOLATIONS.map((v) => {
          const s = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES['Low'];
          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{v.issue}</Text>
                  <Text style={styles.cardSubtitle}>{v.community} • Unit {v.unit}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{v.severity}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardDetail}>Reported: {v.reported}</Text>
                <Text style={[styles.cardDetail, { fontWeight: '600' }]}>{v.status}</Text>
              </View>
            </View>
          );
        })}

        {/* Approvals */}
        {activeTab === 'approvals' && BOARD_APPROVALS.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.request}</Text>
            <Text style={styles.cardSubtitle}>{a.community} • Due: {a.deadline}</Text>
            <Text style={[styles.bidValue, { marginTop: 8 }]}>{a.amount}</Text>
            <View style={styles.voteRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(a.votesFor / a.votesNeeded) * 100}%` }]} />
              </View>
              <Text style={styles.voteText}>{a.votesFor}/{a.votesNeeded} votes</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.actionBtnText, { color: '#059669' }]}>👍 Approve</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}><Text style={[styles.actionBtnText, { color: '#DC2626' }]}>👎 Reject</Text></TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Calendar */}
        {activeTab === 'calendar' && MAINTENANCE_CALENDAR.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{m.service}</Text>
                <Text style={styles.cardSubtitle}>{m.community} • {m.frequency}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardDetail}>Next: {m.nextDate}</Text>
              <Text style={[styles.cardDetail, { color: Colors.primary }]}>{m.pro}</Text>
            </View>
          </View>
        ))}

        {/* Reserves */}
        {activeTab === 'reserves' && RESERVES.map((r, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{r.community}</Text>
            <Text style={styles.cardSubtitle}>FY {r.fiscal}</Text>
            <View style={[styles.reserveGrid, { marginTop: 12 }]}>
              <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Total Reserve</Text><Text style={styles.reserveValue}>{r.total}</Text></View>
              <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Allocated</Text><Text style={styles.reserveValue}>{r.allocated}</Text></View>
              <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Spent</Text><Text style={[styles.reserveValue, { color: '#DC2626' }]}>{r.spent}</Text></View>
              <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Remaining</Text><Text style={[styles.reserveValue, { color: '#059669' }]}>{r.remaining}</Text></View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(parseInt(r.spent.replace(/\D/g, '')) / parseInt(r.total.replace(/\D/g, ''))) * 100}%`, backgroundColor: Colors.warning }]} />
            </View>
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
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
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
  bidValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  communityStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  communityStat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  voteText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4, marginTop: 8 },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.background },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  reserveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reserveItem: { width: '47%' as any },
  reserveLabel: { fontSize: 12, color: Colors.textSecondary },
  reserveValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },
});
