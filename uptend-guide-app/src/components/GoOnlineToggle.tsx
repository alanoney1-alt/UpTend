import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  onToggle?: (isOnline: boolean) => void;
  customersNearby?: number;
}

export default function GoOnlineToggle({ onToggle, customersNearby = 0 }: Props) {
  const [isOnline, setIsOnline] = useState(false);
  const slideX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const TRACK_WIDTH = 260;
  const THUMB_SIZE = 52;
  const MAX_SLIDE = TRACK_WIDTH - THUMB_SIZE - 8;

  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      glowAnim.setValue(0);
    }
  }, [isOnline]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const val = isOnline ? Math.max(0, MAX_SLIDE + gs.dx) : Math.min(MAX_SLIDE, Math.max(0, gs.dx));
        slideX.setValue(val);
      },
      onPanResponderRelease: (_, gs) => {
        const threshold = MAX_SLIDE * 0.5;
        const currentPos = isOnline ? MAX_SLIDE + gs.dx : gs.dx;
        if (!isOnline && currentPos > threshold) {
          Animated.spring(slideX, { toValue: MAX_SLIDE, useNativeDriver: false }).start();
          setIsOnline(true);
          onToggle?.(true);
          if (Platform.OS === 'ios') {
            try { const Haptics = require('expo-haptics'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
          }
        } else if (isOnline && currentPos < threshold) {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: false }).start();
          setIsOnline(false);
          onToggle?.(false);
        } else {
          Animated.spring(slideX, { toValue: isOnline ? MAX_SLIDE : 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isOnline ? ['#D1FAE5', '#ECFDF5'] : ['#F3F4F6', '#F3F4F6'],
  });

  const borderColor = isOnline ? Colors.success : '#D1D5DB';

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.track, { backgroundColor: bgColor, borderColor, width: TRACK_WIDTH }]}>
        <Text style={[styles.label, { color: isOnline ? Colors.success : Colors.textLight }]}>
          {isOnline ? '● ONLINE' : 'Slide to go online →'}
        </Text>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {
              backgroundColor: isOnline ? Colors.success : Colors.textLight,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <Text style={styles.thumbIcon}>{isOnline ? '✓' : '→'}</Text>
        </Animated.View>
      </Animated.View>
      {isOnline && customersNearby > 0 && (
        <Text style={styles.subtitle}>
          You're visible to {customersNearby} customers nearby
        </Text>
      )}
      {!isOnline && <Text style={styles.subtitleOff}>You're hidden</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 12 },
  track: {
    height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center',
    paddingHorizontal: 4, overflow: 'hidden',
  },
  label: { textAlign: 'center', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  thumb: {
    position: 'absolute', left: 4, width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
    elevation: 4,
  },
  thumbIcon: { color: Colors.white, fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 13, color: Colors.success, fontWeight: '600' },
  subtitleOff: { marginTop: 6, fontSize: 13, color: Colors.textLight },
});
