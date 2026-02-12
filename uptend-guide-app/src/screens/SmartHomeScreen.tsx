import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface SmartDevice {
  id: string;
  name: string;
  type: 'doorbell' | 'lock' | 'camera' | 'thermostat';
  provider: string;
  icon: string;
  status: string;
  connected: boolean;
  autoAction: boolean;
}

const MOCK_DEVICES: SmartDevice[] = [
  { id: 'd1', name: 'Front Door Camera', type: 'doorbell', provider: 'Ring', icon: '🔔', status: 'Online', connected: true, autoAction: true },
  { id: 'd2', name: 'Smart Lock', type: 'lock', provider: 'August', icon: '🔒', status: 'Locked', connected: true, autoAction: true },
  { id: 'd3', name: 'Backyard Camera', type: 'camera', provider: 'Nest', icon: '📹', status: 'Recording', connected: true, autoAction: false },
  { id: 'd4', name: 'Thermostat', type: 'thermostat', provider: 'Nest', icon: '🌡️', status: '72°F', connected: true, autoAction: false },
  { id: 'd5', name: 'Garage Camera', type: 'camera', provider: 'Ring', icon: '📹', status: 'Offline', connected: false, autoAction: false },
];

export default function SmartHomeScreen() {
  const [devices, setDevices] = useState(MOCK_DEVICES);

  const toggleAutoAction = (deviceId: string) => {
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, autoAction: !d.autoAction } : d));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Smart Home</Text>
        <Text style={styles.subtitle}>Manage connected devices & auto-actions</Text>

        {/* Auto-Action Flow */}
        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>🏠 Pro Arrival Flow</Text>
          <View style={styles.flowSteps}>
            {['Pro GPS detected nearby', 'Smart lock auto-unlocks', 'Camera starts recording', 'You get notified'].map((step, i) => (
              <View key={i} style={styles.flowStep}>
                <View style={[styles.flowDot, i === 0 && { backgroundColor: Colors.success }]} />
                <Text style={styles.flowText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Devices */}
        <Text style={styles.sectionTitle}>Connected Devices</Text>
        {devices.map(device => (
          <View key={device.id} style={[styles.deviceCard, !device.connected && styles.deviceOffline]}>
            <Text style={styles.deviceIcon}>{device.icon}</Text>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text style={styles.deviceMeta}>{device.provider} • {device.status}</Text>
            </View>
            <View style={styles.deviceActions}>
              {device.connected ? (
                <>
                  <Text style={styles.autoLabel}>Auto</Text>
                  <Switch
                    value={device.autoAction}
                    onValueChange={() => toggleAutoAction(device.id)}
                    trackColor={{ false: '#ddd', true: Colors.primaryLight }}
                    thumbColor={device.autoAction ? Colors.primary : '#f4f3f4'}
                  />
                </>
              ) : (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* Add Device */}
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Connect New Device</Text>
        </TouchableOpacity>

        {/* Camera Feeds */}
        <Text style={styles.sectionTitle}>Live Feeds</Text>
        {devices.filter(d => (d.type === 'camera' || d.type === 'doorbell') && d.connected).map(d => (
          <View key={d.id} style={styles.feedCard}>
            <View style={styles.feedPreview}>
              <Text style={styles.feedIcon}>📹</Text>
              <Text style={styles.feedLabel}>{d.name}</Text>
            </View>
            <View style={styles.feedLive}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  flowCard: { backgroundColor: '#F0E6FF', borderRadius: 16, padding: 16, marginBottom: 24 },
  flowTitle: { fontSize: 16, fontWeight: '700', color: Colors.purple, marginBottom: 12 },
  flowSteps: { gap: 8 },
  flowStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flowDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.purple },
  flowText: { fontSize: 14, color: Colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  deviceOffline: { opacity: 0.5 },
  deviceIcon: { fontSize: 28, marginRight: 12 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  deviceMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deviceActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  autoLabel: { fontSize: 11, color: Colors.textSecondary },
  offlineBadge: { backgroundColor: '#fee', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  offlineText: { fontSize: 11, color: Colors.error, fontWeight: '600' },
  addBtn: { borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  addBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  feedCard: { backgroundColor: '#1a1a2e', borderRadius: 12, height: 140, marginBottom: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  feedPreview: { alignItems: 'center' },
  feedIcon: { fontSize: 32 },
  feedLabel: { color: '#fff', fontSize: 13, marginTop: 6 },
  feedLive: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
