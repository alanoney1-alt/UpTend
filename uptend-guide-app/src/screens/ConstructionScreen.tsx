import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchPunchLists, fetchPunchItems, fetchLienWaivers, fetchPermits } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Open': { bg: '#FEF3C7', color: '#D97706' }, 'In Progress': { bg: '#DBEAFE', color: '#2563EB' },
  'Completed': { bg: '#D1FAE5', color: '#059669' }, 'Active': { bg: '#DBEAFE', color: '#2563EB' },
  'Final Review': { bg: '#FEF3C7', color: '#D97706' }, 'Approved': { bg: '#D1FAE5', color: '#059669' },
  'Passed': { bg: '#D1FAE5', color: '#059669' }, 'Inspection Scheduled': { bg: '#FEF3C7', color: '#D97706' },
  'Under Review': { bg: '#F3F4F6', color: '#6B7280' },
};

export default function ConstructionScreen() {
  const [activeTab, setActiveTab] = useState<'punchlist' | 'liens' | 'permits'>('punchlist');
  const [expandedPunch, setExpandedPunch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [punchLists, setPunchLists] = useState<any[]>([]);
  const [punchItems, setPunchItems] = useState<Record<string, any[]>>({});
  const [lienWaivers, setLienWaivers] = useState<any[]>([]);
  const [permits, setPermits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [plRes, lwRes, pRes] = await Promise.allSettled([fetchPunchLists(), fetchLienWaivers(), fetchPermits()]);
      const plData = plRes.status === 'fulfilled' ? plRes.value : {};
      setPunchLists(plData?.punchLists || plData || []);
      setSummary(plData?.summary || {});
      setLienWaivers(lwRes.status === 'fulfilled' ? (lwRes.value?.waivers || lwRes.value || []) : []);
      setPermits(pRes.status === 'fulfilled' ? (pRes.value?.permits || pRes.value || []) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const loadPunchItems = async (plId: string) => {
    if (punchItems[plId]) return;
    try {
      const res = await fetchPunchItems(plId);
      setPunchItems(prev => ({ ...prev, [plId]: res?.items || res || [] }));
    } catch {}
  };

  const handleExpand = (plId: string) => {
    const newId = expandedPunch === plId ? null : plId;
    setExpandedPunch(newId);
    if (newId) loadPunchItems(newId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Construction</Text>
            <Text style={styles.subtitle}>Punch lists, lien waivers & permits</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.summaryValue}>{summary.punchItems || 0}</Text>
              <Text style={styles.summaryLabel}>Punch Items</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.summaryValue}>{summary.pendingWaivers || lienWaivers.filter((l: any) => !l.signed).length}</Text>
              <Text style={styles.summaryLabel}>Pending Waivers</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.summaryValue}>{permits.length}</Text>
              <Text style={styles.summaryLabel}>Active Permits</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {([['punchlist', '📋 Punch Lists'], ['liens', '📝 Lien Waivers'], ['permits', '🏗️ Permits']] as const).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'punchlist' && (punchLists.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No punch lists</Text></View>
          ) : punchLists.map((pl: any) => {
            const s = STATUS_STYLES[pl.status] || STATUS_STYLES['Active'];
            const expanded = expandedPunch === (pl.id || pl._id);
            const items = punchItems[pl.id || pl._id] || [];
            return (
              <View key={pl.id || pl._id}>
                <TouchableOpacity style={styles.card} onPress={() => handleExpand(pl.id || pl._id)}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{pl.project}</Text>
                      <Text style={styles.cardSubtitle}>Due: {pl.dueDate} • {(pl.trades || []).join(', ')}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{pl.status}</Text>
                    </View>
                  </View>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${pl.totalItems ? ((pl.completedItems || 0) / pl.totalItems) * 100 : 0}%` }]} /></View>
                    <Text style={styles.progressText}>{pl.completedItems || 0}/{pl.totalItems || 0}</Text>
                  </View>
                </TouchableOpacity>
                {expanded && items.map((item: any) => {
                  const is = STATUS_STYLES[item.status] || STATUS_STYLES['Open'];
                  return (
                    <View key={item.id || item._id} style={styles.punchItem}>
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
          }))}

          {activeTab === 'liens' && (lienWaivers.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No lien waivers</Text></View>
          ) : lienWaivers.map((lw: any) => (
            <View key={lw.id || lw._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{lw.vendor}</Text>
                  <Text style={styles.cardSubtitle}>{lw.project} • {lw.type}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: lw.signed ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: lw.signed ? '#059669' : '#DC2626' }]}>{lw.signed ? '✓ Signed' : 'Pending'}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.lienAmount}>{lw.amount}</Text>
                {lw.date ? <Text style={styles.cardDetail}>Signed: {lw.date}</Text> : (
                  <TouchableOpacity style={styles.signBtn}><Text style={styles.signBtnText}>Request Signature</Text></TouchableOpacity>
                )}
              </View>
            </View>
          )))}

          {activeTab === 'permits' && (permits.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No permits</Text></View>
          ) : permits.map((p: any) => {
            const s = STATUS_STYLES[p.status] || STATUS_STYLES['Under Review'];
            return (
              <View key={p.id || p._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={{ fontSize: 24 }}>{p.emoji || '🏗️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{p.type}</Text>
                    <Text style={styles.cardSubtitle}>{p.project} • #{p.number}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.badgeText, { color: s.color }]}>{p.status}</Text>
                  </View>
                </View>
                {p.inspectionDate && <Text style={styles.cardDetail}>Inspection: {p.inspectionDate}</Text>}
              </View>
            );
          }))}

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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
