/**
 * @module ChatBubble
 * @description Chat bubble for George AI conversations. Supports user/George styling,
 * markdown-like formatting, clickable links, video embeds, and product cards.
 *
 * @example
 * ```tsx
 * <ChatBubble sender="george" text="Here's what I recommend for your **plumbing** issue:" />
 * <ChatBubble sender="user" text="Thanks George! Can you book that for me?" />
 * <ChatBubble sender="george" text="Check out this video:" videoUrl="https://youtube.com/..." />
 * <ChatBubble sender="george" text="I found this for you:" product={{ title: 'Drain Snake', price: '$24.99', image: '...', url: '...' }} />
 * ```
 */

import React from 'react';
import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  Image,
  useColorScheme,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from './tokens';

export interface ProductCard {
  title: string;
  price: string;
  image?: string;
  url?: string;
}

export interface ChatBubbleProps {
  /** Who sent this message */
  sender: 'user' | 'george';
  /** Message text (supports **bold** and [links](url)) */
  text: string;
  /** Timestamp string */
  time?: string;
  /** Video URL to embed as a tappable card */
  videoUrl?: string;
  /** Product recommendation card */
  product?: ProductCard;
  /** Whether George is currently typing */
  typing?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Simple markdown: **bold** and [link](url) */
function renderText(text: string, textColor: string) {
  // Split into segments: bold, links, and plain text
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={key++} style={{ color: textColor }}>{text.slice(lastIndex, match.index)}</Text>);
    }
    if (match[2]) {
      // Bold
      parts.push(<Text key={key++} style={{ color: textColor, fontWeight: '700' }}>{match[2]}</Text>);
    } else if (match[4] && match[5]) {
      // Link
      parts.push(
        <Text
          key={key++}
          style={{ color: colors.info, textDecorationLine: 'underline' }}
          onPress={() => Linking.openURL(match![5])}
          accessibilityRole="link"
        >
          {match[4]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<Text key={key++} style={{ color: textColor }}>{text.slice(lastIndex)}</Text>);
  }
  return parts;
}

export function ChatBubble({ sender, text, time, videoUrl, product, typing, style }: ChatBubbleProps) {
  const dark = useColorScheme() === 'dark';
  const isGeorge = sender === 'george';

  const bubbleBg = isGeorge
    ? dark ? '#1E293B' : '#F1F5F9'
    : colors.primary;
  const textColor = isGeorge
    ? dark ? colors.textDark : colors.text
    : '#FFFFFF';

  return (
    <View
      style={[
        {
          alignSelf: isGeorge ? 'flex-start' : 'flex-end',
          maxWidth: '80%',
          gap: 6,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${isGeorge ? 'George' : 'You'}: ${text}`}
    >
      <View
        style={{
          backgroundColor: bubbleBg,
          borderRadius: radii.lg,
          borderTopLeftRadius: isGeorge ? 4 : radii.lg,
          borderTopRightRadius: isGeorge ? radii.lg : 4,
          padding: spacing.md,
        }}
      >
        {typing ? (
          <Text style={{ color: textColor, fontSize: 15 }}>●●●</Text>
        ) : (
          <Text style={{ fontSize: 15, lineHeight: 22 }}>{renderText(text, textColor)}</Text>
        )}
      </View>

      {/* Video embed */}
      {videoUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL(videoUrl)}
          activeOpacity={0.8}
          style={{
            backgroundColor: dark ? '#1E293B' : '#F1F5F9',
            borderRadius: radii.md,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
          accessibilityRole="link"
          accessibilityLabel="Watch video"
        >
          <Text style={{ fontSize: 24 }}>🎥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: dark ? colors.textDark : colors.text }}>Watch Video</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{videoUrl}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Product card */}
      {product && (
        <TouchableOpacity
          onPress={() => product.url && Linking.openURL(product.url)}
          activeOpacity={0.8}
          style={{
            backgroundColor: dark ? '#1E293B' : '#F1F5F9',
            borderRadius: radii.md,
            padding: spacing.md,
            flexDirection: 'row',
            gap: 10,
          }}
          accessibilityRole="link"
          accessibilityLabel={`Product: ${product.title}, ${product.price}`}
        >
          {product.image && (
            <Image source={{ uri: product.image }} style={{ width: 48, height: 48, borderRadius: radii.sm }} />
          )}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: dark ? colors.textDark : colors.text }}>{product.title}</Text>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>{product.price}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Timestamp */}
      {time && (
        <Text style={{ fontSize: 10, color: colors.textMuted, alignSelf: isGeorge ? 'flex-start' : 'flex-end' }}>
          {time}
        </Text>
      )}
    </View>
  );
}

export default ChatBubble;
