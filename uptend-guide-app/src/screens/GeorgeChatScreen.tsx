import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator, Linking,
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
import { useAuth } from '../context/AuthContext';

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey! I'm Mr. George, your UpTend AI concierge. What can I help you with today? 👋",
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
  const { user, role, guestSessionId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => user?.id || guestSessionId || `session_${Date.now()}`);
  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToEnd();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await sendGeorgeMessage(text.trim(), {
        sessionId,
        page: 'mobile-chat',
        userRole: role || 'customer',
      });

      const responseText = res.response || res.reply || res.message || res.text || "I'm here to help!";
      const georgeMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, georgeMsg]);

      // Handle inline products from response
      if (res.products && res.products.length > 0) {
        res.products.forEach((product: any, idx: number) => {
          const productMsg: ChatMessage = {
            id: (Date.now() + idx + 10).toString(),
            sender: 'george',
            type: 'product' as any,
            data: product,
            text: `📦 ${product.name || product.title} — ${product.price || ''}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, productMsg]);
        });
      }

      // Handle tool results (quotes, property data)
      if (res.toolResults && res.toolResults.length > 0) {
        res.toolResults.forEach((tool: any, idx: number) => {
          if (tool.type === 'quote' || tool.pricing) {
            const quoteMsg: ChatMessage = {
              id: (Date.now() + idx + 100).toString(),
              sender: 'george',
              type: 'quote',
              data: tool.pricing || tool,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, quoteMsg]);
          }
          if (tool.type === 'property' || tool.property) {
            const propMsg: ChatMessage = {
              id: (Date.now() + idx + 200).toString(),
              sender: 'george',
              type: 'property',
              data: tool.property || tool,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, propMsg]);
          }
        });
      }

      // Handle quick actions from API
      if (res.quickActions && res.quickActions.length > 0) {
        const actionsMsg: ChatMessage = {
          id: (Date.now() + 300).toString(),
          sender: 'george',
          type: 'actions' as any,
          data: res.quickActions,
          text: '',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, actionsMsg]);
      }
    } catch (err: any) {
      setMessages(prev => [
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
  }, [sessionId, role]);

  const handlePhoto = useCallback((uri: string) => {
    const photoMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'photo',
      imageUri: uri,
      text: 'Sent a photo',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, photoMsg]);
    scrollToEnd();
  }, []);

  const handleVoiceRecording = useCallback((_uri: string) => {
    sendMessage('[Voice message recorded]');
  }, [sendMessage]);

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    // Quote card
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
    // Property card
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
    // Inline product card (don't open externally)
    if ((item.type as string) === 'product' && item.data) {
      const p = item.data;
      return (
        <View style={{ marginHorizontal: 12, marginVertical: 6, backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>{p.name || p.title}</Text>
          {p.description && <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{p.description}</Text>}
          {p.price && <Text style={{ fontSize: 18, fontWeight: '800', color: '#f97316', marginTop: 6 }}>{p.price}</Text>}
          {p.features && (
            <View style={{ marginTop: 8 }}>
              {(Array.isArray(p.features) ? p.features : []).map((f: string, i: number) => (
                <Text key={i} style={{ fontSize: 12, color: '#64748b' }}>• {f}</Text>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {(p.url || p.affiliateUrl || p.link) && (
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#f97316', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
                onPress={() => Linking.openURL(p.url || p.affiliateUrl || p.link)}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Buy Now</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: !(p.url || p.affiliateUrl || p.link) ? '#f97316' : '#f1f5f9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
              onPress={() => sendMessage(`Tell me more about ${p.name || p.title}`)}
            >
              <Text style={{ color: !(p.url || p.affiliateUrl || p.link) ? '#fff' : '#475569', fontWeight: '700' }}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // Quick actions from API
    if ((item.type as string) === 'actions' && item.data) {
      return (
        <QuickActions actions={item.data} onPress={sendMessage} />
      );
    }
    // Render inline video players for YouTube URLs
    if (item.sender === 'george' && item.text) {
      const videoIds = extractVideoIds(item.text);
      if (videoIds.length > 0) {
        return (
          <View>
            <ChatBubble message={item} onQuickReply={sendMessage} />
            {videoIds.map(vid => (
              <View key={vid} style={{ paddingHorizontal: 12 }}>
                <InlineVideoPlayer videoId={vid} />
              </View>
            ))}
          </View>
        );
      }
    }
    return <ChatBubble message={item} onQuickReply={sendMessage} />;
  }, [sendMessage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
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
          keyExtractor={m => m.id}
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
