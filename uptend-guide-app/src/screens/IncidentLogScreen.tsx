import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, useColorScheme, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, LoadingScreen, EmptyState, Badge } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchIncidents, createIncident } from '../services/api';

const STATUS_CONFIG: Record<string, { bg: string; bgDark: string; color: string; label: string }> = {
  detected: { bg: '#FFF3E8', bgDark: 'rgba(249,115,22,0.15)', color: '#F97316', label: 'Detected' },
  reviewed: { bg: '#D1FAE5', bgDark: 'rgba(52,199,89,0.15)', color: '#34C759', label: 'Reviewed' },
  dismissed: { bg: '#F3F4F6', bgDark: 'rgba(142,142,147,0.15)', color: '#8E8E93', label: 'Dismissed' },
  escalated: { bg: '#FEE2E2', bgDark: 'rgba(255,59,48,0.15)', color: '#FF3B30', label: 'Escalated' },
};

export default function IncidentLogScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const bg = dark ? colors.backgroundDark : colors.background;
  const cardBg = dark ? colors.surfaceDark : colors.surface;

  const load = useCallback(async () => {
    try {
      const data = await fetchIncidents();
      const list = data?.incidents || data || [];
      setIncidents(Array.isArray(list) ? list.map((i: any) => ({
        id: i.id,
        timestamp: i.timestamp || i.created_at || '',
        gForce: i.gForce || i.g_force || 0,
        jobId: i.jobId || i.job_id || '',
        status: i.status || 'detected',
        notes: i.notes || '',
        hasPhoto: i.hasPhoto || i.has_photo || false,
        location: i.location || '',
      })) : []);
    } catch {
      setIncidents([]);
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

  const filtered = filter === 'all' ? incidents : incidents.filter(i => i.status === filter);

  const handleDismiss = (id: string) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: 'dismissed' } : i));
  };

  if (loading) return <LoadingScreen message="Loading incidents..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <Header title="Incident Log" subtitle="Accelerometer-detected impacts" onBack={() => navigation.goBack()} />

      {/* Filters */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 6 }}>
        {['all', 'detected', 'reviewed', 'escalated', 'dismissed'].map(f => (
          <TouchableOpacity
            key={f}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filter === f ? colors.primary : cardBg,
            }}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
            accessibilityLabel={`Filter ${f}`}
            accessibilityState={{ selected: filter === f }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f ? '#fff' : mutedColor }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Incidents"
          description={filter === 'all' ? 'No incidents recorded yet.' : `No ${filter} incidents.`}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id || String(Math.random())}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.detected;
            return (
              <View style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: dark ? sc.bgDark : sc.bg,
                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: sc.color }}>
                      {(item.gForce || 0).toFixed(1)}g
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{item.timestamp}</Text>
                    <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>
                      Job #{item.jobId}{item.location ? ` • ${item.location}` : ''}
                    </Text>
                  </View>
                  <View style={{
                    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                    backgroundColor: dark ? sc.bgDark : sc.bg,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sc.color, textTransform: 'capitalize' }}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.notes ? (
                  <Text style={{
                    fontSize: 13, color: textColor, marginTop: 10, lineHeight: 18,
                    backgroundColor: bg, padding: 10, borderRadius: 8,
                  }}>
                    {item.notes}
                  </Text>
                ) : null}

                <View style={{ marginTop: 10 }}>
                  {item.hasPhoto && <Text style={{ fontSize: 12, color: mutedColor }}>📸 Photo attached</Text>}
                  {item.status === 'detected' && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                        onPress={() => Alert.alert('Camera', 'Camera would open for this incident.')}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>📸 Add Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>📝 Add Notes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ backgroundColor: dark ? 'rgba(255,59,48,0.15)' : '#FEE2E2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                        onPress={() => handleDismiss(item.id)}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#FF3B30' }}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
