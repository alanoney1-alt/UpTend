import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

type PartsStatus = 'Pending' | 'Approved' | 'Sourced' | 'Installed';
type SupplyMethod = 'PM Provides' | 'Pro Sources' | 'Preferred Supplier';

interface PartsRequest {
  id: string;
  description: string;
  estimatedCost: string;
  status: PartsStatus;
  supplyMethod: SupplyMethod;
  createdAt: string;
  hasReceipt: boolean;
  photo?: string;
}

const REQUESTS: PartsRequest[] = [
  { id: '1', description: 'Replacement kitchen faucet (Moen Arbor)', estimatedCost: '$185', status: 'Approved', supplyMethod: 'Pro Sources', createdAt: 'Feb 14', hasReceipt: false },
  { id: '2', description: '3x HVAC air filters 20x25x1', estimatedCost: '$45', status: 'Sourced', supplyMethod: 'Preferred Supplier', createdAt: 'Feb 13', hasReceipt: true },
  { id: '3', description: 'Drywall patch kit + paint match', estimatedCost: '$65', status: 'Pending', supplyMethod: 'Pro Sources', createdAt: 'Feb 15', hasReceipt: false },
  { id: '4', description: 'Exterior door weatherstripping set', estimatedCost: '$32', status: 'Installed', supplyMethod: 'PM Provides', createdAt: 'Feb 10', hasReceipt: true },
];

const STATUS_STEPS: PartsStatus[] = ['Pending', 'Approved', 'Sourced', 'Installed'];

const statusColors: Record<PartsStatus, { bg: string; text: string }> = {
  'Pending': { bg: '#FEF3C7', text: '#D97706' },
  'Approved': { bg: '#DBEAFE', text: '#2563EB' },
  'Sourced': { bg: '#E0E7FF', text: '#4F46E5' },
  'Installed': { bg: '#D1FAE5', text: '#059669' },
};

const supplyIcons: Record<SupplyMethod, string> = {
  'PM Provides': '🏢',
  'Pro Sources': '🔧',
  'Preferred Supplier': '📦',
};

export default function PartsRequestScreen() {
  const [requests] = useState<PartsRequest[]>(REQUESTS);
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newCost, setNewCost] = useState('');

  const jobName = 'Kitchen Renovation — 123 Oak St';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Parts & Materials</Text>
            <Text style={styles.subtitle}>{jobName}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => setShowForm(!showForm)}>
            <Text style={styles.addBtnText}>{showForm ? '✕' : '+ Request'}</Text>
          </TouchableOpacity>
        </View>

        {/* New Request Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Request Parts</Text>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              placeholder="What parts do you need?"
              placeholderTextColor={Colors.textLight}
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
            />
            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Estimated Cost</Text>
            <TextInput
              style={[styles.textInput, { minHeight: 44 }]}
              placeholder="$0.00"
              placeholderTextColor={Colors.textLight}
              value={newCost}
              onChangeText={setNewCost}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.photoBtn} activeOpacity={0.8}>
              <Text style={styles.photoBtnText}>📸 Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (!newDesc || !newCost) && { opacity: 0.4 }]}
              disabled={!newDesc || !newCost}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Submit Request</Text>
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

        {/* Requests List */}
        <Text style={styles.sectionTitle}>Requests</Text>
        {requests.map((req) => {
          const stepIdx = STATUS_STEPS.indexOf(req.status);
          return (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.reqHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[req.status].bg }]}>
                  <Text style={[styles.statusText, { color: statusColors[req.status].text }]}>{req.status}</Text>
                </View>
                <Text style={styles.reqDate}>{req.createdAt}</Text>
              </View>

              <Text style={styles.reqDesc}>{req.description}</Text>
              <Text style={styles.reqCost}>{req.estimatedCost}</Text>

              {/* Progress tracker */}
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
              <View style={styles.trackerLabels}>
                {STATUS_STEPS.map((s) => (
                  <Text key={s} style={styles.trackerLabel}>{s}</Text>
                ))}
              </View>

              {/* Supply method */}
              <View style={styles.supplyRow}>
                <Text style={{ fontSize: 14 }}>{supplyIcons[req.supplyMethod]}</Text>
                <Text style={styles.supplyText}>{req.supplyMethod}</Text>
              </View>

              {/* Actions */}
              {req.status === 'Approved' && (
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                  <Text style={styles.actionBtnText}>📸 Upload Receipt — Mark Sourced</Text>
                </TouchableOpacity>
              )}
              {req.status === 'Sourced' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} activeOpacity={0.8}>
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

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Form
  formCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: 18, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 2, borderColor: Colors.primary,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  textInput: {
    backgroundColor: Colors.inputBackground, borderRadius: 12, padding: 14, fontSize: 14,
    color: Colors.text, minHeight: 60, textAlignVertical: 'top',
  },
  photoBtn: {
    backgroundColor: Colors.background, borderRadius: 10, padding: 14, alignItems: 'center',
    marginTop: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryPill: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  summaryCount: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },

  // Request card
  requestCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  reqDate: { fontSize: 12, color: Colors.textLight },
  reqDesc: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  reqCost: { fontSize: 17, fontWeight: '800', color: Colors.primary, marginBottom: 14 },

  // Tracker
  tracker: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  trackerDot: { width: 10, height: 10, borderRadius: 5 },
  trackerLine: { flex: 1, height: 3, borderRadius: 2 },
  trackerLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  trackerLabel: { fontSize: 9, color: Colors.textLight, fontWeight: '600' },

  // Supply
  supplyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  supplyText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // Actions
  actionBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },
  completeBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, padding: 10, alignItems: 'center' },
  completeText: { fontSize: 13, fontWeight: '600', color: '#059669' },
});
