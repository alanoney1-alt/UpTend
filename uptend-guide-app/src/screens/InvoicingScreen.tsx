import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchInvoices, fetchInvoiceDetail, markInvoicePaid } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Draft': { bg: '#F3F4F6', color: '#6B7280' }, 'Sent': { bg: '#DBEAFE', color: '#2563EB' },
  'Paid': { bg: '#D1FAE5', color: '#059669' }, 'Overdue': { bg: '#FEE2E2', color: '#DC2626' },
  'Partial': { bg: '#FEF3C7', color: '#D97706' },
};

export default function InvoicingScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'detail'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [detail, setDetail] = useState<any>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchInvoices();
      setInvoices(res?.invoices || res || []);
      setSummary(res?.summary || {});
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const viewDetail = async (id: string) => {
    try {
      const res = await fetchInvoiceDetail(id);
      setDetail(res);
      setActiveTab('detail');
    } catch {}
  };

  const handleMarkPaid = async (id: string) => {
    try { await markInvoicePaid(id); load(); setActiveTab('all'); } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Invoicing</Text>
            <Text style={styles.subtitle}>B2B invoice management</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.summaryValue}>{summary.outstanding || '$0'}</Text>
              <Text style={styles.summaryLabel}>Outstanding</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.summaryValue}>{summary.overdue || '$0'}</Text>
              <Text style={styles.summaryLabel}>Overdue</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.summaryValue}>{summary.paidThisMonth || '$0'}</Text>
              <Text style={styles.summaryLabel}>Paid (Month)</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.summaryValue}>{summary.avgDaysToPay || '—'}d</Text>
              <Text style={styles.summaryLabel}>Avg Days to Pay</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.createBtn}><Text style={styles.createBtnText}>➕ Create New Invoice</Text></TouchableOpacity>

          {activeTab === 'all' && (invoices.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No invoices</Text></View>
          ) : invoices.map((inv: any) => {
            const s = STATUS_STYLES[inv.status] || STATUS_STYLES['Draft'];
            return (
              <TouchableOpacity key={inv.id || inv._id} style={styles.card} onPress={() => viewDetail(inv.id || inv._id)}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{inv.ref || `INV-${inv.id}`}</Text>
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
          }))}

          {activeTab === 'detail' && detail && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{detail.ref || `INV-${detail.id}`}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_STYLES[detail.status] || STATUS_STYLES['Draft']).bg }]}>
                  <Text style={[styles.badgeText, { color: (STATUS_STYLES[detail.status] || STATUS_STYLES['Draft']).color }]}>{detail.status}</Text>
                </View>
              </View>
              <View style={styles.detailMeta}>
                <View><Text style={styles.detailLabel}>Bill To</Text><Text style={styles.detailValue}>{detail.client}</Text></View>
                <View><Text style={styles.detailLabel}>Due Date</Text><Text style={styles.detailValue}>{detail.dueDate}</Text></View>
                <View><Text style={styles.detailLabel}>Terms</Text><Text style={styles.detailValue}>{detail.terms}</Text></View>
              </View>

              {detail.lineItems?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Line Items</Text>
                  {detail.lineItems.map((item: any, i: number) => (
                    <View key={i} style={styles.lineItemRow}>
                      <Text style={[styles.lineItemText, { flex: 3 }]} numberOfLines={1}>{item.description}</Text>
                      <Text style={styles.lineItemText}>{item.qty}</Text>
                      <Text style={styles.lineItemText}>{item.rate}</Text>
                      <Text style={[styles.lineItemText, { fontWeight: '600' }]}>{item.total}</Text>
                    </View>
                  ))}
                </>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{detail.amount}</Text>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📥 Download PDF</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📧 Send Reminder</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={() => handleMarkPaid(detail.id || detail._id)}><Text style={styles.primaryBtnText}>✅ Mark Paid</Text></TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setActiveTab('all')} style={{ marginTop: 12, alignItems: 'center' }}>
                <Text style={{ color: Colors.primary, fontWeight: '600' }}>← Back to All Invoices</Text>
              </TouchableOpacity>
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
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
