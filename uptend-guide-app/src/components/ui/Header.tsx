/**
 * @module Header
 * @description Screen header with back button, title, and optional right actions.
 *
 * @example
 * ```tsx
 * <Header title="My Jobs" onBack={() => navigation.goBack()} />
 * <Header title="Settings" rightAction={<TouchableOpacity><Text>Save</Text></TouchableOpacity>} />
 * <Header title="Chat with George" subtitle="Online" onBack={goBack} />
 * ```
 */

import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from './tokens';

export interface HeaderProps {
  /** Screen title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Back button callback — hides back button when undefined */
  onBack?: () => void;
  /** Element(s) rendered on the right side */
  rightAction?: React.ReactNode;
  /** Make background transparent (for overlay headers) */
  transparent?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Header({ title, subtitle, onBack, rightAction, transparent, style }: HeaderProps) {
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const textColor = dark ? colors.textDark : colors.text;

  return (
    <View
      style={[
        {
          paddingTop: insets.top + 4,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: transparent ? 'transparent' : dark ? colors.backgroundDark : colors.background,
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: dark ? colors.borderDark : colors.border,
        },
        style,
      ]}
    >
      {/* Back button */}
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 22, color: textColor }}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}

      {/* Title area */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: textColor }} numberOfLines={1}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>

      {/* Right action */}
      <View style={{ width: 32, alignItems: 'flex-end' }}>
        {rightAction ?? null}
      </View>
    </View>
  );
}

export default Header;
