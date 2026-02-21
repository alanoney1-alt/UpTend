import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { fetchB2BDashboard, fetchB2BProperties, fetchB2BServices, fetchB2BPreferredPros, fetchB2BInvoices, fetchB2BSpending } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

export default function B2BDashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [spending, setSpending] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, propRes, svcRes, proRes, invRes, spendRes] = await Promise.allSettled([
        fetchB2BDashboard(),
        fetchB2BProperties(),
        fetchB2BServices(),
        fetchB2BPreferredPros(),
        fetchB2BInvoices(),
        fetchB2BSpending(),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value);
      setProperties(propRes.status === 'fulfilled' ? (propRes.value?.properties || propRes.value || []) : []);
      setServices(svcRes.status === 'fulfilled' ? (svcRes.value?.services || svcRes.value || []) : []);
      setPros(proRes.status === 'fulfilled' ? (proRes.value?.pros || proRes.value || []) : []);
      setInvoices(invRes.status === 'fulfilled' ? (invRes.value?.invoices || invRes.value || []) : []);
      setSpending(spendRes.status === 'fulfilled' ? (spendRes.value?.months || spendRes.value || []) : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const companyName = dashboard?.companyName || user?.companyName || 'Your Business';
  const totalProperties = properties.length;
  const totalMonthlySpend = dashboard?.totalMonthlySpend || '$0';
  const maxSpend = Math.max(...(spending.length ? spending.map((m: any) => m.amount || 0) : [1]), 1);

  const emojiForType = (type: string) => {
    if (type?.includes('Apartment') || type?.includes('Multi')) return '🏢';
    if (type?.includes('Commercial')) return '🏬';
    if (type?.includes('Town')) return '🏘️';
    return '🏠';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.portfolioSummary}>Managing {totalProperties} properties</Text>
            </View>
            <View style={styles.spendBadge}>
              <Text style={styles.spendLabel}>Monthly</Text>
              <Text style={styles.spendValue}>{totalMonthlySpend}</Text>
            </View>
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity style={styles.bulkBtn} activeOpacity={0.8}>
              <Text style={styles.bulkBtnEmoji}>📋</Text>
              <Text style={styles.bulkBtnText}>Schedule All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkBtn} activeOpacity={0.8}>
              <Text style={styles.bulkBtnEmoji}>💬</Text>
              <Text style={styles.bulkBtnText}>Get Quotes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bulkBtn, styles.bulkBtnPrimary]} activeOpacity={0.8}>
              <Text style={styles.bulkBtnEmoji}>📊</Text>
              <Text style={[styles.bulkBtnText, { color: Colors.white }]}>Export</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Properties</Text>
          {properties.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No properties yet</Text></View>
          ) : (
            <View style={styles.propertiesGrid}>
              {properties.map((prop: any) => (
                <TouchableOpacity key={prop.id || prop._id} style={styles.propertyCard} activeOpacity={0.8}>
                  <Text style={styles.propertyImage}>{emojiForType(prop.type)}</Text>
                  <Text style={styles.propertyAddress} numberOfLines={1}>{prop.address}</Text>
                  <Text style={styles.propertyType}>{prop.type} • {prop.units || 1} unit{(prop.units || 1) > 1 ? 's' : ''}</Text>
                  <View style={styles.propertyStats}>
                    <View style={[styles.propertyScoreBadge, (prop.healthScore || 0) >= 80 ? styles.scoreGood : (prop.healthScore || 0) >= 70 ? styles.scoreOk : styles.scoreLow]}>
                      <Text style={styles.propertyScoreText}>{prop.healthScore || '—'}</Text>
                    </View>
                    <Text style={styles.propertyServices}>{prop.activeServices || 0} services</Text>
                  </View>
                  <TouchableOpacity style={styles.manageBtn}>
                    <Text style={styles.manageBtnText}>Manage</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Services</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Calendar View</Text></TouchableOpacity>
          </View>
          {services.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No active services</Text></View>
          ) : services.map((svc: any) => (
            <View key={svc.id || svc._id} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{svc.service || svc.name}</Text>
                <Text style={styles.serviceDetail}>{svc.properties || 0} properties • Next: {svc.nextDate || 'TBD'}</Text>
              </View>
              <Text style={styles.serviceCost}>{svc.cost || svc.price || ''}</Text>
            </View>
          ))}

          {spending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Spending Analytics</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartBars}>
                  {spending.map((m: any) => (
                    <View key={m.month} style={styles.chartColumn}>
                      <View style={[styles.chartBar, { height: Math.max(8, ((m.amount || 0) / maxSpend) * 100) }]} />
                      <Text style={styles.chartBarLabel}>{m.month}</Text>
                      <Text style={styles.chartBarValue}>${((m.amount || 0) / 1000).toFixed(1)}k</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartSummary}>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>Avg Monthly</Text>
                    <Text style={styles.chartStatValue}>{dashboard?.avgMonthly || '—'}</Text>
                  </View>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>YoY Change</Text>
                    <Text style={[styles.chartStatValue, { color: Colors.success }]}>{dashboard?.yoyChange || '—'}</Text>
                  </View>
                  <View style={styles.chartStat}>
                    <Text style={styles.chartStatLabel}>Portfolio Discount</Text>
                    <Text style={[styles.chartStatValue, { color: Colors.primary }]}>{dashboard?.discount || '—'}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferred Pros</Text>
            <TouchableOpacity><Text style={styles.viewAll}>Manage</Text></TouchableOpacity>
          </View>
          {pros.map((pro: any) => (
            <View key={pro.id || pro._id} style={styles.proCard}>
              <View style={styles.proAvatar}>
                <Text style={styles.proAvatarText}>{(pro.name || '?')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.proName}>{pro.name}</Text>
                <Text style={styles.proDetail}>⭐ {pro.rating || '—'} • {pro.jobs || 0} jobs • {pro.specialty || ''}</Text>
              </View>
              <TouchableOpacity style={styles.assignBtn}>
                <Text style={styles.assignBtnText}>Assign</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Invoices</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          {invoices.slice(0, 5).map((inv: any) => (
            <View key={inv.id || inv._id} style={styles.invoiceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.invoiceRef}>{inv.ref || inv.reference || `INV-${inv.id}`}</Text>
                <Text style={styles.invoiceDate}>{inv.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.invoiceAmount}>{inv.amount}</Text>
                <View style={styles.invoiceStatusBadge}>
                  <Text style={styles.invoiceStatusText}>{inv.status || 'Pending'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.downloadBtn}>
                <Text style={styles.downloadBtnText}>📥</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </ApiStateWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  companyName: { fontSize: 24, fontWeight: '800', color: Colors.text },
  portfolioSummary: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  spendBadge: { backgroundColor: Colors.purple, borderRadius: 14, padding: 14, alignItems: 'center' },
  spendLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  spendValue: { color: Colors.white, fontSize: 20, fontWeight: '800', marginTop: 2 },
  bulkActions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  bulkBtn: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bulkBtnPrimary: { backgroundColor: Colors.primary },
  bulkBtnEmoji: { fontSize: 20, marginBottom: 4 },
  bulkBtnText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  viewAll: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
  propertiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  propertyCard: { width: '48%' as any, backgroundColor: Colors.white, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  propertyImage: { fontSize: 32, marginBottom: 8 },
  propertyAddress: { fontSize: 14, fontWeight: '600', color: Colors.text },
  propertyType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  propertyStats: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  propertyScoreBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  scoreGood: { backgroundColor: '#D1FAE5' },
  scoreOk: { backgroundColor: '#FEF3C7' },
  scoreLow: { backgroundColor: '#FEE2E2' },
  propertyScoreText: { fontSize: 13, fontWeight: '700' },
  propertyServices: { fontSize: 12, color: Colors.textSecondary },
  manageBtn: { marginTop: 10, backgroundColor: Colors.background, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  manageBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  serviceCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  serviceName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  serviceDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  serviceCost: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  chartCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 110, marginBottom: 16 },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartBar: { width: 20, borderRadius: 6, backgroundColor: Colors.primary },
  chartBarLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
  chartBarValue: { fontSize: 10, color: Colors.textLight, marginTop: 2 },
  chartSummary: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 14 },
  chartStat: { alignItems: 'center' },
  chartStatLabel: { fontSize: 11, color: Colors.textSecondary },
  chartStatValue: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 2 },
  proCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  proAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple, justifyContent: 'center', alignItems: 'center' },
  proAvatarText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  proName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  proDetail: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  assignBtn: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  assignBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  invoiceCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  invoiceRef: { fontSize: 14, fontWeight: '600', color: Colors.text },
  invoiceDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  invoiceAmount: { fontSize: 16, fontWeight: '700', color: Colors.text },
  invoiceStatusBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  invoiceStatusText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  downloadBtn: { padding: 8 },
  downloadBtnText: { fontSize: 18 },
});
