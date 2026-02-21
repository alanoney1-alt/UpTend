import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, useColorScheme, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, LoadingScreen, EmptyState, Button, Card } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import { fetchVehicles } from '../services/api';

const FALLBACK_VEHICLES = [
  { id: '1', year: '2021', make: 'Toyota', model: 'Camry', vin: '1HGBH41...XMN', mileage: '34,200', nextService: 'Oil Change', nextServiceDate: 'Mar 15, 2026', healthScore: 92 },
  { id: '2', year: '2019', make: 'Honda', model: 'CR-V', vin: '5J6RW2H...ABC', mileage: '58,700', nextService: 'Tire Rotation', nextServiceDate: 'Feb 28, 2026', healthScore: 78 },
];

const MAINTENANCE = [
  { id: '1', task: 'Oil Change', due: 'Mar 15', icon: '🛢️', status: 'upcoming' },
  { id: '2', task: 'Tire Rotation', due: 'Feb 28', icon: '🔄', status: 'overdue' },
  { id: '3', task: 'Brake Inspection', due: 'Apr 20', icon: '🛑', status: 'upcoming' },
  { id: '4', task: 'Air Filter', due: 'May 10', icon: '🌬️', status: 'upcoming' },
];

export default function AutoScreen({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance' | 'diagnostics'>('vehicles');
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;
  const bg = dark ? colors.backgroundDark : colors.background;
  const cardBg = dark ? colors.surfaceDark : colors.surface;

  const load = useCallback(async () => {
    try {
      const data = await fetchVehicles();
      const list = data?.vehicles || data || [];
      setVehicles(Array.isArray(list) && list.length > 0 ? list : FALLBACK_VEHICLES);
    } catch {
      setVehicles(FALLBACK_VEHICLES);
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

  if (loading) return <LoadingScreen message="Loading vehicles..." />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header with orange background */}
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Auto Care</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Manage vehicles & maintenance</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: bg, paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
        {(['vehicles', 'maintenance', 'diagnostics'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
              backgroundColor: activeTab === tab
                ? (dark ? 'rgba(249,115,22,0.15)' : '#FFF7ED')
                : cardBg,
              borderWidth: activeTab === tab ? 1.5 : 0,
              borderColor: activeTab === tab ? colors.primary : 'transparent',
            }}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: activeTab === tab ? colors.primary : mutedColor }}>
              {tab === 'vehicles' ? '🚗 Vehicles' : tab === 'maintenance' ? '🔧 Schedule' : '📊 Diagnostics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'vehicles' && (
          <>
            {vehicles.map((v: any) => {
              const score = v.healthScore || v.health_score || 0;
              const scoreColor = score >= 80 ? '#34C759' : score >= 50 ? '#F59E0B' : '#FF3B30';
              return (
                <View key={v.id} style={{ backgroundColor: cardBg, borderRadius: 16, padding: 18, marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 52, height: 52, borderRadius: 14,
                      backgroundColor: dark ? '#1C1C1E' : '#F2F2F7',
                      justifyContent: 'center', alignItems: 'center', marginRight: 14,
                    }}>
                      <Text style={{ fontSize: 28 }}>🚗</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>
                        {v.year} {v.make} {v.model}
                      </Text>
                      <Text style={{ fontSize: 12, color: mutedColor, marginTop: 2 }}>VIN: {v.vin}</Text>
                      <Text style={{ fontSize: 13, color: mutedColor, marginTop: 2 }}>{v.mileage} miles</Text>
                    </View>
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: dark ? `${scoreColor}20` : `${scoreColor}15`,
                      justifyContent: 'center', alignItems: 'center',
                    }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: scoreColor }}>{score}</Text>
                      <Text style={{ fontSize: 9, color: scoreColor }}>Health</Text>
                    </View>
                  </View>
                  <View style={{
                    flexDirection: 'row', justifyContent: 'space-between', marginTop: 14,
                    paddingTop: 14, borderTopWidth: 0.5, borderTopColor: dark ? colors.borderDark : colors.border,
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>
                      Next: {v.nextService || v.next_service || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                      {v.nextServiceDate || v.next_service_date || ''}
                    </Text>
                  </View>
                </View>
              );
            })}

            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: dark ? colors.borderDark : '#E5E7EB', borderStyle: 'dashed',
                borderRadius: 16, padding: 18, gap: 8,
              }}
              onPress={() => setShowAddForm(!showAddForm)}
              accessibilityRole="button"
              accessibilityLabel="Add vehicle"
            >
              <Text style={{ fontSize: 20, color: colors.primary, fontWeight: '700' }}>＋</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: mutedColor }}>Add Vehicle</Text>
            </TouchableOpacity>

            {showAddForm && (
              <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 20, marginTop: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 16 }}>Add New Vehicle</Text>
                <TouchableOpacity style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: dark ? '#1C1C1E' : '#111', borderRadius: 14, padding: 16, gap: 10,
                }}>
                  <Text style={{ fontSize: 20 }}>📷</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Scan VIN Barcode</Text>
                </TouchableOpacity>
                <Text style={{ textAlign: 'center', color: mutedColor, fontSize: 13, marginVertical: 14 }}>— or enter manually —</Text>
                {['Year', 'Make', 'Model', 'VIN (optional)'].map(p => (
                  <TextInput
                    key={p}
                    style={{
                      backgroundColor: bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                      fontSize: 16, marginBottom: 10, borderWidth: 1,
                      borderColor: dark ? colors.borderDark : '#E5E7EB', color: textColor,
                    }}
                    placeholder={p}
                    placeholderTextColor={mutedColor}
                    accessibilityLabel={p}
                  />
                ))}
                <Button onPress={() => setShowAddForm(false)} style={{ marginTop: 8 }}>Save Vehicle</Button>
              </View>
            )}
          </>
        )}

        {activeTab === 'maintenance' && (
          <>
            {MAINTENANCE.map(m => (
              <View
                key={m.id}
                style={{
                  flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg,
                  borderRadius: 14, padding: 16, marginBottom: 10,
                  borderWidth: m.status === 'overdue' ? 1 : 0,
                  borderColor: m.status === 'overdue' ? '#FF3B30' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 28, marginRight: 14 }}>{m.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: textColor }}>{m.task}</Text>
                  <Text style={{
                    fontSize: 13, marginTop: 2,
                    color: m.status === 'overdue' ? '#FF3B30' : mutedColor,
                    fontWeight: m.status === 'overdue' ? '600' : '400',
                  }}>
                    {m.status === 'overdue' ? '⚠️ Overdue — ' : ''}Due {m.due}
                  </Text>
                </View>
                <Button size="sm" onPress={() => navigation?.navigate?.('Book')}>Book</Button>
              </View>
            ))}
          </>
        )}

        {activeTab === 'diagnostics' && (
          <>
            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🔌</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>OBD-II Scanner</Text>
              <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Connect a Bluetooth OBD-II scanner to read your car's diagnostics
              </Text>
              <Button onPress={() => {}} style={{ marginTop: 14 }}>Connect Scanner</Button>
            </View>

            <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>💬</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }}>Describe a Problem</Text>
              <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
                Tell George about a weird noise, light, or symptom and get instant guidance
              </Text>
              <Button onPress={() => navigation?.navigate?.('GeorgeChat')} style={{ marginTop: 14 }}>Ask Mr. George</Button>
            </View>

            <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 12, marginTop: 8 }}>Common Codes</Text>
            {[
              { code: 'P0300', desc: 'Random/Multiple Cylinder Misfire', severity: 'High' },
              { code: 'P0420', desc: 'Catalyst System Efficiency Below Threshold', severity: 'Medium' },
              { code: 'P0171', desc: 'System Too Lean (Bank 1)', severity: 'Medium' },
            ].map(c => (
              <View key={c.code} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cardBg, borderRadius: 14, padding: 16, marginBottom: 10 }}>
                <Text style={{
                  fontSize: 14, fontWeight: '800', color: textColor,
                  backgroundColor: dark ? '#1C1C1E' : '#F3F4F6',
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 14,
                  overflow: 'hidden',
                }}>
                  {c.code}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: textColor }}>{c.desc}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', marginTop: 2, color: c.severity === 'High' ? '#FF3B30' : '#F59E0B' }}>
                    {c.severity} severity
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
