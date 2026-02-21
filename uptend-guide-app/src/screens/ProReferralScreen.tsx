import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { LoadingScreen, EmptyState } from '../components/ui';
import { fetchReferrals } from '../services/api';

interface Referral {
  id: string;
  name: string;
  status: 'pending' | 'signed_up' | 'first_job_completed';
  invitedDate: string;
  earnedBonus: boolean;
}


const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Invite Sent', color: Colors.textSecondary, bg: '#F3F4F6' },
  signed_up: { label: 'Signed Up', color: Colors.info, bg: '#E8F0FF' },
  first_job_completed: { label: '1st Job ✓', color: Colors.success, bg: '#E8F5E8' },
};

export default function ProReferralScreen() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchReferrals();
      const list: Referral[] = (res?.referrals || res || []).map((r: any) => ({
        id: r.id || r._id || '',
        name: r.name || r.refereeName || 'Unknown',
        status: r.status || 'pending',
        invitedDate: r.invitedDate || r.created_at || '',
        earnedBonus: r.earnedBonus || r.status === 'first_job_completed',
      }));
      setReferrals(list);
    } catch { setReferrals([]); }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const referralCode = 'UPTEND-MJ2026';
  const totalEarned = referrals.filter(r => r.earnedBonus).length * 50;

  const shareReferral = async () => {
    try {
      await Share.share({
        message: `Join UpTend and start earning as a home services pro! Use my referral code: ${referralCode}\nhttps://uptend.com/join?ref=${referralCode}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🤝 Pro Referrals</Text>
        <Text style={styles.subtitle}>Earn $50 for each pro who completes their first job</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{referrals.length}</Text><Text style={styles.statLabel}>Invited</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{referrals.filter(r => r.status !== 'pending').length}</Text><Text style={styles.statLabel}>Signed Up</Text></View>
        <View style={[styles.stat, styles.earnedStat]}><Text style={styles.earnedNum}>${totalEarned}</Text><Text style={styles.statLabel}>Earned</Text></View>
      </View>

      {/* Referral code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <Text style={styles.codeText}>{referralCode}</Text>
        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={shareReferral}>
            <Text style={styles.shareBtnText}>📤 Share Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smsBtn} onPress={shareReferral}>
            <Text style={styles.smsBtnText}>💬 SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.waBtn} onPress={shareReferral}>
            <Text style={styles.waBtnText}>📱 WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Referral list */}
      <Text style={styles.sectionTitle}>Your Referrals</Text>
      <FlatList
        data={referrals}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardAvatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDate}>Invited {item.invitedDate}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
              </View>
              {item.earnedBonus && <Text style={styles.bonus}>💰 +$50</Text>}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center' },
  earnedStat: { backgroundColor: '#E8F5E8' },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  earnedNum: { fontSize: 20, fontWeight: '800', color: Colors.success },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  codeCard: { marginHorizontal: 20, backgroundColor: Colors.purple, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  codeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  codeText: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 2, marginTop: 4, marginBottom: 12 },
  shareRow: { flexDirection: 'row', gap: 8 },
  shareBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  smsBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  smsBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  waBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  waBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  cardAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  cardDate: { fontSize: 11, color: Colors.textSecondary },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  bonus: { fontSize: 13, fontWeight: '700' },
});
