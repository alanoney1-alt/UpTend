import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchVeteranOnboarding, fetchMOSMappings, fetchVeteranBenefits } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

const STEP_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'complete': { bg: '#D1FAE5', color: '#059669', border: '#059669' },
  'current': { bg: '#FEF3C7', color: '#D97706', border: Colors.primary },
  'upcoming': { bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' },
};

const ACCOMMODATIONS = [
  { emoji: '🦿', title: 'Mobility Accommodations', description: 'Job matching considers physical requirements; adaptive equipment support available' },
  { emoji: '🧠', title: 'PTSD / TBI Support', description: 'Flexible scheduling, low-stimulus job matching, buddy system pairing' },
  { emoji: '👂', title: 'Hearing Accommodations', description: 'Visual notification system, text-based communication preferences' },
  { emoji: '👁️', title: 'Vision Accommodations', description: 'High-contrast app mode, voice-guided navigation, screen reader optimized' },
];

export default function VeteranOnboardingScreen() {
  const [activeSection, setActiveSection] = useState<'flow' | 'mos' | 'benefits' | 'accommodations'>('flow');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [mosMappings, setMosMappings] = useState<any[]>([]);
  const [benefits, setBenefits] = useState<any[]>([]);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [oRes, mRes, bRes] = await Promise.allSettled([fetchVeteranOnboarding(), fetchMOSMappings(), fetchVeteranBenefits()]);
      setSteps(oRes.status === 'fulfilled' ? (oRes.value?.steps || oRes.value || []) : []);
      setMosMappings(mRes.status === 'fulfilled' ? (mRes.value?.mappings || mRes.value || []) : []);
      setBenefits(bRes.status === 'fulfilled' ? (bRes.value?.benefits || bRes.value || []) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={styles.heroEmoji}>🎖️</Text>
            <Text style={styles.heroTitle}>Welcome Home, Veteran</Text>
            <Text style={styles.heroSubtitle}>Your military skills translate directly to high-paying trades. Let's get you started.</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={styles.tabs}>
              {([['flow', '🚀 Onboarding'], ['mos', '🔧 MOS Match'], ['benefits', '💰 Benefits'], ['accommodations', '♿ Accommodations']] as const).map(([key, label]) => (
                <TouchableOpacity key={key} style={[styles.tab, activeSection === key && styles.activeTab]} onPress={() => setActiveSection(key as any)}>
                  <Text style={[styles.tabText, activeSection === key && styles.activeTabText]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {activeSection === 'flow' && (
            <>
              {steps.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No onboarding steps available</Text></View>
              ) : steps.map((s: any) => {
                const st = STEP_STYLES[s.status] || STEP_STYLES['upcoming'];
                return (
                  <View key={s.step} style={[styles.stepCard, { borderLeftColor: st.border }]}>
                    <View style={[styles.stepDot, { backgroundColor: st.bg }]}>
                      <Text style={{ fontSize: 20 }}>{s.status === 'complete' ? '✅' : s.emoji || '📋'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stepTitle, s.status === 'upcoming' && { color: Colors.textLight }]}>Step {s.step}: {s.title}</Text>
                      <Text style={styles.stepDesc}>{s.description}</Text>
                    </View>
                    {s.status === 'current' && (
                      <TouchableOpacity style={styles.continueBtn}><Text style={styles.continueBtnText}>Continue</Text></TouchableOpacity>
                    )}
                  </View>
                );
              })}
              <View style={styles.uploadCard}>
                <Text style={styles.uploadTitle}>📋 DD-214 Upload</Text>
                <Text style={styles.uploadSubtitle}>Securely verify your service record</Text>
                <TouchableOpacity style={styles.uploadBtn}><Text style={styles.uploadBtnText}>📤 Upload DD-214</Text></TouchableOpacity>
                <Text style={styles.uploadNote}>🔒 Encrypted & stored securely. Only used for verification.</Text>
              </View>
            </>
          )}

          {activeSection === 'mos' && (
            <>
              <Text style={styles.sectionTitle}>Your MOS → Trade Matches</Text>
              {mosMappings.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No MOS mappings available</Text></View>
              ) : mosMappings.map((m: any, i: number) => (
                <View key={i} style={styles.mosCard}>
                  <View style={styles.mosHeader}>
                    <View style={styles.mosBadge}><Text style={styles.mosBadgeText}>{m.mos}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mosTitle}>{m.mosTitle}</Text>
                      <Text style={styles.mosMatch}>{m.match}% match</Text>
                    </View>
                  </View>
                  <View style={styles.tradesRow}>
                    {(m.trades || []).map((t: string, j: number) => (
                      <View key={j} style={styles.tradeBadge}><Text style={styles.tradeBadgeText}>{t}</Text></View>
                    ))}
                  </View>
                  <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${m.match || 0}%` }]} /></View>
                </View>
              ))}
            </>
          )}

          {activeSection === 'benefits' && (
            <>
              <Text style={styles.sectionTitle}>Your Benefits</Text>
              {benefits.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No benefits info available</Text></View>
              ) : benefits.map((b: any, i: number) => (
                <TouchableOpacity key={i} style={styles.benefitCard}>
                  <Text style={{ fontSize: 28 }}>{b.emoji || '💼'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{b.title}</Text>
                    <Text style={styles.cardSubtitle}>{b.description}</Text>
                  </View>
                  <Text style={{ fontSize: 18, color: Colors.textLight }}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeSection === 'accommodations' && (
            <>
              <Text style={styles.sectionTitle}>Disability Accommodations</Text>
              <Text style={styles.sectionSubtitle}>UpTend supports veterans with service-connected disabilities. Select any that apply:</Text>
              {ACCOMMODATIONS.map((a, i) => (
                <TouchableOpacity key={i} style={styles.accomCard}>
                  <Text style={{ fontSize: 28 }}>{a.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{a.title}</Text>
                    <Text style={styles.cardSubtitle}>{a.description}</Text>
                  </View>
                  <View style={styles.checkbox}><Text style={{ color: Colors.white, fontSize: 12 }}>✓</Text></View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </ApiStateWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: Colors.purple, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.white },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stepDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  stepDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  continueBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  continueBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  uploadCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginTop: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  uploadSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  uploadBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginTop: 16, width: '100%', alignItems: 'center' },
  uploadBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  uploadNote: { fontSize: 11, color: Colors.textLight, marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16 },
  mosCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  mosHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  mosBadge: { backgroundColor: Colors.purple, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  mosBadgeText: { color: Colors.white, fontSize: 14, fontWeight: '800' },
  mosTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  mosMatch: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  tradesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tradeBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tradeBadgeText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  progressBar: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  accomCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
