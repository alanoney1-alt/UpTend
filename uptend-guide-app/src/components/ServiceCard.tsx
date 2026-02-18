import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  emoji: string;
  label: string;
  price: string;
  isActive?: boolean;
  activePros?: number;
  onSelect?: () => void;
  onBook?: () => void;
}

export default function ServiceCard({
  emoji,
  label,
  price,
  isActive,
  activePros,
  onSelect,
  onBook,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.price}>{price}</Text>
      {activePros != null && (
        <View style={styles.prosRow}>
          <View style={styles.greenDot} />
          <Text style={styles.prosText}>{activePros} Active</Text>
        </View>
      )}
      {onBook && (
        <TouchableOpacity style={styles.bookBtn} onPress={onBook} activeOpacity={0.7}>
          <Text style={styles.bookBtnText}>Book</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    width: '31%',
    minHeight: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7F0',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  labelActive: {
    color: Colors.primary,
  },
  price: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  prosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  prosText: {
    fontSize: 9,
    color: '#22c55e',
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
  },
  bookBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
