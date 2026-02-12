import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

const MOCK_RESPONSES = [
  "I found 3 lawn care pros available this week. The best rated is Mike with 4.9 stars. Want me to book him?",
  "Your gutters were last cleaned 8 months ago. Based on the tree coverage, I'd recommend scheduling a cleaning. Prices start at $80.",
  "Great news! There's a 20% group discount available for pressure washing in your neighborhood. 2 neighbors already booked.",
];

export default function VoiceMode({ navigation }: any) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(Array.from({ length: 12 }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      // Animate wave bars
      waveAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.3 + Math.random() * 0.7, duration: 200 + i * 50, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 200 + i * 50, useNativeDriver: true }),
          ])
        ).start();
      });
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach(a => a.setValue(0.3));
    }
  }, [state]);

  const handleTap = () => {
    if (state === 'idle') {
      setState('listening');
      setTranscript('');
      setResponse('');
      // Simulate listening → processing → speaking
      setTimeout(() => {
        setTranscript('How much does lawn mowing cost?');
        setState('processing');
        setTimeout(() => {
          setResponse(MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]);
          setState('speaking');
          setTimeout(() => setState('idle'), 4000);
        }, 1500);
      }, 3000);
    } else if (state === 'listening') {
      setState('processing');
    } else {
      setState('idle');
    }
  };

  const stateLabel = { idle: 'Tap to Talk', listening: 'Listening...', processing: 'Thinking...', speaking: 'Bud is speaking...' }[state];
  const stateColor = { idle: Colors.primary, listening: Colors.error, processing: Colors.purple, speaking: Colors.success }[state];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Voice Mode</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Waveform */}
        {(state === 'listening' || state === 'speaking') && (
          <View style={styles.waveContainer}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[styles.waveBar, {
                  backgroundColor: state === 'speaking' ? Colors.success : Colors.primary,
                  transform: [{ scaleY: anim }],
                }]}
              />
            ))}
          </View>
        )}

        {/* Transcript */}
        {transcript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        ) : null}

        {/* Response */}
        {response ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>🤖 Bud:</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        ) : null}

        {/* Processing indicator */}
        {state === 'processing' && (
          <View style={styles.processingDots}>
            {[0, 1, 2].map(i => (
              <Animated.View key={i} style={[styles.dot, { opacity: 0.3 + (i * 0.3) }]} />
            ))}
          </View>
        )}
      </View>

      {/* Main button */}
      <View style={styles.buttonArea}>
        <Text style={[styles.stateLabel, { color: stateColor }]}>{stateLabel}</Text>
        <TouchableOpacity onPress={handleTap} activeOpacity={0.7}>
          <Animated.View style={[styles.mainBtn, { backgroundColor: stateColor, transform: [{ scale: state === 'listening' ? pulseAnim : 1 }] }]}>
            <Text style={styles.mainBtnIcon}>{state === 'listening' ? '🎙️' : state === 'speaking' ? '🔊' : '🎤'}</Text>
          </Animated.View>
        </TouchableOpacity>
        <Text style={styles.hint}>
          {state === 'idle' ? '"Hey Bud, what services do I need?"' : state === 'listening' ? 'Tap again to stop' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.purple },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  backBtn: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  waveContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 60, marginBottom: 30 },
  waveBar: { width: 6, height: 50, borderRadius: 3 },
  transcriptBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, width: '100%', marginBottom: 16 },
  transcriptLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 },
  transcriptText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  responseBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, width: '100%' },
  responseLabel: { color: Colors.primaryLight, fontSize: 12, marginBottom: 4 },
  responseText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  processingDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  buttonArea: { alignItems: 'center', paddingBottom: 60 },
  stateLabel: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  mainBtn: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  mainBtnIcon: { fontSize: 36 },
  hint: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 16, textAlign: 'center', fontStyle: 'italic' },
});
