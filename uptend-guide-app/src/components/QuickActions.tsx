import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  actions: string[];
  onPress: (action: string) => void;
}

export default function QuickActions({ actions, onPress }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container} contentContainerStyle={styles.content}>
      {actions.map((action) => (
        <TouchableOpacity key={action} style={styles.chip} onPress={() => onPress(action)} activeOpacity={0.7}>
          <Text style={styles.chipText}>{action}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 50, marginVertical: 8 },
  content: { paddingHorizontal: 12, gap: 8 },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
