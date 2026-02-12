import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Colors } from '../theme/colors';
import { ProLocation } from '../services/ProAvailabilityAPI';
import ProCard from './ProCard';

interface Props {
  pros: ProLocation[];
  onHire?: (pro: ProLocation) => void;
}

type SortBy = 'nearest' | 'highest_rated' | 'fastest_response';
const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'nearest', label: 'Nearest' },
  { key: 'highest_rated', label: 'Highest Rated' },
  { key: 'fastest_response', label: 'Fastest' },
];

const SERVICE_FILTERS = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'junk', label: 'Junk', icon: '🗑️' },
  { id: 'pressure', label: 'Pressure', icon: '💦' },
  { id: 'lawn', label: 'Lawn', icon: '🌿' },
  { id: 'clean', label: 'Cleaning', icon: '🧹' },
  { id: 'handyman', label: 'Handyman', icon: '🔧' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'moving', label: 'Moving', icon: '📦' },
];

export default function ProListView({ pros, onHire }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('nearest');
  const [serviceFilter, setServiceFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...pros];

    // Filter by service
    if (serviceFilter !== 'all') {
      result = result.filter(p =>
        p.services.some(s => s.id === serviceFilter || s.name.toLowerCase().includes(serviceFilter))
      );
    }

    // Sort
    switch (sortBy) {
      case 'nearest':
        result.sort((a, b) => (a.distanceMiles || 99) - (b.distanceMiles || 99));
        break;
      case 'highest_rated':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'fastest_response':
        result.sort((a, b) => a.responseTimeMin - b.responseTimeMin);
        break;
    }

    // Always put available pros first
    result.sort((a, b) => {
      const order = { available: 0, finishing_soon: 1, busy: 2, offline: 3 };
      return order[a.status] - order[b.status];
    });

    return result;
  }, [pros, sortBy, serviceFilter]);

  return (
    <View style={styles.container}>
      {/* Service filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {SERVICE_FILTERS.map(sf => (
          <TouchableOpacity
            key={sf.id}
            style={[styles.filterPill, serviceFilter === sf.id && styles.filterPillActive]}
            onPress={() => setServiceFilter(sf.id)}
          >
            <Text style={styles.filterIcon}>{sf.icon}</Text>
            <Text style={[styles.filterLabel, serviceFilter === sf.id && styles.filterLabelActive]}>
              {sf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort options */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{filtered.length} pros</Text>
        <View style={styles.sortBtns}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, sortBy === opt.key && styles.sortBtnActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pro list */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProCard pro={item} onHire={onHire} compact />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No pros found for this filter</Text>
            <TouchableOpacity onPress={() => setServiceFilter('all')}>
              <Text style={styles.emptyLink}>Show all pros</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterScroll: { maxHeight: 44, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterLabelActive: { color: '#fff' },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultCount: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sortBtnActive: { backgroundColor: Colors.purple },
  sortText: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  sortTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  cardWrapper: { marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
  emptyLink: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 8 },
});
