import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const WEEKLY_DATA = [
  { day: 'Mon', amount: 320 },
  { day: 'Tue', amount: 485 },
  { day: 'Wed', amount: 275 },
  { day: 'Thu', amount: 410 },
  { day: 'Fri', amount: 365 },
  { day: 'Sat', amount: 520 },
  { day: 'Sun', amount: 125 },
];

const maxAmount = Math.max(...WEEKLY_DATA.map(d => d.amount));

const AI_INSIGHTS = [
  { icon: '💡', title: 'Add Pool Cleaning', text: 'Estimated +$600/week. High demand in your area and low competition.', color: '#E8F0FF' },
  { icon: '📅', title: 'Best Earning Days', text: 'Tuesday and Saturday are your strongest. Consider adding a Sunday shift.', color: '#FFF3E8' },
  { icon: '📍', title: 'Area Tip', text: 'Winter Park pays 20% more than Kissimmee for the same services.', color: '#F0E6FF' },
  { icon: '🏆', title: 'Your Ranking', text: 'You\'re in the top 15% of Orlando pros. Keep it up!', color: '#E8F5E8' },
];

export default function EarningsCoachScreen() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const weekTotal = WEEKLY_DATA.reduce((s, d) => s + d.amount, 0);
  const [goalAmount, setGoalAmount] = useState(3000);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📊 Earnings Coach</Text>

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
          <Text style={styles.summaryAmount}>${weekTotal.toLocaleString()}</Text>
          <Text style={styles.summaryChange}>↑ 12% from last week</Text>
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Breakdown</Text>
          <View style={styles.chart}>
            {WEEKLY_DATA.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={styles.barAmount}>${d.amount}</Text>
                <View style={[styles.bar, { height: (d.amount / maxAmount) * 120 }]} />
                <Text style={styles.barLabel}>{d.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Goal */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>🎯 Weekly Goal</Text>
            <Text style={styles.goalAmount}>${weekTotal} / ${goalAmount}</Text>
          </View>
          <View style={styles.goalBar}>
            <View style={[styles.goalFill, { width: `${Math.min((weekTotal / goalAmount) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.goalPct}>{Math.round((weekTotal / goalAmount) * 100)}% complete</Text>
        </View>

        {/* AI Insights */}
        <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
        {AI_INSIGHTS.map((insight, i) => (
          <View key={i} style={[styles.insightCard, { backgroundColor: insight.color }]}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          </View>
        ))}

        {/* Service mix */}
        <View style={styles.mixCard}>
          <Text style={styles.mixTitle}>Service Mix This Week</Text>
          {[
            { service: 'Junk Removal', pct: 35, amount: 875 },
            { service: 'Pressure Washing', pct: 28, amount: 700 },
            { service: 'Lawn Care', pct: 22, amount: 550 },
            { service: 'Handyman', pct: 15, amount: 375 },
          ].map((s, i) => (
            <View key={i} style={styles.mixRow}>
              <Text style={styles.mixService}>{s.service}</Text>
              <View style={styles.mixBarBg}>
                <View style={[styles.mixBarFill, { width: `${s.pct}%` }]} />
              </View>
              <Text style={styles.mixAmount}>${s.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  periodToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, padding: 3, marginBottom: 16 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  periodActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: '#fff' },
  summaryCard: { backgroundColor: Colors.purple, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  summaryAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 4 },
  summaryChange: { color: Colors.success, fontSize: 14, fontWeight: '600', marginTop: 4 },
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
});
