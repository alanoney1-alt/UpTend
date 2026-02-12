import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface Customer {
  id: string;
  name: string;
  address: string;
  lastService: string;
  lastServiceDate: string;
  totalJobs: number;
  notes: string;
  rating: number;
  flagged: boolean;
  pets: string;
  parking: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Sarah Mitchell', address: '1234 Oak Ave, Winter Park', lastService: 'Lawn Care', lastServiceDate: 'Feb 8', totalJobs: 12, notes: 'Prefers morning appointments. Back gate code: 4521', rating: 5, flagged: false, pets: 'Golden retriever (Buddy)', parking: 'Driveway' },
  { id: '2', name: 'James Kim', address: '567 Pine St, Orlando', lastService: 'Pressure Washing', lastServiceDate: 'Feb 5', totalJobs: 3, notes: 'Very particular about driveway edges', rating: 4, flagged: false, pets: 'None', parking: 'Street' },
  { id: '3', name: 'Maria Lopez', address: '890 Maple Dr, Orlando', lastService: 'Deep Cleaning', lastServiceDate: 'Jan 22', totalJobs: 8, notes: 'Speaks Spanish. Allergic to bleach.', rating: 5, flagged: false, pets: 'Cat (Luna)', parking: 'Garage side' },
  { id: '4', name: 'Robert Thompson', address: '321 Elm Ct, Kissimmee', lastService: 'Junk Removal', lastServiceDate: 'Jan 15', totalJobs: 2, notes: 'Complained about pricing. Watch for scope creep.', rating: 2, flagged: true, pets: 'None', parking: 'Limited' },
  { id: '5', name: 'Jennifer Davis', address: '456 Cedar Ln, Lake Nona', lastService: 'Pool Cleaning', lastServiceDate: 'Feb 10', totalJobs: 15, notes: 'Best customer. Tips well. Referral source.', rating: 5, flagged: false, pets: '2 cats', parking: 'Driveway' },
];

export default function CustomerCRMScreen() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = search ? MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase())) : MOCK_CUSTOMERS;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Customer CRM</Text>
        <Text style={styles.subtitle}>{MOCK_CUSTOMERS.length} customers</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search customers..." value={search} onChangeText={setSearch} placeholderTextColor={Colors.textLight} />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const expanded = selectedId === item.id;
          return (
            <TouchableOpacity style={[styles.card, item.flagged && styles.flaggedCard]} onPress={() => setSelectedId(expanded ? null : item.id)}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.split(' ').map(n => n[0]).join('')}</Text></View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.flagged && <Text style={styles.flag}>⚠️</Text>}
                  </View>
                  <Text style={styles.cardAddress}>{item.address}</Text>
                  <Text style={styles.cardMeta}>{item.lastService} • {item.lastServiceDate} • {item.totalJobs} jobs</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{'⭐'.repeat(Math.min(item.rating, 5))}</Text>
                </View>
              </View>
              {expanded && (
                <View style={styles.expanded}>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>📝 Notes</Text><Text style={styles.detailValue}>{item.notes}</Text></View>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>🐾 Pets</Text><Text style={styles.detailValue}>{item.pets}</Text></View>
                  <View style={styles.detailRow}><Text style={styles.detailLabel}>🚗 Parking</Text><Text style={styles.detailValue}>{item.parking}</Text></View>
                  <TouchableOpacity style={styles.briefBtn}>
                    <Text style={styles.briefBtnText}>📋 Pre-Arrival Brief</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, height: 42 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  flaggedCard: { borderLeftWidth: 3, borderLeftColor: Colors.warning },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.purple, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  flag: { fontSize: 12 },
  cardAddress: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  cardMeta: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  ratingBadge: {},
  ratingText: { fontSize: 10 },
  expanded: { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  detailValue: { fontSize: 14, color: Colors.text, marginTop: 2 },
  briefBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  briefBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
