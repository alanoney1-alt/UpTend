import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchProEarnings, fetchProCertifications, fetchTaxSummary } from '../services/api';

export default function EarningsCoachScreen({ navigation }: any) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [certs, setCerts] = useState<any>(null);
  const [taxData, setTaxData] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetchProEarnings().catch(() => null),
      fetchProCertifications().catch(() => null),
      fetchTaxSummary().catch(() => null),
    ]).then(([e, c, t]) => {
      setEarnings(e);
      setCerts(c);
      setTaxData(t);
      if (!e) setError('Could not load earnings data');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const weeklyEarnings = earnings?.weeklyEarnings || earnings?.weekly_earnings || 0;
  const monthlyEarnings = earnings?.monthlyEarnings || earnings?.monthly_earnings || 0;
  const totalEarnings = period === 'week' ? weeklyEarnings : monthlyEarnings;
  const dailyBreakdown = earnings?.dailyBreakdown || earnings?.daily_breakdown || [];
  const serviceMix = earnings?.serviceMix || earnings?.service_mix || [];
  const insights = earnings?.insights || earnings?.recommendations || [];
  const goalAmount = earnings?.weeklyGoal || earnings?.weekly_goal || 3000;
  const maxAmount = dailyBreakdown.length > 0 ? Math.max(...dailyBreakdown.map((d: any) => d.amount || 0), 1) : 1;
  const changePercent = earnings?.changePercent || earnings?.change_percent || 0;

  // Fee tier progress from certifications
  const feeTier = certs?.feeTier || certs?.fee_tier || null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Earnings Coach</Text>

        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Period toggle */}
        <View style={styles.periodToggle}>
          {(['week', 'month'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodActive]} onPress={() => setPeriod(p)}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p === 'week' ? 'This Week' : 'This Month'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryAmount}>${totalEarnings.toLocaleString()}</Text>
          {changePercent !== 0 && (
            <Text style={[styles.summaryChange, { color: changePercent > 0 ? Colors.success : Colors.error }]}>
              {changePercent > 0 ? '↑' : '↓'} {Math.abs(changePercent)}% from last {period}
            </Text>
          )}
        </View>

        {/* Fee tier progress */}
        {feeTier && (
          <View style={styles.feeCard}>
            <Text style={styles.feeTitle}>💎 Fee Tier: {feeTier.name || feeTier.tier}</Text>
            <Text style={styles.feeSub}>Platform fee: {feeTier.feePercent || feeTier.fee_percent}% {feeTier.nextTier ? `→ ${feeTier.nextTier.feePercent}% at ${feeTier.nextTier.name}` : ''}</Text>
            {feeTier.progress != null && (
              <View style={styles.feeBar}>
                <View style={[styles.feeFill, { width: `${feeTier.progress}%` }]} />
              </View>
            )}
          </View>
        )}

        {/* Chart */}
        {dailyBreakdown.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Daily Breakdown</Text>
            <View style={styles.chart}>
              {dailyBreakdown.map((d: any, i: number) => (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barAmount}>${d.amount || 0}</Text>
                  <View style={[styles.bar, { height: Math.max(((d.amount || 0) / maxAmount) * 120, 4) }]} />
                  <Text style={styles.barLabel}>{d.day || d.label || ''}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>🎯 Weekly Goal</Text>
            <Text style={styles.goalAmount}>${weeklyEarnings} / ${goalAmount}</Text>
          </View>
          <View style={styles.goalBar}>
            <View style={[styles.goalFill, { width: `${Math.min((weeklyEarnings / goalAmount) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.goalPct}>{Math.round((weeklyEarnings / goalAmount) * 100)}% complete</Text>
        </View>

        {/* AI Insights */}
        {insights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
            {insights.map((insight: any, i: number) => (
              <View key={i} style={[styles.insightCard, { backgroundColor: insight.color || '#E8F0FF' }]}>
                <Text style={styles.insightIcon}>{insight.icon || '💡'}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightText}>{insight.text || insight.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Service mix */}
        {serviceMix.length > 0 && (
          <View style={styles.mixCard}>
            <Text style={styles.mixTitle}>Service Mix This {period === 'week' ? 'Week' : 'Month'}</Text>
            {serviceMix.map((s: any, i: number) => (
              <View key={i} style={styles.mixRow}>
                <Text style={styles.mixService}>{s.service || s.name}</Text>
                <View style={styles.mixBarBg}>
                  <View style={[styles.mixBarFill, { width: `${s.pct || s.percent || 0}%` }]} />
                </View>
                <Text style={styles.mixAmount}>${s.amount || 0}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tax helper link */}
        <TouchableOpacity style={styles.taxLink} onPress={() => navigation?.navigate?.('TaxHelper')}>
          <Text style={styles.taxLinkText}>🧾 View Tax Summary →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  periodToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 3, marginBottom: 16 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  periodActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: Colors.purple, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  summaryAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  summaryChange: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  feeCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  feeTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  feeSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  feeBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  feeFill: { height: '100%', backgroundColor: Colors.purple, borderRadius: 3 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  barCol: { alignItems: 'center', flex: 1 },
  barAmount: { fontSize: 10, color: Colors.textSecondary, marginBottom: 4 },
  bar: { width: 24, borderRadius: 6, backgroundColor: Colors.primary },
  barLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  goalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  goalAmount: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  goalBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  goalPct: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  insightCard: { flexDirection: 'row', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center' },
  insightIcon: { fontSize: 24, marginRight: 12 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  insightText: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  mixCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 8 },
  mixTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  mixRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mixService: { width: 120, fontSize: 13, color: Colors.text, fontWeight: '600' },
  mixBarBg: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
  mixBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  mixAmount: { fontSize: 13, fontWeight: '700', color: Colors.primary, width: 50, textAlign: 'right' },
  taxLink: { backgroundColor: '#FFF3E8', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  taxLinkText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
});
