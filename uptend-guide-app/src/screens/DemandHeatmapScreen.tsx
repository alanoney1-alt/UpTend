import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface HeatZone {
  id: string;
  area: string;
  demand: 'low' | 'medium' | 'high';
  pendingJobs: number;
  topService: string;
  avgPayout: number;
}

const MOCK_ZONES: HeatZone[] = [
  { id: '1', area: 'Winter Park', demand: 'high', pendingJobs: 12, topService: 'Junk Removal', avgPayout: 185 },
  { id: '2', area: 'Downtown Orlando', demand: 'high', pendingJobs: 9, topService: 'Pressure Washing', avgPayout: 165 },
  { id: '3', area: 'Lake Nona', demand: 'medium', pendingJobs: 6, topService: 'Lawn Care', avgPayout: 95 },
  { id: '4', area: 'Kissimmee', demand: 'medium', pendingJobs: 5, topService: 'Pool Cleaning', avgPayout: 110 },
  { id: '5', area: 'Dr. Phillips', demand: 'low', pendingJobs: 2, topService: 'Handyman', avgPayout: 120 },
  { id: '6', area: 'Altamonte Springs', demand: 'low', pendingJobs: 3, topService: 'Gutter Cleaning', avgPayout: 90 },
];

const SERVICES = ['All', 'Junk Removal', 'Pressure Washing', 'Lawn Care', 'Pool Cleaning', 'Handyman'];
const TIME_FILTERS = ['Today', 'This Week', 'This Month'];

const DEMAND_COLORS = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export default function DemandHeatmapScreen() {
  const [selectedService, setSelectedService] = useState('All');
  const [timeFilter, setTimeFilter] = useState('This Week');

  const filtered = selectedService === 'All' ? MOCK_ZONES : MOCK_ZONES.filter(z => z.topService === selectedService);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔥 Demand Heatmap</Text>

        {/* Map placeholder with heat colors */}
        <View style={styles.mapCard}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <View style={styles.heatLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.low }]} /><Text style={styles.legendText}>Low</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.medium }]} /><Text style={styles.legendText}>Medium</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: DEMAND_COLORS.high }]} /><Text style={styles.legendText}>High</Text></View>
          </View>
          {/* Simulated heat bubbles */}
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(239,68,68,0.3)', top: 20, left: 30, width: 80, height: 80 }]} />
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(239,68,68,0.25)', top: 50, right: 40, width: 70, height: 70 }]} />
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(245,158,11,0.25)', bottom: 30, left: 60, width: 60, height: 60 }]} />
          <View style={[styles.heatBubble, { backgroundColor: 'rgba(16,185,129,0.2)', bottom: 20, right: 30, width: 50, height: 50 }]} />
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
        {filtered.map(zone => (
          <View key={zone.id} style={styles.zoneCard}>
            <View style={[styles.demandBar, { backgroundColor: DEMAND_COLORS[zone.demand] }]} />
            <View style={styles.zoneContent}>
              <View style={styles.zoneHeader}>
                <Text style={styles.zoneName}>{zone.area}</Text>
                <View style={[styles.demandBadge, { backgroundColor: `${DEMAND_COLORS[zone.demand]}20` }]}>
                  <Text style={[styles.demandText, { color: DEMAND_COLORS[zone.demand] }]}>{zone.demand.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.zoneStats}>{zone.pendingJobs} pending jobs • Top: {zone.topService}</Text>
              <Text style={styles.zonePayout}>Avg payout: ${zone.avgPayout}</Text>
            </View>
          </View>
        ))}

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
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 16 },
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
