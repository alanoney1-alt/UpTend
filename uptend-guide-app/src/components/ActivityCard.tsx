import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { ActivityItem } from '../types/models';

const TYPE_COLORS: Record<string, string> = {
  service: Colors.primary,
  stat: Colors.info,
  booking: Colors.success,
  pro: Colors.purple,
  group_deal: Colors.warning,
  weather: '#6366F1',
};

interface Props {
  item: ActivityItem;
  onAction?: () => void;
}

export default function ActivityCard({ item, onAction }: Props) {
  const accentColor = TYPE_COLORS[item.type] || Colors.primary;

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.content}>
          <Text style={styles.text}>{item.text}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.neighborhood}>{item.neighborhood}</Text>
            <Text style={styles.time}>{item.timeAgo}</Text>
          </View>
        </View>
        {item.thumbnail && (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        )}
      </View>
      {item.actionLabel && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: accentColor }]} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionText}>{item.actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, marginBottom: 12, marginHorizontal: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  emoji: { fontSize: 24, marginTop: 2 },
  content: { flex: 1 },
  text: { fontSize: 14, fontWeight: '500', color: Colors.text, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  neighborhood: { fontSize: 12, fontWeight: '600', color: Colors.purple },
  time: { fontSize: 12, color: Colors.textSecondary },
  thumbnail: { width: 52, height: 52, borderRadius: 10 },
  actionBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  actionText: { color: Colors.white, fontWeight: '700', fontSize: 12 },
});
