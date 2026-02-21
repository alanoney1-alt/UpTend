import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchVeteranMentors, fetchActiveMentorships, fetchSpouseProgram, requestMentor } from '../services/api';
import ApiStateWrapper from '../components/ApiStateWrapper';

export default function VeteranMentorScreen() {
  const [activeTab, setActiveTab] = useState<'find' | 'active' | 'spouse'>('find');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [spouses, setSpouses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [mRes, aRes, sRes] = await Promise.allSettled([fetchVeteranMentors(), fetchActiveMentorships(), fetchSpouseProgram()]);
      const mData = mRes.status === 'fulfilled' ? mRes.value : {};
      setMentors(mData?.mentors || mData || []);
      setStats(mData?.stats || {});
      setActive(aRes.status === 'fulfilled' ? (aRes.value?.mentorships || aRes.value || []) : []);
      setSpouses(sRes.status === 'fulfilled' ? (sRes.value?.participants || sRes.value || []) : []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRequestMentor = async (id: string) => {
    try { await requestMentor(id); load(); } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ApiStateWrapper loading={loading} error={error} onRetry={load}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.title}>Veteran Network</Text>
            <Text style={styles.subtitle}>Mentor matching & military spouse program</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.purple }]}>
              <Text style={[styles.statValue, { color: Colors.white }]}>{stats.totalMentors || mentors.length}</Text>
              <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>Veteran Mentors</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
              <Text style={styles.statValue}>{stats.activePairs || active.length}</Text>
              <Text style={styles.statLabel}>Active Pairs</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.statValue}>{stats.milSpouses || spouses.length}</Text>
              <Text style={styles.statLabel}>Mil Spouses</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {([['find', '🤝 Find Mentor'], ['active', '📊 Active'], ['spouse', '💜 Spouse Program']] as const).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, activeTab === key && styles.activeTab]} onPress={() => setActiveTab(key as any)}>
                <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'find' && (mentors.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No mentors available</Text></View>
          ) : mentors.map((m: any) => (
            <View key={m.id || m._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={{ fontSize: 24 }}>{m.avatar || '🎖️'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{m.name}</Text>
                  <Text style={styles.cardSubtitle}>{m.branch} • {m.years} years • {m.mos}</Text>
                </View>
                <View style={[styles.badge, m.status === 'Available' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.badgeText, m.status === 'Available' ? { color: '#059669' } : { color: '#D97706' }]}>{m.status}</Text>
                </View>
              </View>
              <View style={styles.tradesRow}>
                {(m.trades || []).map((t: string, i: number) => (
                  <View key={i} style={styles.tradeBadge}><Text style={styles.tradeBadgeText}>{t}</Text></View>
                ))}
              </View>
              <View style={styles.mentorStats}>
                <Text style={styles.mentorStat}>⭐ {m.rating || '—'}</Text>
                <Text style={styles.mentorStat}>👥 {m.mentees || 0} mentees</Text>
              </View>
              {m.status === 'Available' && (
                <TouchableOpacity style={styles.connectBtn} onPress={() => handleRequestMentor(m.id || m._id)}><Text style={styles.connectBtnText}>Request Mentor</Text></TouchableOpacity>
              )}
            </View>
          )))}

          {activeTab === 'active' && (active.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyText}>No active mentorships</Text></View>
          ) : active.map((a: any) => (
            <View key={a.id || a._id} style={styles.card}>
              <Text style={styles.cardTitle}>{a.mentor} → {a.mentee}</Text>
              <Text style={styles.cardSubtitle}>Started: {a.started} • {a.meetings} meetings</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${a.progress || 0}%` }]} /></View>
                <Text style={styles.progressText}>{a.progress || 0}%</Text>
              </View>
              <View style={[styles.cardRow, { marginTop: 10 }]}>
                <Text style={styles.cardDetail}>Next: {a.nextMeeting}</Text>
                <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>View</Text></TouchableOpacity>
              </View>
            </View>
          )))}

          {activeTab === 'spouse' && (
            <>
              <View style={styles.spouseHero}>
                <Text style={{ fontSize: 28 }}>💜</Text>
                <Text style={styles.spouseHeroTitle}>Military Spouse Program</Text>
                <Text style={styles.spouseHeroText}>Flexible remote & local roles supporting home services operations — perfect for PCS-friendly careers.</Text>
              </View>
              {spouses.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No spouse program participants yet</Text></View>
              ) : spouses.map((s: any) => (
                <View key={s.id || s._id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: '#E9D5FF' }]}><Text style={{ fontSize: 18 }}>💜</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{s.name}</Text>
                      <Text style={styles.cardSubtitle}>{s.sponsorBranch} spouse • {s.base}</Text>
                    </View>
                  </View>
                  <View style={styles.tradesRow}>
                    {(s.skills || []).map((sk: string, i: number) => (
                      <View key={i} style={styles.tradeBadge}><Text style={styles.tradeBadgeText}>{sk}</Text></View>
                    ))}
                  </View>
                  <Text style={[styles.cardDetail, { marginTop: 6 }]}>Available for: {s.available}</Text>
                </View>
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
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center' },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  activeTabText: { color: Colors.white },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDetail: { fontSize: 13, color: Colors.textSecondary },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  tradesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tradeBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tradeBadgeText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  mentorStats: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  mentorStat: { fontSize: 13, color: Colors.textSecondary },
  connectBtn: { backgroundColor: Colors.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  connectBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  progressBar: { flex: 1, height: 8, backgroundColor: Colors.borderLight, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: Colors.primary, borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  smallBtn: { backgroundColor: Colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  spouseHero: { backgroundColor: '#E9D5FF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  spouseHeroTitle: { fontSize: 18, fontWeight: '700', color: Colors.purple, marginTop: 8 },
  spouseHeroText: { fontSize: 13, color: '#6B21A8', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
