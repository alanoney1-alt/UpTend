import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ChatBubble, { ChatMessage } from '../components/ChatBubble';
import QuoteCard from '../components/QuoteCard';
import PropertyCard from '../components/PropertyCard';
import QuickActions from '../components/QuickActions';
import VoiceInput from '../components/VoiceInput';
import { showPhotoOptions } from '../components/PhotoCapture';
import { sendGeorgeMessage } from '../services/chat';
import { Colors } from '../theme/colors';

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey! I'm George, your UpTend AI concierge. What can I help you with today? 👋",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  '🏠 AI Home Scan',
  '🗑 Junk Removal Quote',
  '🧹 Home Cleaning',
  '📦 Moving Help',
  '🔧 Handyman Service',
];

export default function GeorgeChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToEnd();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await sendGeorgeMessage(text.trim());
      const georgeMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: res.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, georgeMsg]);

      // Handle tool results if present (e.g., pricing, bookings)
      if (res.toolResults && res.toolResults.length > 0) {
        res.toolResults.forEach((tool: any, idx: number) => {
          if (tool.type === 'quote' || tool.pricing) {
            const quoteMsg: ChatMessage = {
              id: (Date.now() + idx + 2).toString(),
              sender: 'george',
              type: 'quote',
              data: tool.pricing || tool,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, quoteMsg]);
          }
        });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'george',
          type: 'text',
          text: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  };

  const handlePhoto = (uri: string) => {
    const photoMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'photo',
      imageUri: uri,
      text: 'Sent a photo',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, photoMsg]);
    scrollToEnd();
  };

  const handleVoiceRecording = (_uri: string) => {
    sendMessage('[Voice message recorded]');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.type === 'quote' && item.data) {
      return (
        <QuoteCard
          service={item.data.service}
          price={item.data.price}
          address={item.data.address}
          description={item.data.description}
          onBookNow={() => sendMessage(`Book ${item.data.service}`)}
        />
      );
    }
    if (item.type === 'property' && item.data) {
      return (
        <PropertyCard
          address={item.data.address}
          sqft={item.data.sqft}
          bedrooms={item.data.bedrooms}
          bathrooms={item.data.bathrooms}
          yearBuilt={item.data.yearBuilt}
          lotSize={item.data.lotSize}
          homeScore={item.data.homeScore}
        />
      );
    }
    return <ChatBubble message={item} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>George 🏠</Text>
          <Text style={styles.headerSubtitle}>AI Home Concierge</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingRow}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
                <Text style={styles.typingText}>George is typing...</Text>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <QuickActions actions={QUICK_ACTIONS} onPress={sendMessage} />
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => showPhotoOptions(handlePhoto)}>
            <Text style={styles.iconText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask George anything..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={2000}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <VoiceInput onRecordingComplete={handleVoiceRecording} />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: '#2D2640',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 2,
  },
  flex: { flex: 1 },
  listContent: { paddingTop: 12, paddingBottom: 8 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  typingDot1: { animationDelay: '0s' },
  typingDot2: { animationDelay: '0.2s' },
  typingDot3: { animationDelay: '0.4s' },
  typingText: { fontSize: 13, color: Colors.textLight, marginLeft: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  input: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.border, shadowOpacity: 0 },
  sendIcon: { color: Colors.white, fontSize: 20, fontWeight: '700' },
});
