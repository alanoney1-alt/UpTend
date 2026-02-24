import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ChatBubble, { ChatMessage } from '../components/ChatBubble';
import QuoteCard from '../components/QuoteCard';
import PropertyCard from '../components/PropertyCard';
import InlineVideoPlayer, { extractVideoIds } from '../components/InlineVideoPlayer';
import QuickActions from '../components/QuickActions';
import VoiceInput from '../components/VoiceInput';
import { showPhotoOptions } from '../components/PhotoCapture';
import { sendGeorgeMessage } from '../services/chat';

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey! I'm Mr. George, your UpTend AI concierge. What can I help you with today? 👋",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  '🏠 Home DNA Scan',
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
    // Render inline video players for YouTube URLs in Mr. George's messages
    if (item.sender === 'george' && item.text) {
      const videoIds = extractVideoIds(item.text);
      if (videoIds.length > 0) {
        return (
          <View>
            <ChatBubble message={item} onQuickReply={sendMessage} />
            {videoIds.map((vid) => (
              <View key={vid} style={{ paddingHorizontal: 12 }}>
                <InlineVideoPlayer videoId={vid} />
              </View>
            ))}
          </View>
        );
      }
    }
    return <ChatBubble message={item} onQuickReply={sendMessage} />;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 3, borderBottomColor: '#f97316' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff', letterSpacing: 1 }}>
            George 🏠
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            AI Home Concierge
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            isTyping ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', opacity: 1 }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', opacity: 0.7 }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#f97316', opacity: 0.4 }} />
                </View>
                <Text style={{ fontSize: 13, color: '#9ca3af', marginLeft: 8 }}>Mr. George is typing...</Text>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <QuickActions actions={QUICK_ACTIONS} onPress={sendMessage} />
        )}

        {/* Input bar */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 6 }}>
          <TouchableOpacity
            style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => showPhotoOptions(handlePhoto)}
          >
            <Text style={{ fontSize: 22 }}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#0f172a', maxHeight: 100 }}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Mr. George anything..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />

          <VoiceInput onRecordingComplete={handleVoiceRecording} />

          <TouchableOpacity
            style={{
              width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
              backgroundColor: input.trim() ? '#f97316' : '#e5e7eb',
            }}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '700' }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
