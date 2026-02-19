import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchCustomerCRM } from '../services/api';

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
}

export default function CustomerCRMScreen() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerCRM()
      .then(data => {
        const list = (data.customers || []).map((c: any) => ({
          id: c.id,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Customer',
          address: c.address || c.pickup_address || '',
          lastService: c.last_service || c.lastService || '',
          lastServiceDate: c.last_service_date || '',
          totalJobs: c.total_jobs || c.totalJobs || 0,
          notes: c.notes || '',
          rating: c.rating || 0,
          flagged: c.flagged || false,
        }));
        setCustomers(list);
      })
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase()))
    : customers;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Customer CRM</Text>
        <Text style={styles.subtitle}>{customers.length} customers</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="Search customers..." value={search} onChangeText={setSearch} placeholderTextColor={Colors.textLight} />
      </View>

      {customers.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>No Customers Yet</Text>
          <Text style={styles.emptyText}>Your customer list will appear here as you complete jobs.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, selectedId === item.id && styles.cardSelected]}
              onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.flagged ? '⚠️ ' : ''}{item.name}</Text>
                <Text style={styles.cardJobs}>{item.totalJobs} jobs</Text>
              </View>
              <Text style={styles.cardAddress}>{item.address}</Text>
              {item.lastService && <Text style={styles.cardService}>Last: {item.lastService} · {item.lastServiceDate}</Text>}
              {selectedId === item.id && item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: Colors.textLight, textAlign: 'center' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: 0, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.text },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardSelected: { borderWidth: 1, borderColor: Colors.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cardJobs: { fontSize: 13, color: Colors.textLight },
  cardAddress: { fontSize: 13, color: Colors.textLight, marginTop: 4 },
  cardService: { fontSize: 12, color: Colors.primary, marginTop: 6 },
  notesBox: { marginTop: 12, padding: 12, backgroundColor: Colors.background, borderRadius: 8 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginBottom: 4 },
  notesText: { fontSize: 13, color: Colors.text },
});
