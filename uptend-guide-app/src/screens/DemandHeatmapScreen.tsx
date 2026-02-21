import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Header, LoadingScreen, EmptyState } from '../components/ui';
import { colors } from '../components/ui/tokens';
import { fetchDemandHeatmap, fetchSurgePricing } from '../services/api';

const SERVICES = ['All', 'Junk Removal', 'Pressure Washing', 'Lawn Care', 'Pool Cleaning', 'Handyman'];
const TIME_FILTERS = ['Today', 'This Week', 'This Month'];
const DEMAND_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export default function DemandHeatmapScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [selectedService, setSelectedService] = useState('All');
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [zones, setZones] = useState<any[]>([]);
  const [surgeData, setSurgeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchDemandHeatmap().catch(() => null),
      fetchSurgePricing().catch(() => null),
    ]).then(([heatmap, surge]) => {
      const list = heatmap?.zones || heatmap?.areas || [];
      setZones(list.map((z: any) => ({
        id: z.id || z.area,
        area: z.area || z.name || z.neighborhood || 'Unknown',
        demand: z.demand || (z.pendingJobs > 5 ? 'high' : z.pendingJobs > 2 ? 'medium' : 'low'),
        pendingJobs: z.pendingJobs || z.pending_jobs || 0,
        topService: z.topService || z.top_service || '',
        avgPayout: z.avgPayout || z.avg_payout || 0,
      })));
      setSurgeData(surge);
    }).catch(() => setError('Could not load demand data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = selectedService === 'All' ? zones : zones.filter(z => z.topService === selectedService);

  if (loading) return <LoadingScreen message="Loading demand data..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔥 Demand Heatmap</Text>

        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}

        {/* Surge indicator */}
        {surgeData?.active && (
          <View style={styles.surgeBanner}>
            <Text style={styles.surgeText}>⚡ Surge pricing active — {surgeData.multiplier || '1.5'}x in {surgeData.area || 'your area'}</Text>
          </View>
        )}

        {/* Map placeholder with heat colors */}
        <View style={styles.mapCard}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <View style={styles.heatLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.low }]} /><Text style={styles.legendText}>Low</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.medium }]} /><Text style={styles.legendText}>Medium</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.high }]} /><Text style={styles.legendText}>High</Text></View>
          </View>
          {zones.slice(0, 4).map((z, i) => {
            const positions = [{ top: 20, left: 30 }, { top: 50, right: 40 }, { bottom: 30, left: 60 }, { bottom: 20, right: 30 }];
            const color = DEMAND_COLORS[z.demand] || DEMAND_COLORS.low;
            return <View key={z.id || i} style={[styles.heatBubble, { backgroundColor: color + '40', width: 60 + z.pendingJobs * 5, height: 60 + z.pendingJobs * 5, ...positions[i] }]} />;
          })}
        </View>

        {/* Time filter */}
        <View style={styles.filterRow}>
          {TIME_FILTERS.map(t => (
            <TouchableOpacity key={t} style={[styles.filterBtn, timeFilter === t && styles.filterActive]} onPress={() => setTimeFilter(t)}>
              <Text style={[styles.filterText, timeFilter === t && styles.filterTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Service filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceFilter} contentContainerStyle={{ gap: 6 }}>
          {SERVICES.map(s => (
            <TouchableOpacity key={s} style={[styles.serviceBtn, selectedService === s && styles.serviceBtnActive]} onPress={() => setSelectedService(s)}>
              <Text style={[styles.serviceText, selectedService === s && styles.serviceTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Zone list */}
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No Demand Data</Text>
            <Text style={styles.emptyText}>Demand data for your area will appear here as jobs come in.</Text>
          </View>
        ) : (
          filtered.map(zone => (
            <View key={zone.id} style={styles.zoneCard}>
              <View style={[styles.demandBar, { backgroundColor: DEMAND_COLORS[zone.demand] || '#ccc' }]} />
              <View style={styles.zoneContent}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{zone.area}</Text>
                  <View style={[styles.demandBadge, { backgroundColor: `${DEMAND_COLORS[zone.demand] || '#ccc'}20` }]}>
                    <Text style={[styles.demandText, { color: DEMAND_COLORS[zone.demand] || '#666' }]}>{(zone.demand || '').toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.zoneStats}>{zone.pendingJobs} pending jobs{zone.topService ? ` • Top: ${zone.topService}` : ''}</Text>
                {zone.avgPayout > 0 && <Text style={styles.zonePayout}>Avg payout: ${zone.avgPayout}</Text>}
              </View>
            </View>
          ))
        )}

        {/* Go Fish button */}
        <TouchableOpacity style={styles.goFishBtn}>
          <Text style={styles.goFishIcon}>🎣</Text>
          <View>
            <Text style={styles.goFishTitle}>Go Fish</Text>
            <Text style={styles.goFishSubtext}>Set yourself available in hot zones</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  errorBanner: { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  surgeBanner: { backgroundColor: '#FFF3E8', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F59E0B40' },
  surgeText: { color: '#D97706', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  emptyCard: { padding: 30, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginTop: 6 },
  mapCard: { height: 200, backgroundColor: '#1a1a2e', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative', overflow: 'hidden' },
  mapIcon: { fontSize: 32 },
  heatLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#ccc', fontSize: 11 },
  heatBubble: { position: 'absolute', borderRadius: 100 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  serviceFilter: { marginBottom: 16, maxHeight: 36 },
  serviceBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff' },
  serviceBtnActive: { backgroundColor: Colors.purple },
  serviceText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  serviceTextActive: { color: '#fff' },
  zoneCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  demandBar: { width: 4 },
  zoneContent: { flex: 1, padding: 12 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  demandBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  demandText: { fontSize: 10, fontWeight: '800' },
  zoneStats: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  zonePayout: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  goFishBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary, borderRadius: 14, padding: 16, marginTop: 12 },
  goFishIcon: { fontSize: 28 },
  goFishTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  goFishSubtext: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
});
