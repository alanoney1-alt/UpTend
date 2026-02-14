import React, { useState, useRef, useEffect } from 'react';
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
import { guideChat } from '../api/client';
import { Colors } from '../theme/colors';

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Welcome to UpTend! 👋 I'm George, your AI home helper. What's your address?",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  '🏠 Scan my property',
  '🗑 Junk removal quote',
  '🧹 Cleaning estimate',
  '📦 Moving help',
  '🔧 Handyman service',
];

export default function GuideChatScreen() {
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
      const res = await guideChat(text.trim());
      const guideMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: res.type || 'text',
        text: res.message || res.text,
        data: res.data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, guideMsg]);

      // If response includes a quote, add a quote card
      if (res.quote) {
        const quoteMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          sender: 'george',
          type: 'quote',
          data: res.quote,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, quoteMsg]);
      }

      // If response includes property data, add property card
      if (res.property) {
        const propMsg: ChatMessage = {
          id: (Date.now() + 3).toString(),
          sender: 'george',
          type: 'property',
          data: res.property,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, propMsg]);
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
    // TODO: call georgePhotoAnalyze
  };

  const handleVoiceRecording = (uri: string) => {
    // TODO: send to speech-to-text then to guide
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.typingText}>George is thinking...</Text>
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
  flex: { flex: 1 },
  listContent: { paddingTop: 12, paddingBottom: 8 },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
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
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon: { color: Colors.white, fontSize: 20, fontWeight: '700' },
});
