import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const COI_VAULT = [
  { id: '1', provider: 'State Farm', policyNumber: 'GL-2026-44821', type: 'General Liability', coverage: '$2,000,000', expiry: 'Aug 15, 2026', verified: true },
  { id: '2', provider: 'Hartford', policyNumber: 'WC-2026-77102', type: "Workers' Comp", coverage: '$1,000,000', expiry: 'Jun 30, 2026', verified: true },
  { id: '3', provider: 'Progressive', policyNumber: 'CA-2026-33019', type: 'Commercial Auto', coverage: '$500,000', expiry: 'Mar 1, 2026', verified: false },
  { id: '4', provider: 'Zurich', policyNumber: 'UMB-2026-90155', type: 'Umbrella', coverage: '$5,000,000', expiry: 'Dec 31, 2026', verified: true },
];

const COMPLIANCE_DOCS = [
  { id: '1', name: 'W-9 Tax Form', status: 'Current', uploaded: 'Jan 5, 2026', emoji: '📄' },
  { id: '2', name: 'OSHA 30-Hour Card', status: 'Current', uploaded: 'Nov 12, 2025', emoji: '🦺' },
  { id: '3', name: 'EPA Lead-Safe Cert', status: 'Expiring Soon', uploaded: 'Feb 20, 2025', emoji: '🏗️' },
  { id: '4', name: 'Business License', status: 'Current', uploaded: 'Jan 15, 2026', emoji: '📋' },
  { id: '5', name: 'Contractor Bond', status: 'Current', uploaded: 'Dec 1, 2025', emoji: '🔒' },
];

const BACKGROUND_CHECKS = [
  { id: '1', name: 'Carlos Martinez', role: 'Lead Tech', status: 'Clear', completedAt: 'Jan 20, 2026', expiry: 'Jan 20, 2027' },
  { id: '2', name: 'James Rivera', role: 'Electrician', status: 'Clear', completedAt: 'Dec 15, 2025', expiry: 'Dec 15, 2026' },
  { id: '3', name: 'Maria Santos', role: 'Plumber', status: 'Pending', completedAt: null, expiry: null },
  { id: '4', name: 'David Kim', role: 'HVAC Tech', status: 'Clear', completedAt: 'Feb 1, 2026', expiry: 'Feb 1, 2027' },
  { id: '5', name: 'Sarah Johnson', role: 'Apprentice', status: 'Action Required', completedAt: null, expiry: null },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Current': { bg: '#D1FAE5', color: '#059669' },
  'Clear': { bg: '#D1FAE5', color: '#059669' },
  'Expiring Soon': { bg: '#FEF3C7', color: '#D97706' },
  'Pending': { bg: '#DBEAFE', color: '#2563EB' },
  'Action Required': { bg: '#FEE2E2', color: '#DC2626' },
};

export default function ComplianceScreen() {
  const [activeTab, setActiveTab] = useState<'coi' | 'docs' | 'bgcheck'>('coi');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Compliance Center</Text>
          <Text style={styles.subtitle}>Insurance, documents & background checks</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.summaryValue}>4</Text>
            <Text style={styles.summaryLabel}>Active Policies</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.summaryValue}>1</Text>
            <Text style={styles.summaryLabel}>Expiring Soon</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.summaryValue}>92%</Text>
            <Text style={styles.summaryLabel}>Compliant</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['coi', 'docs', 'bgcheck'] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'coi' ? '🛡️ COI Vault' : tab === 'docs' ? '📄 Documents' : '🔍 Background'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* COI Vault */}
        {activeTab === 'coi' && COI_VAULT.map((coi) => (
          <View key={coi.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{coi.type}</Text>
                <Text style={styles.cardSubtitle}>{coi.provider} • {coi.policyNumber}</Text>
              </View>
              {coi.verified ? (
                <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.badgeText, { color: '#059669' }]}>✓ Verified</Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.badgeText, { color: '#DC2626' }]}>Unverified</Text>
                </View>
              )}
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
        ))}

        {/* Documents */}
        {activeTab === 'docs' && (
          <>
            <TouchableOpacity style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>📤 Upload New Document</Text>
            </TouchableOpacity>
            {COMPLIANCE_DOCS.map((doc) => {
              const s = STATUS_STYLES[doc.status] || STATUS_STYLES['Current'];
              return (
                <View key={doc.id} style={styles.docRow}>
                  <Text style={styles.docEmoji}>{doc.emoji}</Text>
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

        {/* Background Checks */}
        {activeTab === 'bgcheck' && (
          <>
            <TouchableOpacity style={styles.uploadBtn}>
              <Text style={styles.uploadBtnText}>➕ Request New Check</Text>
            </TouchableOpacity>
            {BACKGROUND_CHECKS.map((bg) => {
              const s = STATUS_STYLES[bg.status] || STATUS_STYLES['Pending'];
              return (
                <View key={bg.id} style={styles.card}>
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
});
