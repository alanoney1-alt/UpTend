import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  service: string;
  price: string;
  address?: string;
  description?: string;
  onBookNow?: () => void;
}

export default function QuoteCard({ service, price, address, description, onBookNow }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.service}>{service}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {address ? <Text style={styles.address}>📍 {address}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={onBookNow} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  service: { fontSize: 17, fontWeight: '700', color: Colors.text, flex: 1 },
  price: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  desc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, lineHeight: 20 },
  address: { fontSize: 13, color: Colors.textLight, marginBottom: 12 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
