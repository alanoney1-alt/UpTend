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
    // Render inline video players for YouTube URLs in George's messages
    if (item.sender === 'george' && item.text) {
      const videoIds = extractVideoIds(item.text);
      if (videoIds.length > 0) {
        return (
          <View>
            <ChatBubble message={item} />
            {videoIds.map((vid) => (
              <View key={vid} style={{ paddingHorizontal: 12 }}>
                <InlineVideoPlayer videoId={vid} />
              </View>
            ))}
          </View>
        );
      }
    }
    return <ChatBubble message={item} />;
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="bg-slate-800 px-5 py-4 border-b-[3px] border-orange-500">
        <View className="items-center">
          <Text className="text-[22px] font-extrabold text-white tracking-wide">
            George 🏠
          </Text>
          <Text className="text-xs font-semibold text-white/70 mt-0.5">
            AI Home Concierge
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
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
              <View className="flex-row items-center px-4 py-2">
                <View className="flex-row gap-1">
                  <View className="w-2 h-2 rounded-full bg-orange-500 opacity-100" />
                  <View className="w-2 h-2 rounded-full bg-orange-500 opacity-70" />
                  <View className="w-2 h-2 rounded-full bg-orange-500 opacity-40" />
                </View>
                <Text className="text-[13px] text-gray-400 ml-2">George is typing...</Text>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <QuickActions actions={QUICK_ACTIONS} onPress={sendMessage} />
        )}

        {/* Input bar */}
        <View className="flex-row items-end px-2 py-2 bg-white border-t border-gray-100 gap-1.5">
          <TouchableOpacity
            className="w-11 h-11 justify-center items-center"
            onPress={() => showPhotoOptions(handlePhoto)}
          >
            <Text className="text-[22px]">📎</Text>
          </TouchableOpacity>

          <TextInput
            className="flex-1 bg-gray-50 rounded-[20px] px-4 py-2.5 text-base text-slate-900 max-h-[100px]"
            value={input}
            onChangeText={setInput}
            placeholder="Ask George anything..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={2000}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />

          <VoiceInput onRecordingComplete={handleVoiceRecording} />

          <TouchableOpacity
            className={`w-10 h-10 rounded-full justify-center items-center ${
              input.trim() ? 'bg-orange-500 shadow-orange-500/40' : 'bg-gray-200'
            }`}
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            activeOpacity={0.7}
          >
            <Text className="text-white text-xl font-bold">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
