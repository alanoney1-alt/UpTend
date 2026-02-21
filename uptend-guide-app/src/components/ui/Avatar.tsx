/**
 * @module Avatar
 * @description User avatar with image, fallback initials, online indicator, and size variants.
 *
 * @example
 * ```tsx
 * <Avatar source={{ uri: 'https://...' }} name="John Doe" size="lg" online />
 * <Avatar name="Jane Smith" size="md" />  // Shows "JS" initials
 * <Avatar size="sm" />  // Shows default icon
 * ```
 */

import React, { useState } from 'react';
import { View, Image, Text, useColorScheme, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii } from './tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source */
  source?: ImageSourcePropType;
  /** User name — used to generate initials fallback */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Show green online indicator dot */
  online?: boolean;
  /** Custom border color */
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<AvatarSize, { dim: number; fontSize: number; dotSize: number }> = {
  xs: { dim: 24, fontSize: 10, dotSize: 6 },
  sm: { dim: 32, fontSize: 12, dotSize: 8 },
  md: { dim: 40, fontSize: 14, dotSize: 10 },
  lg: { dim: 56, fontSize: 20, dotSize: 12 },
  xl: { dim: 80, fontSize: 28, dotSize: 16 },
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

/** Deterministic color from name string */
function nameColor(name?: string): string {
  const palette = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#14B8A6'];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function Avatar({ source, name, size = 'md', online, borderColor, style }: AvatarProps) {
  const dark = useColorScheme() === 'dark';
  const s = SIZES[size];
  const [imgError, setImgError] = useState(false);
  const showImage = source && !imgError;

  return (
    <View
      style={[{ width: s.dim, height: s.dim, position: 'relative' }, style]}
      accessibilityRole="image"
      accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
    >
      {showImage ? (
        <Image
          source={source}
          onError={() => setImgError(true)}
          style={{
            width: s.dim,
            height: s.dim,
            borderRadius: s.dim / 2,
            borderWidth: borderColor ? 2 : 0,
            borderColor,
          }}
        />
      ) : (
        <View
          style={{
            width: s.dim,
            height: s.dim,
            borderRadius: s.dim / 2,
            backgroundColor: nameColor(name),
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: borderColor ? 2 : 0,
            borderColor,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: s.fontSize, fontWeight: '700' }}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {online && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: s.dotSize,
            height: s.dotSize,
            borderRadius: s.dotSize / 2,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: dark ? colors.backgroundDark : colors.background,
          }}
        />
      )}
    </View>
  );
}

export default Avatar;
