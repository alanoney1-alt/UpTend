import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export type MessageType = 'text' | 'photo' | 'quote' | 'property' | 'bundle' | 'typing';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'guide' | 'bud' | 'george';
  type: MessageType;
  text?: string;
  imageUri?: string;
  data?: any;
  timestamp: Date;
  buttons?: { label: string; value: string }[];
}

interface Props {
  message: ChatMessage;
  onQuickReply?: (value: string) => void;
}

/** Parse BUTTONS: JSON from end of message text */
function parseButtons(text: string): { cleanText: string; buttons: { label: string; value: string }[] } {
  const match = text.match(/BUTTONS:\s*(\[[\s\S]*\])\s*$/);
  if (!match) return { cleanText: text, buttons: [] };
  try {
    const buttons = JSON.parse(match[1]);
    return { cleanText: text.slice(0, match.index).trim(), buttons };
  } catch {
    return { cleanText: text, buttons: [] };
  }
}

/** Render text with **bold** and bullet list support */
function renderFormattedText(text: string, isUser: boolean) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const isBullet = /^\s*[-•]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[-•]\s+/, '') : line;

    // Split by **bold** markers
    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const spans: React.ReactNode[] = parts.map((part, i) => {
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        return (
          <Text key={i} style={{ fontWeight: '700' }}>
            {boldMatch[1]}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });

    elements.push(
      <View key={lineIdx} style={isBullet ? styles.bulletRow : undefined}>
        {isBullet && (
          <Text style={[styles.bulletDot, isUser && styles.textUser]}>•</Text>
        )}
        <Text style={[styles.text, isUser && styles.textUser, isBullet && styles.bulletText]}>
          {spans}
        </Text>
      </View>,
    );
  });

  return <View>{elements}</View>;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Typing indicator with animated bouncing dots */
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.row]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>🏠</Text>
      </View>
      <View style={[styles.bubble, styles.georgeBubble, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export { TypingIndicator };

export default function ChatBubble({ message, onQuickReply }: Props) {
  const isUser = message.sender === 'user';

  if (message.type === 'typing') {
    return <TypingIndicator />;
  }

  // Parse buttons from text
  let displayText = message.text || '';
  let buttons = message.buttons || [];
  if (!isUser && displayText) {
    const parsed = parseButtons(displayText);
    displayText = parsed.cleanText;
    if (parsed.buttons.length > 0) buttons = parsed.buttons;
  }

  if (message.type === 'photo' && message.imageUri) {
    return (
      <View style={[styles.row, isUser && styles.rowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🏠</Text>
          </View>
        )}
        <View>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.georgeBubble]}>
            <Image source={{ uri: message.imageUri }} style={styles.photo} resizeMode="cover" />
            {displayText ? (
              <Text style={[styles.text, isUser && styles.textUser]}>{displayText}</Text>
            ) : null}
          </View>
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🏠</Text>
        </View>
      )}
      <View style={styles.bubbleWrapper}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.georgeBubble, styles.maxBubble]}>
          {renderFormattedText(displayText, isUser)}
        </View>
        {buttons.length > 0 && (
          <View style={styles.buttonsRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickReplyBtn}
                onPress={() => onQuickReply?.(btn.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickReplyText}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 18, // align with bubble bottom above timestamp
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubbleWrapper: {
    maxWidth: '78%',
  },
  bubble: {
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 14,
  },
  maxBubble: {
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  georgeBubble: {
    backgroundColor: Colors.georgeBubble,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
  textUser: {
    color: Colors.white,
  },
  photo: {
    width: 220,
    height: 160,
    borderRadius: 12,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 3,
    marginLeft: 4,
  },
  timestampUser: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    marginRight: 6,
    width: 12,
  },
  bulletText: {
    flex: 1,
  },
  // Typing indicator
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  // Quick reply buttons
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  quickReplyBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
