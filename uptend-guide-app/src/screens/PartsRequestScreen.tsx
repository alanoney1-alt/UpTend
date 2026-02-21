import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { fetchPartsRequests, createPartsRequest, updatePartsRequest } from '../services/api';

type PartsStatus = 'Pending' | 'Approved' | 'Sourced' | 'Installed';
const STATUS_STEPS: PartsStatus[] = ['Pending', 'Approved', 'Sourced', 'Installed'];

const statusColors: Record<PartsStatus, { bg: string; text: string }> = {
  'Pending': { bg: '#FEF3C7', text: '#D97706' },
  'Approved': { bg: '#DBEAFE', text: '#2563EB' },
  'Sourced': { bg: '#E0E7FF', text: '#4F46E5' },
  'Installed': { bg: '#D1FAE5', text: '#059669' },
};

const supplyIcons: Record<string, string> = {
  'PM Provides': '🏢',
  'Pro Sources': '🔧',
  'Preferred Supplier': '📦',
};

export default function PartsRequestScreen({ route }: any) {
  const jobId = route?.params?.jobId;
  const jobName = route?.params?.jobName || 'Current Job';
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPartsRequests(jobId)
      .then(data => {
        const list = data?.requests || data?.parts || data || [];
        setRequests(Array.isArray(list) ? list.map((r: any) => ({
          id: r.id,
          description: r.description || r.name || '',
          estimatedCost: r.estimatedCost || r.estimated_cost || r.cost || '',
          status: r.status || 'Pending',
          supplyMethod: r.supplyMethod || r.supply_method || 'Pro Sources',
          createdAt: r.createdAt || r.created_at || '',
          hasReceipt: r.hasReceipt || r.has_receipt || false,
        })) : []);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!newDesc || !newCost) return;
    setSubmitting(true);
    try {
      const result = await createPartsRequest({ jobId, description: newDesc, estimatedCost: newCost });
      setRequests(prev => [{
        id: result?.id || String(Date.now()),
        description: newDesc,
        estimatedCost: `$${newCost}`,
        status: 'Pending',
        supplyMethod: 'Pro Sources',
        createdAt: new Date().toLocaleDateString(),
        hasReceipt: false,
      }, ...prev]);
      setNewDesc('');
      setNewCost('');
      setShowForm(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: PartsStatus) => {
    try {
      await updatePartsRequest(id, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update status');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Parts & Materials</Text>
            <Text style={styles.subtitle}>{jobName}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Request'}</Text>
          </TouchableOpacity>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Request Parts</Text>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={styles.textInput} placeholder="What parts do you need?" placeholderTextColor={Colors.textLight} value={newDesc} onChangeText={setNewDesc} multiline />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Estimated Cost</Text>
            <TextInput style={[styles.textInput, { minHeight: 44 }]} placeholder="$0.00" placeholderTextColor={Colors.textLight} value={newCost} onChangeText={setNewCost} keyboardType="numeric" />
            <TouchableOpacity style={[styles.submitBtn, (!newDesc || !newCost) && { opacity: 0.4 }]} disabled={!newDesc || !newCost || submitting} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Request'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryRow}>
          {STATUS_STEPS.map(s => {
            const count = requests.filter(r => r.status === s).length;
            return (
              <View key={s} style={[styles.summaryPill, { backgroundColor: statusColors[s].bg }]}>
                <Text style={[styles.summaryCount, { color: statusColors[s].text }]}>{count}</Text>
                <Text style={[styles.summaryLabel, { color: statusColors[s].text }]}>{s}</Text>
              </View>
            );
          })}
        </View>

        {requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No Parts Requests</Text>
            <Text style={styles.emptyText}>Tap "+ Request" to request parts for this job.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Requests</Text>
            {requests.map((req) => {
              const stepIdx = STATUS_STEPS.indexOf(req.status as PartsStatus);
              const sc = statusColors[req.status as PartsStatus] || statusColors.Pending;
              return (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.reqHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>{req.status}</Text>
                    </View>
                    <Text style={styles.reqDate}>{req.createdAt}</Text>
                  </View>
                  <Text style={styles.reqDesc}>{req.description}</Text>
                  <Text style={styles.reqCost}>{typeof req.estimatedCost === 'number' ? `$${req.estimatedCost}` : req.estimatedCost}</Text>
                  <View style={styles.tracker}>
                    {STATUS_STEPS.map((s, i) => (
                      <React.Fragment key={s}>
                        <View style={[styles.trackerDot, i <= stepIdx ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.borderLight }]} />
                        {i < STATUS_STEPS.length - 1 && (
                          <View style={[styles.trackerLine, i < stepIdx ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.borderLight }]} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                  <View style={styles.supplyRow}>
                    <Text style={{ fontSize: 14 }}>{supplyIcons[req.supplyMethod] || '🔧'}</Text>
                    <Text style={styles.supplyText}>{req.supplyMethod}</Text>
                  </View>
                  {req.status === 'Approved' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusUpdate(req.id, 'Sourced')}>
                      <Text style={styles.actionBtnText}>📸 Upload Receipt — Mark Sourced</Text>
                    </TouchableOpacity>
                  )}
                  {req.status === 'Sourced' && (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={() => handleStatusUpdate(req.id, 'Installed')}>
                      <Text style={styles.actionBtnText}>✅ Mark as Installed</Text>
                    </TouchableOpacity>
                  )}
                  {req.status === 'Installed' && req.hasReceipt && (
                    <View style={styles.completeBadge}>
                      <Text style={styles.completeText}>✅ Completed • Receipt on file</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  emptyCard: { padding: 30, backgroundColor: Colors.surface, borderRadius: 16, alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 13, color: Colors.textLight, textAlign: 'center', marginTop: 6 },
  formCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 2, borderColor: Colors.primary },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  textInput: { backgroundColor: Colors.inputBackground, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryPill: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryCount: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  requestCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  reqDate: { fontSize: 12, color: Colors.textLight },
  reqDesc: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  reqCost: { fontSize: 17, fontWeight: '800', color: Colors.primary, marginBottom: 14 },
  tracker: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  trackerDot: { width: 10, height: 10, borderRadius: 5 },
  trackerLine: { flex: 1, height: 3, borderRadius: 2 },
  supplyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  supplyText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  completeBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, alignItems: 'center' },
  completeText: { fontSize: 13, fontWeight: '600', color: '#059669' },
});
