import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Recruit {
  id: string;
  name: string;
  phone: string;
  keywords: string[];
  confidence: number;
  status: 'found' | 'invited' | 'signed_up' | 'completed_first_job' | 'declined';
}

const MOCK_RECRUITS: Recruit[] = [
  { id: '1', name: "Mike's Lawn Care", phone: '(407) 555-1234', keywords: ['lawn', 'landscap'], confidence: 0.9, status: 'found' },
  { id: '2', name: 'Clean Queen Maria', phone: '(407) 555-5678', keywords: ['clean', 'maid'], confidence: 0.85, status: 'invited' },
  { id: '3', name: 'Dave Pool Service', phone: '(321) 555-9012', keywords: ['pool'], confidence: 0.7, status: 'signed_up' },
  { id: '4', name: 'HandyMan Joe', phone: '(407) 555-3456', keywords: ['handyman'], confidence: 0.8, status: 'completed_first_job' },
  { id: '5', name: 'Tom R. Painter', phone: '(321) 555-7890', keywords: ['paint'], confidence: 0.75, status: 'declined' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  found: { label: 'Found', color: Colors.primary, bg: '#FFF3E8' },
  invited: { label: 'Invited', color: Colors.info, bg: '#E8F0FF' },
  signed_up: { label: 'Signed Up', color: Colors.purple, bg: '#F0E6FF' },
  completed_first_job: { label: '1st Job ✓', color: Colors.success, bg: '#E8F5E8' },
  declined: { label: 'Declined', color: Colors.textSecondary, bg: '#F3F4F6' },
};

export default function RecruitScreen() {
  const [recruits, setRecruits] = useState(MOCK_RECRUITS);
  const [scanning, setScanning] = useState(false);

  const scanContacts = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 2000);
  };

  const sendInvite = (id: string) => {
    setRecruits(prev => prev.map(r => r.id === id ? { ...r, status: 'invited' as const } : r));
    Alert.alert('Invite Sent! 📨', 'A recruitment invite has been sent via SMS.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Recruit Pros</Text>
        <Text style={styles.subtitle}>Know a great service provider? Help them join UpTend!</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statNum}>{recruits.length}</Text><Text style={styles.statLabel}>Found</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{recruits.filter(r => r.status === 'invited').length}</Text><Text style={styles.statLabel}>Invited</Text></View>
        <View style={styles.stat}><Text style={styles.statNum}>{recruits.filter(r => r.status === 'completed_first_job').length}</Text><Text style={styles.statLabel}>Active</Text></View>
      </View>

      <TouchableOpacity style={styles.scanBtn} onPress={scanContacts}>
        <Text style={styles.scanBtnText}>{scanning ? '🔍 Scanning...' : '📱 Scan Contacts for Pros'}</Text>
        <Text style={styles.scanNote}>We only look for service-related names. Opt-in only.</Text>
      </TouchableOpacity>

      <FlatList
        data={recruits}
        keyExtractor={r => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardPhone}>{item.phone}</Text>
                  <View style={styles.keywordRow}>
                    {item.keywords.map(k => (
                      <View key={k} style={styles.keyword}><Text style={styles.keywordText}>{k}</Text></View>
                    ))}
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
              </View>
              {item.status === 'found' && (
                <TouchableOpacity style={styles.inviteBtn} onPress={() => sendInvite(item.id)}>
                  <Text style={styles.inviteBtnText}>📨 Send Invite</Text>
                </TouchableOpacity>
              )}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  scanBtn: { marginHorizontal: 20, backgroundColor: Colors.purple, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scanNote: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  cardPhone: { fontSize: 12, color: Colors.textSecondary },
  keywordRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  keyword: { backgroundColor: '#FFF3E8', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  keywordText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  inviteBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
