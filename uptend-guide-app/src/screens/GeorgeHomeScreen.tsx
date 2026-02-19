import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import ChatBubble, { ChatMessage } from '../components/ChatBubble';
import QuickActions from '../components/QuickActions';
import { showPhotoOptions } from '../components/PhotoCapture';
import { sendGeorgeMessage } from '../services/chat';
import { Colors } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.35;

// Orlando metro area pros (will be replaced with real API data)
const ORLANDO_PROS = [
  { id: '1', name: 'Mike R.', service: 'Handyman', lat: 28.5383, lng: -81.3792, rating: 4.9 },
  { id: '2', name: 'Sarah K.', service: 'Cleaning', lat: 28.4772, lng: -81.4588, rating: 4.8 },
  { id: '3', name: 'James T.', service: 'Pressure Washing', lat: 28.5021, lng: -81.3101, rating: 4.7 },
  { id: '4', name: 'Maria L.', service: 'Landscaping', lat: 28.4186, lng: -81.2987, rating: 5.0 },
  { id: '5', name: 'Carlos D.', service: 'Pool Care', lat: 28.5165, lng: -81.3680, rating: 4.9 },
  { id: '6', name: 'David W.', service: 'Junk Removal', lat: 28.5545, lng: -81.3500, rating: 4.6 },
  { id: '7', name: 'Lisa M.', service: 'Gutter Cleaning', lat: 28.4500, lng: -81.4000, rating: 4.8 },
  { id: '8', name: 'Tony P.', service: 'Moving Labor', lat: 28.5800, lng: -81.2200, rating: 4.7 },
  { id: '9', name: 'Ana G.', service: 'Carpet Cleaning', lat: 28.4300, lng: -81.3400, rating: 4.9 },
  { id: '10', name: 'Robert H.', service: 'Handyman', lat: 28.5100, lng: -81.4200, rating: 4.5 },
];

const ORLANDO_REGION = {
  latitude: 28.5000,
  longitude: -81.3700,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey — I'm George. 🔧\n\nI know basically everything about home repair. What's going on with your home?",
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  '🚀 Need a Pro Now',
  '🏠 Home Health Check',
  '📸 Send a Photo',
  '🔧 Fix It Myself',
];

export default function GeorgeHomeScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const mapHeight = useRef(new Animated.Value(MAP_HEIGHT)).current;

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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToEnd();

    // Collapse map when chatting
    if (mapExpanded) toggleMap();

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await sendGeorgeMessage(text.trim());
      const georgeMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: response.reply || response.response || "I'm here to help! What's going on?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, georgeMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'george',
        type: 'text',
        text: "Having trouble connecting. Try again in a sec.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  };

  const toggleMap = () => {
    const toValue = mapExpanded ? MAP_HEIGHT : SCREEN_HEIGHT * 0.55;
    Animated.spring(mapHeight, { toValue, useNativeDriver: false, friction: 8 }).start();
    setMapExpanded(!mapExpanded);
  };

  const handlePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showPhotoOptions(async (uri: string) => {
      const photoMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        type: 'text',
        text: '📸 Sent a photo for diagnosis',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, photoMsg]);
      setIsTyping(true);
      scrollToEnd();

      try {
        const response = await sendGeorgeMessage('I sent a photo of an issue I need help with');
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'george',
          type: 'text',
          text: response.reply || "Got your photo! Let me take a look...",
          timestamp: new Date(),
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'george',
          type: 'text',
          text: "Got it — let me analyze that for you.",
          timestamp: new Date(),
        }]);
      } finally {
        setIsTyping(false);
        scrollToEnd();
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map Section */}
      <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
        {Platform.OS === 'web' ? (
          <View style={styles.webMapPlaceholder}>
            <Text style={styles.webMapIcon}>🗺️</Text>
            <Text style={styles.webMapTitle}>10 Pros Active Near You</Text>
            <View style={styles.proStats}>
              <View style={styles.statBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.statText}>10 Online</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>⭐ 4.8 Avg</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statText}>~15min Response</Text>
              </View>
            </View>
          </View>
        ) : (
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={PROVIDER_GOOGLE}
            initialRegion={ORLANDO_REGION}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {ORLANDO_PROS.map(pro => (
              <Marker
                key={pro.id}
                coordinate={{ latitude: pro.lat, longitude: pro.lng }}
                title={pro.name}
                description={`${pro.service} • ⭐ ${pro.rating}`}
              />
            ))}
          </MapView>
        )}

        {/* Map overlay - pro count badge */}
        <View style={styles.mapOverlay}>
          <View style={styles.proBadge}>
            <View style={styles.greenDotSmall} />
            <Text style={styles.proBadgeText}>{ORLANDO_PROS.length} Pros Active</Text>
          </View>
        </View>

        {/* Map expand/collapse handle */}
        <TouchableOpacity style={styles.mapHandle} onPress={toggleMap} activeOpacity={0.7}>
          <View style={styles.handleBar} />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Section */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingRow}>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>George is thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickActionBtn}
                onPress={() => sendMessage(action)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickActionText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.cameraBtn} onPress={handlePhoto}>
            <Text style={styles.cameraBtnText}>📷</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="What's going on with your home?"
            placeholderTextColor="#9CA3AF"
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Map
  mapContainer: { position: 'relative', overflow: 'hidden' },
  webMapPlaceholder: {
    flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center',
  },
  webMapIcon: { fontSize: 48, marginBottom: 8 },
  webMapTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  proStats: { flexDirection: 'row', gap: 12 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6,
  },
  statText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  mapOverlay: {
    position: 'absolute', top: 12, left: 12,
  },
  proBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6,
  },
  greenDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  proBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  mapHandle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },

  // Chat
  chatContainer: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  typingRow: { paddingHorizontal: 16, paddingVertical: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, alignSelf: 'flex-start',
  },
  typingText: { color: '#6B7280', fontSize: 13 },

  // Quick Actions
  quickActions: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
    paddingBottom: 8, gap: 8,
  },
  quickActionBtn: {
    backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F97316',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  quickActionText: { color: '#F97316', fontSize: 13, fontWeight: '600' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF', gap: 8,
  },
  cameraBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraBtnText: { fontSize: 18 },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#0F172A',
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F97316',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
