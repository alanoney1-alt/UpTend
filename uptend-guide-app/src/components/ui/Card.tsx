/**
 * @module Card
 * @description Base card + domain-specific variants: ServiceCard, ProCard, JobCard.
 *
 * @example
 * ```tsx
 * <Card><Text>Any content</Text></Card>
 * <ServiceCard icon="🔧" title="Plumbing" price="$49" onBook={handleBook} />
 * <ProCard name="Mike R." rating={4.8} specialties={['Plumbing','HVAC']} avatar={{ uri: '...' }} />
 * <JobCard status="active" serviceType="Lawn Care" date="Feb 21, 2026" address="123 Main St" />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  useColorScheme,
  type ViewStyle,
  type StyleProp,
  type ImageSourcePropType,
} from 'react-native';
import { colors, radii, spacing } from './tokens';
import { Badge, type BadgeStatus } from './Badge';
import { Avatar } from './Avatar';
import { Button } from './Button';

/* ─── Base Card ─── */

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Remove default padding */
  noPadding?: boolean;
}

export function Card({ children, style, onPress, noPadding }: CardProps) {
  const dark = useColorScheme() === 'dark';
  const containerStyle: ViewStyle = {
    backgroundColor: dark ? colors.surfaceDark : colors.background,
    borderRadius: radii.lg,
    padding: noPadding ? 0 : spacing.lg,
    borderWidth: 1,
    borderColor: dark ? colors.borderDark : colors.border,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: dark ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[containerStyle, style]} accessibilityRole="button">
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[containerStyle, style]}>{children}</View>;
}

/* ─── ServiceCard ─── */

export interface ServiceCardProps {
  /** Emoji or icon string */
  icon: string;
  title: string;
  /** Price display string, e.g. "$49" or "From $29" */
  price: string;
  /** Book callback */
  onBook?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ServiceCard({ icon, title, price, onBook, style }: ServiceCardProps) {
  const dark = useColorScheme() === 'dark';
  return (
    <Card style={[{ gap: 12 }, style]}>
      <Text style={{ fontSize: 32 }}>{icon}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? colors.textDark : colors.text }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '600' }}>{price}</Text>
      {onBook && (
        <Button size="sm" onPress={onBook} accessibilityLabel={`Book ${title}`}>
          Book Now
        </Button>
      )}
    </Card>
  );
}

/* ─── ProCard ─── */

export interface ProCardProps {
  name: string;
  rating: number;
  specialties: string[];
  avatar?: ImageSourcePropType;
  online?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ProCard({ name, rating, specialties, avatar, online, onPress, style }: ProCardProps) {
  const dark = useColorScheme() === 'dark';
  return (
    <Card onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      <Avatar source={avatar} name={name} size="lg" online={online} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: dark ? colors.textDark : colors.text }}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 14, color: colors.primary }}>★ {rating.toFixed(1)}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
          {specialties.map((s) => (
            <Badge key={s} variant="custom" color={dark ? '#334155' : '#F1F5F9'} textColor={dark ? '#CBD5E1' : '#475569'} label={s} size="sm" />
          ))}
        </View>
      </View>
    </Card>
  );
}

/* ─── JobCard ─── */

export interface JobCardProps {
  status: BadgeStatus;
  serviceType: string;
  date: string;
  address: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function JobCard({ status, serviceType, date, address, onPress, style }: JobCardProps) {
  const dark = useColorScheme() === 'dark';
  const textColor = dark ? colors.textDark : colors.text;
  const mutedColor = dark ? colors.textMutedDark : colors.textMuted;

  return (
    <Card onPress={onPress} style={[{ gap: 8 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{serviceType}</Text>
        <Badge status={status} size="sm" />
      </View>
      <Text style={{ fontSize: 13, color: mutedColor }}>📅 {date}</Text>
      <Text style={{ fontSize: 13, color: mutedColor }} numberOfLines={1}>📍 {address}</Text>
    </Card>
  );
}

export default Card;
