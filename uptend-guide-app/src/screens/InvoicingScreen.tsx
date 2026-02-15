import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const INVOICES = [
  { id: '1', ref: 'INV-2026-0215', client: 'Sunset Ridge HOA', amount: '$4,850.00', dueDate: 'Mar 1, 2026', status: 'Sent', items: 5, terms: 'Net 30' },
  { id: '2', ref: 'INV-2026-0201', client: 'Maple Property Group', amount: '$12,340.00', dueDate: 'Feb 28, 2026', status: 'Overdue', items: 12, terms: 'Net 15' },
  { id: '3', ref: 'INV-2026-0130', client: 'FL DOT - Rest Stop', amount: '$67,500.00', dueDate: 'Feb 15, 2026', status: 'Paid', items: 8, terms: 'Net 45' },
  { id: '4', ref: 'INV-2026-0125', client: 'Palm Bay Condos', amount: '$3,200.00', dueDate: 'Feb 10, 2026', status: 'Paid', items: 3, terms: 'Net 30' },
  { id: '5', ref: 'INV-2026-0215B', client: 'VA Hospital', amount: '$24,000.00', dueDate: 'Mar 15, 2026', status: 'Draft', items: 6, terms: 'Net 60' },
];

const SUMMARY = {
  outstanding: '$41,190',
  overdue: '$12,340',
  paidThisMonth: '$70,700',
  avgDaysToPay: 18,
};

const LINE_ITEMS = [
  { description: 'Bi-weekly Lawn Maintenance (x2)', qty: 2, rate: '$520.00', total: '$1,040.00' },
  { description: 'Pool Cleaning Service', qty: 4, rate: '$150.00', total: '$600.00' },
  { description: 'Pressure Washing - Common Areas', qty: 1, rate: '$1,200.00', total: '$1,200.00' },
  { description: 'Emergency Plumbing - Unit 14B', qty: 1, rate: '$450.00', total: '$450.00' },
  { description: 'Quarterly Pest Control', qty: 1, rate: '$1,560.00', total: '$1,560.00' },
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Draft': { bg: '#F3F4F6', color: '#6B7280' },
  'Sent': { bg: '#DBEAFE', color: '#2563EB' },
  'Paid': { bg: '#D1FAE5', color: '#059669' },
  'Overdue': { bg: '#FEE2E2', color: '#DC2626' },
  'Partial': { bg: '#FEF3C7', color: '#D97706' },
};

export default function InvoicingScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'detail' | 'create'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoicing</Text>
          <Text style={styles.subtitle}>B2B invoice management</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={styles.summaryValue}>{SUMMARY.outstanding}</Text>
            <Text style={styles.summaryLabel}>Outstanding</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.summaryValue}>{SUMMARY.overdue}</Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.summaryValue}>{SUMMARY.paidThisMonth}</Text>
            <Text style={styles.summaryLabel}>Paid (Month)</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.summaryValue}>{SUMMARY.avgDaysToPay}d</Text>
            <Text style={styles.summaryLabel}>Avg Days to Pay</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setActiveTab('create')}>
          <Text style={styles.createBtnText}>➕ Create New Invoice</Text>
        </TouchableOpacity>

        {/* Invoice List */}
        {(activeTab === 'all' || activeTab === 'create') && INVOICES.map((inv) => {
          const s = STATUS_STYLES[inv.status] || STATUS_STYLES['Draft'];
          return (
            <TouchableOpacity key={inv.id} style={styles.card} onPress={() => { setSelectedInvoice(inv.id); setActiveTab('detail'); }}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{inv.ref}</Text>
                  <Text style={styles.cardSubtitle}>{inv.client}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: s.bg }]}>
                  <Text style={[styles.badgeText, { color: s.color }]}>{inv.status}</Text>
                </View>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                <Text style={styles.cardDetail}>Due: {inv.dueDate}</Text>
                <Text style={styles.cardDetail}>{inv.terms}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Invoice Detail */}
        {activeTab === 'detail' && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>INV-2026-0215</Text>
              <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.badgeText, { color: '#2563EB' }]}>Sent</Text>
              </View>
            </View>
            <View style={styles.detailMeta}>
              <View><Text style={styles.detailLabel}>Bill To</Text><Text style={styles.detailValue}>Sunset Ridge HOA</Text></View>
              <View><Text style={styles.detailLabel}>Due Date</Text><Text style={styles.detailValue}>Mar 1, 2026</Text></View>
              <View><Text style={styles.detailLabel}>Terms</Text><Text style={styles.detailValue}>Net 30</Text></View>
            </View>

            {/* Line Items */}
            <Text style={styles.sectionTitle}>Line Items</Text>
            <View style={styles.lineItemsHeader}>
              <Text style={[styles.lineItemCol, { flex: 3 }]}>Description</Text>
              <Text style={styles.lineItemCol}>Qty</Text>
              <Text style={styles.lineItemCol}>Rate</Text>
              <Text style={styles.lineItemCol}>Total</Text>
            </View>
            {LINE_ITEMS.map((item, i) => (
              <View key={i} style={styles.lineItemRow}>
                <Text style={[styles.lineItemText, { flex: 3 }]} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.lineItemText}>{item.qty}</Text>
                <Text style={styles.lineItemText}>{item.rate}</Text>
                <Text style={[styles.lineItemText, { fontWeight: '600' }]}>{item.total}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>$4,850.00</Text>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📥 Download PDF</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📧 Send Reminder</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]}><Text style={styles.primaryBtnText}>✅ Mark Paid</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setActiveTab('all')} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>← Back to All Invoices</Text>
            </TouchableOpacity>
          </View>
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
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  summaryCard: { width: '47%' as any, borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.text },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  createBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  createBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  invoiceAmount: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  detailCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },
  detailMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { fontSize: 11, color: Colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  lineItemsHeader: { flexDirection: 'row', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  lineItemCol: { flex: 1, fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  lineItemRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  lineItemText: { flex: 1, fontSize: 13, color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  detailActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  primaryBtn: { backgroundColor: Colors.primary },
  primaryBtnText: { fontSize: 12, fontWeight: '600', color: Colors.white },
});
