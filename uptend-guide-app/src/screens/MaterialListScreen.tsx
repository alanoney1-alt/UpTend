import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchMaterialList, saveMaterialList } from '../services/api';
import { materialCalculator } from '../services/MaterialCalculator';

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  purchased: boolean;
  notes?: string;
}

export default function MaterialListScreen({ route }: any) {
  const jobId = route?.params?.jobId;
  const passedMeasurements = route?.params?.measurements;
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [sqft, setSqft] = useState(0);

  useEffect(() => {
    if (jobId) {
      fetchMaterialList(jobId)
        .then(data => {
          const list = data?.materials || [];
          if (list.length > 0) {
            setMaterials(list.map((m: any) => ({
              id: m.id || String(Math.random()),
              name: m.name,
              quantity: m.quantity || 1,
              unit: m.unit || 'ea',
              estimatedCost: m.estimatedCost || m.estimated_cost || 0,
              purchased: m.purchased || false,
              notes: m.notes,
            })));
            setServiceType(data.serviceType || data.service_type || '');
            setSqft(data.sqft || 0);
          } else {
            loadFromCalculator();
          }
        })
        .catch(() => loadFromCalculator())
        .finally(() => setLoading(false));
    } else {
      loadFromCalculator();
      setLoading(false);
    }
  }, []);

  const loadFromCalculator = () => {
    try {
      const area = passedMeasurements?.find((m: any) => m.type === 'Area')?.value || 1200;
      const result = materialCalculator.calculate('Pressure Washing', area);
      if (result?.materials) {
        setMaterials(result.materials);
        setServiceType('Pressure Washing');
        setSqft(area);
      }
    } catch {
      setMaterials([]);
    }
  };

  const toggle = (id: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, purchased: !m.purchased } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMaterialList({ jobId, serviceType, sqft, materials });
      Alert.alert('Saved', 'Materials list saved successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save list');
    } finally {
      setSaving(false);
    }
  };

  const purchasedCount = materials.filter(m => m.purchased).length;
  const totalCost = materials.reduce((s, m) => s + m.quantity * m.estimatedCost, 0);

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
        <Text style={styles.title}>📋 Materials List</Text>
        <Text style={styles.subtitle}>{serviceType || 'Job'}{sqft ? ` • ${sqft.toLocaleString()} sq ft` : ''}</Text>
      </View>

      {materials.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Materials</Text>
          <Text style={styles.emptyText}>Measure a job scope first to calculate materials needed.</Text>
        </View>
      ) : (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(purchasedCount / materials.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{purchasedCount}/{materials.length} purchased</Text>

          <FlatList
            data={materials}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.materialCard, item.purchased && styles.purchasedCard]} onPress={() => toggle(item.id)}>
                <View style={[styles.checkbox, item.purchased && styles.checked]}>
                  {item.purchased && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.materialInfo}>
                  <Text style={[styles.materialName, item.purchased && styles.purchasedText]}>{item.name}</Text>
                  {item.notes && <Text style={styles.materialNotes}>{item.notes}</Text>}
                </View>
                <View style={styles.materialQty}>
                  <Text style={styles.qtyText}>{item.quantity} {item.unit}</Text>
                  <Text style={styles.costText}>${(item.quantity * item.estimatedCost).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '💾 Save List'}</Text>
            </TouchableOpacity>
          </View>
        </>
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
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  progressBar: { marginHorizontal: 20, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.success, borderRadius: 3 },
  progressText: { fontSize: 12, color: Colors.textSecondary, paddingHorizontal: 20, marginTop: 4, marginBottom: 12 },
  list: { paddingHorizontal: 16 },
  materialCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 6 },
  purchasedCard: { opacity: 0.6 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  materialInfo: { flex: 1 },
  materialName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  purchasedText: { textDecorationLine: 'line-through' },
  materialNotes: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  materialQty: { alignItems: 'flex-end' },
  qtyText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  costText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.borderLight },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
