/**
 * @module LoadingScreen
 * @description Loading spinners and skeleton screen placeholders.
 *
 * @example
 * ```tsx
 * <LoadingScreen />
 * <LoadingScreen message="Loading your jobs..." />
 * <Skeleton width={200} height={20} />
 * <Skeleton width="100%" height={120} borderRadius={16} />
 * <SkeletonCard />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing } from './tokens';

/* ─── Full Loading Screen ─── */

export interface LoadingScreenProps {
  /** Optional message below spinner */
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export function LoadingScreen({ message, style }: LoadingScreenProps) {
  const dark = useColorScheme() === 'dark';
  return (
    <View
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? colors.backgroundDark : colors.background }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={{ marginTop: 12, fontSize: 15, color: dark ? colors.textMutedDark : colors.textMuted }}>{message}</Text>
      )}
    </View>
  );
}

/* ─── Skeleton Block ─── */

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radii.sm, style }: SkeletonProps) {
  const dark = useColorScheme() === 'dark';
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: dark ? '#334155' : '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  );
}

/* ─── Skeleton Card (common pattern) ─── */

export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ gap: 10, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: '#E2E8F0' }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton width="100%" height={60} borderRadius={radii.md} />
      <Skeleton width="80%" height={14} />
    </View>
  );
}

export default LoadingScreen;
