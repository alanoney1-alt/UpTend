/**
 * @module Badge
 * @description Status badges with semantic colors for job/booking states.
 *
 * @example
 * ```tsx
 * <Badge status="active" />
 * <Badge status="pending" label="Awaiting Confirmation" />
 * <Badge status="completed" size="lg" />
 * <Badge variant="custom" color="#8B5CF6" label="VIP" />
 * ```
 */

import React from 'react';
import { View, Text, useColorScheme, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radii } from './tokens';

export type BadgeStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'scheduled' | 'in_progress' | 'error' | 'success' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Preset status — auto-maps to color and label */
  status?: BadgeStatus;
  /** Override the display label */
  label?: string;
  /** Badge size */
  size?: BadgeSize;
  /** Use 'custom' variant with a custom color */
  variant?: 'status' | 'custom';
  /** Custom background color (for variant="custom") */
  color?: string;
  /** Custom text color */
  textColor?: string;
  /** Show a small dot indicator instead of text */
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const STATUS_CONFIG: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  active: { bg: '#D1FAE5', text: '#065F46', label: 'Active' },
  completed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
  scheduled: { bg: '#E0E7FF', text: '#3730A3', label: 'Scheduled' },
  in_progress: { bg: '#FDE68A', text: '#78350F', label: 'In Progress' },
  error: { bg: '#FEE2E2', text: '#991B1B', label: 'Error' },
  success: { bg: '#D1FAE5', text: '#065F46', label: 'Success' },
  warning: { bg: '#FEF3C7', text: '#92400E', label: 'Warning' },
  info: { bg: '#DBEAFE', text: '#1E40AF', label: 'Info' },
};

const SIZE_STYLES: Record<BadgeSize, { px: number; py: number; fontSize: number }> = {
  sm: { px: 6, py: 2, fontSize: 10 },
  md: { px: 8, py: 4, fontSize: 12 },
  lg: { px: 12, py: 6, fontSize: 14 },
};

export function Badge({
  status = 'pending',
  label,
  size = 'md',
  variant = 'status',
  color,
  textColor,
  dot = false,
  style,
  children,
}: BadgeProps) {
  const config = STATUS_CONFIG[status];
  const bg = variant === 'custom' && color ? color : config.bg;
  const fg = textColor ?? config.text;
  const displayLabel = label ?? config.label;
  const s = SIZE_STYLES[size];

  if (dot) {
    return (
      <View
        style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: variant === 'custom' && color ? color : fg }, style]}
        accessibilityLabel={displayLabel}
      />
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radii.full,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          alignSelf: 'flex-start',
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${displayLabel}`}
    >
      <Text style={{ color: fg, fontSize: s.fontSize, fontWeight: '600' }}>{children ?? displayLabel}</Text>
    </View>
  );
}

export default Badge;
