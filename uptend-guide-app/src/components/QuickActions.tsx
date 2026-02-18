import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

const DEFAULT_ACTIONS = [
  '🔧 Book a Pro',
  '🛠️ DIY Help',
  '🏠 Scan My Home',
  '🚗 Car Help',
  '🛒 Shopping',
  '⚡ Emergency',
];

interface Props {
  actions?: string[];
  onPress: (action: string) => void;
}

export default function QuickActions({ actions = DEFAULT_ACTIONS, onPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {actions.map((action) => (
        <TouchableOpacity
          key={action}
          style={styles.pill}
          onPress={() => onPress(action)}
          activeOpacity={0.7}
        >
          <Text style={styles.pillText}>{action}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 52,
    marginVertical: 8,
  },
  content: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
