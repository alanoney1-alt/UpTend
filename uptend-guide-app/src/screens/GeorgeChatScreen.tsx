import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, KeyboardAvoidingView,
  Platform, Linking, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChatBubble, Button, Header, LoadingScreen, Avatar } from '../components/ui';
import { colors, spacing, radii } from '../components/ui/tokens';
import QuoteCard from '../components/QuoteCard';
import PropertyCard from '../components/PropertyCard';
import InlineVideoPlayer, { extractVideoIds } from '../components/InlineVideoPlayer';
import QuickActions from '../components/QuickActions';
import VoiceInput from '../components/VoiceInput';
import { showPhotoOptions } from '../components/PhotoCapture';
import { Input } from '../components/ui';
import { sendGeorgeMessage } from '../services/chat';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'george';
  type: 'text' | 'photo' | 'quote' | 'property' | 'product' | 'actions';
  text?: string;
  imageUri?: string;
  data?: any;
  timestamp: Date;
}

const WELCOME: Message = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey! I'm Mr. George, your UpTend AI concierge. What can I help you with today? 👋",
  timestamp: new Date(),
};

const QUICK_ACTIONS = ['📋 Book a Pro', '🔧 DIY Help', '💰 Get a Quote'];

export default function GeorgeChatScreen() {
  const dark = useColorScheme() === 'dark';
  const { user, role, guestSessionId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => user?.id || guestSessionId || `session_${Date.now()}`);
  const flatListRef = useRef<FlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
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
      const georgeMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: responseText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, georgeMsg]);

      // Handle inline products
      if (res.products && res.products.length > 0) {
        res.products.forEach((product: any, idx: number) => {
          const productMsg: Message = {
            id: (Date.now() + idx + 10).toString(),
            sender: 'george',
            type: 'product',
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
            setMessages(prev => [...prev, {
              id: (Date.now() + idx + 100).toString(),
              sender: 'george',
              type: 'quote',
              data: tool.pricing || tool,
              timestamp: new Date(),
            }]);
          }
          if (tool.type === 'property' || tool.property) {
            setMessages(prev => [...prev, {
              id: (Date.now() + idx + 200).toString(),
              sender: 'george',
              type: 'property',
              data: tool.property || tool,
              timestamp: new Date(),
            }]);
          }
        });
      }

      // Handle quick actions from API
      if (res.quickActions && res.quickActions.length > 0) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 300).toString(),
          sender: 'george',
          type: 'actions',
          data: res.quickActions,
          text: '',
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  }, [sessionId, role, scrollToEnd]);

  const handlePhoto = useCallback((uri: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'user',
      type: 'photo',
      imageUri: uri,
      text: 'Sent a photo',
      timestamp: new Date(),
    }]);
    scrollToEnd();
  }, [scrollToEnd]);

  const handleVoiceRecording = useCallback((_uri: string) => {
    sendMessage('[Voice message recorded]');
  }, [sendMessage]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
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
    // Product card — uses Linking.openURL for "Buy Now"
    if (item.type === 'product' && item.data) {
      const p = item.data;
      return (
        <View style={{ marginHorizontal: spacing.md, marginVertical: spacing.xs }}>
          <ChatBubble
            sender="george"
            text={`**${p.name || p.title}**${p.description ? '\n' + p.description : ''}`}
            product={{
              title: p.name || p.title,
              price: p.price || '',
              image: p.image || p.imageUrl,
              url: p.url || p.affiliateUrl || p.link,
            }}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, paddingHorizontal: spacing.sm }}>
            {(p.url || p.affiliateUrl || p.link) && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onPress={() => Linking.openURL(p.url || p.affiliateUrl || p.link)}
                accessibilityLabel={`Buy ${p.name || p.title}`}
              >
                Buy Now
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onPress={() => sendMessage(`Tell me more about ${p.name || p.title}`)}
              accessibilityLabel={`Learn more about ${p.name || p.title}`}
            >
              Learn More
            </Button>
          </View>
        </View>
      );
    }
    // Quick actions from API
    if (item.type === 'actions' && item.data) {
      return <QuickActions actions={item.data} onPress={sendMessage} />;
    }
    // Render inline video players for YouTube URLs
    if (item.sender === 'george' && item.text) {
      const videoIds = extractVideoIds(item.text);
      if (videoIds.length > 0) {
        return (
          <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.xs }}>
            <ChatBubble sender="george" text={item.text} />
            {videoIds.map(vid => (
              <View key={vid} style={{ marginTop: spacing.xs }}>
                <InlineVideoPlayer videoId={vid} />
              </View>
            ))}
          </View>
        );
      }
    }
    // Standard message — use new UI ChatBubble
    return (
      <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.xs }}>
        <ChatBubble
          sender={item.sender === 'george' ? 'george' : 'user'}
          text={item.text || ''}
          time={item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />
      </View>
    );
  }, [sendMessage]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: dark ? colors.backgroundDark : colors.background }}
      edges={['top', 'bottom']}
    >
      <Header
        title="George 🏠"
        subtitle="AI Home Concierge"
      />

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
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.sm }}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            isTyping ? (
              <View style={{ paddingHorizontal: spacing.md, marginVertical: spacing.xs }}>
                <ChatBubble sender="george" text="" typing />
              </View>
            ) : null
          }
        />

        {/* Quick action chips — shown when conversation just started */}
        {messages.length === 1 && (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          }}>
            {QUICK_ACTIONS.map(action => (
              <Button
                key={action}
                variant="secondary"
                size="sm"
                onPress={() => sendMessage(action)}
                accessibilityLabel={action}
              >
                {action}
              </Button>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          backgroundColor: dark ? colors.backgroundDark : colors.background,
          borderTopWidth: 1,
          borderTopColor: dark ? colors.borderDark : colors.border,
          gap: spacing.xs,
        }}>
          <Button
            variant="tertiary"
            size="sm"
            onPress={() => showPhotoOptions(handlePhoto)}
            accessibilityLabel="Attach photo"
          >
            📎
          </Button>

          <View style={{ flex: 1 }}>
            <Input
              placeholder="Ask Mr. George anything..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline
              containerStyle={{ marginBottom: 0 }}
              accessibilityLabel="Message input"
            />
          </View>

          <VoiceInput onRecordingComplete={handleVoiceRecording} />

          <Button
            variant="primary"
            size="sm"
            onPress={() => sendMessage(input)}
            disabled={!input.trim()}
            accessibilityLabel="Send message"
            style={{ borderRadius: radii.full, width: 40, height: 40, paddingHorizontal: 0 }}
          >
            ↑
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
