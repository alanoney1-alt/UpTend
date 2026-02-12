import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

export type MessageType = 'text' | 'photo' | 'quote' | 'property' | 'bundle' | 'typing';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'guide' | 'bud';
  type: MessageType;
  text?: string;
  imageUri?: string;
  data?: any;
  timestamp: Date;
}

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.sender === 'user';
  // 'bud' and 'guide' both render as assistant bubble

  if (message.type === 'typing') {
    return (
      <View style={[styles.bubble, styles.budBubble, { paddingHorizontal: 20 }]}>  
        <Text style={styles.typingDots}>● ● ●</Text>
      </View>
    );
  }

  if (message.type === 'photo' && message.imageUri) {
    return (
      <View style={[styles.row, isUser && styles.rowUser]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.budBubble]}>
          <Image source={{ uri: message.imageUri }} style={styles.photo} resizeMode="cover" />
          {message.text ? (
            <Text style={[styles.text, isUser && styles.textUser]}>{message.text}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.budBubble, { maxWidth: '80%' }]}>
        <Text style={[styles.text, isUser && styles.textUser]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, marginHorizontal: 12 },
  rowUser: { justifyContent: 'flex-end' },
  bubble: { borderRadius: 20, padding: 14, maxWidth: '80%' },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 4,
  },
  budBubble: {
    backgroundColor: Colors.budBubble,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: 16, lineHeight: 22, color: Colors.text },
  textUser: { color: Colors.white },
  photo: { width: 220, height: 160, borderRadius: 12, marginBottom: 6 },
  typingDots: { fontSize: 18, color: Colors.textLight, letterSpacing: 4 },
});
