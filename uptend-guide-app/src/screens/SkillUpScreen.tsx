import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface SkillRec {
  id: string;
  name: string;
  icon: string;
  roi: string;
  demand: 'high' | 'medium';
  status: 'recommended' | 'in_progress' | 'completed';
  progress?: number;
  courseUrl?: string;
}

const SKILLS: SkillRec[] = [
  { id: '1', name: 'Pressure Washing Certification', icon: '💦', roi: '+$800/month', demand: 'high', status: 'recommended' },
  { id: '2', name: 'HVAC Basics', icon: '❄️', roi: '+$1,200/month', demand: 'high', status: 'in_progress', progress: 45 },
  { id: '3', name: 'Electrical Safety', icon: '⚡', roi: '+$600/month', demand: 'medium', status: 'recommended' },
  { id: '4', name: 'Pool Maintenance', icon: '🏊', roi: '+$500/month', demand: 'high', status: 'recommended' },
  { id: '5', name: 'CPR & First Aid', icon: '🏥', roi: 'Safety requirement', demand: 'high', status: 'completed' },
  { id: '6', name: 'Pest Control Basics', icon: '🐛', roi: '+$400/month', demand: 'medium', status: 'recommended' },
];

export default function SkillUpScreen() {
  const completed = SKILLS.filter(s => s.status === 'completed');
  const inProgress = SKILLS.filter(s => s.status === 'in_progress');
  const recommended = SKILLS.filter(s => s.status === 'recommended');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🎓 Skill Up</Text>
        <Text style={styles.subtitle}>Grow your skills, grow your earnings</Text>

        {/* Badges */}
        {completed.length > 0 && (
          <View style={styles.badgeRow}>
            {completed.map(s => (
              <View key={s.id} style={styles.badge}>
                <Text style={styles.badgeIcon}>{s.icon}</Text>
                <Text style={styles.badgeLabel}>✓</Text>
              </View>
            ))}
          </View>
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>In Progress</Text>
            {inProgress.map(skill => (
              <View key={skill.id} style={styles.skillCard}>
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${skill.progress ?? 0}%` }]} /></View>
                    <Text style={styles.progressPct}>{skill.progress}%</Text>
                  </View>
                  <Text style={styles.skillRoi}>Estimated ROI: {skill.roi}</Text>
                </View>
                <TouchableOpacity style={styles.continueBtn}><Text style={styles.continueBtnText}>Continue</Text></TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Recommended */}
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <Text style={styles.sectionSub}>Based on local demand & your earnings data</Text>
        {recommended.map(skill => (
          <View key={skill.id} style={styles.skillCard}>
            <Text style={styles.skillIcon}>{skill.icon}</Text>
            <View style={styles.skillInfo}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <View style={styles.metaRow}>
                <View style={[styles.demandBadge, skill.demand === 'high' ? styles.highDemand : styles.medDemand]}>
                  <Text style={styles.demandText}>{skill.demand} demand</Text>
                </View>
                <Text style={styles.skillRoi}>{skill.roi}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.startBtn}><Text style={styles.startBtnText}>Start</Text></TouchableOpacity>
          </View>
        ))}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed ✓</Text>
            {completed.map(skill => (
              <View key={skill.id} style={[styles.skillCard, styles.completedCard]}>
                <Text style={styles.skillIcon}>{skill.icon}</Text>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.completedText}>Certified ✓</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F5E8', justifyContent: 'center', alignItems: 'center' },
  badgeIcon: { fontSize: 20 },
  badgeLabel: { fontSize: 10, color: Colors.success, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  skillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  completedCard: { opacity: 0.7 },
  skillIcon: { fontSize: 28, marginRight: 12 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  skillRoi: { fontSize: 12, color: Colors.success, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  demandBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  highDemand: { backgroundColor: '#FEE2E2' },
  medDemand: { backgroundColor: '#FFF3E8' },
  demandText: { fontSize: 10, fontWeight: '700', color: Colors.error, textTransform: 'uppercase' },
  continueBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  startBtn: { backgroundColor: Colors.purple, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  completedText: { fontSize: 12, color: Colors.success, fontWeight: '600', marginTop: 2 },
});
