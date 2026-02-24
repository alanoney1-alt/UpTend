import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const ROOMS = [
  { id: '1', name: 'Kitchen', icon: '🍳', scanned: true, issues: 2 },
  { id: '2', name: 'Living Room', icon: '🛋️', scanned: true, issues: 0 },
  { id: '3', name: 'Master Bedroom', icon: '🛏️', scanned: false, issues: 0 },
  { id: '4', name: 'Bathroom', icon: '🚿', scanned: true, issues: 1 },
  { id: '5', name: 'Garage', icon: '🚗', scanned: false, issues: 0 },
  { id: '6', name: 'Backyard', icon: '🌳', scanned: false, issues: 0 },
];

const BADGES = [
  { id: '1', name: 'First Scan', icon: '🏅', earned: true },
  { id: '2', name: 'Room Master', icon: '🏆', earned: true },
  { id: '3', name: 'Full House', icon: '🏠', earned: false },
  { id: '4', name: 'Eagle Eye', icon: '🦅', earned: false },
];

export default function HomeScanScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<'scan' | 'badges' | 'wallet'>('scan');
  const scannedCount = ROOMS.filter(r => r.scanned).length;
  const totalRooms = ROOMS.length;
  const progress = scannedCount / totalRooms;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home DNA Scan</Text>
        <Text style={styles.headerSub}>Scan your home to detect issues</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['scan', 'badges', 'wallet'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'scan' ? '📷 Scan' : tab === 'badges' ? '🏅 Badges' : '💰 Credits'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'scan' && (
          <>
            {/* Progress */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Scan Progress</Text>
                <Text style={styles.progressCount}>{scannedCount}/{totalRooms} rooms</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressHint}>
                Scan {totalRooms - scannedCount} more rooms to earn the Full House badge!
              </Text>
            </View>

            {/* Camera Button */}
            <TouchableOpacity style={styles.scanBtn} activeOpacity={0.8}>
              <Text style={styles.scanBtnIcon}>📸</Text>
              <Text style={styles.scanBtnText}>Start Scanning</Text>
              <Text style={styles.scanBtnSub}>Point camera at any room or appliance</Text>
            </TouchableOpacity>

            {/* Room List */}
            <Text style={styles.sectionTitle}>Your Rooms</Text>
            {ROOMS.map(room => (
              <TouchableOpacity key={room.id} style={styles.roomCard}>
                <Text style={styles.roomIcon}>{room.icon}</Text>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <Text style={styles.roomStatus}>
                    {room.scanned
                      ? room.issues > 0
                        ? `⚠️ ${room.issues} issue${room.issues > 1 ? 's' : ''} found`
                        : '✅ No issues'
                      : '⏳ Not scanned yet'}
                  </Text>
                </View>
                <View style={[styles.roomBadge, room.scanned ? styles.roomBadgeGreen : styles.roomBadgeGray]}>
                  <Text style={styles.roomBadgeText}>{room.scanned ? 'Done' : 'Scan'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'badges' && (
          <>
            <Text style={styles.sectionTitle}>Badges Earned</Text>
            <View style={styles.badgeGrid}>
              {BADGES.map(badge => (
                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]}>{badge.name}</Text>
                  <Text style={styles.badgeStatus}>{badge.earned ? '✅ Earned' : '🔒 Locked'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'wallet' && (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>Scan Credits</Text>
              <Text style={styles.walletBalance}>$15.00</Text>
              <Text style={styles.walletSub}>Earned from scanning your home</Text>
            </View>

            <Text style={styles.sectionTitle}>How to Earn</Text>
            <View style={styles.earnCard}>
              <Text style={styles.earnIcon}>📷</Text>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Scan a Room</Text>
                <Text style={styles.earnDesc}>+$2.50 per room scanned</Text>
              </View>
            </View>
            <View style={styles.earnCard}>
              <Text style={styles.earnIcon}>🏅</Text>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Earn a Badge</Text>
                <Text style={styles.earnDesc}>+$5.00 per badge earned</Text>
              </View>
            </View>
            <View style={styles.earnCard}>
              <Text style={styles.earnIcon}>🏠</Text>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Complete Full Scan</Text>
                <Text style={styles.earnDesc}>+$10.00 bonus</Text>
              </View>
            </View>
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
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#f97316' },
  scroll: { padding: 20, paddingBottom: 40 },
  progressCard: {
    backgroundColor: '#f9fafb', borderRadius: 16, padding: 20, marginBottom: 20,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  progressCount: { fontSize: 14, fontWeight: '600', color: '#f97316' },
  progressBar: {
    height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: '#22c55e', borderRadius: 4 },
  progressHint: { fontSize: 12, color: '#64748b', marginTop: 8 },
  scanBtn: {
    backgroundColor: '#f97316', borderRadius: 20, padding: 24, alignItems: 'center',
    marginBottom: 24, shadowColor: '#f97316', shadowOpacity: 0.3, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  scanBtnIcon: { fontSize: 40, marginBottom: 8 },
  scanBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  scanBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12, marginTop: 4 },
  roomCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  roomIcon: { fontSize: 28, marginRight: 14 },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  roomStatus: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roomBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  roomBadgeGreen: { backgroundColor: '#dcfce7' },
  roomBadgeGray: { backgroundColor: '#f3f4f6' },
  roomBadgeText: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: {
    width: '47%', backgroundColor: '#fff7ed', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#fdba74',
  },
  badgeCardLocked: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', opacity: 0.6 },
  badgeIcon: { fontSize: 36, marginBottom: 8 },
  badgeName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  badgeNameLocked: { color: '#9ca3af' },
  badgeStatus: { fontSize: 12, color: '#64748b', marginTop: 4 },
  walletCard: {
    backgroundColor: '#f97316', borderRadius: 20, padding: 28, alignItems: 'center',
    marginBottom: 24,
  },
  walletLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  walletBalance: { fontSize: 42, fontWeight: '900', color: '#fff', marginVertical: 4 },
  walletSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  earnCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 14, padding: 16, marginBottom: 10,
  },
  earnIcon: { fontSize: 28, marginRight: 14 },
  earnInfo: { flex: 1 },
  earnTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  earnDesc: { fontSize: 13, color: '#22c55e', fontWeight: '600', marginTop: 2 },
});
