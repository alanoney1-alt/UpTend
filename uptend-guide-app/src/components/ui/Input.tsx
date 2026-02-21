/**
 * @module Input
 * @description Text input with label, helper/error text, icons, and preset variants.
 *
 * @example
 * ```tsx
 * <Input label="Email" variant="email" placeholder="you@example.com" />
 * <Input label="Password" variant="password" error="Must be 8+ characters" />
 * <Input label="Phone" variant="phone" helperText="We'll send a verification code" />
 * <Input label="Address" leftIcon={<Ionicons name="location" />} />
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii } from './tokens';

export type InputVariant = 'default' | 'email' | 'phone' | 'password' | 'address' | 'search' | 'number';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label displayed above the field */
  label?: string;
  /** Helper text displayed below the field */
  helperText?: string;
  /** Error message — shows red styling when present */
  error?: string;
  /** Icon element to render on the left */
  leftIcon?: React.ReactNode;
  /** Icon element to render on the right */
  rightIcon?: React.ReactNode;
  /** Preset variant that configures keyboard type, autoComplete, etc. */
  variant?: InputVariant;
  /** Disabled state */
  disabled?: boolean;
  /** Container style */
  containerStyle?: StyleProp<ViewStyle>;
}

const VARIANT_PROPS: Record<InputVariant, Partial<TextInputProps>> = {
  default: {},
  email: { keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'email', textContentType: 'emailAddress' },
  phone: { keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber' },
  password: { secureTextEntry: true, autoComplete: 'password', textContentType: 'password' },
  address: { autoComplete: 'street-address', textContentType: 'fullStreetAddress', autoCapitalize: 'words' },
  search: { autoCapitalize: 'none', returnKeyType: 'search' },
  number: { keyboardType: 'numeric' },
};

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  disabled = false,
  containerStyle,
  ...rest
}: InputProps) {
  const dark = useColorScheme() === 'dark';
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = variant === 'password';
  const variantProps = VARIANT_PROPS[variant];
  const hasError = !!error;

  const borderColor = hasError
    ? colors.error
    : focused
    ? colors.primary
    : dark
    ? colors.borderDark
    : colors.border;

  const bgColor = disabled
    ? dark ? '#1A2332' : '#F1F5F9'
    : dark ? colors.surfaceDark : colors.background;

  return (
    <View style={[{ gap: 4 }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: hasError ? colors.error : dark ? colors.textDark : colors.text,
            marginBottom: 2,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: radii.md,
          backgroundColor: bgColor,
          paddingHorizontal: 12,
          height: 48,
          gap: 8,
        }}
      >
        {leftIcon && <View style={{ opacity: 0.5 }}>{leftIcon}</View>}
        <TextInput
          editable={!disabled}
          placeholderTextColor={dark ? '#64748B' : '#94A3B8'}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={{
            flex: 1,
            fontSize: 16,
            color: dark ? colors.textDark : colors.text,
            paddingVertical: 0,
          }}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          {...variantProps}
          {...rest}
          secureTextEntry={isPassword && !showPassword ? true : rest.secureTextEntry}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((p) => !p)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={8}
          >
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && <View style={{ opacity: 0.5 }}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text style={{ fontSize: 12, color: hasError ? colors.error : colors.textMuted, marginTop: 2 }}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

export default Input;
