import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchCOIVault, fetchComplianceDocs, fetchBackgroundChecks } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Current': { bg: '#D1FAE5', color: '#059669' }, 'Clear': { bg: '#D1FAE5', color: '#059669' },
  'Expiring Soon': { bg: '#FEF3C7', color: '#D97706' }, 'Pending': { bg: '#DBEAFE', color: '#2563EB' },
  'Action Required': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function ComplianceScreen() {
  const [activeTab, setActiveTab] = useState<'coi' | 'docs' | 'bgcheck'>('coi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coiVault, setCoiVault] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [bgChecks, setBgChecks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [cRes, dRes, bRes] = await Promise.allSettled([fetchCOIVault(), fetchComplianceDocs(), fetchBackgroundChecks()]);
      const coiData = cRes.status === 'fulfilled' ? cRes.value : {};
      setCoiVault(coiData?.policies || coiData || []);
      setDocs(dRes.status === 'fulfilled' ? (dRes.value?.documents || dRes.value || []) : []);
      setBgChecks(bRes.status === 'fulfilled' ? (bRes.value?.checks || bRes.value || []) : []);
      setSummary(coiData?.summary || {});
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Compliance Center</Text>
            <Text style={styles.subtitle}>Insurance, documents & background checks</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.summaryValue}>{summary.activePolicies || coiVault.length}</Text>
              <Text style={styles.summaryLabel}>Active Policies</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.summaryValue}>{summary.expiringSoon || 0}</Text>
              <Text style={styles.summaryLabel}>Expiring Soon</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.summaryValue}>{summary.compliancePct || '—'}%</Text>
              <Text style={styles.summaryLabel}>Compliant</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['coi', 'docs', 'bgcheck'] as const).map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab === 'coi' ? '🛡️ COI Vault' : tab === 'docs' ? '📄 Documents' : '🔍 Background'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'coi' && (coiVault.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No insurance policies on file</Text></View>
          ) : coiVault.map((coi: any) => (
            <View key={coi.id || coi._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{coi.type}</Text>
                  <Text style={styles.cardSubtitle}>{coi.provider} • {coi.policyNumber}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: coi.verified ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: coi.verified ? '#059669' : '#DC2626' }]}>{coi.verified ? '✓ Verified' : 'Unverified'}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardDetail}>Coverage: {coi.coverage}</Text>
                <Text style={styles.cardDetail}>Expires: {coi.expiry}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>View PDF</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Share</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}><Text style={styles.primaryBtnText}>Renew</Text></TouchableOpacity>
              </View>
            </View>
          )))}

          {activeTab === 'docs' && (
            <>
              <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>📤 Upload New Document</Text></TouchableOpacity>
              {docs.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No documents uploaded</Text></View>
              ) : docs.map((doc: any) => {
                const s = STATUS_STYLES[doc.status] || STATUS_STYLES['Current'];
                return (
                  <View key={doc.id || doc._id} style={styles.docRow}>
                    <Text style={styles.docEmoji}>{doc.emoji || '📄'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      <Text style={styles.docDate}>Uploaded: {doc.uploaded}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.badgeText, { color: s.color }]}>{doc.status}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'bgcheck' && (
            <>
              <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>➕ Request New Check</Text></TouchableOpacity>
              {bgChecks.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No background checks</Text></View>
              ) : bgChecks.map((bg: any) => {
                const s = STATUS_STYLES[bg.status] || STATUS_STYLES['Pending'];
                return (
                  <View key={bg.id || bg._id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{bg.name}</Text>
                        <Text style={styles.cardSubtitle}>{bg.role}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.badgeText, { color: s.color }]}>{bg.status}</Text>
                      </View>
                    </View>
                    {bg.completedAt && (
                      <View style={styles.cardRow}>
                        <Text style={styles.cardDetail}>Completed: {bg.completedAt}</Text>
                        <Text style={styles.cardDetail}>Expires: {bg.expiry}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.background },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  uploadBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  uploadBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  docEmoji: { fontSize: 24 },
  docName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  docDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
