import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const CURRENT_CONFIG = {
  clientName: 'Maple Property Group',
  logo: '🏢',
  primaryColor: '#2563EB',
  secondaryColor: '#1E40AF',
  customDomain: 'portal.maplepropertygroup.com',
  favicon: '🏢',
  emailFrom: 'service@maplepropertygroup.com',
  supportPhone: '(813) 555-0100',
};

const COLOR_PRESETS = [
  { name: 'Ocean Blue', primary: '#2563EB', secondary: '#1E40AF' },
  { name: 'Forest Green', primary: '#059669', secondary: '#047857' },
  { name: 'Royal Purple', primary: '#7C3AED', secondary: '#6D28D9' },
  { name: 'Sunset Orange', primary: '#F97316', secondary: '#EA580C' },
  { name: 'Corporate Gray', primary: '#4B5563', secondary: '#374151' },
  { name: 'Cherry Red', primary: '#DC2626', secondary: '#B91C1C' },
];

const PORTAL_FEATURES = [
  { name: 'Tenant Work Order Portal', enabled: true, description: 'Tenants submit & track work orders' },
  { name: 'Vendor Scorecards', enabled: true, description: 'Performance metrics visible to clients' },
  { name: 'Invoice Portal', enabled: true, description: 'Clients view & pay invoices online' },
  { name: 'Real-time Job Tracking', enabled: false, description: 'Live map view of active jobs' },
  { name: 'Document Vault', enabled: true, description: 'COIs, contracts, and compliance docs' },
  { name: 'Custom Reports', enabled: false, description: 'Self-service report generation' },
  { name: 'Board Approval Workflow', enabled: false, description: 'HOA board voting & approvals' },
];

const ACTIVE_PORTALS = [
  { id: '1', client: 'Maple Property Group', domain: 'portal.maplepropertygroup.com', users: 24, color: '#2563EB', lastActive: '2 min ago' },
  { id: '2', client: 'Sunset Ridge HOA', domain: 'sunsetridge.uptend.io', users: 8, color: '#059669', lastActive: '1 hr ago' },
  { id: '3', client: 'Palm Bay Condos', domain: 'palmbay.uptend.io', users: 15, color: '#7C3AED', lastActive: '30 min ago' },
];

export default function WhiteLabelScreen() {
  const [activeTab, setActiveTab] = useState<'portals' | 'branding' | 'features'>('portals');
  const [selectedPreset, setSelectedPreset] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>White Label</Text>
          <Text style={styles.subtitle}>Portal branding & configuration</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([['portals', '🌐 Portals'], ['branding', '🎨 Branding'], ['features', '⚙️ Features']] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
              <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Portals */}
        {activeTab === 'portals' && (
          <>
            <TouchableOpacity style={styles.createBtn}><Text style={styles.createBtnText}>➕ Create New Portal</Text></TouchableOpacity>
            {ACTIVE_PORTALS.map((p) => (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.portalDot, { backgroundColor: p.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{p.client}</Text>
                    <Text style={styles.cardSubtitle}>{p.domain}</Text>
                  </View>
                  <View style={styles.usersBadge}><Text style={styles.usersText}>👥 {p.users}</Text></View>
                </View>
                <View style={styles.cardRow}>
                  <Text style={styles.cardDetail}>Last active: {p.lastActive}</Text>
                  <TouchableOpacity style={styles.editBtn}><Text style={styles.editBtnText}>Configure</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Branding */}
        {activeTab === 'branding' && (
          <>
            {/* Preview */}
            <View style={[styles.previewCard, { borderColor: COLOR_PRESETS[selectedPreset].primary }]}>
              <View style={[styles.previewHeader, { backgroundColor: COLOR_PRESETS[selectedPreset].primary }]}>
                <Text style={styles.previewLogo}>{CURRENT_CONFIG.logo}</Text>
                <Text style={styles.previewTitle}>{CURRENT_CONFIG.clientName}</Text>
              </View>
              <View style={styles.previewBody}>
                <Text style={styles.previewText}>Portal Preview</Text>
                <View style={styles.previewNav}>
                  <View style={[styles.previewNavItem, { backgroundColor: COLOR_PRESETS[selectedPreset].primary }]}><Text style={{ color: '#fff', fontSize: 10 }}>Dashboard</Text></View>
                  <View style={styles.previewNavItem}><Text style={{ fontSize: 10 }}>Work Orders</Text></View>
                  <View style={styles.previewNavItem}><Text style={{ fontSize: 10 }}>Invoices</Text></View>
                </View>
              </View>
            </View>

            {/* Color Presets */}
            <Text style={styles.sectionTitle}>Color Theme</Text>
            <View style={styles.presetsGrid}>
              {COLOR_PRESETS.map((preset, i) => (
                <TouchableOpacity key={i} style={[styles.presetCard, selectedPreset === i && styles.presetSelected]} onPress={() => setSelectedPreset(i)}>
                  <View style={styles.presetColors}>
                    <View style={[styles.presetDot, { backgroundColor: preset.primary }]} />
                    <View style={[styles.presetDot, { backgroundColor: preset.secondary }]} />
                  </View>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  {selectedPreset === i && <Text style={{ color: Colors.primary, fontSize: 12 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Config Fields */}
            <Text style={styles.sectionTitle}>Portal Settings</Text>
            <View style={styles.card}>
              {[
                ['Custom Domain', CURRENT_CONFIG.customDomain],
                ['Email From', CURRENT_CONFIG.emailFrom],
                ['Support Phone', CURRENT_CONFIG.supportPhone],
                ['Logo', 'Upload logo (PNG, SVG)'],
                ['Favicon', 'Upload favicon'],
              ].map(([label, value], i) => (
                <TouchableOpacity key={i} style={styles.configRow}>
                  <Text style={styles.configLabel}>{label}</Text>
                  <Text style={styles.configValue}>{value} ›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Features */}
        {activeTab === 'features' && (
          <>
            <Text style={styles.sectionTitle}>Portal Features</Text>
            <Text style={styles.sectionSubtitle}>Toggle features available in your client portal</Text>
            {PORTAL_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureName}>{f.name}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
                <TouchableOpacity style={[styles.toggleBtn, f.enabled ? styles.toggleOn : styles.toggleOff]}>
                  <View style={[styles.toggleDot, f.enabled ? styles.toggleDotOn : styles.toggleDotOff]} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn}><Text style={styles.saveBtnText}>💾 Save Configuration</Text></TouchableOpacity>

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
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center' },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  createBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  createBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  portalDot: { width: 12, height: 12, borderRadius: 6 },
  usersBadge: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  usersText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  editBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  editBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  previewCard: { borderRadius: 16, borderWidth: 2, overflow: 'hidden', marginBottom: 20 },
  previewHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewLogo: { fontSize: 24 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: Colors.white },
  previewBody: { padding: 16, backgroundColor: Colors.white },
  previewText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  previewNav: { flexDirection: 'row', gap: 8 },
  previewNavItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: Colors.borderLight },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  presetCard: { width: '47%' as any, backgroundColor: Colors.white, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  presetSelected: { borderWidth: 2, borderColor: Colors.primary },
  presetColors: { flexDirection: 'row', gap: 4 },
  presetDot: { width: 16, height: 16, borderRadius: 8 },
  presetName: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.text },
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  configLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  configValue: { fontSize: 13, color: Colors.primary },
  featureRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  featureName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  featureDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggleBtn: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: Colors.primary },
  toggleOff: { backgroundColor: Colors.borderLight },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.white },
  toggleDotOn: { alignSelf: 'flex-end' },
  toggleDotOff: { alignSelf: 'flex-start' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
