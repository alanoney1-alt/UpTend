import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchPortfolios, fetchPropertyUnits, fetchWorkOrders, fetchTurnovers, fetchSLAMetrics } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  'High': { bg: '#FEE2E2', color: '#DC2626' }, 'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'Low': { bg: '#D1FAE5', color: '#059669' }, 'Emergency': { bg: '#FEE2E2', color: '#DC2626' },
};
const UNIT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Occupied': { bg: '#D1FAE5', color: '#059669' }, 'Turnover': { bg: '#FEF3C7', color: '#D97706' },
  'Lease Expiring': { bg: '#FEE2E2', color: '#DC2626' }, 'Vacant': { bg: '#F3F4F6', color: '#6B7280' },
};

export default function PropertyManagementScreen() {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'units' | 'workorders' | 'turnovers' | 'sla'>('portfolio');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [turnovers, setTurnovers] = useState<any[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [pRes, uRes, wRes, tRes, sRes] = await Promise.allSettled([
        fetchPortfolios(), fetchPropertyUnits(), fetchWorkOrders(), fetchTurnovers(), fetchSLAMetrics(),
      ]);
      setPortfolios(pRes.status === 'fulfilled' ? (pRes.value?.portfolios || pRes.value || []) : []);
      setUnits(uRes.status === 'fulfilled' ? (uRes.value?.units || uRes.value || []) : []);
      setWorkOrders(wRes.status === 'fulfilled' ? (wRes.value?.workOrders || wRes.value || []) : []);
      setTurnovers(tRes.status === 'fulfilled' ? (tRes.value?.turnovers || tRes.value || []) : []);
      const slaData = sRes.status === 'fulfilled' ? sRes.value : {};
      setSlaMetrics(slaData?.metrics || slaData || []);
      setSummary(slaData?.summary || {});
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalUnits = summary.totalUnits || units.length;
  const occupancy = summary.occupancy || '—';
  const openWOs = summary.openWorkOrders || workOrders.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Property Management</Text>
            <Text style={styles.subtitle}>Portfolio overview & operations</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: Colors.primary }]}>
              <Text style={[styles.summaryValue, { color: Colors.white }]}>{totalUnits}</Text>
              <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>Total Units</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.summaryValue}>{occupancy}%</Text>
              <Text style={styles.summaryLabel}>Occupancy</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.summaryValue}>{openWOs}</Text>
              <Text style={styles.summaryLabel}>Open WOs</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.tabs}>
              {([['portfolio', '🏢 Portfolio'], ['units', '🏠 Units'], ['workorders', '🔧 Work Orders'], ['turnovers', '🔄 Turnovers'], ['sla', '⏱️ SLAs']] as const).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                  <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {activeTab === 'portfolio' && (portfolios.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No portfolios found</Text></View>
          ) : portfolios.map((p: any) => (
            <TouchableOpacity key={p.id || p._id} style={styles.card}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={styles.cardSubtitle}>{p.properties || 0} properties • {p.totalUnits || 0} units</Text>
              <View style={styles.portfolioStats}>
                <View style={styles.portfolioStat}>
                  <Text style={styles.portfolioStatValue}>{p.occupancy || 0}%</Text>
                  <Text style={styles.portfolioStatLabel}>Occupancy</Text>
                </View>
                <View style={styles.portfolioStat}>
                  <Text style={[styles.portfolioStatValue, { color: Colors.primary }]}>{p.monthlyRevenue || '$0'}</Text>
                  <Text style={styles.portfolioStatLabel}>Monthly Revenue</Text>
                </View>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${p.occupancy || 0}%` }]} /></View>
            </TouchableOpacity>
          )))}

          {activeTab === 'units' && (units.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No units found</Text></View>
          ) : units.map((u: any) => {
            const s = UNIT_STATUS_STYLES[u.status] || UNIT_STATUS_STYLES['Occupied'];
            return (
              <View key={u.id || u._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{u.property} — {u.unit}</Text>
                    <Text style={styles.cardSubtitle}>{u.tenant || 'No tenant'}{u.leaseEnd ? ` • Lease ends ${u.leaseEnd}` : ''}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{u.status}</Text>
                  </View>
                </View>
                <Text style={styles.rentValue}>{u.rent || '$0'}/mo</Text>
              </View>
            );
          }))}

          {activeTab === 'workorders' && (
            <>
              <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>➕ Create Work Order</Text></TouchableOpacity>
              {workOrders.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No work orders</Text></View>
              ) : workOrders.map((wo: any) => {
                const s = PRIORITY_STYLES[wo.priority] || PRIORITY_STYLES['Medium'];
                return (
                  <View key={wo.id || wo._id} style={styles.card}>
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
                      <Text style={styles.cardDetail}>Assigned: {wo.assignedTo || 'Unassigned'}</Text>
                      <Text style={styles.cardDetail}>SLA: {wo.sla || '—'}</Text>
                      <Text style={[styles.cardDetail, { fontWeight: '600' }]}>{wo.status}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'turnovers' && (turnovers.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No turnovers in progress</Text></View>
          ) : turnovers.map((t: any) => (
            <View key={t.id || t._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{t.unit} Turnover</Text>
                  <Text style={styles.cardSubtitle}>Due: {t.dueDate}</Text>
                </View>
                <Text style={styles.turnoverProgress}>{t.completed || 0}/{t.tasks || 0}</Text>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${t.tasks ? ((t.completed || 0) / t.tasks) * 100 : 0}%` }]} /></View>
              {t.items?.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  {t.items.map((item: string, i: number) => (
                    <Text key={i} style={styles.checklistItem}>{item}</Text>
                  ))}
                </View>
              )}
            </View>
          )))}

          {activeTab === 'sla' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>SLA Compliance</Text>
              {Array.isArray(slaMetrics) && slaMetrics.length > 0 ? slaMetrics.map((s: any, i: number) => {
                const ps = PRIORITY_STYLES[s.priority] || PRIORITY_STYLES['Medium'];
                return (
                  <View key={i} style={[styles.slaRow, i < slaMetrics.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.badge, { backgroundColor: ps.bg }]}><Text style={[styles.badgeText, { color: ps.color }]}>{s.priority}</Text></View>
                      <Text style={styles.slaDetail}>Response: {s.responseTarget} • Resolution: {s.resolutionTarget}</Text>
                    </View>
                    <Text style={[styles.slaCompliance, { color: (s.compliance || 0) >= 95 ? '#059669' : (s.compliance || 0) >= 90 ? '#D97706' : '#DC2626' }]}>{s.compliance || 0}%</Text>
                  </View>
                );
              }) : <Text style={styles.emptyText}>No SLA data available</Text>}
            </View>
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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
