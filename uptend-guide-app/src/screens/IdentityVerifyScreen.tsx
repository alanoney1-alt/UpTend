import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

type VerifyStep = 'intro' | 'selfie' | 'comparing' | 'result';

export default function IdentityVerifyScreen({ navigation }: any) {
  const [step, setStep] = useState<VerifyStep>('intro');
  const [matchPct, setMatchPct] = useState(0);

  const takeSelfie = () => {
    setStep('selfie');
    setTimeout(() => {
      setStep('comparing');
      setTimeout(() => { setMatchPct(97); setStep('result'); }, 2000);
    }, 1500);
  };

  if (step === 'result') {
    const verified = matchPct >= 80;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: verified ? '#E8F5E8' : '#FEE2E2' }]}>
        <View style={styles.resultContent}>
          <View style={[styles.resultCircle, { backgroundColor: verified ? Colors.success : Colors.error }]}>
            <Text style={styles.resultIcon}>{verified ? '✓' : '✗'}</Text>
          </View>
          <Text style={styles.resultTitle}>{verified ? 'Identity Verified' : 'Verification Failed'}</Text>
          <Text style={styles.matchText}>{matchPct}% match</Text>
          <View style={styles.comparisonCard}>
            <View style={styles.photoBox}><Text style={styles.photoEmoji}>🤳</Text><Text style={styles.photoLabel}>Selfie</Text></View>
            <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>
            <View style={styles.photoBox}><Text style={styles.photoEmoji}>👤</Text><Text style={styles.photoLabel}>Profile</Text></View>
          </View>
          {verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ Verified Pro Badge Earned</Text>
            </View>
          )}
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {step === 'intro' && (
          <>
            <Text style={styles.title}>🪪 Identity Verification</Text>
            <Text style={styles.subtitle}>Verify your identity for first-time customers</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoItem}>📸 Take a selfie</Text>
              <Text style={styles.infoItem}>🤖 AI compares to your profile photo</Text>
              <Text style={styles.infoItem}>✅ Customer sees verified badge</Text>
              <Text style={styles.infoItem}>🔒 Photos are not stored</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={takeSelfie}>
              <Text style={styles.startBtnText}>📸 Take Selfie to Verify</Text>
            </TouchableOpacity>
          </>
        )}
        {step === 'selfie' && (
          <View style={styles.cameraView}>
            <View style={styles.selfieFrame}>
              <Text style={styles.selfieIcon}>🤳</Text>
              <Text style={styles.selfieText}>Position your face in the circle</Text>
            </View>
          </View>
        )}
        {step === 'comparing' && (
          <View style={styles.comparingView}>
            <Text style={styles.comparingIcon}>🔄</Text>
            <Text style={styles.comparingText}>Comparing faces...</Text>
            <View style={styles.comparisonCard}>
              <View style={styles.photoBox}><Text style={styles.photoEmoji}>🤳</Text></View>
              <Text style={styles.arrowText}>→</Text>
              <View style={styles.photoBox}><Text style={styles.photoEmoji}>👤</Text></View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', marginBottom: 30 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, width: '100%', gap: 12, marginBottom: 30 },
  infoItem: { fontSize: 15, color: Colors.text },
  startBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cameraView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selfieFrame: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  selfieIcon: { fontSize: 60 },
  selfieText: { color: '#999', fontSize: 12, marginTop: 8, textAlign: 'center' },
  comparingView: { alignItems: 'center' },
  comparingIcon: { fontSize: 40 },
  comparingText: { fontSize: 16, color: Colors.text, marginTop: 12, marginBottom: 20 },
  comparisonCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  photoEmoji: { fontSize: 32 },
  photoLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  arrowText: { fontSize: 24, color: Colors.textSecondary },
  vsCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.purple, justifyContent: 'center', alignItems: 'center' },
  vsText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  resultContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  resultIcon: { color: '#fff', fontSize: 40, fontWeight: '800' },
  resultTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 16 },
  matchText: { fontSize: 16, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  verifiedBadge: { backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, marginTop: 16 },
  verifiedBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 60, marginTop: 24 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
