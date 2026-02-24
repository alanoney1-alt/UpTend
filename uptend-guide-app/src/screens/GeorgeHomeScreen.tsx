import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, Animated, Dimensions,
  StyleSheet, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ChatBubble, { ChatMessage, TypingIndicator } from '../components/ChatBubble';
import { showPhotoOptions } from '../components/PhotoCapture';
import { sendGeorgeMessage } from '../services/chat';
import { Colors } from '../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.38;
const SHEET_MIN = SCREEN_HEIGHT * 0.58;

type NearbyPro = { id: string; name: string; service: string; lat: number; lng: number; rating: number };

const REGION = {
  latitude: 28.4950,
  longitude: -81.3600,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};

const WELCOME: ChatMessage = {
  id: 'welcome',
  sender: 'george',
  type: 'text',
  text: "Hey — I'm Mr. George. 🔧\nWhat's going on with your home?",
  timestamp: new Date(),
};

const ACTIONS = [
  { label: 'Need a Pro', icon: '→', msg: 'I need a pro right now' },
  { label: 'Home DNA Scan', icon: '⊙', msg: 'I want a home health check' },
  { label: 'Send Photo', icon: '◉', msg: '__photo__' },
  { label: 'DIY Help', icon: '⚡', msg: 'I want to fix it myself' },
];

const PRO_COLORS = ['#FF6B35', '#007AFF', '#AF52DE', '#34C759', '#FF9F0A', '#FF3B30', '#5AC8FA', '#FF2D55'];

export default function GeorgeHomeScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedPro, setSelectedPro] = useState<NearbyPro | null>(null);
  const [nearbyPros, setNearbyPros] = useState<NearbyPro[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetch('https://uptendapp.com/api/pros/active-nearby?lat=28.4950&lng=-81.3600&radius=30')
      .then(r => r.json())
      .then(data => {
        const list = (data.pros || []).map((p: any) => ({
          id: p.id, name: `${p.firstName} ${(p.lastName || '').charAt(0)}.`,
          service: (p.serviceTypes || [])[0] || 'Pro',
          lat: p.location?.latitude, lng: p.location?.longitude,
          rating: p.rating,
        }));
        setNearbyPros(list);
      })
      .catch(() => setNearbyPros([]));
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(), sender: 'user', type: 'text',
      text: text.trim(), timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    scrollToEnd();

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const response = await sendGeorgeMessage(text.trim());
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'george', type: 'text',
        text: response.reply || response.response || "I'm here to help! What's going on?",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), sender: 'george', type: 'text',
        text: "Connection issue — try again in a sec.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      scrollToEnd();
    }
  }, []);

  const handlePhoto = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showPhotoOptions(async (uri: string) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), sender: 'user', type: 'text',
        text: '📸 Photo sent', timestamp: new Date(),
      }]);
      setIsTyping(true);
      scrollToEnd();
      try {
        const response = await sendGeorgeMessage('I sent a photo of an issue');
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), sender: 'george', type: 'text',
          text: response.reply || "Let me take a look at that...",
          timestamp: new Date(),
        }]);
      } catch {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), sender: 'george', type: 'text',
          text: "Got it — analyzing now.", timestamp: new Date(),
        }]);
      } finally { setIsTyping(false); scrollToEnd(); }
    });
  }, []);

  const handleAction = useCallback((action: typeof ACTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action.msg === '__photo__') handlePhoto();
    else sendMessage(action.msg);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Map — full bleed behind status bar */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={REGION}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          mapPadding={{ top: insets.top + 50, right: 0, bottom: 40, left: 0 }}
        >
          {nearbyPros.map((pro, i) => (
            <Marker
              key={pro.id}
              coordinate={{ latitude: pro.lat, longitude: pro.lng }}
              onPress={() => setSelectedPro(pro)}
            >
              <View style={[styles.pin, { backgroundColor: PRO_COLORS[i % PRO_COLORS.length] }]}>
                <Text style={styles.pinText}>{pro.name.split(' ')[0][0]}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Gradient overlay at top for status bar readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* Live badge */}
        <View style={[styles.liveBadge, { top: insets.top + 8 }]}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>
            {nearbyPros.length > 0 ? `${nearbyPros.length} pros nearby` : 'Pros coming soon'}
          </Text>
        </View>

        {/* Selected pro card */}
        {selectedPro && (
          <View style={styles.proCard}>
            <View style={styles.proCardLeft}>
              <View style={[styles.proCardAvatar, { backgroundColor: PRO_COLORS[nearbyPros.indexOf(selectedPro) % PRO_COLORS.length] }]}>
                <Text style={styles.proCardInitial}>{selectedPro.name[0]}</Text>
              </View>
              <View>
                <Text style={styles.proCardName}>{selectedPro.name}</Text>
                <Text style={styles.proCardService}>{selectedPro.service} · ⭐ {selectedPro.rating}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.proCardBtn}
              onPress={() => {
                setSelectedPro(null);
                sendMessage(`Book ${selectedPro.name} for ${selectedPro.service}`);
              }}
            >
              <Text style={styles.proCardBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bottom sheet — Chat */}
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          />

          {/* Quick actions — only on first message */}
          {messages.length <= 1 && (
            <View style={styles.actions}>
              {ACTIONS.map((action, i) => (
                <TouchableOpacity key={i} style={styles.actionBtn} onPress={() => handleAction(action)} activeOpacity={0.6}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input bar */}
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <TouchableOpacity style={styles.cameraBtn} onPress={handlePhoto} activeOpacity={0.6}>
              <Text style={styles.cameraIcon}>⬤</Text>
            </TouchableOpacity>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Mr. George anything..."
                placeholderTextColor={Colors.gray400}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage(input)}
                multiline={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.7}
            >
              <Text style={styles.sendArrow}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },

  // Map
  mapContainer: { height: MAP_HEIGHT, position: 'relative' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  liveBadge: {
    position: 'absolute', left: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 24, gap: 8,
  },
  liveIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.live },
  liveText: { color: Colors.white, fontSize: 14, fontWeight: '600', letterSpacing: -0.3 },

  // Map pins
  pin: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  pinText: { color: Colors.white, fontSize: 15, fontWeight: '800' },

  // Pro card
  proCard: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 10,
  },
  proCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proCardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  proCardInitial: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  proCardName: { fontSize: 16, fontWeight: '700', color: Colors.gray900, letterSpacing: -0.3 },
  proCardService: { fontSize: 13, color: Colors.gray500, marginTop: 1 },
  proCardBtn: {
    backgroundColor: Colors.gray900, paddingHorizontal: 22, paddingVertical: 11,
    borderRadius: 24,
  },
  proCardBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Bottom sheet
  sheet: {
    flex: 1, backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    marginTop: -16, // overlap map slightly
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 5, borderRadius: 3, backgroundColor: Colors.gray200 },

  // Messages
  messageList: { paddingTop: 8, paddingBottom: 4 },

  // Quick actions
  actions: {
    flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  actionBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: Colors.gray50, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.gray150,
  },
  actionIcon: { fontSize: 16, color: Colors.gray900, marginBottom: 4 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray900, letterSpacing: -0.2 },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingTop: 8, gap: 8, borderTopWidth: 0.5, borderTopColor: Colors.gray150,
    backgroundColor: Colors.white,
  },
  cameraBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon: { fontSize: 12, color: Colors.gray400 },
  inputWrap: {
    flex: 1, backgroundColor: Colors.gray100, borderRadius: 22,
    paddingHorizontal: 16, justifyContent: 'center', minHeight: 42,
  },
  input: { fontSize: 16, color: Colors.gray900, paddingVertical: 10, letterSpacing: -0.2 },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.gray900,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: Colors.gray200 },
  sendArrow: { color: Colors.white, fontSize: 20, fontWeight: '700', marginTop: -1 },
});
