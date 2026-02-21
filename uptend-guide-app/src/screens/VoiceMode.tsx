import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, useColorScheme, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../components/ui/tokens';
import { Button } from '../components/ui';
import { request } from '../services/api';

const { width } = Dimensions.get('window');

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const GEORGE_RESPONSES = [
  "Based on your area, lawn mowing typically runs $35-65 per visit for a standard yard. Want me to find you a pro?",
  "I'd recommend scheduling that AC tune-up before summer hits — we're seeing 40% more bookings starting in April!",
  "Great question! For a home that size, pressure washing the driveway usually takes about 2 hours. I can get you a quote.",
  "Your home health score is looking good! Just that gutter cleaning left on your maintenance list.",
];

export default function VoiceMode({ navigation }: any) {
  const dark = useColorScheme() === 'dark';
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 16 }, () => new Animated.Value(0.3))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Request mic permission on mount
  useEffect(() => {
    // In a real app: Audio.requestPermissionsAsync()
    // For now, simulate granted
    setHasPermission(true);
  }, []);

  // Animations
  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      waveAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.3 + Math.random() * 0.7, duration: 150 + i * 40, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.2 + Math.random() * 0.3, duration: 150 + i * 40, useNativeDriver: true }),
          ])
        ).start();
      });
    } else if (state === 'speaking') {
      waveAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.4 + Math.random() * 0.4, duration: 200 + i * 30, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.2, duration: 200 + i * 30, useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach(a => a.setValue(0.3));
    }
  }, [state]);

  // Fade in response
  useEffect(() => {
    if (response) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [response]);

  const handleTap = useCallback(async () => {
    if (state === 'idle') {
      setState('listening');
      setTranscript('');
      setResponse('');

      // Simulate: in production, start audio recording via expo-av
      // Then send to backend: request('POST', '/api/george/voice', formData)
      setTimeout(() => {
        setTranscript('How much does lawn mowing cost in my area?');
        setState('processing');

        // Simulate George response — in production: send transcript to George chat API
        setTimeout(() => {
          const resp = GEORGE_RESPONSES[Math.floor(Math.random() * GEORGE_RESPONSES.length)];
          setResponse(resp);
          setState('speaking');
          // Auto-return to idle after "speaking"
          setTimeout(() => setState('idle'), 5000);
        }, 1500);
      }, 3000);
    } else if (state === 'listening') {
      setState('processing');
    } else {
      setState('idle');
    }
  }, [state]);

  const stateConfig = {
    idle: { label: 'Tap to Talk to George', color: colors.primary, icon: '🎤' },
    listening: { label: 'Listening...', color: '#FF3B30', icon: '🎙️' },
    processing: { label: 'George is thinking...', color: '#5856D6', icon: '🧠' },
    speaking: { label: 'George is speaking...', color: '#34C759', icon: '🔊' },
    error: { label: 'Something went wrong', color: '#FF3B30', icon: '⚠️' },
  }[state];

  const bgGradient = dark ? '#0A0A0A' : '#111';

  return (
    <View style={[styles.container, { backgroundColor: bgGradient }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Voice Mode</Text>
            <View style={[styles.statusDot, { backgroundColor: stateConfig.color }]} />
          </View>
          <View style={{ width: 50 }} />
        </View>

        {/* Waveform area */}
        <View style={styles.waveArea}>
          {(state === 'listening' || state === 'speaking') && (
            <View style={styles.waveContainer}>
              {waveAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: state === 'speaking' ? '#34C759' : colors.primary,
                      transform: [{ scaleY: anim }],
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {state === 'processing' && (
            <View style={styles.processingDots}>
              {[0, 1, 2].map(i => (
                <Animated.View
                  key={i}
                  style={[styles.dot, { opacity: 0.3 + (i * 0.3) }]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Transcript & Response */}
        <View style={styles.textArea}>
          {transcript ? (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>You said:</Text>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>
          ) : null}

          {response ? (
            <Animated.View style={[styles.responseBox, { opacity: fadeAnim }]}>
              <Text style={styles.responseLabel}>🏠 Mr. George:</Text>
              <Text style={styles.responseText}>{response}</Text>
            </Animated.View>
          ) : null}
        </View>

        {/* Main button */}
        <View style={styles.buttonArea}>
          <Text style={[styles.stateLabel, { color: stateConfig.color }]}>{stateConfig.label}</Text>

          <TouchableOpacity
            onPress={handleTap}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={stateConfig.label}
          >
            <Animated.View
              style={[
                styles.mainBtn,
                {
                  backgroundColor: stateConfig.color,
                  transform: [{ scale: state === 'listening' ? pulseAnim : 1 }],
                },
              ]}
            >
              <Text style={styles.mainBtnIcon}>{stateConfig.icon}</Text>
            </Animated.View>
          </TouchableOpacity>

          <Text style={styles.hint}>
            {state === 'idle'
              ? '"Hey George, what services do I need?"'
              : state === 'listening'
              ? 'Tap again to stop'
              : ''}
          </Text>

          {/* Quick suggestions */}
          {state === 'idle' && !response && (
            <View style={styles.suggestions}>
              {['Get a quote', 'What\u2019s due?', 'Find a pro'].map(s => (
                <TouchableOpacity key={s} style={styles.suggestionChip} onPress={handleTap}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Voice coming soon notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>🔬 Voice is in beta — responses are simulated</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtn: { color: '#fff', fontSize: 18, fontWeight: '500' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  waveArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 60 },
  waveBar: { width: 5, height: 50, borderRadius: 3 },
  processingDots: { flexDirection: 'row', gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#5856D6' },
  textArea: { paddingHorizontal: 24, minHeight: 120 },
  transcriptBox: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  transcriptLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 },
  transcriptText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  responseBox: {
    backgroundColor: 'rgba(249,115,22,0.12)', borderRadius: 16, padding: 16, borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  responseLabel: { color: colors.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  responseText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  buttonArea: { alignItems: 'center', paddingVertical: 20 },
  stateLabel: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  mainBtn: {
    width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  mainBtnIcon: { fontSize: 36 },
  hint: {
    color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 14,
    textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 40,
  },
  suggestions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  suggestionText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  notice: { alignItems: 'center', paddingBottom: 8 },
  noticeText: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
});
