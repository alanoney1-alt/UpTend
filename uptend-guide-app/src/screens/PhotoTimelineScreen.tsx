import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

interface TimelineEntry {
  id: string;
  area: string;
  areaIcon: string;
  date: string;
  serviceType: string;
  beforeUri: string;
  afterUri: string;
  proName: string;
}

const MOCK_TIMELINE: TimelineEntry[] = [
  { id: '1', area: 'Yard', areaIcon: '🌿', date: 'Feb 8, 2026', serviceType: 'Lawn Care', beforeUri: '', afterUri: '', proName: 'Mike T.' },
  { id: '2', area: 'Driveway', areaIcon: '🚗', date: 'Jan 22, 2026', serviceType: 'Pressure Washing', beforeUri: '', afterUri: '', proName: 'Carlos R.' },
  { id: '3', area: 'Kitchen', areaIcon: '🍳', date: 'Jan 15, 2026', serviceType: 'Deep Cleaning', beforeUri: '', afterUri: '', proName: 'Maria L.' },
  { id: '4', area: 'Pool', areaIcon: '🏊', date: 'Dec 20, 2025', serviceType: 'Pool Cleaning', beforeUri: '', afterUri: '', proName: 'Dave P.' },
  { id: '5', area: 'Garage', areaIcon: '🏠', date: 'Dec 5, 2025', serviceType: 'Junk Removal', beforeUri: '', afterUri: '', proName: 'Marcus J.' },
  { id: '6', area: 'Yard', areaIcon: '🌿', date: 'Nov 10, 2025', serviceType: 'Landscaping', beforeUri: '', afterUri: '', proName: 'Mike T.' },
];

const AREAS = ['All', 'Yard', 'Driveway', 'Kitchen', 'Pool', 'Garage'];

export default function PhotoTimelineScreen() {
  const [selectedArea, setSelectedArea] = useState('All');
  const [sliderPosition, setSliderPosition] = useState(0.5);
  const filtered = selectedArea === 'All' ? MOCK_TIMELINE : MOCK_TIMELINE.filter(e => e.area === selectedArea);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Home's Journey</Text>
        <Text style={styles.subtitle}>📸 {MOCK_TIMELINE.length} services documented</Text>
      </View>

      <ScrollView horizontal style={styles.areaFilter} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaFilterContent}>
        {AREAS.map(area => (
          <TouchableOpacity key={area} style={[styles.areaBtn, selectedArea === area && styles.areaBtnActive]} onPress={() => setSelectedArea(area)}>
            <Text style={[styles.areaBtnText, selectedArea === area && styles.areaBtnTextActive]}>{area}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.timeline}>
        {filtered.map((entry, index) => (
          <View key={entry.id} style={styles.timelineItem}>
            {/* Timeline line */}
            <View style={styles.timelineLine}>
              <View style={styles.timelineDot} />
              {index < filtered.length - 1 && <View style={styles.timelineConnector} />}
            </View>

            {/* Content */}
            <View style={styles.timelineContent}>
              <View style={styles.dateRow}>
                <Text style={styles.entryDate}>{entry.date}</Text>
                <Text style={styles.entryArea}>{entry.areaIcon} {entry.area}</Text>
              </View>
              <Text style={styles.entryService}>{entry.serviceType}</Text>
              <Text style={styles.entryPro}>by {entry.proName}</Text>

              {/* Before/After slider */}
              <View style={styles.compareCard}>
                <View style={styles.compareHalf}>
                  <View style={[styles.photoPlaceholder, { backgroundColor: '#E5E7EB' }]}>
                    <Text style={styles.photoLabel}>Before</Text>
                    <Text style={styles.photoIcon}>📷</Text>
                  </View>
                </View>
                <View style={styles.compareDivider}>
                  <View style={styles.dividerHandle}>
                    <Text style={styles.dividerArrows}>⇔</Text>
                  </View>
                </View>
                <View style={styles.compareHalf}>
                  <View style={[styles.photoPlaceholder, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={styles.photoLabel}>After</Text>
                    <Text style={styles.photoIcon}>✨</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>📤 Share Timeline</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  areaFilter: { maxHeight: 44, marginBottom: 8 },
  areaFilterContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  areaBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff' },
  areaBtnActive: { backgroundColor: Colors.primary },
  areaBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  areaBtnTextActive: { color: '#fff' },
  timeline: { paddingHorizontal: 16, paddingBottom: 80 },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineLine: { width: 30, alignItems: 'center', paddingTop: 6 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  timelineConnector: { width: 2, flex: 1, backgroundColor: Colors.primaryLight, marginTop: 4 },
  timelineContent: { flex: 1, marginLeft: 12, marginBottom: 16 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryDate: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  entryArea: { fontSize: 12, color: Colors.purple, fontWeight: '600' },
  entryService: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 4 },
  entryPro: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  compareCard: { flexDirection: 'row', marginTop: 10, borderRadius: 12, overflow: 'hidden', height: 100 },
  compareHalf: { flex: 1 },
  photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  photoIcon: { fontSize: 24, marginTop: 4 },
  compareDivider: { width: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  dividerHandle: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  dividerArrows: { color: '#fff', fontSize: 10 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.background },
  shareBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
