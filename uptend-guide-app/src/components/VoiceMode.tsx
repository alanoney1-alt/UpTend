import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { guideChat } from '../api/client';
import { Colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function VoiceMode({ visible, onClose }: Props) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const recording = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      waveAnim.stopAnimation();
      waveAnim.setValue(0);
    }
  }, [state]);

  const startListening = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = rec;
      setState('listening');
      setTranscript('');
      setResponse('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.error('Voice start failed:', e);
    }
  };

  const stopListening = async () => {
    if (!recording.current) return;
    setState('processing');

    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      // In production: send audio to speech-to-text API
      // For now, simulate with a placeholder
      const simulatedText = 'How much does pressure washing cost?';
      setTranscript(simulatedText);

      // Send to Mr. George AI
      const res = await guideChat(simulatedText, { voiceMode: true });
      const guideResponse = res.message || res.text || "I'd be happy to help with that!";
      setResponse(guideResponse);

      // Speak the response
      setState('speaking');
      Speech.speak(guideResponse, {
        language: 'en-US',
        rate: 0.95,
        onDone: () => setState('idle'),
        onError: () => setState('idle'),
      });
    } catch {
      setResponse("Sorry, I couldn't process that. Try again.");
      setState('idle');
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setState('idle');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => { Speech.stop(); onClose(); }}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {/* Status */}
        <View style={styles.statusArea}>
          <Text style={styles.statusLabel}>
            {state === 'idle' ? 'Tap to speak' :
             state === 'listening' ? 'Listening...' :
             state === 'processing' ? 'Thinking...' : 'Speaking...'}
          </Text>
          {transcript ? <Text style={styles.transcript}>"{transcript}"</Text> : null}
          {response ? <Text style={styles.response}>{response}</Text> : null}
        </View>

        {/* Mic button */}
        <View style={styles.micArea}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <TouchableOpacity
            style={[
              styles.micBtn,
              state === 'listening' && styles.micBtnActive,
              state === 'speaking' && styles.micBtnSpeaking,
            ]}
            onPress={() => {
              if (state === 'idle') startListening();
              else if (state === 'listening') stopListening();
              else if (state === 'speaking') stopSpeaking();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.micIcon}>
              {state === 'listening' ? '⏹' : state === 'speaking' ? '🔊' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wave visualization */}
        {state === 'listening' && (
          <View style={styles.waves}>
            {[...Array(5)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.wave,
                  {
                    height: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 20 + Math.random() * 40],
                    }),
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        )}

        <Text style={styles.hint}>
          {state === 'idle' ? '"Hey Mr. George, what services do I need?"' : ''}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  closeBtn: {
    position: 'absolute', top: 60, right: 24,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
  statusArea: { alignItems: 'center', marginBottom: 60, minHeight: 120 },
  statusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '600' },
  transcript: { color: Colors.white, fontSize: 16, marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
  response: { color: Colors.white, fontSize: 18, marginTop: 16, textAlign: 'center', lineHeight: 26, maxWidth: 300 },
  micArea: { justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  pulseRing: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(244,124,32,0.2)',
  },
  micBtn: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  micBtnActive: { backgroundColor: Colors.error },
  micBtnSpeaking: { backgroundColor: Colors.success },
  micIcon: { fontSize: 36 },
  waves: { flexDirection: 'row', gap: 8, height: 60, alignItems: 'center' },
  wave: { width: 6, borderRadius: 3, backgroundColor: Colors.primary },
  hint: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', position: 'absolute', bottom: 60 },
});
