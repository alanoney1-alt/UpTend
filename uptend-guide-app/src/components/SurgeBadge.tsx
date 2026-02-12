import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  multiplier: number;
  area: string;
  compact?: boolean;
}

export default function SurgeBadge({ multiplier, area, compact }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (compact) {
    return (
      <Animated.View style={[styles.compactBadge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.compactText}>⚡ {multiplier.toFixed(1)}x</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.lightning}>⚡</Text>
      <View>
        <Text style={styles.multiplier}>{multiplier.toFixed(1)}x Surge</Text>
        <Text style={styles.area}>{area}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, borderWidth: 1, borderColor: Colors.primary },
  lightning: { fontSize: 18 },
  multiplier: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  area: { fontSize: 11, color: Colors.textSecondary },
  compactBadge: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  compactText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
