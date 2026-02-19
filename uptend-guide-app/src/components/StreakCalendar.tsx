import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  weeks: WeekData[];
  onWeekTap?: (week: WeekData) => void;
}

function getColor(count: number): string {
  if (count === 0) return Colors.borderLight;
  if (count === 1) return '#86EFAC';
  if (count === 2) return '#22C55E';
  return '#15803D';
}

export default function StreakCalendar({ weeks, onWeekTap }: Props) {
  // Display as a single row of 52 cells (simplified from 7-row grid for RN)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {weeks.map((w, i) => (
          <TouchableOpacity key={i} onPress={() => onWeekTap?.(w)} activeOpacity={0.7}>
            <View style={[styles.cell, { backgroundColor: getColor(w.servicesCount) }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {[0, 1, 2, 3].map(c => (
          <View key={c} style={[styles.legendCell, { backgroundColor: getColor(c) }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 10 },
  grid: { flexDirection: 'row', gap: 3, paddingVertical: 4 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { fontSize: 10, color: Colors.textSecondary },
});
