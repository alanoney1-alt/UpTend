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

function renderFormattedText(text: string, isUser: boolean) {
  const lines = text.split('\n');
  return (
    <View>
      {lines.map((line, lineIdx) => {
        const isBullet = /^\s*[-•]\s+/.test(line);
        const cleanLine = isBullet ? line.replace(/^\s*[-•]\s+/, '') : line;
        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
        const spans = parts.map((part, i) => {
          const boldMatch = part.match(/^\*\*(.+)\*\*$/);
          if (boldMatch) {
            return <Text key={i} style={{ fontWeight: '700' }}>{boldMatch[1]}</Text>;
          }
          return <Text key={i}>{part}</Text>;
        });

        return (
          <View key={lineIdx} style={isBullet ? styles.bulletRow : undefined}>
            {isBullet && <Text style={[styles.text, isUser && styles.textUser, { marginRight: 6 }]}>•</Text>}
            <Text style={[styles.text, isUser && styles.textUser, isBullet && { flex: 1 }]}>{spans}</Text>
          </View>
        );
      })}
    </View>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Typing indicator — 3 bouncing dots */
export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      );
    const a1 = animate(dot1, 0); a1.start();
    const a2 = animate(dot2, 140); a2.start();
    const a3 = animate(dot3, 280); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.row}>
      <View style={[styles.bubble, styles.georgeBubble, { paddingVertical: 16, paddingHorizontal: 22 }]}>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

export default function ChatBubble({ message, onQuickReply }: Props) {
  const isUser = message.sender === 'user';
  if (message.type === 'typing') return <TypingIndicator />;

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
        <View>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.georgeBubble]}>
            <Image source={{ uri: message.imageUri }} style={styles.photo} resizeMode="cover" />
            {displayText ? <Text style={[styles.text, isUser && styles.textUser]}>{displayText}</Text> : null}
          </View>
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>{formatTime(message.timestamp)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={styles.bubbleWrapper}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.georgeBubble]}>
          {renderFormattedText(displayText, isUser)}
        </View>
        {buttons.length > 0 && (
          <View style={styles.buttonsRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity key={idx} style={styles.quickReplyBtn} onPress={() => onQuickReply?.(btn.value)} activeOpacity={0.7}>
                <Text style={styles.quickReplyText}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 3,
    paddingHorizontal: 16,
    alignItems: 'flex-end',
  },
  rowUser: { justifyContent: 'flex-end' },
  bubbleWrapper: { maxWidth: '80%' },
  bubble: { borderRadius: 20, padding: 12, paddingHorizontal: 16 },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 6,
  },
  georgeBubble: {
    backgroundColor: Colors.gray100,
    borderBottomLeftRadius: 6,
  },
  text: { fontSize: 16, lineHeight: 22, color: Colors.text, letterSpacing: -0.2 },
  textUser: { color: Colors.white },
  photo: { width: 220, height: 160, borderRadius: 14, marginBottom: 6 },
  timestamp: { fontSize: 11, color: Colors.gray400, marginTop: 4, marginLeft: 4 },
  timestampUser: { textAlign: 'right', marginRight: 4, marginLeft: 0 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.gray400 },
  buttonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  quickReplyBtn: {
    borderWidth: 1.5, borderColor: Colors.gray200, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.white,
  },
  quickReplyText: { fontSize: 14, fontWeight: '600', color: Colors.text },
});
