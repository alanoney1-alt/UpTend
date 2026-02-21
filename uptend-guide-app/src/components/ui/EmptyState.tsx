/**
 * @module EmptyState
 * @description Empty state placeholder with icon/illustration, title, description, and CTA.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📭"
 *   title="No Jobs Yet"
 *   description="When you book a service, your jobs will appear here."
 *   ctaLabel="Browse Services"
 *   onCta={() => navigation.navigate('Services')}
 * />
 * ```
 */

import React from 'react';
import { View, Text, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing } from './tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  /** Large emoji or icon element */
  icon?: string | React.ReactNode;
  /** Main title */
  title: string;
  /** Supporting description */
  description?: string;
  /** CTA button label */
  ctaLabel?: string;
  /** CTA button callback */
  onCta?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta, style }: EmptyStateProps) {
  const dark = useColorScheme() === 'dark';
  return (
    <View
      style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: 12 }, style]}
      accessibilityRole="text"
    >
      {icon && (
        typeof icon === 'string'
          ? <Text style={{ fontSize: 56 }}>{icon}</Text>
          : icon
      )}
      <Text style={{ fontSize: 20, fontWeight: '700', color: dark ? colors.textDark : colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      {description && (
        <Text style={{ fontSize: 15, color: dark ? colors.textMutedDark : colors.textMuted, textAlign: 'center', lineHeight: 22 }}>
          {description}
        </Text>
      )}
      {ctaLabel && onCta && (
        <Button variant="primary" onPress={onCta} style={{ marginTop: 8 }}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

export default EmptyState;
