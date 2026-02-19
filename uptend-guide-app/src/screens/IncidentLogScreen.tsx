import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Incident {
  id: string;
  timestamp: string;
  gForce: number;
  jobId: string;
  status: 'detected' | 'reviewed' | 'dismissed' | 'escalated';
  notes: string;
  hasPhoto: boolean;
  location: string;
}


const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  detected: { bg: '#FFF3E8', text: Colors.primary },
  reviewed: { bg: '#E8F5E8', text: Colors.success },
  dismissed: { bg: '#F3F4F6', text: Colors.textSecondary },
  escalated: { bg: '#FEE2E2', text: Colors.error },
};

export default function IncidentLogScreen() {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? [] : [].filter(i => i.status === filter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Incident Log</Text>
      <Text style={styles.subtitle}>Accelerometer-detected impacts</Text>

      <View style={styles.filters}>
        {['all', 'detected', 'reviewed', 'escalated', 'dismissed'].map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.gForceCircle}>
                  <Text style={styles.gForceText}>{item.gForce.toFixed(1)}g</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTime}>{item.timestamp}</Text>
                  <Text style={styles.cardJob}>Job #{item.jobId} • {item.location}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                </View>
              </View>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              <View style={styles.cardActions}>
                {item.hasPhoto && <Text style={styles.photoIndicator}>📸 Photo attached</Text>}
                {item.status === 'detected' && (
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📸 Add Photo</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>📝 Add Notes</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.dismissBtn]}><Text style={styles.dismissBtnText}>Dismiss</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, marginTop: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, paddingHorizontal: 20, marginTop: 4 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, marginBottom: 12, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff' },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  gForceCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF3E8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  gForceText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  cardInfo: { flex: 1 },
  cardTime: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardJob: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  notes: { fontSize: 13, color: Colors.text, marginTop: 10, lineHeight: 18, backgroundColor: Colors.background, padding: 10, borderRadius: 8 },
  cardActions: { marginTop: 10 },
  photoIndicator: { fontSize: 12, color: Colors.textSecondary },
  actionBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  dismissBtn: { backgroundColor: '#FEE2E2' },
  dismissBtnText: { fontSize: 12, fontWeight: '600', color: Colors.error },
});
