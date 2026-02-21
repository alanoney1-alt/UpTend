import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PaymentCard, { AddCardButton } from '../components/PaymentCard';
import {
  createPaymentIntent,
  presentPaymentSheet,
  fetchPaymentMethods,
  saveCard,
  PaymentMethod,
} from '../services/payments';

interface RouteParams {
  jobId: string;
  serviceName: string;
  price: number;
  proName: string;
}

export default function PaymentScreen({ route, navigation }: any) {
  const { jobId, serviceName, price, proName } = (route?.params ?? {}) as RouteParams;
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tipAmount, setTipAmount] = useState(0);
  const tipOptions = [0, 5, 10, 15, 20];

  useEffect(() => {
    fetchPaymentMethods().then(setMethods).catch(() => {});
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      const total = (price || 0) + tipAmount;
      const { clientSecret, ephemeralKey, customerId } = await createPaymentIntent(
        Math.round(total * 100),
        jobId
      );
      await presentPaymentSheet(clientSecret, ephemeralKey, customerId);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      Alert.alert('Payment Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    try {
      await saveCard();
      const updated = await fetchPaymentMethods();
      setMethods(updated);
    } catch {
      Alert.alert('Error', 'Could not add card');
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>George will send you the receipt shortly.</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>{serviceName || 'Service'}</Text>
          <Text style={styles.value}>${(price || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.label}>Pro</Text>
          <Text style={styles.value}>{proName || 'Assigned Pro'}</Text>
        </View>
        {tipAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Tip</Text>
            <Text style={styles.value}>${tipAmount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${((price || 0) + tipAmount).toFixed(2)}</Text>
        </View>
      </View>

      {/* Tip */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add a Tip</Text>
        <View style={styles.tipRow}>
          {tipOptions.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tipBtn, tipAmount === t && styles.tipBtnActive]}
              onPress={() => setTipAmount(t)}
            >
              <Text style={[styles.tipText, tipAmount === t && styles.tipTextActive]}>
                {t === 0 ? 'No Tip' : `$${t}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Saved Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {methods.map((m) => (
          <PaymentCard key={m.id} method={m} />
        ))}
        <AddCardButton onPress={handleAddCard} />
      </View>

      {/* Pay Button */}
      <TouchableOpacity style={styles.payBtn} onPress={handlePay} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>
            Pay ${((price || 0) + tipAmount).toFixed(2)}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  successTitle: { fontSize: 24, fontWeight: '700', marginTop: 16, color: '#222' },
  successSub: { fontSize: 15, color: '#666', marginTop: 8, textAlign: 'center' },
  doneBtn: { marginTop: 30, backgroundColor: '#1a73e8', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 15, color: '#666' },
  value: { fontSize: 15, color: '#222', fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#ddd', marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: '#222' },
  totalValue: { fontSize: 17, fontWeight: '700', color: '#1a73e8' },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  tipBtnActive: { backgroundColor: '#1a73e8', borderColor: '#1a73e8' },
  tipText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tipTextActive: { color: '#fff' },
  payBtn: { backgroundColor: '#1a73e8', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
