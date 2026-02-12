import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  status: 'available' | 'busy' | 'finishing_soon' | 'offline';
  serviceIcon: string;
  onPress?: () => void;
}

export default function ProMapMarker({ status, serviceIcon, onPress }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (status === 'available' || status === 'finishing_soon') {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 0.15, duration: 1200, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [status]);

  const dotColor = status === 'available' ? Colors.success : status === 'finishing_soon' ? Colors.warning : '#9CA3AF';
  const ringColor = status === 'available' ? Colors.primary : status === 'finishing_soon' ? Colors.warning : '#D1D5DB';

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { backgroundColor: ringColor, transform: [{ scale: pulseAnim }], opacity: opacityAnim },
        ]}
      />
      {/* Main dot */}
      <View style={[styles.dot, { backgroundColor: dotColor, borderColor: ringColor }]}>
        <Text style={styles.icon}>{serviceIcon}</Text>
      </View>
      {/* Status indicator */}
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', width: 56, height: 56 },
  pulseRing: {
    position: 'absolute', width: 52, height: 52, borderRadius: 26,
  },
  dot: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2.5,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 4,
  },
  icon: { fontSize: 18 },
  statusDot: {
    position: 'absolute', bottom: 2, right: 6, width: 10, height: 10,
    borderRadius: 5, borderWidth: 1.5, borderColor: Colors.white,
  },
});
