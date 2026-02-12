import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

type SOSState = 'idle' | 'countdown' | 'dispatched';

export default function EmergencyScreen({ navigation }: any) {
  const [state, setState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState(5);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); setState('dispatched'); return 0; }
          return prev - 1;
        });
      }, 1000);
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])).start();
      return () => clearInterval(timer);
    }
  }, [state]);

  const triggerSOS = () => { setState('countdown'); setCountdown(5); };
  const cancelSOS = () => { setState('idle'); setCountdown(5); pulseAnim.setValue(1); };

  if (state === 'dispatched') {
    return (
      <View style={styles.dispatchedContainer}>
        <Text style={styles.dispatchedIcon}>🚨</Text>
        <Text style={styles.dispatchedTitle}>Help is on the way</Text>
        <Text style={styles.dispatchedSub}>UpTend dispatch has been alerted{'\n'}Your GPS location is being shared</Text>
        <View style={styles.dispatchedActions}>
          <TouchableOpacity style={styles.call911Btn}><Text style={styles.call911Text}>📞 Call 911</Text></TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelSOS}><Text style={styles.cancelBtnText}>Cancel Alert</Text></TouchableOpacity>
        </View>
        <View style={styles.contactsList}>
          <Text style={styles.contactsTitle}>Notified:</Text>
          <Text style={styles.contactItem}>✓ UpTend Dispatch</Text>
          <Text style={styles.contactItem}>✓ Emergency Contact: Mom (407-555-0001)</Text>
          <Text style={styles.contactItem}>✓ GPS Location Shared</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency SOS</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {state === 'idle' ? (
          <>
            <Text style={styles.instruction}>Press and hold for emergency</Text>
            <TouchableOpacity onLongPress={triggerSOS} delayLongPress={500} activeOpacity={0.8}>
              <View style={styles.sosButton}>
                <Text style={styles.sosIcon}>🆘</Text>
                <Text style={styles.sosText}>SOS</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>Hold for 1 second to activate</Text>
            <View style={styles.triggerInfo}>
              <Text style={styles.triggerTitle}>Other ways to trigger:</Text>
              <Text style={styles.triggerItem}>📳 Shake phone 3 times quickly</Text>
              <Text style={styles.triggerItem}>🎙️ Say "Guide, emergency"</Text>
              <Text style={styles.triggerItem}>🔴 Press this SOS button</Text>
            </View>
          </>
        ) : (
          <>
            <Animated.View style={[styles.countdownCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.countdownNum}>{countdown}</Text>
            </Animated.View>
            <Text style={styles.countdownLabel}>Sending alert in {countdown}s...</Text>
            <TouchableOpacity style={styles.cancelSosBtn} onPress={cancelSOS}>
              <Text style={styles.cancelSosBtnText}>✕ Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Emergency contacts */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Emergency Contacts</Text>
        <View style={styles.contactRow}><Text style={styles.contactName}>Mom</Text><Text style={styles.contactPhone}>(407) 555-0001</Text></View>
        <View style={styles.contactRow}><Text style={styles.contactName}>Partner</Text><Text style={styles.contactPhone}>(407) 555-0002</Text></View>
        <TouchableOpacity><Text style={styles.editContacts}>Edit Contacts</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  backBtn: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  instruction: { color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 30 },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.error, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  sosIcon: { fontSize: 40 },
  sosText: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },
  hint: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16 },
  triggerInfo: { marginTop: 40, alignItems: 'center' },
  triggerTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  triggerItem: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 4 },
  countdownCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center' },
  countdownNum: { color: '#fff', fontSize: 56, fontWeight: '900' },
  countdownLabel: { color: '#fff', fontSize: 18, marginTop: 20 },
  cancelSosBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 24 },
  cancelSosBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dispatchedContainer: { flex: 1, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dispatchedIcon: { fontSize: 60 },
  dispatchedTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 16 },
  dispatchedSub: { color: 'rgba(255,255,255,0.8)', fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 24 },
  dispatchedActions: { gap: 12, marginTop: 24, width: '100%' },
  call911Btn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  call911Text: { color: Colors.error, fontSize: 18, fontWeight: '800' },
  cancelBtn: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontSize: 14 },
  contactsList: { marginTop: 30, alignItems: 'center' },
  contactsTitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 },
  contactItem: { color: '#fff', fontSize: 14, marginBottom: 4 },
  footer: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 20, paddingBottom: 40 },
  footerTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  contactName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  contactPhone: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  editContacts: { color: Colors.primaryLight, fontSize: 13, marginTop: 8 },
});
