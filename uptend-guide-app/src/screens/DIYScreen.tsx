import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

const CATEGORIES = [
  { id: '1', name: 'Plumbing', icon: '🔧', count: 24 },
  { id: '2', name: 'Electrical', icon: '⚡', count: 18 },
  { id: '3', name: 'Painting', icon: '🎨', count: 15 },
  { id: '4', name: 'Flooring', icon: '🏗️', count: 12 },
  { id: '5', name: 'HVAC', icon: '❄️', count: 20 },
  { id: '6', name: 'Appliances', icon: '🔌', count: 16 },
  { id: '7', name: 'Roofing', icon: '🏠', count: 10 },
  { id: '8', name: 'Drywall', icon: '🧱', count: 8 },
  { id: '9', name: 'Outdoor', icon: '🌳', count: 14 },
];

const POPULAR_REPAIRS = [
  { id: '1', title: 'Fix a Running Toilet', difficulty: 'Easy', time: '15 min', icon: '🚽' },
  { id: '2', title: 'Unclog a Drain', difficulty: 'Easy', time: '20 min', icon: '🚿' },
  { id: '3', title: 'Patch Drywall Holes', difficulty: 'Medium', time: '45 min', icon: '🔨' },
  { id: '4', title: 'Replace a Light Switch', difficulty: 'Medium', time: '30 min', icon: '💡' },
  { id: '5', title: 'Fix a Squeaky Door', difficulty: 'Easy', time: '10 min', icon: '🚪' },
];

export default function DIYScreen({ navigation }: any) {
  const [search, setSearch] = useState('');

  const filteredRepairs = POPULAR_REPAIRS.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const difficultyColor = (d: string) =>
    d === 'Easy' ? '#22c55e' : d === 'Medium' ? '#f59e0b' : '#ef4444';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DIY Guides</Text>
        <Text style={styles.headerSub}>Learn to fix it yourself with Mr. George</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Search */}
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search repairs..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Ask Mr. George */}
        <TouchableOpacity style={styles.georgeCard} activeOpacity={0.8}
          onPress={() => navigation?.navigate?.('Home')}>
          <View style={styles.georgeLeft}>
            <Text style={styles.georgeIcon}>💬</Text>
          </View>
          <View style={styles.georgeInfo}>
            <Text style={styles.georgeTitle}>Ask Mr. George</Text>
            <Text style={styles.georgeSub}>Start a DIY coaching session with your AI guide</Text>
          </View>
          <Text style={styles.georgeArrow}>→</Text>
        </TouchableOpacity>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.catCard}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catCount}>{cat.count} guides</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Repairs */}
        <Text style={styles.sectionTitle}>Popular Repairs</Text>
        {filteredRepairs.map(repair => (
          <TouchableOpacity key={repair.id} style={styles.repairCard}>
            <Text style={styles.repairIcon}>{repair.icon}</Text>
            <View style={styles.repairInfo}>
              <Text style={styles.repairTitle}>{repair.title}</Text>
              <View style={styles.repairMeta}>
                <View style={[styles.diffBadge, { backgroundColor: difficultyColor(repair.difficulty) + '20' }]}>
                  <Text style={[styles.diffText, { color: difficultyColor(repair.difficulty) }]}>
                    {repair.difficulty}
                  </Text>
                </View>
                <Text style={styles.repairTime}>⏱ {repair.time}</Text>
              </View>
            </View>
            <Text style={styles.repairArrow}>›</Text>
          </TouchableOpacity>
        ))}
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
  scroll: { padding: 20, paddingBottom: 40 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1e293b' },
  georgeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 16, padding: 18, marginBottom: 24,
  },
  georgeLeft: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#f97316',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  georgeIcon: { fontSize: 22 },
  georgeInfo: { flex: 1 },
  georgeTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  georgeSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  georgeArrow: { fontSize: 20, color: '#f97316', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catCard: {
    width: '31%', backgroundColor: '#f9fafb', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
  },
  catIcon: { fontSize: 28, marginBottom: 6 },
  catName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  catCount: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  repairCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  repairIcon: { fontSize: 28, marginRight: 14 },
  repairInfo: { flex: 1 },
  repairTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  repairMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  repairTime: { fontSize: 12, color: '#64748b' },
  repairArrow: { fontSize: 22, color: '#9ca3af' },
});
