import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

type VerifyState = 'scan' | 'verifying' | 'verified' | 'manual';

const MOCK_PRO = {
  name: 'Marcus Johnson',
  photo: '👨🏾‍🔧',
  rating: 4.9,
  reviews: 127,
  jobTitle: 'Junk Removal — 2 Rooms',
  jobId: 'JOB-4821',
  verified: true,
  badgeExpiry: '2:00 PM Today',
};

export default function VerifyProScreen({ navigation }: any) {
  const [state, setState] = useState<VerifyState>('scan');
  const [manualCode, setManualCode] = useState('');

  const simulateScan = () => {
    setState('verifying');
    setTimeout(() => setState('verified'), 1500);
  };

  if (state === 'verified') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.verifiedContainer}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.verifiedTitle}>Identity Verified</Text>
          <View style={styles.proCard}>
            <Text style={styles.proPhoto}>{MOCK_PRO.photo}</Text>
            <Text style={styles.proName}>{MOCK_PRO.name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>⭐</Text>
              <Text style={styles.ratingText}>{MOCK_PRO.rating} ({MOCK_PRO.reviews} reviews)</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.jobLabel}>{MOCK_PRO.jobTitle}</Text>
            <Text style={styles.jobId}>Job #{MOCK_PRO.jobId}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓ Verified Pro</Text>
              </View>
              <View style={styles.bgCheckBadge}>
                <Text style={styles.bgCheckText}>🛡️ Background Checked</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scanContainer}>
        <Text style={styles.title}>Verify Your Pro</Text>
        <Text style={styles.subtitle}>Scan the QR code shown by your pro</Text>

        {/* QR Scanner area */}
        <View style={styles.scanArea}>
          {state === 'verifying' ? (
            <View style={styles.verifyingOverlay}>
              <Text style={styles.verifyingIcon}>🔄</Text>
              <Text style={styles.verifyingText}>Verifying identity...</Text>
            </View>
          ) : (
            <>
              <View style={styles.qrFrame}>
                <View style={[styles.qrCorner, styles.qrTL]} />
                <View style={[styles.qrCorner, styles.qrTR]} />
                <View style={[styles.qrCorner, styles.qrBL]} />
                <View style={[styles.qrCorner, styles.qrBR]} />
                <Text style={styles.scanIcon}>📱</Text>
              </View>
              <Text style={styles.scanHint}>Position QR code within the frame</Text>
            </>
          )}
        </View>

        {/* Simulate scan */}
        <TouchableOpacity style={styles.simulateBtn} onPress={simulateScan}>
          <Text style={styles.simulateBtnText}>📷 Simulate QR Scan</Text>
        </TouchableOpacity>

        {/* Manual entry fallback */}
        <TouchableOpacity onPress={() => setState('manual')} style={styles.manualLink}>
          <Text style={styles.manualLinkText}>Can't scan? Enter code manually</Text>
        </TouchableOpacity>

        {state === 'manual' && (
          <View style={styles.manualEntry}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter 6-digit code"
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[styles.verifyBtn, manualCode.length < 6 && styles.verifyBtnDisabled]}
              onPress={simulateScan}
              disabled={manualCode.length < 6}
            >
              <Text style={styles.verifyBtnText}>Verify</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NFC stub */}
        <View style={styles.nfcHint}>
          <Text style={styles.nfcIcon}>📡</Text>
          <Text style={styles.nfcText}>NFC tap coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scanContainer: { flex: 1, padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 20 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, marginBottom: 30 },
  scanArea: { width: 250, height: 250, backgroundColor: '#1a1a2e', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  qrFrame: { width: 180, height: 180, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  qrCorner: { position: 'absolute', width: 30, height: 30, borderColor: Colors.primary },
  qrTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  qrTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  qrBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  qrBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanIcon: { fontSize: 48 },
  scanHint: { color: '#999', fontSize: 12, marginTop: 12 },
  verifyingOverlay: { alignItems: 'center' },
  verifyingIcon: { fontSize: 40 },
  verifyingText: { color: '#fff', fontSize: 14, marginTop: 8 },
  simulateBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 16 },
  simulateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  manualLink: { marginBottom: 12 },
  manualLinkText: { color: Colors.primary, fontSize: 14 },
  manualEntry: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  codeInput: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center', borderWidth: 1, borderColor: Colors.border },
  verifyBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#fff', fontWeight: '700' },
  nfcHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, opacity: 0.4 },
  nfcIcon: { fontSize: 16 },
  nfcText: { fontSize: 12, color: Colors.textSecondary },
  verifiedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  checkIcon: { color: '#fff', fontSize: 40, fontWeight: '800' },
  verifiedTitle: { fontSize: 24, fontWeight: '800', color: Colors.success, marginBottom: 24 },
  proCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  proPhoto: { fontSize: 56, marginBottom: 8 },
  proName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingStar: { fontSize: 14 },
  ratingText: { fontSize: 14, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, width: '100%', marginVertical: 16 },
  jobLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  jobId: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  verifiedBadge: { backgroundColor: '#E8F5E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedBadgeText: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  bgCheckBadge: { backgroundColor: '#E8F0FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  bgCheckText: { color: Colors.info, fontSize: 12, fontWeight: '700' },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 60, marginTop: 24 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
