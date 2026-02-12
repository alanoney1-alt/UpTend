import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Measurement {
  type: string;
  value: number;
  unit: string;
  icon: string;
}

export default function ScopeMeasureScreen({ navigation }: any) {
  const [measuring, setMeasuring] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const simulateMeasure = () => {
    setMeasuring(true);
    setTimeout(() => {
      setMeasurements([
        { type: 'Area', value: 1250, unit: 'sq ft', icon: '📐' },
        { type: 'Volume', value: 8.5, unit: 'cubic yards', icon: '📦' },
        { type: 'Perimeter', value: 142, unit: 'linear feet', icon: '📏' },
      ]);
      setMeasuring(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* Camera view */}
      <View style={styles.cameraArea}>
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraIcon}>📷</Text>
          <Text style={styles.cameraText}>Point camera at the area to measure</Text>
        </View>

        {/* Measurement overlay */}
        {measurements.length > 0 && (
          <View style={styles.measureOverlay}>
            <View style={styles.measureLine1} />
            <View style={styles.measureLine2} />
            <View style={styles.measureLabel1}><Text style={styles.measureLabelText}>35 ft</Text></View>
            <View style={styles.measureLabel2}><Text style={styles.measureLabelText}>35.7 ft</Text></View>
          </View>
        )}

        {/* Scan corners */}
        <View style={styles.corners}>
          <View style={[styles.corner, styles.cTL]} />
          <View style={[styles.corner, styles.cTR]} />
          <View style={[styles.corner, styles.cBL]} />
          <View style={[styles.corner, styles.cBR]} />
        </View>
      </View>

      {/* Results panel */}
      <View style={styles.panel}>
        <View style={styles.panelHandle} />

        {measurements.length === 0 ? (
          <View style={styles.emptyState}>
            <TouchableOpacity style={styles.measureBtn} onPress={simulateMeasure}>
              <Text style={styles.measureBtnText}>{measuring ? '🔄 Measuring...' : '📐 Measure Area'}</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>AI will estimate dimensions from your camera</Text>
          </View>
        ) : (
          <>
            <Text style={styles.panelTitle}>Measurements</Text>
            <View style={styles.measureGrid}>
              {measurements.map((m, i) => (
                <View key={i} style={styles.measureCard}>
                  <Text style={styles.measureIcon}>{m.icon}</Text>
                  <Text style={styles.measureValue}>{m.value}</Text>
                  <Text style={styles.measureUnit}>{m.unit}</Text>
                  <Text style={styles.measureType}>{m.type}</Text>
                </View>
              ))}
            </View>

            {confirmed ? (
              <View style={styles.confirmedBanner}>
                <Text style={styles.confirmedText}>✓ Scope Confirmed & Locked</Text>
              </View>
            ) : (
              <View style={styles.actionBtns}>
                <TouchableOpacity style={styles.remeasureBtn} onPress={simulateMeasure}>
                  <Text style={styles.remeasureBtnText}>Re-measure</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => setConfirmed(true)}>
                  <Text style={styles.confirmBtnText}>✓ Confirm Scope</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.materialsBtn}
              onPress={() => navigation.navigate('MaterialList', { measurements })}
            >
              <Text style={styles.materialsBtnText}>📋 Calculate Materials Needed</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraArea: { flex: 1, backgroundColor: '#1a1a2e', position: 'relative' },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { fontSize: 48 },
  cameraText: { color: '#999', fontSize: 14, marginTop: 8 },
  measureOverlay: { position: 'absolute', top: 60, left: 40, right: 40, bottom: 60 },
  measureLine1: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: Colors.primary, opacity: 0.8 },
  measureLine2: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: Colors.primary, opacity: 0.8 },
  measureLabel1: { position: 'absolute', top: '48%', right: 0, backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  measureLabel2: { position: 'absolute', left: '52%', top: 0, backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  measureLabelText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  corners: { position: 'absolute', top: 40, left: 30, right: 30, bottom: 40 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.primary },
  cTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  cTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  panel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  panelHandle: { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  measureBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  measureBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },
  panelTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  measureGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  measureCard: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, padding: 12, alignItems: 'center' },
  measureIcon: { fontSize: 20 },
  measureValue: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  measureUnit: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  measureType: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  actionBtns: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  remeasureBtn: { flex: 1, borderWidth: 2, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  remeasureBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 2, backgroundColor: Colors.success, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  confirmedBanner: { backgroundColor: '#E8F5E8', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  confirmedText: { color: Colors.success, fontSize: 15, fontWeight: '700' },
  materialsBtn: { backgroundColor: Colors.purple, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  materialsBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
