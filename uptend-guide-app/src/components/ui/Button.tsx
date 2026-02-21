/**
 * @module Button
 * @description Production-ready button component with variants, sizes, loading & disabled states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onPress={handleSubmit}>Book Now</Button>
 * <Button variant="secondary" size="sm" loading>Processing...</Button>
 * <Button variant="destructive" onPress={handleCancel}>Cancel Job</Button>
 * <Button variant="tertiary" leftIcon={<Ionicons name="arrow-back" />}>Go Back</Button>
 * ```
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
  useColorScheme,
} from 'react-native';
import { colors, radii } from './tokens';
import { lightTap } from '../../utils/haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Button visual style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Disable interaction */
  disabled?: boolean;
  /** Icon element to render before the label */
  leftIcon?: React.ReactNode;
  /** Icon element to render after the label */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Button label */
  children: React.ReactNode;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom text style */
  textStyle?: StyleProp<TextStyle>;
}

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }> = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 14, iconSize: 16 },
  md: { height: 44, paddingHorizontal: 16, fontSize: 16, iconSize: 18 },
  lg: { height: 52, paddingHorizontal: 24, fontSize: 18, iconSize: 20 },
};

function getVariantStyles(variant: ButtonVariant, dark: boolean, disabled: boolean) {
  const opacity = disabled ? 0.5 : 1;
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.primary, opacity } as ViewStyle,
        text: { color: '#FFFFFF', fontWeight: '700' as const } as TextStyle,
        spinnerColor: '#FFFFFF',
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: dark ? colors.primaryLight : colors.primary,
          opacity,
        } as ViewStyle,
        text: { color: dark ? colors.primaryLight : colors.primary, fontWeight: '600' as const } as TextStyle,
        spinnerColor: dark ? colors.primaryLight : colors.primary,
      };
    case 'tertiary':
      return {
        container: { backgroundColor: 'transparent', opacity } as ViewStyle,
        text: { color: dark ? colors.textDark : colors.text, fontWeight: '500' as const } as TextStyle,
        spinnerColor: dark ? colors.textDark : colors.text,
      };
    case 'destructive':
      return {
        container: { backgroundColor: colors.error, opacity } as ViewStyle,
        text: { color: '#FFFFFF', fontWeight: '700' as const } as TextStyle,
        spinnerColor: '#FFFFFF',
      };
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  style,
  textStyle,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const dark = useColorScheme() === 'dark';
  const s = sizeStyles[size];
  const v = getVariantStyles(variant, dark, disabled || loading);
  const label = typeof children === 'string' ? children : accessibilityLabel ?? 'Button';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={typeof label === 'string' ? label : undefined}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.md,
          height: s.height,
          paddingHorizontal: s.paddingHorizontal,
          gap: 8,
        },
        fullWidth && { width: '100%' },
        v.container,
        style,
      ]}
      {...rest}
      onPress={(e) => {
        lightTap();
        rest.onPress?.(e);
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.spinnerColor} />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          {typeof children === 'string' ? (
            <Text style={[{ fontSize: s.fontSize }, v.text, textStyle]}>{children}</Text>
          ) : (
            children
          )}
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;
