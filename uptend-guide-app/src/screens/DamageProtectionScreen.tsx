import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Recording {
  id: string;
  jobId: string;
  time: string;
  duration: string;
  trigger: 'impact' | 'manual' | 'auto';
  gForce?: number;
  size: string;
  uploaded: boolean;
}


export default function DamageProtectionScreen() {
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

  const totalStorage = '59.6 MB';
  const triggerIcon = { impact: '💥', manual: '📹', auto: '🔄' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Damage Protection</Text>
        <Text style={styles.subtitle}>Continuous recording for dispute protection</Text>
      </View>

      {/* Recording status */}
      <View style={[styles.statusCard, isRecording && styles.statusRecording]}>
        <View style={styles.statusLeft}>
          <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
          <View>
            <Text style={[styles.statusTitle, isRecording && { color: '#fff' }]}>{isRecording ? 'Recording Active' : 'Not Recording'}</Text>
            <Text style={[styles.statusSub, isRecording && { color: 'rgba(255,255,255,0.7)' }]}>30-second rolling buffer</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.toggleBtn, isRecording && styles.stopBtn]} onPress={() => setIsRecording(!isRecording)}>
          <Text style={styles.toggleBtnText}>{isRecording ? '⏹ Stop' : '⏺ Start'}</Text>
        </TouchableOpacity>
      </View>

      {/* Storage info */}
      <View style={styles.storageRow}>
        <Text style={styles.storageText}>💾 Storage used: {totalStorage}</Text>
        <TouchableOpacity><Text style={styles.manageText}>Manage</Text></TouchableOpacity>
      </View>

      {/* Recordings list */}
      <FlatList
        data={recordings}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.recCard}>
            <View style={styles.recHeader}>
              <Text style={styles.recTrigger}>{triggerIcon[item.trigger]}</Text>
              <View style={styles.recInfo}>
                <Text style={styles.recTime}>{item.time}</Text>
                <Text style={styles.recMeta}>Job #{item.jobId} • {item.duration} • {item.size}</Text>
                {item.gForce && <Text style={styles.recGForce}>Impact: {item.gForce}g</Text>}
              </View>
              <View style={styles.recActions}>
                {item.uploaded ? (
                  <View style={styles.uploadedBadge}><Text style={styles.uploadedText}>☁️ Uploaded</Text></View>
                ) : (
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => Alert.alert('Uploading...', 'Recording will be uploaded to cloud storage.')}>
                    <Text style={styles.uploadBtnText}>☁️ Upload</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.recPreview}>
              <Text style={styles.previewIcon}>🎬</Text>
              <Text style={styles.previewText}>Tap to preview</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statusCard: { marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 },
  statusRecording: { backgroundColor: Colors.error },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.textLight },
  recordDotActive: { backgroundColor: '#fff' },
  statusTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statusSub: { fontSize: 12, color: Colors.textSecondary },
  toggleBtn: { backgroundColor: Colors.error, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  stopBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  toggleBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  storageRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  storageText: { fontSize: 13, color: Colors.textSecondary },
  manageText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  recCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  recHeader: { flexDirection: 'row', alignItems: 'center' },
  recTrigger: { fontSize: 24, marginRight: 10 },
  recInfo: { flex: 1 },
  recTime: { fontSize: 14, fontWeight: '600', color: Colors.text },
  recMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  recGForce: { fontSize: 12, color: Colors.error, fontWeight: '600', marginTop: 1 },
  recActions: {},
  uploadedBadge: { backgroundColor: '#E8F5E8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  uploadedText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  uploadBtn: { backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  uploadBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  recPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1a1a2e', borderRadius: 8, padding: 10, marginTop: 8 },
  previewIcon: { fontSize: 16 },
  previewText: { color: '#999', fontSize: 12 },
});
