import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentMethod } from '../services/payments';

interface Props {
  method: PaymentMethod;
  onPress?: () => void;
}

const brandIcons: Record<string, string> = {
  visa: 'card',
  mastercard: 'card',
  amex: 'card',
};

export default function PaymentCard({ method, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.card, method.isDefault && styles.defaultCard]} onPress={onPress}>
      <Ionicons name="card-outline" size={28} color="#1a73e8" />
      <View style={styles.info}>
        <Text style={styles.brand}>
          {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ****{method.last4}
        </Text>
        <Text style={styles.exp}>
          Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
        </Text>
      </View>
      {method.isDefault && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function AddCardButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addCard} onPress={onPress}>
      <Ionicons name="add-circle-outline" size={28} color="#666" />
      <Text style={styles.addText}>Add New Card</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  defaultCard: {
    borderColor: '#1a73e8',
    borderWidth: 2,
  },
  info: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 16, fontWeight: '600', color: '#222' },
  exp: { fontSize: 13, color: '#888', marginTop: 2 },
  badge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, color: '#1a73e8', fontWeight: '600' },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addText: { fontSize: 16, color: '#666', marginLeft: 12 },
});
