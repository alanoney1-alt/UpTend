import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  status: 'pending' | 'checked_in' | 'checked_out' | 'late';
  time?: string;
}

const CONFIG = {
  pending: { label: 'En Route', icon: '🚗', bg: '#E8F0FF', color: Colors.info },
  checked_in: { label: 'On Site', icon: '📍', bg: '#E8F5E8', color: Colors.success },
  checked_out: { label: 'Completed', icon: '✅', bg: '#F3F4F6', color: Colors.textSecondary },
  late: { label: 'Running Late', icon: '⏰', bg: '#FEE2E2', color: Colors.error },
};

export default function CheckInBadge({ status, time }: Props) {
  const c = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={styles.icon}>{c.icon}</Text>
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
      {time && <Text style={[styles.time, { color: c.color }]}>{time}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  icon: { fontSize: 12 },
  label: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 10 },
});
