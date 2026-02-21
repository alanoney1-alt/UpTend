import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchHOACommunities, fetchHOAViolations, fetchHOAApprovals, voteHOAApproval, fetchHOACalendar, fetchHOAReserves } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  'Low': { bg: '#D1FAE5', color: '#059669' }, 'Medium': { bg: '#FEF3C7', color: '#D97706' }, 'High': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function HOACommunityScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'approvals' | 'calendar' | 'reserves'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [reserves, setReserves] = useState<any[]>([]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [cRes, vRes, aRes, calRes, rRes] = await Promise.allSettled([
        fetchHOACommunities(), fetchHOAViolations(), fetchHOAApprovals(), fetchHOACalendar(), fetchHOAReserves(),
      ]);
      setCommunities(cRes.status === 'fulfilled' ? (cRes.value?.communities || cRes.value || []) : []);
      setViolations(vRes.status === 'fulfilled' ? (vRes.value?.violations || vRes.value || []) : []);
      setApprovals(aRes.status === 'fulfilled' ? (aRes.value?.approvals || aRes.value || []) : []);
      setCalendar(calRes.status === 'fulfilled' ? (calRes.value?.events || calRes.value || []) : []);
      setReserves(rRes.status === 'fulfilled' ? (rRes.value?.reserves || rRes.value || []) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleVote = async (id: string, vote: 'approve' | 'reject') => {
    try { await voteHOAApproval(id, vote); load(); } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Community Management</Text>
            <Text style={styles.subtitle}>HOA operations & oversight</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.tabs}>
              {([['overview', '🏘️ Overview'], ['violations', '⚠️ Violations'], ['approvals', '✅ Approvals'], ['calendar', '📅 Calendar'], ['reserves', '💰 Reserves']] as const).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                  <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {activeTab === 'overview' && (communities.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No communities found</Text></View>
          ) : communities.map((c: any) => (
            <TouchableOpacity key={c.id || c._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 32 }}>{c.emoji || '🏘️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.cardSubtitle}>{c.units || 0} units • {c.boardMembers || 0} board members</Text>
                </View>
                {(c.pendingViolations || 0) > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.badgeText, { color: '#DC2626' }]}>{c.pendingViolations} violations</Text>
                  </View>
                )}
              </View>
              <View style={styles.communityStats}>
                <View style={styles.communityStat}><Text style={styles.statValue}>{c.compliance || '—'}%</Text><Text style={styles.statLabel}>Compliance</Text></View>
                <View style={styles.communityStat}><Text style={styles.statValue}>{c.satisfaction || '—'}</Text><Text style={styles.statLabel}>Satisfaction</Text></View>
                <View style={styles.communityStat}><Text style={styles.statValue}>{c.activeJobs || 0}</Text><Text style={styles.statLabel}>Active Jobs</Text></View>
              </View>
            </TouchableOpacity>
          )))}

          {activeTab === 'violations' && (violations.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No violations</Text></View>
          ) : violations.map((v: any) => {
            const s = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES['Low'];
            return (
              <View key={v.id || v._id} style={styles.card}>
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
          }))}

          {activeTab === 'approvals' && (approvals.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No pending approvals</Text></View>
          ) : approvals.map((a: any) => (
            <View key={a.id || a._id} style={styles.card}>
              <Text style={styles.cardTitle}>{a.request}</Text>
              <Text style={styles.cardSubtitle}>{a.community} • Due: {a.deadline}</Text>
              <Text style={[styles.bidValue, { marginTop: 8 }]}>{a.amount}</Text>
              <View style={styles.voteRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${a.votesNeeded ? ((a.votesFor || 0) / a.votesNeeded) * 100 : 0}%` }]} />
                </View>
                <Text style={styles.voteText}>{a.votesFor || 0}/{a.votesNeeded || 0} votes</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#D1FAE5' }]} onPress={() => handleVote(a.id || a._id, 'approve')}><Text style={[styles.actionBtnText, { color: '#059669' }]}>👍 Approve</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleVote(a.id || a._id, 'reject')}><Text style={[styles.actionBtnText, { color: '#DC2626' }]}>👎 Reject</Text></TouchableOpacity>
              </View>
            </View>
          )))}

          {activeTab === 'calendar' && (calendar.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No scheduled maintenance</Text></View>
          ) : calendar.map((m: any) => (
            <View key={m.id || m._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 24 }}>{m.emoji || '📅'}</Text>
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
          )))}

          {activeTab === 'reserves' && (reserves.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No reserve data</Text></View>
          ) : reserves.map((r: any, i: number) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>{r.community}</Text>
              <Text style={styles.cardSubtitle}>FY {r.fiscal}</Text>
              <View style={[styles.reserveGrid, { marginTop: 12 }]}>
                <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Total Reserve</Text><Text style={styles.reserveValue}>{r.total}</Text></View>
                <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Allocated</Text><Text style={styles.reserveValue}>{r.allocated}</Text></View>
                <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Spent</Text><Text style={[styles.reserveValue, { color: '#DC2626' }]}>{r.spent}</Text></View>
                <View style={styles.reserveItem}><Text style={styles.reserveLabel}>Remaining</Text><Text style={[styles.reserveValue, { color: '#059669' }]}>{r.remaining}</Text></View>
              </View>
            </View>
          )))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </ApiStateWrapper>
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
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  reserveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reserveItem: { width: '47%' as any },
  reserveLabel: { fontSize: 12, color: Colors.textSecondary },
  reserveValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
