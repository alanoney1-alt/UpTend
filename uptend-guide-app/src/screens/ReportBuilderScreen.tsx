import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const REPORT_TEMPLATES = [
  { id: '1', name: 'Monthly Spend Summary', description: 'Total spend by property, service type, and vendor', category: 'Financial', emoji: '💰', popular: true },
  { id: '2', name: 'SLA Compliance Report', description: 'Response & resolution times across all work orders', category: 'Operations', emoji: '⏱️', popular: true },
  { id: '3', name: 'Vendor Scorecard', description: 'Performance metrics for all assigned pros', category: 'Vendor', emoji: '⭐', popular: false },
  { id: '4', name: 'Insurance Expiry Report', description: 'COI and compliance document expiration timeline', category: 'Compliance', emoji: '🛡️', popular: false },
  { id: '5', name: 'Occupancy & Turnover', description: 'Unit status, vacancy rates, and turnover timelines', category: 'Property', emoji: '🏢', popular: true },
  { id: '6', name: 'Government Contract Status', description: 'Bid pipeline, payroll, and DBE utilization', category: 'Government', emoji: '🏛️', popular: false },
  { id: '7', name: 'Certified Payroll (WH-347)', description: 'Davis-Bacon compliant payroll export', category: 'Government', emoji: '📊', popular: false },
];

const SAVED_REPORTS = [
  { id: '1', name: 'Q4 2025 Portfolio Summary', template: 'Monthly Spend Summary', lastRun: 'Jan 15, 2026', schedule: 'Monthly', format: 'PDF' },
  { id: '2', name: 'Weekly SLA Dashboard', template: 'SLA Compliance Report', lastRun: 'Feb 14, 2026', schedule: 'Weekly', format: 'Excel' },
  { id: '3', name: 'January Vendor Review', template: 'Vendor Scorecard', lastRun: 'Feb 1, 2026', schedule: 'One-time', format: 'PDF' },
];

const AVAILABLE_COLUMNS = [
  { group: 'Property', columns: ['Address', 'Unit', 'Type', 'Occupancy', 'Monthly Rent'] },
  { group: 'Financial', columns: ['Total Spend', 'Invoice Amount', 'Payment Status', 'Budget vs Actual'] },
  { group: 'Operations', columns: ['Work Orders', 'Response Time', 'Resolution Time', 'SLA Status'] },
  { group: 'Vendor', columns: ['Pro Name', 'Rating', 'Jobs Completed', 'On-Time %'] },
];

const WIZARD_STEPS = ['Template', 'Filters', 'Columns', 'Schedule'];

export default function ReportBuilderScreen() {
  const [activeTab, setActiveTab] = useState<'templates' | 'saved' | 'builder'>('templates');
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['Address', 'Total Spend', 'Work Orders', 'Pro Name']);

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Report Builder</Text>
          <Text style={styles.subtitle}>Custom reports & analytics</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {([['templates', '📋 Templates'], ['saved', '💾 Saved'], ['builder', '🔧 Builder']] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
              <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Templates */}
        {activeTab === 'templates' && REPORT_TEMPLATES.map((t) => (
          <TouchableOpacity key={t.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.cardTitle}>{t.name}</Text>
                  {t.popular && <View style={styles.popularBadge}><Text style={styles.popularText}>Popular</Text></View>}
                </View>
                <Text style={styles.cardSubtitle}>{t.description}</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <View style={styles.categoryBadge}><Text style={styles.categoryText}>{t.category}</Text></View>
              <TouchableOpacity style={styles.useBtn}><Text style={styles.useBtnText}>Use Template</Text></TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {/* Saved */}
        {activeTab === 'saved' && (
          <>
            {SAVED_REPORTS.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.cardTitle}>{r.name}</Text>
                <Text style={styles.cardSubtitle}>Based on: {r.template}</Text>
                <View style={[styles.cardRow, { marginTop: 10 }]}>
                  <Text style={styles.cardDetail}>Last run: {r.lastRun}</Text>
                  <View style={styles.schedBadge}><Text style={styles.schedText}>{r.schedule}</Text></View>
                  <View style={styles.formatBadge}><Text style={styles.formatText}>{r.format}</Text></View>
                </View>
                <View style={[styles.cardActions, { marginTop: 10 }]}>
                  <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📥 Download</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>🔄 Re-run</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}><Text style={styles.primaryBtnText}>✏️ Edit</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Builder Wizard */}
        {activeTab === 'builder' && (
          <>
            {/* Wizard Progress */}
            <View style={styles.wizardProgress}>
              {WIZARD_STEPS.map((step, i) => (
                <View key={i} style={styles.wizardStepRow}>
                  <View style={[styles.wizardDot, i <= wizardStep ? styles.wizardDotActive : {}]}>
                    <Text style={[styles.wizardDotText, i <= wizardStep ? { color: Colors.white } : {}]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.wizardLabel, i === wizardStep && { color: Colors.primary, fontWeight: '700' }]}>{step}</Text>
                  {i < WIZARD_STEPS.length - 1 && <View style={[styles.wizardLine, i < wizardStep ? styles.wizardLineActive : {}]} />}
                </View>
              ))}
            </View>

            {/* Step Content */}
            {wizardStep === 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Choose Report Type</Text>
                {['Financial Summary', 'Operations Dashboard', 'Vendor Performance', 'Compliance Audit'].map((type, i) => (
                  <TouchableOpacity key={i} style={[styles.typeOption, i === 0 && styles.typeOptionSelected]}>
                    <Text style={[styles.typeOptionText, i === 0 && { color: Colors.primary }]}>{type}</Text>
                    {i === 0 && <Text style={{ color: Colors.primary }}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {wizardStep === 1 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Set Filters</Text>
                {[['Date Range', 'Last 30 days'], ['Properties', 'All (20)'], ['Service Types', 'All'], ['Vendors', 'All (15)']].map(([label, value], i) => (
                  <TouchableOpacity key={i} style={styles.filterRow}>
                    <Text style={styles.filterLabel}>{label}</Text>
                    <Text style={styles.filterValue}>{value} ›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {wizardStep === 2 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Select Columns</Text>
                {AVAILABLE_COLUMNS.map((group, gi) => (
                  <View key={gi}>
                    <Text style={styles.groupTitle}>{group.group}</Text>
                    <View style={styles.columnsRow}>
                      {group.columns.map((col, ci) => (
                        <TouchableOpacity key={ci} style={[styles.columnChip, selectedColumns.includes(col) && styles.columnChipSelected]} onPress={() => toggleColumn(col)}>
                          <Text style={[styles.columnChipText, selectedColumns.includes(col) && { color: Colors.white }]}>{col}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {wizardStep === 3 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Schedule & Export</Text>
                {[['One-time', true], ['Weekly', false], ['Monthly', false], ['Quarterly', false]].map(([label, selected], i) => (
                  <TouchableOpacity key={i} style={[styles.typeOption, selected && styles.typeOptionSelected]}>
                    <Text style={[styles.typeOptionText, selected && { color: Colors.primary }]}>{label as string}</Text>
                    {selected && <Text style={{ color: Colors.primary }}>✓</Text>}
                  </TouchableOpacity>
                ))}
                <Text style={[styles.groupTitle, { marginTop: 16 }]}>Export Format</Text>
                <View style={styles.columnsRow}>
                  {['PDF', 'Excel', 'CSV', 'Google Sheets'].map((fmt, i) => (
                    <TouchableOpacity key={i} style={[styles.columnChip, i === 0 && styles.columnChipSelected]}>
                      <Text style={[styles.columnChipText, i === 0 && { color: Colors.white }]}>{fmt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Navigation */}
            <View style={styles.wizardNav}>
              {wizardStep > 0 && (
                <TouchableOpacity style={styles.backBtn} onPress={() => setWizardStep(wizardStep - 1)}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.nextBtn} onPress={() => setWizardStep(Math.min(wizardStep + 1, 3))}>
                <Text style={styles.nextBtnText}>{wizardStep === 3 ? '🚀 Generate Report' : 'Next →'}</Text>
              </TouchableOpacity>
            </View>
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
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnText: { fontSize: 13, fontWeight: '600', color: Colors.white },
  popularBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  popularText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  categoryBadge: { backgroundColor: Colors.background, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  useBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  useBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  schedBadge: { backgroundColor: '#DBEAFE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  schedText: { fontSize: 11, fontWeight: '600', color: '#2563EB' },
  formatBadge: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  formatText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  wizardProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  wizardStepRow: { flexDirection: 'row', alignItems: 'center' },
  wizardDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  wizardDotActive: { backgroundColor: Colors.primary },
  wizardDotText: { fontSize: 12, fontWeight: '700', color: Colors.textLight },
  wizardLabel: { fontSize: 11, color: Colors.textSecondary, marginLeft: 4 },
  wizardLine: { width: 20, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: 4 },
  wizardLineActive: { backgroundColor: Colors.primary },
  typeOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  typeOptionSelected: { backgroundColor: '#FFF7ED', marginHorizontal: -16, paddingHorizontal: 16, borderRadius: 8 },
  typeOptionText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  filterValue: { fontSize: 14, color: Colors.primary },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 12, marginBottom: 8 },
  columnsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  columnChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.borderLight },
  columnChipSelected: { backgroundColor: Colors.primary },
  columnChipText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  wizardNav: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.white },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  nextBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
