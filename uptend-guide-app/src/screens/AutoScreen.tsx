import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const VEHICLES = [
  {
    id: '1', year: '2021', make: 'Toyota', model: 'Camry', vin: '1HGBH41...XMN',
    mileage: '34,200', nextService: 'Oil Change', nextServiceDate: 'Mar 15, 2026',
    healthScore: 92,
  },
  {
    id: '2', year: '2019', make: 'Honda', model: 'CR-V', vin: '5J6RW2H...ABC',
    mileage: '58,700', nextService: 'Tire Rotation', nextServiceDate: 'Feb 28, 2026',
    healthScore: 78,
  },
];

const MAINTENANCE = [
  { id: '1', task: 'Oil Change', due: 'Mar 15', icon: '🛢️', status: 'upcoming' },
  { id: '2', task: 'Tire Rotation', due: 'Feb 28', icon: '🔄', status: 'overdue' },
  { id: '3', task: 'Brake Inspection', due: 'Apr 20', icon: '🛑', status: 'upcoming' },
  { id: '4', task: 'Air Filter', due: 'May 10', icon: '🌬️', status: 'upcoming' },
];

export default function AutoScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance' | 'diagnostics'>('vehicles');
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Auto Care</Text>
        <Text style={styles.headerSub}>Manage vehicles & maintenance</Text>
      </View>

      <View style={styles.tabRow}>
        {(['vehicles', 'maintenance', 'diagnostics'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'vehicles' ? '🚗 Vehicles' : tab === 'maintenance' ? '🔧 Schedule' : '📊 Diagnostics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'vehicles' && (
          <>
            {VEHICLES.map(v => (
              <View key={v.id} style={styles.vehicleCard}>
                <View style={styles.vehicleTop}>
                  <View style={styles.vehicleIcon}>
                    <Text style={{ fontSize: 28 }}>🚗</Text>
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{v.year} {v.make} {v.model}</Text>
                    <Text style={styles.vehicleVin}>VIN: {v.vin}</Text>
                    <Text style={styles.vehicleMileage}>{v.mileage} miles</Text>
                  </View>
                  <View style={styles.healthCircle}>
                    <Text style={styles.healthScore}>{v.healthScore}</Text>
                    <Text style={styles.healthLabel}>Health</Text>
                  </View>
                </View>
                <View style={styles.vehicleBottom}>
                  <Text style={styles.nextServiceLabel}>Next: {v.nextService}</Text>
                  <Text style={styles.nextServiceDate}>{v.nextServiceDate}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addVehicleBtn} onPress={() => setShowAddForm(!showAddForm)}>
              <Text style={styles.addVehicleIcon}>＋</Text>
              <Text style={styles.addVehicleText}>Add Vehicle</Text>
            </TouchableOpacity>

            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.addFormTitle}>Add New Vehicle</Text>
                <TouchableOpacity style={styles.vinScanBtn}>
                  <Text style={styles.vinScanIcon}>📷</Text>
                  <Text style={styles.vinScanText}>Scan VIN Barcode</Text>
                </TouchableOpacity>
                <Text style={styles.orText}>— or enter manually —</Text>
                <TextInput style={styles.input} placeholder="Year" placeholderTextColor="#9ca3af" />
                <TextInput style={styles.input} placeholder="Make" placeholderTextColor="#9ca3af" />
                <TextInput style={styles.input} placeholder="Model" placeholderTextColor="#9ca3af" />
                <TextInput style={styles.input} placeholder="VIN (optional)" placeholderTextColor="#9ca3af" />
                <TouchableOpacity style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>Save Vehicle</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            {MAINTENANCE.map(m => (
              <View key={m.id} style={[styles.maintCard, m.status === 'overdue' && styles.maintCardOverdue]}>
                <Text style={styles.maintIcon}>{m.icon}</Text>
                <View style={styles.maintInfo}>
                  <Text style={styles.maintTask}>{m.task}</Text>
                  <Text style={[styles.maintDue, m.status === 'overdue' && styles.maintDueOverdue]}>
                    {m.status === 'overdue' ? '⚠️ Overdue — ' : ''}Due {m.due}
                  </Text>
                </View>
                <TouchableOpacity style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {activeTab === 'diagnostics' && (
          <>
            <View style={styles.diagCard}>
              <Text style={styles.diagIcon}>🔌</Text>
              <Text style={styles.diagTitle}>OBD-II Scanner</Text>
              <Text style={styles.diagSub}>Connect a Bluetooth OBD-II scanner to read your car's diagnostics</Text>
              <TouchableOpacity style={styles.connectBtn}>
                <Text style={styles.connectBtnText}>Connect Scanner</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.diagCard}>
              <Text style={styles.diagIcon}>💬</Text>
              <Text style={styles.diagTitle}>Describe a Problem</Text>
              <Text style={styles.diagSub}>Tell George about a weird noise, light, or symptom and get instant guidance</Text>
              <TouchableOpacity style={styles.connectBtn} onPress={() => navigation?.navigate?.('Home')}>
                <Text style={styles.connectBtnText}>Ask Mr. George</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Common Codes</Text>
            {[
              { code: 'P0300', desc: 'Random/Multiple Cylinder Misfire', severity: 'High' },
              { code: 'P0420', desc: 'Catalyst System Efficiency Below Threshold', severity: 'Medium' },
              { code: 'P0171', desc: 'System Too Lean (Bank 1)', severity: 'Medium' },
            ].map(c => (
              <View key={c.code} style={styles.codeCard}>
                <Text style={styles.codeLabel}>{c.code}</Text>
                <View style={styles.codeInfo}>
                  <Text style={styles.codeDesc}>{c.desc}</Text>
                  <Text style={[styles.codeSeverity, c.severity === 'High' ? { color: '#ef4444' } : { color: '#f59e0b' }]}>
                    {c.severity} severity
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    backgroundColor: '#f97316', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  tabRow: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
    paddingTop: 12, gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  tabActive: { backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#f97316' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f97316' },
  scroll: { padding: 20, paddingBottom: 40 },
  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  vehicleTop: { flexDirection: 'row', alignItems: 'center' },
  vehicleIcon: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#f9fafb',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  vehicleVin: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  vehicleMileage: { fontSize: 13, color: '#64748b', marginTop: 2 },
  healthCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#dcfce7',
    justifyContent: 'center', alignItems: 'center',
  },
  healthScore: { fontSize: 18, fontWeight: '800', color: '#22c55e' },
  healthLabel: { fontSize: 9, color: '#16a34a' },
  vehicleBottom: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 14,
    paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  nextServiceLabel: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  nextServiceDate: { fontSize: 13, color: '#f97316', fontWeight: '600' },
  addVehicleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed',
    borderRadius: 16, padding: 18, gap: 8,
  },
  addVehicleIcon: { fontSize: 20, color: '#f97316', fontWeight: '700' },
  addVehicleText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  addForm: {
    backgroundColor: '#f9fafb', borderRadius: 16, padding: 20, marginTop: 16,
  },
  addFormTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  vinScanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16, gap: 10,
  },
  vinScanIcon: { fontSize: 20 },
  vinScanText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  orText: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginVertical: 14 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', color: '#1e293b',
  },
  saveBtn: {
    backgroundColor: '#f97316', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  maintCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  maintCardOverdue: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  maintIcon: { fontSize: 28, marginRight: 14 },
  maintInfo: { flex: 1 },
  maintTask: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  maintDue: { fontSize: 13, color: '#64748b', marginTop: 2 },
  maintDueOverdue: { color: '#ef4444', fontWeight: '600' },
  bookBtn: {
    backgroundColor: '#f97316', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
  },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  diagCard: {
    backgroundColor: '#f9fafb', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  diagIcon: { fontSize: 36, marginBottom: 10 },
  diagTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  diagSub: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  connectBtn: {
    backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
    marginTop: 14,
  },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12, marginTop: 8 },
  codeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6',
  },
  codeLabel: {
    fontSize: 14, fontWeight: '800', color: '#1e293b', backgroundColor: '#f3f4f6',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 14,
    overflow: 'hidden',
  },
  codeInfo: { flex: 1 },
  codeDesc: { fontSize: 13, color: '#1e293b' },
  codeSeverity: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
