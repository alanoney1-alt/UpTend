import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchGovBids, fetchGovSAMStatus, fetchPrevailingWages, fetchPayrollRecords, fetchDBETracking, fetchFEMAPool } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const BID_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Drafting': { bg: '#F3F4F6', color: '#6B7280' }, 'Submitted': { bg: '#DBEAFE', color: '#2563EB' },
  'Under Review': { bg: '#FEF3C7', color: '#D97706' }, 'Won': { bg: '#D1FAE5', color: '#059669' },
  'Lost': { bg: '#FEE2E2', color: '#DC2626' }, 'Certified': { bg: '#D1FAE5', color: '#059669' },
  'Pending': { bg: '#FEF3C7', color: '#D97706' },
};

export default function GovernmentContractsScreen() {
  const [activeTab, setActiveTab] = useState<'bids' | 'wages' | 'payroll' | 'dbe' | 'fema'>('bids');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sam, setSam] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [wages, setWages] = useState<any[]>([]);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [dbe, setDbe] = useState<any>({ vendors: [], goalProgress: 0 });
  const [fema, setFema] = useState<any[]>([]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [samRes, bidRes, wRes, pRes, dRes, fRes] = await Promise.allSettled([
        fetchGovSAMStatus(), fetchGovBids(), fetchPrevailingWages(), fetchPayrollRecords(), fetchDBETracking(), fetchFEMAPool(),
      ]);
      setSam(samRes.status === 'fulfilled' ? samRes.value : null);
      setBids(bidRes.status === 'fulfilled' ? (bidRes.value?.bids || bidRes.value || []) : []);
      setWages(wRes.status === 'fulfilled' ? (wRes.value?.wages || wRes.value || []) : []);
      setPayroll(pRes.status === 'fulfilled' ? (pRes.value?.records || pRes.value || []) : []);
      const dbeData = dRes.status === 'fulfilled' ? dRes.value : {};
      setDbe({ vendors: dbeData?.vendors || dbeData || [], goalProgress: dbeData?.goalProgress || 0 });
      setFema(fRes.status === 'fulfilled' ? (fRes.value?.pool || fRes.value || []) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Government Contracts</Text>
            <Text style={styles.subtitle}>Bids, payroll, compliance & FEMA</Text>
          </View>

          {sam && (
            <View style={styles.samCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.samTitle}>🏛️ SAM.gov Registration</Text>
                <Text style={styles.samDetail}>UEI: {sam.uei || '—'} • CAGE: {sam.cage || '—'}</Text>
                <Text style={styles.samDetail}>NAICS: {sam.naics || '—'}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: sam.active ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[styles.badgeText, { color: sam.active ? '#059669' : '#DC2626' }]}>{sam.active ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
            <View style={styles.tabs}>
              {([['bids', '📋 Bids'], ['wages', '💰 Wages'], ['payroll', '📊 Payroll'], ['dbe', '🤝 DBE'], ['fema', '🌪️ FEMA']] as const).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                  <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {activeTab === 'bids' && (bids.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No bids found</Text></View>
          ) : bids.map((bid: any) => {
            const s = BID_STATUS_STYLES[bid.status] || BID_STATUS_STYLES['Drafting'];
            return (
              <View key={bid.id || bid._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.bidEmoji}>{bid.emoji || '🏛️'}</Text>
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
          }))}

          {activeTab === 'wages' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Davis-Bacon Prevailing Wages</Text>
              {wages.length === 0 ? <Text style={styles.emptyText}>No wage data</Text> : wages.map((w: any, i: number) => (
                <View key={i} style={[styles.wageRow, i < wages.length - 1 && styles.wageRowBorder]}>
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

          {activeTab === 'payroll' && (
            <>
              <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>📋 Generate WH-347 Report</Text></TouchableOpacity>
              {payroll.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No payroll records</Text></View>
              ) : payroll.map((p: any) => {
                const s = BID_STATUS_STYLES[p.status] || BID_STATUS_STYLES['Pending'];
                return (
                  <View key={p.id || p._id} style={styles.card}>
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

          {activeTab === 'dbe' && (
            <>
              <View style={styles.dbeGoalCard}>
                <Text style={styles.dbeGoalTitle}>DBE Goal Progress</Text>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${dbe.goalProgress}%` }]} /></View>
                <Text style={styles.dbeGoalDetail}>{dbe.goalProgress}% of 15% goal achieved across active contracts</Text>
              </View>
              {(Array.isArray(dbe.vendors) ? dbe.vendors : []).map((d: any) => (
                <View key={d.id || d._id} style={styles.card}>
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

          {activeTab === 'fema' && (
            <>
              <View style={[styles.samCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={{ fontSize: 14, color: '#92400E' }}>🌪️ FEMA Pre-Registration Pool — {fema.length} pros registered</Text>
              </View>
              {fema.map((f: any) => (
                <View key={f.id || f._id} style={styles.card}>
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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
