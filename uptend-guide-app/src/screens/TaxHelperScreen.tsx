import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { LoadingScreen } from '../components/ui';
import { fetchTaxSummary } from '../services/api';

const FALLBACK_TAX_DATA = {
  ytdEarnings: 38450,
  ytdMileage: 4280,
  mileageDeduction: 2825,
  suppliesDeduction: 1640,
  phoneDeduction: 420,
  insuranceDeduction: 1200,
  estimatedTax: 7690,
  quarterlyPayment: 1923,
  nextQuarterlyDue: 'April 15, 2026',
};

const EXPENSES = [
  { category: 'Mileage', amount: 2825, icon: '🚗', auto: true },
  { category: 'Supplies', amount: 1640, icon: '🔧', auto: false },
  { category: 'Phone', amount: 420, icon: '📱', auto: true },
  { category: 'Insurance', amount: 1200, icon: '🛡️', auto: false },
  { category: 'Equipment', amount: 850, icon: '🔨', auto: false },
  { category: 'Marketing', amount: 180, icon: '📣', auto: false },
];

export default function TaxHelperScreen() {
  const [taxData, setTaxData] = useState(FALLBACK_TAX_DATA);
  const [expenses, setExpenses] = useState(EXPENSES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchTaxSummary();
      if (res) {
        setTaxData({
          ytdEarnings: res.ytdEarnings ?? FALLBACK_TAX_DATA.ytdEarnings,
          ytdMileage: res.ytdMileage ?? FALLBACK_TAX_DATA.ytdMileage,
          mileageDeduction: res.mileageDeduction ?? FALLBACK_TAX_DATA.mileageDeduction,
          suppliesDeduction: res.suppliesDeduction ?? FALLBACK_TAX_DATA.suppliesDeduction,
          phoneDeduction: res.phoneDeduction ?? FALLBACK_TAX_DATA.phoneDeduction,
          insuranceDeduction: res.insuranceDeduction ?? FALLBACK_TAX_DATA.insuranceDeduction,
          estimatedTax: res.estimatedTax ?? FALLBACK_TAX_DATA.estimatedTax,
          quarterlyPayment: res.quarterlyPayment ?? FALLBACK_TAX_DATA.quarterlyPayment,
          nextQuarterlyDue: res.nextQuarterlyDue ?? FALLBACK_TAX_DATA.nextQuarterlyDue,
        });
        if (res.expenses) setExpenses(res.expenses);
      }
    } catch { /* keep fallback */ }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return <LoadingScreen message="Loading tax summary..." />;

  const TAX_DATA = taxData;
  const totalDeductions = expenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🧾 Tax Helper</Text>
        <Text style={styles.subtitle}>Year-to-Date Tax Summary</Text>

        {/* YTD Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>YTD Earnings</Text>
              <Text style={styles.summaryValue}>${TAX_DATA.ytdEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Est. Tax Owed</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>${TAX_DATA.estimatedTax.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Deductions</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>-${totalDeductions.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Effective Rate</Text>
              <Text style={styles.summaryValue}>{(TAX_DATA.estimatedTax / TAX_DATA.ytdEarnings * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Quarterly payment */}
        <View style={styles.quarterlyCard}>
          <Text style={styles.quarterlyTitle}>📅 Next Quarterly Payment</Text>
          <Text style={styles.quarterlyAmount}>${TAX_DATA.quarterlyPayment.toLocaleString()}</Text>
          <Text style={styles.quarterlyDue}>Due: {TAX_DATA.nextQuarterlyDue}</Text>
        </View>

        {/* Mileage */}
        <View style={styles.mileageCard}>
          <Text style={styles.mileageTitle}>🚗 Auto Mileage Tracking</Text>
          <View style={styles.mileageStats}>
            <View style={styles.mileageStat}><Text style={styles.mileageNum}>{TAX_DATA.ytdMileage.toLocaleString()}</Text><Text style={styles.mileageLabel}>Miles tracked</Text></View>
            <View style={styles.mileageStat}><Text style={styles.mileageNum}>${TAX_DATA.mileageDeduction.toLocaleString()}</Text><Text style={styles.mileageLabel}>Deduction</Text></View>
          </View>
          <View style={styles.mileageActive}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>GPS tracking active during work hours</Text>
          </View>
        </View>

        {/* Deductions */}
        <Text style={styles.sectionTitle}>Deduction Breakdown</Text>
        {expenses.map((exp: any, i: number) => (
          <View key={i} style={styles.expenseRow}>
            <Text style={styles.expenseIcon}>{exp.icon}</Text>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseCategory}>{exp.category}</Text>
              {exp.auto && <Text style={styles.autoTag}>Auto-tracked</Text>}
            </View>
            <Text style={styles.expenseAmount}>${exp.amount.toLocaleString()}</Text>
          </View>
        ))}

        {/* Export */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportBtnText}>📄 Export PDF Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtnAlt}>
            <Text style={styles.exportBtnAltText}>📊 Export CSV</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 2 },
  quarterlyCard: { backgroundColor: Colors.purple, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  quarterlyTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  quarterlyAmount: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  quarterlyDue: { color: Colors.primaryLight, fontSize: 14, marginTop: 4 },
  mileageCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  mileageTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  mileageStats: { flexDirection: 'row', gap: 20 },
  mileageStat: { alignItems: 'center' },
  mileageNum: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  mileageLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  mileageActive: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#E8F5E8', borderRadius: 8, padding: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  activeText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  expenseIcon: { fontSize: 20, marginRight: 10 },
  expenseInfo: { flex: 1 },
  expenseCategory: { fontSize: 14, fontWeight: '600', color: Colors.text },
  autoTag: { fontSize: 10, color: Colors.success, fontWeight: '600' },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  exportSection: { flexDirection: 'row', gap: 10, marginTop: 16 },
  exportBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  exportBtnAlt: { flex: 1, borderWidth: 2, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  exportBtnAltText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
