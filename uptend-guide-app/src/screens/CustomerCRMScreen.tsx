import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, LoadingScreen, EmptyState, Card, Badge, Avatar } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchCustomerCRM } from '../services/api';

interface Customer {
  id: string;
  name: string;
  initials: string;
  address: string;
  lastService: string;
  lastServiceDate: string;
  totalJobs: number;
  notes: string;
  rating: number;
  flagged: boolean;
  phone?: string;
  email?: string;
}

export default function CustomerCRMScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'recent'>('all');

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const bg = dark ? colors.backgroundDark : colors.background;
  const cardBg = dark ? colors.surfaceDark : colors.surface;

  const load = useCallback(async () => {
    try {
      const data = await fetchCustomerCRM();
      const list = (data.customers || []).map((c: any) => {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.name || 'Customer';
        return {
          id: c.id,
          name,
          initials: name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
          address: c.address || c.pickup_address || '',
          lastService: c.last_service || c.lastService || '',
          lastServiceDate: c.last_service_date || '',
          totalJobs: c.total_jobs || c.totalJobs || 0,
          notes: c.notes || '',
          rating: c.rating || 0,
          flagged: c.flagged || false,
          phone: c.phone || '',
          email: c.email || '',
        };
      });
      setCustomers(list);
    } catch {
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  let filtered = customers;
  if (filter === 'flagged') filtered = filtered.filter(c => c.flagged);
  if (filter === 'recent') filtered = [...filtered].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 20);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
  }

  if (loading) return <LoadingScreen message="Loading customers..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Customer CRM" subtitle={`${customers.length} customers`} onBack={() => navigation.goBack()} />

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, height: 44, fontSize: 15, color: textColor }}
            placeholder="Search customers..."
            placeholderTextColor={mutedColor}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search customers"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        {(['all', 'flagged', 'recent'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filter === f ? colors.primary : cardBg,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: filter === f ? '#fff' : mutedColor }}>
              {f === 'all' ? 'All' : f === 'flagged' ? '⚠️ Flagged' : '🔥 Top'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Customers Found"
          description={search ? `No results for "${search}"` : 'Your customer list will appear here as you complete jobs.'}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: cardBg, borderRadius: 14, padding: 16, marginBottom: 10,
                borderWidth: selectedId === item.id ? 1.5 : 0, borderColor: colors.primary,
              }}
              onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.totalJobs} jobs`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={item.name} size="md" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>
                      {item.flagged ? '⚠️ ' : ''}{item.name}
                    </Text>
                    {item.rating > 0 && (
                      <Text style={{ fontSize: 12, color: '#F59E0B' }}>★ {item.rating.toFixed(1)}</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{item.address}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{item.totalJobs}</Text>
                  <Text style={{ fontSize: 11, color: mutedColor }}>jobs</Text>
                </View>
              </View>

              {item.lastService && (
                <Text style={{ fontSize: 12, color: colors.primary, marginTop: 8 }}>
                  Last: {item.lastService} · {item.lastServiceDate}
                </Text>
              )}

              {selectedId === item.id && (
                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: dark ? colors.borderDark : colors.border }}>
                  {item.notes ? (
                    <View style={{ backgroundColor: bg, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: mutedColor, marginBottom: 4 }}>Notes</Text>
                      <Text style={{ fontSize: 13, color: textColor, lineHeight: 18 }}>{item.notes}</Text>
                    </View>
                  ) : null}
                  {(item.phone || item.email) && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {item.phone ? <Text style={{ fontSize: 13, color: colors.primary }}>📞 {item.phone}</Text> : null}
                      {item.email ? <Text style={{ fontSize: 13, color: colors.primary }}>✉️ {item.email}</Text> : null}
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
